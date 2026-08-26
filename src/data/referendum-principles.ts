/**
 * referendum-principles.ts — the statutory council tax referendum principles.
 *
 * Every year MHCLG sets the increase at which a council's Band D rise becomes
 * "excessive" and triggers a local referendum. This file records those
 * thresholds, verbatim from the GOV.UK release that publishes them.
 *
 * ─── Why this file exists ────────────────────────────────────────────────
 *
 * The insight cards used to hard-code a single `4.99` and apply it to all 317
 * councils. Two things are wrong with that:
 *
 *   1. The threshold is not one number. Adult social care authorities and
 *      shire districts have always had different principles, and each year a
 *      handful of councils are granted a bespoke higher limit.
 *
 *   2. Applying the social-care threshold to everyone named councils as
 *      "cap breakers" that had done nothing of the sort. On the 2025-26
 *      figures the top of that list was Bradford (+9.29%), Windsor &
 *      Maidenhead (+8.31%), Newham (+7.66%) and Birmingham (+7.36%) — all four
 *      inside a higher limit government had explicitly granted them.
 *
 * ─── Note on 4.99% vs 5% ─────────────────────────────────────────────────
 *
 * The statutory language defines what is EXCESSIVE: an increase of "5% or more
 * than 5%" triggers a referendum. So 5% is the trigger, and the maximum a
 * council can actually set is just under it — which is why so many land on
 * exactly 4.99%. "The 4.99% cap" is newspaper shorthand for "one penny under
 * the referendum trigger". We model the trigger, and derive "went to their
 * maximum" from it, rather than hard-coding the shorthand.
 *
 * ─── NOT YET USABLE FOR THE CAP CARDS — what is missing ──────────────────
 *
 * The limits below are correct and sourced, but nothing renders them yet,
 * because the principles apply to each authority's OWN Band D precept and our
 * `council_tax.band_d_*` fields hold the AREA bill — the whole amount a
 * household pays, including the county, police and fire shares.
 *
 * Adur is the clearest example: £2,548 area against a £365 own share. The area
 * rose £115, almost all of it West Sussex County Council. Measuring that rise
 * against Adur's own-share limit is meaningless, and a first attempt reported
 * 162 of 164 districts "at their limit" as a result.
 *
 * `detailed.precepts[]` carries the own-share split, but it is the 2025-26
 * breakdown and reconciles for only 60 of 317 councils. There is no 2026-27
 * own-share figure in the dataset at all.
 *
 * To bring the cap cards back, admit MHCLG's per-authority Band D table (same
 * release as the limits below) through the Data Constitution's process:
 * archive it, hash it, cite it with a verbatim excerpt. Then a council's own
 * rise can be compared with its own limit, which is the only comparison that
 * means anything. Until then `/insights/tax-cap-breakers` and
 * `/insights/cap-every-year` render a withdrawal notice.
 *
 * ─── Adding a year ───────────────────────────────────────────────────────
 *
 * Take the wording from that year's "Council Tax levels set by local
 * authorities in England" release, §3.3 Referendum principles. Copy the
 * excerpt verbatim — it is what a reader is shown when they ask where the
 * threshold came from. Do not paraphrase it, and do not source it from
 * anywhere but GOV.UK (Data Constitution Rule 2).
 */

import type { Council } from './councils';

export interface ReferendumPrinciple {
  /** Financial year these principles govern, e.g. '2026-27'. */
  year: string;
  /**
   * Increase at which a rise becomes excessive for authorities with adult
   * social care responsibility (county, unitary, metropolitan, London borough).
   */
  socialCarePct: number;
  /**
   * Shire districts are judged on the GREATER of a percentage or a cash
   * amount — a small district's 3% can be less than £5, so the cash floor is
   * what binds.
   */
  districtPct: number;
  districtAbsGbp: number;
  /** Councils granted a bespoke higher limit this year, keyed by slug. */
  bespokePct: Record<string, number>;
  source: {
    title: string;
    url: string;
    publisher: string;
    section: string;
    accessed: string;
    /** Verbatim from the release. Shown to readers; never paraphrase. */
    excerpt: string;
    bespokeExcerpt: string;
  };
}

