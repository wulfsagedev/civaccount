/**
 * FIXTURE DATA — not the canonical dataset.
 *
 * Three realistic but minimal council records covering the three most common
 * council types (County Council, Metropolitan District, London Borough). Used
 * when the private `civaccount-data` submodule is not mounted — e.g. when a
 * contributor clones the public repo to work on code without needing access
 * to the full compiled dataset.
 *
 * Figures are PLACEHOLDER VALUES. Do not cite from this file. The canonical
 * per-council values live in the private data repository (each committed via
 * validator-verified GOV.UK sources).
 *
 * When the Phase 1 cutover is complete, the build system will resolve the
 * import path to either the private submodule (production) or this fixture
 * (fixture mode). See DATA-ACCESS-POLICY.md.
 */

import type { Council } from '../councils';

export const fixtureCouncils: Council[] = [
  {
    ons_code: 'E10000016',
    name: 'Kent',
    type: 'SC',
    type_name: 'County Council',
    population: 1578000,
    council_tax: {
      band_d_2025: 1800.0,
      band_d_2024: 1720.0,
      band_d_2023: 1640.0,
      band_d_2022: 1560.0,
      band_d_2021: 1500.0,
    },
    budget: {
      education: 400000,
      transport: 90000,
      childrens_social_care: 260000,
      adult_social_care: 520000,
      public_health: 60000,
      housing: 15000,
      cultural: 20000,
      environmental: 50000,
      planning: 10000,
      central_services: 70000,
      other: 25000,
      total_service: 1520000,
      net_current: 1150000,
    },
    detailed: {
      website: 'https://www.kent.gov.uk',
      council_tax_url: 'https://www.kent.gov.uk/council-tax',
      council_leader: 'Example Leader',
      chief_executive: 'Example Chief Executive',
      chief_executive_salary: 220000,
      councillor_basic_allowance: 15000,
      total_councillors: 81,
      last_verified: '2026-04-19',
    },
  },
  {
    ons_code: 'E08000025',
    name: 'Birmingham',
    type: 'MD',
    type_name: 'Metropolitan District',
    population: 1149000,
    council_tax: {
      band_d_2025: 1950.0,
      band_d_2024: 1850.0,
      band_d_2023: 1760.0,
      band_d_2022: 1680.0,
      band_d_2021: 1600.0,
    },
    budget: {
      education: 180000,
      transport: 60000,
      childrens_social_care: 310000,
      adult_social_care: 460000,
      public_health: 55000,
      housing: 40000,
      cultural: 15000,
      environmental: 80000,
      planning: 12000,
      central_services: 85000,
      other: 30000,
      total_service: 1327000,
      net_current: 1000000,
    },
    detailed: {
      website: 'https://www.birmingham.gov.uk',
      council_tax_url: 'https://www.birmingham.gov.uk/counciltax',
      council_leader: 'Example Leader',
      chief_executive: 'Example Chief Executive',
      chief_executive_salary: 230000,
      councillor_basic_allowance: 17500,
      total_councillors: 101,
      last_verified: '2026-04-19',
    },
  },
  {
    ons_code: 'E09000033',
    name: 'Westminster',
    type: 'LB',
    type_name: 'London Borough',
    population: 211000,
    council_tax: {
      band_d_2025: 1000.0,
      band_d_2024: 920.0,
      band_d_2023: 870.0,
      band_d_2022: 830.0,
      band_d_2021: 800.0,
    },
    budget: {
      education: 70000,
      transport: 25000,
      childrens_social_care: 90000,
      adult_social_care: 140000,
      public_health: 20000,
      housing: 60000,
      cultural: 25000,
      environmental: 35000,
      planning: 15000,
      central_services: 40000,
      other: 12000,
      total_service: 532000,
      net_current: 410000,
    },
    detailed: {
      website: 'https://www.westminster.gov.uk',
      council_tax_url: 'https://www.westminster.gov.uk/council-tax',
      council_leader: 'Example Leader',
      chief_executive: 'Example Chief Executive',
      chief_executive_salary: 200000,
      councillor_basic_allowance: 12000,
      total_councillors: 54,
      last_verified: '2026-04-19',
    },
  },
];
