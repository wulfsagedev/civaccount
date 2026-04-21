/**
 * citations.ts — Phase 3 Citation resolver.
 *
 * For Category A fields (national CSVs), build a Citation at render time
 * from the renderable-fields manifest + the council's ONS code. The
 * resulting Citation can be shown in the SourceAnnotation popover and
 * lets a reader verify the value against the original CSV row in the
 * published GOV.UK document.
 *
 * Why build at render time rather than storing on each value: the
 * Category A locator is deterministic — given the manifest row + the
 * council's ONS code, the citation is fully derivable. Storing 27
 * fields × 317 councils = 8,500 static Citation objects in the data
 * file would just duplicate what the manifest already knows.
 *
 * Phase 4 (per-council PDFs) and Phase 5 (aggregates) will store
 * Citations directly on the value because they carry per-council
 * data (page numbers, source_rows) that can't be derived from a
 * shared manifest.
 */

import type { Citation, Council } from './councils';
import { getFieldManifest, type RenderableField } from './renderable-fields';

/**
 * Canonical national-dataset metadata. Mirrors the subset of
 * scripts/validate/source-manifest.json that the UI needs. Kept in
 * sync by hand — if a manifest entry changes, update here too.
 * (A build-time generator step is in scope for a later phase.)
 */
interface NationalSource {
  gov_uk_page: string;          // live URL the reader opens
  publisher: string;            // MHCLG / ONS / DEFRA etc.
  data_year: string;            // e.g. '2025-26'
  parsed_csv: string;           // filename inside the bulk data dir
  last_downloaded: string;      // ISO
}

const NATIONAL_SOURCES: Record<string, NationalSource> = {
  'area-council-tax': {
    gov_uk_page: 'https://www.gov.uk/government/statistical-data-sets/live-tables-on-council-tax',
    publisher: 'MHCLG',
    data_year: '2026-27',
    parsed_csv: 'parsed-area-band-d.csv',
    last_downloaded: '2026-04-21',
  },
  'council-tax-2025': {
    gov_uk_page: 'https://www.gov.uk/government/statistics/council-tax-levels-set-by-local-authorities-in-england-2025-to-2026',
    publisher: 'MHCLG',
    data_year: '2025-26',
    parsed_csv: 'parsed-council-tax-requirement.csv',
    last_downloaded: '2026-01-15',
  },
  'revenue-expenditure-part1': {
    gov_uk_page: 'https://www.gov.uk/government/collections/local-authority-revenue-expenditure-and-financing',
    publisher: 'MHCLG',
    data_year: '2024-25',
    parsed_csv: 'gov-uk-ra-data/RA_Part1_LA_Data.csv',
    last_downloaded: '2026-01-15',
  },
  'revenue-expenditure-part2': {
    gov_uk_page: 'https://www.gov.uk/government/collections/local-authority-revenue-expenditure-and-financing',
    publisher: 'MHCLG',
    data_year: '2024-25',
    parsed_csv: 'gov-uk-ra-data/RA_Part2_LA_Data.csv',
    last_downloaded: '2026-01-15',
  },
  'ons-population-mid2024': {
    gov_uk_page: 'https://www.ons.gov.uk/peoplepopulationandcommunity/populationandmigration/populationestimates',
    publisher: 'ONS',
    data_year: 'mid-2024',
    parsed_csv: 'parsed-population.csv',
    last_downloaded: '2025-11-15',
  },
  'defra-waste-2022-23': {
    gov_uk_page: 'https://www.gov.uk/government/statistical-data-sets/env18-local-authority-collected-waste-annual-results-tables',
    publisher: 'DEFRA',
    data_year: '2022-23',
    parsed_csv: 'parsed-waste.csv',
    last_downloaded: '2025-09-20',
  },
  'road-condition': {
    gov_uk_page: 'https://www.gov.uk/government/statistical-data-sets/road-condition-statistics-data-tables-rdc',
    publisher: 'DfT',
    data_year: '2023',
    parsed_csv: 'parsed-road-condition.csv',
    last_downloaded: '2025-10-01',
  },
  'road-length': {
    gov_uk_page: 'https://www.gov.uk/government/statistical-data-sets/road-length-statistics-rdl',
    publisher: 'DfT',
    data_year: '2023',
    parsed_csv: 'parsed-road-length.csv',
    last_downloaded: '2025-10-01',
  },
  'ofsted-childrens-services': {
    gov_uk_page: 'https://www.gov.uk/government/publications/five-year-ofsted-inspection-data',
    publisher: 'Ofsted',
    data_year: '2024',
    parsed_csv: 'parsed-ofsted.csv',
    last_downloaded: '2026-01-15',
  },
  'lgbce-councillors': {
    gov_uk_page: 'https://www.lgbce.org.uk/electoral-data',
    publisher: 'LGBCE',
    data_year: '2025',
    parsed_csv: 'parsed-lgbce-councillors.csv',
    last_downloaded: '2025-11-15',
  },
  'reserves': {
    gov_uk_page: 'https://www.gov.uk/government/collections/local-authority-revenue-expenditure-and-financing',
    publisher: 'MHCLG',
    data_year: '2024-25',
    parsed_csv: 'parsed-reserves.csv',
    last_downloaded: '2026-01-15',
  },
  'capital-expenditure': {
    gov_uk_page: 'https://www.gov.uk/government/collections/local-authority-capital-expenditure-receipts-and-financing',
    publisher: 'MHCLG',
    data_year: '2024-25',
    parsed_csv: 'parsed-capital-expenditure.csv',
    last_downloaded: '2026-01-15',
  },
};

