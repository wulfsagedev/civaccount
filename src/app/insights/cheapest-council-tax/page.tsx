import type { Metadata } from 'next';
import Link from 'next/link';
import {
  councils,
  formatCurrency,
  getAreaBandD,
  getAreaBandDChange,
  getCouncilDisplayName,
  getCouncilSlug,
  CURRENT_TAX_YEAR,
  PREVIOUS_TAX_YEAR,
} from '@/data/councils';
import { RankedBarList, RankedBarRow } from '@/components/insights/RankedBarRow';
import { getAreaBillStats, getAverageAreaTaxRise, getAreaBillExtremes } from '@/lib/insights-stats';
import { TITLE_MAX, DESCRIPTION_MAX, pickWithinLimit } from '@/lib/seo-limits';
import { buildFAQPageSchema, buildBreadcrumbSchema, buildArticleSchema, buildWebPageSchema } from '@/lib/structured-data';
import Breadcrumb from '@/components/proposals/Breadcrumb';

// Title and description are generated from the same figures the page renders,
// via getAreaBillExtremes(), so the snippet Google shows can never contradict
// the page — and so both update themselves when new .gov.uk data lands.
//
// They lead with the answer on purpose. The old copy described the page ("Top
// 20 Cheapest") and ran to 242 characters, well past the ~160 Google renders,
// so the tail was cut and the searcher got no reason to click. Naming the
// council and the figure is also what makes a page quotable by AI answer
// engines rather than merely relevant to them.
export function generateMetadata(): Metadata {
  const extremes = getAreaBillExtremes();
  // Short name for the title (tight budget), full display name for the
  // description (room to be precise). Using the display name in the title
  // would push 218 of 317 councils past 60 characters; the short name pushes
  // only one.
  const shortName = extremes.cheapest.name;
  const name = getCouncilDisplayName(extremes.cheapest);
  const amount = formatCurrency(extremes.cheapestValue, { decimals: 0 });

  // Best-first. Every tier still leads with the answer except the last, which
  // exists only so a pathologically long council name cannot produce a title
  // Google would cut mid-word.
  const title = pickWithinLimit(
    [
      `Cheapest Council Tax in England ${extremes.year}: ${shortName} ${amount}`,
      `${shortName}: Cheapest Council Tax in England ${extremes.year}`,
      `${shortName}: Cheapest Council Tax in England`,
      `Cheapest Council Tax in England ${extremes.year}: Full Rankings`,
    ],
    TITLE_MAX,
  );

  const description = pickWithinLimit(
    [
      `${name} charges England's lowest Band D council tax in ${extremes.year} at ${amount}. See the 20 cheapest councils, sourced from .gov.uk.`,
      `The lowest Band D council tax in England for ${extremes.year}, ranked across all ${extremes.count} billing authorities. Sourced from .gov.uk.`,
    ],
    DESCRIPTION_MAX,
  );

  const social = `Which council charges England's lowest council tax in ${extremes.year}? ${name}, at ${amount}.`;

  return {
    title,
    description,
    alternates: { canonical: '/insights/cheapest-council-tax' },
    openGraph: { title, description: social },
    twitter: { card: 'summary_large_image', title, description: social },
  };
}

import { COMPARABLE_GROUPS } from '@/lib/council-averages';
import { serializeJsonLd } from '@/lib/safe-json-ld';

const GROUPS = COMPARABLE_GROUPS.map(g => ({
  label: g.label,
  subtitle: g.description,
  types: g.types as unknown as string[],
}));

