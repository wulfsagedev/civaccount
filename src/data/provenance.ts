/**
 * Data provenance map — maps field paths to their authoritative source.
 *
 * This is the UI-facing counterpart to scripts/validate/source-manifest.json.
 * Each entry tells the SourceAnnotation component what label, source URL,
 * and data year to show when a user taps a data point.
 *
 * Field paths use dot notation. Wildcards (*) match any array index.
 * The getProvenance() helper resolves paths with fallback to council-specific sources.
 */

import type { DataProvenance, Council } from './councils';
import { resolveCitation } from './citations';
import { getVerifiedSupplierSource } from './suppliers-allowlist';

export const FIELD_PROVENANCE: Record<string, DataProvenance> = {
  // ── Council Tax ──
  'council_tax.band_d_2026': {
    label: 'published',
    source_url: 'https://www.gov.uk/government/statistical-data-sets/live-tables-on-council-tax',
    source_title: 'GOV.UK Council Tax Live Tables 2026-27',
    data_year: '2026-27',
  },
  'council_tax.band_d_2025': {
    label: 'published',
    source_url: 'https://www.gov.uk/government/statistical-data-sets/live-tables-on-council-tax',
    source_title: 'GOV.UK Council Tax Live Tables',
    data_year: '2025-26',
  },
  'council_tax.band_d_2024': {
    label: 'published',
    source_url: 'https://www.gov.uk/government/statistics/council-tax-levels-set-by-local-authorities-in-england-2025-to-2026',
    source_title: 'GOV.UK Council Tax Levels',
    data_year: '2024-25',
  },
  'council_tax_increase_percent': {
    label: 'calculated',
    source_url: 'https://www.gov.uk/government/statistical-data-sets/live-tables-on-council-tax',
    source_title: 'Year-on-year change — calculated from Band D live tables',
    data_year: '2024-25 → 2025-26',
    methodology: 'How much your Band D council tax went up compared to last year. Based on the rates the UK government publishes for every council each year.',
  },
  'tax_bands': {
    label: 'published',
    source_url: 'https://www.legislation.gov.uk/ukpga/1992/14/section/5',
    source_title: 'Council Tax Act 1992 s.5 — statutory band ratios',
    data_year: '2025-26',
    methodology: 'The eight bands (A to H) are set by law. Each one is a fixed fraction of Band D — for example, Band A is two-thirds of Band D, and Band H is twice as much. Every council publishes these eight figures on its own bills page; ours match exactly.',
  },
  'vs_average': {
    label: 'comparison',
    methodology: 'How this council compares to the average for similar councils.',
  },

  // ── Budget ──
  'budget.education': {
    label: 'published',
    source_url: 'https://www.gov.uk/government/collections/local-authority-revenue-expenditure-and-financing',
    source_title: 'Revenue Outturn (RO) Returns',
    data_year: '2024-25',
  },
  'budget.transport': {
    label: 'published',
    source_url: 'https://www.gov.uk/government/collections/local-authority-revenue-expenditure-and-financing',
    source_title: 'Revenue Outturn (RO) Returns',
    data_year: '2024-25',
  },
  'budget.total_service': {
    label: 'published',
    source_url: 'https://www.gov.uk/government/collections/local-authority-revenue-expenditure-and-financing',
    source_title: 'Revenue Outturn (RO) Returns',
    data_year: '2024-25',
  },
  // Catch-all for any budget field
  'budget': {
    label: 'published',
    source_url: 'https://www.gov.uk/government/collections/local-authority-revenue-expenditure-and-financing',
    source_title: 'Revenue Outturn (RO) Returns',
    data_year: '2024-25',
  },

  // ── Budget category details (GOV.UK Revenue Account) ──
  'budget.childrens_social_care': {
    label: 'published',
    source_title: 'GOV.UK Revenue Account 2025-26',
    source_url: 'https://www.gov.uk/government/collections/local-authority-revenue-expenditure-and-financing',
    data_year: '2025-26',
  },
  'budget.adult_social_care': {
    label: 'published',
    source_title: 'GOV.UK Revenue Account 2025-26',
    source_url: 'https://www.gov.uk/government/collections/local-authority-revenue-expenditure-and-financing',
    data_year: '2025-26',
  },
  'budget.public_health': {
    label: 'published',
    source_title: 'GOV.UK Revenue Account 2025-26',
    source_url: 'https://www.gov.uk/government/collections/local-authority-revenue-expenditure-and-financing',
    data_year: '2025-26',
  },
  'budget.housing': {
    label: 'published',
    source_title: 'GOV.UK Revenue Account 2025-26',
    source_url: 'https://www.gov.uk/government/collections/local-authority-revenue-expenditure-and-financing',
    data_year: '2025-26',
  },
  'budget.cultural': {
    label: 'published',
    source_title: 'GOV.UK Revenue Account 2025-26',
    source_url: 'https://www.gov.uk/government/collections/local-authority-revenue-expenditure-and-financing',
    data_year: '2025-26',
  },
  'budget.environmental': {
    label: 'published',
    source_title: 'GOV.UK Revenue Account 2025-26',
    source_url: 'https://www.gov.uk/government/collections/local-authority-revenue-expenditure-and-financing',
    data_year: '2025-26',
  },
  'budget.planning': {
    label: 'published',
    source_title: 'GOV.UK Revenue Account 2025-26',
    source_url: 'https://www.gov.uk/government/collections/local-authority-revenue-expenditure-and-financing',
    data_year: '2025-26',
  },
  'budget.central_services': {
    label: 'published',
    source_title: 'GOV.UK Revenue Account 2025-26',
    source_url: 'https://www.gov.uk/government/collections/local-authority-revenue-expenditure-and-financing',
    data_year: '2025-26',
  },
  'budget.other': {
    label: 'published',
    source_title: 'GOV.UK Revenue Account 2025-26',
    source_url: 'https://www.gov.uk/government/collections/local-authority-revenue-expenditure-and-financing',
    data_year: '2025-26',
  },
  'budget.net_current': {
    label: 'published',
    source_title: 'GOV.UK Revenue Account Part 2',
    source_url: 'https://www.gov.uk/government/collections/local-authority-revenue-expenditure-and-financing',
    data_year: '2025-26',
  },

  // ── Service spending detail ──
  'detailed.service_spending': {
    label: 'published',
    source_title: 'GOV.UK Revenue Account 2025-26',
    source_url: 'https://www.gov.uk/government/collections/local-authority-revenue-expenditure-and-financing',
    data_year: '2025-26',
  },

  // ── Financial strategy ──
  'detailed.budget_gap': {
    label: 'official',
    source_title: 'Medium Term Financial Strategy',
  },
  'detailed.savings_target': {
    label: 'official',
    source_title: 'Medium Term Financial Strategy',
  },

  // ── Waste ──
  'detailed.waste_destinations': {
    label: 'published',
    source_title: 'DEFRA ENV18 Waste Statistics',
    source_url: 'https://www.gov.uk/government/statistical-data-sets/env18-local-authority-collected-waste-annual-results-tables',
    data_year: '2022-23',
  },

  // ── Performance ──
  'detailed.performance_kpis': {
    label: 'published',
    source_title: 'Multiple GOV.UK sources',
  },

  // ── Leadership ──
  'detailed.cabinet': {
    label: 'official',
    source_title: 'Council website',
  },
  'detailed.council_leader': {
    label: 'official',
    source_title: 'Council website',
  },
  'detailed.chief_executive': {
    label: 'official',
    source_title: 'Council website',
  },
  'detailed.total_councillors': {
    label: 'published',
    source_title: 'LGBCE Electoral Data',
    source_url: 'https://www.lgbce.org.uk/electoral-data',
    data_year: '2025',
  },

  // ── Council Tax historical bands ──
  'council_tax.band_d_2021': {
    label: 'published',
    source_title: 'GOV.UK Council Tax Levels',
    source_url: 'https://www.gov.uk/government/statistical-data-sets/live-tables-on-council-tax',
    data_year: '2021-22',
  },
  'council_tax.band_d_2022': {
    label: 'published',
    source_title: 'GOV.UK Council Tax Levels',
    source_url: 'https://www.gov.uk/government/statistical-data-sets/live-tables-on-council-tax',
    data_year: '2022-23',
  },
  'council_tax.band_d_2023': {
    label: 'published',
    source_title: 'GOV.UK Council Tax Levels',
    source_url: 'https://www.gov.uk/government/statistical-data-sets/live-tables-on-council-tax',
    data_year: '2023-24',
  },

  // ── Bill history (aggregated) ──
  'bill_history': {
    label: 'published',
    source_title: 'GOV.UK Council Tax Levels',
    source_url: 'https://www.gov.uk/government/statistical-data-sets/live-tables-on-council-tax',
    data_year: '2021-2026',
  },

  // ── Population ──
  'population': {
    label: 'published',
    source_url: 'https://www.ons.gov.uk/peoplepopulationandcommunity/populationandmigration/populationestimates',
    source_title: 'ONS Mid-2024 Population Estimates',
    data_year: 'mid-2024',
  },

  // ── Leadership ──
  'detailed.chief_executive_salary': {
    label: 'published',
    source_title: 'Council Pay Policy Statement',
    data_year: '2024-25',
  },
  'detailed.chief_executive_total_remuneration': {
    label: 'published',
    source_title: 'Council Pay Policy Statement',
    data_year: '2024-25',
  },

  // ── Allowances ──
  'detailed.councillor_basic_allowance': {
    label: 'published',
    source_title: "Members' Allowances Scheme",
    data_year: '2024-25',
  },
  'detailed.total_allowances_cost': {
    label: 'published',
    source_title: "Members' Allowances Scheme",
    data_year: '2024-25',
  },
  'detailed.councillor_allowances_detail': {
    label: 'published',
    source_title: "Members' Allowances Scheme",
    data_year: '2024-25',
  },

  // ── Salary Bands ──
  'detailed.salary_bands': {
    label: 'published',
    source_title: 'Statement of Accounts',
    data_year: '2024-25',
  },

  // ── Reserves ──
  'detailed.reserves': {
    label: 'published',
    source_url: 'https://www.gov.uk/government/collections/local-authority-revenue-expenditure-and-financing',
    source_title: 'Revenue Expenditure Part 2',
    data_year: '2024-25',
  },

  // ── Service Outcomes ──
  'service_outcomes.waste.recycling_rate_percent': {
    label: 'published',
    source_url: 'https://www.gov.uk/government/statistical-data-sets/env18-local-authority-collected-waste-annual-results-tables',
    source_title: 'DEFRA Waste Statistics',
    data_year: '2022-23',
  },
  'service_outcomes.roads.condition_good_percent': {
    label: 'published',
    source_url: 'https://www.gov.uk/government/statistical-data-sets/road-condition-statistics-data-tables-rdc',
    source_title: 'DfT Road Condition Statistics',
    data_year: '2023',
  },
  'service_outcomes.roads.maintained_miles': {
    label: 'published',
    source_url: 'https://www.gov.uk/government/statistical-data-sets/road-length-statistics-rdl',
    source_title: 'DfT Road Length Statistics',
    data_year: '2023',
  },
  'service_outcomes.children_services.ofsted_rating': {
    label: 'published',
    source_url: 'https://www.gov.uk/government/publications/five-year-ofsted-inspection-data',
    source_title: 'Ofsted Inspection Data',
    data_year: '2024',
  },
  'service_outcomes.housing.homes_built': {
    label: 'published',
    source_url: 'https://www.gov.uk/government/statistical-data-sets/live-tables-on-net-supply-of-housing',
    source_title: 'MHCLG Housing Supply Tables',
    data_year: '2023-24',
  },

    // ── Suppliers (Contracts Finder OCDS — national register, NOT council
  //    transparency pages). Per-council verifiability is via a buyer-filtered
  //    search URL constructed in getProvenance().
  'detailed.top_suppliers.annual_spend': {
    label: 'published',
    source_url: 'https://www.contractsfinder.service.gov.uk/Search',
    source_title: 'Contracts Finder (OCDS)',
    data_year: '2024-25',
    methodology: 'The total yearly value of contracts where this council is named as the buyer. Comes from the UK government\'s Contracts Finder service.',
  },
  'detailed.top_suppliers.description': {
    label: 'editorial',
    methodology: 'A short description we wrote based on the public contract details. This is our wording, not the council\'s.',
  },

  // ── Grants (council-published on transparency pages; sometimes via 360Giving) ──
  'detailed.grant_payments': {
    label: 'published',
    source_title: 'Council grants register',
    data_year: '2024-25',
  },

  // ── Workforce — per-council FTE from ONS Public Sector Personnel.
  //    The older GOV.UK "local-authority-data-workforce" collection page has
  //    been retired; the active dataset is the ONS PSE reference table.
  'detailed.staff_fte': {
    label: 'published',
    source_url: 'https://www.ons.gov.uk/employmentandlabourmarket/peopleinwork/publicsectorpersonnel/datasets/publicsectoremploymentreferencetable',
    source_title: 'ONS Public Sector Employment reference table',
    data_year: '2024',
  },

  // ── Capital ──
  'detailed.capital_programme': {
    label: 'published',
    source_url: 'https://www.gov.uk/government/collections/local-authority-capital-expenditure-receipts-and-financing',
    source_title: 'Capital Expenditure (COR A1)',
    data_year: '2024-25',
  },

  // ── Per-capita calculations ──
  'per_capita_spend': {
    label: 'calculated',
    methodology: 'The total council spending divided by how many people live here — a rough figure for what each person costs.',
  },
  'per_capita_council_tax': {
    label: 'calculated',
    methodology: 'Shown as the Band D rate. Your actual bill depends on your property\'s council tax band.',
  },
};

