#!/usr/bin/env node
/**
 * 01-inventory.mjs — Phase 0 of the per-council research pipeline.
 *
 * Given a council name, discovers candidate source documents and emits
 * inventory.json ready for 02-archive. Three discovery passes:
 *
 *   A. Known URLs — the council's existing record (budget_url,
 *      accounts_url, transparency_url, councillors_url, documents[],
 *      sources[]) is already a hand-verified starting set. Free.
 *   B. Pattern probes — the standard paths councils publish under
 *      ({domain}/statement-of-accounts etc.) plus the ModernGov
 *      democracy-portal subdomains from ROLLOUT-LESSONS §1.
 *   C. Landing-page harvest — every 200 HTML page from A/B is scanned
 *      for <a href> links to PDFs whose URL/text matches a finance
 *      document keyword (accounts, pay policy, allowances, budget,
 *      MTFS). This is what actually finds the documents: councils
 *      link their SoA from a landing page far more reliably than
 *      they keep a guessable PDF path.
 *
 * Nothing is downloaded here beyond HTML headers/pages — PDFs are
 * archived (with sha256 + wayback) by 02-archive.
 *
 * Output: src/data/councils/pdfs/council-pdfs/<slug>/inventory.json
 *   { council, slug, ons_code, primary_domain, sources: [...] }
 *   `sources[].url` + `sources[].document_type` are what 02 consumes
 *   (02 accepts both the rich `sources` shape and the legacy
 *   `documents` shape).
 *
 * Usage:
 *   node scripts/council-research/01-inventory.mjs --council=Basildon
 *   node scripts/council-research/01-inventory.mjs --council=Basildon --max-probes=30
 *
 * Spec: NORTH-STAR.md §6 Phase 0; ROLLOUT-LESSONS §1 (fetch patterns)
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { fetchUrl } from './lib/fetch.mjs';
import { classifyDoc, guessFiscalYear, isCurrentEnough, harvestLinks } from './lib/discovery.mjs';
import { startRun } from './lib/journal.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..', '..');
const DATA_DIR = join(REPO_ROOT, 'src', 'data', 'councils');

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const m = a.match(/^--([^=]+)(?:=(.*))?$/);
    return m ? [m[1], m[2] ?? true] : [a, true];
  }),
);

if (!args.council) {
  console.error('Usage: node 01-inventory.mjs --council=<name> [--max-probes=N]');
  process.exit(2);
}

const councilName = String(args.council);
const MAX_PROBES = Number(args['max-probes'] || 40);

function slugify(n) {
  return n.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}
const slug = slugify(councilName);

// ── Load the council's existing record (regex over the TS files — same
//    approach as scripts/validate/load-councils.mjs) ─────────────────
const TS_FILES = ['county-councils.ts', 'districts.ts', 'metropolitan.ts', 'unitary.ts', 'london-boroughs.ts'];

function extractCouncilBlock(name) {
  for (const f of TS_FILES) {
    const path = join(DATA_DIR, f);
    if (!existsSync(path)) continue;
    const src = readFileSync(path, 'utf8');
    const nameIdx = src.indexOf(`\n    name: "${name}",`);
    if (nameIdx === -1) continue;
    const nextIdx = src.indexOf('\n  },\n  {\n    ons_code:', nameIdx);
    return { file: f, block: src.slice(Math.max(0, src.lastIndexOf('{', nameIdx)), nextIdx === -1 ? src.length : nextIdx) };
  }
  return null;
}

const record = extractCouncilBlock(councilName);
if (!record) {
  console.error(`✗ Council "${councilName}" not found in any data file. Check spelling (exact name: \`name: "..."\` in the TS).`);
  process.exit(2);
}

const onsCode = record.block.match(/ons_code: "([^"]+)"/)?.[1] ?? null;

// Every URL already on the record — known-good starting set (pass A).
const knownUrls = [...new Set(
  [...record.block.matchAll(/(?:url|budget_url|accounts_url|transparency_url|councillors_url|council_tax_url|website)\s*:\s*"(https?:\/\/[^"]+)"/g)]
    .map((m) => m[1].split('#')[0]),
)];

// Derive the council's domains from the known URLs (most reliable
// source — guessing "{slug}.gov.uk" fails for double-named districts
// like Adur & Worthing).
const domains = [...new Set(
  knownUrls
    .map((u) => { try { return new URL(u).hostname; } catch { return null; } })
    .filter((h) => h && h.endsWith('.gov.uk') && !h.includes('gov.uk/') && h !== 'www.gov.uk'),
)];
const primaryDomain = domains.find((d) => !/^(democracy|moderngov|committees|cmis|opendata|data|api)\./.test(d)) || domains[0] || `www.${slug}.gov.uk`;
const bareDomain = primaryDomain.replace(/^www\./, '');

// ── Pass B: pattern probes ───────────────────────────────────────────
// Landing-page paths where councils publish finance documents, plus the
// ModernGov/CMIS democracy portals from ROLLOUT-LESSONS §1.
const PROBE_PATHS = [
  '/statement-of-accounts',
  '/statementofaccounts',
  '/accounts',
  '/annual-accounts',
  '/council-budgets',
  '/budget',
  '/budgets',
  '/finance',
  '/finances-and-spending',
  '/council-spending',
  '/pay-policy',
  '/pay-policy-statement',
  '/senior-salaries',
  '/councillor-allowances',
  '/members-allowances',
  '/allowances',
  '/transparency',
  '/open-data',
  '/medium-term-financial-strategy',
  '/mtfs',
];

const probeUrls = [];
for (const p of PROBE_PATHS) probeUrls.push(`https://${primaryDomain}${p}`);
// Democracy portals (ModernGov ships predictable endpoints).
for (const sub of ['democracy', 'moderngov', 'committees']) {
  probeUrls.push(`https://${sub}.${bareDomain}/mgListCommittees.aspx`);
}

// Classification, fiscal-year parsing and link harvesting live in
// lib/discovery.mjs — pure functions covered by pipeline-selftest.mjs.

/**
 * WAF'd council? Read the landing page from the Wayback Machine instead
 * (ROLLOUT-LESSONS §1 — Wayback's crawler is allowlisted by most CDNs)
 * and harvest document links from the archived HTML.
 */
