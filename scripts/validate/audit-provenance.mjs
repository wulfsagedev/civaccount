#!/usr/bin/env node
/**
 * audit-provenance.mjs — Every number on every page must link to its source.
 *
 * Reproduces the SourceAnnotation popover's URL resolution (same as
 * getProvenance() in src/data/provenance.ts) for every field × council
 * combination, then verifies each resolved URL is live — including catching
 * silent 404s (200 response with a page-not-found redirect target).
 *
 * Output: scripts/validate/reports/provenance-audit-latest.json
 *
 * Usage:
 *   node scripts/validate/audit-provenance.mjs [--fields=field1,field2] [--concurrency=20]
 */

import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { loadCouncils } from './load-councils.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPORTS_DIR = join(__dirname, 'reports');

// Parse args
const argv = process.argv.slice(2);
const fieldsArg = argv.find((a) => a.startsWith('--fields='))?.slice(9);
const concurrencyArg = argv.find((a) => a.startsWith('--concurrency='))?.slice(14);
const FIELD_FILTER = fieldsArg ? fieldsArg.split(',') : null;
const CONCURRENCY = concurrencyArg ? parseInt(concurrencyArg, 10) : 20;
const TIMEOUT_MS = 15000;
const DELAY_MS = 50;

// ──────────────────────────────────────────────────────────────────────────────
// Field → origin map. Every field we render a number for must be here.
// Origin determines where the source URL comes from:
//   - 'national' — a national dataset (GOV.UK/ONS/etc.), url is fixed
//   - 'council'  — published by each council, resolved from field_sources or
//                  routed top-level URL (budget_url/accounts_url/etc.)
//   - 'calculated' — derived, no source
// ──────────────────────────────────────────────────────────────────────────────

const NATIONAL_SOURCES = {
  'council-tax-area': 'https://www.gov.uk/government/statistical-data-sets/live-tables-on-council-tax',
  'council-tax-levels': 'https://www.gov.uk/government/statistics/council-tax-levels-set-by-local-authorities-in-england-2025-to-2026',
  'revenue-outturn': 'https://www.gov.uk/government/collections/local-authority-revenue-expenditure-and-financing',
  'ons-population': 'https://www.ons.gov.uk/peoplepopulationandcommunity/populationandmigration/populationestimates',
  'defra-waste': 'https://www.gov.uk/government/statistical-data-sets/env18-local-authority-collected-waste-annual-results-tables',
  'dft-road-condition': 'https://www.gov.uk/government/statistical-data-sets/road-condition-statistics-data-tables-rdc',
  'dft-road-length': 'https://www.gov.uk/government/statistical-data-sets/road-length-statistics-rdl',
  'ofsted-inspections': 'https://www.gov.uk/government/publications/five-year-ofsted-inspection-data',
  'lgbce-electoral': 'https://www.lgbce.org.uk/electoral-data',
  'workforce-lga': 'https://www.ons.gov.uk/employmentandlabourmarket/peopleinwork/publicsectorpersonnel/datasets/publicsectoremploymentreferencetable',
  'capital-expenditure': 'https://www.gov.uk/government/collections/local-authority-capital-expenditure-receipts-and-financing',
  'contracts-finder': 'https://www.contractsfinder.service.gov.uk/',
  'housing-supply': 'https://www.gov.uk/government/statistical-data-sets/live-tables-on-net-supply-of-housing',
};

