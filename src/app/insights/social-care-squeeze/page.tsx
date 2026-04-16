import type { Metadata } from 'next';
import Link from 'next/link';
import { InsightHero } from '@/components/insights/InsightHero';
import { getInsightCard } from '@/data/insights';
import { getSocialCareSqueeze } from '@/lib/insights-stats';
import {
  formatCurrency,
  getCouncilDisplayName,
  getCouncilSlug,
} from '@/data/councils';
import { buildFAQPageSchema, buildBreadcrumbSchema } from '@/lib/structured-data';

const card = getInsightCard('social-care-squeeze')!;

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

function formatShort(pounds: number): string {
  if (pounds >= 1_000_000_000) return `£${(pounds / 1_000_000_000).toFixed(1)}bn`;
  if (pounds >= 1_000_000) return `£${(pounds / 1_000_000).toFixed(1)}m`;
  return formatCurrency(pounds, { decimals: 0 });
}

export default function Page() {
  const {
    nationalPct,
    medianPct,
    top,
    over60pct,
    over70pct,
    councilsWithData,
  } = getSocialCareSqueeze(10);
  const maxPct = top[0]?.squeezePct ?? 1;

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
              Of every £1 councils spend, this much goes on adult and children&rsquo;s care
            </p>
            <p className="type-display font-semibold tabular-nums mb-2">
              {nationalPct.toFixed(0)}p
            </p>
            <p className="type-body-sm text-muted-foreground">
              Median council: {medianPct.toFixed(0)}%. {over60pct} councils spend
              over 60% of their budget on care; {over70pct} spend over 70%.
              Based on {councilsWithData} councils that deliver both services.
            </p>
          </div>
        }
      >
        <section className="card-elevated p-5 sm:p-6">
          <h2 className="type-title-2 mb-1">Most squeezed councils</h2>
          <p className="type-body-sm text-muted-foreground mb-6">
            Ranked by combined adult and children&rsquo;s care as a share of net
            service spend.
          </p>

          <div className="">
            {top.map((entry, i) => {
              const name = getCouncilDisplayName(entry.council);
              const slug = getCouncilSlug(entry.council);
              const pct = (entry.squeezePct / maxPct) * 100;
              return (
                <div key={entry.council.ons_code} className="py-4 border-b border-border/30 last:border-b-0 first:pt-0 last:pb-0">
                  <div className="flex items-baseline justify-between mb-1">
                    <Link
                      href={`/council/${slug}`}
                      className="type-body font-semibold hover:underline"
                    >
                      {i + 1}. {name}
                    </Link>
                    <span className="type-body font-semibold tabular-nums">
                      {entry.squeezePct.toFixed(0)}%
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between mb-2">
                    <span className="type-caption text-muted-foreground tabular-nums">
                      Care spend {formatShort(entry.careSpend)} of{' '}
                      {formatShort(entry.totalSpend)}
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
            How we got this: (adult social care + children&rsquo;s social care) ÷
            total net service spend from each council&rsquo;s published budget.
            District councils don&rsquo;t deliver these services and are excluded
            from this league.
          </p>
        </section>
      </InsightHero>
    </>
  );
}
