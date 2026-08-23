#!/usr/bin/env node
/**
 * reverify.mjs — automated source re-verification sweep.
 *
 * Re-checks, for every council, that the documents its figures were taken
 * from are still live and still say the same thing. On a clean pass it
 * stamps `detailed.last_auto_verified`. On any drift it stamps nothing and
 * reports the council for a human.
 *
 * ─── What this proves, and what it does not ───────────────────────────────
 *
 * PROVES:      the cited document is still reachable, and the figure we
 *              recorded is still in it — byte-identical (sha256 match) or,
 *              where the document has been republished, still present
 *              verbatim at the stored excerpt.
 *
 * PARTLY CATCHES CURRENCY, but only where the citation is a LIVE page.
 *              When a council replaces its leader and updates the "who runs
 *              the council" page, the stored excerpt stops matching and the
 *              council comes back `drifted`. The first real sweep found
 *              exactly that for Derbyshire, Suffolk, Worcestershire and
 *              others — all on `council_leader` / `chief_executive`.
 *
 * DOES NOT     catch currency where the citation is a DATED DOCUMENT. Last
 *              year's statement of accounts will name last year's chief
 *              executive forever, and this sweep will pass it every time.
 *              DATA-CONSTITUTION Rule 8's "currency is not fully mechanised"
 *              caveat therefore still stands for PDF-sourced fields.
 *
 * The two stamps are therefore deliberately separate, and the site must
 * never present one as the other.
 *
 * ─── Why it exists ───────────────────────────────────────────────────────
 *
 * `last-verified-freshness.mjs` errors at 180 days. As of 2026-08-23, 284 of
 * 317 councils cross that line between 10 and 26 October 2026, because the
 * stamps are clustered in a two-week window in April rather than spread. At
 * rollout-playbook pace that is 400+ hours of work to clear, so the realistic
 * outcome without this script is a permanently red CI — and a permanently red
 * CI is an ignored CI, which quietly disables every ratchet in the
 * constitution. Mechanising the half of re-verification that IS mechanisable
 * keeps the gate meaningful.
 *
 * ─── Verdicts ────────────────────────────────────────────────────────────
 *
 *   unchanged     sha256 matches the hash stored at access time
 *   republished   hash moved, but every excerpt from it is still present
 *   drifted       hash moved and an excerpt is gone → needs a human
 *   broken        document 404s, or silently 404s behind a 200 → needs a human
 *   unverifiable  bot-blocked (403/429) or no checkable evidence stored
 *
 * A council is `clean` only if it has at least one checked source and no
 * `drifted` or `broken` ones. Only `clean` councils get stamped.
 *
 * ─── Usage ───────────────────────────────────────────────────────────────
 *
 *   node scripts/validate/reverify.mjs                  # sweep all, report only
 *   node scripts/validate/reverify.mjs --council=Kent
 *   node scripts/validate/reverify.mjs --oldest=50      # 50 stalest stamps first
 *   node scripts/validate/reverify.mjs --write          # stamp clean councils
 *   node scripts/validate/reverify.mjs --concurrency=6
 *   node scripts/validate/reverify.mjs --timeout=20000
 *
 * Exit code: 0 on a completed sweep (even with findings) — read the report.
 * Exit 1 only if the sweep itself could not run.
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadCouncils } from './load-councils.mjs';
import { extractText } from '../council-research/lib/pdf.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO = join(__dirname, '..', '..');
const DATA_DIR = join(REPO, 'src', 'data', 'councils');
const REPORTS_DIR = join(__dirname, 'reports');

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const m = a.match(/^--([^=]+)(?:=(.*))?$/);
    return m ? [m[1], m[2] ?? true] : [a, true];
  }),
);

const CONCURRENCY = Math.max(1, parseInt(args.concurrency ?? '6', 10) || 6);
const TIMEOUT_MS = Math.max(1000, parseInt(args.timeout ?? '20000', 10) || 20000);
const WRITE = args.write === true;
const TODAY = new Date().toISOString().slice(0, 10);

// Only these extraction methods store an excerpt that is expected to appear in
// the fetched document. `csv_row` excerpts reference a locally parsed CSV
// ("parsed-council-tax-requirement.csv: Bradford,280447489.0") and would never
// match the GOV.UK collection page they cite — those figures are covered far
// more strongly by compare-checksums.mjs (Rule 4) instead.
const EXCERPT_METHODS = new Set(['pdf_page', 'manual_read']);

// A 200 that is really a 404. Same conservative list link-check.mjs uses —
// kept in step with it deliberately; widen both or neither.
const NOT_FOUND_PATHS = [
  '/page-not-found', '/not-found', '/404', '/error/404', '/error-404',
  '/pagenotfound', '/page_not_found',
];

const UA = 'Mozilla/5.0 (compatible; CivAccount-Reverify/1.0; +https://www.civaccount.co.uk)';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const norm = (s) => String(s).replace(/[\s ]+/g, ' ').replace(/[’‘]/g, "'").replace(/[“”]/g, '"').trim().toLowerCase();

/**
 * Collect every checkable source record, keyed by the bare document URL so
 * each document is fetched exactly once no matter how many councils and
 * fields cite it. Roughly 1,200 field citations collapse to ~950 documents,
 * and the GOV.UK collections shared across all 317 councils collapse to one.
 */
