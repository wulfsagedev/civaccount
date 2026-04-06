import { MetadataRoute } from 'next'
import { councils, getCouncilSlug } from '@/data/councils'
import { createClient } from '@/lib/supabase/server'
import { getPopularComparisons } from '@/lib/comparisons'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://www.civaccount.co.uk'

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: '2026-04-06',
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${baseUrl}/insights`,
      lastModified: '2026-04-06',
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/compare`,
      lastModified: '2026-04-06',
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/townhall`,
      lastModified: '2026-04-06',
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: '2026-03-01',
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/methodology`,
      lastModified: '2026-03-01',
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/roadmap`,
      lastModified: '2026-04-06',
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/updates`,
      lastModified: '2026-04-06',
      changeFrequency: 'weekly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/accessibility`,
      lastModified: '2026-02-01',
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: '2026-02-01',
      changeFrequency: 'monthly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: '2026-02-01',
      changeFrequency: 'monthly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/license`,
      lastModified: '2026-02-01',
      changeFrequency: 'monthly',
      priority: 0.3,
    },
    // Guide pages (content clusters)
    {
      url: `${baseUrl}/guide/council-tax`,
      lastModified: '2026-04-06',
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/guide/council-spending`,
      lastModified: '2026-04-06',
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/guide/council-leadership`,
      lastModified: '2026-04-06',
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/guide/local-democracy`,
      lastModified: '2026-04-06',
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    // Open data page
    {
      url: `${baseUrl}/data`,
      lastModified: '2026-04-06',
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    // Long-tail insight sub-pages
    {
      url: `${baseUrl}/insights/cheapest-council-tax`,
      lastModified: '2026-04-06',
      changeFrequency: 'monthly',
      priority: 0.85,
    },
    {
      url: `${baseUrl}/insights/most-expensive-council-tax`,
      lastModified: '2026-04-06',
      changeFrequency: 'monthly',
      priority: 0.85,
    },
    {
      url: `${baseUrl}/insights/council-tax-increases`,
      lastModified: '2026-04-06',
      changeFrequency: 'monthly',
      priority: 0.85,
    },
    {
      url: `${baseUrl}/insights/council-ceo-salaries`,
      lastModified: '2026-04-06',
      changeFrequency: 'monthly',
      priority: 0.85,
    },
  ]

  // Head-to-head comparison pages
  const comparisonPages: MetadataRoute.Sitemap = getPopularComparisons().map((matchup) => ({
    url: `${baseUrl}/compare/${matchup}`,
    lastModified: '2026-04-06',
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }))

  // Council dashboard pages + Town Hall pages
  const councilPages: MetadataRoute.Sitemap = councils.flatMap((council) => {
    const slug = getCouncilSlug(council);
    return [
      {
        url: `${baseUrl}/council/${slug}`,
        lastModified: council.detailed?.last_verified || '2026-03-01',
        changeFrequency: 'monthly' as const,
        priority: 0.8,
      },
      {
        url: `${baseUrl}/council/${slug}/proposals`,
        lastModified: '2026-04-06',
        changeFrequency: 'daily' as const,
        priority: 0.7,
      },
    ];
  })

  // Recent proposals (top 500 by score for discoverability)
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
        changeFrequency: 'weekly' as const,
        priority: 0.6,
      }));
    }
  } catch {
    // Supabase unavailable at build time — skip proposals
  }

  return [...staticPages, ...comparisonPages, ...councilPages, ...proposalPages]
}
