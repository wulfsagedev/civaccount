import type { Metadata } from 'next';
import { buildWebPageSchema, buildBreadcrumbSchema } from '@/lib/structured-data';

export const metadata: Metadata = {
  title: 'Developers — Free UK Council Data API & Embeds',
  description:
    'Free public API for UK council budget data. One-line iframe embeds for any of 317 English councils. Open Government Licence v3.0. No key required, 100 req/min.',
  alternates: {
    canonical: '/developers',
  },
  openGraph: {
    title: 'CivAccount Developers — Free UK Council Data API',
    description:
      'Free public API and embeddable widgets for every English council. Built on open data from GOV.UK and ONS.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CivAccount Developers — Free UK Council Data API',
    description:
      'Free public API and embeddable widgets for every English council.',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    buildWebPageSchema(
      'CivAccount Developers — Free UK Council Data API & Embeds',
      'Public API and embeddable widgets for UK council budget data. Free, rate-limited, no key required.',
      '/developers',
      { type: 'WebPage' },
    ),
    buildBreadcrumbSchema(
      [{ name: 'Home', url: '/' }, { name: 'Developers' }],
      '/developers',
    ),
  ],
};

export default function DevelopersLayout({
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
