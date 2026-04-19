import type { Metadata } from 'next';
import { buildWebPageSchema, buildBreadcrumbSchema } from '@/lib/structured-data';

export const metadata: Metadata = {
  title: 'Accessibility',
  description: 'CivAccount is designed to be accessible to everyone. We follow WCAG 2.2 AA guidelines with high contrast, keyboard navigation, and screen reader support.',
  alternates: {
    canonical: '/accessibility',
  },
  openGraph: {
    title: 'Accessibility - CivAccount',
    description: 'CivAccount is designed to be accessible to everyone.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Accessibility - CivAccount',
    description: 'CivAccount is designed to be accessible to everyone.',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    buildWebPageSchema(
      'CivAccount Accessibility Statement',
      'CivAccount conformance with WCAG 2.2 AA: high contrast, keyboard navigation, screen reader support, and large tap targets for older users on mobile.',
      '/accessibility',
    ),
    buildBreadcrumbSchema(
      [{ name: 'Home', url: '/' }, { name: 'Accessibility' }],
      '/accessibility',
    ),
  ],
};

export default function AccessibilityLayout({
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
