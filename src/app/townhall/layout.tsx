import type { Metadata } from 'next';
import { buildWebPageSchema, buildBreadcrumbSchema } from '@/lib/structured-data';
import { serializeJsonLd } from '@/lib/safe-json-ld';

export const metadata: Metadata = {
  title: 'Town Hall — Vote on Your Council\'s Spending',
  description: 'Vote on budget ideas for 317 English councils, add your own, and see which ideas people back most.',
  alternates: {
    canonical: '/townhall',
  },
  openGraph: {
    title: 'Town Hall — Vote on Your Council\'s Spending',
    description: 'Vote on budget ideas for 317 English councils, add your own, and see which ideas people back most.',
    type: 'website',
    siteName: 'CivAccount',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Town Hall — Vote on Your Council\'s Spending',
    description: 'Vote on resident-submitted budget ideas across 317 English councils.',
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
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
      />
      {children}
    </>
  );
}
