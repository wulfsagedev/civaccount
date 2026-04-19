import type { Metadata } from 'next';
import { buildWebPageSchema, buildBreadcrumbSchema } from '@/lib/structured-data';

export const metadata: Metadata = {
  title: 'Product Roadmap — What We\'re Building',
  description: 'See what features we\'re working on next for CivAccount. Our focus is on data quality, verifiability, and making council information trustworthy.',
  alternates: {
    canonical: '/roadmap',
  },
  openGraph: {
    title: 'Product Roadmap - What we\'re building',
    description: 'See what features we\'re working on next for CivAccount.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Product Roadmap - What we\'re building',
    description: 'See what features we\'re working on next for CivAccount.',
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
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {children}
    </>
  );
}
