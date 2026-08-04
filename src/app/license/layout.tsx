import type { Metadata } from 'next';
import { buildWebPageSchema, buildBreadcrumbSchema } from '@/lib/structured-data';
import { serializeJsonLd } from '@/lib/safe-json-ld';

export const metadata: Metadata = {
  title: 'MIT Code, CivAccount Data Licence — Licence and Reuse',
  description: 'CivAccount licensing: MIT code; GOV.UK source data under OGL v3.0; compiled dataset under the CivAccount Data Licence — quote figures and embed widgets freely. Source links on every page.',
  alternates: {
    canonical: '/license',
  },
  openGraph: {
    title: 'MIT Code, CivAccount Data Licence — Licence and Reuse',
    description: 'CivAccount licensing: MIT code; OGL v3.0 source data; CivAccount Data Licence for the compiled dataset. Quote and embed freely.',
    type: 'website',
    siteName: 'CivAccount',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'MIT Code, CivAccount Data Licence — Licence and Reuse',
    description: 'CivAccount: MIT code; OGL v3.0 source data; CivAccount Data Licence dataset.',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    buildWebPageSchema(
      'CivAccount Open Source License',
      'CivAccount is open source under the MIT license. Source data is Crown copyright under OGL v3.0; the compiled dataset is under the CivAccount Data Licence.',
      '/license',
    ),
    buildBreadcrumbSchema(
      [{ name: 'Home', url: '/' }, { name: 'License' }],
      '/license',
    ),
  ],
};

export default function LicenseLayout({
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
