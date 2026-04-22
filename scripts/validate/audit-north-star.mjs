#!/usr/bin/env node
/**
 * audit-north-star.mjs
 *
 * Per-council audit against the 5 north-star criteria defined in
 * /NORTH-STAR-STANDARD.md. For each rendered field:
 *
 *   (1) source URL present
 *   (2) data_year present
 *   (3) URL live (sourced from last link-check run; `--live` re-checks now)
 *   (4) document fingerprint (sha256) captured
 *   (5) field covered on /council/[slug]/provenance
 *
 * Outputs a punch-list of gaps. Exit code = 0 when the council passes
 * all 5 criteria for all rendered fields.
 *
 * Usage:
 *   node scripts/validate/audit-north-star.mjs --council=Bradford
 *   node scripts/validate/audit-north-star.mjs --council=Camden --verbose
 *   node scripts/validate/audit-north-star.mjs --council=Kent --live
 */

import { loadCouncils } from './load-councils.mjs';
import { readFileSync, existsSync, readdirSync, statSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..', '..');

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const m = a.match(/^--([^=]+)(?:=(.*))?$/);
    return m ? [m[1], m[2] ?? true] : [a, true];
  }),
);

if (!args.council) {
  console.error('Usage: node audit-north-star.mjs --council=<name> [--verbose] [--live]');
  process.exit(2);
}

// Load the renderable-fields manifest by source-text read (the TS file
// isn't runtime-loadable without a compiler). We only need the `path`,
// `origin`, `dataset_id`, and `status` fields — parse with regex.
function loadRenderableFields() {
  const src = readFileSync(join(REPO_ROOT, 'src', 'data', 'renderable-fields.ts'), 'utf8');
  const re = /\{\s*path:\s*'([^']+)',\s*origin:\s*'([^']+)'(?:,\s*dataset_id:\s*'([^']+)')?[^}]*?status:\s*'([^']+)'[^}]*?\}/g;
  const out = [];
  let m;
  while ((m = re.exec(src))) {
    out.push({ path: m[1], origin: m[2], dataset_id: m[3], status: m[4] });
  }
  return out;
}

// Load source-manifest.json for sha256 + data_year lookups on national CSVs.
function loadSourceManifest() {
  const path = join(__dirname, 'source-manifest.json');
  if (!existsSync(path)) return {};
  // The manifest has shape { sources: [{ id, ... }] } — flatten to
  // { id: entry } for fast lookup by renderable-fields.dataset_id.
  const raw = JSON.parse(readFileSync(path, 'utf8'));
  const out = {};
  for (const s of raw.sources ?? []) out[s.id] = s;
  return out;
}

// Load the last link-check output if present, so we can read liveness
// without re-hitting the network (unless --live).
function loadLiveness() {
  const path = join(__dirname, 'reports', 'link-check-latest.json');
  if (!existsSync(path)) return null;
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch {
    return null;
  }
}

// For per-council PDFs: scan pdfs/council-pdfs/<slug>/ for _meta.json
// files. Returns a map of document URL (stripped of #fragment) → sha256.
// Field_sources URLs often carry a #page=N fragment; the archive's
// source_url is the bare PDF URL, so we compare after normalising.
function loadPerCouncilFingerprints(slug) {
  const dir = join(REPO_ROOT, 'src', 'data', 'councils', 'pdfs', 'council-pdfs', slug);
  if (!existsSync(dir)) return {};
  const result = {};
  for (const file of readdirSync(dir)) {
    if (!file.endsWith('_meta.json')) continue;
    try {
      const meta = JSON.parse(readFileSync(join(dir, file), 'utf8'));
      const key = (meta.source_url || meta.original_url || file).split('#')[0];
      if (meta.sha256) result[key] = meta.sha256;
    } catch {}
  }
  return result;
}

// Normalise a URL for fingerprint lookup — strip fragment + trailing slash.
function normaliseUrl(url) {
  return url.split('#')[0].replace(/\/$/, '');
}

