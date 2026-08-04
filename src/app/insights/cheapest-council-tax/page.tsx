import type { Metadata } from 'next';
import Link from 'next/link';
import { councils, formatCurrency, getCouncilDisplayName, getCouncilSlug } from '@/data/councils';
import { RankedBarList, RankedBarRow } from '@/components/insights/RankedBarRow';
import { buildFAQPageSchema, buildBreadcrumbSchema, buildArticleSchema, buildWebPageSchema } from '@/lib/structured-data';
import Breadcrumb from '@/components/proposals/Breadcrumb';

export const metadata: Metadata = {
  title: 'Lowest Council Tax in England 2026 — Top 20 Cheapest',
  description: 'The lowest council tax in England for 2026. See which councils charge the cheapest Band D rates — full top-20 rankings across unitary authorities, metropolitan districts, London boroughs, county and district councils. Sourced from .gov.uk.',
  alternates: {
    canonical: '/insights/cheapest-council-tax',
  },
  openGraph: {
    title: 'Lowest Council Tax in England 2026 — Top 20 Cheapest',
    description: 'Which councils charge the lowest Band D council tax in 2026? See the full rankings.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Lowest Council Tax in England 2026 — Top 20 Cheapest',
    description: 'Which councils charge the lowest Band D council tax in 2026? See the full rankings.',
  },
};

import { COMPARABLE_GROUPS } from '@/lib/council-averages';
import { serializeJsonLd } from '@/lib/safe-json-ld';

const GROUPS = COMPARABLE_GROUPS.map(g => ({
  label: g.label,
  subtitle: g.description,
  types: g.types as unknown as string[],
}));

export default function CheapestCouncilTaxPage() {
  const councilsWithTax = councils.filter((c) => c.council_tax?.band_d_2025);

  // Overall cheapest
  const cheapest = councilsWithTax.reduce((min, c) =>
    c.council_tax!.band_d_2025 < min.council_tax!.band_d_2025 ? c : min
  );
  const cheapestName = getCouncilDisplayName(cheapest);

  const faqs = [
    {
      question: 'Which council has the lowest council tax in England in 2026?',
      answer: `${cheapestName} has the lowest Band D council tax in England for 2025-26 at ${formatCurrency(cheapest.council_tax!.band_d_2025, { decimals: 2 })}. The 2026-27 average English Band D bill is roughly £2,392, up 4.9% on last year — but Wandsworth households still pay the least at around £1,028.`,
    },
    {
      question: 'How are council tax rates compared fairly between different council types?',
      answer: 'You can only fairly compare councils of the same type. Unitary authorities, metropolitan districts and London boroughs run all services in one council. District and county councils share services between them, so their bills look lower on their own.',
    },
    {
      question: 'Why is council tax cheaper in some areas?',
      answer: "Lower-rate councils typically have a larger council tax base (more properties contributing), lower demand for adult social care, and may receive more central government funding per resident. London boroughs in particular often have lower headline rates because the Greater London Authority precept handles fire and police separately.",
    },
    {
      question: 'Did all English councils raise council tax in 2026?',
      answer: 'Almost all English councils raised council tax for 2026-27 by close to the 4.99% maximum. Even the cheapest councils raised rates — Wandsworth (the lowest-bill council) put Band D up by 3.1% from April 2026.',
    },
  ];

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      buildWebPageSchema(
        'Lowest Council Tax in England 2026',
        'The lowest Band D council tax rates in England for 2026, grouped by council type for fair comparison.',
        '/insights/cheapest-council-tax',
      ),
      buildArticleSchema({
        headline: 'Lowest Council Tax in England 2026 — Top 20 Cheapest',
        description: `The lowest Band D council tax in England for 2025-26 is ${cheapestName} at ${formatCurrency(cheapest.council_tax!.band_d_2025, { decimals: 2 })}. Full top-20 ranking by council type.`,
        url: '/insights/cheapest-council-tax',
        about: 'Council tax in England',
        keywords: ['lowest council tax UK 2026', 'cheapest council tax', 'lowest Band D 2026', 'council tax 2026', 'England council tax rankings'],
      }),
      buildFAQPageSchema(faqs, '/insights/cheapest-council-tax'),
      buildBreadcrumbSchema(
        [
          { name: 'Home', url: '/' },
          { name: 'Insights', url: '/insights' },
          { name: 'Lowest Council Tax 2026' },
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
          { label: 'Lowest Council Tax 2026' },
        ]} />

        <h1 className="type-title-1 mb-2">Lowest Council Tax in England 2026</h1>
        <p className="type-body-sm text-muted-foreground mb-8">
          The lowest Band D council tax in England for 2025-26 is {cheapestName} at {formatCurrency(cheapest.council_tax!.band_d_2025, { decimals: 2 })}.
          Even the cheapest councils raised rates for 2026-27 — Wandsworth (lowest in England, around £1,028) put Band D up by 3.1% from April 2026.
          Rates below are grouped by council type so you compare like with like — district councils look cheaper on their own because households in two-tier areas also pay a separate county bill.
        </p>

        {GROUPS.map((group) => {
          const groupCouncils = councilsWithTax
            .filter((c) => group.types.includes(c.type))
            .sort((a, b) => a.council_tax!.band_d_2025 - b.council_tax!.band_d_2025)
            .slice(0, 20);

          if (groupCouncils.length === 0) return null;

          const maxBandD = groupCouncils[groupCouncils.length - 1].council_tax!.band_d_2025;

          return (
            <section key={group.label} className="card-elevated p-5 sm:p-6 mb-5">
              <h2 className="type-title-2 mb-1">{group.label}</h2>
              <p className="type-body-sm text-muted-foreground mb-6">{group.subtitle}</p>

              <RankedBarList>
                {groupCouncils.map((council, index) => {
                  const bandD = council.council_tax!.band_d_2025;
                  return (
                    <RankedBarRow
                      key={council.ons_code}
                      rank={index + 1}
                      title={getCouncilDisplayName(council)}
                      href={`/council/${getCouncilSlug(council)}`}
                      value={formatCurrency(bandD, { decimals: 2 })}
                      subLeft={council.type_name}
                      fillPct={maxBandD > 0 ? (bandD / maxBandD) * 100 : 0}
                    />
                  );
                })}
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
