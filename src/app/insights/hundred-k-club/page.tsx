import type { Metadata } from 'next';
import { InsightHero } from '@/components/insights/InsightHero';
import { RankedBarList, RankedBarRow } from '@/components/insights/RankedBarRow';
import { getInsightCard } from '@/data/insights';
import { getHundredKClub } from '@/lib/insights-stats';
import { getCouncilDisplayName, getCouncilSlug } from '@/data/councils';
import { buildFAQPageSchema, buildBreadcrumbSchema } from '@/lib/structured-data';
import { serializeJsonLd } from '@/lib/safe-json-ld';

const card = getInsightCard('hundred-k-club')!;

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
  const { totalStaff, councilsWithAny, councilsDisclosing, medianPerCouncil, top } =
    getHundredKClub(10);
  const maxCount = top[0]?.count ?? 1;

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
              Council staff paid £100,000 or more, from published lists
            </p>
            <p className="type-display font-semibold tabular-nums mb-2">
              {totalStaff.toLocaleString('en-GB')}
            </p>
            <p className="type-body-sm text-muted-foreground">
              Across {councilsWithAny} of the {councilsDisclosing} councils that
              publish a salary list. Middle (median) per council:{' '}
              {medianPerCouncil}.
            </p>
          </div>
        }
      >
        <section className="card-elevated p-5 sm:p-6">
          <h2 className="type-title-2 mb-1">
            Ranked across the {councilsDisclosing} councils that publish a list
          </h2>
          <p className="type-body-sm text-muted-foreground mb-6">
            Ranked by the total number of staff in the £100,000-and-above bands.
            Big unitaries and county councils tend to appear because they
            employ the most people. 10 councils have not yet published their
            list, so they are not in this ranking.
          </p>

          <RankedBarList>
            {top.map((e, i) => (
              <RankedBarRow
                key={e.council.ons_code}
                rank={i + 1}
                title={getCouncilDisplayName(e.council)}
                href={`/council/${getCouncilSlug(e.council)}`}
                value={e.count.toLocaleString('en-GB')}
                subLeft={e.council.type_name}
                fillPct={(e.count / maxCount) * 100}
              />
            ))}
          </RankedBarList>

          <p className="type-caption text-muted-foreground mt-6 pt-4 border-t border-border/50">
            How we got this: under the Local Government Transparency Code, each
            council publishes staff salaries in £5,000 bands, starting at
            £50,000. We add up every band that starts at £100,000 or higher.
            Pension and benefits are not included.
          </p>
        </section>
      </InsightHero>
    </>
  );
}
