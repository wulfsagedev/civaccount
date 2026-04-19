import type { Metadata } from 'next';
import { buildWebPageSchema, buildBreadcrumbSchema } from '@/lib/structured-data';
import { serializeJsonLd } from '@/lib/safe-json-ld';

export const metadata: Metadata = {
  title: 'Terms of Use, Data Licence and Attribution',
  description: 'Terms for using CivAccount. Code is MIT licensed. Council data is aggregated from .gov.uk sources under Open Government Licence v3.0. Attribution required on reuse.',
  alternates: {
    canonical: '/terms',
  },
  openGraph: {
    title: 'Terms of Use, Data Licence and Attribution',
    description: 'CivAccount terms. MIT-licensed code. Council data under Open Government Licence v3.0. Attribution required on reuse.',
    type: 'website',
    siteName: 'CivAccount',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Terms of Use, Data Licence and Attribution',
    description: 'CivAccount terms. MIT code. OGL v3.0 data. Attribution required on reuse.',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    buildWebPageSchema(
      'CivAccount Terms of Use',
      'Terms of use for CivAccount. Data is sourced from official UK government publications and provided for informational purposes only.',
      '/terms',
    ),
    buildBreadcrumbSchema(
      [{ name: 'Home', url: '/' }, { name: 'Terms' }],
      '/terms',
    ),
  ],
};

export default function TermsLayout({
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
