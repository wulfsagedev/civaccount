import { MetadataRoute } from 'next'
import { councils, getCouncilSlug } from '@/data/councils'
import { createClient } from '@/lib/supabase/server'
import { getPopularComparisons } from '@/lib/comparisons'
import { getDataLastVerified } from '@/lib/data-freshness'

/**
 * sitemap.xml — 2026 best-practice configuration.
 *
 * Per Google's 2026 guidance, only `<loc>` and `<lastmod>` are honoured.
 * `changefreq` and `priority` are ignored — and faking `lastmod` actively
 * undermines trust in the whole sitemap (SpamBrain cross-checks). So every
 * URL here uses a **real** `lastModified` that reflects an actual content
 * change:
 *
 *   - Static pages → `STATIC_PAGE_LASTMOD` (the last real content edit date
 *     for utility/trust pages), OR the data-refresh date for pages whose
 *     content is generated from the council dataset. Never the build date.
 *   - Council pages → `council.detailed.last_verified` (the real per-council
 *     refresh date).
 *   - Proposal pages → the proposal's own `created_at`.
 *
 * When you ship content changes, bump `STATIC_PAGE_LASTMOD` below. When you
 * refresh council data, the per-council `last_verified` flows through.
 */

// Single edit point for utility / policy page content changes. Bump this
// when you edit /about, /methodology, /privacy, /terms, /accessibility, etc.
const STATIC_PAGE_LASTMOD = '2026-04-19';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://www.civaccount.co.uk'

  // Data-driven pages use the real dataset freshness signal.
  const dataDriven = getDataLastVerified();

  // Static pages — every indexable, non-dynamic route enumerated here.
  // Pages that are noindex (auth, embed, uk-only, design-preview, tax-card,
  // proposals/new, donate/thank-you) are deliberately omitted.
  const staticPages: MetadataRoute.Sitemap = [
    // Homepage — changes when featured content does; tied to data freshness.
    { url: baseUrl, lastModified: dataDriven },
    // Hubs that surface dataset content — tied to data freshness.
    { url: `${baseUrl}/insights`, lastModified: dataDriven },
    { url: `${baseUrl}/compare`, lastModified: dataDriven },
    { url: `${baseUrl}/townhall`, lastModified: dataDriven },
    { url: `${baseUrl}/data`, lastModified: dataDriven },
    { url: `${baseUrl}/changelog`, lastModified: dataDriven },
    { url: `${baseUrl}/updates`, lastModified: dataDriven },
    // Pillar guides (editorial content) — tied to static content edits.
    { url: `${baseUrl}/guide/council-tax`, lastModified: STATIC_PAGE_LASTMOD },
    { url: `${baseUrl}/guide/council-spending`, lastModified: STATIC_PAGE_LASTMOD },
    { url: `${baseUrl}/guide/council-leadership`, lastModified: STATIC_PAGE_LASTMOD },
    { url: `${baseUrl}/guide/local-democracy`, lastModified: STATIC_PAGE_LASTMOD },
    // Insight sub-pages — data-driven; bump when data refreshes.
    { url: `${baseUrl}/insights/cheapest-council-tax`, lastModified: dataDriven },
    { url: `${baseUrl}/insights/most-expensive-council-tax`, lastModified: dataDriven },
    { url: `${baseUrl}/insights/council-tax-increases`, lastModified: dataDriven },
    { url: `${baseUrl}/insights/council-ceo-salaries`, lastModified: dataDriven },
    { url: `${baseUrl}/insights/leaderboards`, lastModified: dataDriven },
    { url: `${baseUrl}/insights/postcode-lottery`, lastModified: dataDriven },
    { url: `${baseUrl}/insights/biggest-tax-rises`, lastModified: dataDriven },
    { url: `${baseUrl}/insights/three-year-squeeze`, lastModified: dataDriven },
    { url: `${baseUrl}/insights/where-every-pound-goes`, lastModified: dataDriven },
    { url: `${baseUrl}/insights/social-care-squeeze`, lastModified: dataDriven },
    { url: `${baseUrl}/insights/top-suppliers`, lastModified: dataDriven },
    { url: `${baseUrl}/insights/big-five-outsourcers`, lastModified: dataDriven },
    { url: `${baseUrl}/insights/ceo-pay-league`, lastModified: dataDriven },
    { url: `${baseUrl}/insights/hundred-k-club`, lastModified: dataDriven },
    { url: `${baseUrl}/insights/closest-to-bankruptcy`, lastModified: dataDriven },
    { url: `${baseUrl}/insights/tax-cap-breakers`, lastModified: dataDriven },
    { url: `${baseUrl}/insights/cap-every-year`, lastModified: dataDriven },
    // Trust & policy — tied to static content edits.
    { url: `${baseUrl}/about`, lastModified: STATIC_PAGE_LASTMOD },
    { url: `${baseUrl}/methodology`, lastModified: STATIC_PAGE_LASTMOD },
    { url: `${baseUrl}/roadmap`, lastModified: STATIC_PAGE_LASTMOD },
    { url: `${baseUrl}/accessibility`, lastModified: STATIC_PAGE_LASTMOD },
    { url: `${baseUrl}/privacy`, lastModified: STATIC_PAGE_LASTMOD },
    { url: `${baseUrl}/terms`, lastModified: STATIC_PAGE_LASTMOD },
    { url: `${baseUrl}/license`, lastModified: STATIC_PAGE_LASTMOD },
    // Moat-building pages.
    { url: `${baseUrl}/developers`, lastModified: STATIC_PAGE_LASTMOD },
    { url: `${baseUrl}/parish`, lastModified: STATIC_PAGE_LASTMOD },
    { url: `${baseUrl}/press`, lastModified: STATIC_PAGE_LASTMOD },
  ]

  // Head-to-head comparison pages — tied to data freshness (the comparison
  // view renders the latest verified figures).
  const comparisonPages: MetadataRoute.Sitemap = getPopularComparisons().map((matchup) => ({
    url: `${baseUrl}/compare/${matchup}`,
    lastModified: dataDriven,
  }))

  // Council dashboard pages + Town Hall + Provenance pages.
  // lastmod uses the council's own `last_verified` — a real signal tied to
  // actual per-council data updates, not a fabricated sitewide timestamp.
  const councilPages: MetadataRoute.Sitemap = councils.flatMap((council) => {
    const slug = getCouncilSlug(council);
    const councilLastMod = council.detailed?.last_verified || '2026-03-01';
    return [
      {
        url: `${baseUrl}/council/${slug}`,
        lastModified: councilLastMod,
      },
      {
        url: `${baseUrl}/council/${slug}/proposals`,
        lastModified: councilLastMod,
      },
      {
        url: `${baseUrl}/council/${slug}/provenance`,
        lastModified: councilLastMod,
      },
    ];
  })

  // Recent proposals (top 500 by score for discoverability).
  // lastModified uses the proposal's actual created_at — a real timestamp.
  let proposalPages: MetadataRoute.Sitemap = [];
  try {
    const supabase = await createClient();
    const { data: proposals } = await supabase
      .from('proposals')
      .select('id, council_slug, created_at')
      .in('status', ['open', 'acknowledged', 'in_progress', 'resolved'])
      .order('score', { ascending: false })
      .limit(500);

    if (proposals) {
      proposalPages = proposals.map((p) => ({
        url: `${baseUrl}/council/${p.council_slug}/proposals/${p.id}`,
        lastModified: p.created_at,
      }));
    }
  } catch {
    // Supabase unavailable at build time — skip proposals.
  }

  return [...staticPages, ...comparisonPages, ...councilPages, ...proposalPages]
}