// Each entry maps a field path to its expected origin:
//   { origin: 'national', dataset: 'revenue-outturn' }  — always national URL
//   { origin: 'council', urlRoute: 'budget_url', fieldSourceKey: 'service_spending' }
//       Prefers council.field_sources[fieldSourceKey] if present,
//       else falls back to council.detailed[urlRoute].
//   { origin: 'calculated' }  — no URL to check
const FIELD_ORIGINS = {
  // ── Council tax ──
  'council_tax.band_d_2025': { origin: 'national', dataset: 'council-tax-area' },
  'council_tax.band_d_2024': { origin: 'national', dataset: 'council-tax-area' },
  'council_tax.band_d_2023': { origin: 'national', dataset: 'council-tax-area' },
  'council_tax.band_d_2022': { origin: 'national', dataset: 'council-tax-area' },
  'council_tax.band_d_2021': { origin: 'national', dataset: 'council-tax-area' },
  'tax_bands': { origin: 'calculated' },
  'vs_average': { origin: 'calculated' },
  'per_capita_spend': { origin: 'calculated' },
  'per_capita_council_tax': { origin: 'calculated' },

  // ── Budget (RO returns) ──
  'budget.education': { origin: 'national', dataset: 'revenue-outturn' },
  'budget.transport': { origin: 'national', dataset: 'revenue-outturn' },
  'budget.childrens_social_care': { origin: 'national', dataset: 'revenue-outturn' },
  'budget.adult_social_care': { origin: 'national', dataset: 'revenue-outturn' },
  'budget.public_health': { origin: 'national', dataset: 'revenue-outturn' },
  'budget.housing': { origin: 'national', dataset: 'revenue-outturn' },
  'budget.cultural': { origin: 'national', dataset: 'revenue-outturn' },
  'budget.environmental': { origin: 'national', dataset: 'revenue-outturn' },
  'budget.planning': { origin: 'national', dataset: 'revenue-outturn' },
  'budget.central_services': { origin: 'national', dataset: 'revenue-outturn' },
  'budget.other': { origin: 'national', dataset: 'revenue-outturn' },
  'budget.total_service': { origin: 'national', dataset: 'revenue-outturn' },
  'budget.net_current': { origin: 'national', dataset: 'revenue-outturn' },

  // ── Council-published from accounts ──
  'detailed.reserves': { origin: 'council', urlRoute: 'accounts_url', fieldSourceKey: 'reserves' },
  'detailed.salary_bands': { origin: 'council', urlRoute: 'accounts_url', fieldSourceKey: 'salary_bands' },

  // ── Council-published from budget docs ──
  'detailed.service_spending': { origin: 'council', urlRoute: 'budget_url', fieldSourceKey: 'service_spending' },
  'detailed.capital_programme': { origin: 'council', urlRoute: 'budget_url', fieldSourceKey: 'capital_programme' },
  'detailed.budget_gap': { origin: 'council', urlRoute: 'budget_url', fieldSourceKey: 'budget_gap' },
  'detailed.savings_target': { origin: 'council', urlRoute: 'budget_url', fieldSourceKey: 'savings_target' },

  // ── National: Contracts Finder (suppliers) ──
  // Data ORIGIN is Contracts Finder — NOT the council's transparency page.
  // Per-council verifiability comes from the buyer-filtered search URL.
  'detailed.top_suppliers.annual_spend': { origin: 'national', dataset: 'contracts-finder' },

  // ── Council-published: grants (from council transparency pages) ──
  'detailed.grant_payments': { origin: 'council', urlRoute: 'transparency_url', fieldSourceKey: 'grant_payments' },

  // ── National: workforce ──
  'detailed.staff_fte': { origin: 'national', dataset: 'workforce-lga' },

  // ── Council: CEO salary, allowances (from council pay policy) ──
  'detailed.chief_executive_salary': { origin: 'council', urlRoute: 'councillors_url', fieldSourceKey: 'chief_executive_salary' },
  'detailed.chief_executive_total_remuneration': { origin: 'council', urlRoute: 'councillors_url', fieldSourceKey: 'chief_executive_total_remuneration' },
  'detailed.councillor_basic_allowance': { origin: 'council', urlRoute: 'councillors_url', fieldSourceKey: 'councillor_basic_allowance' },
  'detailed.total_allowances_cost': { origin: 'council', urlRoute: 'councillors_url', fieldSourceKey: 'total_allowances_cost' },
  'detailed.councillor_allowances_detail': { origin: 'council', urlRoute: 'councillors_url', fieldSourceKey: 'councillor_allowances_detail' },

  // ── Council: leadership ──
  'detailed.cabinet': { origin: 'council', urlRoute: 'councillors_url', fieldSourceKey: 'cabinet' },
  'detailed.council_leader': { origin: 'council', urlRoute: 'councillors_url', fieldSourceKey: 'council_leader' },
  'detailed.chief_executive': { origin: 'council', urlRoute: 'councillors_url', fieldSourceKey: 'chief_executive' },
  'detailed.total_councillors': { origin: 'national', dataset: 'lgbce-electoral' },

  // ── National service outcomes ──
  'service_outcomes.waste.recycling_rate_percent': { origin: 'national', dataset: 'defra-waste' },
  'detailed.waste_destinations': { origin: 'national', dataset: 'defra-waste' },
  'service_outcomes.roads.condition_good_percent': { origin: 'national', dataset: 'dft-road-condition' },
  'service_outcomes.roads.maintained_miles': { origin: 'national', dataset: 'dft-road-length' },
  'service_outcomes.children_services.ofsted_rating': { origin: 'national', dataset: 'ofsted-inspections' },
  'service_outcomes.housing.homes_built': { origin: 'national', dataset: 'housing-supply' },

  // ── Population ──
  'population': { origin: 'national', dataset: 'ons-population' },
};

