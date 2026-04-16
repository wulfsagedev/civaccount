import type { Metadata } from 'next';
import Link from 'next/link';
import { InsightHero } from '@/components/insights/InsightHero';
import { getInsightCard } from '@/data/insights';
import { getCeoPayStats } from '@/lib/insights-stats';
import {
  formatCurrency,
  getCouncilDisplayName,
  getCouncilSlug,
} from '@/data/councils';
import { buildFAQPageSchema, buildBreadcrumbSchema } from '@/lib/structured-data';

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
  }) => {
    const name = getCouncilDisplayName(entry.council);
    const slug = getCouncilSlug(entry.council);
    const pct = max > 0 ? (entry.total / max) * 100 : 0;
    return (
      <div className="py-4 border-b border-border/30 last:border-b-0 first:pt-0 last:pb-0">
        <div className="flex items-baseline justify-between mb-2">
          <Link
            href={`/council/${slug}`}
            className="type-body font-semibold hover:underline"
          >
            {rank}. {name}
          </Link>
          <span className="type-body font-semibold tabular-nums">
            {formatCurrency(entry.total, { decimals: 0 })}
          </span>
        </div>
        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-foreground"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    );
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <InsightHero
        entry={card}
        hero={
          <div>
            <p className="type-caption text-muted-foreground mb-1">
              National median CEO total remuneration
            </p>
            <p className="type-display font-semibold tabular-nums mb-2">
              {formatCurrency(median, { decimals: 0 })}
            </p>
            <p className="type-body-sm text-muted-foreground">
              Across {count} councils with published pay. {over200k} pay their
              CEO over £200,000.
            </p>
          </div>
        }
      >
        <section className="card-elevated p-5 sm:p-6 mb-5">
          <h2 className="type-title-2 mb-1">Top 10 highest paid</h2>
          <p className="type-body-sm text-muted-foreground mb-6">
            Ranked by total disclosed remuneration (salary plus pension and
            benefits, where published).
          </p>
          <div>
            {top.map((entry, i) => (
              <Row key={entry.council.ons_code} entry={entry} rank={i + 1} />
            ))}
          </div>
        </section>

        <section className="card-elevated p-5 sm:p-6">
          <h2 className="type-title-2 mb-1">Bottom 10 — lowest paid</h2>
          <p className="type-body-sm text-muted-foreground mb-6">
            Shown for context alongside the highest paid.
          </p>
          <div>
            {bottom.map((entry, i) => (
              <Row
                key={entry.council.ons_code}
                entry={entry}
                rank={count - i}
              />
            ))}
          </div>

          <p className="type-caption text-muted-foreground mt-6 pt-4 border-t border-border/50">
            How we got this: total remuneration is salary plus published
            employer pension contribution and benefits. Where a council only
            publishes base salary, that figure is used.
          </p>
        </section>
      </InsightHero>
    </>
  );
}
