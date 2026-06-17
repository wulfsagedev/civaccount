#!/usr/bin/env node
/**
 * wayback-backfill.mjs — give every cited source URL a preserved fallback.
 *
 * Problem this solves (NORTH-STAR §3 Tier 4 mandate): when a council
 * reorganises its website, a "live page" citation 404s and the reader loses
 * the evidence path. Only ~19 field_sources carried a wayback_url before
 * this script existed; the rest had no fallback at all.
 *
 * What it does:
 *   1. Scans the five council data files for every `field_sources` URL
 *      (plus the national source URLs in src/data/provenance.ts).
 *   2. Asks the Internet Archive's availability API for the closest
 *      existing snapshot of each (read-only, no archiving triggered).
 *   3. Writes src/data/wayback-fallbacks.json — a { url → snapshot } map
 *      the UI uses to render an "Archived copy" link on every popover and
 *      provenance entry whose source has a snapshot.
 *   4. Writes scripts/validate/reports/wayback-misses.json — URLs with NO
 *      snapshot, so rollouts/monthly freshness can Save-Page-Now them.
 *
 * Modes:
 *   node scripts/wayback-backfill.mjs            # availability sweep (default)
 *   node scripts/wayback-backfill.mjs --save     # also SPN the misses (capped)
 *   node scripts/wayback-backfill.mjs --save --save-cap=25
 *
 * The availability sweep is idempotent and safe to re-run monthly; existing
 * entries are kept unless a fresh lookup finds a snapshot (we never delete).
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const DATA_DIR = join(ROOT, 'src', 'data', 'councils');
const SIDECAR = join(ROOT, 'src', 'data', 'wayback-fallbacks.json');
const MISSES_REPORT = join(ROOT, 'scripts', 'validate', 'reports', 'wayback-misses.json');

const SAVE_MODE = process.argv.includes('--save');
const SAVE_CAP = Number((process.argv.find(a => a.startsWith('--save-cap=')) ?? '').split('=')[1] || 10);

const COUNCIL_FILES = [
  'county-councils.ts',
  'districts.ts',
  'metropolitan.ts',
  'unitary.ts',
  'london-boroughs.ts',
];

/** Extract the body of every `field_sources: { … }` block via brace matching. */
function extractFieldSourceBlocks(src) {
  const blocks = [];
  let idx = 0;
  for (;;) {
    const start = src.indexOf('field_sources: {', idx);
    if (start === -1) break;
    let depth = 0;
    let i = src.indexOf('{', start);
    const blockStart = i;
    for (; i < src.length; i++) {
      if (src[i] === '{') depth++;
      else if (src[i] === '}') {
        depth--;
        if (depth === 0) break;
      }
    }
    blocks.push(src.slice(blockStart, i + 1));
    idx = i + 1;
  }
  return blocks;
}

function collectUrls() {
  const urls = new Set();

  for (const file of COUNCIL_FILES) {
    const path = join(DATA_DIR, file);
    if (!existsSync(path)) continue;
    const src = readFileSync(path, 'utf-8');
    for (const block of extractFieldSourceBlocks(src)) {
      for (const m of block.matchAll(/(?<!wayback_)url:\s*"(https?:\/\/[^"]+)"/g)) {
        urls.add(m[1].split('#')[0]);
      }
    }
  }

  // National sources from FIELD_PROVENANCE (src/data/provenance.ts).
  const provPath = join(ROOT, 'src', 'data', 'provenance.ts');
  if (existsSync(provPath)) {
    const src = readFileSync(provPath, 'utf-8');
    for (const m of src.matchAll(/source_url:\s*'(https?:\/\/[^']+)'/g)) {
      urls.add(m[1].split('#')[0]);
    }
  }

  // Some field_sources cite a Wayback URL directly (councils whose sites
  // block automated fetches were rolled out via the archive). Those are
  // already preserved — nothing to back up.
  return [...urls].filter(u => !/^https?:\/\/web\.archive\.org\//.test(u)).sort();
}

async function fetchWithTimeout(url, ms = 15000, init = {}) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, { ...init, signal: ctrl.signal });
  } finally {
    clearTimeout(t);
  }
}

/**
 * Closest existing snapshot for a URL. Read-only API.
 * Returns { status: 'hit', snapshot } | { status: 'miss' } | { status: 'unknown' }.
 * 'unknown' = rate-limited or network failure — NOT evidence of a missing
 * snapshot, so it's reported separately and re-tried on the next run.
 */
