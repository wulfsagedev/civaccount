import type { Metadata } from 'next';
import Link from 'next/link';
import { councils, formatCurrency, getCouncilDisplayName, getCouncilSlug } from '@/data/councils';
import { RankedBarList, RankedBarRow } from '@/components/insights/RankedBarRow';
import { buildFAQPageSchema, buildBreadcrumbSchema } from '@/lib/structured-data';
import Breadcrumb from '@/components/proposals/Breadcrumb';

export const metadata: Metadata = {
  title: 'Most Expensive Council Tax in England 2025-26',
  description: 'Find the most expensive council tax rates in England for 2025-26. See which councils charge the highest Band D rates across unitary authorities, metropolitan districts, London boroughs, county councils, and district councils.',
  alternates: {
    canonical: '/insights/most-expensive-council-tax',
  },
  openGraph: {
    title: 'Most Expensive Council Tax in England 2025-26',
    description: 'Which councils charge the highest Band D council tax? See the full rankings.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Most Expensive Council Tax in England 2025-26',
    description: 'Which councils charge the highest Band D council tax? See the full rankings.',
  },
};

import { COMPARABLE_GROUPS } from '@/lib/council-averages';

const GROUPS = COMPARABLE_GROUPS.map(g => ({
  label: g.label,
  subtitle: g.description,
  types: g.types as unknown as string[],
}));

export default function MostExpensiveCouncilTaxPage() {
  const councilsWithTax = councils.filter((c) => c.council_tax?.band_d_2025);

  const mostExpensive = councilsWithTax.reduce((max, c) =>
    c.council_tax!.band_d_2025 > max.council_tax!.band_d_2025 ? c : max
  );
  const expensiveName = getCouncilDisplayName(mostExpensive);

  const faqs = [
    {
      question: 'Which council has the most expensive council tax in England?',
      answer: `${expensiveName} has the most expensive Band D council tax in England for 2025-26 at ${formatCurrency(mostExpensive.council_tax!.band_d_2025, { decimals: 2 })}.`,
    },
    {
      question: 'Why do some councils charge more than others?',
      answer: "Council tax rates depend on a few things: the range of services the council runs, where the council chooses to spend its money, how much funding it gets from government, and how many homes share the bill. Councils with fewer homes, or with higher demand for services, tend to charge more per household.",
    },
  ];

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      buildFAQPageSchema(faqs, '/insights/most-expensive-council-tax'),
      buildBreadcrumbSchema(
        [
          { name: 'Home', url: '/' },
          { name: 'Insights', url: '/insights' },
          { name: 'Most Expensive Council Tax' },
        ],
        '/insights/most-expensive-council-tax'
      ),
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <main id="main-content" className="flex-1 container mx-auto px-4 max-w-3xl py-8">
        <Breadcrumb items={[
          { label: 'Home', href: '/' },
          { label: 'Insights', href: '/insights' },
          { label: 'Most Expensive Council Tax' },
        ]} />

        <h1 className="type-title-1 mb-2">Most Expensive Council Tax in England</h1>
        <p className="type-body-sm text-muted-foreground mb-8">
          The most expensive Band D council tax in England for 2025-26 is {expensiveName} at {formatCurrency(mostExpensive.council_tax!.band_d_2025, { decimals: 2 })}.
          Rates are grouped by council type, so you compare like with like.
        </p>

        {GROUPS.map((group) => {
          const groupCouncils = councilsWithTax
            .filter((c) => group.types.includes(c.type))
            .sort((a, b) => b.council_tax!.band_d_2025 - a.council_tax!.band_d_2025)
            .slice(0, 20);

          if (groupCouncils.length === 0) return null;

          const maxBandD = groupCouncils[0].council_tax!.band_d_2025;

          return (
            <section key={group.label} className="card-elevated p-5 sm:p-6 mb-5">
              <h2 className="type-title-2 mb-1">{group.label}</h2>
              <p className="type-body-sm text-muted-foreground mb-6">{group.subtitle}</p>

              <RankedBarList>
                {groupCouncils.map((council, index) => {
                  const bandD = council.council_tax!.band_d_2025;
                  return (
                    <RankedBarRow
                      key={council.ons_code}
                      rank={index + 1}
                      title={getCouncilDisplayName(council)}
                      href={`/council/${getCouncilSlug(council)}`}
                      value={formatCurrency(bandD, { decimals: 2 })}
                      subLeft={council.type_name}
                      fillPct={maxBandD > 0 ? (bandD / maxBandD) * 100 : 0}
                    />
                  );
                })}
              </RankedBarList>
            </section>
          );
        })}

        <nav className="mt-8 space-y-2">
          <p className="type-body-sm font-semibold mb-3">More insights</p>
          <ul className="space-y-2">
            <li><Link href="/insights/cheapest-council-tax" className="type-body-sm text-muted-foreground hover:text-foreground transition-colors">Cheapest council tax</Link></li>
            <li><Link href="/insights/council-tax-increases" className="type-body-sm text-muted-foreground hover:text-foreground transition-colors">Council tax increases</Link></li>
            <li><Link href="/insights/council-ceo-salaries" className="type-body-sm text-muted-foreground hover:text-foreground transition-colors">Council CEO salaries</Link></li>
            <li><Link href="/insights" className="type-body-sm text-muted-foreground hover:text-foreground transition-colors">All insights</Link></li>
          </ul>
        </nav>
      </main>
      </>
  );
}