function collectDocuments(councils) {
  const docs = new Map();
  for (const c of councils) {
    const sources = c.detailed?.field_sources || {};
    for (const [field, raw] of Object.entries(sources)) {
      for (const s of Array.isArray(raw) ? raw : [raw]) {
        if (!s || typeof s !== 'object' || !s.url) continue;
        const url = String(s.url).split('#')[0];
        if (!/^https?:\/\//i.test(url)) continue;
        if (!docs.has(url)) docs.set(url, { url, sha256: null, cites: [] });
        const d = docs.get(url);
        if (s.sha256_at_access && !d.sha256) d.sha256 = s.sha256_at_access;
        d.cites.push({
          council: c.name,
          field,
          excerpt: EXCERPT_METHODS.has(s.extraction_method) ? s.excerpt || null : null,
          page: s.page ?? null,
        });
      }
    }
  }
  return docs;
}

function detectSilentNotFound(finalUrl) {
  try {
    const path = new URL(finalUrl).pathname.toLowerCase();
    return NOT_FOUND_PATHS.some((p) => path.includes(p));
  } catch {
    return false;
  }
}

/**
 * Fetch one document and decide its verdict.
 *
 * The cheap path is the common one: hash the bytes, compare to the hash
 * stored at access time, and if they match every citation from this document
 * is proven without extracting a single character of text. Text extraction
 * only happens when a document has genuinely been republished.
 */
async function checkDocument(doc) {
  const result = { url: doc.url, verdict: 'unverifiable', detail: '', citesChecked: 0, failures: [] };

  let res;
  try {
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), TIMEOUT_MS);
    res = await fetch(doc.url, {
      redirect: 'follow',
      signal: ctl.signal,
      headers: { 'User-Agent': UA, Accept: '*/*' },
    }).finally(() => clearTimeout(timer));
  } catch (err) {
    result.verdict = 'broken';
    result.detail = `fetch failed: ${err.name === 'AbortError' ? `timeout after ${TIMEOUT_MS}ms` : err.message}`;
    return result;
  }

  // Bot-walls are not broken links. Councils increasingly sit behind
  // Cloudflare or Imperva and answer automated clients with 403/429 while
  // serving humans normally — treating those as failures would flood the
  // report with false positives and train everyone to ignore it.
  if (res.status === 403 || res.status === 429 || res.status === 503) {
    result.verdict = 'unverifiable';
    result.detail = `bot-blocked (HTTP ${res.status})`;
    return result;
  }
  if (!res.ok) {
    result.verdict = 'broken';
    result.detail = `HTTP ${res.status}`;
    return result;
  }
  if (detectSilentNotFound(res.url)) {
    result.verdict = 'broken';
    result.detail = `silent 404 — redirected to ${res.url}`;
    return result;
  }

  const buf = Buffer.from(await res.arrayBuffer());
  const liveSha = createHash('sha256').update(buf).digest('hex');
  result.liveSha256 = liveSha;

  if (doc.sha256 && liveSha === doc.sha256) {
    result.verdict = 'unchanged';
    result.detail = 'sha256 identical to hash stored at access time';
    result.citesChecked = doc.cites.length;
    return result;
  }

  // Either no hash was ever stored, or the document has been republished.
  // Fall back to the excerpts: the figure surviving a re-publication is the
  // thing that actually matters, not the bytes around it.
  const excerptCites = doc.cites.filter((c) => c.excerpt);
  if (excerptCites.length === 0) {
    result.verdict = 'unverifiable';
    result.detail = doc.sha256
      ? 'document republished (sha256 moved) and no excerpt stored to re-check'
      : 'no sha256 and no excerpt stored — nothing to check beyond liveness';
    return result;
  }

  let text;
  try {
    text = norm(await extractDocumentText(buf, doc.url, res.headers.get('content-type') || ''));
  } catch (err) {
    result.verdict = 'unverifiable';
    result.detail = `could not extract text: ${err.message}`;
    return result;
  }

  for (const cite of excerptCites) {
    result.citesChecked++;
    if (!text.includes(norm(cite.excerpt))) {
      result.failures.push({ council: cite.council, field: cite.field, page: cite.page, excerpt: cite.excerpt });
    }
  }

  if (result.failures.length > 0) {
    result.verdict = 'drifted';
    result.detail = `${result.failures.length} of ${result.citesChecked} excerpts no longer appear in the document`;
  } else {
    result.verdict = doc.sha256 ? 'republished' : 'unchanged';
    result.detail = doc.sha256
      ? `document republished but all ${result.citesChecked} excerpts intact`
      : `all ${result.citesChecked} excerpts present (no baseline hash stored)`;
  }
  return result;
}

