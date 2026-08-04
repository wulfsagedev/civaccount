import type { Metadata } from 'next';
import Link from 'next/link';
import {
  councils,
  formatCurrency,
  getAreaBandD,
  getCouncilDisplayName,
  getCouncilSlug,
  CURRENT_TAX_YEAR,
  PREVIOUS_TAX_YEAR,
} from '@/data/councils';
import { RankedBarList, RankedBarRow } from '@/components/insights/RankedBarRow';
import { getAreaBillStats, getAreaTaxRises, getAverageAreaTaxRise, getAreaRisesAtOrOverPct } from '@/lib/insights-stats';
import { buildFAQPageSchema, buildBreadcrumbSchema, buildArticleSchema, buildWebPageSchema } from '@/lib/structured-data';
import Breadcrumb from '@/components/proposals/Breadcrumb';

export const metadata: Metadata = {
  title: 'Highest Council Tax in England 2026-27 — Top 20 Most Expensive',
  description: 'The highest council tax in England for 2026-27. See which councils charge the most expensive Band D rates — full top-20 rankings across unitary authorities, metropolitan districts, London boroughs, county and district councils. Sourced from .gov.uk.',
  alternates: {
    canonical: '/insights/most-expensive-council-tax',
  },
  openGraph: {
    title: 'Highest Council Tax in England 2026-27 — Top 20 Most Expensive',
    description: 'Which councils charge the highest Band D council tax in 2026-27? See the full rankings.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Highest Council Tax in England 2026-27 — Top 20 Most Expensive',
    description: 'Which councils charge the highest Band D council tax in 2026-27? See the full rankings.',
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
  // Most recent verified area Band D per council: 2026-27 for the 296 billing
  // authorities, 2025-26 (own share) for the 21 county councils.
  const councilsWithArea = councils
    .map((c) => ({ council: c, area: getAreaBandD(c) }))
    .filter((e): e is { council: typeof councils[0]; area: NonNullable<ReturnType<typeof getAreaBandD>> } => e.area !== null);

  // Overall most expensive — billing authorities only, so the headline claim
  // is a clean 2026-27 comparison of full area bills.
  const billing = councilsWithArea.filter((e) => e.area.year === CURRENT_TAX_YEAR);
  const mostExpensive = billing.reduce((max, e) => (e.area.value > max.area.value ? e : max));
  const expensiveName = getCouncilDisplayName(mostExpensive.council);

  const areaStats = getAreaBillStats();
  const avgRise = getAverageAreaTaxRise();
  const risesAtOrOverCap = getAreaRisesAtOrOverPct(4.99);
  const biggestRise = getAreaTaxRises(1)[0];

  const faqs = [
    {
      question: 'Which council has the highest council tax in England in 2026-27?',
      answer: `${expensiveName} has the highest Band D council tax in England for 2026-27 at ${formatCurrency(mostExpensive.area.value, { decimals: 2 })}. The average 2026-27 Band D bill across England's ${areaStats.count} billing authorities is ${formatCurrency(areaStats.avg, { decimals: 0 })}, up ${avgRise.toFixed(1)}% on last year.`,
    },
    {
      question: 'Why do some councils charge more than others?',
      answer: "Council tax rates depend on a few things: the range of services the council runs, where the council chooses to spend its money, how much funding it gets from government, and how many homes share the bill. Councils with fewer homes, or with higher demand for services, tend to charge more per household.",
    },
    {
      question: 'Why is council tax going up in 2026-27?',
      answer: `Most billing-authority areas saw the Band D bill rise by close to 5% for 2026-27 — in ${risesAtOrOverCap} of ${areaStats.count} areas the whole bill went up by 4.99% or more, and the biggest area rise was ${getCouncilDisplayName(biggestRise.council)} at ${biggestRise.changePct.toFixed(1)}%. Councils that want to raise their own share above the government's cap need permission from government or a local referendum — rising adult social care costs are the most common reason.`,
    },
    {
      question: 'How are rates compared fairly between council types?',
      answer: 'Rates are grouped by council type (unitary, metropolitan district, London borough, county, district) so you compare like with like. For billing authorities the figure is the full Band D bill for the area, including any county, police and fire shares. County councils show only their own share.',
    },
  ];

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      buildWebPageSchema(
        'Highest Council Tax in England 2026-27',
        'The highest Band D council tax rates in England for 2026-27, grouped by council type for fair comparison.',
        '/insights/most-expensive-council-tax',
      ),
      buildArticleSchema({
        headline: 'Highest Council Tax in England 2026-27 — Top 20 Most Expensive',
        description: `The highest Band D council tax in England for 2026-27 is ${expensiveName} at ${formatCurrency(mostExpensive.area.value, { decimals: 2 })}. Full top-20 ranking by council type.`,
        url: '/insights/most-expensive-council-tax',
        about: 'Council tax in England',
        keywords: ['highest council tax UK 2026', 'most expensive council tax', 'highest Band D 2026-27', 'council tax 2026-27', 'England council tax rankings'],
      }),
      buildFAQPageSchema(faqs, '/insights/most-expensive-council-tax'),
      buildBreadcrumbSchema(
        [
          { name: 'Home', url: '/' },
          { name: 'Insights', url: '/insights' },
          { name: 'Highest Council Tax 2026-27' },
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
          { label: 'Highest Council Tax 2026-27' },
        ]} />

        <h1 className="type-title-1 mb-2">Highest Council Tax in England 2026-27</h1>
        <p className="type-body-sm text-muted-foreground mb-8">
          The highest Band D council tax in England for 2026-27 is {expensiveName} at {formatCurrency(mostExpensive.area.value, { decimals: 2 })}.
          The average 2026-27 rise across billing authorities was {avgRise.toFixed(1)}%, and in {risesAtOrOverCap} of {areaStats.count} areas the whole Band D bill went up by 4.99% or more.
          Figures for unitary, metropolitan, London borough and district councils are the full Band D bill for the area, including any county, police and fire shares.
          County councils show only their own 2025-26 share — they do not send the bill, and their 2026-27 share is not yet published.
        </p>

        {GROUPS.map((group) => {
          const groupCouncils = councilsWithArea
            .filter((e) => group.types.includes(e.council.type))
            .sort((a, b) => b.area.value - a.area.value)
            .slice(0, 20);

          if (groupCouncils.length === 0) return null;

          const groupYear = groupCouncils[0].area.year;
          const maxBandD = groupCouncils[0].area.value;
          const yearNote = groupYear === CURRENT_TAX_YEAR
            ? `${CURRENT_TAX_YEAR} · full Band D bill for the area`
            : `${PREVIOUS_TAX_YEAR} · the county's own share of the bill (2026-27 not yet published)`;

          return (
            <section key={group.label} className="card-elevated p-5 sm:p-6 mb-5">
              <h2 className="type-title-2 mb-1">{group.label}</h2>
              <p className="type-body-sm text-muted-foreground mb-6">{group.subtitle} · {yearNote}</p>

              <RankedBarList>
                {groupCouncils.map((entry, index) => (
                  <RankedBarRow
                    key={entry.council.ons_code}
                    rank={index + 1}
                    title={getCouncilDisplayName(entry.council)}
                    href={`/council/${getCouncilSlug(entry.council)}`}
                    value={formatCurrency(entry.area.value, { decimals: 2 })}
                    subLeft={entry.council.type_name}
                    subRight={entry.area.year}
                    fillPct={maxBandD > 0 ? (entry.area.value / maxBandD) * 100 : 0}
                  />
                ))}
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
