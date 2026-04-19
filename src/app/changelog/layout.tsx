import type { Metadata } from 'next';
import { buildWebPageSchema, buildBreadcrumbSchema } from '@/lib/structured-data';
import { serializeJsonLd } from '@/lib/safe-json-ld';

export const metadata: Metadata = {
  title: 'Data Change Log — What updated & when',
  description:
    'Live log of every data change across England\'s 317 councils on CivAccount. Year-over-year council tax movement, budget updates, and source additions.',
  alternates: { canonical: '/changelog' },
  openGraph: {
    title: 'CivAccount Data Change Log',
    description:
      'Every time council data changes on CivAccount, it lands here with the source and date.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CivAccount Data Change Log',
    description: 'Every council data change, sourced and dated.',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    buildWebPageSchema(
      'CivAccount Data Change Log',
      'Live log of council data changes with sources and dates.',
      '/changelog',
      { type: 'CollectionPage' },
    ),
    buildBreadcrumbSchema(
      [{ name: 'Home', url: '/' }, { name: 'Data change log' }],
      '/changelog',
    ),
  ],
};

export default function ChangelogLayout({ children }: { children: React.ReactNode }) {
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
