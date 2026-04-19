import type { Metadata } from 'next';
import { buildWebPageSchema, buildBreadcrumbSchema } from '@/lib/structured-data';

export const metadata: Metadata = {
  title: 'Town Hall — Have Your Say',
  description: 'Have your say on how your council spends your money. Vote on ideas, suggest changes, and join the conversation with other residents across 317 English councils.',
  alternates: {
    canonical: '/townhall',
  },
  openGraph: {
    title: 'Town Hall — Have Your Say on Council Spending',
    description: 'Vote on ideas, suggest changes, and join the conversation with other residents. 317 English councils.',
    type: 'website',
    siteName: 'CivAccount',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Town Hall — Have Your Say on Council Spending',
    description: 'Vote on ideas, suggest changes, and join the conversation with other residents.',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    buildWebPageSchema(
      'Town Hall — Have Your Say on Council Spending',
      'Vote on resident-submitted budget proposals and suggest changes for any of England\'s 317 councils.',
      '/townhall',
      { type: 'CollectionPage' },
    ),
    buildBreadcrumbSchema(
      [{ name: 'Home', url: '/' }, { name: 'Town Hall' }],
      '/townhall',
    ),
  ],
};

export default function TownHallLayout({ children }: { children: React.ReactNode }) {
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