/** PDFs go through poppler; anything else is treated as text/HTML. */
async function extractDocumentText(buf, url, contentType) {
  const isPdf = /application\/pdf/i.test(contentType) || /\.pdf$/i.test(url) || buf.subarray(0, 5).toString() === '%PDF-';
  if (!isPdf) {
    return buf.toString('utf8').replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ');
  }
  const dir = join(tmpdir(), `civaccount-reverify-${process.pid}-${Math.abs(hashString(url))}`);
  mkdirSync(dir, { recursive: true });
  const path = join(dir, 'doc.pdf');
  try {
    writeFileSync(path, buf);
    return extractText(path);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

function hashString(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return h;
}

/** Bounded-concurrency map that keeps going when an individual task throws. */
async function pooled(items, worker, concurrency, onDone) {
  const out = new Array(items.length);
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(concurrency, items.length) }, async () => {
      while (true) {
        const i = next++;
        if (i >= items.length) return;
        try {
          out[i] = await worker(items[i], i);
        } catch (err) {
          out[i] = { url: items[i]?.url, verdict: 'broken', detail: `sweep error: ${err.message}`, citesChecked: 0, failures: [] };
        }
        onDone?.(out[i], i + 1, items.length);
        await sleep(150); // politeness — these are council servers
      }
    }),
  );
  return out;
}

/**
 * Write `last_auto_verified` into the council's record in the private
 * dataset. Uses the same locate-block-then-surgery approach as
 * 05-populate.mjs so there is exactly one way this repo edits council TS.
 */
