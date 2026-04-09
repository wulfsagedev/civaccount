import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/_next/', '/auth/', '/embed/', '/uk-only'],
      },
      // Explicitly welcome AI search crawlers
      {
        userAgent: 'GPTBot',
        allow: '/',
        disallow: ['/api/', '/_next/', '/auth/', '/embed/'],
      },
      {
        userAgent: 'ChatGPT-User',
        allow: '/',
        disallow: ['/api/', '/_next/', '/auth/', '/embed/'],
      },
      {
        userAgent: 'Claude-Web',
        allow: '/',
        disallow: ['/api/', '/_next/', '/auth/', '/embed/'],
      },
      {
        userAgent: 'Anthropic-AI',
        allow: '/',
        disallow: ['/api/', '/_next/', '/auth/', '/embed/'],
      },
      {
        userAgent: 'Google-Extended',
        allow: '/',
        disallow: ['/api/', '/_next/', '/auth/', '/embed/'],
      },
      {
        userAgent: 'PerplexityBot',
        allow: '/',
        disallow: ['/api/', '/_next/', '/auth/', '/embed/'],
      },
      {
        userAgent: 'Bytespider',
        allow: '/',
        disallow: ['/api/', '/_next/', '/auth/', '/embed/'],
      },
      {
        userAgent: 'cohere-ai',
        allow: '/',
        disallow: ['/api/', '/_next/', '/auth/', '/embed/'],
      },
    ],
    sitemap: 'https://www.civaccount.co.uk/sitemap.xml',
  };
}
