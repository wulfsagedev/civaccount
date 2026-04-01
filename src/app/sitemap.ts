import { MetadataRoute } from 'next'
import { councils, getCouncilSlug } from '@/data/councils'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://www.civaccount.co.uk'

  // Static pages — use fixed dates since these change infrequently
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: '2026-03-08',
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${baseUrl}/insights`,
      lastModified: '2026-03-08',
      changeFrequency: 'weekly',
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
      lastModified: '2026-03-08',
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/updates`,
      lastModified: '2026-03-08',
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
  ]

  // Council pages — use last_verified date when available
  const councilPages: MetadataRoute.Sitemap = councils.map((council) => ({
    url: `${baseUrl}/council/${getCouncilSlug(council)}`,
    lastModified: council.detailed?.last_verified || '2026-03-01',
    changeFrequency: 'monthly' as const,
    priority: 0.8,
  }))

  return [...staticPages, ...councilPages]
}
