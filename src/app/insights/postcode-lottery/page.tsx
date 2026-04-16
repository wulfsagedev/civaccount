import type { Metadata } from 'next';
import Link from 'next/link';
import { InsightHero } from '@/components/insights/InsightHero';
import { getInsightCard } from '@/data/insights';
import { getExtremesByGroup, getHeadlineExtremes } from '@/lib/insights-stats';
import {
  councils,
  formatCurrency,
  getCouncilDisplayName,
  getCouncilSlug,
} from '@/data/councils';
import { buildFAQPageSchema, buildBreadcrumbSchema } from '@/lib/structured-data';

const card = getInsightCard('postcode-lottery')!;

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
  const { cheapest, mostExpensive } = getHeadlineExtremes();
  const groups = getExtremesByGroup();

  const cheapestBandD = cheapest.council_tax!.band_d_2025;
  const priciestBandD = mostExpensive.council_tax!.band_d_2025;
  const gap = priciestBandD - cheapestBandD;

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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="rounded-lg bg-muted/30 p-4">
              <p className="type-caption text-positive font-semibold mb-1">Cheapest</p>
              <p className="type-metric tabular-nums mb-1">
                {formatCurrency(cheapestBandD, { decimals: 0 })}
              </p>
              <p className="type-body-sm font-medium">
                <Link
                  href={`/council/${getCouncilSlug(cheapest)}`}
                  className="hover:underline"
                >
                  {getCouncilDisplayName(cheapest)}
                </Link>
              </p>
            </div>
            <div className="rounded-lg bg-muted/30 p-4">
              <p className="type-caption text-negative font-semibold mb-1">Most expensive</p>
              <p className="type-metric tabular-nums mb-1">
                {formatCurrency(priciestBandD, { decimals: 0 })}
              </p>
              <p className="type-body-sm font-medium">
                <Link
                  href={`/council/${getCouncilSlug(mostExpensive)}`}
                  className="hover:underline"
                >
                  {getCouncilDisplayName(mostExpensive)}
                </Link>
              </p>
            </div>
            <p className="type-body-sm text-muted-foreground sm:col-span-2">
              A Band D gap of {formatCurrency(gap, { decimals: 0 })} between the
              cheapest and most expensive all-in-one councils in 2025-26.
            </p>
          </div>
        }
      >
        {groups.map((group) => {
          const groupCouncils = councils
            .filter(
              (c) =>
                group.types.includes(c.type) && c.council_tax?.band_d_2025,
            )
            .sort(
              (a, b) =>
                a.council_tax!.band_d_2025 - b.council_tax!.band_d_2025,
            );

          const cheapestRows = groupCouncils.slice(0, 5);
          const priciestRows = groupCouncils.slice(-5).reverse();
          const maxBandD =
            groupCouncils[groupCouncils.length - 1]?.council_tax!.band_d_2025 ??
            1;

          const Row = ({
            council,
            rank,
            variant,
          }: {
            council: (typeof groupCouncils)[number];
            rank: number;
            variant: 'cheap' | 'pricey';
          }) => {
            const bandD = council.council_tax!.band_d_2025;
            const barWidth = (bandD / maxBandD) * 100;
            const slug = getCouncilSlug(council);
            const name = getCouncilDisplayName(council);
            return (
              <div>
                <div className="flex items-baseline justify-between mb-1.5">
                  <Link
                    href={`/council/${slug}`}
                    className="type-body-sm font-medium hover:text-foreground transition-colors"
                  >
                    {rank}. {name}
                  </Link>
                  <span className="type-body-sm font-semibold tabular-nums">
                    {formatCurrency(bandD, { decimals: 2 })}
                  </span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      variant === 'cheap' ? 'bg-foreground' : 'bg-foreground'
                    }`}
                    style={{ width: `${barWidth}%` }}
                  />
                </div>
              </div>
            );
          };

          return (
            <section key={group.label} className="card-elevated p-5 sm:p-6 mb-5">
              <h2 className="type-title-2 mb-1">{group.label}</h2>
              <p className="type-body-sm text-muted-foreground mb-6">
                {group.description}
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="type-caption text-muted-foreground font-semibold uppercase mb-3">
                    Cheapest 5
                  </p>
                  <div className="space-y-4">
                    {cheapestRows.map((c, i) => (
                      <Row
                        key={c.ons_code}
                        council={c}
                        rank={i + 1}
                        variant="cheap"
                      />
                    ))}
                  </div>
                </div>
                <div>
                  <p className="type-caption text-muted-foreground font-semibold uppercase mb-3">
                    Most expensive 5
                  </p>
                  <div className="space-y-4">
                    {priciestRows.map((c, i) => (
                      <Row
                        key={c.ons_code}
                        council={c}
                        rank={groupCouncils.length - i}
                        variant="pricey"
                      />
                    ))}
                  </div>
                </div>
              </div>
            </section>
          );
        })}
      </InsightHero>
    </>
  );
}
