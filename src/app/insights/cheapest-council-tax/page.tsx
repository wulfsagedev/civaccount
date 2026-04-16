import type { Metadata } from 'next';
import Link from 'next/link';
import { councils, formatCurrency, getCouncilDisplayName, getCouncilSlug } from '@/data/councils';
import { buildFAQPageSchema, buildBreadcrumbSchema } from '@/lib/structured-data';
import Breadcrumb from '@/components/proposals/Breadcrumb';

export const metadata: Metadata = {
  title: 'Cheapest Council Tax in England 2025-26',
  description: 'Find the cheapest council tax rates in England for 2025-26. See which councils charge the lowest Band D rates across unitary authorities, metropolitan districts, London boroughs, county councils, and district councils.',
  alternates: {
    canonical: '/insights/cheapest-council-tax',
  },
  openGraph: {
    title: 'Cheapest Council Tax in England 2025-26',
    description: 'Which councils charge the lowest Band D council tax? See the full rankings.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Cheapest Council Tax in England 2025-26',
    description: 'Which councils charge the lowest Band D council tax? See the full rankings.',
  },
};

import { COMPARABLE_GROUPS } from '@/lib/council-averages';

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
      question: 'Which council has the cheapest council tax in England?',
      answer: `${cheapestName} has the cheapest Band D council tax in England for 2025-26 at ${formatCurrency(cheapest.council_tax!.band_d_2025, { decimals: 2 })}.`,
    },
    {
      question: 'How is council tax compared fairly between different council types?',
      answer: 'Council tax rates are only fairly comparable within the same type. Unitary authorities, metropolitan districts, and London boroughs provide all services. District councils and county councils split services between them, so their individual rates appear lower.',
    },
  ];

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      buildFAQPageSchema(faqs, '/insights/cheapest-council-tax'),
      buildBreadcrumbSchema(
        [
          { name: 'Home', url: '/' },
          { name: 'Insights', url: '/insights' },
          { name: 'Cheapest Council Tax' },
        ],
        '/insights/cheapest-council-tax'
      ),
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <main id="main-content" className="flex-1 container mx-auto px-4 max-w-3xl py-8">
        <Breadcrumb items={[
          { label: 'Home', href: '/' },
          { label: 'Insights', href: '/insights' },
          { label: 'Cheapest Council Tax' },
        ]} />

        <h1 className="type-title-1 mb-2">Cheapest Council Tax in England</h1>
        <p className="type-body-sm text-muted-foreground mb-8">
          The cheapest Band D council tax in England for 2025-26 is {cheapestName} at {formatCurrency(cheapest.council_tax!.band_d_2025, { decimals: 2 })}.
          Rates are grouped by council type for fair comparison.
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

              <div className="space-y-4">
                {groupCouncils.map((council, index) => {
                  const bandD = council.council_tax!.band_d_2025;
                  const slug = getCouncilSlug(council);
                  const name = getCouncilDisplayName(council);
                  const barWidth = maxBandD > 0 ? (bandD / maxBandD) * 100 : 0;

                  return (
                    <div key={council.ons_code}>
                      <div className="flex items-baseline justify-between mb-1.5">
                        <Link
                          href={`/council/${slug}`}
                          className="type-body-sm font-medium hover:text-foreground transition-colors"
                        >
                          {index + 1}. {name}
                        </Link>
                        <span className="type-body-sm font-semibold tabular-nums">
                          {formatCurrency(bandD, { decimals: 2 })}
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full bg-foreground"
                          style={{ width: `${barWidth}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
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
