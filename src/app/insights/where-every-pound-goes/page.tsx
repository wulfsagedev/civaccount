import type { Metadata } from 'next';
import { InsightHero } from '@/components/insights/InsightHero';
import { getInsightCard } from '@/data/insights';
import { getWhereEveryPoundGoes, getNationalSpendStats } from '@/lib/insights-stats';
import { formatCurrency } from '@/data/councils';
import { buildFAQPageSchema, buildBreadcrumbSchema } from '@/lib/structured-data';

const card = getInsightCard('where-every-pound-goes')!;

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
  const services = getWhereEveryPoundGoes();
  const { totalSpend, councilCount } = getNationalSpendStats();

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
              Of every £1 English councils spend, this goes on the biggest item
            </p>
            <p className="type-display font-semibold tabular-nums mb-2">
              {services[0]?.pence.toFixed(0)}p
            </p>
            <p className="type-body-sm text-muted-foreground">
              Aggregated from the planned 2025-26 budgets of {councilCount} English councils — about {formatShort(totalSpend)} in total net service spend.
            </p>
          </div>
        }
      >
        <section className="card-elevated p-5 sm:p-6">
          <h2 className="type-title-2 mb-1">The full breakdown</h2>
          <p className="type-body-sm text-muted-foreground mb-6">
            Share of every £1 going on each of ten service categories, ranked
            largest to smallest.
          </p>

          <div className="space-y-4">
            {services.map((s) => (
              <div key={s.key}>
                <div className="flex items-baseline justify-between mb-1">
                  <span className="type-body font-semibold">{s.name}</span>
                  <span className="type-body font-semibold tabular-nums">
                    {s.pence.toFixed(1)}p
                  </span>
                </div>
                <div className="flex items-baseline justify-between mb-2">
                  <span className="type-caption text-muted-foreground tabular-nums">
                    {formatShort(s.total)} nationally
                  </span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-foreground"
                    style={{ width: `${s.pence}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <p className="type-caption text-muted-foreground mt-6 pt-4 border-t border-border/50">
            How we got this: each council&rsquo;s planned net spend per service
            category, summed nationally, divided by the national total.
            District councils don&rsquo;t deliver care or schools — those shares
            are weighted down accordingly.
          </p>
        </section>
      </InsightHero>
    </>
  );
}
