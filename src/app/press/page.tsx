import type { Metadata } from 'next';
import Link from 'next/link';
import { councils, formatCurrency, getCouncilDisplayName, getCouncilSlug } from '@/data/councils';
import {
  getNationalSpendStats,
  getNationalBillStats,
  getHeadlineExtremes,
  getAverageTaxRise,
  getCouncilsAtOrOverCap,
  getCeoPayStats,
  getHundredKClub,
  getClosestToBankruptcy,
  getBigFiveOutsourcers,
  getTopSuppliersNational,
  getWhereEveryPoundGoes,
} from '@/lib/insights-stats';
import {
  buildWebPageSchema,
  buildBreadcrumbSchema,
  buildFAQPageSchema,
} from '@/lib/structured-data';
import Breadcrumb from '@/components/proposals/Breadcrumb';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { PageContainer } from '@/components/ui/page-container';
import { Badge } from '@/components/ui/badge';
import PressContactButton from './PressContactButton';
import { serializeJsonLd } from '@/lib/safe-json-ld';

const BASE_URL = 'https://www.civaccount.co.uk';
const ORG_ID = `${BASE_URL}/#organization`;
const WEBSITE_ID = `${BASE_URL}/#website`;

export const metadata: Metadata = {
  title: 'Using the data — for writers, researchers, and anyone',
  description:
    'How to access and cite CivAccount data: free CSV/JSON downloads, a public API with no key required, named datasets, and citation guidance. CivAccount presents public UK council data in an accessible format.',
  alternates: { canonical: '/press' },
  openGraph: {
    title: 'Using CivAccount data',
    description:
      'Free downloads, public API, named datasets, and citation guide for UK council data.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Using CivAccount data',
    description:
      'Free downloads, public API, named datasets, and citation guide for UK council data.',
  },
};

