import type { Metadata } from 'next';
import Link from 'next/link';
import {
  councils,
  formatCurrency,
  getAreaBandD,
  getCouncilDisplayName,
  getCouncilSlug,
} from '@/data/councils';
import { RankedBarList, RankedBarRow } from '@/components/insights/RankedBarRow';
import { buildFAQPageSchema, buildBreadcrumbSchema, buildArticleSchema, buildWebPageSchema } from '@/lib/structured-data';
import { COMPARABLE_GROUPS } from '@/lib/council-averages';
import { getAreaTaxRises, getAverageAreaTaxRise, getAreaRisesAtOrOverPct } from '@/lib/insights-stats';
import Breadcrumb from '@/components/proposals/Breadcrumb';
import { serializeJsonLd } from '@/lib/safe-json-ld';

export const metadata: Metadata = {
  title: 'Compare Council Tax UK 2026 — National + Regional Breakdown',
  description: 'Compare council tax across England for 2026-27. National average Band D, medians by council type, biggest rises, highest and lowest councils — all 296 English billing authorities, sourced from .gov.uk.',
  alternates: {
    canonical: '/insights/compare-council-tax-2026',
  },
  openGraph: {
    title: 'Compare Council Tax UK 2026 — National + Regional Breakdown',
    description: 'How does council tax compare across England in 2026-27? National + regional medians, biggest rises, full rankings.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Compare Council Tax UK 2026 — National + Regional Breakdown',
    description: 'How does council tax compare across England in 2026-27? National + regional medians, biggest rises, full rankings.',
  },
};

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

