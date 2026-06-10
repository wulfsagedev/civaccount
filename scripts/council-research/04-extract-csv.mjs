#!/usr/bin/env node
/**
 * 04-extract-csv.mjs — Phase 2 of the per-council research pipeline (CSV half)
 * + the Phase 3.5 per-council Tier-1 cross-check table.
 *
 * Pulls every Tier-1 reference value available for one council from the
 * locally archived GOV.UK / ONS / LGBCE / DEFRA bulk CSVs, and prints a
 * side-by-side comparison against what the TypeScript data holds today.
 *
 * Two jobs in one pass:
 *   1. Phase 2 (extract) — `tier1_references` are merged into
 *      extracted-values.json so the populate step can cite them.
 *   2. Phase 3.5 (cross-check) — the console table IS the zero-drift
 *      check the playbook demands before populating: any ✗ row must be
 *      resolved (fix the TS, or document why) before moving on. Column
 *      mappings are copied from validators/source-truth.mjs, so what
 *      passes here passes CI.
 *
 * Why this exists: audit-tier1-drift.mjs is hardcoded to the original
 * NORTH_STAR_22 list and has no --council flag, so every new rollout
 * had to hand-edit it. This is the per-council form.
 *
 * (The original scaffold here planned Socrata/360Giving/spending-CSV
 * aggregation. Grants were stripped from districts in the Bradford
 * strip-list and suppliers resolve via Contracts Finder nationally, so
 * Tier-1 referencing is what Phase 2's CSV half actually needs for the
 * remaining rollouts.)
 *
 * Usage:
 *   node scripts/council-research/04-extract-csv.mjs --council=Basildon
 *
 * Spec: NORTH-STAR.md §6 Phase 2 + Phase 3.5; validators/source-truth.mjs
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { normalizeCouncilName } from '../validate/lib/normalize.mjs';
import { startRun } from './lib/journal.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..', '..');
const DATA_DIR = join(REPO_ROOT, 'src', 'data', 'councils');
const BULK_DIR = join(DATA_DIR, 'pdfs', 'gov-uk-bulk-data');
const RA_DIR = join(DATA_DIR, 'pdfs', 'gov-uk-ra-data');

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const m = a.match(/^--([^=]+)(?:=(.*))?$/);
    return m ? [m[1], m[2] ?? true] : [a, true];
  }),
);

if (!args.council) {
  console.error('Usage: node 04-extract-csv.mjs --council=<name>');
  process.exit(2);
}

const councilName = String(args.council);
function slugify(n) {
  return n.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}
const slug = slugify(councilName);
const councilDir = join(DATA_DIR, 'pdfs', 'council-pdfs', slug);

// ── CSV plumbing (same semantics as validators/source-truth.mjs) ─────
function parseCsvLine(line) {
  const result = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') inQuotes = !inQuotes;
    else if (ch === ',' && !inQuotes) { result.push(cur); cur = ''; }
    else cur += ch;
  }
  result.push(cur);
  return result;
}

function loadSimpleCsv(filename) {
  const path = join(BULK_DIR, filename);
  if (!existsSync(path)) return null;
  const lines = readFileSync(path, 'utf-8').split('\n').filter((l) => l.trim());
  const header = parseCsvLine(lines[0]).map((h) => h.trim());
  return lines.slice(1).map((l) => {
    const row = parseCsvLine(l);
    const o = {};
    header.forEach((h, i) => { o[h] = (row[i] || '').trim(); });
    return o;
  });
}

/** name-keyed lookup using the shared normaliser. */
function byName(rows) {
  const idx = new Map();
  for (const r of rows || []) {
    if (r.name) idx.set(normalizeCouncilName(r.name), r);
  }
  return (name) => idx.get(normalizeCouncilName(name)) || null;
}

/** RA CSVs: header at line 9, data from line 10, ONS code in col 1. */
function loadRaRow(filename, valueColumns, ons) {
  const path = join(RA_DIR, filename);
  if (!existsSync(path)) return null;
  const lines = readFileSync(path, 'utf-8').split('\n');
  if (lines.length < 12) return null;
  const header = parseCsvLine(lines[9]);
  const colMap = {};
  for (let i = 0; i < header.length; i++) {
    const h = header[i].trim();
    if (valueColumns[h]) colMap[valueColumns[h]] = i;
  }
  for (let r = 10; r < lines.length; r++) {
    const row = parseCsvLine(lines[r]);
    if ((row[1] || '').trim() !== ons) continue;
    const entry = {};
    for (const [field, col] of Object.entries(colMap)) {
      const v = parseFloat((row[col] || '').trim());
      if (!isNaN(v)) entry[field] = v;
    }
    return entry;
  }
  return null;
}

