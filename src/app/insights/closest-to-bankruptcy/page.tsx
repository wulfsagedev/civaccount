import type { Metadata } from 'next';
import { InsightHero } from '@/components/insights/InsightHero';
import { RankedBarList, RankedBarRow } from '@/components/insights/RankedBarRow';
import { getInsightCard } from '@/data/insights';
import { getClosestToBankruptcy } from '@/lib/insights-stats';
import {
  formatCurrency,
  getCouncilDisplayName,
  getCouncilSlug,
} from '@/data/councils';
import { buildFAQPageSchema, buildBreadcrumbSchema } from '@/lib/structured-data';

const card = getInsightCard('closest-to-bankruptcy')!;

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

function formatShort(pounds: number): string {
  if (pounds >= 1_000_000_000) return `£${(pounds / 1_000_000_000).toFixed(1)}bn`;
  if (pounds >= 1_000_000) return `£${(pounds / 1_000_000).toFixed(1)}m`;
  return formatCurrency(pounds, { decimals: 0 });
}

export default function Page() {
  const { top, over10pct, over5pct, totalGap, councilsWithData } =
    getClosestToBankruptcy(10);
  const maxGap = top[0]?.gapPounds ?? 1;

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
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <InsightHero
        entry={card}
        hero={
          <div>
            <p className="type-caption text-muted-foreground mb-1">
              Total budget gap across English councils
            </p>
            <p className="type-display font-semibold tabular-nums mb-2">
              {formatShort(totalGap)}
            </p>
            <p className="type-body-sm text-muted-foreground">
              Across the {councilsWithData} councils that publish a gap figure.{' '}
              {over10pct} have a gap of 10% or more of their net budget
              {' '}({over5pct - over10pct} more are between 5% and 10%).
            </p>
          </div>
        }
      >
        <section className="card-elevated p-5 sm:p-6">
          <h2 className="type-title-2 mb-1">Top 10 biggest gaps</h2>
          <p className="type-body-sm text-muted-foreground mb-6">
            Ranked by the size of the budget gap, in pounds.
          </p>

          <RankedBarList>
            {top.map((r, i) => (
              <RankedBarRow
                key={r.council.ons_code}
                rank={i + 1}
                title={getCouncilDisplayName(r.council)}
                href={`/council/${getCouncilSlug(r.council)}`}
                value={formatShort(r.gapPounds)}
                subLeft={`${r.gapPct.toFixed(0)}% of ${formatShort(r.netBudgetPounds)} net budget`}
                subRight={r.savingsTargetPounds ? `Savings target ${formatShort(r.savingsTargetPounds)}` : undefined}
                fillPct={(r.gapPounds / maxGap) * 100}
              />
            ))}
          </RankedBarList>

          <p className="type-caption text-muted-foreground mt-6 pt-4 border-t border-border/50">
            How we got this: we take the gap in pounds straight from each
            council&rsquo;s published budget or Medium Term Financial Strategy.
            Some councils publish a one-year gap; others publish the total they
            expect over 3 to 5 years. So this is a rough guide to financial
            pressure, not an exact like-for-like comparison.
          </p>
        </section>
      </InsightHero>
    </>
  );
}
