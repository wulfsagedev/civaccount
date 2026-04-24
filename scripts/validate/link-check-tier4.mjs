#!/usr/bin/env node
/**
 * link-check-tier4.mjs — verify every Tier-4 (live-page) URL across 22
 * North-Star councils returns 200. Report 404s + redirects.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const REPO = '/Users/owenfisher/Projects/CivAccount/V3.0';
const DC = join(REPO, 'src', 'data', 'councils');

const NORTH_STAR_22 = [
  'Bradford', 'Kent', 'Camden',
  'Manchester', 'Birmingham', 'Leeds', 'Surrey', 'Cornwall',
  'Liverpool', 'Bristol', 'Lancashire', 'Tower Hamlets',
  'Hampshire', 'Essex', 'Hertfordshire', 'Sheffield', 'Westminster',
  'Nottinghamshire', 'Staffordshire', 'Wiltshire', 'Newcastle upon Tyne', 'Croydon',
];

// Extract field_sources from TS files and pick tier:4 entries
const TS_FILES = [
  join(DC, 'county-councils.ts'),
  join(DC, 'metropolitan.ts'),
  join(DC, 'unitary.ts'),
  join(DC, 'london-boroughs.ts'),
];

// Parse a council's field_sources block — return { field: { url, tier, ... } }
// Handles both multi-line and compact (single-line) entry formats.
function extractFieldSources(src, name) {
  const nameIdx = src.indexOf(`\n    name: "${name}",`);
  if (nameIdx === -1) return null;
  const nextIdx = src.indexOf('\n  },\n  {\n    ons_code:', nameIdx);
  const slice = src.slice(nameIdx, nextIdx === -1 ? src.length : nextIdx);
  const fsIdx = slice.indexOf('field_sources: {');
  if (fsIdx === -1) return null;

  // Brace-match to end of field_sources block
  let depth = 0, i = fsIdx + 'field_sources: '.length;
  for (; i < slice.length; i++) {
    if (slice[i] === '{') depth++;
    else if (slice[i] === '}') { depth--; if (depth === 0) break; }
  }
  const fsBody = slice.slice(fsIdx, i + 1);

  // Walk by top-level keys: find each "key: {" at indent depth 1 inside fs
  const out = {};
  const keyRe = /(^\s{8}|\n\s{8})([a-z_]+):\s*\{/g;
  let km;
  while ((km = keyRe.exec(fsBody))) {
    const field = km[2];
    const startBrace = km.index + km[0].length - 1;
    let d = 1, j = startBrace + 1;
    for (; j < fsBody.length; j++) {
      if (fsBody[j] === '{') d++;
      else if (fsBody[j] === '}') { d--; if (d === 0) break; }
    }
    const inner = fsBody.slice(startBrace + 1, j);
    const url = inner.match(/url:\s*"([^"]+)"/)?.[1];
    const tier = parseInt(inner.match(/tier:\s*(\d+)/)?.[1] || '', 10);
    if (!url || !tier) continue;
    out[field] = { url, tier };
  }
  return out;
}

const allTier4 = [];
for (const file of TS_FILES) {
  const src = readFileSync(file, 'utf8');
  for (const name of NORTH_STAR_22) {
    const fs = extractFieldSources(src, name);
    if (!fs) continue;
    for (const [field, entry] of Object.entries(fs)) {
      if (entry.tier === 4) {
        allTier4.push({ council: name, field, url: entry.url });
      }
    }
  }
}

console.log(`Tier-4 URLs to check: ${allTier4.length} across 22 councils`);

// Check each URL — GET request with browser-like UA (many .gov.uk sites
// block HEAD or non-browser UAs). Follow redirects.
async function check(url) {
  const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36';
  try {
    const res = await fetch(url, {
      method: 'GET',
      redirect: 'follow',
      signal: AbortSignal.timeout(15_000),
      headers: { 'User-Agent': UA, 'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8' },
    });
    // Don't download the body — just get status + final URL
    try { await res.body?.cancel(); } catch {}
    return { status: res.status, final_url: res.url };
  } catch (e) {
    return { status: 0, error: String(e.message || e).slice(0, 80) };
  }
}

// Known domains that reject automated fetches (403 or connection timeout)
// but serve the page fine in a real browser. Two classes:
//   MODERNGOV_403_DOMAINS — return 403 to bot UAs (verified in-browser)
//   IMPERVA_TIMEOUT_DOMAINS — Imperva/Akamai WAF times out non-browser
//     connections entirely. Verify URL exists via Google/WebSearch before
//     adding here; only add if the live page is reachable from a browser.
const MODERNGOV_403_DOMAINS = [
  'democracy.', 'moderngov.', 'committees.westminster',
  'cms.wiltshire', 'mycouncil.surreycc',
];
const IMPERVA_TIMEOUT_DOMAINS = [
  'newcastle.gov.uk', // Imperva WAF — verified live in-browser 2026-04-23
];
function isModernGov403(url) {
  return MODERNGOV_403_DOMAINS.some(d => url.includes(d));
}
function isImpervaTimeout(url) {
  return IMPERVA_TIMEOUT_DOMAINS.some(d => url.includes(d));
}

const results = [];
for (const item of allTier4) {
  const r = await check(item.url);
  const status = r.status;
  const err = String(r.error || '');
  const timedOut = status === 0 && /timeout|timed out|fetch failed/i.test(err);
  const botBlocked =
    (status === 403 && isModernGov403(item.url)) ||
    (timedOut && isImpervaTimeout(item.url));
  const broken = (status === 0 || status >= 400) && !botBlocked;
  const icon = broken ? '✗' : (botBlocked ? '~' : '✓');
  console.log(`${icon} [${status || 'ERR'}${botBlocked ? '/bot-ok' : ''}] ${item.council} ${item.field} → ${item.url}`);
  results.push({ ...item, ...r, broken, bot_blocked_ok: botBlocked });
}

const broken = results.filter(r => r.broken);
const botOk = results.filter(r => r.bot_blocked_ok);
console.log(`\n${results.length} checked. Broken: ${broken.length}. Bot-blocked (OK): ${botOk.length}.`);

writeFileSync('/tmp/tier4-link-check.json', JSON.stringify({
  checked_at: new Date().toISOString(),
  total: results.length,
  broken: broken.length,
  bot_blocked_ok: botOk.length,
  results,
}, null, 2));

if (broken.length) {
  console.log('\n=== BROKEN (needs fix) ===');
  for (const b of broken) {
    console.log(`  ${b.council} ${b.field}: [${b.status || b.error}] ${b.url}`);
  }
  process.exit(1);
}
