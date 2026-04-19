import type { Metadata } from 'next';
import { buildWebPageSchema, buildBreadcrumbSchema } from '@/lib/structured-data';

export const metadata: Metadata = {
  title: 'MIT Code, OGL v3.0 Data — Licence and Reuse',
  description: 'CivAccount licensing: MIT for the code, Open Government Licence v3.0 for the data. Open source, reusable, citable. Attribution and source links provided on every page.',
  alternates: {
    canonical: '/license',
  },
  openGraph: {
    title: 'MIT Code, OGL v3.0 Data — Licence and Reuse',
    description: 'CivAccount licensing: MIT code, OGL v3.0 data. Open source, reusable, citable. Attribution links on every page.',
    type: 'website',
    siteName: 'CivAccount',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'MIT Code, OGL v3.0 Data — Licence and Reuse',
    description: 'CivAccount: MIT code, OGL v3.0 data. Open source, reusable, citable.',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    buildWebPageSchema(
      'CivAccount Open Source License',
      'CivAccount is open source under the MIT license. Council data is published under Open Government Licence v3.0.',
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
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {children}
    </>
  );
}
