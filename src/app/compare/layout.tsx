import type { Metadata } from 'next';
import { buildWebPageSchema, buildBreadcrumbSchema } from '@/lib/structured-data';
import { serializeJsonLd } from '@/lib/safe-json-ld';

export const metadata: Metadata = {
  title: 'Council Tax Comparison Tool — All 317 English Councils',
  description: 'Free council tax comparison tool. Compare any two English councils side by side: Band D rates, total bill including precepts, budget breakdowns by service, CEO pay and supplier spend. All 317 English councils, sourced from .gov.uk.',
  alternates: {
    canonical: '/compare',
  },
  openGraph: {
    title: 'Council Tax Comparison Tool — All 317 English Councils',
    description: 'Free tool to compare any two English councils head-to-head: Band D, total bill, budget breakdown, CEO pay, suppliers.',
    type: 'website',
    siteName: 'CivAccount',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Council Tax Comparison Tool — All 317 English Councils',
    description: 'Free tool to compare any two English councils head-to-head: Band D, budget breakdown, CEO pay, suppliers.',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    buildWebPageSchema(
      'Compare Any Two English Councils Side by Side',
      'Head-to-head comparison tool for Band D council tax, budget breakdowns by service, CEO pay, supplier spend, and financial health across any two English councils.',
      '/compare',
      { type: 'CollectionPage' },
    ),
    buildBreadcrumbSchema(
      [{ name: 'Home', url: '/' }, { name: 'Compare councils' }],
      '/compare',
    ),
  ],
};

export default function CompareLayout({ children }: { children: React.ReactNode }) {
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
