import type { Metadata } from 'next';
import Link from 'next/link';
import { councils, formatCurrency, getCouncilDisplayName, getCouncilSlug } from '@/data/councils';
import { RankedBarList, RankedBarRow } from '@/components/insights/RankedBarRow';
import { buildFAQPageSchema, buildBreadcrumbSchema, buildArticleSchema, buildWebPageSchema } from '@/lib/structured-data';
import { COMPARABLE_GROUPS } from '@/lib/council-averages';
import { getBiggestTaxRises, getAverageTaxRise, getCouncilsAtOrOverCap } from '@/lib/insights-stats';
import Breadcrumb from '@/components/proposals/Breadcrumb';
import { serializeJsonLd } from '@/lib/safe-json-ld';

export const metadata: Metadata = {
  title: 'Compare Council Tax UK 2026 — National + Regional Breakdown',
  description: 'Compare council tax across England for 2026. National average Band D, regional medians, biggest rises, highest and lowest councils — all 317 English councils, sourced from .gov.uk.',
  alternates: {
    canonical: '/insights/compare-council-tax-2026',
  },
  openGraph: {
    title: 'Compare Council Tax UK 2026 — National + Regional Breakdown',
    description: 'How does council tax compare across England in 2026? National + regional medians, biggest rises, full rankings.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Compare Council Tax UK 2026 — National + Regional Breakdown',
    description: 'How does council tax compare across England in 2026? National + regional medians, biggest rises, full rankings.',
  },
};

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

