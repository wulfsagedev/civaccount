import { councils, formatCurrency, getCouncilDisplayName } from '@/data/councils';
import { buildBreadcrumbSchema } from '@/lib/structured-data';
import CompareClient from './CompareClient';

export default function ComparePage() {
  const councilsWithTax = councils.filter((c) => c.council_tax?.band_d_2025);

  const cheapest = councilsWithTax.reduce((min, c) =>
    c.council_tax!.band_d_2025 < min.council_tax!.band_d_2025 ? c : min
  );
  const mostExpensive = councilsWithTax.reduce((max, c) =>
    c.council_tax!.band_d_2025 > max.council_tax!.band_d_2025 ? c : max
  );

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
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <CompareClient />
    </>
  );
}
