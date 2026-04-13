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

export const FIELD_PROVENANCE: Record<string, DataProvenance> = {
  // ── Council Tax ──
  'council_tax.band_d_2025': {
    label: 'published',
    source_url: 'https://www.gov.uk/government/statistics/council-tax-levels-set-by-local-authorities-in-england-2025-to-2026',
    source_title: 'GOV.UK Council Tax Levels 2025-26',
    data_year: '2025-26',
  },
  'council_tax.band_d_2024': {
    label: 'published',
    source_url: 'https://www.gov.uk/government/statistics/council-tax-levels-set-by-local-authorities-in-england-2025-to-2026',
    source_title: 'GOV.UK Council Tax Levels',
    data_year: '2024-25',
  },
  'tax_bands': {
    label: 'calculated',
    methodology: 'Band D rate multiplied by official band ratios (A = 6/9 through H = 2x)',
    data_year: '2025-26',
  },
  'vs_average': {
    label: 'comparison',
    methodology: 'Difference between this council and the average for its type',
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

  // ── Suppliers ──
  'detailed.top_suppliers.annual_spend': {
    label: 'published',
    source_title: 'Contracts Finder / Council Transparency',
    data_year: '2024-25',
  },
  'detailed.top_suppliers.description': {
    label: 'editorial',
    methodology: 'Summary written by CivAccount based on published contract details. Not official text.',
  },

  // ── Grants ──
  'detailed.grant_payments': {
    label: 'published',
    source_title: 'Council Transparency / 360Giving',
    data_year: '2024-25',
  },

  // ── Workforce ──
  'detailed.staff_fte': {
    label: 'published',
    source_url: 'https://www.gov.uk/government/collections/local-authority-data-workforce',
    source_title: 'Quarterly Public Sector Employment Survey',
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
    methodology: 'Total service budget divided by population',
  },
  'per_capita_council_tax': {
    label: 'calculated',
    methodology: 'Band D rate — actual household bill depends on property band',
  },
};

/**
 * Look up provenance for a field path.
 * Tries exact match first, then prefix match (e.g., "budget.education" → "budget").
 * For per-council sources (CEO salary, allowances), falls back to the council's
 * sources[] array to find a matching URL.
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
      // Merge with global FIELD_PROVENANCE for label/methodology, but use per-council URL
      const global = FIELD_PROVENANCE[fieldPath] || FIELD_PROVENANCE[fieldPath.split('.')[0]];
      return {
        label: global?.label || 'official',
        source_url: fieldSource.url,
        source_title: fieldSource.title,
        data_year: global?.data_year,
        methodology: global?.methodology,
      };
    }
  }

  // 2. Global FIELD_PROVENANCE (for GOV.UK bulk data fields)
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

    return prov;
  }

  // 3. Prefix match: "budget.education" → "budget"
  const prefix = fieldPath.split('.')[0];
  if (FIELD_PROVENANCE[prefix]) {
    return { ...FIELD_PROVENANCE[prefix] };
  }

  return undefined;
}
