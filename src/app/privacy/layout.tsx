import type { Metadata } from 'next';
import { buildWebPageSchema, buildBreadcrumbSchema } from '@/lib/structured-data';
import { serializeJsonLd } from '@/lib/safe-json-ld';

export const metadata: Metadata = {
  title: 'Privacy — What We Collect and How We Use It',
  description: 'CivAccount\'s privacy policy in plain English. No tracking, no ads, no cookies beyond what\'s essential. We don\'t store personal data about visitors to the site.',
  alternates: {
    canonical: '/privacy',
  },
  openGraph: {
    title: 'Privacy — What We Collect and How We Use It',
    description: 'CivAccount privacy policy in plain English. No tracking, no ads, no cookies beyond what\'s essential. We don\'t store personal data.',
    type: 'website',
    siteName: 'CivAccount',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Privacy — What We Collect and How We Use It',
    description: 'CivAccount privacy policy in plain English. No tracking, no ads, no personal data.',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    buildWebPageSchema(
      'CivAccount Privacy Policy',
      'CivAccount privacy policy: essential cookies only, no tracking, no ads, no data selling.',
      '/privacy',
    ),
    buildBreadcrumbSchema(
      [{ name: 'Home', url: '/' }, { name: 'Privacy' }],
      '/privacy',
    ),
  ],
};

export default function PrivacyLayout({
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
