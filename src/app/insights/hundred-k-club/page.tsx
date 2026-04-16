import type { Metadata } from 'next';
import Link from 'next/link';
import { InsightHero } from '@/components/insights/InsightHero';
import { getInsightCard } from '@/data/insights';
import { getHundredKClub } from '@/lib/insights-stats';
import { getCouncilDisplayName, getCouncilSlug } from '@/data/councils';
import { buildFAQPageSchema, buildBreadcrumbSchema } from '@/lib/structured-data';

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
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <InsightHero
        entry={card}
        hero={
          <div>
            <p className="type-caption text-muted-foreground mb-1">
              Disclosed council staff earning £100,000 or more
            </p>
            <p className="type-display font-semibold tabular-nums mb-2">
              {totalStaff.toLocaleString('en-GB')}
            </p>
            <p className="type-body-sm text-muted-foreground">
              Across {councilsWithAny} of {councilsDisclosing} councils that
              publish salary bands. Median per disclosing council:{' '}
              {medianPerCouncil}.
            </p>
          </div>
        }
      >
        <section className="card-elevated p-5 sm:p-6">
          <h2 className="type-title-2 mb-1">
            Ranked among the {councilsDisclosing} disclosing councils
          </h2>
          <p className="type-body-sm text-muted-foreground mb-6">
            Ranked by total disclosed staff in the £100,000+ bands. Large
            unitaries and county councils tend to appear because they employ
            the most people. 10 councils have not published their bands yet —
            this ranking only covers the {councilsDisclosing} that have.
          </p>

          <div className="space-y-5">
            {top.map((e, i) => {
              const name = getCouncilDisplayName(e.council);
              const slug = getCouncilSlug(e.council);
              const pct = (e.count / maxCount) * 100;
              return (
                <div key={e.council.ons_code}>
                  <div className="flex items-baseline justify-between mb-1">
                    <Link
                      href={`/council/${slug}`}
                      className="type-body font-semibold hover:underline"
                    >
                      {i + 1}. {name}
                    </Link>
                    <span className="type-body font-semibold tabular-nums">
                      {e.count.toLocaleString('en-GB')}
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-foreground"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <p className="type-caption text-muted-foreground mt-6 pt-4 border-t border-border/50">
            How we got this: each council publishes staff salaries in £5,000
            bands starting at £50,000 under the Local Government Transparency
            Code. We count all bands whose lower bound is £100,000 or higher.
            Pension and benefits are not included.
          </p>
        </section>
      </InsightHero>
    </>
  );
}
