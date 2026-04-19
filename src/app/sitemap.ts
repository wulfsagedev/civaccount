import { MetadataRoute } from 'next'
import { councils, getCouncilSlug } from '@/data/councils'
import { createClient } from '@/lib/supabase/server'
import { getPopularComparisons } from '@/lib/comparisons'

/**
 * sitemap.xml — 2026 best-practice configuration.
 *
 * Per Google's 2026 guidance, only `<loc>` and `<lastmod>` are honoured.
 * `changefreq` and `priority` are ignored (and faking lastmod actively
 * undermines trust in the sitemap). We keep them out — every URL gets a
 * real lastModified that reflects an actual change to the underlying data
 * (or, for static pages, the build timestamp).
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://www.civaccount.co.uk'
  const buildDate = new Date().toISOString()

  // Static pages — every indexable, non-dynamic route is enumerated here.
  // Pages that are noindex (auth, embed, uk-only, design-preview, tax-card,
  // proposals/new, donate/thank-you) are deliberately omitted.
  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: buildDate },
    // Top-level hubs
    { url: `${baseUrl}/insights`, lastModified: buildDate },
    { url: `${baseUrl}/compare`, lastModified: buildDate },
    { url: `${baseUrl}/townhall`, lastModified: buildDate },
    { url: `${baseUrl}/data`, lastModified: buildDate },
    // Pillar guides (content clusters)
    { url: `${baseUrl}/guide/council-tax`, lastModified: buildDate },
    { url: `${baseUrl}/guide/council-spending`, lastModified: buildDate },
    { url: `${baseUrl}/guide/council-leadership`, lastModified: buildDate },
    { url: `${baseUrl}/guide/local-democracy`, lastModified: buildDate },
    // Insight sub-pages — full set
    { url: `${baseUrl}/insights/cheapest-council-tax`, lastModified: buildDate },
    { url: `${baseUrl}/insights/most-expensive-council-tax`, lastModified: buildDate },
    { url: `${baseUrl}/insights/council-tax-increases`, lastModified: buildDate },
    { url: `${baseUrl}/insights/council-ceo-salaries`, lastModified: buildDate },
    { url: `${baseUrl}/insights/leaderboards`, lastModified: buildDate },
    { url: `${baseUrl}/insights/postcode-lottery`, lastModified: buildDate },
    { url: `${baseUrl}/insights/biggest-tax-rises`, lastModified: buildDate },
    { url: `${baseUrl}/insights/three-year-squeeze`, lastModified: buildDate },
    { url: `${baseUrl}/insights/where-every-pound-goes`, lastModified: buildDate },
    { url: `${baseUrl}/insights/social-care-squeeze`, lastModified: buildDate },
    { url: `${baseUrl}/insights/top-suppliers`, lastModified: buildDate },
    { url: `${baseUrl}/insights/big-five-outsourcers`, lastModified: buildDate },
    { url: `${baseUrl}/insights/ceo-pay-league`, lastModified: buildDate },
    { url: `${baseUrl}/insights/hundred-k-club`, lastModified: buildDate },
    { url: `${baseUrl}/insights/closest-to-bankruptcy`, lastModified: buildDate },
    { url: `${baseUrl}/insights/tax-cap-breakers`, lastModified: buildDate },
    { url: `${baseUrl}/insights/cap-every-year`, lastModified: buildDate },
    // Trust & policy
    { url: `${baseUrl}/about`, lastModified: buildDate },
    { url: `${baseUrl}/methodology`, lastModified: buildDate },
    { url: `${baseUrl}/roadmap`, lastModified: buildDate },
    { url: `${baseUrl}/updates`, lastModified: buildDate },
    { url: `${baseUrl}/accessibility`, lastModified: buildDate },
    { url: `${baseUrl}/privacy`, lastModified: buildDate },
    { url: `${baseUrl}/terms`, lastModified: buildDate },
    { url: `${baseUrl}/license`, lastModified: buildDate },
    // Moat-building pages (developers, change log, FOI, parish)
    { url: `${baseUrl}/developers`, lastModified: buildDate },
    { url: `${baseUrl}/changelog`, lastModified: buildDate },
    { url: `${baseUrl}/foi`, lastModified: buildDate },
    { url: `${baseUrl}/parish`, lastModified: buildDate },
  ]

  // Head-to-head comparison pages
  const comparisonPages: MetadataRoute.Sitemap = getPopularComparisons().map((matchup) => ({
    url: `${baseUrl}/compare/${matchup}`,
    lastModified: buildDate,
  }))

  // Council dashboard pages + Town Hall pages
  // lastmod uses the council's own last_verified date when available — this is a
  // real signal tied to actual data updates, not a fabricated "weekly".
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
        lastModified: buildDate,
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
