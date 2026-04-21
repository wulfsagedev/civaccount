/**
 * Renderable-fields manifest.
 *
 * Authoritative list of every numeric or named field that renders on a
 * council page. Each entry classifies the field by origin (see
 * PROVENANCE-INTEGRITY-PLAN.md §2 Categories A-E) and records the
 * canonical source manifest id (for Category A — national datasets) or
 * the rendering policy (for B/C/D/E).
 *
 * This registry is the single contract that drives:
 *   - the `provenance-strict` validator
 *   - the DataValidationNotice decisions (which fields get the notice)
 *   - the row-level citation builder (Phase 3)
 *   - the /data-validation status page
 *
 * When a new rendered field is added to a dashboard component, add it
 * here too. Anything rendering a number that isn't in this registry is
 * a compliance bug.
 */

export type FieldOrigin =
  /** National CSV/ODS with row-level citation achievable (Category A). */
  | 'national_csv'
  /** Per-council PDF scrape; needs page-level citation (Category B). */
  | 'council_pdf'
  /** Per-council HTML scrape (moderngov, portfolio-holders page). */
  | 'council_html'
  /** Aggregate from multiple source rows (Category C). */
  | 'aggregate'
  /** Calculated from other fields via transparent derivation (Category D). */
  | 'calculated'
  /** Editorial / LLM-generated text (Category D). */
  | 'editorial'
  /** Formerly rendered, now withdrawn (e.g. KPI RAG colours removed 2026-04-21). */
  | 'removed'
  /** Source origin not yet traced — blocks shipping (Category E). */
  | 'under_review';

export interface RenderableField {
  /** Dot-path used by SourceAnnotation + getProvenance(). */
  path: string;
  origin: FieldOrigin;
  /** For national_csv origins: the source-manifest.json id. */
  dataset_id?: string;
  /** For csv origins: which column holds the value, and how rows are keyed. */
  csv_column?: string;
  /** For national_csv / council_pdf: the parsed file path relative to the bulk data dir. */
  source_file?: string;
  /** Human-readable field label for the /data-validation status table. */
  label: string;
  /**
   * Verification status as of the last audit.
   * 'verified_source' — source exists + row-level citation achievable
   * 'in_progress'     — visible but not row-level-cited yet
   * 'removed'         — formerly rendered, now withdrawn (e.g. RAG colours)
   */
  status: 'verified_source' | 'in_progress' | 'removed';
}

/**
 * CATEGORY A — national datasets, row-keyed by ONS code unless noted.
 * Each has a parsed CSV in src/data/councils/pdfs/gov-uk-bulk-data/.
 */