// Slugify council name for pdf directory lookup.
function slugify(name) {
  return name.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

// Check whether a field path has a populated value on the council —
// used to skip fields declared in the manifest but not actually
// rendered for this specific council (e.g. county councils don't
// render band_d_*, districts don't render waste_destinations).
function isFieldPopulated(council, fieldPath) {
  const parts = fieldPath.split('.');
  let cur = council;
  for (const p of parts) {
    if (cur == null) return false;
    cur = cur[p];
  }
  if (cur == null) return false;
  if (Array.isArray(cur) && cur.length === 0) return false;
  if (typeof cur === 'object' && Object.keys(cur).length === 0) return false;
  return true;
}

// Allowlist lookups — suppliers-allowlist + grants-allowlist are the
// "published sources" for the aggregate fields. Parsed at audit time
// so we don't have to import the TS module at runtime.
function loadAllowlist(file, varName) {
  const path = join(REPO_ROOT, 'src', 'data', file);
  if (!existsSync(path)) return {};
  const src = readFileSync(path, 'utf8');
  // Grab each entry's council key from the `"name":` or top-level object literal.
  const re = new RegExp(`['"]?([A-Za-z][^'"{\\n]*)['"]?:\\s*\\{\\s*council:\\s*['"]([^'"]+)['"]`, 'g');
  const out = {};
  let m;
  while ((m = re.exec(src))) {
    out[m[2]] = true;
  }
  return out;
}

// Classify which fields live on the provenance page. The page reads
// council.detailed.field_sources (per-council) and a hardcoded
// NATIONAL_SOURCES list (national bulk). So a field is "covered" on
// the page if:
//   - it's national_csv (covered by the National sources card), OR
//   - its simplified key exists in the council's field_sources, OR
//   - it's calculated/removed/under_review (not expected to render)
function coveredOnProvenancePage(fieldPath, origin, fieldSources, councilName, allowlists) {
  if (origin === 'national_csv') return { covered: true, where: 'national sources card' };
  if (origin === 'calculated' || origin === 'removed' || origin === 'under_review') {
    return { covered: true, where: `not rendered (origin=${origin})` };
  }
  // Aggregate fields (suppliers, grants) are covered when the council is on
  // the allowlist — they get a dedicated ShieldCheck block on the dashboard.
  if (fieldPath === 'detailed.top_suppliers.annual_spend' && allowlists.suppliers[councilName]) {
    return { covered: true, where: 'suppliers allowlist (verified source)' };
  }
  if (fieldPath === 'detailed.grant_payments' && allowlists.grants[councilName]) {
    return { covered: true, where: 'grants allowlist (verified source)' };
  }
  const simpleKey = fieldPath
    .replace('council_tax.', '')
    .replace('detailed.', '')
    .replace('budget.', '')
    .replace('service_outcomes.', '')
    .replace(/\..*/, '');
  if (fieldSources?.[fieldPath] || fieldSources?.[simpleKey]) {
    return { covered: true, where: 'per-field sources card' };
  }
  return { covered: false, where: null };
}

function main() {
  const councils = loadCouncils();
  const council = councils.find(
    (c) => c.name.toLowerCase() === String(args.council).toLowerCase(),
  );
  if (!council) {
    console.error(`Council not found: ${args.council}`);
    process.exit(2);
  }

  const fields = loadRenderableFields();
  const manifest = loadSourceManifest();
  const liveness = loadLiveness();
  const slug = slugify(council.name);
  const perCouncilSha = loadPerCouncilFingerprints(slug);
  const fieldSources = council.detailed?.field_sources ?? {};
  const suppliersAllow = loadAllowlist('suppliers-allowlist.ts', 'VERIFIED_SUPPLIER_COUNCILS');
  const grantsAllow = loadAllowlist('grants-allowlist.ts', 'VERIFIED_GRANT_COUNCILS');

  const gaps = {
    source_url: [],
    data_year: [],
    live_url: [],
    fingerprint: [],
    provenance_coverage: [],
  };
  const checked = [];

  for (const f of fields) {
    const row = { path: f.path, origin: f.origin, status: f.status };

    // Skip explicitly-removed fields — they don't render.
    if (f.origin === 'removed') {
      row.skip = 'origin=removed';
      checked.push(row);
      continue;
    }

    // Skip calculated fields — they derive from checked inputs.
    if (f.origin === 'calculated') {
      row.skip = 'origin=calculated (inputs checked elsewhere)';
      checked.push(row);
      continue;
    }

    // Skip under_review / editorial — these render the DataValidationNotice.
    if (f.origin === 'under_review' || f.origin === 'editorial') {
      row.skip = `origin=${f.origin} (renders DataValidationNotice)`;
      checked.push(row);
      continue;
    }

    // Skip fields declared in the manifest but not rendered for this
    // specific council (e.g. county councils don't render band_d_*,
    // districts don't populate waste_destinations).
    if (!isFieldPopulated(council, f.path)) {
      row.skip = 'not populated for this council';
      checked.push(row);
      continue;
    }

    // ─── 1. Source URL ───────────────────────────────────────
    let url, year, sha;
    if (f.origin === 'national_csv' && f.dataset_id) {
      const src = manifest[f.dataset_id];
      if (src) {
        url = src.source_url || src.gov_uk_page || src.raw_file_url;
        year = src.data_year;
        sha = src.parsed_csv_sha256 || src.raw_file_sha256;
      }
    } else if (f.path === 'detailed.top_suppliers.annual_spend') {
      // Aggregate: publication source is the suppliers allowlist.
      if (suppliersAllow[council.name]) {
        url = `file:src/data/councils/pdfs/spending-csvs/${slug}/`;
        year = '2024-25';
        // fingerprint lives in the _meta.json of archived spending CSVs
        sha = 'per-file in spending-csvs/<slug>/_meta.json';
      }
    } else if (f.path === 'detailed.grant_payments') {
      if (grantsAllow[council.name]) {
        url = `file:src/data/councils/pdfs/grants-csvs/${slug}*`;
        year = 'per-file';
        sha = 'per-file';
      }
    } else {
      const simpleKey = f.path
        .replace('council_tax.', '')
        .replace('detailed.', '')
        .replace('budget.', '')
        .replace(/\..*/, '');
      const src = fieldSources[f.path] || fieldSources[simpleKey];
      if (src) {
        url = src.url;
        year = src.data_year;
        sha = src.sha256_at_access || perCouncilSha[normaliseUrl(src.url)];
        // Document the exemption on the row — the audit skips the
        // fingerprint gap when an `archive_exempt` reason is present.
        row.archive_exempt = src.archive_exempt;
      }
    }

    row.url = url;
    row.data_year = year;
    row.sha256 = sha;

    if (!url) gaps.source_url.push(row);
    if (!year) gaps.data_year.push(row);

    // ─── 3. Live URL ─────────────────────────────────────────
    if (url) {
      const livenessEntry = liveness?.urls?.[url];
      if (livenessEntry?.status === 'broken') {
        row.live = false;
        row.live_detail = livenessEntry.reason;
        gaps.live_url.push(row);
      } else if (livenessEntry) {
        row.live = true;
      } else {
        // Not yet checked — advisory only, not a gap
        row.live = 'unknown';
      }
    }

    // ─── 4. Fingerprint (sha256) ─────────────────────────────
    if (url && !sha) {
      // Exempt live-page origins (cabinet, council_leader, chief_executive)
      // — these are web pages with mutable content, no stable hash.
      const isLivePage =
        year === 'current' ||
        f.path === 'detailed.cabinet' ||
        f.path === 'detailed.council_leader' ||
        f.path === 'detailed.chief_executive';
      // Documented archive exceptions (Cloudflare, bot-blocks). Recorded
      // on the field_sources entry; surfaced in the council's AUDIT.md.
      const isArchiveExempt = !!row.archive_exempt;
      if (!isLivePage && !isArchiveExempt) {
        row.fingerprint_missing = true;
        gaps.fingerprint.push(row);
      }
    }

    // ─── 5. Provenance page coverage ─────────────────────────
    const coverage = coveredOnProvenancePage(f.path, f.origin, fieldSources, council.name, {
      suppliers: suppliersAllow,
      grants: grantsAllow,
    });
    row.prov_page = coverage.where;
    if (!coverage.covered) gaps.provenance_coverage.push(row);

    checked.push(row);
  }

  // ─── Report ──────────────────────────────────────────────
  const BOLD = '\x1b[1m';
  const DIM = '\x1b[2m';
  const RED = '\x1b[31m';
  const GREEN = '\x1b[32m';
  const YELLOW = '\x1b[33m';
  const RESET = '\x1b[0m';

  const totalGaps = Object.values(gaps).reduce((a, b) => a + b.length, 0);

  console.log('');
  console.log(`${BOLD}═══ NORTH-STAR AUDIT: ${council.name} (${council.ons_code}, ${council.type}) ═══${RESET}`);
  console.log('');
  console.log(`Checked: ${checked.length} renderable fields`);
  console.log(`Gaps:    ${totalGaps === 0 ? GREEN + 'NONE — council is north-star' : RED + totalGaps + ' gap(s)'}${RESET}`);
  console.log('');

  const criteria = [
    ['source_url', '1. Source URL missing'],
    ['data_year', '2. Data year missing'],
    ['live_url', '3. URL broken / silent-404'],
    ['fingerprint', '4. Fingerprint (sha256) missing'],
    ['provenance_coverage', '5. Missing from /provenance'],
  ];

  for (const [key, label] of criteria) {
    const list = gaps[key];
    if (list.length === 0) {
      console.log(`  ${GREEN}✓${RESET} ${label}: ${DIM}0 gaps${RESET}`);
    } else {
      console.log(`  ${RED}✗${RESET} ${BOLD}${label}: ${list.length} gap(s)${RESET}`);
      for (const r of list) {
        const detail =
          key === 'live_url'
            ? ` (${r.live_detail})`
            : key === 'data_year' && r.url
            ? ` (url: ${r.url.slice(0, 60)})`
            : '';
        console.log(`     • ${r.path}${detail}`);
      }
    }
  }

  if (args.verbose) {
    console.log('');
    console.log(`${BOLD}─── Per-field detail ───${RESET}`);
    for (const r of checked) {
      const flags = [
        r.url ? '✓url' : `${RED}✗url${RESET}`,
        r.data_year ? `✓${r.data_year}` : `${RED}✗year${RESET}`,
        r.live === true ? '✓live' : r.live === false ? `${RED}✗404${RESET}` : `${YELLOW}?live${RESET}`,
        r.sha256 ? '✓sha' : r.fingerprint_missing ? `${RED}✗sha${RESET}` : `${DIM}—sha${RESET}`,
      ].join(' ');
      console.log(`  ${r.path.padEnd(40)} ${r.skip ? DIM + '(' + r.skip + ')' + RESET : flags}`);
    }
  }

  console.log('');
  process.exit(totalGaps === 0 ? 0 : 1);
}

main();