// ──────────────────────────────────────────────────────────────────────────────
// URL resolution — mirrors getProvenance() in src/data/provenance.ts
// ──────────────────────────────────────────────────────────────────────────────

function resolveFieldUrl(fieldPath, council) {
  const origin = FIELD_ORIGINS[fieldPath];
  if (!origin) return { status: 'unknown_field' };
  if (origin.origin === 'calculated') return { status: 'calculated' };
  if (origin.origin === 'national') {
    return {
      status: 'resolved',
      origin: 'national',
      dataset: origin.dataset,
      url: NATIONAL_SOURCES[origin.dataset],
    };
  }
  // origin === 'council'
  const d = council.detailed || {};
  // 1. Per-council field_sources (preferred)
  if (origin.fieldSourceKey && d.field_sources?.[origin.fieldSourceKey]?.url) {
    return {
      status: 'resolved',
      origin: 'council:field_sources',
      url: d.field_sources[origin.fieldSourceKey].url,
      title: d.field_sources[origin.fieldSourceKey].title,
    };
  }
  // 2. Fall back to the routed top-level URL
  if (origin.urlRoute && d[origin.urlRoute]) {
    return {
      status: 'resolved',
      origin: 'council:routed',
      url: d[origin.urlRoute],
      routedVia: origin.urlRoute,
    };
  }
  // 3. No source available
  return { status: 'unverifiable', needs: origin.fieldSourceKey || origin.urlRoute };
}

// ──────────────────────────────────────────────────────────────────────────────
// Silent-404 detection
// ──────────────────────────────────────────────────────────────────────────────

const NOT_FOUND_PATHS = ['/page-not-found', '/not-found', '/404', '/error/404', '/error-404', '/pagenotfound'];
const NOT_FOUND_BODY = [
  '<title>Page not found',
  '<h1>Page not found',
  '<title>404',
  '<h1>404',
  'The page you requested is not available',
  'the page you are looking for cannot be found',
];

