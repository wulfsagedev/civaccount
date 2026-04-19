import type { Metadata } from 'next';
import { buildWebPageSchema, buildBreadcrumbSchema } from '@/lib/structured-data';

export const metadata: Metadata = {
  title: 'Updates — What\'s New',
  description: 'See the latest updates and improvements to CivAccount. We regularly add new councils, features, and data to help you understand your council tax.',
  alternates: {
    canonical: '/updates',
  },
  openGraph: {
    title: 'Updates - What\'s new in CivAccount',
    description: 'See the latest updates and improvements to CivAccount.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Updates - What\'s new in CivAccount',
    description: 'See the latest updates and improvements to CivAccount.',
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
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {children}
    </>
  );
}
