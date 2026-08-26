import type { Metadata } from 'next';
import { InsightHero } from '@/components/insights/InsightHero';
import { RankedBarList, RankedBarRow } from '@/components/insights/RankedBarRow';
import { getInsightCard } from '@/data/insights';
import {
  getAreaTaxRises,
  getAverageAreaTaxRise,
} from '@/lib/insights-stats';
import {
  formatCurrency,
  getCouncilDisplayName,
  getCouncilSlug,
  PREVIOUS_TAX_YEAR,
  CURRENT_TAX_YEAR,
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
  const top = getAreaTaxRises(10);
  const avg = getAverageAreaTaxRise();
  const year = CURRENT_TAX_YEAR;
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
              Biggest rise in the area Band D bill for {year}
            </p>
            <p className="type-display font-semibold tabular-nums mb-2">
              +{top[0]?.changePct.toFixed(1)}%
            </p>
            <p className="type-body-sm text-muted-foreground">
              Average rise across billing authorities: {avg.toFixed(1)}%.
            </p>
          </div>
        }
      >
        <section className="card-elevated p-5 sm:p-6">
          <h2 className="type-title-2 mb-1">Top 10 biggest rises</h2>
          <p className="type-body-sm text-muted-foreground mb-6">
            Ranked by percentage change in the area Band D bill, {PREVIOUS_TAX_YEAR} to {year}.
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
            How we got this: percentage change = ({year} Band D −{' '}
            {PREVIOUS_TAX_YEAR} Band D) ÷ {PREVIOUS_TAX_YEAR} Band D, using the
            area bill — the whole amount a household in
            that area pays. County councils are not billing authorities and set
            no area Band D, so they are not in this ranking.
          </p>
        </section>
      </InsightHero>
    </>
  );
}
