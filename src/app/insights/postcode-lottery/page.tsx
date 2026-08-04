import type { Metadata } from 'next';
import Link from 'next/link';
import { InsightHero } from '@/components/insights/InsightHero';
import { RankedBarList, RankedBarRow } from '@/components/insights/RankedBarRow';
import { getInsightCard } from '@/data/insights';
import { getAreaExtremesByGroup, getHeadlineAreaExtremes } from '@/lib/insights-stats';
import {
  councils,
  formatCurrency,
  getAreaBandD,
  getCouncilDisplayName,
  getCouncilSlug,
  CURRENT_TAX_YEAR,
  PREVIOUS_TAX_YEAR,
} from '@/data/councils';
import { buildFAQPageSchema, buildBreadcrumbSchema } from '@/lib/structured-data';
import { serializeJsonLd } from '@/lib/safe-json-ld';

// The registry entry (src/data/insights.ts) is shared copy. This page now
// shows 2026-27 area Band D figures, so patch the year-pinned strings here to
// keep every displayed claim in the same year as the data.
const registryCard = getInsightCard('postcode-lottery')!;
const card = {
  ...registryCard,
  metaDescription: registryCard.metaDescription.replace('2025-26', '2026-27'),
  faq: registryCard.faq.map((f) => ({
    question: f.question,
    answer: f.answer.replace('2025-26', '2026-27'),
  })),
};

export const metadata: Metadata = {
  title: `${card.title} · CivAccount`,
  description: card.metaDescription,
  alternates: { canonical: `/insights/${card.slug}` },
  openGraph: { title: card.title, description: card.metaDescription },
  twitter: {
    card: 'summary_large_image',
    title: card.title,
    description: card.metaDescription,
  },
};

export default function Page() {
  const headline = getHeadlineAreaExtremes();
  const groups = getAreaExtremesByGroup();

  const cheapestBandD = headline.cheapestValue;
  const priciestBandD = headline.mostExpensiveValue;
  const gap = priciestBandD - cheapestBandD;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      buildFAQPageSchema(card.faq, `/insights/${card.slug}`),
      buildBreadcrumbSchema(
        [
          { name: 'Home', url: '/' },
          { name: 'Insights', url: '/insights' },
          { name: card.title },
        ],
        `/insights/${card.slug}`,
      ),
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
      />
      <InsightHero
        entry={card}
        hero={
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="rounded-lg bg-muted/30 p-4">
              <p className="type-caption text-positive font-semibold mb-1">Cheapest</p>
              <p className="type-metric tabular-nums mb-1">
                {formatCurrency(cheapestBandD, { decimals: 0 })}
              </p>
              <p className="type-body-sm font-medium">
                <Link
                  href={`/council/${getCouncilSlug(headline.cheapest)}`}
                  className="hover:underline"
                >
                  {getCouncilDisplayName(headline.cheapest)}
                </Link>
              </p>
            </div>
            <div className="rounded-lg bg-muted/30 p-4">
              <p className="type-caption text-negative font-semibold mb-1">Most expensive</p>
              <p className="type-metric tabular-nums mb-1">
                {formatCurrency(priciestBandD, { decimals: 0 })}
              </p>
              <p className="type-body-sm font-medium">
                <Link
                  href={`/council/${getCouncilSlug(headline.mostExpensive)}`}
                  className="hover:underline"
                >
                  {getCouncilDisplayName(headline.mostExpensive)}
                </Link>
              </p>
            </div>
            <p className="type-body-sm text-muted-foreground sm:col-span-2">
              A {formatCurrency(gap, { decimals: 0 })} gap on a Band D bill between the
              cheapest and most expensive councils that run all services, for {headline.year}.
            </p>
          </div>
        }
      >
        {groups.map((group) => {
          const groupCouncils = councils
            .filter((c) => group.types.includes(c.type))
            .map((c) => ({ council: c, area: getAreaBandD(c) }))
            .filter((e): e is { council: (typeof councils)[number]; area: NonNullable<ReturnType<typeof getAreaBandD>> } => e.area !== null)
            .sort((a, b) => a.area.value - b.area.value);

          const cheapestRows = groupCouncils.slice(0, 5);
          const priciestRows = groupCouncils.slice(-5).reverse();
          const maxBandD =
            groupCouncils[groupCouncils.length - 1]?.area.value ?? 1;
          const yearNote = group.year === CURRENT_TAX_YEAR
            ? `${CURRENT_TAX_YEAR} · full Band D bill for the area`
            : `${PREVIOUS_TAX_YEAR} · the county's own share of the bill (2026-27 not yet published)`;

          const Row = ({
            entry,
            rank,
          }: {
            entry: (typeof groupCouncils)[number];
            rank: number;
            variant: 'cheap' | 'pricey';
          }) => (
            <RankedBarRow
              rank={rank}
              title={getCouncilDisplayName(entry.council)}
              href={`/council/${getCouncilSlug(entry.council)}`}
              value={formatCurrency(entry.area.value, { decimals: 2 })}
              subLeft={entry.council.type_name}
              subRight={entry.area.year}
              fillPct={(entry.area.value / maxBandD) * 100}
            />
          );

          return (
            <section key={group.label} className="card-elevated p-5 sm:p-6 mb-5">
              <h2 className="type-title-2 mb-1">{group.label}</h2>
              <p className="type-body-sm text-muted-foreground mb-6">
                {group.description} · {yearNote}
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="type-caption text-muted-foreground font-semibold uppercase mb-3">
                    Cheapest 5
                  </p>
                  <RankedBarList>
                    {cheapestRows.map((e, i) => (
                      <Row
                        key={e.council.ons_code}
                        entry={e}
                        rank={i + 1}
                        variant="cheap"
                      />
                    ))}
                  </RankedBarList>
                </div>
                <div>
                  <p className="type-caption text-muted-foreground font-semibold uppercase mb-3">
                    Most expensive 5
                  </p>
                  <RankedBarList>
                    {priciestRows.map((e, i) => (
                      <Row
                        key={e.council.ons_code}
                        entry={e}
                        rank={groupCouncils.length - i}
                        variant="pricey"
                      />
                    ))}
                  </RankedBarList>
                </div>
              </div>
            </section>
          );
        })}
      </InsightHero>
    </>
  );
}