export default function PressPage() {
  // ── Live-computed headline numbers (stay fresh as data updates) ──────────────
  const spend = getNationalSpendStats();
  const bill = getNationalBillStats();
  const extremes = getHeadlineExtremes();
  const avgRise = getAverageTaxRise();
  const atCap = getCouncilsAtOrOverCap(4.99);
  const ceo = getCeoPayStats(1);
  const topCeo = ceo.highestPaid;
  const hundredK = getHundredKClub(1);
  const bankruptcy = getClosestToBankruptcy(3);
  const bigFive = getBigFiveOutsourcers();
  const topSuppliers = getTopSuppliersNational(3);
  const pound = getWhereEveryPoundGoes();

  const councilsWithTax = councils.filter((c) => c.council_tax?.band_d_2025).length;
  const councilsWithSalary = councils.filter((c) => c.detailed?.chief_executive_salary).length;

  // ── Factual headline numbers anyone can lift ─────────────────────────────────
  // Each is a plain statement of what the data shows, with the original .gov.uk
  // source. No commentary, no interpretation — just the number and where it comes from.
  const facts: Array<{ stat: string; source: string }> = [
    {
      stat: `Average Band D council tax in England, 2025-26: ${formatCurrency(bill.avg, { decimals: 0 })} (${avgRise > 0 ? '+' : ''}${avgRise.toFixed(1)}% vs 2024-25).`,
      source: 'GOV.UK Council Tax levels 2025-26',
    },
    {
      stat: `Councils that raised Band D to the 4.99% cap in 2025-26: ${atCap}.`,
      source: 'GOV.UK Council Tax levels 2025-26',
    },
    {
      stat: `Cheapest Band D in England: ${formatCurrency(extremes.cheapest.council_tax!.band_d_2025!, { decimals: 2 })} (${getCouncilDisplayName(extremes.cheapest)}). Most expensive: ${formatCurrency(extremes.mostExpensive.council_tax!.band_d_2025!, { decimals: 2 })} (${getCouncilDisplayName(extremes.mostExpensive)}).`,
      source: 'GOV.UK Council Tax levels 2025-26',
    },
    {
      stat: `Total planned net service expenditure by English councils, 2025-26: ${formatCurrency(spend.totalSpend, { decimals: 0 })}.`,
      source: 'MHCLG Revenue Account (RA) returns 2025-26',
    },
    topCeo
      ? {
          stat: `Highest chief executive total remuneration disclosed by an English council: ${formatCurrency(topCeo.total, { decimals: 0 })} (${topCeo.council.detailed?.chief_executive ?? 'N/A'}, ${getCouncilDisplayName(topCeo.council)}).`,
          source: "Council's Localism Act 2011 Pay Policy Statement",
        }
      : null,
    {
      stat: `Council employees in England disclosed as earning £100,000 or more: ${hundredK.totalStaff.toLocaleString('en-GB')}.`,
      source: "Senior salary disclosures published by individual councils",
    },
    bankruptcy.top[0]
      ? {
          stat: `Largest disclosed budget gap as a share of net budget: ${bankruptcy.top[0].gapPct.toFixed(1)}% (${getCouncilDisplayName(bankruptcy.top[0].council)}).`,
          source: "Council medium-term financial strategy documents",
        }
      : null,
    {
      stat: `Combined disclosed spend with Capita, Serco, Veolia, Biffa and Amey across English councils: ${formatCurrency(bigFive.combinedSpend, { decimals: 0 })} (${bigFive.sharePct.toFixed(0)}% of disclosed top-supplier spend).`,
      source: "Top-supplier disclosures published by individual councils",
    },
    topSuppliers.top[0]
      ? {
          stat: `Largest single disclosed private supplier to English councils: ${topSuppliers.top[0].name} — ${formatCurrency(topSuppliers.top[0].totalSpend, { decimals: 0 })} across ${topSuppliers.top[0].councilCount} councils.`,
          source: "Top-supplier disclosures published by individual councils",
        }
      : null,
    pound[0]
      ? {
          stat: `Biggest spending category in English council service budgets: ${pound[0].name} (${pound[0].pence.toFixed(0)}p of every £1).`,
          source: 'MHCLG RA/RO returns, 2025-26',
        }
      : null,
  ].filter((q): q is { stat: string; source: string } => q !== null);

  // ── Named datasets — neutral, factual descriptions ───────────────────────────
  const namedDatasets = [
    {
      name: 'Postcode Lottery Index',
      value: `${formatCurrency(extremes.mostExpensive.council_tax!.band_d_2025! - extremes.cheapest.council_tax!.band_d_2025!, { decimals: 0 })}`,
      explanation: 'Gap between the cheapest and most expensive Band D council tax in England.',
      url: '/insights/postcode-lottery',
    },
    {
      name: '£100k Club',
      value: `${hundredK.totalStaff.toLocaleString('en-GB')} people`,
      explanation: 'Council employees in England disclosed as earning £100,000 or more.',
      url: '/insights/hundred-k-club',
    },
    {
      name: 'CEO Pay League',
      value: topCeo ? formatCurrency(topCeo.total, { decimals: 0 }) : 'N/A',
      explanation: 'Highest chief-executive total remuneration disclosed in 2025-26.',
      url: '/insights/ceo-pay-league',
    },
    {
      name: 'Cap Every Year',
      value: `${atCap} councils`,
      explanation: 'English councils that raised Band D to the 4.99% statutory cap in 2025-26.',
      url: '/insights/cap-every-year',
    },
    {
      name: 'Big Five Outsourcers',
      value: formatCurrency(bigFive.combinedSpend, { decimals: 0 }),
      explanation: 'Combined disclosed annual payments to Capita, Serco, Veolia, Biffa, and Amey.',
      url: '/insights/big-five-outsourcers',
    },
  ];

  const faqs = [
    {
      question: 'Can I reproduce CivAccount data in my article or research?',
      answer:
        'Yes. All data is published under the Open Government Licence v3.0 (source data) and MIT (code). A credit such as "CivAccount (civaccount.co.uk)" is appreciated but not legally required.',
    },
    {
      question: 'How often is the data updated?',
      answer:
        'Council tax rates are refreshed within 2 weeks of each council setting its annual budget (Feb-Mar). Spending data follows the DLUHC publication cycle (typically Nov). Leadership and supplier data is updated throughout the year as councils publish.',
    },
    {
      question: 'Where does CivAccount source its data?',
      answer:
        'Exclusively from .gov.uk sources: MHCLG/DLUHC Revenue Account (RA) and Revenue Outturn (RO) returns, individual council Pay Policy Statements and Members\' Allowances schemes, ONS population estimates, and council websites. No third-party aggregators.',
    },
    {
      question: 'Can I get bulk data?',
      answer:
        'Yes. CSV and JSON downloads of all 317 councils are available at civaccount.co.uk/data and via a free public API at civaccount.co.uk/api/v1/download. No API key required.',
    },
    {
      question: 'Do you offer embeddable widgets?',
      answer:
        'Yes. Every council has embeddable iframe widgets. Free to use on any website. See civaccount.co.uk/developers.',
    },
    {
      question: 'Is this an official government site?',
      answer:
        'No. CivAccount is an independent open-source civic tool that presents public UK council data in an accessible format. It is not affiliated with any council, government body, political party, or commercial data aggregator.',
    },
    {
      question: 'Does CivAccount provide commentary, quotes, or interviews?',
      answer:
        'No. CivAccount is a data presentation tool, not a media organisation. The site presents the data as-is with links back to the original .gov.uk sources; interpretation is left to the reader.',
    },
  ];

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      buildWebPageSchema('Using CivAccount data', metadata.description as string, '/press', { type: 'CollectionPage' }),
      {
        '@type': 'Article',
        '@id': `${BASE_URL}/press#article`,
        headline: 'Using CivAccount data — for writers, researchers, and anyone',
        description: metadata.description,
        url: `${BASE_URL}/press`,
        mainEntityOfPage: { '@id': `${BASE_URL}/press#webpage` },
        datePublished: '2026-04-19',
        dateModified: new Date().toISOString().slice(0, 10),
        inLanguage: 'en-GB',
        isAccessibleForFree: true,
        isPartOf: { '@id': WEBSITE_ID },
        author: { '@id': ORG_ID },
        publisher: { '@id': ORG_ID },
        about: { '@type': 'Thing', name: 'UK council data, open data' },
        keywords: 'council tax, council budget, open data, UK local government, council finance, data access, citation',
      },
      buildBreadcrumbSchema(
        [{ name: 'Home', url: '/' }, { name: 'Using the data' }],
        '/press',
      ),
      buildFAQPageSchema(faqs, '/press'),
    ],
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }} />

      <PageContainer className="py-8 sm:py-12">
        <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Using the data' }]} />

        <div className="text-center space-y-3 mb-10">
          <Badge variant="outline" className="mb-2">Open data access</Badge>
          <h1 className="type-title-1 font-semibold">Using CivAccount data</h1>
          <p className="type-body-sm text-muted-foreground max-w-2xl mx-auto">
            CivAccount presents public UK council data in an accessible format. Writers, researchers, students, and
            anyone else are free to download, embed, and cite it. No permission required.
          </p>
        </div>

        {/* What the dataset is */}
        <section className="card-elevated p-5 sm:p-6 mb-5">
          <h2 className="type-title-2 mb-1">What the dataset covers</h2>
          <p className="type-body-sm text-muted-foreground mb-5">
            All 317 English councils, sourced exclusively from <code className="text-[13px] font-mono bg-muted px-1.5 py-0.5 rounded">.gov.uk</code> and ONS.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-border/50">
            <div>
              <p className="type-display tabular-nums">317</p>
              <p className="type-caption text-muted-foreground">English councils</p>
            </div>
            <div>
              <p className="type-display tabular-nums">{councilsWithTax}</p>
              <p className="type-caption text-muted-foreground">With Band D 2025-26</p>
            </div>
            <div>
              <p className="type-display tabular-nums">{councilsWithSalary}</p>
              <p className="type-caption text-muted-foreground">With CEO salary</p>
            </div>
            <div>
              <p className="type-display tabular-nums">~15k</p>
              <p className="type-caption text-muted-foreground">Data points</p>
            </div>
          </div>
        </section>

        {/* Headline facts — neutral, factual, with source */}
        <section className="card-elevated p-5 sm:p-6 mb-5">
          <h2 className="type-title-2 mb-1">Headline figures (2025-26)</h2>
          <p className="type-body-sm text-muted-foreground mb-5">
            Auto-generated from the dataset. Each figure cites its original <code className="text-[13px] font-mono bg-muted px-1.5 py-0.5 rounded">.gov.uk</code> source — please verify at the source and cite it directly, not CivAccount.
          </p>

          <ol className="space-y-5">
            {facts.map((f, i) => (
              <li key={i} className="pl-7 relative">
                <span className="absolute left-0 top-0 type-caption text-muted-foreground tabular-nums font-semibold">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <p className="type-body mb-2">{f.stat}</p>
                <p className="type-caption text-muted-foreground">Source: {f.source}</p>
              </li>
            ))}
          </ol>

          <p className="type-caption text-muted-foreground mt-6 pt-4 border-t border-border/50">
            These figures regenerate automatically when the dataset updates. For the full record, use the downloads below or visit the individual council pages.
          </p>
        </section>

        {/* Named datasets */}
        <section className="card-elevated p-5 sm:p-6 mb-5">
          <h2 className="type-title-2 mb-1">Named datasets</h2>
          <p className="type-body-sm text-muted-foreground mb-5">
            Recurring CivAccount data cuts with a stable name and methodology. Each is a view of the underlying public data.
          </p>

          <ul className="space-y-4">
            {namedDatasets.map((idx) => (
              <li key={idx.name} className="pb-4 border-b border-border/50 last:border-b-0 last:pb-0">
                <div className="flex items-baseline justify-between gap-4 mb-1">
                  <Link href={idx.url} className="type-body font-semibold hover:text-muted-foreground transition-colors">
                    {idx.name}
                  </Link>
                  <span className="type-body font-semibold tabular-nums shrink-0">{idx.value}</span>
                </div>
                <p className="type-caption text-muted-foreground">{idx.explanation}</p>
              </li>
            ))}
          </ul>
        </section>

        {/* Access */}
        <section className="card-elevated p-5 sm:p-6 mb-5">
          <h2 className="type-title-2 mb-1">How to access the data</h2>
          <p className="type-body-sm text-muted-foreground mb-5">
            Per-council lookups, not bulk export. Each individual council&apos;s record is a separate request.
          </p>

          <div className="space-y-3">
            <Link
              href="/data"
              className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted transition-colors group cursor-pointer"
            >
              <div>
                <p className="type-body-sm font-semibold group-hover:text-muted-foreground transition-colors">Data reference</p>
                <p className="type-caption text-muted-foreground">Field dictionary, units, coverage, endpoints</p>
              </div>
              <code className="type-caption font-mono text-muted-foreground shrink-0">/data</code>
            </Link>

            <Link
              href="/developers"
              className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted transition-colors group cursor-pointer"
            >
              <div>
                <p className="type-body-sm font-semibold group-hover:text-muted-foreground transition-colors">Developer API & embeds</p>
                <p className="type-caption text-muted-foreground">
                  Per-council JSON, change feed, iframe snippets, rate limits
                </p>
              </div>
              <code className="type-caption font-mono text-muted-foreground shrink-0">/api/v1/…</code>
            </Link>
          </div>

          <p className="type-caption text-muted-foreground mt-5 pt-4 border-t border-border/50">
            There is no bulk CSV or JSON of the full dataset. Individual council slugs are in the{' '}
            <Link href="/sitemap.xml" className="hover:text-foreground transition-colors">sitemap</Link>.
            For units: budget values in thousands of pounds; council tax and supplier spend in pounds.
          </p>
        </section>

        {/* Citation */}
        <section className="card-elevated p-5 sm:p-6 mb-5">
          <h2 className="type-title-2 mb-1">Citing the data</h2>
          <p className="type-body-sm text-muted-foreground mb-5">
            Not legally required (data is OGL v3.0), but appreciated. Cite the original <code className="text-[13px] font-mono bg-muted px-1.5 py-0.5 rounded">.gov.uk</code> source first where you can.
          </p>

          <div className="space-y-4">
            <div>
              <p className="type-caption text-muted-foreground mb-1">Short</p>
              <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
                <code className="type-body-sm font-mono">Source: CivAccount (civaccount.co.uk)</code>
              </div>
            </div>

            <div>
              <p className="type-caption text-muted-foreground mb-1">Full (research / academic)</p>
              <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
                <code className="type-body-sm font-mono">
                  CivAccount (2026). &ldquo;[Name of dataset or page]&rdquo;. civaccount.co.uk. Accessed [date]. Open Government Licence v3.0.
                </code>
              </div>
            </div>

            <div>
              <p className="type-caption text-muted-foreground mb-1">Named dataset</p>
              <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
                <code className="type-body-sm font-mono">
                  CivAccount Postcode Lottery Index, 2025-26 (civaccount.co.uk/insights/postcode-lottery)
                </code>
              </div>
            </div>
          </div>

          <p className="type-caption text-muted-foreground mt-5 pt-4 border-t border-border/50">
            Every data point on every council page links back to its original <code className="font-mono bg-muted px-1.5 py-0.5 rounded">.gov.uk</code> source. See the{' '}
            <Link href="/methodology" className="hover:text-foreground transition-colors">methodology</Link> for the full source list.
          </p>
        </section>

        {/* Per-council quick links */}
        <section className="card-elevated p-5 sm:p-6 mb-5">
          <h2 className="type-title-2 mb-1">Per-council data</h2>
          <p className="type-body-sm text-muted-foreground mb-5">
            Pull any council&apos;s full record as JSON. No API key.
          </p>

          <div className="space-y-3">
            <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
              <p className="type-caption text-muted-foreground mb-1">Any council (replace slug)</p>
              <code className="type-body-sm font-mono">https://www.civaccount.co.uk/api/v1/councils/<span className="text-muted-foreground">[slug]</span></code>
            </div>
            <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
              <p className="type-caption text-muted-foreground mb-1">Example</p>
              {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- this targets a JSON API endpoint, not a page route */}
              <a href="/api/v1/councils/kent" className="type-body-sm font-mono hover:text-muted-foreground transition-colors">
                https://www.civaccount.co.uk/api/v1/councils/kent
              </a>
            </div>
            <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
              <p className="type-caption text-muted-foreground mb-1">Change feed (what&apos;s new)</p>
              <code className="type-body-sm font-mono">https://www.civaccount.co.uk/api/v1/diffs?since=2026-04-01</code>
            </div>
          </div>

          <p className="type-caption text-muted-foreground mt-5 pt-4 border-t border-border/50">
            Slugs are kebab-case council names (e.g. <code className="font-mono">kent</code>, <code className="font-mono">birmingham</code>,
            {' '}<code className="font-mono">tower-hamlets</code>). Full list in the{' '}
            <Link href="/sitemap.xml" className="hover:text-foreground transition-colors">sitemap</Link>.
          </p>
        </section>

        {/* Popular councils shortcut */}
        <section className="card-elevated p-5 sm:p-6 mb-5">
          <h2 className="type-title-2 mb-1">Popular council pages</h2>
          <p className="type-body-sm text-muted-foreground mb-5">Common starting points</p>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-2">
            {[
              'kent', 'surrey', 'birmingham', 'manchester', 'liverpool', 'leeds',
              'westminster', 'hackney', 'tower-hamlets', 'camden', 'croydon', 'cornwall',
            ].map((slug) => {
              const c = councils.find((x) => getCouncilSlug(x) === slug);
              if (!c) return null;
              return (
                <Link
                  key={slug}
                  href={`/council/${slug}`}
                  className="type-body-sm text-muted-foreground hover:text-foreground transition-colors py-1"
                >
                  {getCouncilDisplayName(c)}
                </Link>
              );
            })}
          </div>
        </section>

        {/* FAQ */}
        <section className="card-elevated p-5 sm:p-6 mb-5">
          <h2 className="type-title-2 mb-1">Common questions</h2>
          <p className="type-body-sm text-muted-foreground mb-5">About using the data</p>

          <div className="space-y-3">
            {faqs.map((f) => (
              <div key={f.question} className="p-3 rounded-lg bg-muted/30">
                <p className="type-body-sm font-semibold mb-1">{f.question}</p>
                <p className="type-caption text-muted-foreground">{f.answer}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Corrections & contributions — minimal */}
        <section className="card-elevated p-5 sm:p-6 mb-5">
          <h2 className="type-title-2 mb-1">Corrections & contributions</h2>
          <p className="type-body-sm text-muted-foreground mb-5">
            The data is maintained openly. Errors are fixed and logged publicly.
          </p>

          <div className="space-y-3">
            <div className="p-4 rounded-lg bg-muted/30 border border-border/50">
              <p className="type-body-sm mb-3">
                <span className="font-semibold">Spotted an error?</span>{' '}
                Tell us the page, the figure, and the source you believe is correct. Fixes are logged transparently on the{' '}
                <Link href="/changelog" className="hover:text-foreground transition-colors">change log</Link>.
              </p>
              <PressContactButton label="Report a correction" subject="Data correction" />
            </div>

            <div className="p-4 rounded-lg bg-muted/30 border border-border/50">
              <p className="type-body-sm">
                <span className="font-semibold">Developers & contributors.</span>{' '}
                Public issues and pull requests welcome on{' '}
                <a
                  href="https://github.com/wulfsagedev/civaccount"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-foreground transition-colors"
                >
                  GitHub
                  <span className="sr-only"> (opens in new tab)</span>
                </a>.
              </p>
            </div>
          </div>

          <p className="type-caption text-muted-foreground mt-5 pt-4 border-t border-border/50">
            CivAccount is a data presentation tool, not a media organisation — it does not provide commentary, interpretation, or interviews. For comment on council finances, contact the council directly.
          </p>
        </section>

        {/* Brand & assets */}
        <section className="card-elevated p-5 sm:p-6 mb-5">
          <h2 className="type-title-2 mb-1">Brand & assets</h2>
          <p className="type-body-sm text-muted-foreground mb-5">If you&apos;re writing about the tool itself</p>

          <ul className="space-y-2">
            <li className="type-body-sm text-muted-foreground">
              <span className="font-semibold text-foreground">Name:</span> CivAccount (one word, capital C and A)
            </li>
            <li className="type-body-sm text-muted-foreground">
              <span className="font-semibold text-foreground">Domain:</span> civaccount.co.uk (or www.civaccount.co.uk)
            </li>
            <li className="type-body-sm text-muted-foreground">
              <span className="font-semibold text-foreground">Logo:</span>{' '}
              <a href="/icon-512" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">
                /icon-512
              </a>{' '}
              (512×512 PNG, transparent background). SVG in the{' '}
              <a
                href="https://github.com/wulfsagedev/civaccount"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-foreground transition-colors"
              >
                GitHub repo
                <span className="sr-only"> (opens in new tab)</span>
              </a>.
            </li>
            <li className="type-body-sm text-muted-foreground">
              <span className="font-semibold text-foreground">Short description:</span> &ldquo;An open-source tool that presents public UK council data in an accessible format.&rdquo;
            </li>
            <li className="type-body-sm text-muted-foreground">
              <span className="font-semibold text-foreground">Licence:</span> Code MIT; data Open Government Licence v3.0.
            </li>
          </ul>
        </section>

        {/* Cross-links */}
        <nav className="mt-8 space-y-2">
          <p className="type-body-sm font-semibold mb-3">More</p>
          <ul className="space-y-2">
            <li><Link href="/methodology" className="type-body-sm text-muted-foreground hover:text-foreground transition-colors">Methodology</Link></li>
            <li><Link href="/about" className="type-body-sm text-muted-foreground hover:text-foreground transition-colors">About CivAccount</Link></li>
            <li><Link href="/developers" className="type-body-sm text-muted-foreground hover:text-foreground transition-colors">Developer API & embeds</Link></li>
            <li><Link href="/changelog" className="type-body-sm text-muted-foreground hover:text-foreground transition-colors">Data change log</Link></li>
            <li><Link href="/license" className="type-body-sm text-muted-foreground hover:text-foreground transition-colors">Licence</Link></li>
            <li><a href="/updates/rss.xml" className="type-body-sm text-muted-foreground hover:text-foreground transition-colors">Updates RSS feed</a></li>
          </ul>
        </nav>
      </PageContainer>

      <Footer />
    </div>
  );
}
