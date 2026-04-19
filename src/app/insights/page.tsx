import type { Metadata } from 'next';
import Link from 'next/link';
import Breadcrumb from '@/components/proposals/Breadcrumb';
import { PageContainer } from '@/components/ui/page-container';
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
  title: "How English councils spend your money · CivAccount",
  description:
    "Where English council spending goes each year, who gets it, and which councils are under the most financial pressure. Data on all 317 English councils, from GOV.UK.",
  alternates: { canonical: '/insights' },
  openGraph: {
    title: 'How English councils spend your money',
    description:
      "All 317 English councils, in plain English: the bill, where it goes, who is paid, and where money is tight.",
  },
  twitter: {
    card: 'summary_large_image',
    title: 'How English councils spend your money',
    description:
      "All 317 English councils, in plain English: the bill, where it goes, who is paid, and where money is tight.",
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
      explainer: `The gap between England's cheapest and most expensive Band D council tax bill for 2025-26.`,
    },
    'biggest-tax-rises': {
      hero: `+${rises[0]?.changePct.toFixed(1)}%`,
      explainer: `${getCouncilDisplayName(rises[0].council)} raised Band D the most. ${overCap} councils went up by 4.99% or more. National average rise: ${avgRise.toFixed(1)}%.`,
    },
    'three-year-squeeze': {
      hero: `+${formatCurrency(Math.round(threeYear.top[0].changeAbs), { decimals: 0 })}`,
      explainer: `A Band D household in ${getCouncilDisplayName(threeYear.top[0].council)} now pays ${formatCurrency(Math.round(threeYear.top[0].changeAbs), { decimals: 0 })} more per year than in 2023-24 — the biggest rise. Middle (median) English council: ${formatCurrency(Math.round(threeYear.medianAbs), { decimals: 0 })} more per year.`,
    },
    'where-every-pound-goes': {
      hero: `${topService.pence.toFixed(0)}p`,
      explainer: `Of every £1, this much goes on ${topService.name.toLowerCase()} — the biggest single item. ${secondService.name} takes ${secondService.pence.toFixed(0)}p.`,
    },
    'social-care-squeeze': {
      hero: `${care.nationalPct.toFixed(0)}p`,
      explainer: `Of every £1 councils spend, this much goes on adult and children's care. ${care.over60pct} councils spend more than 60% of their budget on care.`,
    },
    'top-suppliers': {
      hero: formatShort(suppliers.totalAggregateSpend),
      explainer: `Total yearly spend with the top 10 private companies paid by English councils — ${suppliers.top[0]?.name} is at the top.`,
    },
    'big-five-outsourcers': {
      hero: `${bigFive.sharePct.toFixed(0)}%`,
      explainer: `Share of published top-supplier spend going to Capita, Serco, Veolia, Biffa and Amey combined — about ${formatShort(bigFive.combinedSpend)}.`,
    },
    'ceo-pay-league': {
      hero: formatCurrency(ceo.highestPaid.total, { decimals: 0 }),
      explainer: `Highest total pay for a council CEO — ${getCouncilDisplayName(ceo.highestPaid.council)}. Middle (median) figure for England: ${formatCurrency(ceo.median, { decimals: 0 })}.`,
    },
    'hundred-k-club': {
      hero: hundredK.totalStaff.toLocaleString('en-GB'),
      explainer: `Council staff paid £100,000 or more, across ${hundredK.councilsWithAny} of the ${hundredK.councilsDisclosing} councils that publish a salary list. Middle (median) per council: ${hundredK.medianPerCouncil}.`,
    },
    'closest-to-bankruptcy': {
      hero: formatShort(bankruptcy.top[0]?.gapPounds ?? 0),
      explainer: `Biggest budget gap in pounds — ${getCouncilDisplayName(bankruptcy.top[0].council)}. ${bankruptcy.over10pct} councils have a gap of 10% or more of their net budget.`,
    },
    'tax-cap-breakers': {
      hero: `${capBreakers.atOrOverCap.length}`,
      explainer: `Councils that raised Band D by 4.99% or more in 2025-26. ${capBreakers.overCap.length} went above the cap, with special permission from government.`,
    },
    'cap-every-year': {
      hero: `${capEvery.bothYearsAtCap.length}`,
      explainer: `Councils that pushed Band D to 4.99% or more in BOTH 2024-25 and 2025-26 — a longer-term sign of pressure. ${capEvery.bothYearsOverCap.length} went above the cap in both years.`,
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
      answer: `English councils together plan to spend about ${formatShort(spend.totalSpend)} on services in 2025-26 — about ${formatShort(spend.spendPerPerson)} per resident.`,
    },
    {
      question: 'Which private companies are paid the most by English councils?',
      answer: "We add up each council's published top supplier list to show the biggest private companies paid by councils across England. See the 'Biggest companies paid by councils' card.",
    },
    {
      question: 'Which councils are closest to bankruptcy?',
      answer: "The councils with the biggest budget gaps are ranked on the 'Closest to bankruptcy' card. A budget gap is not the same as the council going bust — most councils close their gap each year.",
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
      <PageContainer>
        <Breadcrumb
          items={[{ label: 'Home', href: '/' }, { label: 'Insights' }]}
        />

        <div className="flex items-start justify-between gap-4 mb-2">
          <h1 className="type-title-1 font-semibold">
            How English councils spend your money
          </h1>
          <div className="shrink-0 pt-1">
            <PageShareButton
              title="How English councils spend your money — CivAccount"
              description={`£${(spend.totalSpend / 1_000_000_000).toFixed(1)} billion — what English councils plan to spend this year`}
            />
          </div>
        </div>
        <p className="type-body-sm text-muted-foreground mb-8">
          One card per question. All 317 English councils. Every number comes
          from GOV.UK or the council&rsquo;s own website.
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
            Across {spend.councilCount} councils — about {formatShort(spend.spendPerPerson)} per resident. The cards below show what it pays for.
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

        {/* Related pillar guides — topical-authority internal links */}
        <section className="mt-12">
          <h2 className="type-title-2 font-semibold mb-1">Plain-English guides</h2>
          <p className="type-body-sm text-muted-foreground mb-5">
            Background reading on how council finances actually work.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Link
              href="/guide/council-tax"
              className="card-elevated p-4 hover:bg-muted/30 transition-colors cursor-pointer"
            >
              <p className="type-body-sm font-semibold mb-1">The complete guide to council tax</p>
              <p className="type-caption text-muted-foreground">Bands, caps, exemptions, and how the bill is set.</p>
            </Link>
            <Link
              href="/guide/council-spending"
              className="card-elevated p-4 hover:bg-muted/30 transition-colors cursor-pointer"
            >
              <p className="type-body-sm font-semibold mb-1">How UK councils spend your money</p>
              <p className="type-caption text-muted-foreground">Service categories, statutory vs discretionary, reserves.</p>
            </Link>
            <Link
              href="/guide/council-leadership"
              className="card-elevated p-4 hover:bg-muted/30 transition-colors cursor-pointer"
            >
              <p className="type-body-sm font-semibold mb-1">Who runs your council</p>
              <p className="type-caption text-muted-foreground">Council types, leaders, cabinets, CEOs, allowances.</p>
            </Link>
            <Link
              href="/guide/local-democracy"
              className="card-elevated p-4 hover:bg-muted/30 transition-colors cursor-pointer"
            >
              <p className="type-body-sm font-semibold mb-1">How to influence your council</p>
              <p className="type-caption text-muted-foreground">Meetings, FOI, proposals, voting, and Town Hall.</p>
            </Link>
          </div>
        </section>

        {/* Methodology + sources footer */}
        <section className="card-elevated p-5 sm:p-6 mt-12">
          <h2 className="type-title-2 mb-1">How we built this</h2>
          <p className="type-body-sm text-muted-foreground mb-4">
            Every number comes from a .gov.uk source — either a national GOV.UK
            dataset or each council&rsquo;s own website. Each card shows both ends
            of the ranking and the middle (median) figure for England, so you
            can see the full spread — not just the extremes. Every sub-page
            shows exactly how we got the number.
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
      </PageContainer>
    </>
  );
}
