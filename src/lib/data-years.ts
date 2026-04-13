/**
 * Data year constants — single source of truth for data freshness.
 * Used by CardShareHeader badges and the methodology page.
 *
 * Sourced from scripts/validate/source-manifest.json.
 * Update here when source data is refreshed.
 */

export const DATA_YEARS = {
  council_tax: '2025-26',
  budget: '2024-25',
  population: 'mid-2024',
  waste: '2022-23',
  workforce: '2024',
  ceo_salary: '2024-25',
  road_condition: '2023',
  road_length: '2023',
  ofsted: '2024',
  councillors: '2025',
  reserves: '2024-25',
  capital_expenditure: '2024-25',
  suppliers: '2024-25',
  councillor_allowances: '2024-25',
  salary_bands: '2024-25',
} as const;

export type DataCategory = keyof typeof DATA_YEARS;
