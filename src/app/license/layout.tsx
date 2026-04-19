import type { Metadata } from 'next';
import { buildWebPageSchema, buildBreadcrumbSchema } from '@/lib/structured-data';

export const metadata: Metadata = {
  title: 'Open Source License',
  description: 'CivAccount is open source software. View our MIT license and contribute to making council data more accessible.',
  alternates: {
    canonical: '/license',
  },
  openGraph: {
    title: 'Open Source License - CivAccount',
    description: 'CivAccount is open source software under the MIT license.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Open Source License - CivAccount',
    description: 'CivAccount is open source software under the MIT license.',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    buildWebPageSchema(
      'CivAccount Open Source License',
      'CivAccount is open source under the MIT license. Council data is published under Open Government Licence v3.0.',
      '/license',
    ),
    buildBreadcrumbSchema(
      [{ name: 'Home', url: '/' }, { name: 'License' }],
      '/license',
    ),
  ],
};

export default function LicenseLayout({
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
