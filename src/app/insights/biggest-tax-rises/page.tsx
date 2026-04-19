import type { Metadata } from 'next';
import { InsightHero } from '@/components/insights/InsightHero';
import { RankedBarList, RankedBarRow } from '@/components/insights/RankedBarRow';
import { getInsightCard } from '@/data/insights';
import {
  getAverageTaxRise,
  getBiggestTaxRises,
  getCouncilsAtOrOverCap,
} from '@/lib/insights-stats';
import {
  formatCurrency,
  getCouncilDisplayName,
  getCouncilSlug,
} from '@/data/councils';
import { buildFAQPageSchema, buildBreadcrumbSchema } from '@/lib/structured-data';
import { serializeJsonLd } from '@/lib/safe-json-ld';

const card = getInsightCard('biggest-tax-rises')!;

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
  const top = getBiggestTaxRises(10);
  const avg = getAverageTaxRise();
  const overCap = getCouncilsAtOrOverCap(4.99);
  const maxPct = top[0]?.changePct ?? 1;

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
          <div>
            <p className="type-caption text-muted-foreground mb-1">
              Councils raising Band D by 4.99% or more this year
            </p>
            <p className="type-display font-semibold tabular-nums mb-2">
              {overCap}
            </p>
            <p className="type-body-sm text-muted-foreground">
              National average rise: {avg.toFixed(1)}%.
            </p>
          </div>
        }
      >
        <section className="card-elevated p-5 sm:p-6">
          <h2 className="type-title-2 mb-1">Top 10 biggest rises</h2>
          <p className="type-body-sm text-muted-foreground mb-6">
            Ranked by percentage change from 2024-25 Band D to 2025-26 Band D.
          </p>

          <RankedBarList>
            {top.map((r, i) => (
              <RankedBarRow
                key={r.council.ons_code}
                rank={i + 1}
                title={getCouncilDisplayName(r.council)}
                href={`/council/${getCouncilSlug(r.council)}`}
                value={`+${r.changePct.toFixed(1)}%`}
                subLeft={`${formatCurrency(r.from, { decimals: 0 })} → ${formatCurrency(r.to, { decimals: 0 })}`}
                subRight={`+${formatCurrency(r.changeAbs, { decimals: 0 })}`}
                fillPct={(r.changePct / maxPct) * 100}
              />
            ))}
          </RankedBarList>

          <p className="type-caption text-muted-foreground mt-6 pt-4 border-t border-border/50">
            How we got this: percentage change = (2025-26 Band D − 2024-25 Band D) ÷
            2024-25 Band D. We rank every council that has published both figures.
          </p>
        </section>
      </InsightHero>
    </>
  );
}