export default function CompareCouncilTax2026Page() {
  const councilsWithTax = councils.filter((c) => c.council_tax?.band_d_2025);
  const bandDValues = councilsWithTax.map((c) => c.council_tax!.band_d_2025);

  const nationalAvg = bandDValues.reduce((s, v) => s + v, 0) / bandDValues.length;
  const nationalMedian = median(bandDValues);
  const nationalMin = Math.min(...bandDValues);
  const nationalMax = Math.max(...bandDValues);

  const cheapest = councilsWithTax.reduce((min, c) =>
    c.council_tax!.band_d_2025 < min.council_tax!.band_d_2025 ? c : min,
  );
  const mostExpensive = councilsWithTax.reduce((max, c) =>
    c.council_tax!.band_d_2025 > max.council_tax!.band_d_2025 ? c : max,
  );

  const avgRise = getAverageTaxRise();
  const overCapCount = getCouncilsAtOrOverCap(4.99);

  // Regional breakdown — median Band D per comparable group
  const groupBreakdown = COMPARABLE_GROUPS.map((group) => {
    const types = group.types as readonly string[];
    const peers = councilsWithTax.filter((c) => types.includes(c.type));
    if (peers.length === 0) return null;
    const peerValues = peers.map((c) => c.council_tax!.band_d_2025);
    return {
      label: group.label,
      description: group.description,
      median: median(peerValues),
      avg: peerValues.reduce((s, v) => s + v, 0) / peerValues.length,
      min: Math.min(...peerValues),
      max: Math.max(...peerValues),
      count: peers.length,
    };
  }).filter((g): g is NonNullable<typeof g> => g !== null);

  const top10Highest = [...councilsWithTax]
    .sort((a, b) => b.council_tax!.band_d_2025 - a.council_tax!.band_d_2025)
    .slice(0, 10);
  const top10Lowest = [...councilsWithTax]
    .sort((a, b) => a.council_tax!.band_d_2025 - b.council_tax!.band_d_2025)
    .slice(0, 10);
  const top10Rises = getBiggestTaxRises(10);

  const faqs = [
    {
      question: 'What is the average council tax in England for 2026?',
      answer: `For 2025-26, the average Band D council tax across all 317 English councils is ${formatCurrency(nationalAvg, { decimals: 0 })}. For 2026-27 (effective April 2026), the new England-wide average rises to roughly £2,392, up 4.9% on last year — the smallest annual increase in three years.`,
    },
    {
      question: 'How do you compare council tax fairly between councils?',
      answer: 'Compare Band D rates within the same council type. Unitary authorities, metropolitan districts, and London boroughs run all services in one council. Households in two-tier areas pay two bills — one to the district, one to the county — so a district bill on its own looks much lower than a unitary bill.',
    },
    {
      question: 'Why are some councils raising council tax by more than 5% in 2026?',
      answer: '5% (technically 4.99%) is the maximum a council can raise council tax without holding a local referendum. Seven councils were given government permission to raise it further for 2026-27 because of severe financial pressure: Bournemouth Christchurch & Poole (6.74%), Trafford / Warrington / Windsor & Maidenhead (7.49% each), and North Somerset / Shropshire / Worcestershire (8.99% each).',
    },
    {
      question: 'Which English council charges the most council tax?',
      answer: `${getCouncilDisplayName(mostExpensive)} charges the highest Band D council tax in England for 2025-26 at ${formatCurrency(mostExpensive.council_tax!.band_d_2025, { decimals: 2 })}. For 2026-27, Dorset takes the top spot at around £2,765.`,
    },
    {
      question: 'Which English council charges the least council tax?',
      answer: `${getCouncilDisplayName(cheapest)} has the lowest Band D council tax in England for 2025-26 at ${formatCurrency(cheapest.council_tax!.band_d_2025, { decimals: 2 })}. For 2026-27, Wandsworth households pay the least, at around £1,028.`,
    },
    {
      question: 'How much does the average household pay in council tax?',
      answer: `Most households are below Band D. The average English household actually pays around £1,026 in council tax (across all bands), compared with the average Band D figure of ${formatCurrency(nationalAvg, { decimals: 0 })}. CivAccount shows your specific bill once you select your council.`,
    },
  ];

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      buildWebPageSchema(
        'Compare Council Tax UK 2026 — National + Regional Breakdown',
        'National average Band D, regional medians, biggest rises, and full England rankings for council tax in 2026.',
        '/insights/compare-council-tax-2026',
      ),
      buildArticleSchema({
        headline: 'Compare Council Tax UK 2026 — National + Regional Breakdown',
        description: `The national average Band D council tax in England for 2025-26 is ${formatCurrency(nationalAvg, { decimals: 0 })}. For 2026-27, almost all councils raised rates by close to the 4.99% cap — average is now £2,392.`,
        url: '/insights/compare-council-tax-2026',
        about: 'Council tax in England',
        keywords: ['compare council tax UK 2026', 'council tax UK 2026', 'England council tax comparison', 'Band D 2026', 'council tax average 2026'],
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

        <h1 className="type-title-1 mb-2">Compare Council Tax in England 2026</h1>
        <p className="type-body-sm text-muted-foreground mb-8">
          The average Band D council tax across all 317 English councils for 2025-26 is {formatCurrency(nationalAvg, { decimals: 0 })}.
          For 2026-27 (effective April 2026), the average rises to roughly £2,392 — up 4.9% on last year, the smallest annual rise in three years.
          The highest is {getCouncilDisplayName(mostExpensive)} at {formatCurrency(mostExpensive.council_tax!.band_d_2025, { decimals: 2 })};
          the lowest is {getCouncilDisplayName(cheapest)} at {formatCurrency(cheapest.council_tax!.band_d_2025, { decimals: 2 })}.
        </p>

        {/* Section 1: National stats */}
        <section className="card-elevated p-5 sm:p-6 mb-5">
          <h2 className="type-title-2 mb-1">England-wide stats 2025-26</h2>
          <p className="type-body-sm text-muted-foreground mb-6">All 317 English councils with published Band D rates.</p>

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
              <dt className="type-caption text-muted-foreground">Average YoY rise</dt>
              <dd className="type-metric font-semibold tabular-nums">+{avgRise.toFixed(1)}%</dd>
            </div>
            <div>
              <dt className="type-caption text-muted-foreground">Councils at or over the 4.99% cap</dt>
              <dd className="type-metric font-semibold tabular-nums">{overCapCount}</dd>
            </div>
          </dl>
        </section>

        {/* Section 2: Group medians */}
        <section className="card-elevated p-5 sm:p-6 mb-5">
          <h2 className="type-title-2 mb-1">Median Band D by council type</h2>
          <p className="type-body-sm text-muted-foreground mb-6">Compare like with like — different council types do different jobs.</p>

          <RankedBarList>
            {groupBreakdown.map((group) => (
              <RankedBarRow
                key={group.label}
                title={group.label}
                value={formatCurrency(group.median, { decimals: 0 })}
                subLeft={group.description}
                subRight={`${group.count} councils`}
                fillPct={Math.max(...groupBreakdown.map((g) => g.median)) > 0 ? (group.median / Math.max(...groupBreakdown.map((g) => g.median))) * 100 : 0}
              />
            ))}
          </RankedBarList>
        </section>

        {/* Section 3: Top 10 highest */}
        <section className="card-elevated p-5 sm:p-6 mb-5">
          <h2 className="type-title-2 mb-1">Top 10 highest council tax 2025-26</h2>
          <p className="type-body-sm text-muted-foreground mb-6">
            Across all council types. <Link href="/insights/most-expensive-council-tax" className="text-foreground hover:underline">See full top 20 by type →</Link>
          </p>

          <RankedBarList>
            {top10Highest.map((council, index) => {
              const bandD = council.council_tax!.band_d_2025;
              const max = top10Highest[0].council_tax!.band_d_2025;
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
          <h2 className="type-title-2 mb-1">Top 10 lowest council tax 2025-26</h2>
          <p className="type-body-sm text-muted-foreground mb-6">
            Across all council types. <Link href="/insights/cheapest-council-tax" className="text-foreground hover:underline">See full top 20 by type →</Link>
          </p>

          <RankedBarList>
            {top10Lowest.map((council, index) => {
              const bandD = council.council_tax!.band_d_2025;
              const max = top10Lowest[top10Lowest.length - 1].council_tax!.band_d_2025;
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
          <h2 className="type-title-2 mb-1">Biggest tax rises 2025-26</h2>
          <p className="type-body-sm text-muted-foreground mb-6">
            Top 10 councils that raised Band D the most year-on-year. <Link href="/insights/biggest-tax-rises" className="text-foreground hover:underline">See full breakdown →</Link>
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
          <h2 className="type-title-2 mb-1">Council tax 2026 FAQ</h2>
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
            <li><Link href="/insights/most-expensive-council-tax" className="type-body-sm text-muted-foreground hover:text-foreground transition-colors">Highest council tax 2026</Link></li>
            <li><Link href="/insights/cheapest-council-tax" className="type-body-sm text-muted-foreground hover:text-foreground transition-colors">Lowest council tax 2026</Link></li>
            <li><Link href="/insights/biggest-tax-rises" className="type-body-sm text-muted-foreground hover:text-foreground transition-colors">Biggest tax rises this year</Link></li>
            <li><Link href="/guide/council-tax" className="type-body-sm text-muted-foreground hover:text-foreground transition-colors">Complete guide to council tax</Link></li>
            <li><Link href="/insights" className="type-body-sm text-muted-foreground hover:text-foreground transition-colors">All insights</Link></li>
          </ul>
        </nav>
      </main>
    </>
  );
}
