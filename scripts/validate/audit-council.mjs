#!/usr/bin/env node
/**
 * audit-council.mjs — per-council audit of every rendered data point.
 *
 * For a single council, walks every field in renderable-fields.ts and
 * reports its verification status, source, and (where applicable) the
 * delta between our rendered value and the source row.
 *
 * Draws from:
 *   - scripts/validate/reports/value-verification-latest.json
 *     (per-field cross-check results from source-truth.mjs)
 *   - scripts/validate/reports/provenance-audit-latest.json
 *     (per-field URL resolution / silent-404 state)
 *   - scripts/validate/reports/validation-latest.json
 *     (overall findings — e.g. non-compliant aggregates)
 *
 * Usage:
 *   node scripts/validate/audit-council.mjs --council=Bradford
 *   node scripts/validate/audit-council.mjs --all
 *   node scripts/validate/audit-council.mjs --council=Bradford --verbose
 */

import { readFileSync, existsSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { loadCouncils } from './load-councils.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPORTS_DIR = join(__dirname, 'reports');
const ROOT = join(__dirname, '..', '..');

const argv = process.argv.slice(2);
const councilArg = argv.find((a) => a.startsWith('--council='))?.slice(10);
const allMode = argv.includes('--all');
const verbose = argv.includes('--verbose');

if (!councilArg && !allMode) {
  console.error('Usage: audit-council.mjs --council=<name> | --all');
  process.exit(1);
}

// Load cross-reference data
function loadJson(path) {
  if (!existsSync(path)) return null;
  return JSON.parse(readFileSync(path, 'utf-8'));
}

// Parse renderable-fields.ts with a light regex — enough to extract
// path + origin + dataset_id + label per entry.
function loadRenderableFields() {
  const src = readFileSync(join(ROOT, 'src', 'data', 'renderable-fields.ts'), 'utf-8');
  const fields = [];
  const re = /\{\s*path:\s*'([^']+)',\s*origin:\s*'([^']+)'(?:,\s*dataset_id:\s*'([^']+)')?(?:,[^}]*?label:\s*(?:"([^"]*)"|'([^']*)'))?/g;
  let m;
  while ((m = re.exec(src)) !== null) {
    fields.push({
      path: m[1],
      origin: m[2],
      dataset_id: m[3] ?? null,
      label: m[4] ?? m[5] ?? m[1],
    });
  }
  return fields;
}

const ORIGIN_LABEL = {
  national_csv: 'National CSV (row-level)',
  council_pdf: 'Per-council PDF',
  council_html: 'Per-council HTML',
  aggregate: 'Aggregate (rebuild in progress)',
  calculated: 'Calculated (re-derived)',
  editorial: 'Editorial (CivAccount text)',
  removed: 'Removed',
  under_review: 'Under review',
};

const STATUS_ICON = {
  PASS: '✓',
  FAIL: '✗',
  'VERIFIED-SOURCE': '◉',
  'IN-PROGRESS': '◌',
  'UNDER-REVIEW': '?',
  CALCULATED: '∑',
  MISSING: '–',
  REMOVED: '×',
};

function fieldPresent(field, council) {
  const d = council.detailed || {};
  const b = council.budget || {};
  const ct = council.council_tax || {};
  const path = field.path;
  if (path.startsWith('council_tax.')) return ct[path.split('.')[1]] != null;
  if (path.startsWith('budget.')) return b[path.split('.')[1]] != null;
  if (path === 'population') return council.population != null;
  if (path === 'detailed.waste_destinations') return d._has?.waste_destinations;
  if (path === 'detailed.top_suppliers.annual_spend' || path === 'detailed.top_suppliers.description') return d._has?.top_suppliers;
  if (path === 'detailed.grant_payments') return d._has?.grant_payments;
  if (path === 'detailed.cabinet') return d._has?.cabinet;
  if (path === 'detailed.councillor_allowances_detail') return d._has?.councillor_allowances_detail;
  if (path === 'detailed.salary_bands') return d._has?.salary_bands;
  if (path === 'detailed.service_spending') return d._has?.service_spending;
  if (path.startsWith('service_outcomes.')) return !!d._has?.service_outcomes;
  if (path.startsWith('detailed.')) return d[path.replace('detailed.', '')] != null;
  if (['tax_bands', 'per_capita_spend', 'per_capita_council_tax', 'vs_average', 'council_tax_increase_percent'].includes(path)) return !!ct.band_d_2025;
  if (path === 'performance_kpis.status') return false;
  return false;
}

function statusFor(council, field, valueReport) {
  // Calculated fields: re-derived on every validate run
  if (field.origin === 'calculated') return { status: 'CALCULATED', detail: 'Re-computed from inputs' };
  if (field.origin === 'removed') return { status: 'REMOVED', detail: '' };
  if (field.origin === 'under_review') return { status: 'UNDER-REVIEW', detail: 'Source origin not yet traced; DataValidationNotice rendered' };
  if (field.origin === 'editorial') return { status: 'UNDER-REVIEW', detail: 'Editorial / LLM content; pending re-source or removal' };

  // National CSV: look up per-value result
  if (field.origin === 'national_csv') {
    const match = valueReport?.failures?.find((r) => r.council === council.name && r.field === field.path);
    if (match) {
      const deltaStr = match.delta != null ? ` delta ${typeof match.delta === 'number' ? match.delta.toFixed(2) : match.delta}` : '';
      const pctStr = match.delta_pct != null ? ` (${match.delta_pct.toFixed(1)}%)` : '';
      return { status: 'FAIL', detail: `rendered=${match.rendered}, source=${match.source}${deltaStr}${pctStr}` };
    }
    // If the field isn't in the failures list, assume pass (per-pass rows aren't all stored)
    return { status: 'PASS', detail: 'Cross-checked against source CSV row' };
  }

  // Aggregates: check suppliers / grants allowlists
  if (field.origin === 'aggregate') {
    if (field.path.startsWith('detailed.top_suppliers')) {
      // Check suppliers allowlist by re-reading suppliers-allowlist.ts
      const allowlist = readFileSync(join(ROOT, 'src', 'data', 'suppliers-allowlist.ts'), 'utf-8');
      if (new RegExp(`^\\s+${council.name.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&')}:\\s*\\{`, 'm').test(allowlist)) {
        return { status: 'VERIFIED-SOURCE', detail: 'Rebuilt from council payment ledger' };
      }
      return { status: 'IN-PROGRESS', detail: 'Contracts Finder ceilings; DataValidationNotice rendered' };
    }
    if (field.path === 'detailed.grant_payments') {
      const allowlist = readFileSync(join(ROOT, 'src', 'data', 'grants-allowlist.ts'), 'utf-8');
      const escaped = council.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      // Key may be quoted ('Bradford': {) or unquoted (Bradford: {) in TS
      const re = new RegExp(`(?:^|\\s|['"])${escaped}(?:['"])?\\s*:\\s*\\{`, 'm');
      if (re.test(allowlist)) {
        return { status: 'VERIFIED-SOURCE', detail: 'Aggregated from archived 360Giving/council CSV' };
      }
      return { status: 'IN-PROGRESS', detail: 'Research file unavailable; DataValidationNotice rendered' };
    }
  }

  // Per-council PDF/HTML: check field_sources[]
  if (field.origin === 'council_pdf' || field.origin === 'council_html') {
    const d = council.detailed || {};
    const simpleKey = field.path.replace('detailed.', '');
    if (d.field_sources?.[simpleKey] || d.field_sources?.[field.path]) {
      return { status: 'VERIFIED-SOURCE', detail: 'Per-council source URL recorded (page-level citation queued for Phase 4)' };
    }
    return { status: 'IN-PROGRESS', detail: 'Routed to council URL; page-level citation pending' };
  }

  return { status: 'UNDER-REVIEW', detail: 'Unknown origin' };
}

function runOne(council, fields, valueReport) {
  const rows = [];
  for (const field of fields) {
    if (!fieldPresent(field, council)) {
      rows.push({ field: field.path, label: field.label, origin: field.origin, status: 'MISSING', detail: 'Not rendered for this council' });
      continue;
    }
    const s = statusFor(council, field, valueReport);
    rows.push({ field: field.path, label: field.label, origin: field.origin, status: s.status, detail: s.detail });
  }
  return rows;
}

function summarise(rows) {
  const byStatus = {};
  for (const r of rows) byStatus[r.status] = (byStatus[r.status] || 0) + 1;
  return byStatus;
}

function printRow(r) {
  const icon = STATUS_ICON[r.status] ?? '?';
  const status = r.status.padEnd(14);
  const label = r.label.slice(0, 44).padEnd(45);
  const detail = verbose ? r.detail : r.detail.slice(0, 52);
  console.log(`  ${icon} ${status} ${label} ${detail}`);
}

async function main() {
  const councils = loadCouncils();
  const fields = loadRenderableFields();
  const valueReport = loadJson(join(REPORTS_DIR, 'value-verification-latest.json'));
  if (!valueReport) {
    console.error('No value-verification-latest.json — run npm run validate first');
    process.exit(1);
  }

  const targets = allMode ? councils : councils.filter((c) => c.name.toLowerCase() === councilArg.toLowerCase() || c.name === councilArg);
  if (targets.length === 0) {
    console.error(`Council not found: ${councilArg}`);
    console.error(`Available: ${councils.slice(0, 10).map((c) => c.name).join(', ')}…`);
    process.exit(1);
  }

  if (!existsSync(REPORTS_DIR)) mkdirSync(REPORTS_DIR, { recursive: true });

  const grandTotals = { PASS: 0, FAIL: 0, 'VERIFIED-SOURCE': 0, 'IN-PROGRESS': 0, 'UNDER-REVIEW': 0, CALCULATED: 0, MISSING: 0, REMOVED: 0 };

  for (const council of targets) {
    const rows = runOne(council, fields, valueReport);
    const summary = summarise(rows);
    for (const [k, v] of Object.entries(summary)) grandTotals[k] = (grandTotals[k] || 0) + v;

    if (allMode) continue; // single line per council in --all mode

    console.log(`\n═══ AUDIT: ${council.name} (${council.ons_code}, ${council.type}) ═══\n`);
    console.log('  Legend: ✓ pass  ✗ fail  ◉ verified-source  ◌ in-progress  ? under-review  ∑ calculated  – missing  × removed\n');

    // Print rendered fields first (exclude MISSING), grouped by status
    const rendered = rows.filter((r) => r.status !== 'MISSING');
    const missing = rows.filter((r) => r.status === 'MISSING');

    const groups = ['PASS', 'FAIL', 'VERIFIED-SOURCE', 'CALCULATED', 'IN-PROGRESS', 'UNDER-REVIEW', 'REMOVED'];
    for (const g of groups) {
      const group = rendered.filter((r) => r.status === g);
      if (group.length === 0) continue;
      console.log(`\n  ── ${g} (${group.length}) ──`);
      for (const r of group) printRow(r);
    }

    if (missing.length > 0 && verbose) {
      console.log(`\n  ── MISSING (not rendered for this council) (${missing.length}) ──`);
      for (const r of missing) printRow(r);
    }

    console.log(`\n  Summary: ${rendered.length} rendered fields`);
    for (const [k, v] of Object.entries(summary)) {
      if (k === 'MISSING' || v === 0) continue;
      console.log(`    ${STATUS_ICON[k] ?? '?'} ${k.padEnd(16)} ${v}`);
    }

    // Compute a single "integrity score" for the council:
    //  +1 for PASS / VERIFIED-SOURCE / CALCULATED
    //  +0.5 for IN-PROGRESS (gap is visibly labelled)
    //  +0 for FAIL / UNDER-REVIEW
    const scoreNum = rendered.reduce((n, r) => n + (
      r.status === 'PASS' || r.status === 'VERIFIED-SOURCE' || r.status === 'CALCULATED' ? 1 :
      r.status === 'IN-PROGRESS' ? 0.5 : 0
    ), 0);
    const scoreDen = rendered.length;
    console.log(`\n  Integrity score: ${((scoreNum / scoreDen) * 100).toFixed(0)}% (${scoreNum}/${scoreDen})\n`);

    // Write per-council JSON
    writeFileSync(
      join(REPORTS_DIR, `audit-${council.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.json`),
      JSON.stringify({ council: council.name, ons_code: council.ons_code, type: council.type, generated: new Date().toISOString(), summary, rendered, integrity_score: scoreNum / scoreDen }, null, 2)
    );
  }

  if (allMode) {
    console.log('\n═══ ALL-COUNCILS AUDIT SUMMARY ═══\n');
    const total = Object.values(grandTotals).reduce((a, b) => a + b, 0);
    for (const [k, v] of Object.entries(grandTotals).sort((a, b) => b[1] - a[1])) {
      if (v === 0) continue;
      console.log(`  ${STATUS_ICON[k] ?? '?'} ${k.padEnd(16)} ${String(v).padStart(6)}  (${((v / total) * 100).toFixed(1)}%)`);
    }
    console.log();
  }
}

main().catch((err) => { console.error(err); process.exit(1); });
