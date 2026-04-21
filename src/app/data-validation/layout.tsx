import type { Metadata } from 'next';
import { buildWebPageSchema, buildBreadcrumbSchema } from '@/lib/structured-data';
import { serializeJsonLd } from '@/lib/safe-json-ld';

export const metadata: Metadata = {
  title: 'Data Validation — How We Verify Every Number',
  description: 'Our integrity rule: every number on CivAccount must trace to a .gov.uk, ONS or open-government document in a few clicks. This page lists what passes today, what is in validation, and how to verify yourself.',
  alternates: {
    canonical: '/data-validation',
  },
  openGraph: {
    title: 'Data Validation — How We Verify Every Number',
    description: 'Every number must trace to a .gov.uk or ONS source. Current validation status per field, plus how to spot-check yourself.',
    type: 'website',
    siteName: 'CivAccount',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Data Validation — How We Verify Every Number',
    description: 'Every number must trace to a .gov.uk or ONS source. Current status per field.',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    buildWebPageSchema(
      'CivAccount Data Validation — Integrity Rule and Current Status',
      'The integrity rule that governs every number on CivAccount, the process we follow to verify values against .gov.uk and ONS sources, and the current validation status per field.',
      '/data-validation',
    ),
    buildBreadcrumbSchema(
      [{ name: 'Home', url: '/' }, { name: 'Data Validation' }],
      '/data-validation',
    ),
  ],
};

export default function DataValidationLayout({ children }: { children: React.ReactNode }) {
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
