import type { Metadata } from 'next';
import { InsightHero } from '@/components/insights/InsightHero';
import { RankedBarList, RankedBarRow } from '@/components/insights/RankedBarRow';
import { getInsightCard } from '@/data/insights';
import { getTopSuppliersNational } from '@/lib/insights-stats';
import { formatCurrency } from '@/data/councils';
import { buildFAQPageSchema, buildBreadcrumbSchema } from '@/lib/structured-data';

const card = getInsightCard('top-suppliers')!;

export const metadata: Metadata = {
  title: `${card.title} · CivAccount`,
  description: card.metaDescription,
  alternates: { canonical: `/insights/${card.slug}` },
  openGraph: {
    title: card.title,
    description: card.metaDescription,
  },
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
  const { top, totalAggregateSpend, councilsWithData } = getTopSuppliersNational(10);
  const maxSpend = top[0]?.totalSpend ?? 1;

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
              Paid to the top 10 private companies that work for English councils
            </p>
            <p className="type-display font-semibold tabular-nums mb-2">
              {formatShort(totalAggregateSpend)}
            </p>
            <p className="type-body-sm text-muted-foreground">
              Added up from the {councilsWithData} of 317 councils that publish a top supplier list.
            </p>
          </div>
        }
      >
        <section className="card-elevated p-5 sm:p-6">
          <h2 className="type-title-2 mb-1">The top 10 across England</h2>
          <p className="type-body-sm text-muted-foreground mb-6">
            Ranked by total yearly spend across every council that names them.
          </p>

          <RankedBarList>
            {top.map((s, i) => (
              <RankedBarRow
                key={s.name}
                rank={i + 1}
                title={s.name}
                value={formatShort(s.totalSpend)}
                subLeft={`${s.councilCount} council${s.councilCount === 1 ? '' : 's'}${s.exampleCategory ? ` · ${s.exampleCategory}` : ''}`}
                fillPct={(s.totalSpend / maxSpend) * 100}
              />
            ))}
          </RankedBarList>

          <p className="type-caption text-muted-foreground mt-6 pt-4 border-t border-border/50">
            How we got this: under the Local Government Transparency Code, each
            council publishes a list of its top suppliers. We tidy up the names
            so &ldquo;Capita Ltd&rdquo; and &ldquo;Capita plc&rdquo; are counted as the same company,
            then add up the yearly spend.
          </p>
        </section>
      </InsightHero>
    </>
  );
}
