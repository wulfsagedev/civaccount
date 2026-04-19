import type { Metadata } from 'next';
import { buildWebPageSchema, buildBreadcrumbSchema } from '@/lib/structured-data';

export const metadata: Metadata = {
  title: 'Data Methodology — How We Source and Verify',
  description: 'Step-by-step: how CivAccount collects, verifies, triangulates and publishes council data. Every figure traces to a .gov.uk or ONS source. Updated when officials publish.',
  alternates: {
    canonical: '/methodology',
  },
  openGraph: {
    title: 'Data Methodology — How We Source and Verify',
    description: 'How CivAccount collects, verifies and triangulates council data. Every figure traces to a .gov.uk or ONS source.',
    type: 'website',
    siteName: 'CivAccount',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Data Methodology — How We Source and Verify',
    description: 'How CivAccount collects and verifies council data. Every figure traces to a .gov.uk or ONS source.',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    buildWebPageSchema(
      'CivAccount Methodology — How We Source Our Data',
      'Step-by-step explanation of how CivAccount collects, verifies, and updates council budget and tax data. Every figure is traceable to a .gov.uk or ONS source.',
      '/methodology',
    ),
    buildBreadcrumbSchema(
      [{ name: 'Home', url: '/' }, { name: 'Methodology' }],
      '/methodology',
    ),
  ],
};

export default function MethodologyLayout({
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
