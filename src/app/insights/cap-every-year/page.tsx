import type { Metadata } from 'next';
import { InsightHero } from '@/components/insights/InsightHero';
import { RankedBarList, RankedBarRow } from '@/components/insights/RankedBarRow';
import { getInsightCard } from '@/data/insights';
import { getCapEveryYear } from '@/lib/insights-stats';
import { getCouncilDisplayName, getCouncilSlug } from '@/data/councils';
import { buildFAQPageSchema, buildBreadcrumbSchema } from '@/lib/structured-data';
import { serializeJsonLd } from '@/lib/safe-json-ld';

const card = getInsightCard('cap-every-year')!;

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
  const { bothYearsAtCap, councilsWithData, years } = getCapEveryYear();
  const [prevYear, currYear] = years;
  const bespokeCount = bothYearsAtCap.filter((e) => e.bespokeEitherYear).length;

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
              Councils that went to their limit in both {prevYear} and {currYear}
            </p>
            <p className="type-display font-semibold tabular-nums mb-2">
              {bothYearsAtCap.length}
            </p>
            <p className="type-body-sm text-muted-foreground">
              Out of {councilsWithData} billing authorities with rates on record
              for all three years.
              {bespokeCount > 0
                ? ` ${bespokeCount} of them held a higher limit than others of their type in at least one year.`
                : ''}
            </p>
          </div>
        }
      >
        <section className="card-elevated p-5 sm:p-6">
          <h2 className="type-title-2 mb-1">Two years at the limit</h2>
          <p className="type-body-sm text-muted-foreground mb-6">
            Ranked by the combined two-year rise. Each year is measured against
            that year&rsquo;s own limit for that council — the limits move, and
            which councils hold a higher one changes.
          </p>

          <RankedBarList>
            {bothYearsAtCap.map((e, i) => (
              <RankedBarRow
                key={e.council.ons_code}
                rank={i + 1}
                title={getCouncilDisplayName(e.council)}
                href={`/council/${getCouncilSlug(e.council)}`}
                value={`+${e.compoundPct.toFixed(1)}%`}
                subLeft={`${prevYear}: +${e.risePrev.toFixed(2)}% (limit ${e.limitPrevPct}%) · ${currYear}: +${e.riseCurr.toFixed(2)}% (limit ${e.limitCurrPct}%)`}
              />
            ))}
          </RankedBarList>

          <p className="type-caption text-muted-foreground mt-6 pt-4 border-t border-border/50">
            How we got this: we take the Band D rate for each of the three years
            from GOV.UK, work out each year&rsquo;s rise rounded to 2 decimal
            places (to match how councils publish it), and keep the councils
            that went to the most they were allowed in both years. A council
            that raised less than another can still appear here if its own limit
            was lower. The combined figure multiplies the two rises together —
            it is not the two added up. County councils set no area Band D, so
            they are not in this ranking.
          </p>
        </section>
      </InsightHero>
    </>
  );
}
