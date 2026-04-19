import type { Metadata } from 'next';
import { buildWebPageSchema, buildBreadcrumbSchema } from '@/lib/structured-data';

export const metadata: Metadata = {
  title: 'About — Why We Built This',
  description: 'Learn why we created CivAccount to make UK council budget data accessible to everyone. Our mission is transparency in local government spending.',
  alternates: {
    canonical: '/about',
  },
  openGraph: {
    title: 'About CivAccount - Why we built this',
    description: 'Learn why we created CivAccount to make UK council budget data accessible to everyone.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'About CivAccount - Why we built this',
    description: 'Learn why we created CivAccount to make UK council budget data accessible to everyone.',
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