function stampCouncils(names) {
  const TS_FILES = ['county-councils.ts', 'districts.ts', 'metropolitan.ts', 'unitary.ts', 'london-boroughs.ts'];
  const stamped = [];
  const skipped = [];

  for (const file of TS_FILES) {
    const path = join(DATA_DIR, file);
    if (!existsSync(path)) continue;
    let src = readFileSync(path, 'utf8');
    let touched = false;

    for (const name of names) {
      const nameIdx = src.indexOf(`\n    name: "${name}",`);
      if (nameIdx === -1) continue;
      const nextIdx = src.indexOf('\n  },\n  {\n    ons_code:', nameIdx);
      const blockEnd = nextIdx === -1 ? src.length : nextIdx;
      const block = src.slice(nameIdx, blockEnd);

      let updated;
      if (/last_auto_verified:\s*"[^"]*"/.test(block)) {
        updated = block.replace(/last_auto_verified:\s*"[^"]*"/, `last_auto_verified: "${TODAY}"`);
      } else if (/last_verified:\s*"[^"]*",/.test(block)) {
        // Sit the machine stamp directly beneath the human one so the two are
        // impossible to confuse when reading the file.
        updated = block.replace(
          /(last_verified:\s*"[^"]*",)/,
          `$1\n      last_auto_verified: "${TODAY}",`,
        );
      } else {
        skipped.push(name);
        continue;
      }

      src = src.slice(0, nameIdx) + updated + src.slice(blockEnd);
      stamped.push(name);
      touched = true;
    }

    if (touched) writeFileSync(path, src);
  }

  return { stamped, skipped };
}