async function availability(url) {
  const api = `https://archive.org/wayback/available?url=${encodeURIComponent(url)}`;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await fetchWithTimeout(api);
      if (res.status === 429) {
        // Rate-limited: back off hard once, then give up as 'unknown'.
        if (attempt === 0) { await sleep(60000); continue; }
        return { status: 'unknown' };
      }
      if (!res.ok) continue;
      const json = await res.json();
      const closest = json?.archived_snapshots?.closest;
      if (closest?.available && closest.url) {
        return { status: 'hit', snapshot: closest.url.replace(/^http:\/\//, 'https://') };
      }
      return { status: 'miss' };
    } catch {
      // timeout / network — retry once, then give up on this URL
    }
  }
  return { status: 'unknown' };
}

/** Best-effort Save Page Now (no auth). Heavily rate-limited upstream. */
async function savePageNow(url) {
  try {
    const res = await fetchWithTimeout(`https://web.archive.org/save/${url}`, 60000, { redirect: 'follow' });
    return res.ok;
  } catch {
    return false;
  }
}

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function main() {
  const urls = collectUrls();
  console.log(`wayback-backfill: ${urls.length} unique source URLs found`);

  const existing = existsSync(SIDECAR) ? JSON.parse(readFileSync(SIDECAR, 'utf-8')) : {};
  const result = { ...existing };
  const misses = [];
  const unknowns = [];
  let hits = 0;
  let kept = 0;
  let done = 0;

  // Worker pool — 2 workers, ~1.5s spacing each (≈1.3 req/s): the
  // availability API 429s hard above a few requests per second, and a
  // rate-limited answer is indistinguishable from "not archived" unless
  // handled — so slower is more accurate, not just more polite.
  const queue = [...urls];
  async function worker() {
    for (;;) {
      const url = queue.shift();
      if (!url) return;
      if (result[url]) {
        kept++;
      } else {
        const res = await availability(url);
        if (res.status === 'hit') {
          result[url] = res.snapshot;
          hits++;
        } else if (res.status === 'miss') {
          misses.push(url);
        } else {
          unknowns.push(url);
        }
        await sleep(1500);
      }
      done++;
      if (done % 50 === 0) console.log(`  …${done}/${urls.length} checked (${hits} new, ${kept} already mapped, ${misses.length} missing, ${unknowns.length} rate-limited)`);
    }
  }
  await Promise.all(Array.from({ length: 2 }, worker));

  if (SAVE_MODE && misses.length > 0) {
    const batch = misses.slice(0, SAVE_CAP);
    console.log(`wayback-backfill: SPN saving ${batch.length}/${misses.length} missing URLs (cap ${SAVE_CAP})`);
    for (const url of batch) {
      const ok = await savePageNow(url);
      console.log(`  ${ok ? 'saved' : 'FAILED'}: ${url}`);
      await sleep(6000); // SPN is strict about rates — 1 req / 6s
      if (ok) {
        const snap = await availability(url);
        if (snap) result[url] = snap;
      }
    }
  }

  const sorted = Object.fromEntries(Object.entries(result).sort(([a], [b]) => a.localeCompare(b)));
  writeFileSync(SIDECAR, JSON.stringify(sorted, null, 2) + '\n');

  mkdirSync(dirname(MISSES_REPORT), { recursive: true });
  writeFileSync(MISSES_REPORT, JSON.stringify({
    generated_at: new Date().toISOString(),
    total_urls: urls.length,
    mapped: Object.keys(sorted).filter(u => urls.includes(u)).length,
    missing: misses.filter(u => !sorted[u]),
    rate_limited_or_unreachable: unknowns.filter(u => !sorted[u]),
  }, null, 2) + '\n');

  console.log(`wayback-backfill: done — ${Object.keys(sorted).length} URLs mapped to an archived copy`);
  console.log(`  confirmed missing (SPN candidates): ${misses.filter(u => !sorted[u]).length}`);
  console.log(`  rate-limited / unreachable (re-run later): ${unknowns.filter(u => !sorted[u]).length}`);
  console.log(`  report: scripts/validate/reports/wayback-misses.json`);
}

main().catch((e) => {
  console.error('wayback-backfill: fatal', e);
  process.exit(1);
});