const CATEGORY_A: RenderableField[] = [
  // Council tax (MHCLG live tables, 2026-27 release published 25 March 2026)
  { path: 'council_tax.band_d_2026', origin: 'national_csv', dataset_id: 'area-council-tax', source_file: 'parsed-area-band-d.csv', csv_column: 'band_d_2026', label: 'Band D council tax 2026-27', status: 'verified_source' },
  { path: 'council_tax.band_d_2025', origin: 'national_csv', dataset_id: 'area-council-tax', source_file: 'parsed-area-band-d.csv', csv_column: 'band_d_2025', label: 'Band D council tax 2025-26', status: 'verified_source' },
  { path: 'council_tax.band_d_2024', origin: 'national_csv', dataset_id: 'area-council-tax', source_file: 'parsed-area-band-d.csv', csv_column: 'band_d_2024', label: 'Band D council tax 2024-25', status: 'verified_source' },
  { path: 'council_tax.band_d_2023', origin: 'national_csv', dataset_id: 'area-council-tax', source_file: 'parsed-area-band-d.csv', csv_column: 'band_d_2023', label: 'Band D council tax 2023-24', status: 'verified_source' },
  { path: 'council_tax.band_d_2022', origin: 'national_csv', dataset_id: 'area-council-tax', source_file: 'parsed-area-band-d.csv', csv_column: 'band_d_2022', label: 'Band D council tax 2022-23', status: 'verified_source' },
  { path: 'council_tax.band_d_2021', origin: 'national_csv', dataset_id: 'area-council-tax', source_file: 'parsed-area-band-d.csv', csv_column: 'band_d_2021', label: 'Band D council tax 2021-22', status: 'verified_source' },

  // Revenue outturn Part 1 (budget categories)
  { path: 'budget.education', origin: 'national_csv', dataset_id: 'revenue-expenditure-part1', source_file: 'gov-uk-ra-data/RA_Part1_LA_Data.csv', csv_column: 'TOTAL EDUCATION SERVICES', label: 'Education budget', status: 'verified_source' },
  { path: 'budget.transport', origin: 'national_csv', dataset_id: 'revenue-expenditure-part1', source_file: 'gov-uk-ra-data/RA_Part1_LA_Data.csv', csv_column: 'TOTAL HIGHWAYS AND TRANSPORT SERVICES', label: 'Transport budget', status: 'verified_source' },
  { path: 'budget.childrens_social_care', origin: 'national_csv', dataset_id: 'revenue-expenditure-part1', source_file: 'gov-uk-ra-data/RA_Part1_LA_Data.csv', csv_column: "TOTAL CHILDREN'S SOCIAL CARE SERVICES", label: "Children's social care budget", status: 'verified_source' },
  { path: 'budget.adult_social_care', origin: 'national_csv', dataset_id: 'revenue-expenditure-part1', source_file: 'gov-uk-ra-data/RA_Part1_LA_Data.csv', csv_column: 'TOTAL ADULT SOCIAL CARE SERVICES', label: 'Adult social care budget', status: 'verified_source' },
  { path: 'budget.public_health', origin: 'national_csv', dataset_id: 'revenue-expenditure-part1', source_file: 'gov-uk-ra-data/RA_Part1_LA_Data.csv', csv_column: 'TOTAL PUBLIC HEALTH', label: 'Public health budget', status: 'verified_source' },
  { path: 'budget.housing', origin: 'national_csv', dataset_id: 'revenue-expenditure-part1', source_file: 'gov-uk-ra-data/RA_Part1_LA_Data.csv', csv_column: 'TOTAL HOUSING SERVICES (GFRA only)', label: 'Housing budget', status: 'verified_source' },
  { path: 'budget.cultural', origin: 'national_csv', dataset_id: 'revenue-expenditure-part1', source_file: 'gov-uk-ra-data/RA_Part1_LA_Data.csv', csv_column: 'TOTAL CULTURAL AND RELATED SERVICES', label: 'Cultural / parks budget', status: 'verified_source' },
  { path: 'budget.environmental', origin: 'national_csv', dataset_id: 'revenue-expenditure-part1', source_file: 'gov-uk-ra-data/RA_Part1_LA_Data.csv', csv_column: 'TOTAL ENVIRONMENTAL AND REGULATORY SERVICES', label: 'Environmental budget', status: 'verified_source' },
  { path: 'budget.planning', origin: 'national_csv', dataset_id: 'revenue-expenditure-part1', source_file: 'gov-uk-ra-data/RA_Part1_LA_Data.csv', csv_column: 'TOTAL PLANNING AND DEVELOPMENT SERVICES', label: 'Planning budget', status: 'verified_source' },
  { path: 'budget.central_services', origin: 'national_csv', dataset_id: 'revenue-expenditure-part1', source_file: 'gov-uk-ra-data/RA_Part1_LA_Data.csv', csv_column: 'TOTAL CENTRAL SERVICES', label: 'Central services budget', status: 'verified_source' },
  { path: 'budget.other', origin: 'national_csv', dataset_id: 'revenue-expenditure-part1', source_file: 'gov-uk-ra-data/RA_Part1_LA_Data.csv', csv_column: 'TOTAL OTHER SERVICES', label: 'Other services budget', status: 'verified_source' },
  { path: 'budget.total_service', origin: 'national_csv', dataset_id: 'revenue-expenditure-part1', source_file: 'gov-uk-ra-data/RA_Part1_LA_Data.csv', csv_column: 'TOTAL SERVICE EXPENDITURE', label: 'Total service budget', status: 'verified_source' },

  // Revenue outturn Part 2
  { path: 'budget.net_current', origin: 'national_csv', dataset_id: 'revenue-expenditure-part2', source_file: 'gov-uk-ra-data/RA_Part2_LA_Data.csv', csv_column: 'NET CURRENT EXPENDITURE', label: 'Net current expenditure', status: 'verified_source' },
  { path: 'detailed.reserves', origin: 'national_csv', dataset_id: 'reserves', source_file: 'parsed-reserves.csv', csv_column: 'reserves_k', label: 'Reserves (total usable)', status: 'verified_source' },

  // Population
  { path: 'population', origin: 'national_csv', dataset_id: 'ons-population-mid2024', source_file: 'parsed-population.csv', csv_column: 'population', label: 'Population (mid-2024)', status: 'verified_source' },

  // Waste (DEFRA)
  { path: 'detailed.waste_destinations', origin: 'national_csv', dataset_id: 'defra-waste-2022-23', source_file: 'parsed-waste.csv', label: 'Waste destinations tonnage', status: 'verified_source' },
  { path: 'service_outcomes.waste.recycling_rate_percent', origin: 'national_csv', dataset_id: 'defra-waste-2022-23', source_file: 'parsed-waste.csv', csv_column: 'recycling_rate_pct', label: 'Recycling rate %', status: 'verified_source' },

  // Roads (DfT)
  { path: 'service_outcomes.roads.condition_good_percent', origin: 'national_csv', dataset_id: 'road-condition', source_file: 'parsed-road-condition.csv', csv_column: 'pct_green', label: 'Road condition (% good)', status: 'verified_source' },
  { path: 'service_outcomes.roads.maintained_miles', origin: 'national_csv', dataset_id: 'road-length', source_file: 'parsed-road-length.csv', csv_column: 'total_miles', label: 'Road length (miles)', status: 'verified_source' },

  // Ofsted children's services
  { path: 'service_outcomes.children_services.ofsted_rating', origin: 'national_csv', dataset_id: 'ofsted-childrens-services', source_file: 'parsed-ofsted.csv', csv_column: 'rating', label: "Ofsted children's services rating", status: 'verified_source' },

  // LGBCE councillor counts
  { path: 'detailed.total_councillors', origin: 'national_csv', dataset_id: 'lgbce-councillors', source_file: 'parsed-lgbce-councillors.csv', csv_column: 'total_councillors', label: 'Total councillors', status: 'verified_source' },

  // Capital expenditure
  { path: 'detailed.capital_programme', origin: 'national_csv', dataset_id: 'capital-expenditure', source_file: 'parsed-capital-expenditure.csv', csv_column: 'total', label: 'Capital programme', status: 'verified_source' },
];

