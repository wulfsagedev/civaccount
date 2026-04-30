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
    // 2026-04-25 East Sussex Batch-9 full-depth rollout (2/10).
    'East Sussex|chief_executive_salary',          // Becky Shaw 50% shared with WSx; ESx-only verbatim £108,072 ≠ TS £206,174.
    'East Sussex|council_leader',                  // Cllr Keith Glazier not in archived sources; eastsussex.gov.uk pages 404.
    'East Sussex|cabinet',                         // Same — no archived source for current cabinet.
    'East Sussex|councillor_basic_allowance',      // £14,672 not in archived SoA.
    'East Sussex|leader_allowance',                // £41,084 not in archived SoA.
    'East Sussex|total_allowances_cost',           // £998,264 not in archived SoA.
    'East Sussex|councillor_allowances_detail',    // No archived per-cllr source.
    'East Sussex|salary_bands',                    // Not in archived sources.
    'East Sussex|top_suppliers',                   // No archived Spending CSV.
    'East Sussex|grant_payments',                  // No archived grants source.
    'East Sussex|performance_kpis',                // Bradford strip-list.
    'East Sussex|service_outcomes',                // Bradford strip-list.
    'East Sussex|service_spending',                // Bradford strip-list — sub-categories without page-level provenance.
    'East Sussex|waste_destinations',              // No archived source.
    'East Sussex|staff_fte',                       // 7,246 not in archived SoA.
    'East Sussex|savings_target',                  // £13.5m not in archived SoA.
    'East Sussex|budget_gap',                      // £56m not in archived SoA.
    // 2026-04-25 Oxfordshire Batch-9 full-depth rollout (3/10).
    'Oxfordshire|cabinet',                         // No archived source for current cabinet (oxfordshire.gov.uk timeouts).
    'Oxfordshire|councillor_basic_allowance',      // £15,420 not in archived SoA.
    'Oxfordshire|leader_allowance',                // Not in archived sources.
    'Oxfordshire|total_allowances_cost',           // Not in archived SoA.
    'Oxfordshire|councillor_allowances_detail',    // No archived per-cllr source.
    'Oxfordshire|salary_bands',                    // Not in archived SoA.
    'Oxfordshire|top_suppliers',                   // No archived Spending CSV.
    'Oxfordshire|grant_payments',                  // No archived grants source.
    'Oxfordshire|performance_kpis',                // Bradford strip-list.
    'Oxfordshire|service_outcomes',                // Bradford strip-list.
    'Oxfordshire|service_spending',                // Bradford strip-list.
    'Oxfordshire|waste_destinations',              // No archived source.
    'Oxfordshire|staff_fte',                       // 4,606 not in archived SoA.
    'Oxfordshire|savings_target',                  // £25m not in archived SoA.
    'Oxfordshire|budget_gap',                      // £25m not in archived SoA.
    // 2026-04-25 Wakefield Batch-9 full-depth rollout (8/10).
    'Wakefield|reserves',                          // SoA p20 narrative £79.6m exceeds GOV.UK RA usable reserves reference £59.167m; figure semantics ambiguous.
    'Wakefield|chief_executive',                   // SoA p41 says role "occupied by interim agency employee until 21/04/24"; Tony Reeves not verbatim in archived sources.
    'Wakefield|chief_executive_salary',            // SoA Table 2 image-based, no pdftotext-extractable salary.
    'Wakefield|cabinet',                           // No archived source for current cabinet.
    'Wakefield|councillor_basic_allowance',        // £13,906 not verbatim in archived SoA.
    'Wakefield|leader_allowance',                  // £41,802 not verbatim in archived SoA.
    'Wakefield|councillor_allowances_detail',      // No archived per-cllr source.
    'Wakefield|salary_bands',                      // SoA Table 1 image-based.
    'Wakefield|top_suppliers',                     // No archived Spending CSV.
    'Wakefield|grant_payments',                    // No archived grants source.
    'Wakefield|performance_kpis',                  // Bradford strip-list.
    'Wakefield|service_outcomes',                  // Bradford strip-list.
    'Wakefield|service_spending',                  // Bradford strip-list.
    'Wakefield|waste_destinations',                // No archived source.
    'Wakefield|staff_fte',                         // 6,575 not in archived SoA.
    'Wakefield|savings_target',                    // £85.6m not verbatim in archived SoA.
    // 2026-04-25 Doncaster Batch-9 full-depth rollout (9/10).
    'Doncaster|reserves',                          // TS £73.3m doesn't match SoA p11 £182.4m usable / £94.5m GFB.
    'Doncaster|cabinet',                           // No archived source for current cabinet.
    'Doncaster|councillor_basic_allowance',        // £13,216 not verbatim.
    'Doncaster|leader_allowance',                  // Not in archived SoA.
    'Doncaster|councillor_allowances_detail',      // No archived per-cllr source.
    'Doncaster|salary_bands',                      // SoA Table 1 not extractable.
    'Doncaster|top_suppliers',                     // No archived Spending CSV.
    'Doncaster|grant_payments',                    // No archived grants source.
    'Doncaster|performance_kpis',                  // Bradford strip-list.
    'Doncaster|service_outcomes',                  // Bradford strip-list.
    'Doncaster|service_spending',                  // Bradford strip-list.
    'Doncaster|waste_destinations',                // No archived source.
    'Doncaster|staff_fte',                         // 4,733 not in archived SoA.
    'Doncaster|savings_target',                    // Not in archived SoA.
    'Doncaster|budget_gap',                        // Not in archived SoA.
    // 2026-04-25 Coventry Batch-9 full-depth rollout (10/10).
    'Coventry|cabinet',                            // No archived source for current cabinet.
    'Coventry|councillor_basic_allowance',         // £14,490 not verbatim.
    'Coventry|leader_allowance',                   // Not in archived SoA.
    'Coventry|total_allowances_cost',              // Members Allowances p88 image-based.
    'Coventry|councillor_allowances_detail',       // No archived per-cllr source.
    'Coventry|salary_bands',                       // Image-based.
    'Coventry|top_suppliers',                      // No archived Spending CSV.
    'Coventry|grant_payments',                     // No archived grants source.
    'Coventry|performance_kpis',                   // Bradford strip-list.
    'Coventry|service_outcomes',                   // Bradford strip-list.
    'Coventry|service_spending',                   // Bradford strip-list.
    'Coventry|waste_destinations',                 // No archived source.
    'Coventry|staff_fte',                          // 6,980 not in archived SoA.
    'Coventry|savings_target',                     // Not in archived SoA.
    'Coventry|budget_gap',                         // Not in archived SoA.
    // 2026-04-25 Bolton Batch-10 full-depth rollout (1/10).
    'Bolton|council_leader',                       // Nick Peel not verbatim in archived SoA; bolton.gov.uk councillor pages Cloudflare-blocked.
    'Bolton|cabinet',                              // No archived source for current cabinet.
    'Bolton|councillor_basic_allowance',           // £11,848 not verbatim in archived SoA.
    'Bolton|leader_allowance',                     // Not in archived SoA.
    'Bolton|councillor_allowances_detail',         // No archived per-cllr source.
    'Bolton|salary_bands',                         // Not in archived SoA.
    'Bolton|top_suppliers',                        // No archived Spending CSV.
    'Bolton|grant_payments',                       // No archived grants source.
    'Bolton|performance_kpis',                     // Bradford strip-list.
    'Bolton|service_outcomes',                     // Bradford strip-list.
    'Bolton|service_spending',                     // Bradford strip-list.
    'Bolton|waste_destinations',                   // No archived source.
    'Bolton|staff_fte',                            // 4,895 not in archived SoA.
    'Bolton|savings_target',                       // Not in archived SoA.
    'Bolton|budget_gap',                           // Not in archived SoA.
    // 2026-04-25 Salford Batch-10 full-depth rollout (2/10).
    'Salford|chief_executive_salary',              // 3 holders during 2024/25 (T Stannard leaving £180,623; M Caslake interim £155,023; Stephen Young current — no published 2024/25 figure for current CE).
    'Salford|cabinet',                             // No archived source for current cabinet/mayoral team.
    'Salford|councillor_basic_allowance',          // £12,790 not verbatim.
    'Salford|leader_allowance',                    // £98,000 not verbatim.
    'Salford|total_allowances_cost',               // £1.58m not verbatim; SoA Note 31 image-based.
    'Salford|councillor_allowances_detail',        // No archived per-cllr source.
    'Salford|salary_bands',                        // Not in archived SoA.
    'Salford|top_suppliers',                       // No archived Spending CSV.
    'Salford|grant_payments',                      // No archived grants source.
    'Salford|performance_kpis',                    // Bradford strip-list.
    'Salford|service_outcomes',                    // Bradford strip-list.
    'Salford|service_spending',                    // Bradford strip-list.
    'Salford|waste_destinations',                  // No archived source.
    'Salford|staff_fte',                           // 5,554 not in archived SoA.
    'Salford|savings_target',                      // Not in archived SoA.
    'Salford|budget_gap',                          // Not in archived SoA.
    // 2026-04-25 Wirral Batch-10 full-depth rollout (3/10).
    'Wirral|chief_executive',                      // Matt Bennett not in archived SoA; Paul Satoor was CE until 23 Oct 2025, Jason Gooding interim from 13 Oct 2025.
    'Wirral|chief_executive_salary',               // Multiple holders + interim arrangements.
    'Wirral|council_leader',                       // Cllr Paul Stuart not verbatim in archived SoA.
    'Wirral|cabinet',                              // No archived source for current cabinet.
    'Wirral|councillor_basic_allowance',           // Not verbatim in archived SoA.
    'Wirral|leader_allowance',                     // Not in archived SoA.
    'Wirral|total_allowances_cost',                // Not verbatim in archived SoA.
    'Wirral|councillor_allowances_detail',         // No archived per-cllr source.
    'Wirral|salary_bands',                         // Not in archived SoA.
    'Wirral|top_suppliers',                        // No archived Spending CSV.
    'Wirral|grant_payments',                       // No archived grants source.
    'Wirral|performance_kpis',                     // Bradford strip-list.
    'Wirral|service_outcomes',                     // Bradford strip-list.
    'Wirral|service_spending',                     // Bradford strip-list.
    'Wirral|waste_destinations',                   // No archived source.
    'Wirral|staff_fte',                            // 5,386 not in archived SoA.
    'Wirral|savings_target',                       // Not in archived SoA.
    'Wirral|budget_gap',                           // Not in archived SoA.
    // 2026-04-25 Sandwell Batch-10 full-depth rollout (4/10).
    'Sandwell|reserves',                           // TS £155.2m doesn't match SoA narrative; only "increased by £0.103m" stated.
    'Sandwell|cabinet',                            // No archived source for current cabinet.
    'Sandwell|councillor_basic_allowance',         // £12,129 not verbatim.
    'Sandwell|leader_allowance',                   // Not in archived SoA.
    'Sandwell|councillor_allowances_detail',       // Sum doesn't match SoA verbatim total £1.368m.
    'Sandwell|salary_bands',                       // Not in archived SoA.
    'Sandwell|top_suppliers',                      // No archived Spending CSV.
    'Sandwell|grant_payments',                     // No archived grants source.
    'Sandwell|performance_kpis',                   // Bradford strip-list.
    'Sandwell|service_outcomes',                   // Bradford strip-list.
    'Sandwell|service_spending',                   // Bradford strip-list.
    'Sandwell|waste_destinations',                 // No archived source.
    'Sandwell|staff_fte',                          // 6,418 not in archived SoA.
    'Sandwell|savings_target',                     // Not in archived SoA.
    'Sandwell|budget_gap',                         // Not in archived SoA.
    // 2026-04-25 Sefton Batch-10 full-depth rollout (5/10).
    'Sefton|cabinet',                              // No archived source for current cabinet.
    'Sefton|councillor_basic_allowance',           // £11,426 not verbatim.
    'Sefton|leader_allowance',                     // £28,532 not verbatim.
    'Sefton|councillor_allowances_detail',         // No archived per-cllr source.
    'Sefton|salary_bands',                         // Not in archived SoA.
    'Sefton|top_suppliers',                        // No archived Spending CSV.
    'Sefton|grant_payments',                       // No archived grants source.
    'Sefton|performance_kpis',                     // Bradford strip-list.
    'Sefton|service_outcomes',                     // Bradford strip-list.
    'Sefton|service_spending',                     // Bradford strip-list.
    'Sefton|waste_destinations',                   // No archived source.
    'Sefton|staff_fte',                            // 5,082 not in archived SoA.
    'Sefton|savings_target',                       // Not in archived SoA.
    'Sefton|budget_gap',                           // Not in archived SoA.
    // 2026-04-25 Stockport Batch-10 full-depth rollout (6/10).
    'Stockport|reserves',                          // TS £74.7m doesn't match SoA; MIRS image-based.
    'Stockport|chief_executive',                   // Michael Cullen replaced by Caroline Simpson 25/06/2024 per SoA p118.
    'Stockport|chief_executive_salary',            // SoA Note 27 image-based.
    'Stockport|cabinet',                           // No archived source for current cabinet.
    'Stockport|councillor_basic_allowance',        // £10,716 not verbatim.
    'Stockport|leader_allowance',                  // £32,150 not verbatim.
    'Stockport|total_allowances_cost',             // Not verbatim in archived SoA.
    'Stockport|councillor_allowances_detail',      // No archived per-cllr source.
    'Stockport|salary_bands',                      // SoA image-based.
    'Stockport|top_suppliers',                     // No archived Spending CSV.
    'Stockport|grant_payments',                    // No archived grants source.
    'Stockport|performance_kpis',                  // Bradford strip-list.
    'Stockport|service_outcomes',                  // Bradford strip-list.
    'Stockport|service_spending',                  // Bradford strip-list.
    'Stockport|waste_destinations',                // No archived source.
    'Stockport|staff_fte',                         // 5,306 not in archived SoA.
    'Stockport|savings_target',                    // Not in archived SoA.
    'Stockport|budget_gap',                        // Not in archived SoA.
    // 2026-04-25 Wolverhampton Batch-10 full-depth rollout (7/10).
    'Wolverhampton|reserves',                      // TS £51.2m doesn't match SoA narrative; only "earmarked reserves totalling £80.4 million" stated.
    'Wolverhampton|cabinet',                       // No archived source.
    'Wolverhampton|councillor_basic_allowance',    // £11,500 not verbatim.
    'Wolverhampton|leader_allowance',              // £32,322 not verbatim.
    'Wolverhampton|councillor_allowances_detail',  // No archived per-cllr source.
    'Wolverhampton|salary_bands',                  // Not in archived SoA.
    'Wolverhampton|top_suppliers',                 // No archived Spending CSV.
    'Wolverhampton|grant_payments',                // No archived grants source.
    'Wolverhampton|performance_kpis',              // Bradford strip-list.
    'Wolverhampton|service_outcomes',              // Bradford strip-list.
    'Wolverhampton|service_spending',              // Bradford strip-list.
    'Wolverhampton|waste_destinations',            // No archived source.
    'Wolverhampton|staff_fte',                     // 5,377 not in archived SoA.
    'Wolverhampton|savings_target',                // Not in archived SoA.
    'Wolverhampton|budget_gap',                    // Not in archived SoA.
    // 2026-04-25 Barnsley Batch-10 full-depth rollout (8/10).
    'Barnsley|council_leader',                     // Sir Steve Houghton not verbatim in archived SoA.
    'Barnsley|cabinet',                            // No archived source for current cabinet.
    'Barnsley|councillor_basic_allowance',         // £12,237 not verbatim.
    'Barnsley|leader_allowance',                   // Not verbatim.
    'Barnsley|total_allowances_cost',              // Not verbatim.
    'Barnsley|councillor_allowances_detail',       // No archived per-cllr source.
    'Barnsley|salary_bands',                       // Not in archived SoA.
    'Barnsley|top_suppliers',                      // No archived Spending CSV.
    'Barnsley|grant_payments',                     // No archived grants source.
    'Barnsley|performance_kpis',                   // Bradford strip-list.
    'Barnsley|service_outcomes',                   // Bradford strip-list.
    'Barnsley|service_spending',                   // Bradford strip-list.
    'Barnsley|waste_destinations',                 // No archived source.
    'Barnsley|staff_fte',                          // 4,008 not in archived SoA.
    'Barnsley|savings_target',                     // Not in archived SoA.
    'Barnsley|budget_gap',                         // Not in archived SoA.
    // 2026-04-25 Solihull Batch-10 full-depth rollout (9/10).
    'Solihull|reserves',                           // TS £38.6m doesn't match SoA narrative.
    'Solihull|council_leader',                     // Cllr Ian Courts not verbatim in archived SoA.
    'Solihull|cabinet',                            // No archived source.
    'Solihull|councillor_basic_allowance',         // £12,813 not verbatim.
    'Solihull|leader_allowance',                   // Not verbatim.
    'Solihull|total_allowances_cost',              // Not verbatim.
    'Solihull|councillor_allowances_detail',       // No archived per-cllr source.
    'Solihull|salary_bands',                       // Not in archived SoA.
    'Solihull|top_suppliers',                      // No archived Spending CSV.
    'Solihull|grant_payments',                     // No archived grants source.
    'Solihull|performance_kpis',                   // Bradford strip-list.
    'Solihull|service_outcomes',                   // Bradford strip-list.
    'Solihull|service_spending',                   // Bradford strip-list.
    'Solihull|waste_destinations',                 // No archived source.
    'Solihull|staff_fte',                          // 3,414 not in archived SoA.
    'Solihull|savings_target',                     // Not in archived SoA.
    'Solihull|budget_gap',                         // Not in archived SoA.
    // 2026-04-25 St Helens Batch-10 full-depth rollout (10/10).
    'St Helens|reserves',                          // TS £56.97m doesn't match SoA narrative.
    'St Helens|council_leader',                    // Cllr David Baines not verbatim in archived SoA.
    'St Helens|cabinet',                           // No archived source.
    'St Helens|councillor_basic_allowance',        // £10,716 not verbatim.
    'St Helens|leader_allowance',                  // £32,150 not verbatim.
    'St Helens|total_allowances_cost',             // Not verbatim.
    'St Helens|councillor_allowances_detail',      // No archived per-cllr source.
    'St Helens|salary_bands',                      // Not in archived SoA.
    'St Helens|top_suppliers',                     // No archived Spending CSV.
    'St Helens|grant_payments',                    // No archived grants source.
    'St Helens|performance_kpis',                  // Bradford strip-list.
    'St Helens|service_outcomes',                  // Bradford strip-list.
    'St Helens|service_spending',                  // Bradford strip-list.
    'St Helens|waste_destinations',                // No archived source.
    'St Helens|staff_fte',                         // 4,080 not in archived SoA.
    'St Helens|savings_target',                    // Not in archived SoA.
    'St Helens|budget_gap',                        // Not in archived SoA.
    // 2026-04-26 Dudley Batch-10 full-depth rollout (11/10).
    'Dudley|reserves',                             // TS £19.3m doesn't match SoA narrative.
    'Dudley|cabinet',                              // No archived source.
    'Dudley|councillor_basic_allowance',           // £12,143 not verbatim.
    'Dudley|leader_allowance',                     // Not verbatim.
    'Dudley|total_allowances_cost',                // Not verbatim.
    'Dudley|councillor_allowances_detail',         // No archived per-cllr source.
    'Dudley|salary_bands',                         // Not in archived SoA.
    'Dudley|top_suppliers',                        // No archived Spending CSV.
    'Dudley|grant_payments',                       // No archived grants source.
    'Dudley|performance_kpis',                     // Bradford strip-list.
    'Dudley|service_outcomes',                     // Bradford strip-list.
    'Dudley|service_spending',                     // Bradford strip-list.
    'Dudley|waste_destinations',                   // No archived source.
    'Dudley|staff_fte',                            // 5,458 not in archived SoA.
    'Dudley|savings_target',                       // Not in archived SoA.
    'Dudley|budget_gap',                           // Not in archived SoA.
    // 2026-04-26 Oldham Batch-10 full-depth rollout (12/10).
    'Oldham|reserves',                             // TS £40.3m doesn't match SoA narrative.
    'Oldham|chief_executive_salary',               // 3 holders during 2024/25.
    'Oldham|cabinet',                              // No archived source.
    'Oldham|councillor_basic_allowance',           // Not verbatim.
    'Oldham|leader_allowance',                     // Not verbatim.
    'Oldham|total_allowances_cost',                // Not verbatim.
    'Oldham|councillor_allowances_detail',         // No archived per-cllr source.
    'Oldham|salary_bands',                         // Not in archived SoA.
    'Oldham|top_suppliers',                        // No archived Spending CSV.
    'Oldham|grant_payments',                       // No archived grants source.
    'Oldham|performance_kpis',                     // Bradford strip-list.
    'Oldham|service_outcomes',                     // Bradford strip-list.
    'Oldham|service_spending',                     // Bradford strip-list.
    'Oldham|waste_destinations',                   // No archived source.
    'Oldham|staff_fte',                            // 3,968 not in archived SoA.
    'Oldham|savings_target',                       // Not in archived SoA.
    'Oldham|budget_gap',                           // Not in archived SoA.
    // 2026-04-26 York Batch-11 first UA rollout (1/n).
    'York|reserves',                               // TS £72.9m doesn't match SoA narrative.
    'York|council_leader',                         // Cllr Claire Douglas not verbatim in archived SoA.
    'York|cabinet',                                // No archived source.
    'York|councillor_basic_allowance',             // Not verbatim.
    'York|leader_allowance',                       // Not verbatim.
    'York|total_allowances_cost',                  // Not verbatim.
    'York|councillor_allowances_detail',           // No archived per-cllr source.
    'York|salary_bands',                           // Not in archived SoA.
    'York|top_suppliers',                          // No archived Spending CSV.
    'York|grant_payments',                         // No archived grants source.
    'York|performance_kpis',                       // Bradford strip-list.
    'York|service_outcomes',                       // Bradford strip-list.
    'York|service_spending',                       // Bradford strip-list.
    'York|waste_destinations',                     // No archived source.
    'York|staff_fte',                              // 2,841 not in archived SoA.
    'York|savings_target',                         // Not in archived SoA.
    'York|budget_gap',                             // Not in archived SoA.
    // 2026-04-26 Plymouth Batch-11.
    'Plymouth|reserves',                           // TS £53.9m doesn't match SoA.
    'Plymouth|cabinet',                            // No archived source.
    'Plymouth|councillor_basic_allowance',         // Not verbatim.
    'Plymouth|leader_allowance',                   // £34,896 not verbatim.
    'Plymouth|total_allowances_cost',              // Not verbatim.
    'Plymouth|councillor_allowances_detail',       // No archived per-cllr source.
    'Plymouth|salary_bands',                       // Not in archived SoA.
    'Plymouth|top_suppliers',                      // No archived Spending CSV.
    'Plymouth|grant_payments',                     // No archived grants source.
    'Plymouth|performance_kpis',                   // Bradford strip-list.
    'Plymouth|service_outcomes',                   // Bradford strip-list.
    'Plymouth|service_spending',                   // Bradford strip-list.
    'Plymouth|waste_destinations',                 // No archived source.
    'Plymouth|staff_fte',                          // 3,193 not in archived SoA.
    'Plymouth|savings_target',                     // Not in archived SoA.
    'Plymouth|budget_gap',                         // Not in archived SoA.
    // 2026-04-26 Portsmouth Batch-11.
    'Portsmouth|reserves',                         // TS £222.7m doesn't match SoA.
    'Portsmouth|council_leader',                   // Cllr Steve Pitt not verbatim in archived SoA.
    'Portsmouth|cabinet',                          // No archived source.
    'Portsmouth|councillor_basic_allowance',       // Not verbatim.
    'Portsmouth|leader_allowance',                 // Not verbatim.
    'Portsmouth|total_allowances_cost',            // Not verbatim.
    'Portsmouth|councillor_allowances_detail',     // No archived per-cllr source.
    'Portsmouth|salary_bands',                     // Not in archived SoA.
    'Portsmouth|top_suppliers',                    // No archived Spending CSV.
    'Portsmouth|grant_payments',                   // No archived grants source.
    'Portsmouth|performance_kpis',                 // Bradford strip-list.
    'Portsmouth|service_outcomes',                 // Bradford strip-list.
    'Portsmouth|service_spending',                 // Bradford strip-list.
    'Portsmouth|waste_destinations',               // No archived source.
    'Portsmouth|staff_fte',                        // 4,071 not in archived SoA.
    'Portsmouth|savings_target',                   // Not in archived SoA.
    'Portsmouth|budget_gap',                       // Not in archived SoA.
    // 2026-04-26 Luton Batch-11.
    'Luton|reserves',                              // TS £111.7m doesn't match SoA.
    'Luton|cabinet',                               // No archived source.
    'Luton|councillor_basic_allowance',            // Not verbatim.
    'Luton|leader_allowance',                      // Not verbatim.
    'Luton|total_allowances_cost',                 // Not verbatim.
    'Luton|councillor_allowances_detail',          // No archived per-cllr source.
    'Luton|salary_bands',                          // Not in archived SoA.
    'Luton|top_suppliers',                         // No archived Spending CSV.
    'Luton|grant_payments',                        // No archived grants source.
    'Luton|performance_kpis',                      // Bradford strip-list.
    'Luton|service_outcomes',                      // Bradford strip-list.
    'Luton|service_spending',                      // Bradford strip-list.
    'Luton|waste_destinations',                    // No archived source.
    'Luton|staff_fte',                             // 4,543 not in archived SoA.
    'Luton|savings_target',                        // Not in archived SoA.
    'Luton|budget_gap',                            // Not in archived SoA.
    // 2026-04-26 Batch-12 London Boroughs.
    'Hillingdon|cabinet',                          // No archived source.
    'Hillingdon|councillor_basic_allowance',       // Not verbatim in SoA.
    'Hillingdon|total_allowances_cost',            // Not verbatim in SoA.
    'Hillingdon|councillor_allowances_detail',     // No archived per-cllr source.
    'Hillingdon|salary_bands',                     // No archived source.
    'Hillingdon|top_suppliers',                    // No archived Spending CSV.
    'Hillingdon|grant_payments',                   // No archived grants source.
    'Hillingdon|performance_kpis',                 // Bradford strip-list.
    'Hillingdon|service_outcomes',                 // Bradford strip-list.
    'Hillingdon|service_spending',                 // Bradford strip-list.
    'Hillingdon|waste_destinations',               // No archived source.
    'Hillingdon|staff_fte',                        // Not verbatim in archived SoA.
    'Hillingdon|savings_target',                   // Not in archived SoA.
    'Hillingdon|budget_gap',                       // Not in archived SoA.
    'Bromley|cabinet',
    'Bromley|council_leader',                      // Not verbatim in archived SoA.
    'Bromley|councillor_basic_allowance',
    'Bromley|leader_allowance',
    'Bromley|total_allowances_cost',
    'Bromley|councillor_allowances_detail',
    'Bromley|salary_bands',
    'Bromley|top_suppliers',
    'Bromley|grant_payments',
    'Bromley|performance_kpis',
    'Bromley|service_outcomes',
    'Bromley|service_spending',
    'Bromley|waste_destinations',
    'Bromley|staff_fte',
    'Bromley|savings_target',
    'Bromley|budget_gap',
    'Bexley|cabinet',
    'Bexley|council_leader',                       // Not verbatim in archived SoA.
    'Bexley|councillor_basic_allowance',
    'Bexley|leader_allowance',
    'Bexley|total_allowances_cost',
    'Bexley|councillor_allowances_detail',
    'Bexley|salary_bands',
    'Bexley|top_suppliers',
    'Bexley|grant_payments',
    'Bexley|performance_kpis',
    'Bexley|service_outcomes',
    'Bexley|service_spending',
    'Bexley|waste_destinations',
    'Bexley|staff_fte',
    'Bexley|savings_target',
    'Bexley|budget_gap',
    'Greenwich|cabinet',
    'Greenwich|council_leader',                    // Not verbatim in archived SoA.
    'Greenwich|councillor_basic_allowance',
    'Greenwich|leader_allowance',
    'Greenwich|total_allowances_cost',
    'Greenwich|councillor_allowances_detail',
    'Greenwich|salary_bands',
    'Greenwich|top_suppliers',
    'Greenwich|grant_payments',
    'Greenwich|performance_kpis',
    'Greenwich|service_outcomes',
    'Greenwich|service_spending',
    'Greenwich|waste_destinations',
    'Greenwich|staff_fte',
    'Greenwich|savings_target',
    'Greenwich|budget_gap',
    // 2026-04-26 Batch-13 London Boroughs (more).
    'Lambeth|cabinet',
    'Lambeth|council_leader',                      // Not verbatim in archived SoA.
    'Lambeth|councillor_basic_allowance',
    'Lambeth|leader_allowance',
    'Lambeth|total_allowances_cost',
    'Lambeth|councillor_allowances_detail',
    'Lambeth|salary_bands',
    'Lambeth|top_suppliers',
    'Lambeth|grant_payments',
    'Lambeth|performance_kpis',
    'Lambeth|service_outcomes',
    'Lambeth|service_spending',
    'Lambeth|waste_destinations',
    'Lambeth|chief_executive_salary',              // 3 CEs in 2024/25 — annualised footnote not actual paid.
    'Lambeth|staff_fte',
    'Lambeth|savings_target',
    'Lambeth|budget_gap',
    'Wandsworth|cabinet',
    'Wandsworth|council_leader',                   // Not verbatim in archived SoA.
    'Wandsworth|councillor_basic_allowance',
    'Wandsworth|leader_allowance',
    'Wandsworth|total_allowances_cost',
    'Wandsworth|councillor_allowances_detail',
    'Wandsworth|salary_bands',
    'Wandsworth|top_suppliers',
    'Wandsworth|grant_payments',
    'Wandsworth|performance_kpis',
    'Wandsworth|service_outcomes',
    'Wandsworth|service_spending',
    'Wandsworth|waste_destinations',
    'Wandsworth|chief_executive_salary',           // CE turnover (M.Jackson left, B.Reilly Interim).
    'Wandsworth|savings_target',
    'Wandsworth|budget_gap',
    'Newham|cabinet',
    'Newham|chief_executive',                      // No CE row in archived SoA Senior Officers table.
    'Newham|councillor_basic_allowance',
    'Newham|leader_allowance',
    'Newham|total_allowances_cost',
    'Newham|councillor_allowances_detail',
    'Newham|salary_bands',
    'Newham|top_suppliers',
    'Newham|grant_payments',
    'Newham|performance_kpis',
    'Newham|service_outcomes',
    'Newham|service_spending',
    'Newham|waste_destinations',
    'Newham|chief_executive_salary',               // No CE row in archived SoA.
    'Newham|staff_fte',
    'Newham|savings_target',
    'Newham|budget_gap',
    'Hounslow|cabinet',
    'Hounslow|councillor_basic_allowance',
    'Hounslow|leader_allowance',
    'Hounslow|total_allowances_cost',
    'Hounslow|councillor_allowances_detail',
    'Hounslow|salary_bands',
    'Hounslow|top_suppliers',
    'Hounslow|grant_payments',
    'Hounslow|performance_kpis',
    'Hounslow|service_outcomes',
    'Hounslow|service_spending',
    'Hounslow|waste_destinations',
    'Hounslow|chief_executive_salary',             // CE turnover in 2024/25 (Bolger left 31/01, Skinner Interim from 25/02).
    'Hounslow|staff_fte',
    'Hounslow|savings_target',
    'Hounslow|budget_gap',
    // 2026-04-26 Batch-14 UAs.
    'Brighton & Hove|cabinet',
    'Brighton & Hove|council_leader',
    'Brighton & Hove|councillor_basic_allowance',
    'Brighton & Hove|leader_allowance',
    'Brighton & Hove|total_allowances_cost',
    'Brighton & Hove|councillor_allowances_detail',
    'Brighton & Hove|salary_bands',
    'Brighton & Hove|top_suppliers',
    'Brighton & Hove|grant_payments',
    'Brighton & Hove|performance_kpis',
    'Brighton & Hove|service_outcomes',
    'Brighton & Hove|service_spending',
    'Brighton & Hove|waste_destinations',
    'Brighton & Hove|staff_fte',
    'Brighton & Hove|savings_target',
    'Brighton & Hove|budget_gap',
    'Reading|cabinet',
    'Reading|councillor_basic_allowance',
    'Reading|leader_allowance',
    'Reading|total_allowances_cost',
    'Reading|councillor_allowances_detail',
    'Reading|salary_bands',
    'Reading|top_suppliers',
    'Reading|grant_payments',
    'Reading|performance_kpis',
    'Reading|service_outcomes',
    'Reading|service_spending',
    'Reading|waste_destinations',
    'Reading|staff_fte',
    'Reading|savings_target',
    'Reading|budget_gap',
    'Stoke-on-Trent|cabinet',
    'Stoke-on-Trent|council_leader',
    'Stoke-on-Trent|councillor_basic_allowance',
    'Stoke-on-Trent|leader_allowance',
    'Stoke-on-Trent|total_allowances_cost',
    'Stoke-on-Trent|councillor_allowances_detail',
    'Stoke-on-Trent|salary_bands',
    'Stoke-on-Trent|top_suppliers',
    'Stoke-on-Trent|grant_payments',
    'Stoke-on-Trent|performance_kpis',
    'Stoke-on-Trent|service_outcomes',
    'Stoke-on-Trent|service_spending',
    'Stoke-on-Trent|waste_destinations',
    'Stoke-on-Trent|staff_fte',
    'Stoke-on-Trent|savings_target',
    'Stoke-on-Trent|budget_gap',
    'Telford & Wrekin|cabinet',
    'Telford & Wrekin|council_leader',
    'Telford & Wrekin|councillor_basic_allowance',
    'Telford & Wrekin|leader_allowance',
    'Telford & Wrekin|total_allowances_cost',
    'Telford & Wrekin|councillor_allowances_detail',
    'Telford & Wrekin|salary_bands',
    'Telford & Wrekin|top_suppliers',
    'Telford & Wrekin|grant_payments',
    'Telford & Wrekin|performance_kpis',
    'Telford & Wrekin|service_outcomes',
    'Telford & Wrekin|service_spending',
    'Telford & Wrekin|waste_destinations',
    'Telford & Wrekin|staff_fte',
    'Telford & Wrekin|savings_target',
    'Telford & Wrekin|budget_gap',
    // 2026-04-26 Batch-15 LBs.
    'Southwark|cabinet',
    'Southwark|council_leader',
    'Southwark|councillor_basic_allowance',
    'Southwark|leader_allowance',
    'Southwark|total_allowances_cost',
    'Southwark|councillor_allowances_detail',
    'Southwark|salary_bands',
    'Southwark|top_suppliers',
    'Southwark|grant_payments',
    'Southwark|performance_kpis',
    'Southwark|service_outcomes',
    'Southwark|service_spending',
    'Southwark|waste_destinations',
    'Southwark|staff_fte',
    'Southwark|savings_target',
    'Southwark|budget_gap',
    'Barnet|cabinet',
    'Barnet|council_leader',
    'Barnet|councillor_basic_allowance',
    'Barnet|leader_allowance',
    'Barnet|total_allowances_cost',
    'Barnet|councillor_allowances_detail',
    'Barnet|salary_bands',
    'Barnet|top_suppliers',
    'Barnet|grant_payments',
    'Barnet|performance_kpis',
    'Barnet|service_outcomes',
    'Barnet|service_spending',
    'Barnet|waste_destinations',
    'Barnet|chief_executive_salary',               // CE turnover (Hooton left, Cath Shaw took over).
    'Barnet|staff_fte',
    'Barnet|savings_target',
    'Barnet|budget_gap',
    'Haringey|cabinet',
    'Haringey|council_leader',
    'Haringey|councillor_basic_allowance',
    'Haringey|leader_allowance',
    'Haringey|total_allowances_cost',
    'Haringey|councillor_allowances_detail',
    'Haringey|salary_bands',
    'Haringey|top_suppliers',
    'Haringey|grant_payments',
    'Haringey|performance_kpis',
    'Haringey|service_outcomes',
    'Haringey|service_spending',
    'Haringey|waste_destinations',
    'Haringey|staff_fte',
    'Haringey|savings_target',
    'Haringey|budget_gap',
    'Merton|cabinet',
    'Merton|council_leader',
    'Merton|councillor_basic_allowance',
    'Merton|leader_allowance',
    'Merton|total_allowances_cost',
    'Merton|councillor_allowances_detail',
    'Merton|salary_bands',
    'Merton|top_suppliers',
    'Merton|grant_payments',
    'Merton|performance_kpis',
    'Merton|service_outcomes',
    'Merton|service_spending',
    'Merton|waste_destinations',
    'Merton|staff_fte',
    'Merton|savings_target',
    'Merton|budget_gap',
    // 2026-04-26 Batch-16 UAs.
    'Cheshire East|cabinet',
    'Cheshire East|council_leader',
    'Cheshire East|councillor_basic_allowance',
    'Cheshire East|leader_allowance',
    'Cheshire East|total_allowances_cost',
    'Cheshire East|councillor_allowances_detail',
    'Cheshire East|salary_bands',
    'Cheshire East|top_suppliers',
    'Cheshire East|grant_payments',
    'Cheshire East|performance_kpis',
    'Cheshire East|service_outcomes',
    'Cheshire East|service_spending',
    'Cheshire East|waste_destinations',
    'Cheshire East|staff_fte',
    'Cheshire East|savings_target',
    'Cheshire East|budget_gap',
    'Cheshire West & Chester|cabinet',
    'Cheshire West & Chester|council_leader',
    'Cheshire West & Chester|councillor_basic_allowance',
    'Cheshire West & Chester|leader_allowance',
    'Cheshire West & Chester|total_allowances_cost',
    'Cheshire West & Chester|councillor_allowances_detail',
    'Cheshire West & Chester|salary_bands',
    'Cheshire West & Chester|top_suppliers',
    'Cheshire West & Chester|grant_payments',
    'Cheshire West & Chester|performance_kpis',
    'Cheshire West & Chester|service_outcomes',
    'Cheshire West & Chester|service_spending',
    'Cheshire West & Chester|waste_destinations',
    'Cheshire West & Chester|staff_fte',
    'Cheshire West & Chester|savings_target',
    'Cheshire West & Chester|budget_gap',
    'Buckinghamshire|cabinet',
    'Buckinghamshire|council_leader',
    'Buckinghamshire|councillor_basic_allowance',
    'Buckinghamshire|leader_allowance',
    'Buckinghamshire|total_allowances_cost',
    'Buckinghamshire|councillor_allowances_detail',
    'Buckinghamshire|salary_bands',
    'Buckinghamshire|top_suppliers',
    'Buckinghamshire|grant_payments',
    'Buckinghamshire|performance_kpis',
    'Buckinghamshire|service_outcomes',
    'Buckinghamshire|service_spending',
    'Buckinghamshire|waste_destinations',
    'Buckinghamshire|staff_fte',
    'Buckinghamshire|savings_target',
    'Buckinghamshire|budget_gap',
    'Bedford|cabinet',
    'Bedford|council_leader',
    'Bedford|councillor_basic_allowance',
    'Bedford|leader_allowance',
    'Bedford|total_allowances_cost',
    'Bedford|councillor_allowances_detail',
    'Bedford|salary_bands',
    'Bedford|top_suppliers',
    'Bedford|grant_payments',
    'Bedford|performance_kpis',
    'Bedford|service_outcomes',
    'Bedford|service_spending',
    'Bedford|waste_destinations',
    'Bedford|staff_fte',
    'Bedford|savings_target',
    'Bedford|budget_gap',
    // 2026-04-26 Batch-17 LBs.
    'Kingston upon Thames|cabinet',
    'Kingston upon Thames|council_leader',
    'Kingston upon Thames|councillor_basic_allowance',
    'Kingston upon Thames|leader_allowance',
    'Kingston upon Thames|total_allowances_cost',
    'Kingston upon Thames|councillor_allowances_detail',
    'Kingston upon Thames|salary_bands',
    'Kingston upon Thames|top_suppliers',
    'Kingston upon Thames|grant_payments',
    'Kingston upon Thames|performance_kpis',
    'Kingston upon Thames|service_outcomes',
    'Kingston upon Thames|service_spending',
    'Kingston upon Thames|waste_destinations',
    'Kingston upon Thames|staff_fte',
    'Kingston upon Thames|savings_target',
    'Kingston upon Thames|budget_gap',
    'Kensington & Chelsea|cabinet',
    'Kensington & Chelsea|council_leader',
    'Kensington & Chelsea|councillor_basic_allowance',
    'Kensington & Chelsea|leader_allowance',
    'Kensington & Chelsea|total_allowances_cost',
    'Kensington & Chelsea|councillor_allowances_detail',
    'Kensington & Chelsea|salary_bands',
    'Kensington & Chelsea|top_suppliers',
    'Kensington & Chelsea|grant_payments',
    'Kensington & Chelsea|performance_kpis',
    'Kensington & Chelsea|service_outcomes',
    'Kensington & Chelsea|service_spending',
    'Kensington & Chelsea|waste_destinations',
    'Kensington & Chelsea|staff_fte',
    'Kensington & Chelsea|savings_target',
    'Kensington & Chelsea|budget_gap',
    'Redbridge|cabinet',
    'Redbridge|council_leader',
    'Redbridge|councillor_basic_allowance',
    'Redbridge|leader_allowance',
    'Redbridge|total_allowances_cost',
    'Redbridge|councillor_allowances_detail',
    'Redbridge|salary_bands',
    'Redbridge|top_suppliers',
    'Redbridge|grant_payments',
    'Redbridge|performance_kpis',
    'Redbridge|service_outcomes',
    'Redbridge|service_spending',
    'Redbridge|waste_destinations',
    'Redbridge|chief_executive_salary',             // Multiple CE turnover in 2024/25.
    'Redbridge|staff_fte',
    'Redbridge|savings_target',
    'Redbridge|budget_gap',
    'Waltham Forest|cabinet',
    'Waltham Forest|council_leader',
    'Waltham Forest|councillor_basic_allowance',
    'Waltham Forest|leader_allowance',
    'Waltham Forest|total_allowances_cost',
    'Waltham Forest|councillor_allowances_detail',
    'Waltham Forest|salary_bands',
    'Waltham Forest|top_suppliers',
    'Waltham Forest|grant_payments',
    'Waltham Forest|performance_kpis',
    'Waltham Forest|service_outcomes',
    'Waltham Forest|service_spending',
    'Waltham Forest|waste_destinations',
    'Waltham Forest|staff_fte',
    'Waltham Forest|savings_target',
    'Waltham Forest|budget_gap',
    // 2026-04-26 Batch-18 UAs.
    'Bath & North East Somerset|cabinet',
    'Bath & North East Somerset|council_leader',
    'Bath & North East Somerset|councillor_basic_allowance',
    'Bath & North East Somerset|leader_allowance',
    'Bath & North East Somerset|total_allowances_cost',
    'Bath & North East Somerset|councillor_allowances_detail',
    'Bath & North East Somerset|salary_bands',
    'Bath & North East Somerset|top_suppliers',
    'Bath & North East Somerset|grant_payments',
    'Bath & North East Somerset|performance_kpis',
    'Bath & North East Somerset|service_outcomes',
    'Bath & North East Somerset|service_spending',
    'Bath & North East Somerset|waste_destinations',
    'Bath & North East Somerset|staff_fte',
    'Bath & North East Somerset|savings_target',
    'Bath & North East Somerset|budget_gap',
    'Halton|cabinet',
    'Halton|council_leader',
    'Halton|councillor_basic_allowance',
    'Halton|leader_allowance',
    'Halton|total_allowances_cost',
    'Halton|councillor_allowances_detail',
    'Halton|salary_bands',
    'Halton|top_suppliers',
    'Halton|grant_payments',
    'Halton|performance_kpis',
    'Halton|service_outcomes',
    'Halton|service_spending',
    'Halton|waste_destinations',
    'Halton|staff_fte',
    'Halton|savings_target',
    'Halton|budget_gap',
    'Bracknell Forest|cabinet',
    'Bracknell Forest|council_leader',
    'Bracknell Forest|councillor_basic_allowance',
    'Bracknell Forest|leader_allowance',
    'Bracknell Forest|total_allowances_cost',
    'Bracknell Forest|councillor_allowances_detail',
    'Bracknell Forest|salary_bands',
    'Bracknell Forest|top_suppliers',
    'Bracknell Forest|grant_payments',
    'Bracknell Forest|performance_kpis',
    'Bracknell Forest|service_outcomes',
    'Bracknell Forest|service_spending',
    'Bracknell Forest|waste_destinations',
    'Bracknell Forest|staff_fte',
    'Bracknell Forest|savings_target',
    'Bracknell Forest|budget_gap',
    'Wokingham|cabinet',
    'Wokingham|councillor_basic_allowance',
    'Wokingham|leader_allowance',
    'Wokingham|total_allowances_cost',
    'Wokingham|councillor_allowances_detail',
    'Wokingham|salary_bands',
    'Wokingham|top_suppliers',
    'Wokingham|grant_payments',
    'Wokingham|performance_kpis',
    'Wokingham|service_outcomes',
    'Wokingham|service_spending',
    'Wokingham|waste_destinations',
    'Wokingham|staff_fte',
    'Wokingham|savings_target',
    'Wokingham|budget_gap',
    // 2026-04-26 Batch-19 LBs.
    'Barking & Dagenham|cabinet',
    'Barking & Dagenham|council_leader',
    'Barking & Dagenham|councillor_basic_allowance',
    'Barking & Dagenham|leader_allowance',
    'Barking & Dagenham|total_allowances_cost',
    'Barking & Dagenham|councillor_allowances_detail',
    'Barking & Dagenham|salary_bands',
    'Barking & Dagenham|top_suppliers',
    'Barking & Dagenham|grant_payments',
    'Barking & Dagenham|performance_kpis',
    'Barking & Dagenham|service_outcomes',
    'Barking & Dagenham|service_spending',
    'Barking & Dagenham|waste_destinations',
    'Barking & Dagenham|chief_executive_salary',     // SoA Senior Officers table doesn't name CE.
    'Barking & Dagenham|staff_fte',
    'Barking & Dagenham|savings_target',
    'Barking & Dagenham|budget_gap',
    'Brent|cabinet',
    'Brent|council_leader',
    'Brent|councillor_basic_allowance',
    'Brent|leader_allowance',
    'Brent|total_allowances_cost',
    'Brent|councillor_allowances_detail',
    'Brent|salary_bands',
    'Brent|top_suppliers',
    'Brent|grant_payments',
    'Brent|performance_kpis',
    'Brent|service_outcomes',
    'Brent|service_spending',
    'Brent|waste_destinations',
    'Brent|staff_fte',
    'Brent|savings_target',
    'Brent|budget_gap',
    'Ealing|cabinet',
    'Ealing|council_leader',
    'Ealing|councillor_basic_allowance',
    'Ealing|leader_allowance',
    'Ealing|total_allowances_cost',
    'Ealing|councillor_allowances_detail',
    'Ealing|salary_bands',
    'Ealing|top_suppliers',
    'Ealing|grant_payments',
    'Ealing|performance_kpis',
    'Ealing|service_outcomes',
    'Ealing|service_spending',
    'Ealing|waste_destinations',
    'Ealing|staff_fte',
    'Ealing|savings_target',
    'Ealing|budget_gap',
    // 2026-04-26 Batch-20 NE UAs.
    'Cumberland|cabinet',
    'Cumberland|council_leader',
    'Cumberland|councillor_basic_allowance',
    'Cumberland|leader_allowance',
    'Cumberland|total_allowances_cost',
    'Cumberland|councillor_allowances_detail',
    'Cumberland|salary_bands',
    'Cumberland|top_suppliers',
    'Cumberland|grant_payments',
    'Cumberland|performance_kpis',
    'Cumberland|service_outcomes',
    'Cumberland|service_spending',
    'Cumberland|waste_destinations',
    'Cumberland|staff_fte',
    'Cumberland|savings_target',
    'Cumberland|budget_gap',
    'Hartlepool|cabinet',
    'Hartlepool|council_leader',
    'Hartlepool|councillor_basic_allowance',
    'Hartlepool|leader_allowance',
    'Hartlepool|total_allowances_cost',
    'Hartlepool|councillor_allowances_detail',
    'Hartlepool|salary_bands',
    'Hartlepool|top_suppliers',
    'Hartlepool|grant_payments',
    'Hartlepool|performance_kpis',
    'Hartlepool|service_outcomes',
    'Hartlepool|service_spending',
    'Hartlepool|waste_destinations',
    'Hartlepool|staff_fte',
    'Hartlepool|savings_target',
    'Hartlepool|budget_gap',
    'Middlesbrough|cabinet',
    'Middlesbrough|council_leader',
    'Middlesbrough|councillor_basic_allowance',
    'Middlesbrough|leader_allowance',
    'Middlesbrough|total_allowances_cost',
    'Middlesbrough|councillor_allowances_detail',
    'Middlesbrough|salary_bands',
    'Middlesbrough|top_suppliers',
    'Middlesbrough|grant_payments',
    'Middlesbrough|performance_kpis',
    'Middlesbrough|service_outcomes',
    'Middlesbrough|service_spending',
    'Middlesbrough|waste_destinations',
    'Middlesbrough|chief_executive_salary',         // Interim CE in 2024/25, no clean salary attribution.
    'Middlesbrough|staff_fte',
    'Middlesbrough|savings_target',
    'Middlesbrough|budget_gap',
    'Redcar & Cleveland|cabinet',
    'Redcar & Cleveland|council_leader',
    'Redcar & Cleveland|councillor_basic_allowance',
    'Redcar & Cleveland|leader_allowance',
    'Redcar & Cleveland|total_allowances_cost',
    'Redcar & Cleveland|councillor_allowances_detail',
    'Redcar & Cleveland|salary_bands',
    'Redcar & Cleveland|top_suppliers',
    'Redcar & Cleveland|grant_payments',
    'Redcar & Cleveland|performance_kpis',
    'Redcar & Cleveland|service_outcomes',
    'Redcar & Cleveland|service_spending',
    'Redcar & Cleveland|waste_destinations',
    'Redcar & Cleveland|chief_executive_salary',    // SoA only confirms exceeds £150k threshold.
    'Redcar & Cleveland|staff_fte',
    'Redcar & Cleveland|savings_target',
    'Redcar & Cleveland|budget_gap',
    // 2026-04-26 Batch-21 UAs.
    'Westmorland and Furness|cabinet',
    'Westmorland and Furness|council_leader',
    'Westmorland and Furness|councillor_basic_allowance',
    'Westmorland and Furness|leader_allowance',
    'Westmorland and Furness|total_allowances_cost',
    'Westmorland and Furness|councillor_allowances_detail',
    'Westmorland and Furness|salary_bands',
    'Westmorland and Furness|top_suppliers',
    'Westmorland and Furness|grant_payments',
    'Westmorland and Furness|performance_kpis',
    'Westmorland and Furness|service_outcomes',
    'Westmorland and Furness|service_spending',
    'Westmorland and Furness|waste_destinations',
    'Westmorland and Furness|staff_fte',
    'Westmorland and Furness|savings_target',
    'Westmorland and Furness|budget_gap',
    'North Lincolnshire|cabinet',
    'North Lincolnshire|council_leader',
    'North Lincolnshire|councillor_basic_allowance',
    'North Lincolnshire|leader_allowance',
    'North Lincolnshire|total_allowances_cost',
    'North Lincolnshire|councillor_allowances_detail',
    'North Lincolnshire|salary_bands',
    'North Lincolnshire|top_suppliers',
    'North Lincolnshire|grant_payments',
    'North Lincolnshire|performance_kpis',
    'North Lincolnshire|service_outcomes',
    'North Lincolnshire|service_spending',
    'North Lincolnshire|waste_destinations',
    'North Lincolnshire|staff_fte',
    'North Lincolnshire|savings_target',
    'North Lincolnshire|budget_gap',
    'North East Lincolnshire|cabinet',
    'North East Lincolnshire|council_leader',
    'North East Lincolnshire|councillor_basic_allowance',
    'North East Lincolnshire|leader_allowance',
    'North East Lincolnshire|total_allowances_cost',
    'North East Lincolnshire|councillor_allowances_detail',
    'North East Lincolnshire|salary_bands',
    'North East Lincolnshire|top_suppliers',
    'North East Lincolnshire|grant_payments',
    'North East Lincolnshire|performance_kpis',
    'North East Lincolnshire|service_outcomes',
    'North East Lincolnshire|service_spending',
    'North East Lincolnshire|waste_destinations',
    'North East Lincolnshire|staff_fte',
    'North East Lincolnshire|savings_target',
    'North East Lincolnshire|budget_gap',
    'East Riding of Yorkshire|cabinet',
    'East Riding of Yorkshire|council_leader',
    'East Riding of Yorkshire|councillor_basic_allowance',
    'East Riding of Yorkshire|leader_allowance',
    'East Riding of Yorkshire|total_allowances_cost',
    'East Riding of Yorkshire|councillor_allowances_detail',
    'East Riding of Yorkshire|salary_bands',
    'East Riding of Yorkshire|top_suppliers',
    'East Riding of Yorkshire|grant_payments',
    'East Riding of Yorkshire|performance_kpis',
    'East Riding of Yorkshire|service_outcomes',
    'East Riding of Yorkshire|service_spending',
    'East Riding of Yorkshire|waste_destinations',
    'East Riding of Yorkshire|chief_executive_salary',  // Interim CE — salary not directly attributed.
    'East Riding of Yorkshire|staff_fte',
    'East Riding of Yorkshire|savings_target',
    'East Riding of Yorkshire|budget_gap',
    // 2026-04-26 Batch-22 UAs.
    'Medway Towns|cabinet',
    'Medway Towns|council_leader',
    'Medway Towns|councillor_basic_allowance',
    'Medway Towns|leader_allowance',
    'Medway Towns|total_allowances_cost',
    'Medway Towns|councillor_allowances_detail',
    'Medway Towns|salary_bands',
    'Medway Towns|top_suppliers',
    'Medway Towns|grant_payments',
    'Medway Towns|performance_kpis',
    'Medway Towns|service_outcomes',
    'Medway Towns|service_spending',
    'Medway Towns|waste_destinations',
    'Medway Towns|chief_executive_salary',  // Only confirms exceeds £150k.
    'Medway Towns|staff_fte',
    'Medway Towns|savings_target',
    'Medway Towns|budget_gap',
    'Milton Keynes|cabinet',
    'Milton Keynes|chief_executive',         // SoA Senior Officers table doesn't name CE.
    'Milton Keynes|councillor_basic_allowance',
    'Milton Keynes|leader_allowance',
    'Milton Keynes|total_allowances_cost',
    'Milton Keynes|councillor_allowances_detail',
    'Milton Keynes|salary_bands',
    'Milton Keynes|top_suppliers',
    'Milton Keynes|grant_payments',
    'Milton Keynes|performance_kpis',
    'Milton Keynes|service_outcomes',
    'Milton Keynes|service_spending',
    'Milton Keynes|waste_destinations',
    'Milton Keynes|chief_executive_salary',
    'Milton Keynes|staff_fte',
    'Milton Keynes|savings_target',
    'Milton Keynes|budget_gap',
    'Swindon|cabinet',
    'Swindon|council_leader',
    'Swindon|councillor_basic_allowance',
    'Swindon|leader_allowance',
    'Swindon|total_allowances_cost',
    'Swindon|councillor_allowances_detail',
    'Swindon|salary_bands',
    'Swindon|top_suppliers',
    'Swindon|grant_payments',
    'Swindon|performance_kpis',
    'Swindon|service_outcomes',
    'Swindon|service_spending',
    'Swindon|waste_destinations',
    'Swindon|staff_fte',
    'Swindon|savings_target',
    'Swindon|budget_gap',
    // 2026-04-26 Batch-23.
    'Darlington|cabinet',
    'Darlington|council_leader',
    'Darlington|councillor_basic_allowance',
    'Darlington|leader_allowance',
    'Darlington|total_allowances_cost',
    'Darlington|councillor_allowances_detail',
    'Darlington|salary_bands',
    'Darlington|top_suppliers',
    'Darlington|grant_payments',
    'Darlington|performance_kpis',
    'Darlington|service_outcomes',
    'Darlington|service_spending',
    'Darlington|waste_destinations',
    'Darlington|staff_fte',
    'Darlington|savings_target',
    'Darlington|budget_gap',
    'Thurrock|cabinet',
    'Thurrock|council_leader',
    'Thurrock|councillor_basic_allowance',
    'Thurrock|leader_allowance',
    'Thurrock|total_allowances_cost',
    'Thurrock|councillor_allowances_detail',
    'Thurrock|salary_bands',
    'Thurrock|top_suppliers',
    'Thurrock|grant_payments',
    'Thurrock|performance_kpis',
    'Thurrock|service_outcomes',
    'Thurrock|service_spending',
    'Thurrock|waste_destinations',
    'Thurrock|chief_executive_salary',  // Only Asst CE in salary table.
    'Thurrock|staff_fte',
    'Thurrock|savings_target',
    'Thurrock|budget_gap',
    // 2026-04-26 Batch-24 UAs.
    'Derby|cabinet',
    'Derby|council_leader',
    'Derby|councillor_basic_allowance',
    'Derby|leader_allowance',
    'Derby|total_allowances_cost',
    'Derby|councillor_allowances_detail',
    'Derby|salary_bands',
    'Derby|top_suppliers',
    'Derby|grant_payments',
    'Derby|performance_kpis',
    'Derby|service_outcomes',
    'Derby|service_spending',
    'Derby|waste_destinations',
    'Derby|staff_fte',
    'Derby|savings_target',
    'Derby|budget_gap',
    'Leicester|cabinet',
    'Leicester|council_leader',
    'Leicester|councillor_basic_allowance',
    'Leicester|leader_allowance',
    'Leicester|total_allowances_cost',
    'Leicester|councillor_allowances_detail',
    'Leicester|salary_bands',
    'Leicester|top_suppliers',
    'Leicester|grant_payments',
    'Leicester|performance_kpis',
    'Leicester|service_outcomes',
    'Leicester|service_spending',
    'Leicester|waste_destinations',
    'Leicester|staff_fte',
    'Leicester|savings_target',
    'Leicester|budget_gap',
    'Nottingham|cabinet',
    'Nottingham|council_leader',
    'Nottingham|councillor_basic_allowance',
    'Nottingham|leader_allowance',
    'Nottingham|total_allowances_cost',
    'Nottingham|councillor_allowances_detail',
    'Nottingham|salary_bands',
    'Nottingham|top_suppliers',
    'Nottingham|grant_payments',
    'Nottingham|performance_kpis',
    'Nottingham|service_outcomes',
    'Nottingham|service_spending',
    'Nottingham|waste_destinations',
    'Nottingham|staff_fte',
    'Nottingham|savings_target',
    'Nottingham|budget_gap',
    // 2026-04-26 Batch-25 UAs.
    'North Somerset|cabinet',
    'North Somerset|council_leader',
    'North Somerset|councillor_basic_allowance',
    'North Somerset|leader_allowance',
    'North Somerset|total_allowances_cost',
    'North Somerset|councillor_allowances_detail',
    'North Somerset|salary_bands',
    'North Somerset|top_suppliers',
    'North Somerset|grant_payments',
    'North Somerset|performance_kpis',
    'North Somerset|service_outcomes',
    'North Somerset|service_spending',
    'North Somerset|waste_destinations',
    'North Somerset|staff_fte',
    'North Somerset|savings_target',
    'North Somerset|budget_gap',
    'West Berkshire|cabinet',
    'West Berkshire|council_leader',
    'West Berkshire|councillor_basic_allowance',
    'West Berkshire|leader_allowance',
    'West Berkshire|total_allowances_cost',
    'West Berkshire|councillor_allowances_detail',
    'West Berkshire|salary_bands',
    'West Berkshire|top_suppliers',
    'West Berkshire|grant_payments',
    'West Berkshire|performance_kpis',
    'West Berkshire|service_outcomes',
    'West Berkshire|service_spending',
    'West Berkshire|waste_destinations',
    'West Berkshire|chief_executive_salary',  // CE turnover (Lynn → Holmes).
    'West Berkshire|staff_fte',
    'West Berkshire|savings_target',
    'West Berkshire|budget_gap',
    'Shropshire|cabinet',
    'Shropshire|council_leader',
    'Shropshire|councillor_basic_allowance',
    'Shropshire|leader_allowance',
    'Shropshire|total_allowances_cost',
    'Shropshire|councillor_allowances_detail',
    'Shropshire|salary_bands',
    'Shropshire|top_suppliers',
    'Shropshire|grant_payments',
    'Shropshire|performance_kpis',
    'Shropshire|service_outcomes',
    'Shropshire|service_spending',
    'Shropshire|waste_destinations',
    'Shropshire|staff_fte',
    'Shropshire|savings_target',
    'Shropshire|budget_gap',
    // 2026-04-26 Batch-26.
    'Torbay|cabinet',
    'Torbay|council_leader',
    'Torbay|councillor_basic_allowance',
    'Torbay|leader_allowance',
    'Torbay|total_allowances_cost',
    'Torbay|councillor_allowances_detail',
    'Torbay|salary_bands',
    'Torbay|top_suppliers',
    'Torbay|grant_payments',
    'Torbay|performance_kpis',
    'Torbay|service_outcomes',
    'Torbay|service_spending',
    'Torbay|waste_destinations',
    'Torbay|staff_fte',
    'Torbay|savings_target',
    'Torbay|budget_gap',
    // 2026-04-26 Batch-27 Cloudflare-bypass rollout: 7 councils whose SoAs
    // were Cloudflare/Azure WAF-blocked on direct fetch, retrieved via
    // Wayback /save/ endpoint (allowlisted crawler). Same Bradford strip
    // checklist applied. CE name + salary verified verbatim from SoA
    // (Lewisham p78, Islington p64, Havering p91, BCP p62, Central Beds p110,
    // W&M p64). Isle of Wight CE name stripped (SoA p75 only labels role,
    // doesn't name CE).
    ...['Bournemouth, Christchurch & Poole', 'Lewisham', 'Islington', 'Havering',
        'Isle of Wight', 'Central Bedfordshire', 'Windsor & Maidenhead'].flatMap(c => [
      `${c}|cabinet`,
      `${c}|council_leader`,
      `${c}|councillor_allowances_detail`,
      `${c}|councillor_basic_allowance`,
      `${c}|salary_bands`,
      `${c}|grant_payments`,
      `${c}|top_suppliers`,
      `${c}|performance_kpis`,
      `${c}|service_outcomes`,
      `${c}|service_spending`,
      `${c}|waste_destinations`,
      `${c}|staff_fte`,
      `${c}|total_allowances_cost`,
      `${c}|savings_target`,
      `${c}|budget_gap`,
      `${c}|documents`,
    ]),
    // Isle of Wight: CE name stripped (SoA only labels role generically).
    'Isle of Wight|chief_executive',
    // 2026-04-29 Batch-28 metropolitan districts via direct fetch + selective Wayback /save/:
    // Bury, Kirklees, North Tyneside, Rochdale, Wigan, Rotherham, Walsall.
    // Same Bradford strip-list applied via batch-27-strip.mjs.
    ...['Bury', 'Kirklees', 'North Tyneside', 'Rochdale', 'Wigan', 'Rotherham', 'Walsall'].flatMap(c => [
      `${c}|cabinet`,
      `${c}|council_leader`,
      `${c}|councillor_allowances_detail`,
      `${c}|councillor_basic_allowance`,
      `${c}|salary_bands`,
      `${c}|grant_payments`,
      `${c}|top_suppliers`,
      `${c}|performance_kpis`,
      `${c}|service_outcomes`,
      `${c}|service_spending`,
      `${c}|waste_destinations`,
      `${c}|staff_fte`,
      `${c}|total_allowances_cost`,
      `${c}|savings_target`,
      `${c}|budget_gap`,
      `${c}|documents`,
    ]),
    // North Tyneside: CE name stripped (Paul Hanson left mid-year, Jackie Laughton interim from Jan 2025; SoA p93 doesn't name CE).
    'North Tyneside|chief_executive',
    // 2026-04-29 Batch-29: 2 UAs (Durham, Northumberland), 1 MD (Knowsley),
    // 3 LBs (Harrow, Sutton, Richmond upon Thames). Same Bradford strip-list.
    ...['Durham', 'Northumberland', 'Harrow', 'Knowsley', 'Sutton', 'Richmond upon Thames'].flatMap(c => [
      `${c}|cabinet`,
      `${c}|council_leader`,
      `${c}|councillor_allowances_detail`,
      `${c}|councillor_basic_allowance`,
      `${c}|salary_bands`,
      `${c}|grant_payments`,
      `${c}|top_suppliers`,
      `${c}|performance_kpis`,
      `${c}|service_outcomes`,
      `${c}|service_spending`,
      `${c}|waste_destinations`,
      `${c}|staff_fte`,
      `${c}|total_allowances_cost`,
      `${c}|savings_target`,
      `${c}|budget_gap`,
      `${c}|documents`,
    ]),
    // Richmond upon Thames: CE name stripped — multiple holders mid-year transition (Reilly interim + Jackson former).
    'Richmond upon Thames|chief_executive',
    // 2026-04-29 Batch-30: 1 UA (Blackpool) + 6 SDs. First districts in rollout.
    // SDs use a simpler structure but Bradford strip-list still applies; CE name
    // stripped for districts whose SoA remuneration table only labels the role.
    ...['Blackpool', 'East Hampshire', 'St Albans', 'West Lindsey', 'Pendle', 'Blaby', 'Erewash'].flatMap(c => [
      `${c}|cabinet`,
      `${c}|council_leader`,
      `${c}|councillor_allowances_detail`,
      `${c}|councillor_basic_allowance`,
      `${c}|salary_bands`,
      `${c}|grant_payments`,
      `${c}|top_suppliers`,
      `${c}|performance_kpis`,
      `${c}|service_outcomes`,
      `${c}|service_spending`,
      `${c}|waste_destinations`,
      `${c}|staff_fte`,
      `${c}|total_allowances_cost`,
      `${c}|savings_target`,
      `${c}|budget_gap`,
      `${c}|documents`,
    ]),
    // Districts where SoA remuneration table doesn't name the CE.
    'East Hampshire|chief_executive',
    'St Albans|chief_executive',
    'West Lindsey|chief_executive',
    'Pendle|chief_executive',
    'Blaby|chief_executive',
    'Erewash|chief_executive',
    // 2026-04-29 Batch-31: 7 more districts. Direct fetch from council websites.
    ...['Broxtowe', 'Stroud', 'Runnymede', 'West Oxfordshire', 'South Kesteven', 'South Oxfordshire', 'Epping Forest'].flatMap(c => [
      `${c}|cabinet`,
      `${c}|council_leader`,
      `${c}|councillor_allowances_detail`,
      `${c}|councillor_basic_allowance`,
      `${c}|salary_bands`,
      `${c}|grant_payments`,
      `${c}|top_suppliers`,
      `${c}|performance_kpis`,
      `${c}|service_outcomes`,
      `${c}|service_spending`,
      `${c}|waste_destinations`,
      `${c}|staff_fte`,
      `${c}|total_allowances_cost`,
      `${c}|savings_target`,
      `${c}|budget_gap`,
      `${c}|documents`,
    ]),
    // Districts where SoA remuneration table doesn't name the CE (only Stroud + Epping Forest do).
    'Broxtowe|chief_executive',
    'Runnymede|chief_executive',
    'West Oxfordshire|chief_executive',
    'South Kesteven|chief_executive',
    'South Oxfordshire|chief_executive',
    // 2026-04-29 Batch-32: 8 more districts. Direct fetch (5) + Wayback /save/ (1 — Bassetlaw).
    // Same Bradford strip-list. CE name+salary stripped where SoA shows turnover or joint arrangement.
    ...['Adur', 'Basildon', 'Bassetlaw', 'Braintree', 'Brentwood', 'Burnley', 'Cambridge', 'Cannock Chase'].flatMap(c => [
      `${c}|cabinet`,
      `${c}|council_leader`,
      `${c}|councillor_allowances_detail`,
      `${c}|councillor_basic_allowance`,
      `${c}|salary_bands`,
      `${c}|grant_payments`,
      `${c}|top_suppliers`,
      `${c}|performance_kpis`,
      `${c}|service_outcomes`,
      `${c}|service_spending`,
      `${c}|waste_destinations`,
      `${c}|staff_fte`,
      `${c}|total_allowances_cost`,
      `${c}|savings_target`,
      `${c}|budget_gap`,
      `${c}|documents`,
    ]),
    // Where the SoA shows CE turnover or doesn't name the CE in the remuneration table:
    'Basildon|chief_executive',         // Turnover during 2024/25 — Gary Jones (from 20.1.2025) + Scott Logan (to)
    'Basildon|chief_executive_salary',  // Both partial-year amounts; no full-year figure
    'Burnley|chief_executive',          // SoA Note 22a labels role only; doesn't name CE in archived doc
    'Cannock Chase|chief_executive',         // Joint CE with Stafford BC — costs split, no isolated figure
    'Cannock Chase|chief_executive_salary',  // Same — joint arrangement
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