/**
 * Resolve a Citation for the given field × council pair.
 *
 * Returns undefined when the field isn't Category A — Categories B/C/D/E
 * either don't have a resolvable citation (yet) or use different code paths.
 */
export function resolveCitation(fieldPath: string, council: Council): Citation | undefined {
  const field: RenderableField | undefined = getFieldManifest(fieldPath);
  if (!field || field.origin !== 'national_csv') return undefined;
  if (!field.dataset_id) return undefined;
  const source = NATIONAL_SOURCES[field.dataset_id];
  if (!source) return undefined;

  // Row key: ONS code for most datasets; waste uses waste-authority name
  // (falls back to ONS where that works). Keep the locator simple for now;
  // dataset-specific quirks are flagged in ISSUES-FOUND.md.
  return {
    dataset_id: field.dataset_id,
    source_url: source.gov_uk_page,
    archive_path: `pdfs/gov-uk-bulk-data/${source.parsed_csv}`,
    locator: {
      kind: 'csv_row',
      file: source.parsed_csv,
      ons_code: council.ons_code,
      column: field.csv_column ?? 'value',
    },
    fetched: source.last_downloaded,
    extraction: 'exact_cell',
    verified_at: source.last_downloaded,
  };
}

/**
 * Human-readable locator description shown in the SourceAnnotation popover.
 * Example: "Row for Bradford (E08000032), column band_d_2025 — parsed-area-band-d.csv"
 */
export function describeLocator(citation: Citation, councilName: string): string {
  const loc = citation.locator;
  if (loc.kind === 'csv_row') {
    return `Row for ${councilName} (ONS: ${loc.ons_code}), column "${loc.column}" — ${loc.file}`;
  }
  if (loc.kind === 'pdf_page') {
    return `Page ${loc.page}${loc.excerpt ? ` — "${loc.excerpt.slice(0, 60)}…"` : ''}`;
  }
  if (loc.kind === 'ocds_award') {
    return `OCDS award ${loc.award_id} within notice ${loc.ocid}`;
  }
  if (loc.kind === 'html_selector') {
    return `Element "${loc.selector}" — "${loc.text_excerpt.slice(0, 60)}…"`;
  }
  if (loc.kind === 'csv_filter') {
    const filterDesc = Object.entries(loc.filter).map(([k, v]) => `${k}=${v}`).join(', ');
    return `Rows matching ${filterDesc}, column "${loc.column}" — ${loc.file}`;
  }
  return 'Unknown locator';
}
