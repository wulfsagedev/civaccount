import type { Metadata } from 'next';
import Link from 'next/link';
import { councils, formatCurrency, getCouncilDisplayName, getCouncilSlug } from '@/data/councils';
import { RankedBarList, RankedBarRow } from '@/components/insights/RankedBarRow';
import { buildFAQPageSchema, buildBreadcrumbSchema, buildArticleSchema, buildWebPageSchema } from '@/lib/structured-data';
import Breadcrumb from '@/components/proposals/Breadcrumb';

export const metadata: Metadata = {
  title: 'Highest Council Tax in England 2026 — Top 20 Most Expensive',
  description: 'The highest council tax in England for 2026. See which councils charge the most expensive Band D rates — full top-20 rankings across unitary authorities, metropolitan districts, London boroughs, county and district councils. Sourced from .gov.uk.',
  alternates: {
    canonical: '/insights/most-expensive-council-tax',
  },
  openGraph: {
    title: 'Highest Council Tax in England 2026 — Top 20 Most Expensive',
    description: 'Which councils charge the highest Band D council tax in 2026? See the full rankings.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Highest Council Tax in England 2026 — Top 20 Most Expensive',
    description: 'Which councils charge the highest Band D council tax in 2026? See the full rankings.',
  },
};

import { COMPARABLE_GROUPS } from '@/lib/council-averages';
import { serializeJsonLd } from '@/lib/safe-json-ld';

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
      question: 'Which council has the highest council tax in England in 2026?',
      answer: `${expensiveName} has the highest Band D council tax in England for 2025-26 at ${formatCurrency(mostExpensive.council_tax!.band_d_2025, { decimals: 2 })}. The 2026-27 rates that took effect on 1 April 2026 push the average English Band D bill to roughly £2,392, up 4.9% on last year.`,
    },
    {
      question: 'Why do some councils charge more than others?',
      answer: "Council tax rates depend on a few things: the range of services the council runs, where the council chooses to spend its money, how much funding it gets from government, and how many homes share the bill. Councils with fewer homes, or with higher demand for services, tend to charge more per household.",
    },
    {
      question: 'Why is council tax going up in 2026?',
      answer: "Almost all English councils raised council tax by the maximum 4.99% allowed without a referendum for 2026-27. Seven councils — Bournemouth Christchurch & Poole, North Somerset, Shropshire, Trafford, Warrington, Windsor & Maidenhead, and Worcestershire — were given government permission to raise it by between 7.49% and 8.99% because of severe financial pressure, mainly from rising adult social care costs.",
    },
    {
      question: 'How are rates compared fairly between council types?',
      answer: 'Rates are grouped by council type (unitary, metropolitan district, London borough, county, district) so you compare like with like. A district bill on its own looks lower than a unitary because households in two-tier areas also pay a separate county bill.',
    },
  ];

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      buildWebPageSchema(
        'Highest Council Tax in England 2026',
        'The highest Band D council tax rates in England for 2026, grouped by council type for fair comparison.',
        '/insights/most-expensive-council-tax',
      ),
      buildArticleSchema({
        headline: 'Highest Council Tax in England 2026 — Top 20 Most Expensive',
        description: `The highest Band D council tax in England for 2025-26 is ${expensiveName} at ${formatCurrency(mostExpensive.council_tax!.band_d_2025, { decimals: 2 })}. Full top-20 ranking by council type.`,
        url: '/insights/most-expensive-council-tax',
        about: 'Council tax in England',
        keywords: ['highest council tax UK 2026', 'most expensive council tax', 'highest Band D 2026', 'council tax 2026', 'England council tax rankings'],
      }),
      buildFAQPageSchema(faqs, '/insights/most-expensive-council-tax'),
      buildBreadcrumbSchema(
        [
          { name: 'Home', url: '/' },
          { name: 'Insights', url: '/insights' },
          { name: 'Highest Council Tax 2026' },
        ],
        '/insights/most-expensive-council-tax'
      ),
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
      />
      <main id="main-content" className="flex-1 container mx-auto px-4 max-w-3xl py-8">
        <Breadcrumb items={[
          { label: 'Home', href: '/' },
          { label: 'Insights', href: '/insights' },
          { label: 'Highest Council Tax 2026' },
        ]} />

        <h1 className="type-title-1 mb-2">Highest Council Tax in England 2026</h1>
        <p className="type-body-sm text-muted-foreground mb-8">
          The highest Band D council tax in England for 2025-26 is {expensiveName} at {formatCurrency(mostExpensive.council_tax!.band_d_2025, { decimals: 2 })}.
          For 2026-27, almost all English councils raised council tax by the maximum 4.99% allowed without a referendum, and seven councils were given government permission to raise it further (up to 8.99%).
          Rates below are grouped by council type so you compare like with like — a district bill on its own looks lower than a unitary because households in two-tier areas also pay a separate county bill.
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
