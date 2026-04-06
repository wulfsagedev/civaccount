import type { Metadata } from 'next';
import Link from 'next/link';
import { councils, formatCurrency } from '@/data/councils';
import { buildFAQPageSchema, buildBreadcrumbSchema } from '@/lib/structured-data';
import Breadcrumb from '@/components/proposals/Breadcrumb';

export const metadata: Metadata = {
  title: 'Open Data — Download Council Tax & Budget Data | CivAccount',
  description: 'Download council tax rates, budgets, and spending data for all 317 English councils in CSV or JSON format. Free, open data under the Open Government Licence.',
  alternates: {
    canonical: '/data',
  },
  openGraph: {
    title: 'Open Data — Council Tax & Budget Downloads',
    description: 'Free council tax and budget data for all 317 English councils. Download as CSV or JSON.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Open Data — Council Tax & Budget Downloads',
    description: 'Free council tax and budget data for all 317 English councils. Download as CSV or JSON.',
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
      question: 'What data is included in the download?',
      answer: `The dataset covers all ${councilsWithTax.length} English councils with Band D council tax rates (2021-2025), service budgets across 10 categories, CEO salaries, and council leadership information.`,
    },
    {
      question: 'What licence is the data released under?',
      answer: 'The data is released under the Open Government Licence v3.0. You are free to use, share, and adapt the data for any purpose, including commercial use.',
    },
    {
      question: 'Where does the data come from?',
      answer: 'All data is sourced exclusively from GOV.UK, individual council .gov.uk websites, and ONS population estimates. No third-party sources are used.',
    },
    {
      question: 'How often is the data updated?',
      answer: 'The dataset is updated annually when new council tax rates and budget figures are published, typically in February-April each year.',
    },
  ];

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Dataset',
        '@id': 'https://www.civaccount.co.uk/data#dataset',
        name: 'English Council Tax & Budget Data 2025-26',
        description: 'Council tax rates, service budgets, leadership, and spending data for all 317 English councils.',
        license: 'https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/',
        temporalCoverage: '2021/2026',
        spatialCoverage: {
          '@type': 'Country',
          name: 'England',
        },
        publisher: {
          '@type': 'Organization',
          '@id': 'https://www.civaccount.co.uk/#organization',
          name: 'CivAccount',
        },
        distribution: [
          {
            '@type': 'DataDownload',
            encodingFormat: 'text/csv',
            contentUrl: 'https://www.civaccount.co.uk/api/v1/download?format=csv',
            name: 'CSV download',
          },
          {
            '@type': 'DataDownload',
            encodingFormat: 'application/json',
            contentUrl: 'https://www.civaccount.co.uk/api/v1/download?format=json',
            name: 'JSON download',
          },
        ],
        variableMeasured: [
          { '@type': 'PropertyValue', name: 'Band D Council Tax', unitCode: 'GBP' },
          { '@type': 'PropertyValue', name: 'Total Service Budget', unitCode: 'GBP' },
          { '@type': 'PropertyValue', name: 'Chief Executive Salary', unitCode: 'GBP' },
        ],
      },
      buildFAQPageSchema(faqs, '/data'),
      buildBreadcrumbSchema(
        [{ name: 'Home', url: '/' }, { name: 'Open Data' }],
        '/data'
      ),
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <main id="main-content" className="container mx-auto px-4 max-w-3xl py-8">
        <Breadcrumb items={[
          { label: 'Home', href: '/' },
          { label: 'Open Data' },
        ]} />

        <h1 className="type-title-1 mb-2">Open Data</h1>
        <p className="type-body-sm text-muted-foreground mb-8">
          Download council tax rates, budgets, and spending data for all {councilsWithTax.length} English councils.
          Free to use under the Open Government Licence v3.0.
        </p>

        {/* Download buttons */}
        <section className="card-elevated p-5 sm:p-6 mb-5">
          <h2 className="type-title-2 mb-1">Download the dataset</h2>
          <p className="type-body-sm text-muted-foreground mb-6">
            All {councilsWithTax.length} councils with council tax, budgets, and leadership data for 2025-26
          </p>

          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <a
              href="/api/v1/download?format=csv"
              download
              className="flex-1 card-elevated p-4 text-center type-body-sm font-semibold hover:bg-muted transition-colors cursor-pointer"
            >
              Download CSV
            </a>
            <a
              href="/api/v1/download?format=json"
              download
              className="flex-1 card-elevated p-4 text-center type-body-sm font-semibold hover:bg-muted transition-colors cursor-pointer"
            >
              Download JSON
            </a>
          </div>

          <p className="type-caption text-muted-foreground">
            Released under the{' '}
            <a
              href="https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground transition-colors"
            >
              Open Government Licence v3.0
              <span className="sr-only"> (opens in new tab)</span>
            </a>
          </p>
        </section>

        {/* Coverage stats */}
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
          <p className="type-body-sm text-muted-foreground mb-6">30+ fields per council</p>

          <div className="space-y-4">
            {fields.map((field) => (
              <div key={field.name} className="py-2">
                <p className="type-body-sm font-semibold mb-1">{field.name}</p>
                <p className="type-caption text-muted-foreground">{field.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* API access */}
        <section className="card-elevated p-5 sm:p-6 mb-5">
          <h2 className="type-title-2 mb-1">API access</h2>
          <p className="type-body-sm text-muted-foreground mb-6">
            Access council data programmatically via our REST API
          </p>

          <div className="space-y-4">
            <div className="py-2">
              <p className="type-body-sm font-semibold mb-1">List all councils</p>
              <code className="type-caption text-muted-foreground bg-muted/30 px-2 py-1 rounded">
                GET /api/v1/councils
              </code>
            </div>
            <div className="py-2">
              <p className="type-body-sm font-semibold mb-1">Single council</p>
              <code className="type-caption text-muted-foreground bg-muted/30 px-2 py-1 rounded">
                GET /api/v1/councils/kent
              </code>
            </div>
            <div className="py-2">
              <p className="type-body-sm font-semibold mb-1">Download full dataset</p>
              <code className="type-caption text-muted-foreground bg-muted/30 px-2 py-1 rounded">
                GET /api/v1/download?format=csv
              </code>
            </div>
          </div>

          <p className="type-caption text-muted-foreground mt-6 pt-4 border-t border-border/50">
            Rate limited to 100 requests per minute for list endpoints, 10 per minute for downloads.
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

        {/* Embeddable widget */}
        <section className="card-elevated p-5 sm:p-6 mb-5">
          <h2 className="type-title-2 mb-1">Embed a council widget</h2>
          <p className="type-body-sm text-muted-foreground mb-6">
            Add a council tax card to your website. Replace &quot;kent&quot; with any council slug.
          </p>

          <code className="block type-caption text-muted-foreground bg-muted/30 px-3 py-2 rounded overflow-x-auto whitespace-pre">
            {`<iframe src="https://www.civaccount.co.uk/embed/kent" width="432" height="300" frameborder="0" style="border:0;border-radius:12px"></iframe>`}
          </code>

          <p className="type-caption text-muted-foreground mt-4">
            Free to use. Links back to the full dashboard on CivAccount.
          </p>
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
          </ul>
        </nav>
      </main>
    </>
  );
}
