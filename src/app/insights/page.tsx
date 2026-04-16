import type { Metadata } from 'next';
import Breadcrumb from '@/components/proposals/Breadcrumb';
import { PageShareButton } from '@/components/ui/page-share-button';
import { InsightCard } from '@/components/insights/InsightCard';
import {
  INSIGHT_SECTIONS,
  getActiveSectionKeys,
  getCardsForSection,
  type InsightCardEntry,
} from '@/data/insights';
import {
  getAverageTaxRise,
  getBigFiveOutsourcers,
  getBiggestTaxRises,
  getCapEveryYear,
  getCeoPayStats,
  getClosestToBankruptcy,
  getCouncilsAtOrOverCap,
  getHeadlineExtremes,
  getHundredKClub,
  getNationalSpendStats,
  getSocialCareSqueeze,
  getTaxCapBreakers,
  getThreeYearSqueeze,
  getTopSuppliersNational,
  getWhereEveryPoundGoes,
} from '@/lib/insights-stats';
import { formatCurrency, getCouncilDisplayName } from '@/data/councils';
import {
  buildFAQPageSchema,
  buildBreadcrumbSchema,
} from '@/lib/structured-data';

export const metadata: Metadata = {
  title: "The state of English local government · CivAccount",
  description:
    "Where £X billion of English council spending goes each year, who gets it, and which councils are closest to financial trouble. Data on all 317 English councils, from GOV.UK.",
  alternates: { canonical: '/insights' },
  openGraph: {
    title: 'The state of English local government',
    description:
      'National insights across 317 English councils: the bill, the spend, the suppliers, the red flags.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'The state of English local government',
    description:
      'National insights across 317 English councils — bills, spending, suppliers, red flags.',
  },
};

function formatShort(pounds: number): string {
  if (pounds >= 1_000_000_000) return `£${(pounds / 1_000_000_000).toFixed(1)}bn`;
  if (pounds >= 1_000_000) return `£${(pounds / 1_000_000).toFixed(1)}m`;
  return formatCurrency(pounds, { decimals: 0 });
}

/** Hero + one-line explainer for each card tile on the hub. */
function buildTileStats(): Record<
  string,
  { hero: string; explainer: string }