export default function CheapestCouncilTaxPage() {
  // Most recent verified area Band D per council: 2026-27 for the 296 billing
  // authorities, 2025-26 (own share) for the 21 county councils.
  const councilsWithArea = councils
    .map((c) => ({ council: c, area: getAreaBandD(c) }))
    .filter((e): e is { council: typeof councils[0]; area: NonNullable<ReturnType<typeof getAreaBandD>> } => e.area !== null);

  // Overall cheapest — billing authorities only, so the headline claim is a
  // clean 2026-27 comparison of full area bills.
  const billing = councilsWithArea.filter((e) => e.area.year === CURRENT_TAX_YEAR);
  const cheapest = billing.reduce((min, e) => (e.area.value < min.area.value ? e : min));
  const cheapestName = getCouncilDisplayName(cheapest.council);
  const cheapestChange = getAreaBandDChange(cheapest.council);

  const areaStats = getAreaBillStats();
  const avgRise = getAverageAreaTaxRise();

  const faqs = [
    {
      question: 'Which council has the lowest council tax in England in 2026-27?',
      answer: `${cheapestName} has the lowest Band D council tax in England for 2026-27 at ${formatCurrency(cheapest.area.value, { decimals: 2 })}. The average 2026-27 Band D bill across England's ${areaStats.count} billing authorities is ${formatCurrency(areaStats.avg, { decimals: 0 })}, up ${avgRise.toFixed(1)}% on last year.`,
    },
    {
      question: 'How are council tax rates compared fairly between different council types?',
      answer: 'You can only fairly compare councils of the same type. For unitary authorities, metropolitan districts, London boroughs and district councils, the figure shown is the full Band D bill for the area — including any county, police and fire shares. County councils show only their own share of the bill.',
    },
    {
      question: 'Why is council tax cheaper in some areas?',
      answer: "Lower-rate councils typically have a larger council tax base (more properties contributing), lower demand for adult social care, and may receive more central government funding per resident. London boroughs in particular often have lower headline rates because the Greater London Authority precept handles fire and police separately.",
    },
    {
      question: 'Did all English councils raise council tax in 2026-27?',
      answer: `Almost all English billing authorities raised the Band D bill for 2026-27 — the average rise was ${avgRise.toFixed(1)}%. Even the cheapest area went up: ${cheapestName}'s Band D rose by ${cheapestChange ? cheapestChange.percent.toFixed(1) : '—'}% from April 2026.`,
    },
  ];

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      buildWebPageSchema(
        'Lowest Council Tax in England 2026-27',
        'The lowest Band D council tax rates in England for 2026-27, grouped by council type for fair comparison.',
        '/insights/cheapest-council-tax',
      ),
      buildArticleSchema({
        headline: 'Lowest Council Tax in England 2026-27 — Top 20 Cheapest',
        description: `The lowest Band D council tax in England for 2026-27 is ${cheapestName} at ${formatCurrency(cheapest.area.value, { decimals: 2 })}. Full top-20 ranking by council type.`,
        url: '/insights/cheapest-council-tax',
        about: 'Council tax in England',
        keywords: ['lowest council tax UK 2026', 'cheapest council tax', 'lowest Band D 2026-27', 'council tax 2026-27', 'England council tax rankings'],
      }),
      buildFAQPageSchema(faqs, '/insights/cheapest-council-tax'),
      buildBreadcrumbSchema(
        [
          { name: 'Home', url: '/' },
          { name: 'Insights', url: '/insights' },
          { name: 'Lowest Council Tax 2026-27' },
        ],
        '/insights/cheapest-council-tax'
      ),
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
      />
      <main id="main-content" className="flex-1 container mx-auto px-4 max-w-3xl py-8">
        <Breadcrumb items={[
          { label: 'Home', href: '/' },
          { label: 'Insights', href: '/insights' },
          { label: 'Lowest Council Tax 2026-27' },
        ]} />

        <h1 className="type-title-1 mb-2">Lowest Council Tax in England 2026-27</h1>
        <p className="type-body-sm text-muted-foreground mb-8">
          The lowest Band D council tax in England for 2026-27 is {cheapestName} at {formatCurrency(cheapest.area.value, { decimals: 2 })}.
          Bills still went up almost everywhere — the average 2026-27 rise across billing authorities was {avgRise.toFixed(1)}%{cheapestChange ? `, and even ${cheapestName} put Band D up by ${cheapestChange.percent.toFixed(1)}%` : ''}.
          Figures for unitary, metropolitan, London borough and district councils are the full Band D bill for the area, including any county, police and fire shares.
          County councils show only their own 2025-26 share — they do not send the bill, and their 2026-27 share is not yet published.
        </p>

        {GROUPS.map((group) => {
          const groupCouncils = councilsWithArea
            .filter((e) => group.types.includes(e.council.type))
            .sort((a, b) => a.area.value - b.area.value)
            .slice(0, 20);

          if (groupCouncils.length === 0) return null;

          const groupYear = groupCouncils[0].area.year;
          const maxBandD = groupCouncils[groupCouncils.length - 1].area.value;
          const yearNote = groupYear === CURRENT_TAX_YEAR
            ? `${CURRENT_TAX_YEAR} · full Band D bill for the area`
            : `${PREVIOUS_TAX_YEAR} · the county's own share of the bill (2026-27 not yet published)`;

          return (
            <section key={group.label} className="card-elevated p-5 sm:p-6 mb-5">
              <h2 className="type-title-2 mb-1">{group.label}</h2>
              <p className="type-body-sm text-muted-foreground mb-6">{group.subtitle} · {yearNote}</p>

              <RankedBarList>
                {groupCouncils.map((entry, index) => (
                  <RankedBarRow
                    key={entry.council.ons_code}
                    rank={index + 1}
                    title={getCouncilDisplayName(entry.council)}
                    href={`/council/${getCouncilSlug(entry.council)}`}
                    value={formatCurrency(entry.area.value, { decimals: 2 })}
                    subLeft={entry.council.type_name}
                    subRight={entry.area.year}
                    fillPct={maxBandD > 0 ? (entry.area.value / maxBandD) * 100 : 0}
                  />
                ))}
              </RankedBarList>
            </section>
          );
        })}

        <nav className="mt-8 space-y-2">
          <p className="type-body-sm font-semibold mb-3">More insights</p>
          <ul className="space-y-2">
            <li><Link href="/insights/most-expensive-council-tax" className="type-body-sm text-muted-foreground hover:text-foreground transition-colors">Most expensive council tax</Link></li>
            <li><Link href="/insights/council-tax-increases" className="type-body-sm text-muted-foreground hover:text-foreground transition-colors">Council tax increases</Link></li>
            <li><Link href="/insights/council-ceo-salaries" className="type-body-sm text-muted-foreground hover:text-foreground transition-colors">Council CEO salaries</Link></li>
            <li><Link href="/insights" className="type-body-sm text-muted-foreground hover:text-foreground transition-colors">All insights</Link></li>
          </ul>
        </nav>
      </main>
      </>
  );
}