async function checkUrl(url) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      method: 'GET',
      signal: ctrl.signal,
      redirect: 'follow',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; CivAccount-ProvenanceAudit/1.0; +https://civaccount.co.uk)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
    });
    clearTimeout(timer);
    const finalUrl = res.url || url;

    if (!res.ok) {
      return { url, status: res.status, ok: false };
    }

    // Read up to 8KB of body for silent-404 detection
    let body = '';
    const ct = res.headers.get('content-type') || '';
    if (ct.includes('text/html')) {
      try {
        const reader = res.body?.getReader();
        if (reader) {
          const chunks = [];
          let total = 0;
          while (total < 8192) {
            const { value, done } = await reader.read();
            if (done) break;
            chunks.push(value);
            total += value.length;
          }
          reader.cancel().catch(() => {});
          const merged = new Uint8Array(chunks.reduce((n, c) => n + c.length, 0));
          let off = 0;
          for (const c of chunks) { merged.set(c, off); off += c.length; }
          body = new TextDecoder().decode(merged);
        }
      } catch { /* ignore */ }
    }

    // Silent-404 detection
    try {
      const path = new URL(finalUrl).pathname.toLowerCase();
      for (const pat of NOT_FOUND_PATHS) {
        if (path.includes(pat)) {
          return { url, status: res.status, ok: false, silent_404: true, reason: `redirected to ${pat}`, final_url: finalUrl };
        }
      }
    } catch { /* unparseable url, skip */ }
    const head = body.slice(0, 4000);
    for (const marker of NOT_FOUND_BODY) {
      if (head.includes(marker)) {
        return { url, status: res.status, ok: false, silent_404: true, reason: `body contains "${marker.slice(0, 30)}"`, final_url: finalUrl };
      }
    }

    return { url, status: res.status, ok: true, final_url: finalUrl, redirected: finalUrl !== url };
  } catch (err) {
    clearTimeout(timer);
    const msg = err.name === 'AbortError' ? 'timeout' : (err.code || err.message);
    return { url, status: 0, ok: false, error: msg };
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// Main
// ──────────────────────────────────────────────────────────────────────────────

function fieldValuePresent(fieldPath, council) {
  // A field is "on the page" only if the council actually has that data.
  // E.g. top_suppliers is rendered only if detailed.top_suppliers is non-empty.
  const d = council.detailed || {};
  const ct = council.council_tax || {};
  const b = council.budget || {};
  switch (fieldPath) {
    // Council tax
    case 'council_tax.band_d_2025': return ct.band_d_2025 != null;
    case 'council_tax.band_d_2024': return ct.band_d_2024 != null;
    case 'council_tax.band_d_2023': return ct.band_d_2023 != null;
    case 'council_tax.band_d_2022': return ct.band_d_2022 != null;
    case 'council_tax.band_d_2021': return ct.band_d_2021 != null;
    // Budget
    case 'budget.education': return b.education != null;
    case 'budget.transport': return b.transport != null;
    case 'budget.childrens_social_care': return b.childrens_social_care != null;
    case 'budget.adult_social_care': return b.adult_social_care != null;
    case 'budget.public_health': return b.public_health != null;
    case 'budget.housing': return b.housing != null;
    case 'budget.cultural': return b.cultural != null;
    case 'budget.environmental': return b.environmental != null;
    case 'budget.planning': return b.planning != null;
    case 'budget.central_services': return b.central_services != null;
    case 'budget.other': return b.other != null;
    case 'budget.total_service': return b.total_service != null;
    case 'budget.net_current': return b.net_current != null;
    // Detailed scalar/boolean presence via _has or direct field
    case 'detailed.reserves': return d.reserves != null;
    case 'detailed.salary_bands': return d._has?.salary_bands;
    case 'detailed.service_spending': return d._has?.service_spending;
    case 'detailed.capital_programme': return d.capital_programme != null;
    case 'detailed.budget_gap': return d.budget_gap != null;
    case 'detailed.savings_target': return d.savings_target != null;
    case 'detailed.top_suppliers.annual_spend': return d._has?.top_suppliers;
    case 'detailed.grant_payments': return d._has?.grant_payments;
    case 'detailed.staff_fte': return d.staff_fte != null;
    case 'detailed.chief_executive_salary': return d.chief_executive_salary != null;
    case 'detailed.chief_executive_total_remuneration': return d.chief_executive_total_remuneration != null;
    case 'detailed.councillor_basic_allowance': return d.councillor_basic_allowance != null;
    case 'detailed.total_allowances_cost': return d.total_allowances_cost != null;
    case 'detailed.councillor_allowances_detail': return d._has?.councillor_allowances_detail;
    case 'detailed.cabinet': return d._has?.cabinet;
    case 'detailed.council_leader': return d.council_leader != null;
    case 'detailed.chief_executive': return d.chief_executive != null;
    case 'detailed.total_councillors': return d.total_councillors != null;
    case 'detailed.waste_destinations': return d._has?.waste_destinations;
    case 'service_outcomes.waste.recycling_rate_percent': return d._has?.service_outcomes;
    case 'service_outcomes.roads.condition_good_percent': return d._has?.service_outcomes;
    case 'service_outcomes.roads.maintained_miles': return d._has?.service_outcomes;
    case 'service_outcomes.children_services.ofsted_rating': return d._has?.service_outcomes;
    case 'service_outcomes.housing.homes_built': return d._has?.service_outcomes;
    case 'population': return council.population != null;
    default: return false;
  }
}

async function main() {
  const councils = loadCouncils();
  console.log(`Loaded ${councils.length} councils`);

  const fields = FIELD_FILTER || Object.keys(FIELD_ORIGINS);
  console.log(`Auditing ${fields.length} fields × ${councils.length} councils`);

  // Build the (field, council) → resolved-url map
  const resolutions = []; // {field, council, status, url?, origin?, routedVia?, ...}
  const urlToEntries = new Map(); // url → [{ field, council, ... }]

  for (const council of councils) {
    for (const field of fields) {
      if (!fieldValuePresent(field, council)) continue; // skip fields this council doesn't render
      const r = resolveFieldUrl(field, council);
      resolutions.push({ field, council: council.name, type: council.type, ...r });
      if (r.status === 'resolved' && r.url) {
        if (!urlToEntries.has(r.url)) urlToEntries.set(r.url, []);
        urlToEntries.get(r.url).push({ field, council: council.name, origin: r.origin, routedVia: r.routedVia });
      }
    }
  }

  console.log(`  ${resolutions.length} (field,council) pairs — ${resolutions.filter((r) => r.status === 'resolved').length} resolved`);
  const unverifiable = resolutions.filter((r) => r.status === 'unverifiable');
  console.log(`  ${unverifiable.length} unverifiable (missing both field_sources and routed URL)`);
  console.log(`  ${resolutions.filter((r) => r.status === 'calculated').length} calculated (no source needed)`);
  console.log(`  ${urlToEntries.size} unique URLs to validate\n`);

  // Check each unique URL
  const urls = [...urlToEntries.keys()];
  const results = new Map(); // url → check result
  let checked = 0;

  for (let i = 0; i < urls.length; i += CONCURRENCY) {
    const batch = urls.slice(i, i + CONCURRENCY);
    const batchResults = await Promise.all(batch.map(checkUrl));
    for (let j = 0; j < batch.length; j++) {
      results.set(batch[j], batchResults[j]);
    }
    checked += batch.length;
    const broken = [...results.values()].filter((r) => !r.ok).length;
    process.stdout.write(`\r  Checked ${checked}/${urls.length} URLs (${broken} broken)`);
    if (i + CONCURRENCY < urls.length) await new Promise((r) => setTimeout(r, DELAY_MS));
  }
  console.log();

  // Build the per-(field, council) status
  const audit = resolutions.map((r) => {
    if (r.status === 'resolved' && r.url) {
      const check = results.get(r.url);
      return { ...r, check };
    }
    return r;
  });

  // Summaries
  const okResolved = audit.filter((a) => a.status === 'resolved' && a.check?.ok).length;
  const brokenResolved = audit.filter((a) => a.status === 'resolved' && !a.check?.ok);
  const silent = brokenResolved.filter((a) => a.check?.silent_404);
  const hard = brokenResolved.filter((a) => a.check?.status >= 400);
  const unverified = audit.filter((a) => a.status === 'unverifiable');

  console.log('\n═══ PROVENANCE AUDIT ═══');
  console.log(`  Total (field × council) pairs: ${audit.length}`);
  console.log(`  ✓ Resolved, URL live:          ${okResolved}`);
  console.log(`  ✗ Silent 404:                  ${silent.length}  ← worst case`);
  console.log(`  ✗ Hard 404 / HTTP >= 400:      ${hard.length}`);
  console.log(`  ✗ Other broken (timeout/etc.): ${brokenResolved.length - silent.length - hard.length}`);
  console.log(`  ? Unverifiable (no URL):       ${unverified.length}`);
  console.log(`  · Calculated (no URL needed):  ${audit.filter((a) => a.status === 'calculated').length}`);

  // Group broken URLs by council-impact
  const brokenByUrl = new Map();
  for (const b of brokenResolved) {
    if (!brokenByUrl.has(b.check.url)) {
      brokenByUrl.set(b.check.url, { check: b.check, entries: [] });
    }
    brokenByUrl.get(b.check.url).entries.push({ council: b.council, field: b.field, origin: b.origin, routedVia: b.routedVia });
  }

  // Top 20 broken URLs by council count
  const topBroken = [...brokenByUrl.entries()]
    .sort((a, b) => b[1].entries.length - a[1].entries.length)
    .slice(0, 20);
  if (topBroken.length > 0) {
    console.log('\n═══ TOP BROKEN URLS (by council impact) ═══');
    for (const [url, { check, entries }] of topBroken) {
      const councilCount = new Set(entries.map((e) => e.council)).size;
      const reason = check.silent_404 ? `silent-404: ${check.reason}` : `HTTP ${check.status} ${check.error || ''}`.trim();
      console.log(`  [${councilCount} councils] ${url}`);
      console.log(`     ↳ ${reason}`);
      const fields = [...new Set(entries.map((e) => e.field))];
      console.log(`     ↳ fields: ${fields.slice(0, 3).join(', ')}${fields.length > 3 ? ` (+${fields.length - 3})` : ''}`);
    }
  }

  // Unverifiable summary
  const unverifiableByField = {};
  for (const u of unverified) {
    const key = `${u.field} (needs: ${u.needs})`;
    unverifiableByField[key] = (unverifiableByField[key] || 0) + 1;
  }
  if (Object.keys(unverifiableByField).length > 0) {
    console.log('\n═══ UNVERIFIABLE FIELDS (needing field_sources or routed URL) ═══');
    const sorted = Object.entries(unverifiableByField).sort((a, b) => b[1] - a[1]);
    for (const [key, n] of sorted) {
      console.log(`  ${n.toString().padStart(4)}  ${key}`);
    }
  }

  // Write full report
  if (!existsSync(REPORTS_DIR)) mkdirSync(REPORTS_DIR, { recursive: true });
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const report = {
    generated: new Date().toISOString(),
    summary: {
      field_council_pairs: audit.length,
      ok: okResolved,
      silent_404: silent.length,
      hard_404: hard.length,
      other_broken: brokenResolved.length - silent.length - hard.length,
      unverifiable: unverified.length,
      calculated: audit.filter((a) => a.status === 'calculated').length,
      unique_urls_checked: urls.length,
    },
    broken_urls: [...brokenByUrl.entries()].map(([url, { check, entries }]) => ({
      url,
      status: check.status,
      silent_404: !!check.silent_404,
      reason: check.silent_404 ? check.reason : check.error || `HTTP ${check.status}`,
      final_url: check.final_url,
      councils_affected: new Set(entries.map((e) => e.council)).size,
      fields_affected: [...new Set(entries.map((e) => e.field))],
      entries,
    })),
    unverifiable,
    audit,
  };

  const out = join(REPORTS_DIR, 'provenance-audit-latest.json');
  const stamped = join(REPORTS_DIR, `provenance-audit-${timestamp}.json`);
  writeFileSync(out, JSON.stringify(report, null, 2));
  writeFileSync(stamped, JSON.stringify(report, null, 2));

  console.log(`\nReports written:`);
  console.log(`  ${out}`);
  console.log(`  ${stamped}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
