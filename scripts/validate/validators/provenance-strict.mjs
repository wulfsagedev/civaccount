/**
 * provenance-strict.mjs — enforce the v3 integrity rule.
 *
 * For every (field × council) pair that the UI actually renders
 * (per src/data/renderable-fields.ts), check that a valid, live,
 * content-matching citation exists.
 *
 * Strictness progresses by phase:
 *   - Phase 2 (this commit): opt-in via `STRICT_PROVENANCE=1`. Reports
 *     missing citations but does not fail the build.
 *   - Phase 3: Category A fields become hard errors once row-level
 *     citations are wired.
 *   - Phase 4: Category B fields become hard errors once PDFs are
 *     archived with page references.
 *   - Phase 5: Category C fields become hard errors once aggregates
 *     carry `derivation.inputs`.
 *
 * Activation:
 *   STRICT_PROVENANCE=1 node scripts/validate/validate.mjs --strict-provenance
 */

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = join(__dirname, '..', '..', '..');

// Dynamic import of the renderable-fields manifest (TS file). We parse
// it with a light regex — the full TS compiler isn't worth pulling in
// just to read a static list.
function loadRenderableFields() {
  const path = join(PROJECT_ROOT, 'src', 'data', 'renderable-fields.ts');
  if (!existsSync(path)) return [];
  const src = readFileSync(path, 'utf-8');
  const fields = [];
  const re = /\{\s*path:\s*'([^']+)',\s*origin:\s*'([^']+)',\s*(?:dataset_id:\s*'([^']+)',\s*)?(?:csv_column:\s*"([^"]+)"|csv_column:\s*'([^']+)')?/g;
  let m;
  while ((m = re.exec(src)) !== null) {
    fields.push({
      path: m[1],
      origin: m[2],
      dataset_id: m[3] ?? null,
      csv_column: m[4] ?? m[5] ?? null,
    });
  }
  return fields;
}

/**
 * Map a rendered (council, field) pair to whether it has a compliant
 * citation today. In Phase 2 we only have DataProvenance (field-level),
 * not Citation (value-level). This function uses the field-level
 * provenance as a shim until Phase 3 lands Citation per-value.
 */
function classifyFieldStatus(field, council) {
  // Category A fields have an achievable citation path (row = ONS code,
  // column = manifest). Ship-readiness depends on Phase 3 wiring.
  if (field.origin === 'national_csv') {
    return {
      compliant: true,               // source exists + row key is known
      row_level_wired: false,        // Phase 3 will flip this to true
      reason: 'National CSV source; row-level citation builder not yet wired',
    };
  }
  if (field.origin === 'calculated') {
    return { compliant: true, row_level_wired: true, reason: 'Transparent derivation' };
  }
  if (field.origin === 'council_pdf' || field.origin === 'council_html') {
    // Phase 4 work. Has a field-level provenance via field_sources[] for some
    // councils; Phase 4 will add page/selector citation.
    const hasFieldSource = council.detailed?.field_sources?.[field.path.replace(/^detailed\./, '')];
    return {
      compliant: !!hasFieldSource,
      row_level_wired: false,
      reason: hasFieldSource ? 'field_sources[] present; page/selector citation queued for Phase 4' : 'Needs field_sources[] entry',
    };
  }
  if (field.origin === 'aggregate') {
    return { compliant: false, row_level_wired: false, reason: 'Aggregate; Phase 5 derivation.inputs not yet wired. DataValidationNotice rendered on UI.' };
  }
  if (field.origin === 'editorial') {
    return { compliant: false, row_level_wired: false, reason: 'Editorial / LLM content. Needs to be removed, re-sourced, or labelled.' };
  }
  if (field.origin === 'under_review') {
    return { compliant: false, row_level_wired: false, reason: 'Source origin not traced.' };
  }
  if (field.origin === 'removed') {
    return { compliant: true, row_level_wired: true, reason: 'Not rendered' };
  }
  return { compliant: false, row_level_wired: false, reason: 'Unknown origin' };
}

/**
 * Cheap presence check for whether the council actually renders this
 * field. Re-uses the load-councils.mjs _has map for array fields and
 * direct property checks for scalars.
 */
function fieldPresent(field, council) {
  const d = council.detailed || {};
  const b = council.budget || {};
  const ct = council.council_tax || {};
  const so = d.service_outcomes;
  const path = field.path;

  // Split dotted path and traverse
  if (path.startsWith('council_tax.')) {
    const key = path.split('.')[1];
    return ct[key] != null;
  }
  if (path.startsWith('budget.')) {
    const key = path.split('.')[1];
    return b[key] != null;
  }
  if (path === 'population') return council.population != null;
  if (path === 'detailed.waste_destinations') return d._has?.waste_destinations;
  if (path === 'detailed.top_suppliers.annual_spend') return d._has?.top_suppliers;
  if (path === 'detailed.top_suppliers.description') return d._has?.top_suppliers;
  if (path === 'detailed.grant_payments') return d._has?.grant_payments;
  if (path === 'detailed.cabinet') return d._has?.cabinet;
  if (path === 'detailed.councillor_allowances_detail') return d._has?.councillor_allowances_detail;
  if (path === 'detailed.salary_bands') return d._has?.salary_bands;
  if (path === 'detailed.service_spending') return d._has?.service_spending;
  if (path.startsWith('service_outcomes.')) return !!so;
  if (path.startsWith('detailed.')) {
    const key = path.replace('detailed.', '');
    return d[key] != null;
  }
  if (path === 'tax_bands' || path === 'per_capita_spend' || path === 'per_capita_council_tax' || path === 'vs_average' || path === 'council_tax_increase_percent') {
    return !!ct.band_d_2025;
  }
  if (path === 'performance_kpis.status') return false; // removed 2026-04-21
  return false;
}

export function validate(councils, population, report) {
  const fields = loadRenderableFields();
  if (fields.length === 0) {
    report.finding(
      { name: 'SYSTEM', ons_code: '' }, 'provenance-strict', 'manifest_missing', 'error',
      'renderable-fields.ts not readable — strict provenance cannot run',
      'system'
    );
    return;
  }

  const strictMode = process.env.STRICT_PROVENANCE === '1' || process.argv.includes('--strict-provenance');
  const severity = strictMode ? 'error' : 'warning';

  let counted = 0;
  let compliant = 0;
  let rowLevelWired = 0;
  const nonCompliantByField = new Map();

  for (const council of councils) {
    for (const field of fields) {
      if (!fieldPresent(field, council)) continue;
      counted++;
      report.tick();
      const status = classifyFieldStatus(field, council);
      if (status.compliant) compliant++;
      if (status.row_level_wired) rowLevelWired++;
      if (!status.compliant) {
        if (!nonCompliantByField.has(field.path)) nonCompliantByField.set(field.path, { count: 0, reason: status.reason });
        nonCompliantByField.get(field.path).count++;
      }
    }
  }

  // Summary finding — rendered once
  const pctCompliant = counted > 0 ? ((compliant / counted) * 100).toFixed(1) : '0';
  const pctRowLevel = counted > 0 ? ((rowLevelWired / counted) * 100).toFixed(1) : '0';
  report.finding(
    { name: 'SYSTEM', ons_code: '' }, 'provenance-strict', 'coverage_report', 'info',
    `Provenance coverage: ${compliant}/${counted} pairs compliant (${pctCompliant}%); ${rowLevelWired} row-level wired (${pctRowLevel}%)`,
    'system', compliant, counted
  );

  // Per-field non-compliance rollups
  for (const [path, info] of nonCompliantByField.entries()) {
    report.finding(
      { name: `${info.count} councils`, ons_code: '' }, 'provenance-strict', 'field_non_compliant',
      severity,
      `${path} (${info.count} councils): ${info.reason}`,
      path, info.count, 0
    );
  }
}