const RA1_COLUMNS = {
  'TOTAL EDUCATION SERVICES': 'education',
  'TOTAL HIGHWAYS AND TRANSPORT SERVICES': 'transport',
  "TOTAL CHILDREN'S SOCIAL CARE": 'childrens_social_care',
  'TOTAL ADULT SOCIAL CARE': 'adult_social_care',
  'TOTAL PUBLIC HEALTH': 'public_health',
  'TOTAL HOUSING SERVICES (GFRA only)': 'housing',
  'TOTAL CULTURAL AND RELATED SERVICES': 'cultural',
  'TOTAL ENVIRONMENTAL AND REGULATORY SERVICES': 'environmental',
  'TOTAL PLANNING AND DEVELOPMENT SERVICES': 'planning',
  'TOTAL CENTRAL SERVICES': 'central_services',
  'TOTAL OTHER SERVICES': 'other',
  'TOTAL SERVICE EXPENDITURE': 'total_service',
};

// ── Current TS values ────────────────────────────────────────────────
function currentTs() {
  const TS_FILES = ['county-councils.ts', 'districts.ts', 'metropolitan.ts', 'unitary.ts', 'london-boroughs.ts'];
  for (const f of TS_FILES) {
    const path = join(DATA_DIR, f);
    if (!existsSync(path)) continue;
    const src = readFileSync(path, 'utf8');
    const nameIdx = src.indexOf(`\n    name: "${councilName}",`);
    if (nameIdx === -1) continue;
    const nextIdx = src.indexOf('\n  },\n  {\n    ons_code:', nameIdx);
    // ons_code precedes name in each record — open the slice at the
    // record's opening brace, not at the name line.
    const openIdx = src.lastIndexOf('{', nameIdx);
    const block = src.slice(openIdx, nextIdx === -1 ? src.length : nextIdx);
    const get = (re) => { const m = block.match(re); return m ? parseFloat(m[1]) : null; };
    return {
      ons_code: block.match(/ons_code: "([^"]+)"/)?.[1] ?? null,
      band_d: Object.fromEntries(
        [2021, 2022, 2023, 2024, 2025, 2026].map((y) => [
          `band_d_${y}`, get(new RegExp(`band_d_${y}:\\s*([\\d.]+)`)),
        ]),
      ),
      budget: Object.fromEntries(
        Object.values(RA1_COLUMNS).concat(['net_current']).map((f) => [
          f, get(new RegExp(`\\n\\s{6}${f}:\\s*(-?[\\d.]+)`)),
        ]),
      ),
      total_councillors: get(/total_councillors:\s*(\d+)/),
      capital_programme: get(/capital_programme:\s*(\d+)/),
    };
  }
  return null;
}

// ── Main ─────────────────────────────────────────────────────────────
const run = startRun('04-extract-csv', councilName);