export const REFERENDUM_PRINCIPLES: Record<string, ReferendumPrinciple> = {
  '2026-27': {
    year: '2026-27',
    socialCarePct: 5,
    districtPct: 3,
    districtAbsGbp: 5,
    bespokePct: {
      'bournemouth-christchurch-and-poole': 6.75,
      trafford: 7.5,
      warrington: 7.5,
      'windsor-and-maidenhead': 7.5,
      'north-somerset': 9,
      shropshire: 9,
      worcestershire: 9,
    },
    source: {
      title: 'Council Tax levels set by local authorities in England 2026 to 2027',
      url: 'https://www.gov.uk/government/statistics/council-tax-levels-set-by-local-authorities-in-england-2026-to-2027/council-tax-levels-set-by-local-authorities-in-england-2026-to-2027',
      publisher: 'MHCLG',
      section: '3.3 Referendum principles',
      accessed: '2026-08-23',
      excerpt:
        '5% or more than 5% (comprising up to a maximum of 2% for expenditure on adult social care and 3% on other expenditure) for authorities with responsibility for adult social care services; More than £5, or 3% or more than 3%, (the greater of the two) for district councils in two tier areas',
      bespokeExcerpt:
        'Bournemouth, Christchurch and Poole Council who have a maximum of 6.75% (comprising of 2% on adult social care, and 4.75% on other expenditure), Trafford Council, Warrington Borough Council, and Royal Borough of Windsor and Maidenhead Council who have a maximum of 7.5% (comprising of 2% on adult social care, and 5.5% on other expenditure), North Somerset Council, Shropshire Council, and Worcestershire County Council who have a maximum of 9% (comprising of 2% on adult social care, and 7% on other expenditure)',
    },
  },
  '2025-26': {
    year: '2025-26',
    socialCarePct: 5,
    districtPct: 3,
    districtAbsGbp: 5,
    bespokePct: {
      birmingham: 7.5,
      somerset: 7.5,
      trafford: 7.5,
      newham: 9,
      'windsor-and-maidenhead': 9,
      bradford: 10,
    },
    source: {
      title: 'Council Tax levels set by local authorities in England 2025 to 2026',
      url: 'https://www.gov.uk/government/statistics/council-tax-levels-set-by-local-authorities-in-england-2025-to-2026/council-tax-levels-set-by-local-authorities-in-england-2025-to-2026',
      publisher: 'MHCLG',
      section: '3.3 Referendum principles',
      accessed: '2026-08-23',
      excerpt:
        '5% or more than 5% (comprising up to a maximum of 2% for expenditure on adult social care and 3% on other expenditure); More than £5, or 3% or more than 3%, (the greater of the two) for district councils in 2 tier areas.',
      bespokeExcerpt:
        'Birmingham City Council, Somerset Council and Trafford Metropolitan Borough Council who have a maximum of 7.5% (comprising of 2% on adult social care, and 5.5% on other expenditure), Newham London Borough Council and Royal Borough of Windsor and Maidenhead Council who have a maximum of 9% (comprising of 2% on adult social care, and 7% on other expenditure), City of Bradford Metropolitan District Council who have a maximum of 10% (comprising of 2% on adult social care, and 8% on other expenditure).',
    },
  },
};

/** Councils that levy the adult social care precept. Districts do not. */
const DISTRICT_TYPES = new Set(['SD']);

export interface CouncilLimit {
  /** The percentage at which this council's rise becomes excessive. */
  pct: number;
  /**
   * Cash floor, districts only. A district is judged on the greater of `pct`
   * and this amount, so a small district's binding threshold is often the £.
   */
  absGbp: number | null;
  /** True when government granted this council a higher limit than its type. */
  bespoke: boolean;
  /** The type-level limit, for showing what the bespoke grant was measured against. */
  standardPct: number;
}

/**
 * The referendum limit that applies to one council in one year — the whole
 * point of this module. Bespoke grants win over the type default.
 */
export function getCouncilLimit(
  council: Pick<Council, 'type'> & { slug: string },
  year: string,
): CouncilLimit | null {
  const principle = REFERENDUM_PRINCIPLES[year];
  if (!principle) return null;

  const isDistrict = DISTRICT_TYPES.has(council.type);
  const standardPct = isDistrict ? principle.districtPct : principle.socialCarePct;
  const bespoke = principle.bespokePct[council.slug];

  return {
    pct: bespoke ?? standardPct,
    absGbp: isDistrict ? principle.districtAbsGbp : null,
    bespoke: bespoke !== undefined,
    standardPct,
  };
}

/**
 * Did this council raise Band D to the maximum it was permitted?
 *
 * "Maximum permitted" is one penny under the excessive threshold, because the
 * threshold itself triggers a referendum. Councils publish rises to 2dp, so we
 * compare on the same rounded value — otherwise floating-point noise decides
 * whether a council that deliberately set 4.99% lands in the bucket.
 *
 * Districts are judged on the greater of their percentage and cash floor, per
 * the statutory wording, so a small district raising £5 counts even when that
 * is well over 3%.
 */
export function isAtPermittedMaximum(
  limit: CouncilLimit,
  fromBandD: number,
  toBandD: number,
): boolean {
  const risePct = Math.round(((toBandD - fromBandD) / fromBandD) * 10000) / 100;
  const riseGbp = toBandD - fromBandD;

  // One penny under the trigger, expressed in percentage points.
  const atPct = risePct >= limit.pct - 0.01;

  if (limit.absGbp === null) return atPct;

  // District: the binding threshold is whichever of the two is greater.
  const pctInGbp = (fromBandD * limit.pct) / 100;
  const bindingGbp = Math.max(limit.absGbp, pctInGbp);
  return riseGbp >= bindingGbp - 0.01;
}

/** Did this council's rise actually exceed the referendum trigger? */
export function isExcessive(
  limit: CouncilLimit,
  fromBandD: number,
  toBandD: number,
): boolean {
  const risePct = Math.round(((toBandD - fromBandD) / fromBandD) * 10000) / 100;
  const riseGbp = toBandD - fromBandD;

  if (limit.absGbp === null) return risePct >= limit.pct;

  const pctInGbp = (fromBandD * limit.pct) / 100;
  const bindingGbp = Math.max(limit.absGbp, pctInGbp);
  return riseGbp > bindingGbp;
}
