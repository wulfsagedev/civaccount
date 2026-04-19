import type { Metadata } from 'next';
import { InsightHero } from '@/components/insights/InsightHero';
import { RankedBarList, RankedBarRow } from '@/components/insights/RankedBarRow';
import { getInsightCard } from '@/data/insights';
import { getThreeYearSqueeze } from '@/lib/insights-stats';
import {
  formatCurrency,
  getCouncilDisplayName,
  getCouncilSlug,
} from '@/data/councils';
import { buildFAQPageSchema, buildBreadcrumbSchema } from '@/lib/structured-data';
import { serializeJsonLd } from '@/lib/safe-json-ld';

const card = getInsightCard('three-year-squeeze')!;

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
  const { top, medianAbs, meanAbs, councilsWithData } = getThreeYearSqueeze(20);
  const max = top[0]?.changeAbs ?? 1;
  const topCouncilName = top[0] ? getCouncilDisplayName(top[0].council) : '';

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
              Typical extra on a Band D bill compared with 2023-24
            </p>
            <p className="type-display font-semibold tabular-nums mb-2">
              +{formatCurrency(Math.round(medianAbs), { decimals: 0 })} a year
            </p>
            <p className="type-body-sm text-muted-foreground">
              The middle (median) English council — across all {councilsWithData} with
              2023-24 and 2025-26 rates on record. Average (mean): +
              {formatCurrency(Math.round(meanAbs), { decimals: 0 })}. The
              biggest rise is in {topCouncilName}, where Band D is now +
              {formatCurrency(Math.round(top[0].changeAbs), { decimals: 0 })} a
              year.
            </p>
          </div>
        }
      >
        <section className="card-elevated p-5 sm:p-6">
          <h2 className="type-title-2 mb-1">Biggest 2-year rises, in pounds</h2>
          <p className="type-body-sm text-muted-foreground mb-6">
            Ranked by how much more a Band D household pays each year now than
            in 2023-24. Councils that started from a higher bill tend to rise
            by more in pounds, even when the percentage is similar.
          </p>

          <RankedBarList>
            {top.map((r, i) => (
              <RankedBarRow
                key={r.council.ons_code}
                rank={i + 1}
                title={getCouncilDisplayName(r.council)}
                href={`/council/${getCouncilSlug(r.council)}`}
                value={`+${formatCurrency(Math.round(r.changeAbs), { decimals: 0 })}`}
                subLeft={`${formatCurrency(r.from, { decimals: 0 })} → ${formatCurrency(r.to, { decimals: 0 })} a year`}
                subRight={`up ${r.changePct.toFixed(1)}%`}
                fillPct={(r.changeAbs / max) * 100}
              />
            ))}
          </RankedBarList>

          <p className="type-caption text-muted-foreground mt-6 pt-4 border-t border-border/50">
            How we got this: we take each council&rsquo;s 2023-24 and 2025-26
            headline Band D rate from GOV.UK and subtract one from the other.
            All 317 English councils are in the ranking — both rates are on the
            public record for every one. Councils that started from a higher
            bill show bigger rises in pounds, even at similar percentages.
          </p>
        </section>
      </InsightHero>
    </>
  );
}
