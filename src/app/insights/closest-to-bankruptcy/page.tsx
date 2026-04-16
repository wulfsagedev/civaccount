import type { Metadata } from 'next';
import Link from 'next/link';
import { InsightHero } from '@/components/insights/InsightHero';
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
              Across {councilsWithData} councils that publish a gap figure.{' '}
              {over10pct} have a gap of 10% or more of their net budget
              {' '}({over5pct - over10pct} more are at 5–10%).
            </p>
          </div>
        }
      >
        <section className="card-elevated p-5 sm:p-6">
          <h2 className="type-title-2 mb-1">Top 10 biggest gaps</h2>
          <p className="type-body-sm text-muted-foreground mb-6">
            Ranked by budget gap size in pounds.
          </p>

          <div>
            {top.map((r, i) => {
              const name = getCouncilDisplayName(r.council);
              const slug = getCouncilSlug(r.council);
              const barPct = (r.gapPounds / maxGap) * 100;
              return (
                <div key={r.council.ons_code} className="py-4 border-b border-border/30 last:border-b-0 first:pt-0 last:pb-0">
                  <div className="flex items-baseline justify-between mb-1">
                    <Link
                      href={`/council/${slug}`}
                      className="type-body font-semibold hover:underline"
                    >
                      {i + 1}. {name}
                    </Link>
                    <span className="type-body font-semibold tabular-nums text-negative">
                      {formatShort(r.gapPounds)}
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between mb-2">
                    <span className="type-caption text-muted-foreground tabular-nums">
                      {r.gapPct.toFixed(0)}% of {formatShort(r.netBudgetPounds)} net budget
                    </span>
                    {r.savingsTargetPounds ? (
                      <span className="type-caption text-muted-foreground tabular-nums">
                        Savings target {formatShort(r.savingsTargetPounds)}
                      </span>
                    ) : null}
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-foreground"
                      style={{ width: `${barPct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <p className="type-caption text-muted-foreground mt-6 pt-4 border-t border-border/50">
            How we got this: gap in pounds is read directly from each
            council&rsquo;s published budget or Medium Term Financial Strategy.
            Some councils publish a single-year gap; others publish a cumulative
            3–5 year figure from their MTFS — so this is a rough indicator of
            financial pressure, not an exact benchmark.
          </p>
        </section>
      </InsightHero>
    </>
  );
}