/**
 * CATEGORY B — per-council PDF scrapes. Page-level citations
 * achievable in Phase 4 once PDFs are archived with page references.
 */
const CATEGORY_B: RenderableField[] = [
  { path: 'detailed.chief_executive_salary', origin: 'council_pdf', dataset_id: 'ceo-salary', label: 'CEO salary', status: 'in_progress' },
  { path: 'detailed.chief_executive_total_remuneration', origin: 'council_pdf', dataset_id: 'ceo-salary', label: 'CEO total remuneration', status: 'in_progress' },
  { path: 'detailed.councillor_basic_allowance', origin: 'council_pdf', label: 'Councillor basic allowance', status: 'in_progress' },
  { path: 'detailed.total_allowances_cost', origin: 'council_pdf', label: 'Total allowances cost', status: 'in_progress' },
  { path: 'detailed.councillor_allowances_detail', origin: 'council_pdf', label: 'Councillor allowances detail', status: 'in_progress' },
  { path: 'detailed.salary_bands', origin: 'council_pdf', label: 'Salary band distribution', status: 'in_progress' },
  { path: 'detailed.budget_gap', origin: 'council_pdf', label: 'Budget gap (MTFS)', status: 'in_progress' },
  { path: 'detailed.savings_target', origin: 'council_pdf', label: 'Savings target (MTFS)', status: 'in_progress' },
  { path: 'detailed.service_spending', origin: 'council_pdf', label: 'Service spending sub-categories', status: 'in_progress' },
];

/**
 * CATEGORY B (HTML) — per-council HTML scrapes.
 */
const CATEGORY_B_HTML: RenderableField[] = [
  { path: 'detailed.cabinet', origin: 'council_html', label: 'Cabinet / portfolio holders', status: 'in_progress' },
  { path: 'detailed.council_leader', origin: 'council_html', label: 'Council leader', status: 'in_progress' },
  { path: 'detailed.chief_executive', origin: 'council_html', label: 'Chief executive name', status: 'in_progress' },
];

/**
 * CATEGORY C — aggregates from multiple source rows.
 * Currently both render with DataValidationNotice.
 */
const CATEGORY_C: RenderableField[] = [
  { path: 'detailed.top_suppliers.annual_spend', origin: 'aggregate', label: 'Top suppliers annual spend', status: 'in_progress' },
  { path: 'detailed.grant_payments', origin: 'aggregate', label: 'Grant payments', status: 'in_progress' },
];

/**
 * CATEGORY D — calculated (transparent derivation) + editorial.
 * Editorial fields need removal or re-sourcing before they pass the rule.
 */
const CATEGORY_D: RenderableField[] = [
  { path: 'tax_bands', origin: 'calculated', label: 'Tax band A-H rates (× statutory ratios)', status: 'verified_source' },
  { path: 'per_capita_spend', origin: 'calculated', label: 'Per-capita spend', status: 'verified_source' },
  { path: 'per_capita_council_tax', origin: 'calculated', label: 'Per-capita council tax', status: 'verified_source' },
  { path: 'vs_average', origin: 'calculated', label: 'Compared-to-average comparator', status: 'verified_source' },
  { path: 'council_tax_increase_percent', origin: 'calculated', label: 'Council tax YoY change', status: 'verified_source' },
  { path: 'detailed.top_suppliers.description', origin: 'editorial', label: 'Supplier description (editorial)', status: 'in_progress' },
  { path: 'performance_kpis.status', origin: 'removed', label: 'KPI RAG colour (removed 2026-04-21)', status: 'removed' },
];

/**
 * CATEGORY E — origin not traced. These block shipping.
 */
const CATEGORY_E: RenderableField[] = [
  { path: 'detailed.staff_fte', origin: 'under_review', label: 'Staff FTE (build path under review)', status: 'in_progress' },
];

export const RENDERABLE_FIELDS: RenderableField[] = [
  ...CATEGORY_A,
  ...CATEGORY_B,
  ...CATEGORY_B_HTML,
  ...CATEGORY_C,
  ...CATEGORY_D,
  ...CATEGORY_E,
];

export const FIELDS_BY_PATH: Record<string, RenderableField> = Object.fromEntries(
  RENDERABLE_FIELDS.map((f) => [f.path, f])
);

export function getFieldManifest(path: string): RenderableField | undefined {
  return FIELDS_BY_PATH[path];
}
