import type { Metadata } from 'next';
import { InsightHero } from '@/components/insights/InsightHero';
import { getInsightCard } from '@/data/insights';
import { getBigFiveOutsourcers } from '@/lib/insights-stats';
import { formatCurrency } from '@/data/councils';
import { buildFAQPageSchema, buildBreadcrumbSchema } from '@/lib/structured-data';

const card = getInsightCard('big-five-outsourcers')!;

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
  const { brands, combinedSpend, sharePct, nationalTopSupplierSpend } =
    getBigFiveOutsourcers();

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
              Share of published top-supplier spend going to Capita, Serco, Veolia, Biffa and Amey
            </p>
            <p className="type-display font-semibold tabular-nums mb-2">
              {sharePct.toFixed(1)}%
            </p>
            <p className="type-body-sm text-muted-foreground">
              About {formatShort(combinedSpend)} disclosed across councils&rsquo;
              top suppliers — out of {formatShort(nationalTopSupplierSpend)} in
              total top-supplier spend.
            </p>
          </div>
        }
      >
        <section className="card-elevated p-5 sm:p-6">
          <h2 className="type-title-2 mb-1">Brand by brand</h2>
          <p className="type-body-sm text-muted-foreground mb-6">
            Spend and council count for each of the Big Five, aggregated from
            published top-supplier lists.
          </p>

          <div className="space-y-5">
            {brands.map((b) => {
              const pct =
                combinedSpend > 0 ? (b.totalSpend / combinedSpend) * 100 : 0;
              return (
                <div key={b.brand}>
                  <div className="flex items-baseline justify-between mb-1">
                    <span className="type-body font-semibold">{b.brand}</span>
                    <span className="type-body font-semibold tabular-nums">
                      {formatShort(b.totalSpend)}
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between mb-2">
                    <span className="type-caption text-muted-foreground">
                      Listed by {b.councilCount} council{b.councilCount === 1 ? '' : 's'}
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
            })}
          </div>

          <p className="type-caption text-muted-foreground mt-6 pt-4 border-t border-border/50">
            How we got this: we aggregate each council&rsquo;s published top
            suppliers list, then match names starting with each Big Five brand
            (after stripping common suffixes like &ldquo;Ltd&rdquo; or
            &ldquo;plc&rdquo;). Only disclosed top-supplier spend is included —
            the wider contracting picture is bigger.
          </p>
        </section>
      </InsightHero>
    </>
  );
}
