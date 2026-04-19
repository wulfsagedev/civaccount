import type { Metadata } from 'next';
import { InsightHero } from '@/components/insights/InsightHero';
import { RankedBarList, RankedBarRow } from '@/components/insights/RankedBarRow';
import { getInsightCard } from '@/data/insights';
import { getSocialCareSqueeze } from '@/lib/insights-stats';
import {
  formatCurrency,
  getCouncilDisplayName,
  getCouncilSlug,
} from '@/data/councils';
import { buildFAQPageSchema, buildBreadcrumbSchema } from '@/lib/structured-data';
import { serializeJsonLd } from '@/lib/safe-json-ld';

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
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
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
              Middle (median) council: {medianPct.toFixed(0)}%. {over60pct} councils spend
              more than 60% of their budget on care; {over70pct} spend more than 70%.
              Based on the {councilsWithData} councils that run both services.
            </p>
          </div>
        }
      >
        <section className="card-elevated p-5 sm:p-6">
          <h2 className="type-title-2 mb-1">Councils with the biggest care share</h2>
          <p className="type-body-sm text-muted-foreground mb-6">
            Ranked by adult and children&rsquo;s care combined, as a share of net
            spend on services.
          </p>

          <RankedBarList>
            {top.map((entry, i) => (
              <RankedBarRow
                key={entry.council.ons_code}
                rank={i + 1}
                title={getCouncilDisplayName(entry.council)}
                href={`/council/${getCouncilSlug(entry.council)}`}
                value={`${entry.squeezePct.toFixed(0)}%`}
                subLeft={`Care spend ${formatShort(entry.careSpend)} of ${formatShort(entry.totalSpend)}`}
                fillPct={(entry.squeezePct / maxPct) * 100}
              />
            ))}
          </RankedBarList>

          <p className="type-caption text-muted-foreground mt-6 pt-4 border-t border-border/50">
            How we got this: (adult social care + children&rsquo;s social care) ÷
            total net spend on services, taken from each council&rsquo;s published
            budget. District councils don&rsquo;t run these services, so they are
            not in this ranking.
          </p>
        </section>
      </InsightHero>
    </>
  );
}
