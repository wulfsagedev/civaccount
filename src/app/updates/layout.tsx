import type { Metadata } from 'next';
import { buildWebPageSchema, buildBreadcrumbSchema } from '@/lib/structured-data';
import { serializeJsonLd } from '@/lib/safe-json-ld';

export const metadata: Metadata = {
  title: 'Updates — Changelog and Data Refreshes',
  description: 'What\'s new on CivAccount: feature launches, data refreshes, coverage expansions, and fixes. Subscribe via RSS for every update. Updated every time we ship.',
  alternates: {
    canonical: '/updates',
    types: {
      'application/rss+xml': [
        { url: '/updates/rss.xml', title: 'CivAccount updates' },
      ],
    },
  },
  openGraph: {
    title: 'Updates — Changelog and Data Refreshes',
    description: 'What\'s new on CivAccount: feature launches, data refreshes, coverage expansions, and fixes. Subscribe via RSS.',
    type: 'website',
    siteName: 'CivAccount',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Updates — Changelog and Data Refreshes',
    description: 'What\'s new on CivAccount: feature launches, data refreshes, coverage expansions.',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    buildWebPageSchema(
      'CivAccount Updates — Changelog',
      'Latest updates, data refreshes, and new features added to CivAccount.',
      '/updates',
    ),
    buildBreadcrumbSchema(
      [{ name: 'Home', url: '/' }, { name: 'Updates' }],
      '/updates',
    ),
  ],
};

export default function UpdatesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
      />
      {children}
    </>
  );
}