> {
  const spend = getNationalSpendStats();
  const suppliers = getTopSuppliersNational(10);
  const lottery = getHeadlineExtremes();
  const rises = getBiggestTaxRises(1);
  const avgRise = getAverageTaxRise();
  const overCap = getCouncilsAtOrOverCap(4.99);
  const bankruptcy = getClosestToBankruptcy(1);
  const ceo = getCeoPayStats(1);
  const care = getSocialCareSqueeze(1);
  const pound = getWhereEveryPoundGoes();
  const bigFive = getBigFiveOutsourcers();
  const hundredK = getHundredKClub(1);
  const capBreakers = getTaxCapBreakers(4.99);
  const threeYear = getThreeYearSqueeze(1);
  const capEvery = getCapEveryYear(4.99);

  const cheapestBandD = lottery.cheapest.council_tax!.band_d_2025;
  const priciestBandD = lottery.mostExpensive.council_tax!.band_d_2025;
  const gap = priciestBandD - cheapestBandD;

  const topService = pound[0];
  const secondService = pound[1];

  return {
    'postcode-lottery': {
      hero: `${formatCurrency(gap, { decimals: 0 })}`,
      explainer: `The gap between England's cheapest and most expensive Band D council tax bill in 2025-26.`,
    },
    'biggest-tax-rises': {
      hero: `+${rises[0]?.changePct.toFixed(1)}%`,
      explainer: `${getCouncilDisplayName(rises[0].council)} raised Band D the most. ${overCap} councils went up by 4.99% or more. National average rise: ${avgRise.toFixed(1)}%.`,
    },
    'three-year-squeeze': {
      hero: `+${formatCurrency(Math.round(threeYear.top[0].changeAbs), { decimals: 0 })}`,
      explainer: `A Band D household in ${getCouncilDisplayName(threeYear.top[0].council)} now pays ${formatCurrency(Math.round(threeYear.top[0].changeAbs), { decimals: 0 })} more per year than in 2023-24 — the biggest jump. Typical English council: ${formatCurrency(Math.round(threeYear.medianAbs), { decimals: 0 })} more per year.`,
    },
    'where-every-pound-goes': {
      hero: `${topService.pence.toFixed(0)}p`,
      explainer: `Of every £1, this much goes on ${topService.name.toLowerCase()} — the single biggest item. ${secondService.name} takes ${secondService.pence.toFixed(0)}p.`,
    },
    'social-care-squeeze': {
      hero: `${care.nationalPct.toFixed(0)}p`,
      explainer: `Of every £1 councils spend, this much goes on adult and children's care. ${care.over60pct} councils spend over 60% of their budget on care.`,
    },
    'top-suppliers': {
      hero: formatShort(suppliers.totalAggregateSpend),
      explainer: `Aggregate annual spend with the top 10 private suppliers to English councils — ${suppliers.top[0]?.name} leads the list.`,
    },
    'big-five-outsourcers': {
      hero: `${bigFive.sharePct.toFixed(0)}%`,
      explainer: `Share of top-supplier spend going to Capita, Serco, Veolia, Biffa and Amey combined — about ${formatShort(bigFive.combinedSpend)} disclosed.`,
    },
    'ceo-pay-league': {
      hero: formatCurrency(ceo.highestPaid.total, { decimals: 0 }),
      explainer: `Highest total remuneration for a council CEO — ${getCouncilDisplayName(ceo.highestPaid.council)}. National median: ${formatCurrency(ceo.median, { decimals: 0 })}.`,
    },
    'hundred-k-club': {
      hero: hundredK.totalStaff.toLocaleString('en-GB'),
      explainer: `Council staff earning £100,000 or more across ${hundredK.councilsWithAny} of ${hundredK.councilsDisclosing} disclosing councils. Median per council: ${hundredK.medianPerCouncil}.`,
    },
    'closest-to-bankruptcy': {
      hero: formatShort(bankruptcy.top[0]?.gapPounds ?? 0),
      explainer: `Biggest budget gap in pounds — ${getCouncilDisplayName(bankruptcy.top[0].council)}. ${bankruptcy.over10pct} councils have a gap of 10% or more of their net budget.`,
    },
    'tax-cap-breakers': {
      hero: `${capBreakers.atOrOverCap.length}`,
      explainer: `Councils that raised Band D by 4.99% or more in 2025-26. ${capBreakers.overCap.length} exceeded the cap with special government permission.`,
    },
    'cap-every-year': {
      hero: `${capEvery.bothYearsAtCap.length}`,
      explainer: `Councils that pushed Band D to 4.99% or above in BOTH 2024-25 and 2025-26 — persistent cap pressure. ${capEvery.bothYearsOverCap.length} strictly exceeded the cap in both years.`,
    },
  };
}