/**
 * URL-routing rules: map each field path to the council-owned URL that should
 * be used when `field_sources` doesn't have an explicit entry for that field.
 *
 * The rules below are **origin-based**. A field is routed to a council URL
 * only when the data truly originates from that council's own publication
 * (budget docs, Statement of Accounts, Pay Policy Statement, Members'
 * Allowances Scheme, cabinet/portfolio page). Data that originates in a
 * national register — Contracts Finder, ONS, DEFRA, DfT, Ofsted, LGBCE — is
 * NEVER routed to a council URL; `FIELD_PROVENANCE` above holds the national
 * source URL and `getProvenance()` returns it directly.
 *
 * Why this split matters: pointing a Contracts Finder supplier number at the
 * council's own "transparency" landing page produces a source link the user
 * can click but cannot use to verify the number — the council's site doesn't
 * publish that data. The origin must match the scrape.
 */
const URL_ROUTING: Array<{
  match: (path: string) => boolean;
  urlField: 'budget_url' | 'accounts_url' | 'transparency_url' | 'councillors_url';
  titleSuffix: string;
}> = [
  // Budget breakdowns, service spending, capital programme, financial
  // strategy → council's own budget page.
  {
    match: (p) =>
      p === 'detailed.service_spending' ||
      p === 'detailed.capital_programme' ||
      p === 'detailed.budget_gap' ||
      p === 'detailed.savings_target',
    urlField: 'budget_url',
    titleSuffix: 'budget',
  },
  // Reserves and salary bands come from the council's Statement of Accounts.
  // (The high-level budget categories stay routed to the national RO returns
  //  via FIELD_PROVENANCE — they are national data, not council-published.)
  {
    match: (p) => p === 'detailed.reserves' || p === 'detailed.salary_bands',
    urlField: 'accounts_url',
    titleSuffix: 'Statement of Accounts',
  },
  // Grants are published on council transparency pages (occasionally via
  // 360Giving). CEO pay comes from the council's Pay Policy Statement —
  // typically linked from either transparency_url or councillors_url. If no
  // field_sources entry exists, prefer transparency_url for grants and the
  // councillors_url for pay-policy-adjacent fields (see next rule).
  {
    match: (p) => p === 'detailed.grant_payments',
    urlField: 'transparency_url',
    titleSuffix: 'grants register',
  },
  // Cabinet, leader, councillor allowances, CEO salary → councillors/leader
  // page, which in most CMSes is the parent of the Pay Policy and Members'
  // Allowances documents.
  {
    match: (p) =>
      p === 'detailed.cabinet' ||
      p === 'detailed.council_leader' ||
      p === 'detailed.chief_executive' ||
      p === 'detailed.chief_executive_salary' ||
      p === 'detailed.chief_executive_total_remuneration' ||
      p.startsWith('detailed.councillor_') ||
      p === 'detailed.total_allowances_cost',
    urlField: 'councillors_url',
    titleSuffix: 'councillors',
  },
  // NOTE: detailed.top_suppliers.* and detailed.staff_fte are intentionally
  // NOT routed to a council URL — their origin is national (Contracts Finder
  // OCDS, ONS PSE). They resolve via FIELD_PROVENANCE above. Likewise
  // budget.* stays on the RO national source.
];

