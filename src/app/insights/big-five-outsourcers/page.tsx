import type { Metadata } from 'next';
import { InsightHero } from '@/components/insights/InsightHero';
import { RankedBarList, RankedBarRow } from '@/components/insights/RankedBarRow';
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
              About {formatShort(combinedSpend)} on these five companies, out of
              {' '}{formatShort(nationalTopSupplierSpend)} in total top-supplier
              spend that councils have published.
            </p>
          </div>
        }
      >
        <section className="card-elevated p-5 sm:p-6">
          <h2 className="type-title-2 mb-1">Company by company</h2>
          <p className="type-body-sm text-muted-foreground mb-6">
            Spend and number of councils for each of the Big Five, added up
            from published top supplier lists.
          </p>

          <RankedBarList>
            {brands.map((b) => (
              <RankedBarRow
                key={b.brand}
                title={b.brand}
                value={formatShort(b.totalSpend)}
                subLeft={`Listed by ${b.councilCount} council${b.councilCount === 1 ? '' : 's'}`}
                fillPct={combinedSpend > 0 ? (b.totalSpend / combinedSpend) * 100 : 0}
              />
            ))}
          </RankedBarList>

          <p className="type-caption text-muted-foreground mt-6 pt-4 border-t border-border/50">
            How we got this: we add up each council&rsquo;s published top
            supplier list, then match names that start with one of the Big
            Five (after taking off common endings like &ldquo;Ltd&rdquo; or
            &ldquo;plc&rdquo;). Only spend that has been published is included
            — the full contracting picture is bigger.
          </p>
        </section>
      </InsightHero>
    </>
  );
}
