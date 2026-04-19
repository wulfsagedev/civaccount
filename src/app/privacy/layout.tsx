import type { Metadata } from 'next';
import { buildWebPageSchema, buildBreadcrumbSchema } from '@/lib/structured-data';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'CivAccount privacy policy. We respect your privacy and only use essential cookies. No tracking, no ads, no data selling.',
  alternates: {
    canonical: '/privacy',
  },
  openGraph: {
    title: 'Privacy Policy - CivAccount',
    description: 'CivAccount privacy policy. We respect your privacy.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Privacy Policy - CivAccount',
    description: 'CivAccount privacy policy. We respect your privacy.',
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
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {children}
    </>
  );
}
