import type { Metadata } from 'next';
import Link from 'next/link';
import { InsightHero } from '@/components/insights/InsightHero';
import { getInsightCard } from '@/data/insights';
import { getThreeYearSqueeze } from '@/lib/insights-stats';
import { getCouncilDisplayName, getCouncilSlug } from '@/data/councils';
import { buildFAQPageSchema, buildBreadcrumbSchema } from '@/lib/structured-data';

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
  const { top, medianPct, meanPct, councilsWithData } = getThreeYearSqueeze(20);
  const max = top[0]?.changePct ?? 1;

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
              National median Band D rise over 2 years (compounded)
            </p>
            <p className="type-display font-semibold tabular-nums mb-2">
              +{medianPct.toFixed(1)}%
            </p>
            <p className="type-body-sm text-muted-foreground">
              Across all {councilsWithData} English councils with 2023-24 and
              2025-26 rates on record. Mean: +{meanPct.toFixed(1)}%. The top of
              the league has compounded past +{top[0].changePct.toFixed(0)}%.
            </p>
          </div>
        }
      >
        <section className="card-elevated p-5 sm:p-6">
          <h2 className="type-title-2 mb-1">Biggest 2-year rises</h2>
          <p className="type-body-sm text-muted-foreground mb-6">
            Ranked by compound Band D rise from 2023-24 to 2025-26. Adding the
            two yearly percentages understates the real increase — these are
            multiplied, not summed.
          </p>

          <div className="space-y-4">
            {top.map((r, i) => {
              const name = getCouncilDisplayName(r.council);
              const slug = getCouncilSlug(r.council);
              const widthPct = (r.changePct / max) * 100;
              return (
                <div key={r.council.ons_code}>
                  <div className="flex items-baseline justify-between mb-1.5">
                    <Link
                      href={`/council/${slug}`}
                      className="type-body-sm font-medium hover:underline"
                    >
                      {i + 1}. {name}
                    </Link>
                    <span className="type-body-sm font-semibold tabular-nums">
                      +{r.changePct.toFixed(1)}%
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-foreground"
                      style={{ width: `${widthPct}%` }}
                    />
                  </div>
                  <p className="type-caption text-muted-foreground tabular-nums mt-1.5">
                    £{r.from.toFixed(0)} → £{r.to.toFixed(0)} · +£
                    {r.changeAbs.toFixed(0)} a year
                  </p>
                </div>
              );
            })}
          </div>

          <p className="type-caption text-muted-foreground mt-6 pt-4 border-t border-border/50">
            How we got this: we read each council&rsquo;s 2023-24 and 2025-26
            Band D rate from GOV.UK and compute the compound rise as
            (rate<sub>2025</sub> ÷ rate<sub>2023</sub>) − 1. All 317 English
            councils are in the league — both rates are on the record for every
            one.
          </p>
        </section>
      </InsightHero>
    </>
  );
}