async function harvestViaWayback(url) {
  const res = await fetchUrl(`https://web.archive.org/web/2026/${url}`, { timeout: 25_000, retries: 0 });
  if (!res.ok || !(res.contentType || '').includes('html')) return [];
  const html = new TextDecoder('utf-8').decode(res.body);
  return harvestLinks(html, res.finalUrl || url).map((f) => ({ ...f, discovered_note: 'via wayback copy of landing page' }));
}

/**
 * Pass D — Wayback CDX domain sweep. Lists every archived URL on the
 * council's domain whose path matches a finance-document keyword,
 * without a single request to the council's own (possibly WAF'd) site.
 * This is how the Statement of Accounts gets found when every probe is
 * bot-blocked: if the IA crawler ever saw the PDF, CDX knows its URL.
 */
async function cdxSweep(domain) {
  const found = [];
  const patterns = [
    'accounts', 'pay-policy', 'pay_policy', 'allowance', 'budget', 'mtfs', 'financial-strategy',
  ];
  for (const kw of patterns) {
    const api =
      `https://web.archive.org/cdx/search/cdx?url=${encodeURIComponent(domain)}%2F*` +
      `&matchType=domain&filter=original:.*${kw}.*%5C.pdf.*&collapse=urlkey` +
      `&from=2023&fl=original,timestamp&limit=60`;
    const res = await fetchUrl(api, { timeout: 30_000, retries: 0 });
    if (!res.ok) { await sleep(800); continue; }
    const text = new TextDecoder('utf-8').decode(res.body);
    for (const line of text.split('\n')) {
      const [original] = line.split(' ');
      if (!original || !/^https?:/.test(original)) continue;
      const type = classifyDoc(original);
      if (!type) continue;
      const fiscal_year = guessFiscalYear(original);
      if (!isCurrentEnough(fiscal_year)) continue; // CDX filters by capture date, not doc year — drop stale docs
      found.push({ url: original.split('#')[0], document_type: type, fiscal_year, discovered_note: 'wayback CDX domain index' });
    }
    await sleep(800);
  }
  return found;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const run = startRun('01-inventory', councilName);

async function main() {
  console.log(`Inventory: ${councilName} (${onsCode ?? 'no ONS code'}) — domain ${primaryDomain}`);
  console.log(`  known URLs on record: ${knownUrls.length}`);

  const sources = new Map(); // url → source entry
  const landingPages = [];   // 200 HTML pages to harvest
  const botBlocked = [];

  function addSource(url, type, via, extra = {}) {
    if (sources.has(url)) return;
    sources.set(url, {
      id: `${type || 'document'}-${sources.size + 1}`,
      url,
      publisher: councilName,
      document_type: type || 'unknown',
      fiscal_year: extra.fiscal_year || guessFiscalYear(url),
      tier_guess: 3,
      discovered_via: via,
      ...(extra.link_text ? { link_text: extra.link_text } : {}),
    });
  }

  // Pass A: known record URLs — classify; PDFs become sources directly,
  // HTML pages join the harvest queue.
  for (const u of knownUrls) {
    const type = classifyDoc(u);
    if (/\.pdf(\?|$)/i.test(u)) {
      if (type) addSource(u, type, 'council-record');
    } else if (u.includes(bareDomain)) {
      landingPages.push(u);
    }
  }

  // Pass B: probe pattern URLs (HEAD-ish GET, bounded).
  const probes = probeUrls.slice(0, MAX_PROBES);
  let probed = 0;
  for (const u of probes) {
    probed++;
    const res = await fetchUrl(u, { timeout: 15_000, retries: 0 });
    if (res.cloudflareBlocked) {
      botBlocked.push(u);
      // WAF'd — read the archived copy of the landing page instead.
      for (const f of await harvestViaWayback(u)) {
        addSource(f.url, f.document_type, `wayback-harvest:${new URL(u).pathname}`, f);
      }
      await sleep(400);
      continue;
    }
    if (!res.ok) continue;
    const finalUrl = res.finalUrl || u;
    if ((res.contentType || '').includes('pdf')) {
      addSource(finalUrl, classifyDoc(finalUrl) || 'unknown', 'pattern-probe');
    } else if ((res.contentType || '').includes('html')) {
      landingPages.push(finalUrl);
      // Harvest immediately while we have the body.
      const html = new TextDecoder('utf-8').decode(res.body);
      for (const f of harvestLinks(html, finalUrl)) {
        addSource(f.url, f.document_type, `harvest:${new URL(finalUrl).pathname}`, f);
      }
    }
    await sleep(300); // politeness
    if (probed % 10 === 0) console.log(`  …probed ${probed}/${probes.length} (${sources.size} candidate docs so far)`);
  }

  // Pass C: harvest any known-record landing pages not yet fetched.
  const harvested = new Set(probes);
  for (const u of [...new Set(landingPages)]) {
    if (harvested.has(u)) continue;
    harvested.add(u);
    const res = await fetchUrl(u, { timeout: 15_000, retries: 0 });
    if (res.cloudflareBlocked) {
      botBlocked.push(u);
      for (const f of await harvestViaWayback(u)) {
        addSource(f.url, f.document_type, `wayback-harvest:${new URL(u).pathname}`, f);
      }
      await sleep(400);
      continue;
    }
    if (!res.ok || !(res.contentType || '').includes('html')) continue;
    const html = new TextDecoder('utf-8').decode(res.body);
    for (const f of harvestLinks(html, res.finalUrl || u)) {
      addSource(f.url, f.document_type, `harvest:${new URL(u).pathname}`, f);
    }
    await sleep(300);
  }

  // Pass D: CDX domain sweep — fills the gaps the WAF left (most
  // importantly the Statement of Accounts). Runs whenever a key
  // document type is still missing. Sweeps the council's own domain
  // AND its democracy/committee portal (often a non-.gov.uk ModernGov
  // host like basildonmeetings.info — that's where committee-published
  // SoAs and budget reports live).
  const haveTypes = new Set([...sources.values()].map((s) => s.document_type));
  const KEY_TYPES = ['statement-of-accounts', 'pay-policy', 'councillor-allowances'];
  if (KEY_TYPES.some((t) => !haveTypes.has(t))) {
    console.log('  …key document types missing — sweeping the Wayback CDX index');
    const portalDomains = [...new Set(
      knownUrls
        .map((u) => { try { return new URL(u).hostname; } catch { return null; } })
        .filter((h) => h && h !== primaryDomain && /meetings|moderngov|democracy|committee|cmis|govdelivery/i.test(h)),
    )];
    for (const d of [bareDomain, ...portalDomains]) {
      for (const f of await cdxSweep(d)) {
        addSource(f.url, f.document_type, `cdx-sweep:${d}`, f);
      }
    }
  }

  // Rank within each document_type — recent + parseable fiscal years
  // first, committee-attachment noise ("Enc. 4 for …") last — and cap
  // at 8 per type so the reviewer reads a shortlist, not a dump.
  const grouped = new Map();
  for (const s of sources.values()) {
    if (!grouped.has(s.document_type)) grouped.set(s.document_type, []);
    grouped.get(s.document_type).push(s);
  }
  const sourceList = [];
  for (const [, list] of [...grouped.entries()].sort(([a], [b]) => a.localeCompare(b))) {
    list.sort((a, b) => {
      const yr = (x) => (x.fiscal_year && x.fiscal_year !== 'unknown' ? x.fiscal_year : '');
      const enc = (x) => (/enc(?:\.|%2E)?\s*%?\d/i.test(x.url) ? 1 : 0);
      return enc(a) - enc(b) || yr(b).localeCompare(yr(a)) || a.url.length - b.url.length;
    });
    sourceList.push(...list.slice(0, 8));
  }

  const councilDir = join(DATA_DIR, 'pdfs', 'council-pdfs', slug);
  mkdirSync(councilDir, { recursive: true });
  const out = {
    council: councilName,
    slug,
    ons_code: onsCode,
    primary_domain: primaryDomain,
    democracy_portal: domains.find((d) => /^(democracy|moderngov|committees)\./.test(d)) || null,
    inventory_built: new Date().toISOString().slice(0, 10),
    bot_blocking: {
      direct_http_fetch: botBlocked.length > 0 ? 'partial' : 'none',
      blocked_urls: botBlocked,
      notes: botBlocked.length > 0
        ? 'Some probes were WAF-blocked. 02-archive falls back to the Wayback ladder (ROLLOUT-LESSONS §1) automatically.'
        : 'All probes fetched without bot blocking.',
    },
    sources: sourceList,
  };
  const outPath = join(councilDir, 'inventory.json');
  writeFileSync(outPath, JSON.stringify(out, null, 2) + '\n');

  // Status update (same convention as 02-archive).
  const statusDir = join(REPO_ROOT, 'scripts', 'council-research', 'status');
  mkdirSync(statusDir, { recursive: true });
  const statusPath = join(statusDir, `${slug}.json`);
  let current = {};
  if (existsSync(statusPath)) { try { current = JSON.parse(readFileSync(statusPath, 'utf8')); } catch {} }
  writeFileSync(statusPath, JSON.stringify({
    council: councilName,
    slug,
    ...current,
    phases: { ...(current.phases || {}), phase_0_inventory: { done: sourceList.length > 0, at: new Date().toISOString(), candidates: sourceList.length } },
    last_session: new Date().toISOString(),
  }, null, 2) + '\n');

  console.log('');
  console.log(`Inventory written: ${outPath}`);
  const byType = {};
  for (const s of sourceList) byType[s.document_type] = (byType[s.document_type] || 0) + 1;
  for (const [t, n] of Object.entries(byType)) console.log(`  ${t}: ${n} candidate(s)`);
  if (botBlocked.length) console.log(`  ⚠ ${botBlocked.length} URL(s) bot-blocked — 02-archive will use the Wayback ladder`);
  if (sourceList.length === 0) {
    console.log('  ✗ No candidate documents found automatically — supplement inventory.json by hand (web search), then run 02-archive.');
    run.finish('failed', { reason: 'no candidates found', bot_blocked: botBlocked.length });
    process.exit(1);
  }
  run.finish('ok', { candidates: sourceList.length, by_type: byType, bot_blocked: botBlocked.length });
}

main().catch((e) => { console.error('Fatal:', e); run.finish('crashed', { error: String(e?.stack || e) }); process.exit(2); });
