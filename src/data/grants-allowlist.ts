/**
 * Councils whose `grant_payments` entries trace to a raw source file
 * preserved in the repo and parsed by `scripts/parse-all-grants.py`.
 *
 * This is the allowlist referenced in PROVENANCE-INTEGRITY-PLAN.md §5.1 —
 * the UI uses it to decide whether to render the "Data validation in
 * progress" notice above the grants list (when the council is not on the
 * list) or a quieter "Sourced from .gov.uk" affirmation (when it is).
 *
 * Values here must match the `Council.name` field exactly.
 */
export interface VerifiedGrantSource {
  council: string;
  /** Human-readable source title, shown in the UI. */
  sourceTitle: string;
  /** Type of source. */
  sourceType: '360giving-csv' | '360giving-xlsx' | 'spending-csv' | 'council-xlsx';
  /** URL the reader can open to see the raw file. Points at the
   *  council-hosted publication when available, otherwise at a
   *  stable reference. */
  sourceUrl?: string;
}

/**
 * Exact-match allowlist of councils whose grant data came from a raw
 * file in `src/data/councils/pdfs/` parsed by a script in the repo.
 *
 * Everything else is either researched content we can no longer retrace
 * to a publication (shown with a validation-in-progress notice) or not
 * yet scraped.
 */
export const VERIFIED_GRANT_COUNCILS: Record<string, VerifiedGrantSource> = {
  Barnet: {
    council: 'Barnet',
    sourceTitle: 'Barnet grants register (360Giving XLSX)',
    sourceType: '360giving-xlsx',
  },
  Bradford: {
    council: 'Bradford',
    sourceTitle: 'Bradford Council Grants Register (February 2025)',
    sourceType: 'council-xlsx',
    sourceUrl: 'https://datahub.bradford.gov.uk/datasets/finance/bradford-council-grants/',
  },
  Birmingham: {
    council: 'Birmingham',
    sourceTitle: 'Birmingham grants register (360Giving XLSX)',
    sourceType: '360giving-xlsx',
  },
  Cambridgeshire: {
    council: 'Cambridgeshire',
    sourceTitle: 'Cambridgeshire spending-over-£500 (grants filter)',
    sourceType: 'spending-csv',
  },
  Camden: {
    council: 'Camden',
    sourceTitle: 'Camden grants register (360Giving CSV)',
    sourceType: '360giving-csv',
  },
  'Epping Forest': {
    council: 'Epping Forest',
    sourceTitle: 'Epping Forest spending-over-£500 (grants filter)',
    sourceType: 'spending-csv',
  },
  Essex: {
    council: 'Essex',
    sourceTitle: 'Essex grants register (360Giving XLSX)',
    sourceType: '360giving-xlsx',
  },
  'South Oxfordshire': {
    council: 'South Oxfordshire',
    sourceTitle: 'South Oxfordshire grants XLSX',
    sourceType: 'council-xlsx',
  },
  Trafford: {
    council: 'Trafford',
    sourceTitle: 'Trafford grants register (360Giving CSV)',
    sourceType: '360giving-csv',
  },
  'Vale of White Horse': {
    council: 'Vale of White Horse',
    sourceTitle: 'Vale of White Horse grants XLSX',
    sourceType: 'council-xlsx',
  },
};

export function isVerifiedGrantCouncil(councilName: string): boolean {
  return Object.prototype.hasOwnProperty.call(VERIFIED_GRANT_COUNCILS, councilName);
}

export function getVerifiedGrantSource(councilName: string): VerifiedGrantSource | undefined {
  return VERIFIED_GRANT_COUNCILS[councilName];
}
