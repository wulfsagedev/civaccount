import type { Metadata } from 'next';
import { buildWebPageSchema, buildBreadcrumbSchema } from '@/lib/structured-data';

export const metadata: Metadata = {
  title: 'Why We Built CivAccount — An Open Civic Tool',
  description: 'Why we built CivAccount — to turn scattered council budget data from 317 .gov.uk and ONS sources into one place everyone can read, compare and cite.',
  alternates: {
    canonical: '/about',
  },
  openGraph: {
    title: 'Why We Built CivAccount — An Open Civic Tool',
    description: 'Why we built CivAccount — to turn scattered council budget data into one place everyone can read, compare and cite.',
    type: 'website',
    siteName: 'CivAccount',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Why We Built CivAccount — An Open Civic Tool',
    description: 'Why we built CivAccount — to turn scattered council budget data into one place everyone can read, compare and cite.',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    buildWebPageSchema(
      'About CivAccount — Why We Built This',
      'CivAccount is an independent UK council budget transparency project. We turn official .gov.uk and ONS data into clear, comparable views for citizens.',
      '/about',
      { type: 'AboutPage' },
    ),
    buildBreadcrumbSchema(
      [{ name: 'Home', url: '/' }, { name: 'About' }],
      '/about',
    ),
  ],
};

export default function AboutLayout({
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
