import type { Metadata } from 'next';
import { InsightHero } from '@/components/insights/InsightHero';
import { RankedBarList, RankedBarRow } from '@/components/insights/RankedBarRow';
import { getInsightCard } from '@/data/insights';
import { getCeoPayStats } from '@/lib/insights-stats';
import {
  formatCurrency,
  getCouncilDisplayName,
  getCouncilSlug,
} from '@/data/councils';
import { buildFAQPageSchema, buildBreadcrumbSchema } from '@/lib/structured-data';
import { serializeJsonLd } from '@/lib/safe-json-ld';

const card = getInsightCard('ceo-pay-league')!;

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
  const { top, bottom, median, over200k, count, highestPaid } =
    getCeoPayStats(10);
  const max = highestPaid.total;

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

  type Entry = (typeof top)[number];
  const Row = ({
    entry,
    rank,
  }: {
    entry: Entry;
    rank: number;
  }) => (
    <RankedBarRow
      rank={rank}
      title={getCouncilDisplayName(entry.council)}
      href={`/council/${getCouncilSlug(entry.council)}`}
      value={formatCurrency(entry.total, { decimals: 0 })}
      subLeft={entry.council.type_name}
      fillPct={max > 0 ? (entry.total / max) * 100 : 0}
    />
  );

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
      />
      <InsightHero
        entry={card}
        hero={
          <div>
            <p className="type-caption text-muted-foreground mb-1">
              Middle (median) total pay for a council CEO in England
            </p>
            <p className="type-display font-semibold tabular-nums mb-2">
              {formatCurrency(median, { decimals: 0 })}
            </p>
            <p className="type-body-sm text-muted-foreground">
              Across {count} councils that publish their pay. {over200k} pay their
              CEO more than £200,000.
            </p>
          </div>
        }
      >
        <section className="card-elevated p-5 sm:p-6 mb-5">
          <h2 className="type-title-2 mb-1">Top 10 highest paid</h2>
          <p className="type-body-sm text-muted-foreground mb-6">
            Ranked by total pay (salary plus pension and benefits, where the
            council has published them).
          </p>
          <RankedBarList>
            {top.map((entry, i) => (
              <Row key={entry.council.ons_code} entry={entry} rank={i + 1} />
            ))}
          </RankedBarList>
        </section>

        <section className="card-elevated p-5 sm:p-6">
          <h2 className="type-title-2 mb-1">10 lowest-paid</h2>
          <p className="type-body-sm text-muted-foreground mb-6">
            Shown for balance, alongside the highest paid.
          </p>
          <RankedBarList>
            {bottom.map((entry, i) => (
              <Row
                key={entry.council.ons_code}
                entry={entry}
                rank={count - i}
              />
            ))}
          </RankedBarList>

          <p className="type-caption text-muted-foreground mt-6 pt-4 border-t border-border/50">
            How we got this: total pay is salary plus the employer&rsquo;s
            pension contribution and any benefits the council has published.
            If a council only publishes the basic salary, we use that. The
            Isles of Scilly is the only English council without a published
            figure — with under 2,500 residents and under 100 staff, it is too
            small to change the top or bottom of the list.
          </p>
        </section>
      </InsightHero>
    </>
  );
}
