import type { Metadata } from 'next';
import Link from 'next/link';
import { InsightHero } from '@/components/insights/InsightHero';
import { getInsightCard } from '@/data/insights';
import { getThreeYearSqueeze } from '@/lib/insights-stats';
import {
  formatCurrency,
  getCouncilDisplayName,
  getCouncilSlug,
} from '@/data/councils';
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
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <InsightHero
        entry={card}
        hero={
          <div>
            <p className="type-caption text-muted-foreground mb-1">
              Typical extra on a Band D bill vs 2023-24
            </p>
            <p className="type-display font-semibold tabular-nums mb-2">
              +{formatCurrency(Math.round(medianAbs), { decimals: 0 })} a year
            </p>
            <p className="type-body-sm text-muted-foreground">
              The median English council — across all {councilsWithData} with
              2023-24 and 2025-26 rates on record. Mean: +
              {formatCurrency(Math.round(meanAbs), { decimals: 0 })}. The
              biggest rise is {topCouncilName}, where Band D is now +
              {formatCurrency(Math.round(top[0].changeAbs), { decimals: 0 })} a
              year.
            </p>
          </div>
        }
      >
        <section className="card-elevated p-5 sm:p-6">
          <h2 className="type-title-2 mb-1">Biggest 2-year rises, in pounds</h2>
          <p className="type-body-sm text-muted-foreground mb-6">
            Ranked by how much more a Band D household pays per year now than
            in 2023-24. Councils with higher starting bills tend to rise by
            more in pounds, even if the percentage is similar.
          </p>

          <div>
            {top.map((r, i) => {
              const name = getCouncilDisplayName(r.council);
              const slug = getCouncilSlug(r.council);
              const widthPct = (r.changeAbs / max) * 100;
              return (
                <div
                  key={r.council.ons_code}
                  className="py-4 first:pt-0 last:pb-0 border-t border-border/40 first:border-t-0"
                >
                  {/* Row 1: Council + £ amount (both bold) */}
                  <div className="flex items-baseline justify-between mb-1">
                    <Link
                      href={`/council/${slug}`}
                      className="type-body font-semibold! leading-tight! min-h-0! min-w-0! hover:underline"
                    >
                      {i + 1}. {name}
                    </Link>
                    <span className="type-body font-semibold! leading-tight! tabular-nums">
                      +{formatCurrency(Math.round(r.changeAbs), { decimals: 0 })}
                    </span>
                  </div>
                  {/* Row 2: Range + % (both muted) */}
                  <div className="flex items-baseline justify-between mb-1">
                    <p className="type-caption text-muted-foreground tabular-nums">
                      {formatCurrency(r.from, { decimals: 0 })} →{' '}
                      {formatCurrency(r.to, { decimals: 0 })} a year
                    </p>
                    <span className="type-caption text-muted-foreground tabular-nums">
                      up {r.changePct.toFixed(1)}%
                    </span>
                  </div>
                  {/* Row 3: Bar */}
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-foreground"
                      style={{ width: `${widthPct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <p className="type-caption text-muted-foreground mt-6 pt-4 border-t border-border/50">
            How we got this: we read each council&rsquo;s 2023-24 and 2025-26
            headline Band D rate from GOV.UK and subtract one from the other.
            All 317 English councils are in the league — both rates are on the
            public record for every one. Councils that start from a higher base
            naturally show bigger £ rises even at similar percentages.
          </p>
        </section>
      </InsightHero>
    </>
  );
}
