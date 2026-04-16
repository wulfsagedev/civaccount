import type { Metadata } from 'next';
import Link from 'next/link';
import { InsightHero } from '@/components/insights/InsightHero';
import { getInsightCard } from '@/data/insights';
import { getCapEveryYear } from '@/lib/insights-stats';
import { getCouncilDisplayName, getCouncilSlug } from '@/data/councils';
import { buildFAQPageSchema, buildBreadcrumbSchema } from '@/lib/structured-data';

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
  const { bothYearsAtCap, bothYearsOverCap, councilsWithData } = getCapEveryYear(4.99);

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
              English councils at the 4.99% cap in both 2024-25 and 2025-26
            </p>
            <p className="type-display font-semibold tabular-nums mb-2">
              {bothYearsAtCap.length}
            </p>
            <p className="type-body-sm text-muted-foreground">
              Out of {councilsWithData} councils with rates on record for all
              three years. {bothYearsOverCap.length} strictly exceeded 4.99% in
              both years — the group that needed special government permission
              to do so.
            </p>
          </div>
        }
      >
        <section className="card-elevated p-5 sm:p-6">
          <h2 className="type-title-2 mb-1">Consistent cap-hitters</h2>
          <p className="type-body-sm text-muted-foreground mb-6">
            Ranked by the compound 2-year rise. Every council listed here raised
            Band D by 4.99% or more in both 2024-25 and 2025-26.
          </p>

          <div className="divide-y divide-border/40">
            {bothYearsAtCap.map((e, i) => {
              const name = getCouncilDisplayName(e.council);
              const slug = getCouncilSlug(e.council);
              const overBoth = e.rise2024 > 4.99 && e.rise2025 > 4.99;
              return (
                <div
                  key={e.council.ons_code}
                  className="flex items-baseline justify-between py-3 first:pt-0 last:pb-0"
                >
                  <div className="min-w-0 pr-4">
                    <Link
                      href={`/council/${slug}`}
                      className="type-body font-semibold hover:underline"
                    >
                      {i + 1}. {name}
                    </Link>
                    <p className="type-caption text-muted-foreground tabular-nums">
                      2024: +{e.rise2024.toFixed(2)}% · 2025: +
                      {e.rise2025.toFixed(2)}%
                      {overBoth && ' · above cap both years'}
                    </p>
                  </div>
                  <span className="type-body font-semibold tabular-nums">
                    +{e.compoundPct.toFixed(1)}%
                  </span>
                </div>
              );
            })}
          </div>

          <p className="type-caption text-muted-foreground mt-6 pt-4 border-t border-border/50">
            How we got this: we read the 2023-24, 2024-25 and 2025-26 Band D
            rates from GOV.UK, compute each year&rsquo;s rise rounded to 2 dp
            (to match how councils publish the figure), and keep councils where
            both 2024-25 and 2025-26 rises cleared 4.99%. The compound column
            multiplies the two rates — it is not the sum of the yearly rises.
          </p>
        </section>
      </InsightHero>
    </>
  );
}
