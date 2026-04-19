import type { Metadata } from 'next';
import { buildWebPageSchema, buildBreadcrumbSchema } from '@/lib/structured-data';
import { serializeJsonLd } from '@/lib/safe-json-ld';

export const metadata: Metadata = {
  title: 'Roadmap — What We\'re Building This Year',
  description: 'The CivAccount roadmap for 2026: data quality, parish and town councils, programmatic depth, API stability, and the civic tools we\'re shipping next.',
  alternates: {
    canonical: '/roadmap',
  },
  openGraph: {
    title: 'Roadmap — What We\'re Building This Year',
    description: 'The CivAccount 2026 roadmap: data quality, parish councils, programmatic depth, API stability, and civic tools shipping next.',
    type: 'website',
    siteName: 'CivAccount',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Roadmap — What We\'re Building This Year',
    description: 'CivAccount 2026 roadmap: data quality, parish councils, programmatic depth, API stability.',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    buildWebPageSchema(
      'CivAccount Roadmap — What We\'re Building',
      'Upcoming features and improvements for CivAccount: data quality, verifiability, and new ways to make council information trustworthy.',
      '/roadmap',
    ),
    buildBreadcrumbSchema(
      [{ name: 'Home', url: '/' }, { name: 'Roadmap' }],
      '/roadmap',
    ),
  ],
};

export default function RoadmapLayout({
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
