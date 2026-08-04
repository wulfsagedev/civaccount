import type { Metadata } from 'next';
import Link from 'next/link';
import { councils, formatCurrency, getCouncilDisplayName, getCouncilSlug } from '@/data/councils';
import { RankedBarList, RankedBarRow } from '@/components/insights/RankedBarRow';
import { buildFAQPageSchema, buildBreadcrumbSchema, buildArticleSchema, buildWebPageSchema } from '@/lib/structured-data';
import Breadcrumb from '@/components/proposals/Breadcrumb';
import { serializeJsonLd } from '@/lib/safe-json-ld';

export const metadata: Metadata = {
  title: 'Council Tax Increases 2026-27 — Year-on-Year Changes',
  description: 'See which councils had the biggest and smallest council tax increases in 2026-27. Compare year-on-year Band D bill changes across all 296 English billing authorities.',
  alternates: {
    canonical: '/insights/council-tax-increases',
  },
  openGraph: {
    title: 'Council Tax Increases 2026-27',
    description: 'Which councils raised council tax the most in 2026-27? See the year-on-year changes.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Council Tax Increases 2026-27',
    description: 'Which councils raised council tax the most in 2026-27? See the year-on-year changes.',
  },
};

export default function CouncilTaxIncreasesPage() {
  // 2025-26 → 2026-27 change in the area Band D bill. Billing authorities
  // only (296) — county councils are not billing authorities and have no
  // published 2026-27 figure yet.
  const councilsWithChange = councils
    .filter((c) => c.council_tax?.band_d_2026 && c.council_tax?.band_d_2025)
    .map((c) => {
      const bandD2026 = c.council_tax!.band_d_2026!;
      const bandD2025 = c.council_tax!.band_d_2025;
      const changeAmount = bandD2026 - bandD2025;
      const changePercent = ((changeAmount) / bandD2025) * 100;
      return { council: c, changeAmount, changePercent };
    });

  const avgChange = councilsWithChange.reduce((sum, c) => sum + c.changePercent, 0) / councilsWithChange.length;

  // Biggest increases (top 20)
  const biggestIncreases = [...councilsWithChange]
    .sort((a, b) => b.changePercent - a.changePercent)
    .slice(0, 20);

  // Smallest increases / decreases (bottom 20)
  const smallestIncreases = [...councilsWithChange]
    .sort((a, b) => a.changePercent - b.changePercent)
    .slice(0, 20);

  // Fixture mode (3 sample councils) and any future year where the new Band D
  // table hasn't landed both produce an empty set. Bail to a plain notice
  // rather than indexing into nothing — an empty dataset must never break the
  // build, because fixtures are the documented fallback when the private data
  // repo isn't reachable.
  if (biggestIncreases.length === 0) {
    return (
      <main id="main-content" className="flex-1 container mx-auto px-4 max-w-3xl py-8">
        <Breadcrumb items={[
          { label: 'Home', href: '/' },
          { label: 'Insights', href: '/insights' },
          { label: 'Council Tax Increases' },
        ]} />
        <h1 className="type-title-1 mb-2">Council Tax Increases</h1>
        <p className="type-body-sm text-muted-foreground">
          Year-on-year rises aren&apos;t available for this dataset yet. They
          publish once the new Band D figures are released for every billing
          authority.
        </p>
      </main>
    );
  }

  const biggestName = getCouncilDisplayName(biggestIncreases[0].council);

  const faqs = [
    {
      question: 'How much did council tax go up on average in 2026-27?',
      answer: `The Band D bill went up by an average of ${avgChange.toFixed(1)}% in 2026-27 across England's ${councilsWithChange.length} billing authorities.`,
    },
    {
      question: 'Which council had the biggest council tax rise in 2026-27?',
      answer: `${biggestName} had the biggest rise — ${biggestIncreases[0].changePercent.toFixed(1)}% (${formatCurrency(biggestIncreases[0].changeAmount, { decimals: 2 })} more than last year).`,
    },
  ];

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      buildWebPageSchema(
        'Council Tax Increases 2026-27 — Year-on-Year Changes',
        'Year-on-year Band D council tax changes for every English billing authority in 2026-27.',
        '/insights/council-tax-increases',
      ),
      buildArticleSchema({
        headline: 'Council Tax Increases 2026-27 — Year-on-Year Changes',
        description: `Council tax went up by an average of ${avgChange.toFixed(1)}% in 2026-27. ${biggestName} had the biggest rise at ${biggestIncreases[0].changePercent.toFixed(1)}%.`,
        url: '/insights/council-tax-increases',
        about: 'Council tax increases in England',
        keywords: ['council tax increase', 'Band D rise', 'council tax 2026-27', 'year-on-year change'],
      }),
      buildFAQPageSchema(faqs, '/insights/council-tax-increases'),
      buildBreadcrumbSchema(
        [
          { name: 'Home', url: '/' },
          { name: 'Insights', url: '/insights' },
          { name: 'Council Tax Increases' },
        ],
        '/insights/council-tax-increases'
      ),
    ],
  };

  const maxIncrease = biggestIncreases[0].changePercent;

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
          { label: 'Council Tax Increases' },
        ]} />

        <h1 className="type-title-1 mb-2">Council Tax Increases 2026-27</h1>
        <p className="type-body-sm text-muted-foreground mb-8">
          The Band D council tax bill in England rose by an average of {avgChange.toFixed(1)}% from 2025-26 to 2026-27.
          The biggest rise was {biggestName} at {biggestIncreases[0].changePercent.toFixed(1)}%.
          The smallest change was {getCouncilDisplayName(smallestIncreases[0].council)} at {smallestIncreases[0].changePercent.toFixed(1)}%.
          Figures cover the {councilsWithChange.length} billing authorities that send the bill — county councils are not included because their 2026-27 share is not yet published.
        </p>

        <section className="card-elevated p-5 sm:p-6 mb-5">
          <h2 className="type-title-2 mb-1">Biggest rises</h2>
          <p className="type-body-sm text-muted-foreground mb-6">The 20 councils with the largest rises from 2025-26 to 2026-27</p>

          <RankedBarList>
            {biggestIncreases.map((item, index) => (
              <RankedBarRow
                key={item.council.ons_code}
                rank={index + 1}
                title={getCouncilDisplayName(item.council)}
                href={`/council/${getCouncilSlug(item.council)}`}
                value={`+${item.changePercent.toFixed(1)}%`}
                subLeft={`${formatCurrency(item.council.council_tax!.band_d_2025, { decimals: 2 })} → ${formatCurrency(item.council.council_tax!.band_d_2026!, { decimals: 2 })}`}
                subRight={`+${formatCurrency(item.changeAmount, { decimals: 2 })}`}
                fillPct={maxIncrease > 0 ? (item.changePercent / maxIncrease) * 100 : 0}
              />
            ))}
          </RankedBarList>
        </section>

        <section className="card-elevated p-5 sm:p-6 mb-5">
          <h2 className="type-title-2 mb-1">Smallest changes</h2>
          <p className="type-body-sm text-muted-foreground mb-6">The 20 councils with the smallest changes from 2025-26 to 2026-27</p>

          <RankedBarList>
            {smallestIncreases.map((item, index) => (
              <RankedBarRow
                key={item.council.ons_code}
                rank={index + 1}
                title={getCouncilDisplayName(item.council)}
                href={`/council/${getCouncilSlug(item.council)}`}
                value={
                  <span className={item.changePercent <= 0 ? 'text-positive' : 'text-negative'}>
                    {item.changePercent > 0 ? '+' : ''}{item.changePercent.toFixed(1)}%
                  </span>
                }
                subLeft={`${formatCurrency(item.council.council_tax!.band_d_2025, { decimals: 2 })} → ${formatCurrency(item.council.council_tax!.band_d_2026!, { decimals: 2 })}`}
                subRight={`${item.changeAmount >= 0 ? '+' : ''}${formatCurrency(item.changeAmount, { decimals: 2 })}`}
              />
            ))}
          </RankedBarList>
        </section>

        <nav className="mt-8 space-y-2">
          <p className="type-body-sm font-semibold mb-3">More insights</p>
          <ul className="space-y-2">
            <li><Link href="/insights/cheapest-council-tax" className="type-body-sm text-muted-foreground hover:text-foreground transition-colors">Cheapest council tax</Link></li>
            <li><Link href="/insights/most-expensive-council-tax" className="type-body-sm text-muted-foreground hover:text-foreground transition-colors">Most expensive council tax</Link></li>
            <li><Link href="/insights/council-ceo-salaries" className="type-body-sm text-muted-foreground hover:text-foreground transition-colors">Council CEO salaries</Link></li>
            <li><Link href="/insights" className="type-body-sm text-muted-foreground hover:text-foreground transition-colors">All insights</Link></li>
          </ul>
        </nav>
      </main>
      </>
  );
}
