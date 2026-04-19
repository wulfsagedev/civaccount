import type { Metadata } from 'next';
import { buildWebPageSchema, buildBreadcrumbSchema } from '@/lib/structured-data';

export const metadata: Metadata = {
  title: 'Methodology — How We Source Our Data',
  description: 'How CivAccount collects, verifies, and presents council budget data. All data comes from official UK government sources.',
  alternates: {
    canonical: '/methodology',
  },
  openGraph: {
    title: 'Methodology - How we source our data',
    description: 'How CivAccount collects, verifies, and presents council budget data.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Methodology - How we source our data',
    description: 'How CivAccount collects, verifies, and presents council budget data.',
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