export default function CompareCouncilTax2026Page() {
  // 2026-27 area Band D — the full bill for the area. Billing authorities
  // only (296): county councils are not billing authorities and have no
  // 2026-27 figure yet, so they appear only in the by-type section below,
  // clearly labelled 2025-26.
  const billing = councils.filter((c) => typeof c.council_tax?.band_d_2026 === 'number');
  const bandDValues = billing.map((c) => c.council_tax!.band_d_2026!);

  const nationalAvg = bandDValues.reduce((s, v) => s + v, 0) / bandDValues.length;
  const nationalMedian = median(bandDValues);
  const nationalMin = Math.min(...bandDValues);
  const nationalMax = Math.max(...bandDValues);

  const cheapest = billing.reduce((min, c) =>
    c.council_tax!.band_d_2026! < min.council_tax!.band_d_2026! ? c : min,
  );
  const mostExpensive = billing.reduce((max, c) =>
    c.council_tax!.band_d_2026! > max.council_tax!.band_d_2026! ? c : max,
  );

  // Rises: 2025-26 → 2026-27, plus last year's average on the same councils
  // so the year-on-year comparison is computed, not hand-typed.
  const avgRise = getAverageAreaTaxRise();
  const overCapCount = getAreaRisesAtOrOverPct(4.99);
  const withLastYear = billing.filter((c) => c.council_tax?.band_d_2025 && c.council_tax?.band_d_2024);
  const lastYearAvgRise = withLastYear.length > 0
    ? withLastYear.reduce((s, c) => s + ((c.council_tax!.band_d_2025 - c.council_tax!.band_d_2024!) / c.council_tax!.band_d_2024!) * 100, 0) / withLastYear.length
    : 0;

  // Median Band D per comparable group — year-aware: billing types show
  // 2026-27, county councils show their own 2025-26 share.
  const groupBreakdown = COMPARABLE_GROUPS.map((group) => {
    const types = group.types as readonly string[];
    const peers = councils
      .filter((c) => types.includes(c.type))
      .map((c) => getAreaBandD(c))
      .filter((a): a is NonNullable<typeof a> => a !== null);
    if (peers.length === 0) return null;
    const peerValues = peers.map((a) => a.value);
    return {
      label: group.label,
      description: group.description,
      median: median(peerValues),
      avg: peerValues.reduce((s, v) => s + v, 0) / peerValues.length,
      min: Math.min(...peerValues),
      max: Math.max(...peerValues),
      count: peers.length,
      year: peers[0].year,
    };
  }).filter((g): g is NonNullable<typeof g> => g !== null);

  const top10Highest = [...billing]
    .sort((a, b) => b.council_tax!.band_d_2026! - a.council_tax!.band_d_2026!)
    .slice(0, 10);
  const top10Lowest = [...billing]
    .sort((a, b) => a.council_tax!.band_d_2026! - b.council_tax!.band_d_2026!)
    .slice(0, 10);
  const top10Rises = getAreaTaxRises(10);

  const faqs = [
    {
      question: 'What is the average council tax in England for 2026-27?',
      answer: `For 2026-27 (effective April 2026), the average Band D council tax across England's ${billing.length} billing authorities is ${formatCurrency(nationalAvg, { decimals: 0 })} — up ${avgRise.toFixed(1)}% on last year, compared with a ${lastYearAvgRise.toFixed(1)}% average rise the year before.`,
    },
    {
      question: 'How do you compare council tax fairly between councils?',
      answer: 'Compare Band D bills within the same council type. For billing authorities — unitary, metropolitan, London borough and district councils — the figure is the full Band D bill for the area, including any county, police and fire shares. County councils only show their own share, so they are compared separately.',
    },
    {
      question: 'Why are some councils raising council tax by more than 5% in 2026-27?',
      answer: `5% (technically 4.99%) is the most a council can normally add to its own share without holding a local referendum — councils in severe financial difficulty can get government permission to go higher. In ${overCapCount} of ${billing.length} billing areas the whole 2026-27 Band D bill rose by 4.99% or more; the biggest area rise was ${getCouncilDisplayName(top10Rises[0].council)} at ${top10Rises[0].changePct.toFixed(1)}%.`,
    },
    {
      question: 'Which English council charges the most council tax?',
      answer: `${getCouncilDisplayName(mostExpensive)} has the highest Band D council tax in England for 2026-27 at ${formatCurrency(mostExpensive.council_tax!.band_d_2026!, { decimals: 2 })}.`,
    },
    {
      question: 'Which English council charges the least council tax?',
      answer: `${getCouncilDisplayName(cheapest)} has the lowest Band D council tax in England for 2026-27 at ${formatCurrency(cheapest.council_tax!.band_d_2026!, { decimals: 2 })}.`,
    },
    {
      question: 'How much does the average household pay in council tax?',
      answer: `Most homes are in bands A to C, which are charged less than Band D — so the typical household pays less than the average Band D figure of ${formatCurrency(nationalAvg, { decimals: 0 })}. CivAccount shows your specific bill once you select your council.`,
    },
  ];

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      buildWebPageSchema(
        'Compare Council Tax UK 2026 — National + Regional Breakdown',
        'National average Band D, medians by council type, biggest rises, and full England rankings for council tax in 2026-27.',
        '/insights/compare-council-tax-2026',
      ),
      buildArticleSchema({
        headline: 'Compare Council Tax UK 2026 — National + Regional Breakdown',
        description: `The national average Band D council tax in England for 2026-27 is ${formatCurrency(nationalAvg, { decimals: 0 })}, up ${avgRise.toFixed(1)}% on last year across ${billing.length} billing authorities.`,
        url: '/insights/compare-council-tax-2026',
        about: 'Council tax in England',
        keywords: ['compare council tax UK 2026', 'council tax UK 2026', 'England council tax comparison', 'Band D 2026-27', 'council tax average 2026'],
      }),
      buildFAQPageSchema(faqs, '/insights/compare-council-tax-2026'),
      buildBreadcrumbSchema(
        [
          { name: 'Home', url: '/' },
          { name: 'Insights', url: '/insights' },
          { name: 'Compare Council Tax 2026' },
        ],
        '/insights/compare-council-tax-2026',
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
          { label: 'Compare Council Tax 2026' },
        ]} />

        <h1 className="type-title-1 mb-2">Compare Council Tax in England 2026-27</h1>
        <p className="type-body-sm text-muted-foreground mb-8">
          The average Band D council tax across England&apos;s {billing.length} billing authorities for 2026-27 is {formatCurrency(nationalAvg, { decimals: 0 })} —
          up {avgRise.toFixed(1)}% on last year, compared with a {lastYearAvgRise.toFixed(1)}% average rise the year before.
          The highest is {getCouncilDisplayName(mostExpensive)} at {formatCurrency(mostExpensive.council_tax!.band_d_2026!, { decimals: 2 })};
          the lowest is {getCouncilDisplayName(cheapest)} at {formatCurrency(cheapest.council_tax!.band_d_2026!, { decimals: 2 })}.
        </p>

        {/* Section 1: National stats */}
        <section className="card-elevated p-5 sm:p-6 mb-5">
          <h2 className="type-title-2 mb-1">England-wide stats 2026-27</h2>
          <p className="type-body-sm text-muted-foreground mb-6">
            All {billing.length} billing authorities with a published 2026-27 Band D bill. County councils are not billing authorities, so they are not counted here.
          </p>

          <dl className="grid grid-cols-2 gap-x-6 gap-y-4">
            <div>
              <dt className="type-caption text-muted-foreground">Average Band D</dt>
              <dd className="type-metric font-semibold tabular-nums">{formatCurrency(nationalAvg, { decimals: 0 })}</dd>
            </div>
            <div>
              <dt className="type-caption text-muted-foreground">Median Band D</dt>
              <dd className="type-metric font-semibold tabular-nums">{formatCurrency(nationalMedian, { decimals: 0 })}</dd>
            </div>
            <div>
              <dt className="type-caption text-muted-foreground">Lowest Band D</dt>
              <dd className="type-metric font-semibold tabular-nums">{formatCurrency(nationalMin, { decimals: 0 })}</dd>
            </div>
            <div>
              <dt className="type-caption text-muted-foreground">Highest Band D</dt>
              <dd className="type-metric font-semibold tabular-nums">{formatCurrency(nationalMax, { decimals: 0 })}</dd>
            </div>
            <div>
              <dt className="type-caption text-muted-foreground">Average rise from 2025-26</dt>
              <dd className="type-metric font-semibold tabular-nums">+{avgRise.toFixed(1)}%</dd>
            </div>
            <div>
              <dt className="type-caption text-muted-foreground">Areas where the bill rose 4.99% or more</dt>
              <dd className="type-metric font-semibold tabular-nums">{overCapCount}</dd>
            </div>
          </dl>
        </section>

        {/* Section 2: Group medians */}
        <section className="card-elevated p-5 sm:p-6 mb-5">
          <h2 className="type-title-2 mb-1">Median Band D by council type</h2>
          <p className="type-body-sm text-muted-foreground mb-6">
            Compare like with like — different council types do different jobs. County councils show their own 2025-26 share, the latest published; everything else is the full 2026-27 area bill.
          </p>

          <RankedBarList>
            {groupBreakdown.map((group) => (
              <RankedBarRow
                key={group.label}
                title={group.label}
                value={formatCurrency(group.median, { decimals: 0 })}
                subLeft={`${group.description} · ${group.year}`}
                subRight={`${group.count} councils`}
                fillPct={Math.max(...groupBreakdown.map((g) => g.median)) > 0 ? (group.median / Math.max(...groupBreakdown.map((g) => g.median))) * 100 : 0}
              />
            ))}
          </RankedBarList>
        </section>

        {/* Section 3: Top 10 highest */}
        <section className="card-elevated p-5 sm:p-6 mb-5">
          <h2 className="type-title-2 mb-1">Top 10 highest council tax 2026-27</h2>
          <p className="type-body-sm text-muted-foreground mb-6">
            Across all billing authorities. <Link href="/insights/most-expensive-council-tax" className="text-foreground hover:underline">See full top 20 by type →</Link>
          </p>

          <RankedBarList>
            {top10Highest.map((council, index) => {
              const bandD = council.council_tax!.band_d_2026!;
              const max = top10Highest[0].council_tax!.band_d_2026!;
              return (
                <RankedBarRow
                  key={council.ons_code}
                  rank={index + 1}
                  title={getCouncilDisplayName(council)}
                  href={`/council/${getCouncilSlug(council)}`}
                  value={formatCurrency(bandD, { decimals: 2 })}
                  subLeft={council.type_name}
                  fillPct={max > 0 ? (bandD / max) * 100 : 0}
                />
              );
            })}
          </RankedBarList>
        </section>

        {/* Section 4: Top 10 lowest */}
        <section className="card-elevated p-5 sm:p-6 mb-5">
          <h2 className="type-title-2 mb-1">Top 10 lowest council tax 2026-27</h2>
          <p className="type-body-sm text-muted-foreground mb-6">
            Across all billing authorities. <Link href="/insights/cheapest-council-tax" className="text-foreground hover:underline">See full top 20 by type →</Link>
          </p>

          <RankedBarList>
            {top10Lowest.map((council, index) => {
              const bandD = council.council_tax!.band_d_2026!;
              const max = top10Lowest[top10Lowest.length - 1].council_tax!.band_d_2026!;
              return (
                <RankedBarRow
                  key={council.ons_code}
                  rank={index + 1}
                  title={getCouncilDisplayName(council)}
                  href={`/council/${getCouncilSlug(council)}`}
                  value={formatCurrency(bandD, { decimals: 2 })}
                  subLeft={council.type_name}
                  fillPct={max > 0 ? (bandD / max) * 100 : 0}
                />
              );
            })}
          </RankedBarList>
        </section>

        {/* Section 5: Biggest rises */}
        <section className="card-elevated p-5 sm:p-6 mb-5">
          <h2 className="type-title-2 mb-1">Biggest tax rises 2026-27</h2>
          <p className="type-body-sm text-muted-foreground mb-6">
            Top 10 areas where the Band D bill rose the most from 2025-26 to 2026-27.
          </p>

          <RankedBarList>
            {top10Rises.map((entry, index) => {
              const max = top10Rises[0]?.changePct ?? 1;
              return (
                <RankedBarRow
                  key={entry.council.ons_code}
                  rank={index + 1}
                  title={getCouncilDisplayName(entry.council)}
                  href={`/council/${getCouncilSlug(entry.council)}`}
                  value={`+${entry.changePct.toFixed(1)}%`}
                  subLeft={entry.council.type_name}
                  subRight={`${formatCurrency(entry.from, { decimals: 0 })} → ${formatCurrency(entry.to, { decimals: 0 })}`}
                  fillPct={max > 0 ? (entry.changePct / max) * 100 : 0}
                />
              );
            })}
          </RankedBarList>
        </section>

        {/* Section 6: Compare your council CTA */}
        <section className="card-elevated p-5 sm:p-6 mb-5">
          <h2 className="type-title-2 mb-1">Compare your council to any other</h2>
          <p className="type-body-sm text-muted-foreground mb-6">
            Pick up to 5 councils side by side: Band D, total bill, budget breakdowns, CEO pay, suppliers.
          </p>
          <Link
            href="/compare"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-foreground text-background type-body-sm font-semibold hover:bg-foreground/90 transition-colors"
          >
            Open the comparison tool
          </Link>
        </section>

        {/* Section 7: FAQ */}
        <section className="card-elevated p-5 sm:p-6 mb-5">
          <h2 className="type-title-2 mb-1">Council tax 2026-27 FAQ</h2>
          <p className="type-body-sm text-muted-foreground mb-6">Common questions about how council tax compares across England.</p>

          <div className="space-y-5">
            {faqs.map((faq) => (
              <div key={faq.question}>
                <h3 className="type-body font-semibold mb-2">{faq.question}</h3>
                <p className="type-body-sm text-muted-foreground">{faq.answer}</p>
              </div>
            ))}
          </div>
        </section>

        <nav className="mt-8 space-y-2">
          <p className="type-body-sm font-semibold mb-3">More insights</p>
          <ul className="space-y-2">
            <li><Link href="/insights/most-expensive-council-tax" className="type-body-sm text-muted-foreground hover:text-foreground transition-colors">Highest council tax 2026-27</Link></li>
            <li><Link href="/insights/cheapest-council-tax" className="type-body-sm text-muted-foreground hover:text-foreground transition-colors">Lowest council tax 2026-27</Link></li>
            <li><Link href="/insights/council-tax-increases" className="type-body-sm text-muted-foreground hover:text-foreground transition-colors">Council tax increases 2026-27</Link></li>
            <li><Link href="/guide/council-tax" className="type-body-sm text-muted-foreground hover:text-foreground transition-colors">Complete guide to council tax</Link></li>
            <li><Link href="/insights" className="type-body-sm text-muted-foreground hover:text-foreground transition-colors">All insights</Link></li>
          </ul>
        </nav>
      </main>
    </>
  );
}