export default function InsightsPage() {
  const spend = getNationalSpendStats();
  const activeSections = getActiveSectionKeys();
  const tileStats = buildTileStats();

  // Hub-level FAQ mirrors the hero + top card headlines.
  const faqs = [
    {
      question: 'How much do English councils spend in total?',
      answer: `English councils together plan to spend about ${formatShort(spend.totalSpend)} on services in 2025-26 — roughly ${formatShort(spend.spendPerPerson)} per resident.`,
    },
    {
      question: 'Who are the biggest private suppliers to English councils?',
      answer: 'CivAccount aggregates each council\'s published top supplier list to show the largest private contractors nationally. See the "Who really gets your council tax" card.',
    },
    {
      question: 'Which councils are closest to bankruptcy?',
      answer: 'Councils with the largest budget gaps as a share of their net service spend are ranked on the "Closest to bankruptcy" card. A budget gap is not the same as insolvency.',
    },
  ];

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      buildFAQPageSchema(faqs, '/insights'),
      buildBreadcrumbSchema(
        [{ name: 'Home', url: '/' }, { name: 'Insights' }],
        '/insights',
      ),
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <main
        id="main-content"
        className="flex-1 container mx-auto px-4 max-w-5xl py-8"
      >
        <Breadcrumb
          items={[{ label: 'Home', href: '/' }, { label: 'Insights' }]}
        />

        <div className="flex items-start justify-between gap-4 mb-2">
          <h1 className="type-title-1 font-semibold">
            The state of English local government
          </h1>
          <div className="shrink-0 pt-1">
            <PageShareButton
              title="The state of English local government — CivAccount"
              description={`£${(spend.totalSpend / 1_000_000_000).toFixed(1)} billion — what English councils will spend this year`}
            />
          </div>
        </div>
        <p className="type-body-sm text-muted-foreground mb-8">
          National insights across 317 English councils. Every card has a share
          button and a method line — no cherry-picking, no sensationalism.
        </p>

        {/* Hero — national total spend */}
        <section className="card-elevated p-5 sm:p-8 mb-10">
          <p className="type-caption text-muted-foreground font-semibold uppercase mb-2">
            Total English council spending · 2025-26
          </p>
          <p className="type-display font-semibold tabular-nums mb-2">
            {formatShort(spend.totalSpend)}
          </p>
          <p className="type-body-sm text-muted-foreground">
            Across {spend.councilCount} councils — about {formatShort(spend.spendPerPerson)} per resident. Everything below breaks that down.
          </p>
        </section>

        {/* Continuous 2-col card grid with full-width section headers */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {activeSections.flatMap((sectionKey) => {
            const section = INSIGHT_SECTIONS[sectionKey];
            const cards: InsightCardEntry[] = getCardsForSection(sectionKey);
            if (cards.length === 0) return [];
            return [
              <div
                key={`header-${sectionKey}`}
                className="sm:col-span-2 flex items-baseline justify-between mt-6 first:mt-0"
              >
                <h2 className="type-title-2 font-semibold">{section.label}</h2>
                <p className="type-body-sm text-muted-foreground">
                  {section.description}
                </p>
              </div>,
              ...cards.map((card, i) => {
                const stats = tileStats[card.slug];
                // When a section has an odd number of cards, stretch the final
                // card to span both columns so the row fills — no dangling gap.
                const isOddTail =
                  cards.length % 2 === 1 && i === cards.length - 1;
                return (
                  <InsightCard
                    key={card.slug}
                    slug={card.slug}
                    title={card.title}
                    subtitle={card.subtitle}
                    hero={stats?.hero ?? '—'}
                    explainer={stats?.explainer ?? card.metaDescription}
                    shareText={card.shareText}
                    className={isOddTail ? 'sm:col-span-2' : undefined}
                  />
                );
              }),
            ];
          })}
        </div>

        {/* Methodology + sources footer */}
        <section className="card-elevated p-5 sm:p-6 mt-12">
          <h2 className="type-title-2 mb-1">How we built this</h2>
          <p className="type-body-sm text-muted-foreground mb-4">
            Every number comes from a .gov.uk source — either central GOV.UK
            datasets or each council&rsquo;s own website. Cards show both ends of
            every league plus the national median so you see the spread, not
            just the extremes. Every sub-page explains exactly how we got the
            number.
          </p>
          <ul className="space-y-2 type-body-sm">
            <li>
              <a
                href="https://www.gov.uk/government/collections/council-tax-statistics"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium hover:underline"
              >
                Council Tax levels — GOV.UK
                <span className="sr-only"> (opens in new tab)</span>
              </a>
            </li>
            <li>
              <a
                href="https://www.gov.uk/government/collections/local-authority-revenue-expenditure-and-financing"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium hover:underline"
              >
                Local authority revenue expenditure and financing — GOV.UK
                <span className="sr-only"> (opens in new tab)</span>
              </a>
            </li>
            <li>
              <a
                href="https://www.gov.uk/government/publications/local-government-transparency-code-2015"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium hover:underline"
              >
                Local Government Transparency Code — GOV.UK
                <span className="sr-only"> (opens in new tab)</span>
              </a>
            </li>
          </ul>
        </section>
      </main>
    </>
  );
}
