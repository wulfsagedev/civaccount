import type { Metadata } from 'next';
import Link from 'next/link';
import { councils, formatCurrency, getCouncilDisplayName, getCouncilSlug } from '@/data/councils';
import { buildFAQPageSchema, buildBreadcrumbSchema } from '@/lib/structured-data';
import Breadcrumb from '@/components/proposals/Breadcrumb';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { serializeJsonLd } from '@/lib/safe-json-ld';

export const metadata: Metadata = {
  title: 'The Complete Guide to Council Tax in England',
  description: 'Everything you need to know about council tax in England: how it works, how bands are calculated, who has to pay, discounts and exemptions, and how your money is spent.',
  alternates: {
    canonical: '/guide/council-tax',
  },
  openGraph: {
    title: 'The Complete Guide to Council Tax in England',
    description: 'How council tax works, how bands are set, who pays, and where the money goes.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'The Complete Guide to Council Tax in England',
    description: 'How council tax works, how bands are set, who pays, and where the money goes.',
  },
};

export default function CouncilTaxGuidePage() {
  const councilsWithTax = councils.filter((c) => c.council_tax?.band_d_2025);
  const bandDValues = councilsWithTax.map((c) => c.council_tax!.band_d_2025);
  const avgBandD = bandDValues.reduce((s, v) => s + v, 0) / bandDValues.length;

  const cheapest = councilsWithTax.reduce((min, c) =>
    c.council_tax!.band_d_2025 < min.council_tax!.band_d_2025 ? c : min
  );
  const mostExpensive = councilsWithTax.reduce((max, c) =>
    c.council_tax!.band_d_2025 > max.council_tax!.band_d_2025 ? c : max
  );

  const councilsWithBothYears = councilsWithTax.filter((c) => c.council_tax?.band_d_2024);
  const avgChange = councilsWithBothYears.length > 0
    ? councilsWithBothYears.reduce((sum, c) => {
        return sum + ((c.council_tax!.band_d_2025 - c.council_tax!.band_d_2024!) / c.council_tax!.band_d_2024!) * 100;
      }, 0) / councilsWithBothYears.length
    : null;

  // Band ratios relative to Band D
  const bandRatios = [
    { band: 'A', ratio: '6/9', fraction: 6 / 9, description: 'Up to £40,000' },
    { band: 'B', ratio: '7/9', fraction: 7 / 9, description: '£40,001 to £52,000' },
    { band: 'C', ratio: '8/9', fraction: 8 / 9, description: '£52,001 to £68,000' },
    { band: 'D', ratio: '9/9', fraction: 1, description: '£68,001 to £88,000' },
    { band: 'E', ratio: '11/9', fraction: 11 / 9, description: '£88,001 to £120,000' },
    { band: 'F', ratio: '13/9', fraction: 13 / 9, description: '£120,001 to £160,000' },
    { band: 'G', ratio: '15/9', fraction: 15 / 9, description: '£160,001 to £320,000' },
    { band: 'H', ratio: '18/9', fraction: 2, description: 'Over £320,000' },
  ];

  const faqs = [
    {
      question: 'What is council tax?',
      answer: 'Council tax is a tax on domestic property in England, set by your local council to pay for local services like schools, roads, rubbish collection, social care, and emergency services.',
    },
    {
      question: 'How are council tax bands calculated?',
      answer: 'Council tax bands are based on the value of your property on 1 April 1991. There are 8 bands from A (cheapest) to H (most expensive). Band D is used as the reference point, with other bands calculated as a fraction of Band D.',
    },
    {
      question: 'Who has to pay council tax?',
      answer: 'Usually, anyone aged 18 or over who lives in a property has to pay council tax. If you live alone, you get a 25% discount. Full-time students, some carers, and people with severe mental impairment may be exempt.',
    },
    {
      question: 'How much is the average council tax in England?',
      answer: `The average Band D council tax in England for 2025-26 is ${formatCurrency(avgBandD, { decimals: 0 })}. Rates range from ${formatCurrency(cheapest.council_tax!.band_d_2025, { decimals: 2 })} to ${formatCurrency(mostExpensive.council_tax!.band_d_2025, { decimals: 2 })}.`,
    },
    {
      question: 'Why is my council tax so high?',
      answer: 'Council tax varies because of differences in local spending needs, the number of properties in each area, and how much funding the council gets from central government. Councils with higher social care costs or fewer properties tend to charge more.',
    },
    {
      question: 'Can I get a discount on my council tax?',
      answer: 'Yes. Common discounts include: 25% for single occupants, 100% for students, council tax support for low-income households, and exemptions for empty properties (time-limited). Contact your council for details.',
    },
    {
      question: 'What does council tax pay for?',
      answer: 'Council tax funds local services including education, adult and children\'s social care, waste collection, roads and transport, planning, housing, leisure, libraries, and council running costs.',
    },
    {
      question: 'How can I check my council tax band?',
      answer: 'You can check your council tax band on GOV.UK at gov.uk/council-tax-bands. If you think your band is wrong, you can challenge it through the Valuation Office Agency.',
    },
  ];

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Article',
        '@id': 'https://www.civaccount.co.uk/guide/council-tax#article',
        headline: 'The Complete Guide to Council Tax in England',
        description: 'Everything you need to know about council tax: how it works, how bands are calculated, discounts, and where your money goes.',
        datePublished: '2026-04-06',
        dateModified: '2026-04-06',
        publisher: {
          '@type': 'Organization',
          '@id': 'https://www.civaccount.co.uk/#organization',
          name: 'CivAccount',
        },
        isPartOf: {
          '@id': 'https://www.civaccount.co.uk/#website',
        },
        about: {
          '@type': 'Thing',
          name: 'Council Tax',
          description: 'A tax on domestic property in England to fund local services',
        },
      },
      buildFAQPageSchema(faqs, '/guide/council-tax'),
      buildBreadcrumbSchema(
        [{ name: 'Home', url: '/' }, { name: 'Guide: Council Tax' }],
        '/guide/council-tax'
      ),
    ],
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
      />
      <main id="main-content" className="flex-1 container mx-auto px-4 max-w-3xl py-8">
        <Breadcrumb items={[
          { label: 'Home', href: '/' },
          { label: 'Guide: Council Tax' },
        ]} />

        <h1 className="type-title-1 mb-2">The Complete Guide to Council Tax</h1>
        <p className="type-body-sm text-muted-foreground mb-8">
          Council tax is the main way local councils in England raise money to pay for services.
          In 2025-26, the average Band D council tax is {formatCurrency(avgBandD, { decimals: 0 })}{avgChange !== null ? `, up ${avgChange.toFixed(1)}% from last year` : ''}.
          This guide explains how it works.
        </p>

        {/* Section 1: What is council tax */}
        <section className="card-elevated p-5 sm:p-6 mb-5">
          <h2 className="type-title-2 mb-1">What is council tax?</h2>
          <p className="type-body-sm text-muted-foreground mb-5">The basics</p>

          <div className="space-y-4 type-body-sm text-muted-foreground">
            <p>
              Council tax is a tax on homes in England. Your local council sets the rate each year to pay for local services
              like schools, bin collection, road repairs, and social care.
            </p>
            <p>
              Every home is placed in one of 8 bands (A to H) based on how much it was worth in April 1991.
              Band A homes pay the least, Band H homes pay the most.
            </p>
            <p>
              Your total bill usually includes charges from more than one body. For example, if you live in a district council area,
              your bill includes the district council charge, the county council charge, a police charge, and a fire service charge.
            </p>
          </div>
        </section>

        {/* Section 2: How bands work */}
        <section className="card-elevated p-5 sm:p-6 mb-5">
          <h2 className="type-title-2 mb-1">How council tax bands work</h2>
          <p className="type-body-sm text-muted-foreground mb-5">8 bands based on 1991 property values</p>

          <div className="space-y-3">
            {bandRatios.map((b) => (
              <div key={b.band} className="flex items-baseline justify-between py-2">
                <div>
                  <span className="type-body-sm font-semibold">Band {b.band}</span>
                  <span className="type-caption text-muted-foreground ml-2">{b.description}</span>
                </div>
                <span className="type-body-sm font-semibold tabular-nums">
                  {(b.fraction * 100).toFixed(0)}%
                </span>
              </div>
            ))}
          </div>

          <p className="type-caption text-muted-foreground mt-6 pt-4 border-t border-border/50">
            Percentages show how much each band pays relative to Band D. For example, Band A pays 67% of the Band D rate,
            while Band H pays 200%.
            {' '}
            <a
              href="https://www.gov.uk/council-tax-bands"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground transition-colors"
            >
              Check your band on GOV.UK
              <span className="sr-only"> (opens in new tab)</span>
            </a>
          </p>
        </section>

        {/* Section 3: How much is council tax */}
        <section className="card-elevated p-5 sm:p-6 mb-5">
          <h2 className="type-title-2 mb-1">How much is council tax in 2025-26?</h2>
          <p className="type-body-sm text-muted-foreground mb-5">Band D rates across England</p>

          <div className="space-y-3">
            <div className="flex items-baseline justify-between py-2">
              <span className="type-body-sm text-muted-foreground">Average</span>
              <span className="type-body-sm font-semibold tabular-nums">{formatCurrency(avgBandD, { decimals: 0 })}</span>
            </div>
            <div className="flex items-baseline justify-between py-2">
              <span className="type-body-sm text-muted-foreground">
                Cheapest —{' '}
                <Link href={`/council/${getCouncilSlug(cheapest)}`} className="hover:text-foreground transition-colors">
                  {getCouncilDisplayName(cheapest)}
                </Link>
              </span>
              <span className="type-body-sm font-semibold tabular-nums">{formatCurrency(cheapest.council_tax!.band_d_2025, { decimals: 2 })}</span>
            </div>
            <div className="flex items-baseline justify-between py-2">
              <span className="type-body-sm text-muted-foreground">
                Most expensive —{' '}
                <Link href={`/council/${getCouncilSlug(mostExpensive)}`} className="hover:text-foreground transition-colors">
                  {getCouncilDisplayName(mostExpensive)}
                </Link>
              </span>
              <span className="type-body-sm font-semibold tabular-nums">{formatCurrency(mostExpensive.council_tax!.band_d_2025, { decimals: 2 })}</span>
            </div>
            {avgChange !== null && (
              <div className="flex items-baseline justify-between py-2">
                <span className="type-body-sm text-muted-foreground">Average increase from last year</span>
                <span className="type-body-sm font-semibold tabular-nums text-negative">+{avgChange.toFixed(1)}%</span>
              </div>
            )}
          </div>

          <div className="mt-5 p-3 rounded-lg bg-muted/30">
            <p className="type-caption text-muted-foreground">
              See the full rankings:{' '}
              <Link href="/insights/cheapest-council-tax" className="hover:text-foreground transition-colors">cheapest</Link>
              {' · '}
              <Link href="/insights/most-expensive-council-tax" className="hover:text-foreground transition-colors">most expensive</Link>
              {' · '}
              <Link href="/insights/council-tax-increases" className="hover:text-foreground transition-colors">biggest increases</Link>
            </p>
          </div>
        </section>

        {/* Section 4: Who pays */}
        <section className="card-elevated p-5 sm:p-6 mb-5">
          <h2 className="type-title-2 mb-1">Who has to pay council tax?</h2>
          <p className="type-body-sm text-muted-foreground mb-5">Rules and exemptions</p>

          <div className="space-y-4 type-body-sm text-muted-foreground">
            <p>
              Usually, anyone aged 18 or over who lives in a property has to pay. The bill goes to the person who lives there,
              not necessarily the owner.
            </p>

            <div>
              <p className="font-semibold text-foreground mb-2">Common discounts</p>
              <ul className="space-y-2 list-disc pl-5">
                <li><span className="font-medium text-foreground">Single person discount</span> — 25% off if you are the only adult in the home</li>
                <li><span className="font-medium text-foreground">Student exemption</span> — No council tax if everyone in the home is a full-time student</li>
                <li><span className="font-medium text-foreground">Council tax support</span> — Reduced bill if you are on a low income or benefits</li>
                <li><span className="font-medium text-foreground">Disabled relief</span> — You may pay a lower band if your home has been adapted for a disabled person</li>
              </ul>
            </div>

            <p>
              Contact your local council to apply for discounts. You can find your council on the{' '}
              <Link href="/" className="font-medium text-foreground hover:text-muted-foreground transition-colors">CivAccount homepage</Link>.
            </p>
          </div>
        </section>

        {/* Section 5: What it pays for */}
        <section className="card-elevated p-5 sm:p-6 mb-5">
          <h2 className="type-title-2 mb-1">What does council tax pay for?</h2>
          <p className="type-body-sm text-muted-foreground mb-5">Where your money goes</p>

          <div className="space-y-4 type-body-sm text-muted-foreground">
            <p>
              Council tax pays for local services. The exact split depends on where you live and what type of council you have.
              Here are the main categories:
            </p>

            <div className="space-y-3">
              {[
                { name: 'Education', desc: 'Schools, special educational needs, early years' },
                { name: 'Adult Social Care', desc: 'Care for older people, disabled adults, mental health services' },
                { name: "Children's Services", desc: 'Child protection, looked-after children, youth services' },
                { name: 'Environment & Streets', desc: 'Bin collection, recycling, street cleaning, parks' },
                { name: 'Roads & Transport', desc: 'Road repairs, potholes, street lighting, public transport' },
                { name: 'Housing', desc: 'Social housing, homelessness support, housing benefits' },
                { name: 'Public Health', desc: 'Community health, substance misuse, sexual health' },
                { name: 'Leisure & Culture', desc: 'Libraries, leisure centres, museums, community centres' },
                { name: 'Planning', desc: 'Planning applications, building control, local plans' },
                { name: 'Council Running Costs', desc: 'Staff, IT, legal, finance, democratic services' },
              ].map((service) => (
                <div key={service.name} className="py-1">
                  <span className="font-semibold text-foreground">{service.name}</span>
                  <span className="text-muted-foreground"> — {service.desc}</span>
                </div>
              ))}
            </div>

            <div className="mt-3 p-3 rounded-lg bg-muted/30">
              <p className="type-caption text-muted-foreground">
                See exactly how your council spends money:{' '}
                <Link href="/insights" className="hover:text-foreground transition-colors">national spending breakdown</Link>
                {' · '}
                <Link href="/guide/council-spending" className="hover:text-foreground transition-colors">guide to council spending</Link>
              </p>
            </div>
          </div>
        </section>

        {/* Section 6: Council types */}
        <section className="card-elevated p-5 sm:p-6 mb-5">
          <h2 className="type-title-2 mb-1">Types of council</h2>
          <p className="type-body-sm text-muted-foreground mb-5">Why some councils charge more than others</p>

          <div className="space-y-4 type-body-sm text-muted-foreground">
            <p>
              England has different types of council. Some provide all services, others share them:
            </p>

            <div className="space-y-3">
              <div className="py-2">
                <p className="font-semibold text-foreground mb-1">Unitary authorities, metropolitan districts, London boroughs</p>
                <p>Provide all services. Your whole council tax bill goes to one council (plus police and fire).</p>
              </div>
              <div className="py-2">
                <p className="font-semibold text-foreground mb-1">County councils + district councils</p>
                <p>Services are split. The county handles education, social care, and roads. The district handles bins, planning, and housing. You pay both.</p>
              </div>
            </div>

            <p>
              This is why you cannot directly compare a district council&apos;s council tax with a unitary authority —
              the district only provides some of the services.
            </p>
          </div>
        </section>

        {/* Section 7: How to check and challenge */}
        <section className="card-elevated p-5 sm:p-6 mb-5">
          <h2 className="type-title-2 mb-1">How to check and challenge your band</h2>
          <p className="type-body-sm text-muted-foreground mb-5">Steps you can take</p>

          <div className="space-y-4 type-body-sm text-muted-foreground">
            <ol className="space-y-3 list-decimal pl-5">
              <li>
                <span className="font-medium text-foreground">Check your band</span> — Go to{' '}
                <a href="https://www.gov.uk/council-tax-bands" target="_blank" rel="noopener noreferrer" className="font-medium text-foreground hover:text-muted-foreground transition-colors">
                  GOV.UK council tax bands
                  <span className="sr-only"> (opens in new tab)</span>
                </a>{' '}
                and enter your postcode
              </li>
              <li>
                <span className="font-medium text-foreground">Compare with neighbours</span> — Check what band similar properties on your street are in
              </li>
              <li>
                <span className="font-medium text-foreground">Challenge if wrong</span> — You can ask the Valuation Office Agency (VOA) to review your band if you think it is wrong
              </li>
            </ol>
            <p>
              Challenging your band is free, but be aware your band could go up as well as down.
            </p>
          </div>
        </section>

        {/* FAQ section */}
        <section className="card-elevated p-5 sm:p-6 mb-5">
          <h2 className="type-title-2 mb-1">Common questions</h2>
          <p className="type-body-sm text-muted-foreground mb-5">Quick answers about council tax</p>

          <div className="space-y-3">
            {faqs.map((faq) => (
              <div key={faq.question} className="p-3 rounded-lg bg-muted/30">
                <p className="type-body-sm font-semibold mb-1">{faq.question}</p>
                <p className="type-caption text-muted-foreground">{faq.answer}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Cross-links */}
        <nav className="mt-8 space-y-2">
          <p className="type-body-sm font-semibold mb-3">Related</p>
          <ul className="space-y-2">
            <li><Link href="/guide/council-spending" className="type-body-sm text-muted-foreground hover:text-foreground transition-colors">Guide: How councils spend your money</Link></li>
            <li><Link href="/insights" className="type-body-sm text-muted-foreground hover:text-foreground transition-colors">National insights</Link></li>
            <li><Link href="/insights/cheapest-council-tax" className="type-body-sm text-muted-foreground hover:text-foreground transition-colors">Cheapest council tax</Link></li>
            <li><Link href="/insights/most-expensive-council-tax" className="type-body-sm text-muted-foreground hover:text-foreground transition-colors">Most expensive council tax</Link></li>
            <li><Link href="/insights/council-tax-increases" className="type-body-sm text-muted-foreground hover:text-foreground transition-colors">Council tax increases</Link></li>
            <li><Link href="/data" className="type-body-sm text-muted-foreground hover:text-foreground transition-colors">Download the data (CSV/JSON)</Link></li>
          </ul>
        </nav>
      </main>
      <Footer />
    </div>
  );
}
