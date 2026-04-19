import type { Metadata } from 'next';
import { buildWebPageSchema, buildBreadcrumbSchema } from '@/lib/structured-data';

export const metadata: Metadata = {
  title: 'FOI Archive — Data councils don\'t volunteer',
  description:
    'Freedom of Information requests we\'ve filed on UK councils and the responses we\'ve received — published in full. Covers data councils don\'t routinely publish.',
  alternates: { canonical: '/foi' },
  openGraph: {
    title: 'CivAccount FOI Archive',
    description:
      'Data we have extracted via Freedom of Information — published in full.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CivAccount FOI Archive',
    description: 'Data extracted via FOI, published in full.',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    buildWebPageSchema(
      'CivAccount FOI Archive',
      'Freedom of Information requests filed and responses received, published in full.',
      '/foi',
      { type: 'CollectionPage' },
    ),
    buildBreadcrumbSchema(
      [{ name: 'Home', url: '/' }, { name: 'FOI archive' }],
      '/foi',
    ),
  ],
};

export default function FoiLayout({ children }: { children: React.ReactNode }) {
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