async function main() {
  const all = await loadCouncils();
  let councils = all;

  if (args.council) {
    councils = all.filter((c) => c.name.toLowerCase() === String(args.council).toLowerCase());
    if (councils.length === 0) {
      console.error(`✗ Council "${args.council}" not found.`);
      process.exit(1);
    }
  } else if (args.oldest) {
    const n = parseInt(args.oldest, 10) || 50;
    councils = [...all]
      .sort((a, b) => String(a.detailed?.last_verified || '').localeCompare(String(b.detailed?.last_verified || '')))
      .slice(0, n);
  }

  const docs = collectDocuments(councils);
  const list = [...docs.values()];

  console.log('\n═══ CivAccount SOURCE RE-VERIFICATION SWEEP ═══\n');
  console.log(`Councils in scope:   ${councils.length}`);
  console.log(`Unique documents:    ${list.length}`);
  console.log(`With baseline hash:  ${list.filter((d) => d.sha256).length}`);
  console.log(`Concurrency:         ${CONCURRENCY}   Timeout: ${TIMEOUT_MS}ms\n`);

  const started = Date.now();
  const results = await pooled(list, checkDocument, CONCURRENCY, (r, done, total) => {
    if (done % 25 === 0 || done === total) {
      process.stdout.write(`  ${done}/${total} documents checked…\r`);
    }
  });
  process.stdout.write(' '.repeat(60) + '\r');

  const byUrl = new Map(results.map((r) => [r.url, r]));

  // Roll document verdicts up to councils. A council inherits the worst
  // verdict of any document it cites.
  const councilVerdicts = new Map();
  for (const c of councils) {
    const cited = new Set();
    for (const raw of Object.values(c.detailed?.field_sources || {})) {
      for (const s of Array.isArray(raw) ? raw : [raw]) {
        if (s?.url) cited.add(String(s.url).split('#')[0]);
      }
    }
    const verdicts = [...cited].map((u) => byUrl.get(u)).filter(Boolean);
    const broken = verdicts.filter((v) => v.verdict === 'broken');
    const drifted = verdicts.filter((v) => v.verdict === 'drifted');
    const proven = verdicts.filter((v) => v.verdict === 'unchanged' || v.verdict === 'republished');

    let verdict;
    if (broken.length) verdict = 'broken';
    else if (drifted.length) verdict = 'drifted';
    else if (proven.length) verdict = 'clean';
    else verdict = 'unverifiable';

    councilVerdicts.set(c.name, {
      council: c.name,
      verdict,
      last_verified: c.detailed?.last_verified ?? null,
      documents: verdicts.length,
      proven: proven.length,
      broken: broken.map((v) => ({ url: v.url, detail: v.detail })),
      drifted: drifted.map((v) => ({ url: v.url, detail: v.detail, failures: v.failures })),
    });
  }

  const rows = [...councilVerdicts.values()];
  const clean = rows.filter((r) => r.verdict === 'clean');
  const drifted = rows.filter((r) => r.verdict === 'drifted');
  const broken = rows.filter((r) => r.verdict === 'broken');
  const unver = rows.filter((r) => r.verdict === 'unverifiable');

  const tally = (v) => results.filter((r) => r.verdict === v).length;
  console.log('DOCUMENTS');
  console.log(`  unchanged     ${tally('unchanged')}`);
  console.log(`  republished   ${tally('republished')}   (hash moved, excerpts intact)`);
  console.log(`  drifted       ${tally('drifted')}   ← excerpt gone, needs a human`);
  console.log(`  broken        ${tally('broken')}   ← needs a human`);
  console.log(`  unverifiable  ${tally('unverifiable')}   (bot-blocked or nothing stored to check)`);

  console.log('\nCOUNCILS');
  console.log(`  clean         ${clean.length} / ${rows.length}   ← eligible for a last_auto_verified stamp`);
  console.log(`  drifted       ${drifted.length}`);
  console.log(`  broken        ${broken.length}`);
  console.log(`  unverifiable  ${unver.length}   (no re-derivable evidence stored yet)`);

  if (drifted.length || broken.length) {
    console.log('\nNEEDS A HUMAN');
    for (const r of [...broken, ...drifted].slice(0, 25)) {
      console.log(`  ${r.verdict.padEnd(8)} ${r.council}`);
      for (const b of [...r.broken, ...r.drifted].slice(0, 3)) {
        console.log(`           ${b.detail} — ${b.url}`);
      }
    }
    const extra = broken.length + drifted.length - 25;
    if (extra > 0) console.log(`  …and ${extra} more (see the report)`);
  }

  mkdirSync(REPORTS_DIR, { recursive: true });
  const report = {
    generated_at: new Date().toISOString(),
    scope: args.council ? `council=${args.council}` : args.oldest ? `oldest=${args.oldest}` : 'all',
    duration_ms: Date.now() - started,
    councils: rows,
    documents: results,
    summary: {
      councils_total: rows.length,
      councils_clean: clean.length,
      councils_drifted: drifted.length,
      councils_broken: broken.length,
      councils_unverifiable: unver.length,
      documents_total: results.length,
      documents_unchanged: tally('unchanged'),
      documents_republished: tally('republished'),
      documents_drifted: tally('drifted'),
      documents_broken: tally('broken'),
      documents_unverifiable: tally('unverifiable'),
    },
  };
  writeFileSync(join(REPORTS_DIR, 'reverify-latest.json'), JSON.stringify(report, null, 2));
  console.log(`\nReport → scripts/validate/reports/reverify-latest.json`);

  if (WRITE) {
    if (clean.length === 0) {
      console.log('\n--write: nothing to stamp — no council came back clean.');
    } else {
      const { stamped, skipped } = stampCouncils(clean.map((r) => r.council));
      console.log(`\n--write: stamped last_auto_verified="${TODAY}" on ${stamped.length} council(s).`);
      if (skipped.length) {
        console.log(`         skipped ${skipped.length} with no last_verified field to anchor to: ${skipped.slice(0, 8).join(', ')}`);
      }
      console.log('         Commit these in the PRIVATE civaccount-data repo, not this one.');
    }
  } else if (clean.length) {
    console.log(`\n${clean.length} council(s) would be stamped. Re-run with --write to apply.`);
  }

  console.log('\nNote: a clean pass proves the SOURCES have not changed. It does not');
  console.log('prove the facts are current — a chief executive who left last month');
  console.log('still passes. Human re-verification remains Rule 8\'s job.\n');
}

main().catch((err) => {
  console.error(`✗ sweep failed: ${err.stack || err.message}`);
  process.exit(1);
});
