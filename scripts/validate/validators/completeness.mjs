/**
 * completeness.mjs — Parity audit + regression detection.
 * Replaces audit-kent-parity.py in Node.js.
 */

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const REPORTS_DIR = join(__dirname, '..', 'reports');

// Kent's 47 field groups — must match audit-kent-parity.py exactly
const KENT_FIELDS = [
  // Core (always present via TS structure)
  ['ons_code', 'Core'],
  ['name', 'Core'],
  ['type', 'Core'],
  ['type_name', 'Core'],
  // Council tax
  ['council_tax', 'Council Tax'],
  // Budget
  ['budget', 'Budget'],
  // URLs
  ['website', 'URLs'],
  ['council_tax_url', 'URLs'],
  ['accounts_url', 'URLs'],
  ['transparency_url', 'URLs'],
  ['councillors_url', 'URLs'],
  ['budget_url', 'URLs'],
  // Leadership
  ['council_leader', 'Leadership'],
  ['chief_executive', 'Leadership'],
  ['total_councillors', 'Leadership'],
  ['cabinet', 'Leadership'],
  // Allowances
  ['councillor_basic_allowance', 'Allowances'],
  ['total_allowances_cost', 'Allowances'],
  // Salary
  ['chief_executive_salary', 'Salary'],
  ['salary_bands', 'Salary'],
  // Allowances detail
  ['councillor_allowances_detail', 'Allowances'],
  // Workforce
  ['staff_fte', 'Workforce'],
  // Transparency
  ['governance_transparency', 'Transparency'],
  ['section_transparency', 'Transparency'],
  ['documents', 'Transparency'],
  ['open_data_links', 'Transparency'],
  ['sources', 'Transparency'],
  // Services
  ['service_outcomes', 'Services'],
  ['service_spending', 'Services'],
  // Suppliers
  ['top_suppliers', 'Suppliers'],
  // Environment
  ['waste_destinations', 'Environment'],
  // Performance
  ['performance_kpis', 'Performance'],
  // Financial strategy
  ['budget_gap', 'Financial Strategy'],
  ['savings_target', 'Financial Strategy'],
  // Financial
  ['grant_payments', 'Financial'],
  // Metadata
  ['last_verified', 'Metadata'],
];

// Fields that districts legitimately don't have
const DISTRICT_EXEMPT = new Set([
  'waste_destinations',
]);

// Core fields checked on the council object itself (not in detailed or _has)
const CORE_FIELDS = new Set(['ons_code', 'name', 'type', 'type_name']);
// Fields checked via council_tax existence
const TAX_FIELDS = new Set(['council_tax']);
// Fields checked via budget existence
const BUDGET_FIELDS = new Set(['budget']);

function hasFieldInCouncil(council, field) {
  // Core fields
  if (CORE_FIELDS.has(field)) {
    return council[field] != null && council[field] !== '';
  }
  // Council tax — check band_d_2025 exists
  if (TAX_FIELDS.has(field)) {
    return council.council_tax?.band_d_2025 != null;
  }
  // Budget — check total_service exists
  if (BUDGET_FIELDS.has(field)) {
    return council.budget?.total_service != null;
  }

  const d = council.detailed || {};

  // Simple value fields in detailed
  if (d[field] != null && d[field] !== '') return true;

  // Array/object fields tracked via _has
  if (d._has?.[field]) return true;

  return false;
}

