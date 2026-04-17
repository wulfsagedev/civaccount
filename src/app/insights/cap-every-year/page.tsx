import type { Metadata } from 'next';
import { InsightHero } from '@/components/insights/InsightHero';
import { RankedBarList, RankedBarRow } from '@/components/insights/RankedBarRow';
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
              English councils that hit the 4.99% cap in both 2024-25 and 2025-26
            </p>
            <p className="type-display font-semibold tabular-nums mb-2">
              {bothYearsAtCap.length}
            </p>
            <p className="type-body-sm text-muted-foreground">
              Out of the {councilsWithData} councils with rates on record for
              all three years. {bothYearsOverCap.length} went above 4.99% in
              both years — the group that needed special permission from
              government to do so.
            </p>
          </div>
        }
      >
        <section className="card-elevated p-5 sm:p-6">
          <h2 className="type-title-2 mb-1">Two years at the cap</h2>
          <p className="type-body-sm text-muted-foreground mb-6">
            Ranked by the combined 2-year rise. Every council listed here put
            Band D up by 4.99% or more in both 2024-25 and 2025-26.
          </p>

          <RankedBarList>
            {bothYearsAtCap.map((e, i) => {
              const overBoth = e.rise2024 > 4.99 && e.rise2025 > 4.99;
              return (
                <RankedBarRow
                  key={e.council.ons_code}
                  rank={i + 1}
                  title={getCouncilDisplayName(e.council)}
                  href={`/council/${getCouncilSlug(e.council)}`}
                  value={`+${e.compoundPct.toFixed(1)}%`}
                  subLeft={`2024: +${e.rise2024.toFixed(2)}% · 2025: +${e.rise2025.toFixed(2)}%${overBoth ? ' · above cap both years' : ''}`}
                />
              );
            })}
          </RankedBarList>

          <p className="type-caption text-muted-foreground mt-6 pt-4 border-t border-border/50">
            How we got this: we take the 2023-24, 2024-25 and 2025-26 Band D
            rates from GOV.UK, work out each year&rsquo;s rise rounded to 2
            decimal places (to match how councils publish it) and keep the
            councils where both 2024-25 and 2025-26 rises cleared 4.99%. The
            combined column multiplies the two rises together — it is not the
            two yearly rises added up.
          </p>
        </section>
      </InsightHero>
    </>
  );
}
