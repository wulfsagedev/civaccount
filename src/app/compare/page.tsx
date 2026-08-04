import { buildBreadcrumbSchema } from '@/lib/structured-data';
import CompareClient from './CompareClient';
import { serializeJsonLd } from '@/lib/safe-json-ld';

export default function ComparePage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      buildBreadcrumbSchema(
        [{ name: 'Home', url: '/' }, { name: 'Compare Councils' }],
        '/compare'
      ),
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
      />
      <CompareClient />
    </>
  );
}
