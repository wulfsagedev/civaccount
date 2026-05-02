/**
 * council-insights-index.ts — compile-time index of which insights pages
 * each council appears on, with rank position.
 *
 * Powers the "Featured on" section at the bottom of each council page
 * (UnifiedDashboard.tsx). Critical SEO function: gives each council page
 * 3+ outbound links into the insights cluster, closing the
 * council ↔ insights internal-linking gap that the live audit
 * (2026-05-02) flagged as the single biggest crawl-graph weakness.
 *
 * All data comes from the same `insights-stats.ts` functions that
 * power the leaderboards themselves, so the appearance index can never
 * drift from what the insights pages actually display.
 *
 * Memoised once on first call.
 */

import { type Council } from '@/data/councils';
import {
  getBiggestTaxRises,
  getCeoPayStats,
  getClosestToBankruptcy,
  getHundredKClub,
  getThreeYearSqueeze,
  getSocialCareSqueeze,
} from '@/lib/insights-stats';

export interface CouncilInsightAppearance {
  /** Slug of the insight sub-page, e.g. "ceo-pay-league". */
  slug: string;
  /** Plain-English short label, e.g. "Highest CEO pay". */
  label: string;
  /** 1-based rank of the council on this insight, or null if unranked but featured. */
  rank: number | null;
  /** Total entries on the leaderboard (for "ranked #4 of 10" rendering). */
  outOf: number;
  /** Headline figure for this council on this insight, e.g. "£217,479". Optional. */
  figure?: string;
}

const _cache = new Map<string, CouncilInsightAppearance[]>();

function keyFor(council: Council): string {
  return council.ons_code;
}

/**
 * Returns every insights sub-page that features this council, with rank.
 *
 * Ordered roughly by user value: the most distinctive appearances first
 * (top-of-leaderboard ranks before middle-of-leaderboard).
 */
export function getInsightsForCouncil(
  council: Council,
): CouncilInsightAppearance[] {
  const cached = _cache.get(keyFor(council));
  if (cached) return cached;

  const out: CouncilInsightAppearance[] = [];

  // Helper to push a leaderboard appearance if the council ranks.
  const pushIfRanked = <T extends { council: Council }>(
    list: T[],
    slug: string,
    label: string,
    figureOf?: (entry: T) => string,
  ) => {
    const rank = list.findIndex((e) => e.council.ons_code === council.ons_code);
    if (rank >= 0) {
      out.push({
        slug,
        label,
        rank: rank + 1,
        outOf: list.length,
        figure: figureOf ? figureOf(list[rank]) : undefined,
      });
    }
  };

  // ── Top-of-leaderboard cards (5–10 entries) — high signal ────────────
  pushIfRanked(
    getBiggestTaxRises(20),
    'biggest-tax-rises',
    'Biggest tax rises',
    (e) => `+${(e as { changePct: number }).changePct.toFixed(1)}%`,
  );

  pushIfRanked(
    getCeoPayStats(20).top,
    'ceo-pay-league',
    'Highest CEO pay',
    (e) => `£${(e as { salary: number }).salary.toLocaleString('en-GB')}`,
  );

  pushIfRanked(
    getClosestToBankruptcy(20).top,
    'closest-to-bankruptcy',
    'Money pressure (budget gap)',
    (e) =>
      `£${((e as unknown as { gapPounds: number }).gapPounds / 1_000_000).toFixed(1)}m gap`,
  );

  pushIfRanked(
    getHundredKClub(20).top,
    'hundred-k-club',
    '£100k+ pay band',
    (e) => `${(e as unknown as { count: number }).count} staff`,
  );

  pushIfRanked(
    getThreeYearSqueeze(20).top,
    'three-year-squeeze',
    'Three-year tax squeeze',
    (e) =>
      `+${(e as unknown as { changePct: number }).changePct.toFixed(1)}%`,
  );

  pushIfRanked(
    getSocialCareSqueeze(20).top,
    'social-care-squeeze',
    'Social-care squeeze',
    (e) =>
      `${(e as unknown as { squeezePct: number }).squeezePct.toFixed(0)}% of budget`,
  );

  // ── Always-applicable appearances (every council qualifies) ───────────
  // Postcode lottery: every council with a Band-D rate appears on this page,
  // listed in its comparable group. Append unconditionally as a "context"
  // link so even mid-table councils have at least one Featured-on link.
  if (council.council_tax?.band_d_2025) {
    out.push({
      slug: 'postcode-lottery',
      label: 'Council tax across England',
      rank: null,
      outOf: 0,
      figure: `£${council.council_tax.band_d_2025.toLocaleString('en-GB')}`,
    });
  }

  // Cheapest / most-expensive: every council with a Band-D rate appears in
  // the comparable-group leaderboard on these pages.
  if (council.council_tax?.band_d_2025) {
    out.push({
      slug: 'cheapest-council-tax',
      label: 'Cheapest Band D bills',
      rank: null,
      outOf: 0,
    });
    out.push({
      slug: 'most-expensive-council-tax',
      label: 'Most expensive Band D bills',
      rank: null,
      outOf: 0,
    });
  }

  // Council tax increases: every council with a 2024→2025 delta is listed.
  if (council.council_tax?.band_d_2025 && council.council_tax?.band_d_2024) {
    out.push({
      slug: 'council-tax-increases',
      label: 'Council tax increases this year',
      rank: null,
      outOf: 0,
    });
  }

  _cache.set(keyFor(council), out);
  return out;
}

/**
 * Cap the number of "Featured on" links rendered on a council page.
 * 6 is enough for SEO (well above the 3-link target) without dominating
 * the page. Ranked appearances are prioritised over unranked.
 */
export const FEATURED_ON_LIMIT = 6;
