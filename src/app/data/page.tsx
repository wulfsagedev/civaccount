import type { Metadata } from 'next';
import Link from 'next/link';
import { councils } from '@/data/councils';
import { buildFAQPageSchema, buildBreadcrumbSchema, buildWebPageSchema } from '@/lib/structured-data';
import Breadcrumb from '@/components/proposals/Breadcrumb';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  title: 'Data reference — field dictionary & usage',
  description:
    'Reference for the CivAccount council dataset: fields, units, coverage, and how to access it. All figures sourced from .gov.uk.',
  alternates: {
    canonical: '/data',
  },
  openGraph: {
    title: 'CivAccount data reference',
    description: 'Field dictionary and usage reference for the council dataset.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CivAccount data reference',
    description: 'Field dictionary and usage reference for the council dataset.',
  },
};

export default function DataPage() {
  const councilsWithTax = councils.filter((c) => c.council_tax?.band_d_2025);
  const councilsWithBudget = councils.filter((c) => c.budget?.total_service);
  const councilsWithSalary = councils.filter((c) => c.detailed?.chief_executive_salary);

  const fields = [
    { name: 'Council identifiers', description: 'Name, ONS code, slug, type, population' },
    { name: 'Council tax bands', description: 'Band D rates for 2021-2025 and year-on-year change' },
    { name: 'Service budgets', description: '10 spending categories (education, social care, transport, etc.) in thousands of pounds' },
    { name: 'Leadership', description: 'Chief executive name, CEO salary, council leader, councillor basic allowance' },
    { name: 'Links', description: 'Council website URL and CivAccount dashboard URL' },
  ];

  const faqs = [
    {
      question: 'What data does the dataset cover?',
      answer: `All ${councilsWithTax.length} English councils with Band D council tax rates (2021-2025), service budgets across 10 categories, CEO salaries, and council leadership information.`,
    },
    {
      question: 'What licence is the data released under?',
      answer: 'Open Government Licence v3.0 (the underlying source data is already public under OGL). You are free to use, share, and adapt the data for any purpose, including commercial use.',
    },
    {
      question: 'Where does the data come from?',
      answer: 'Exclusively from GOV.UK, individual council .gov.uk websites, and ONS. No third-party aggregators.',
    },
    {
      question: 'How often is the data updated?',
      answer: 'Council tax rates are refreshed within two weeks of each council setting its budget (Feb–Mar). Spending data follows the DLUHC publication cycle (typically Nov). Leadership and supplier data is updated throughout the year as councils publish.',
    },
    {
      question: 'Is there a bulk download?',
      answer: 'No. CivAccount does not offer a bulk CSV or JSON of the full dataset. Individual council records are available at /api/v1/councils/[slug] — look up the councils you need. The site itself is the canonical presentation.',
    },
    {
      question: 'Can I embed a council widget on my site?',
      answer: 'Yes. Free embeddable iframes are available at /embed/council/[slug]. See /developers for snippets.',
    },
  ];

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      buildWebPageSchema(
        'Data reference — field dictionary & usage',
        metadata.description as string,
        '/data',
        { type: 'WebPage' },
      ),
      buildFAQPageSchema(faqs, '/data'),
      buildBreadcrumbSchema(
        [{ name: 'Home', url: '/' }, { name: 'Data reference' }],
        '/data',
      ),
    ],
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <main id="main-content" className="flex-1 container mx-auto px-4 max-w-3xl py-8">
        <Breadcrumb items={[
          { label: 'Home', href: '/' },
          { label: 'Data reference' },
        ]} />

        <h1 className="type-title-1 mb-2">Data reference</h1>
        <p className="type-body-sm text-muted-foreground mb-8">
          Field dictionary, coverage, and lookup endpoints for the CivAccount dataset.
          Individual council records available via per-council API. No bulk download.
        </p>

        {/* Coverage */}
        <section className="card-elevated p-5 sm:p-6 mb-5">
          <h2 className="type-title-2 mb-1">Coverage</h2>
          <p className="type-body-sm text-muted-foreground mb-6">What the dataset includes</p>

          <div className="space-y-3">
            <div className="flex items-baseline justify-between py-2">
              <span className="type-body-sm text-muted-foreground">Councils with council tax data</span>
              <span className="type-body-sm font-semibold tabular-nums">{councilsWithTax.length}/317</span>
            </div>
            <div className="flex items-baseline justify-between py-2">
              <span className="type-body-sm text-muted-foreground">Councils with budget data</span>
              <span className="type-body-sm font-semibold tabular-nums">{councilsWithBudget.length}/317</span>
            </div>
            <div className="flex items-baseline justify-between py-2">
              <span className="type-body-sm text-muted-foreground">Councils with CEO salary data</span>
              <span className="type-body-sm font-semibold tabular-nums">{councilsWithSalary.length}/317</span>
            </div>
          </div>
        </section>

        {/* Fields */}
        <section className="card-elevated p-5 sm:p-6 mb-5">
          <h2 className="type-title-2 mb-1">Data fields</h2>
          <p className="type-body-sm text-muted-foreground mb-6">Returned by the per-council endpoint</p>

          <div className="space-y-4">
            {fields.map((field) => (
              <div key={field.name} className="py-2">
                <p className="type-body-sm font-semibold mb-1">{field.name}</p>
                <p className="type-caption text-muted-foreground">{field.description}</p>
              </div>
            ))}
          </div>

          <p className="type-caption text-muted-foreground mt-6 pt-4 border-t border-border/50">
            Units: budget values in thousands of pounds (multiply by 1000 for absolute); council tax in pounds;
            supplier spend in pounds.
          </p>
        </section>

        {/* API access — per-council only */}
        <section className="card-elevated p-5 sm:p-6 mb-5">
          <h2 className="type-title-2 mb-1">How to access records</h2>
          <p className="type-body-sm text-muted-foreground mb-6">
            Individual council lookups, not bulk export.
          </p>

          <div className="space-y-4">
            <div className="py-2">
              <p className="type-body-sm font-semibold mb-1">Single council (full record)</p>
              <code className="type-caption text-muted-foreground bg-muted/30 px-2 py-1 rounded">
                GET /api/v1/councils/[slug]
              </code>
              <p className="type-caption text-muted-foreground mt-2">
                Example:{' '}
                {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- JSON API endpoint, not a page route */}
                <a href="/api/v1/councils/kent" className="font-mono hover:text-foreground transition-colors">/api/v1/councils/kent</a>
              </p>
            </div>
            <div className="py-2">
              <p className="type-body-sm font-semibold mb-1">Search by name or type</p>
              <code className="type-caption text-muted-foreground bg-muted/30 px-2 py-1 rounded">
                GET /api/v1/councils?search=kent
              </code>
              <p className="type-caption text-muted-foreground mt-2">
                A <code className="font-mono bg-muted px-1 py-0.5 rounded">search</code> or <code className="font-mono bg-muted px-1 py-0.5 rounded">type</code> parameter is required. Returns slim records.
              </p>
            </div>
            <div className="py-2">
              <p className="type-body-sm font-semibold mb-1">Change feed</p>
              <code className="type-caption text-muted-foreground bg-muted/30 px-2 py-1 rounded">
                GET /api/v1/diffs?since=2026-04-01
              </code>
            </div>
          </div>

          <p className="type-caption text-muted-foreground mt-6 pt-4 border-t border-border/50">
            Rate limit: 60 requests per minute per IP for list, 100 per minute for single-council lookups.
            No API key. Full slug list in the <Link href="/sitemap.xml" className="hover:text-foreground transition-colors">sitemap</Link>.
          </p>
        </section>

        {/* Embed */}
        <section className="card-elevated p-5 sm:p-6 mb-5">
          <h2 className="type-title-2 mb-1">Embed a council widget</h2>
          <p className="type-body-sm text-muted-foreground mb-6">
            Add a council tax card to your website. Replace &quot;kent&quot; with any council slug.
          </p>

          <code className="block type-caption text-muted-foreground bg-muted/30 px-3 py-2 rounded overflow-x-auto whitespace-pre">
            {`<iframe src="https://www.civaccount.co.uk/embed/council/kent" width="432" height="300" frameborder="0" style="border:0;border-radius:12px"></iframe>`}
          </code>

          <p className="type-caption text-muted-foreground mt-4">
            Free to use. Links back to the full dashboard on CivAccount.
          </p>
        </section>

        {/* FAQ */}
        <section className="card-elevated p-5 sm:p-6 mb-5">
          <h2 className="type-title-2 mb-1">Common questions</h2>
          <p className="type-body-sm text-muted-foreground mb-5">About the data</p>

          <div className="space-y-3">
            {faqs.map((faq) => (
              <div key={faq.question} className="p-3 rounded-lg bg-muted/30">
                <p className="type-body-sm font-semibold mb-1">{faq.question}</p>
                <p className="type-caption text-muted-foreground">{faq.answer}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Sources */}
        <section className="p-3 rounded-lg bg-muted/30">
          <p className="type-caption text-muted-foreground">
            All data sourced exclusively from GOV.UK, individual council .gov.uk websites, and ONS.
            See our{' '}
            <Link href="/methodology" className="hover:text-foreground transition-colors">
              methodology
            </Link>
            {' '}for details.
          </p>
        </section>

        <nav className="mt-8 space-y-2">
          <p className="type-body-sm font-semibold mb-3">Explore the data</p>
          <ul className="space-y-2">
            <li><Link href="/insights" className="type-body-sm text-muted-foreground hover:text-foreground transition-colors">National insights</Link></li>
            <li><Link href="/insights/cheapest-council-tax" className="type-body-sm text-muted-foreground hover:text-foreground transition-colors">Cheapest council tax</Link></li>
            <li><Link href="/insights/council-ceo-salaries" className="type-body-sm text-muted-foreground hover:text-foreground transition-colors">CEO salary rankings</Link></li>
            <li><Link href="/compare" className="type-body-sm text-muted-foreground hover:text-foreground transition-colors">Compare councils</Link></li>
            <li><Link href="/developers" className="type-body-sm text-muted-foreground hover:text-foreground transition-colors">Developer reference</Link></li>
          </ul>
        </nav>
      </main>
      <Footer />
    </div>
  );
}