export function validate(councils, _population, report) {
  const byCouncil = {};
  const byField = {};

  // Initialize field counters
  for (const [field] of KENT_FIELDS) {
    byField[field] = { present: 0, total: 0, missing_councils: [] };
  }

  for (const c of councils) {
    const missing = [];
    let applicable = 0;
    let present = 0;

    for (const [field, category] of KENT_FIELDS) {
      report.tick();

      // Check exemptions
      const exempt = c.type === 'SD' && DISTRICT_EXEMPT.has(field);
      if (exempt) continue;

      applicable++;
      const has = hasFieldInCouncil(c, field);

      if (has) {
        present++;
        byField[field].present++;
      } else {
        missing.push(field);
        byField[field].missing_councils.push(c.name);
      }
      byField[field].total++;
    }

    const score = applicable > 0 ? +(present / applicable * 100).toFixed(1) : 0;

    byCouncil[c.name] = {
      ons_code: c.ons_code,
      type: c.type,
      score,
      present,
      applicable,
      missing,
    };
  }

  // Regression detection — compare against previous run.
  //
  // INTENTIONAL_REMOVALS records fields that were deliberately removed
  // from a council's data because their source could not be traced to a
  // public document (per the integrity rule in PROVENANCE-INTEGRITY-
  // PLAN.md). Each entry is `<council>|<field>`; matches are excluded
  // from the regression check so the honest removal doesn't read as drift.
  const INTENTIONAL_REMOVALS = new Set([
    // 2026-04-21: Bradford staff_fte removed — no citable source on
    // bradford.gov.uk for a total FTE figure. See
    // pdfs/council-pdfs/bradford/statement-of-accounts-2024-25_meta.json
    // fields_not_verified.staff_fte.
    'Bradford|staff_fte',
    // 2026-04-22: Bradford service_spending + performance_kpis stripped
    // per Phase 3 zero-tolerance rule (performance_kpis had Tier 1
    // contradictions + CQC/housing unsourced; service_spending
    // sub-category amounts needed the Budget Book page-level
    // provenance we hadn't yet archived).
    'Bradford|service_spending',
    'Bradford|performance_kpis',
    // 2026-04-22: Kent rollout — Phase 3 strips. Reasons logged in
    // src/data/councils/county-councils.ts Kent entry inline comments
    // and in KENT-AUDIT.md.
    'Kent|chief_executive_salary',        // Pay Policy has grades only; SoA Note 33 has part-year historic only.
    'Kent|staff_fte',                     // No archived source in Feb 2025 Budget Report or SoA.
    'Kent|total_allowances_cost',         // 2024-25 published allowances PDF Cloudflare-blocked via IA.
    'Kent|councillor_allowances_detail',  // Same — per-member detail unsourceable.
    'Kent|service_spending',              // Sub-amounts need Budget Book which is Cloudflare-blocked on www.kent.gov.uk.
    'Kent|top_suppliers',                 // Requires archived invoices-over-£250 CSVs (blocked).
    'Kent|salary_bands',                  // Requires "Staff earning £50k+" PDF (blocked).
    'Kent|grant_payments',                // 2022-23 values untraced to any archived Kent grants list.
    'Kent|performance_kpis',              // Per Bradford strip rule (Tier 1 dupes / contradictions / unsourced).
    'Kent|waste_destinations',            // Tonnages require Waste Strategy Evidence Base PDF page-level provenance.
    'Kent|service_outcomes',              // All sub-fields LLM-derived or Tier 4 landing-only.
    // 2026-04-22: Camden rollout — Phase 3 strips. Reasons in
    // src/data/councils/london-boroughs.ts Camden entry inline
    // comments and in CAMDEN-AUDIT.md.
    'Camden|chief_executive_salary',      // AFR figure was Jenny Rowlands (previous CE); Jon Rowney (current) has no atomically-published figure.
    'Camden|staff_fte',                   // No archived Camden source.
    'Camden|service_spending',            // Per-category sub-amounts not in archived PDFs with deep-link page provenance.
    'Camden|top_suppliers',               // Socrata query results not yet sha256'd as archived query snapshots.
    'Camden|grant_payments',              // Same — Socrata dataset, not yet archived as query snapshots.
    'Camden|performance_kpis',            // Bradford strip rule.
    'Camden|waste_destinations',          // DEFRA ENV18 not archived with deep-link provenance.
    'Camden|service_outcomes',            // All sub-fields duplicates / unsourced.
    // These three were stripped in an earlier Camden pass — preserved here for the regression check.
    'Camden|total_allowances_cost',
    'Camden|councillor_allowances_detail',
    'Camden|salary_bands',
    // 2026-04-22 batch: Manchester, Birmingham, Leeds, Surrey, Cornwall.
    // All 5 apply the Bradford strip checklist uniformly via batch script.
    // Reasons in BATCH-5-AUDIT.md (combined audit for the batch).
    ...['Manchester', 'Birmingham', 'Leeds', 'Surrey', 'Cornwall'].flatMap(c => [
      `${c}|council_tax_shares`,
      `${c}|performance_kpis`,
      `${c}|service_spending`,
      `${c}|top_suppliers`,
      `${c}|grant_payments`,
      `${c}|waste_destinations`,
      `${c}|salary_bands`,
      `${c}|councillor_allowances_detail`,
      `${c}|service_outcomes`,
      `${c}|staff_fte`,
      `${c}|total_allowances_cost`,
      `${c}|budget_gap`,
      `${c}|savings_target`,
    ]),
    // Manchester's CE salary was stripped too (no verbatim source in archived Pay Policy).
    'Manchester|chief_executive_salary',
    // 2026-04-22 Batch-4 overnight push: Liverpool, Bristol, Lancashire, Tower Hamlets.
    // Same Bradford strip checklist applied via batch script.
    ...['Liverpool', 'Bristol', 'Lancashire', 'Tower Hamlets'].flatMap(c => [
      `${c}|council_tax_shares`, `${c}|performance_kpis`, `${c}|service_spending`,
      `${c}|top_suppliers`, `${c}|grant_payments`, `${c}|waste_destinations`,
      `${c}|salary_bands`, `${c}|councillor_allowances_detail`, `${c}|service_outcomes`,
      `${c}|staff_fte`, `${c}|total_allowances_cost`, `${c}|budget_gap`, `${c}|savings_target`,
    ]),
    // Liverpool, Lancashire, Tower Hamlets: CE salary stripped (no verbatim in available archived PDFs).
    'Liverpool|chief_executive_salary',
    'Lancashire|chief_executive_salary',
    'Tower Hamlets|chief_executive_salary',
    // 2026-04-23 Batches 6+7: Hampshire, Essex, Hertfordshire, Sheffield, Westminster,
    // Nottinghamshire, Staffordshire, Wiltshire, Newcastle upon Tyne, Croydon.
    // Same Bradford strip checklist applied via batch script. Reasons in
    // BATCH-6-AUDIT.md + BATCH-7-AUDIT.md.
    ...['Hampshire', 'Essex', 'Hertfordshire', 'Sheffield', 'Westminster',
        'Nottinghamshire', 'Staffordshire', 'Wiltshire', 'Newcastle upon Tyne', 'Croydon'].flatMap(c => [
      `${c}|council_tax_shares`, `${c}|performance_kpis`, `${c}|service_spending`,
      `${c}|top_suppliers`, `${c}|grant_payments`, `${c}|waste_destinations`,
      `${c}|salary_bands`, `${c}|councillor_allowances_detail`, `${c}|service_outcomes`,
      `${c}|staff_fte`, `${c}|total_allowances_cost`, `${c}|budget_gap`, `${c}|savings_target`,
    ]),
    // Per-council CE salary exceptions.
    'Hampshire|reserves',                         // SoA 2023-24 unarchived — moderngov blocked.
    'Essex|chief_executive_salary',               // CE turnover 13 Feb 2025 — Jones → Wood part-year.
    'Wiltshire|chief_executive_salary',           // Pay Policy framework-only; SoA Cloudflare-blocked.
    'Newcastle upon Tyne|chief_executive_salary', // Pay Policy range-only; SoA not archivable.
    // 2026-04-23 Batch-4/5 Phase-4 Bradford-level verification:
    //  - Reserves values updated to General Fund unallocated balance verbatim from archived SoA
    //    (e.g. Manchester 258.6m → 19.9m per narrative "General Fund reserve at £19.9m")
    //  - Stripped where no verbatim figure existed within GOV.UK validator tolerance
    //    (Surrey: no SoA archived; Lancashire: GF balance £486m exceeds GOV.UK ref × 1.1)
    //  - CE salaries stripped where not verbatim in archived Pay Policy or SoA
    //    (Birmingham: CE title/person transition; Leeds: Tom Riordan departed Sep 2024
    //     → Pexton part-year; Surrey: Pay Policy is shell; Cornwall: UPDATED to £201,661
    //     per SoA Note 10a verbatim, replacing the old £153,000 figure).
    'Surrey|reserves',
    'Surrey|chief_executive_salary',
    'Lancashire|reserves',
    'Birmingham|chief_executive_salary',
    'Leeds|chief_executive_salary',
    // 2026-04-24 Norfolk full-depth rollout (first remediation of the
    // Batch-8/9/10 councils that were breadth-only). Strips: fields
    // without a verbatim archived source as of this pass.
    'Norfolk|total_allowances_cost', // Derived estimate (basic × 84 + SRA approximation), no published total.
    'Norfolk|budget_gap',            // MTFS not archived yet; live-page only.
    // 2026-04-24 West Sussex full-depth rollout (2/10 remediation).
    'West Sussex|chief_executive_salary', // TS £225k not verbatim; SoA Note 13 shows £169,187 paid for Becky Shaw shared-services 2023-24; Whitehouse appointed March 2024 (post-SoA period).
    'West Sussex|savings_target',         // TS £35m not in archived SoA. SoA narrative gives "£58m to £190m budget gap" range only.
    'West Sussex|budget_gap',             // TS £38.5m not verbatim; same SoA range narrative.
    'West Sussex|councillor_basic_allowance', // £11,875 not on archived allowances landing page; needs Members' Allowance Scheme PDF.
    'West Sussex|total_allowances_cost',  // Derived estimate, no published aggregate.
    // 2026-04-25 Derbyshire full-depth rollout (3/10 remediation).
    'Derbyshire|chief_executive_salary', // SoA Note 31 senior officer table is image-based; pdftotext can't extract £191,480 verbatim.
    'Derbyshire|councillor_basic_allowance', // £12,972 not on archived pages; needs Members' Allowance Scheme PDF.
    'Derbyshire|savings_target',         // TS £18.6m not in archived SoA narrative.
    'Derbyshire|savings_achieved',       // TS £70m not verbatim in SoA.
    'Derbyshire|budget_gap',             // TS £37.8m not verbatim in archived SoA.
    // 2026-04-25 Lincolnshire full-depth rollout (4/10 remediation).
    'Lincolnshire|councillor_basic_allowance', // Note 32 publishes only aggregate; £12,157 not on archived pages.
    'Lincolnshire|savings_target',             // TS £8.1m not in archived SoA narrative.
    'Lincolnshire|budget_gap',                 // TS £9.7m not verbatim in archived SoA.
    // 2026-04-25 Suffolk full-depth rollout (5/10 remediation).
    'Suffolk|councillor_basic_allowance', // £12,541 not in archived SoA; needs Members' Allowance Scheme PDF.
    'Suffolk|savings_target',             // TS £28.4m not in archived SoA narrative.
    'Suffolk|budget_gap',                 // TS £6m not verbatim in archived SoA.
    'Suffolk|total_allowances_cost',      // 2023-24 Members Allowances Statement PDF not directly archived.
    // 2026-04-25 Leicestershire full-depth rollout (6/10 remediation).
    'Leicestershire|chief_executive_salary', // Historic £221k for John Sinnott (£'000s rounded). Current CE Jane Moore has no published current salary in archived sources.
    'Leicestershire|councillor_basic_allowance', // Note 33 publishes aggregate only; £12,779 needs Members' Allowance Scheme PDF.
    'Leicestershire|savings_target',         // TS £33m not in archived SoA narrative.
    'Leicestershire|budget_gap',             // TS £91m not verbatim in archived SoA.
    // 2026-04-25 Cambridgeshire full-depth rollout (7/10 remediation).
    'Cambridgeshire|councillor_basic_allowance', // Note 14 publishes aggregate only; £13,610 needs Members' Allowance Scheme PDF.
    'Cambridgeshire|savings_target',             // TS £20m not in archived SoA narrative.
    'Cambridgeshire|budget_gap',                 // TS £34.2m not verbatim in archived SoA.
    'Cambridgeshire|councillor_allowances_detail', // 2025-26 scheme derived figures; sum exceeded the verbatim 2023-24 SoA Note 14 total. Re-introduce when scheme PDF archived.
    // 2026-04-25 Gloucestershire full-depth rollout (8/10 remediation).
    'Gloucestershire|chief_executive_salary', // TS £191,371 not verbatim. SoA shows P Bungard 2023/24 £150,120 (29.6h/wk); new CE Jo Walker took post May 2025.
    'Gloucestershire|councillor_basic_allowance', // Note 19 publishes only aggregate; £12,563 needs Members' Allowance Scheme PDF.
    'Gloucestershire|savings_target',         // TS £24.5m not in archived SoA narrative.
    'Gloucestershire|budget_gap',             // TS £31.7m not verbatim.
    'Gloucestershire|councillor_allowances_detail', // 2025-26 scheme derived; sum exceeded SoA verbatim Note 19 total. Re-introduce when scheme PDF archived.
    // 2026-04-25 Worcestershire full-depth rollout (9/10 remediation).
    'Worcestershire|councillor_basic_allowance', // £9,245 not on archived pages.
    'Worcestershire|total_allowances_cost',      // £1,000,000 not verbatim in SoA.
    'Worcestershire|savings_target',             // TS £25m not in archived SoA narrative.
    'Worcestershire|budget_gap',                 // TS £74m not verbatim in archived SoA.
    // 2026-04-25 North Yorkshire full-depth rollout (10/10 remediation — final).
    'North Yorkshire|councillor_basic_allowance', // £17,340 not in SoA; separate Members Allowances PDF not archived.
    'North Yorkshire|leader_allowance',           // £40,447 not in SoA.
    'North Yorkshire|councillor_allowances_detail', // Sum (~£2.27m incl. travel) exceeds SoA p75 verbatim total £1,934k; per-cllr PDF not archived.
    'North Yorkshire|performance_kpis',           // Bradford strip-list — no per-page archived sources.
    'North Yorkshire|savings_target',             // £85.7m derived from GOV.UK RA, not council document.
    'North Yorkshire|budget_gap',                 // £95.2m derived from GOV.UK RA, not council document.
    // 2026-04-25 Devon Batch-9 full-depth rollout (1/10).
    'Devon|chief_executive',                       // Donna Manson not in archived Pay Policy/Budget Book sources.
    'Devon|chief_executive_salary',                // PP grade L0 £212,175 ≠ actual remuneration; SoA on SharePoint not Wayback-archivable.
    'Devon|councillor_basic_allowance',            // £15,082 not in archived sources.
    'Devon|leader_allowance',                      // £37,705 not in archived sources.
    'Devon|total_allowances_cost',                 // £1.2m not verbatim in Budget Book.
    'Devon|councillor_allowances_detail',          // No archived per-cllr source.
    'Devon|salary_bands',                          // Not in archived Pay Policy.
    'Devon|top_suppliers',                         // No archived Spending CSV.
    'Devon|grant_payments',                        // No archived grants source.
    'Devon|performance_kpis',                      // Bradford strip-list.
    'Devon|service_outcomes',                      // Bradford strip-list.
    'Devon|waste_destinations',                    // No archived source.
    'Devon|staff_fte',                             // 6,593 not in archived sources.
    'Devon|savings_target',                        // £21.7m not verbatim.
    'Devon|budget_gap',                            // £39m differs from Budget Book MTFP.
  ]);

  const previousPath = join(REPORTS_DIR, 'validation-latest.json');
  if (existsSync(previousPath)) {
    try {
      const previous = JSON.parse(readFileSync(previousPath, 'utf-8'));
      const prevByCouncil = previous.completeness?.by_council || {};

      for (const c of councils) {
        const prevEntry = prevByCouncil[c.name];
        const currEntry = byCouncil[c.name];
        if (!prevEntry || !currEntry) continue;

        // Find fields that were present before but are now missing
        const prevPresent = new Set(
          KENT_FIELDS.map(([f]) => f).filter(f => !prevEntry.missing.includes(f))
        );
        for (const field of currEntry.missing) {
          if (prevPresent.has(field) && !INTENTIONAL_REMOVALS.has(`${c.name}|${field}`)) {
            report.finding(c, 'completeness', 'regression_field_lost', 'error',
              `Field "${field}" was present in previous run but is now missing`,
              field, 'missing', 'present (was present before)');
          }
        }
      }
    } catch {
      // Previous report is corrupted or unreadable — skip regression check
    }
  }

  report.setCompleteness({ by_council: byCouncil, by_field: byField });
}