/**
 * URL-encode a council buyer name for Contracts Finder search.
 * Contracts Finder's /Search accepts a free-text keyword; we use the council
 * name as a buyer filter. Not perfect — the user sees a search result page,
 * not the specific contracts — but it's the same surface a journalist would
 * hit to audit the data, which is the whole point of the source link.
 */
function contractsFinderSearchUrl(councilName: string): string {
  const keyword = encodeURIComponent(`${councilName} Council`);
  return `https://www.contractsfinder.service.gov.uk/Search?keywords=${keyword}`;
}

/**
 * Look up provenance for a field path.
 *
 * Priority:
 *   1. `council.detailed.field_sources[path]` — exact per-field URL override
 *      (authoritative when present, because it was hand-verified per council)
 *   2. National-origin override for suppliers (Contracts Finder buyer search)
 *   3. URL routing — if the path represents council-published data and the
 *      council has the relevant top-level URL field (budget_url, etc.), use that
 *   4. Global `FIELD_PROVENANCE` (for truly national sources — GOV.UK bulk data,
 *      ONS population, DEFRA/DfT/Ofsted statistics, calculated metrics)
 *   5. Prefix match on `FIELD_PROVENANCE` (e.g., "budget.education" → "budget")
 */
export function getProvenance(
  fieldPath: string,
  council?: Council
): DataProvenance | undefined {
  // 1. Per-council field_sources (most specific — exact URL for this council's data)
  if (council?.detailed?.field_sources) {
    // Try exact field path first, then simplified key
    const simpleKey = fieldPath
      .replace('council_tax.', '')
      .replace('detailed.', '')
      .replace('budget.', '');
    const fieldSource = council.detailed.field_sources[fieldPath]
      || council.detailed.field_sources[simpleKey];

    if (fieldSource) {
      // Merge with global FIELD_PROVENANCE for label/methodology.
      // Per-council data_year wins over the global default — the value
      // we render is the value that council published, and the year
      // next to it must be the year printed on that council's document.
      // Global data_year is a fallback for older entries that predate
      // the DATA-YEAR-POLICY.md contract.
      const global = FIELD_PROVENANCE[fieldPath] || FIELD_PROVENANCE[fieldPath.split('.')[0]];
      return {
        label: global?.label || 'official',
        source_url: fieldSource.url,
        source_title: fieldSource.title,
        data_year: fieldSource.data_year || global?.data_year,
        methodology: global?.methodology,
        page_image_url: fieldSource.page_image_url,
      };
    }
  }

  // 2. Suppliers: prefer the council's own verified payment-ledger when
  //    one exists (see suppliers-allowlist.ts). Otherwise fall back to
  //    the Contracts Finder buyer search — a lossy source that's still
  //    traceable, surfaced to readers via the DataValidationNotice.
  if (fieldPath.startsWith('detailed.top_suppliers') && council?.name) {
    const verified = getVerifiedSupplierSource(council.name);
    if (verified) {
      return {
        label: 'published',
        source_url: verified.sourceUrl,
        source_title: verified.sourceTitle,
        data_year: verified.period,
        methodology: `Added up from ${council.name}'s own list of payments over £500. The total paid to this supplier across the whole year.`,
      };
    }
    const global = FIELD_PROVENANCE['detailed.top_suppliers.annual_spend'];
    return {
      label: 'published',
      source_url: contractsFinderSearchUrl(council.name),
      source_title: `Contracts Finder — ${council.name}`,
      data_year: global?.data_year,
      methodology: global?.methodology,
    };
  }

  // 3. URL routing — council-owned data paths prefer the council's own URL
  //    over generic GOV.UK citations. Keeps label/data_year from the global
  //    table for consistency ("Published data", "Data year: 2025-26").
  if (council?.detailed) {
    for (const rule of URL_ROUTING) {
      if (!rule.match(fieldPath)) continue;
      const url = council.detailed[rule.urlField];
      if (!url) continue;
      const global = FIELD_PROVENANCE[fieldPath] || FIELD_PROVENANCE[fieldPath.split('.')[0]];
      return {
        label: 'official',
        source_url: url,
        source_title: `${council.name} ${rule.titleSuffix}`,
        data_year: global?.data_year,
        methodology: global?.methodology,
      };
    }
  }

  // 4. Global FIELD_PROVENANCE (for GOV.UK bulk data fields)
  if (FIELD_PROVENANCE[fieldPath]) {
    const prov = { ...FIELD_PROVENANCE[fieldPath] };

    // For per-council fields without field_sources, fall back to sources[] array
    if (!prov.source_url && council?.detailed?.sources) {
      const titleMatch = prov.source_title?.toLowerCase();
      if (titleMatch) {
        const match = council.detailed.sources.find(
          s => s.title.toLowerCase().includes(titleMatch) ||
               titleMatch.includes(s.title.toLowerCase().replace(/\d{4}.*/, '').trim())
        );
        if (match) prov.source_url = match.url;
      }
    }

    // Phase 3: attach row-level citation for Category A fields.
    if (council) {
      const citation = resolveCitation(fieldPath, council);
      if (citation) prov.citation = citation;
    }

    return prov;
  }

  // 5. Prefix match: "budget.education" → "budget"
  const prefix = fieldPath.split('.')[0];
  if (FIELD_PROVENANCE[prefix]) {
    const prov = { ...FIELD_PROVENANCE[prefix] };
    if (council) {
      const citation = resolveCitation(fieldPath, council);
      if (citation) prov.citation = citation;
    }
    return prov;
  }

  return undefined;
}
