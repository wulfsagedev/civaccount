import type { Metadata } from 'next';
import { buildWebPageSchema, buildBreadcrumbSchema } from '@/lib/structured-data';

export const metadata: Metadata = {
  title: 'Terms of Use',
  description: 'Terms of use for CivAccount. Our data comes from official government sources but is provided for informational purposes only.',
  alternates: {
    canonical: '/terms',
  },
  openGraph: {
    title: 'Terms of Use - CivAccount',
    description: 'Terms of use for CivAccount.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Terms of Use - CivAccount',
    description: 'Terms of use for CivAccount.',
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
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {children}
    </>
  );
}
