import type { Metadata } from 'next';
import { InsightHero } from '@/components/insights/InsightHero';
import { RankedBarList, RankedBarRow } from '@/components/insights/RankedBarRow';
import { getInsightCard } from '@/data/insights';
import { getTaxCapBreakers, getAverageTaxRise } from '@/lib/insights-stats';
import { getCouncilDisplayName, getCouncilSlug } from '@/data/councils';
import { buildFAQPageSchema, buildBreadcrumbSchema } from '@/lib/structured-data';

const card = getInsightCard('tax-cap-breakers')!;

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
  const { atOrOverCap, overCap, councilsWithData } = getTaxCapBreakers(4.99);
  const avgRise = getAverageTaxRise();

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
              English councils that raised Band D by 4.99% or more in 2025-26
            </p>
            <p className="type-display font-semibold tabular-nums mb-2">
              {atOrOverCap.length}
            </p>
            <p className="type-body-sm text-muted-foreground">
              Out of the {councilsWithData} councils with figures for both 2024
              and 2025. {overCap.length} went above the cap, with special
              permission from government. National average rise: {avgRise.toFixed(1)}%.
            </p>
          </div>
        }
      >
        <section className="card-elevated p-5 sm:p-6">
          <h2 className="type-title-2 mb-1">At or above the cap</h2>
          <p className="type-body-sm text-muted-foreground mb-6">
            Ranked by the size of the Band D rise this year. To go above 4.99%,
            a council needs special permission from the Ministry of Housing,
            Communities and Local Government.
          </p>

          <RankedBarList>
            {atOrOverCap.slice(0, 20).map((e, i) => {
              const isOverCap = e.risePct > 4.99;
              return (
                <RankedBarRow
                  key={e.council.ons_code}
                  rank={i + 1}
                  title={getCouncilDisplayName(e.council)}
                  href={`/council/${getCouncilSlug(e.council)}`}
                  value={`+${e.risePct.toFixed(1)}%`}
                  subLeft={`£${e.from.toFixed(0)} → £${e.to.toFixed(0)}${isOverCap ? ' · above cap' : ''}`}
                />
              );
            })}
          </RankedBarList>

          <p className="type-caption text-muted-foreground mt-6 pt-4 border-t border-border/50">
            How we got this: we compare each council&rsquo;s 2024-25 and 2025-26
            Band D rate from GOV.UK. The 4.99% figure is the 2.99% basic cap
            plus the 2% extra charge for adult social care — the normal limit
            for councils that run social care.
          </p>
        </section>
      </InsightHero>
    </>
  );
}