function main() {
  // FAIL-LOUD: the core reference files are preconditions, not options.
  // A missing CSV silently shrinks the cross-check table — fewer checks
  // must never read as "zero drift".
  const REQUIRED = [
    join(BULK_DIR, 'parsed-area-band-d.csv'),
    join(RA_DIR, 'RA_Part1_LA_Data.csv'),
  ];
  const missingRequired = REQUIRED.filter((p) => !existsSync(p));
  if (missingRequired.length > 0) {
    console.error('✗ Required Tier-1 reference file(s) missing — refusing to run a weakened cross-check:');
    for (const p of missingRequired) console.error(`    ${p}`);
    console.error('  Restore the parsed GOV.UK data (see scripts/parse-area-band-d.py / source-manifest.json).');
    run.finish('failed', { reason: 'required reference CSVs missing', missing: missingRequired });
    process.exit(2);
  }
  const SUPPLEMENTARY = ['parsed-population.csv', 'parsed-lgbce-councillors.csv', 'parsed-capital-expenditure.csv', 'parsed-waste.csv'];
  const missingSupplementary = SUPPLEMENTARY.filter((f) => !existsSync(join(BULK_DIR, f)));
  for (const f of missingSupplementary) {
    console.warn(`  ⚠ supplementary reference missing: ${f} — its rows are OMITTED from this table`);
  }

  const ts = currentTs();
  if (!ts) {
    console.error(`✗ Council "${councilName}" not found in data files.`);
    run.finish('failed', { reason: 'council not found in TS' });
    process.exit(2);
  }
  const ons = ts.ons_code;
  console.log(`Tier-1 references: ${councilName} (${ons})`);

  const refs = { _meta: { generated_at: new Date().toISOString(), ons_code: ons, missing_supplementary: missingSupplementary } };
  const rows = [];

  // Band D (ons-keyed, exact match expected)
  const area = loadSimpleCsv('parsed-area-band-d.csv');
  const areaRow = (area || []).find((r) => r.ons_code === ons) || null;
  if (areaRow) {
    refs.band_d = {};
    for (const y of [2021, 2022, 2023, 2024, 2025, 2026]) {
      const ref = parseFloat(areaRow[`band_d_${y}`]);
      if (isNaN(ref)) continue;
      refs.band_d[`band_d_${y}`] = ref;
      rows.push({ field: `band_d_${y}`, ts: ts.band_d[`band_d_${y}`], ref, tol: 'exact', src: 'parsed-area-band-d.csv' });
    }
  }

  // RA budgets (±10% per source-truth)
  const ra1 = loadRaRow('RA_Part1_LA_Data.csv', RA1_COLUMNS, ons);
  const ra2 = loadRaRow('RA_Part2_LA_Data.csv', { 'NET CURRENT EXPENDITURE': 'net_current' }, ons);
  if (ra1) {
    refs.budget = { ...ra1, ...(ra2 || {}) };
    for (const [field, ref] of Object.entries(refs.budget)) {
      rows.push({ field: `budget.${field}`, ts: ts.budget[field], ref, tol: '±10%', src: 'RA Part 1/2' });
    }
  }

  // Name-keyed singles
  const popRow = byName(loadSimpleCsv('parsed-population.csv'))(councilName);
  if (popRow?.population) {
    refs.population = parseFloat(popRow.population);
    rows.push({ field: 'population', ts: null, ref: refs.population, tol: 'info', src: 'parsed-population.csv' });
  }
  const cllrRow = byName(loadSimpleCsv('parsed-lgbce-councillors.csv'))(councilName);
  if (cllrRow?.total_councillors) {
    refs.total_councillors = parseInt(cllrRow.total_councillors, 10);
    rows.push({ field: 'total_councillors', ts: ts.total_councillors, ref: refs.total_councillors, tol: 'exact', src: 'parsed-lgbce-councillors.csv' });
  }
  const capRow = byName(loadSimpleCsv('parsed-capital-expenditure.csv'))(councilName);
  if (capRow?.capital_expenditure_k) {
    refs.capital_expenditure_k = parseFloat(capRow.capital_expenditure_k);
    rows.push({ field: 'capital_programme (k)', ts: ts.capital_programme ? ts.capital_programme / 1000 : null, ref: refs.capital_expenditure_k, tol: '±5%', src: 'parsed-capital-expenditure.csv' });
  }
  const wasteRow = byName(loadSimpleCsv('parsed-waste.csv'))(councilName);
  if (wasteRow?.recycling_rate) {
    refs.recycling_rate = parseFloat(wasteRow.recycling_rate);
    rows.push({ field: 'recycling_rate', ts: null, ref: refs.recycling_rate, tol: 'info', src: 'parsed-waste.csv' });
  }

  // Cross-check table
  console.log('');
  let drift = 0;
  for (const r of rows) {
    let icon = '·';
    if (r.ts != null && r.ref != null && r.tol !== 'info') {
      const ok =
        r.tol === 'exact' ? r.ts === r.ref :
        r.tol === '±10%' ? (r.ref === 0 ? r.ts === 0 : Math.abs(r.ts - r.ref) / Math.abs(r.ref) <= 0.10) :
        r.tol === '±5%' ? (r.ref === 0 ? r.ts === 0 : Math.abs(r.ts - r.ref) / Math.abs(r.ref) <= 0.05) :
        true;
      icon = ok ? '✓' : '✗';
      if (!ok) drift++;
    }
    console.log(`  ${icon} ${r.field.padEnd(28)} TS: ${String(r.ts ?? '—').padStart(12)}   ref: ${String(r.ref ?? '—').padStart(12)}   (${r.tol}, ${r.src})`);
  }

  // Merge into extracted-values.json (create if 03 hasn't run yet).
  mkdirSync(councilDir, { recursive: true });
  const evPath = join(councilDir, 'extracted-values.json');
  let ev = { council: councilName, slug, candidates: {}, chosen: {}, warnings: [] };
  if (existsSync(evPath)) { try { ev = JSON.parse(readFileSync(evPath, 'utf8')); } catch {} }
  ev.tier1_references = refs;
  ev.tier1_drift_count = drift;
  writeFileSync(evPath, JSON.stringify(ev, null, 2) + '\n');

  // Status
  const statusDir = join(REPO_ROOT, 'scripts', 'council-research', 'status');
  mkdirSync(statusDir, { recursive: true });
  const statusPath = join(statusDir, `${slug}.json`);
  let current = {};
  if (existsSync(statusPath)) { try { current = JSON.parse(readFileSync(statusPath, 'utf8')); } catch {} }
  writeFileSync(statusPath, JSON.stringify({
    council: councilName, slug, ...current,
    phases: { ...(current.phases || {}), phase_3_5_tier1_crosscheck: { done: drift === 0, at: new Date().toISOString(), drift } },
    last_session: new Date().toISOString(),
  }, null, 2) + '\n');

  console.log('');
  if (drift > 0) {
    console.log(`✗ ${drift} field(s) drift from Tier-1 references — resolve before 05-populate (fix the TS or document why).`);
    run.finish('failed', { drift, checks: rows.length, missing_supplementary: missingSupplementary });
    process.exit(1);
  }
  console.log(`✓ Zero Tier-1 drift across ${rows.length} checks. References merged into ${evPath}`);
  run.finish('ok', { drift: 0, checks: rows.length, missing_supplementary: missingSupplementary });
}

main();
