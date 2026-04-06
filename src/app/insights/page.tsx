import { councils, formatCurrency, getCouncilDisplayName } from '@/data/councils';
import { buildFAQPageSchema, buildBreadcrumbSchema } from '@/lib/structured-data';
import Breadcrumb from '@/components/proposals/Breadcrumb';
import InsightsClient from './InsightsClient';

export default function InsightsPage() {
  // Compute key stats server-side for direct-answer paragraph
  const councilsWithTax = councils.filter((c) => c.council_tax?.band_d_2025);
  const bandDValues = councilsWithTax.map((c) => c.council_tax!.band_d_2025);
  const avgBandD = bandDValues.reduce((sum, v) => sum + v, 0) / bandDValues.length;

  const cheapest = councilsWithTax.reduce((min, c) =>
    c.council_tax!.band_d_2025 < min.council_tax!.band_d_2025 ? c : min
  );
  const mostExpensive = councilsWithTax.reduce((max, c) =>
    c.council_tax!.band_d_2025 > max.council_tax!.band_d_2025 ? c : max
  );

  const councilsWithBothYears = councilsWithTax.filter((c) => c.council_tax?.band_d_2024);
  const avgChange = councilsWithBothYears.length > 0
    ? councilsWithBothYears.reduce((sum, c) => {
        const change = ((c.council_tax!.band_d_2025 - c.council_tax!.band_d_2024!) / c.council_tax!.band_d_2024!) * 100;
        return sum + change;
      }, 0) / councilsWithBothYears.length
    : null;

  const cheapestName = getCouncilDisplayName(cheapest);
  const expensiveName = getCouncilDisplayName(mostExpensive);

  const faqs = [
    {
      question: 'What is the average council tax in England?',
      answer: `The average Band D council tax in England for 2025-26 is ${formatCurrency(avgBandD, { decimals: 0 })}.`,
    },
    {
      question: 'Which council has the cheapest council tax?',
      answer: `${cheapestName} has the cheapest Band D council tax at ${formatCurrency(cheapest.council_tax!.band_d_2025, { decimals: 2 })}.`,
    },
    {
      question: 'Which council has the most expensive council tax?',
      answer: `${expensiveName} has the most expensive Band D council tax at ${formatCurrency(mostExpensive.council_tax!.band_d_2025, { decimals: 2 })}.`,
    },
    ...(avgChange !== null ? [{
      question: 'How much has council tax gone up in 2025-26?',
      answer: `Council tax increased by an average of ${avgChange.toFixed(1)}% in 2025-26 compared to the previous year.`,
    }] : []),
  ];

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      buildFAQPageSchema(faqs, '/insights'),
      buildBreadcrumbSchema(
        [{ name: 'Home', url: '/' }, { name: 'Council Tax Insights' }],
        '/insights'
      ),
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <InsightsClient />
    </>
  );
}
