import type { Metadata } from 'next';
import { buildWebPageSchema, buildBreadcrumbSchema } from '@/lib/structured-data';

export const metadata: Metadata = {
  title: 'Accessibility — WCAG 2.2 AA and Plain English',
  description: 'CivAccount conformance with WCAG 2.2 AA: high contrast, 44px tap targets, keyboard navigation, screen readers, and plain-English copy aimed at 70+ users on mobile.',
  alternates: {
    canonical: '/accessibility',
  },
  openGraph: {
    title: 'Accessibility — WCAG 2.2 AA and Plain English',
    description: 'CivAccount conformance with WCAG 2.2 AA: high contrast, 44px tap targets, keyboard navigation, screen readers, plain-English copy.',
    type: 'website',
    siteName: 'CivAccount',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Accessibility — WCAG 2.2 AA and Plain English',
    description: 'CivAccount conformance with WCAG 2.2 AA: high contrast, tap targets, keyboard, screen readers, plain English.',
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
