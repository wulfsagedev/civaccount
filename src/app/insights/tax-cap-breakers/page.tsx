import type { Metadata } from 'next';
import { InsightHero } from '@/components/insights/InsightHero';
import { RankedBarList, RankedBarRow } from '@/components/insights/RankedBarRow';
import { getInsightCard } from '@/data/insights';
import { getTaxCapBreakers, getAverageAreaTaxRise } from '@/lib/insights-stats';
import { REFERENDUM_PRINCIPLES } from '@/data/referendum-principles';
import { getCouncilDisplayName, getCouncilSlug } from '@/data/councils';
import { buildFAQPageSchema, buildBreadcrumbSchema } from '@/lib/structured-data';
import { serializeJsonLd } from '@/lib/safe-json-ld';

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
  const { atOrOverCap, overCap, bespokeGranted, councilsWithData, year } =
    getTaxCapBreakers();
  const avgRise = getAverageAreaTaxRise();
  const principle = REFERENDUM_PRINCIPLES[year];

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
              Councils that raised Band D to the most they were allowed in {year}
            </p>
            <p className="type-display font-semibold tabular-nums mb-2">
              {atOrOverCap.length}
            </p>
            <p className="type-body-sm text-muted-foreground">
              Out of {councilsWithData} billing authorities with figures for both
              years. Average rise: {avgRise.toFixed(1)}%.
            </p>
          </div>
        }
      >
        <section className="card-elevated p-5 sm:p-6">
          <h2 className="type-title-2 mb-1">At their limit</h2>
          <p className="type-body-sm text-muted-foreground mb-6">
            Every council is measured against its own limit, not one national
            number. Social care authorities and district councils have different
            limits, and a few councils are granted a higher one.
          </p>

          <RankedBarList>
            {atOrOverCap.slice(0, 20).map((e, i) => (
              <RankedBarRow
                key={e.council.ons_code}
                rank={i + 1}
                title={getCouncilDisplayName(e.council)}
                href={`/council/${getCouncilSlug(e.council)}`}
                value={`+${e.risePct.toFixed(2)}%`}
                subLeft={`£${e.from.toFixed(0)} → £${e.to.toFixed(0)}`}
                subRight={`limit ${e.limitPct}%${e.bespoke ? ' (granted)' : ''}`}
              />
            ))}
          </RankedBarList>
        </section>

        {bespokeGranted.length > 0 && (
          <section className="card-elevated p-5 sm:p-6">
            <h2 className="type-title-2 mb-1">Granted a higher limit</h2>
            <p className="type-body-sm text-muted-foreground mb-6">
              Government let these councils raise Band D by more than others of
              their type in {year}. Being on this list does not mean a council
              broke a rule — it means it was allowed to go further, and the
              figure shows what it actually did.
            </p>

            <RankedBarList>
              {bespokeGranted.map((e) => (
                <RankedBarRow
                  key={e.council.ons_code}
                  title={getCouncilDisplayName(e.council)}
                  href={`/council/${getCouncilSlug(e.council)}`}
                  value={`+${e.risePct.toFixed(2)}%`}
                  subLeft={`Allowed up to ${e.limitPct}%, against ${e.standardPct}% for its type`}
                  subRight={e.atPermittedMaximum ? 'used it in full' : 'stayed under'}
                />
              ))}
            </RankedBarList>
          </section>
        )}

        <section className="card-elevated p-5 sm:p-6">
          <h2 className="type-title-2 mb-1">How the limit works</h2>
          <p className="type-body-sm text-muted-foreground mb-4">
            Each year government sets the rise at which a council would have to
            hold a local vote. A council can go right up to that point without
            asking anyone. The limit is not the same for everyone:
          </p>
          <ul className="type-body-sm text-muted-foreground space-y-2 mb-4">
            <li>
              <span className="font-semibold text-foreground">
                Councils that run social care
              </span>{' '}
              — {principle?.socialCarePct}% ({principle?.socialCarePct === 5 ? '3% plus a 2% charge for adult social care' : 'see the source below'}).
            </li>
            <li>
              <span className="font-semibold text-foreground">District councils</span>{' '}
              — £{principle?.districtAbsGbp} or {principle?.districtPct}%, whichever is
              the greater. They do not run social care.
            </li>
            <li>
              <span className="font-semibold text-foreground">A few councils</span>{' '}
              are granted a higher limit, listed above.
            </li>
          </ul>
          <p className="type-caption text-muted-foreground pt-4 border-t border-border/50">
            How we got this: we compare each council&rsquo;s Band D rate for the two
            years from GOV.UK, then measure the rise against that council&rsquo;s own
            limit. County councils are not billing authorities and set no area
            Band D, so they are not in this ranking.{' '}
            {principle && (
              <>
                Limits from{' '}
                <a
                  href={principle.source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-foreground"
                >
                  {principle.source.publisher}, {principle.source.title}, §
                  {principle.source.section}
                  <span className="sr-only"> (opens in new tab)</span>
                </a>
                : &ldquo;{principle.source.excerpt}&rdquo;
              </>
            )}
          </p>
        </section>
      </InsightHero>
    </>
  );
}
