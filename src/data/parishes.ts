/**
 * Parish / town council scaffold.
 *
 * England has ~10,000 parish and town councils — massively underserved by
 * existing civic-tech tools. This file defines the schema so data can be
 * added incrementally (pilot county → full coverage) without UI rework.
 *
 * Data sources (for future population):
 *   - Parish precept: council's billing authority (district or unitary)
 *     publishes it as part of the council tax calculation
 *   - Statement of Accounts: parishes with gross income >£6.5k must file
 *     AGAR (Annual Governance and Accountability Return) with the external
 *     auditor — published on the parish's own site or the auditor's portal
 *   - OpenlyLocal has historic coverage; ONS publishes parish boundaries
 */

export interface Parish {
  /** URL slug: /parish/[slug] */
  slug: string;
  /** Display name, e.g. "Hinckley" (for Hinckley Town Council) */
  name: string;
  /** ONS parish code (E04xxxxxx) */
  ons_code: string;
  /** "Town Council" | "Parish Council" | "Community Council" */
  type_name: string;
  /** Billing authority — the district/unitary that collects council tax */
  billing_authority: {
    /** Display name */
    name: string;
    /** Council slug on CivAccount — enables cross-linking to /council/[slug] */
    slug: string;
  };
  /** Parish precept (added to your council tax bill) for the year */
  precept?: {
    band_d_2025?: number;
    band_d_2024?: number;
    year: string;
  };
  /** Population (ONS mid-year estimate) */
  population?: number;
  /** Number of parish councillors */
  total_councillors?: number;
  /** Council leader / Chair / Mayor */
  leader?: string;
  /** Clerk — the salaried officer */
  clerk?: string;
  /** Main website */
  website?: string;
  /** AGAR / accounts page */
  accounts_url?: string;
  /** Annual income and expenditure (from AGAR). Stored in pounds. */
  annual_accounts?: {
    year: string;
    income: number;
    expenditure: number;
    reserves: number;
    staff_costs?: number;
  };
  /** Summary of what the precept funds — parks, allotments, events, etc. */
  precept_summary?: string;
  last_verified?: string;
}

/**
 * Current parish coverage. Empty — populate per-county during pilot phase.
 *
 * Suggested pilot: Gloucestershire (~250 parishes) because we already
 * have rich district data (Forest of Dean, Cotswold, Stroud, etc.) and
 * the county Observatory publishes parish-level stats.
 */
export const PARISHES: Parish[] = [];

export function getParishBySlug(slug: string): Parish | undefined {
  return PARISHES.find((p) => p.slug === slug);
}

export function getAllParishSlugs(): string[] {
  return PARISHES.map((p) => p.slug);
}

export function getParishesForBillingAuthority(councilSlug: string): Parish[] {
  return PARISHES.filter((p) => p.billing_authority.slug === councilSlug);
}
