import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  getCouncilBySlug,
  getCouncilDisplayName,
  getAllCouncilSlugs,
} from '@/data/councils';
import {
  buildWebPageSchema,
  buildBreadcrumbSchema,
} from '@/lib/structured-data';
import Breadcrumb from '@/components/proposals/Breadcrumb';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { PageContainer } from '@/components/ui/page-container';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, Calendar, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { serializeJsonLd } from '@/lib/safe-json-ld';

const BASE_URL = 'https://www.civaccount.co.uk';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return getAllCouncilSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const council = getCouncilBySlug(slug);
  if (!council) return { title: 'Council not found' };
  const name = getCouncilDisplayName(council);
  return {
    title: `Data provenance for ${name} — every source linked`,
    description: `Every data point CivAccount publishes for ${name} has a direct link to its official GOV.UK or council source. See exactly where each figure comes from and when it was last verified.`,
    alternates: { canonical: `/council/${slug}/provenance` },
    openGraph: {
      title: `Data provenance — ${name}`,
      description: `Every figure linked to its official source.`,
    },
    twitter: {
      card: 'summary_large_image',
      title: `Data provenance — ${name}`,
      description: `Every figure linked to its official source.`,
    },
  };
}

// Human-friendly labels for the common fields carrying `field_sources` entries.
const FIELD_LABEL: Record<string, string> = {
  chief_executive_salary: 'Chief executive salary',
  council_leader: 'Council leader',
  chief_executive: 'Chief executive',
  councillor_basic_allowance: 'Councillor basic allowance',
  total_allowances_cost: 'Total councillor allowances (annual cost)',
  councillor_allowances_detail: 'Per-councillor allowance breakdown',
  cabinet: 'Cabinet members & portfolios',
  salary_bands: 'Senior officer salary bands',
  staff_fte: 'Staff (full-time equivalent)',
  top_suppliers: 'Top suppliers',
  grant_payments: 'Grant payments to third-sector bodies',
  waste_destinations: 'Where waste is sent (DEFRA tonnage)',
  performance_kpis: 'Performance KPIs',
  budget_gap: 'Budget gap',
  savings_target: 'Savings target',
  service_outcomes: 'Service outcomes',
  service_spending: 'Detailed service spending',
  documents: 'Key council documents',
  open_data_links: 'Open data portal links',
  council_tax: 'Council tax (Band D and precepts)',
  budget: 'Service budget categories',
};

// Sources used for all councils (GOV.UK bulk datasets).
const NATIONAL_SOURCES = [
  {
    name: 'Council Tax 2025-26',
    publisher: 'GOV.UK (MHCLG)',
    url: 'https://www.gov.uk/government/statistics/council-tax-levels-set-by-local-authorities-in-england-2025-to-2026',
    fields: ['Band D council tax', 'Precepts (parish, police, fire)', 'Tax rise percentage vs prior year'],
  },
  {
    name: 'Revenue Account (RA) 2025-26',
    publisher: 'GOV.UK (MHCLG)',
    url: 'https://www.gov.uk/government/collections/local-authority-revenue-expenditure-and-financing',
    fields: ['Net service budget (all 10 categories)', 'Gross expenditure', 'Total service budget'],
  },
  {
    name: 'Revenue Outturn (RO) 2024-25',
    publisher: 'GOV.UK (MHCLG)',
    url: 'https://www.gov.uk/government/collections/local-authority-revenue-expenditure-and-financing',
    fields: ['Final out-turn spending', 'Variance vs budget'],
  },
  {
    name: 'ONS Mid-2024 Population Estimates',
    publisher: 'Office for National Statistics',
    url: 'https://www.ons.gov.uk/peoplepopulationandcommunity/populationandmigration/populationestimates',
    fields: ['Population', 'Per-capita calculations'],
  },
  {
    name: 'Local Government Boundary Commission (LGBCE)',
    publisher: 'LGBCE',
    url: 'https://www.lgbce.org.uk/',
    fields: ['Council type', 'Ward structure', 'Councillor numbers'],
  },
  {
    name: 'DEFRA Local Authority Waste Statistics 2022-23',
    publisher: 'DEFRA',
    url: 'https://www.gov.uk/government/statistical-data-sets/env18-local-authority-collected-waste-annual-results-tables',
    fields: ['Waste sent to recycling', 'Waste sent to energy from waste', 'Waste sent to landfill'],
  },
];

export default async function ProvenancePage({ params }: Props) {
  const { slug } = await params;
  const council = getCouncilBySlug(slug);
  if (!council) notFound();

  const name = getCouncilDisplayName(council);
  const detailed = council.detailed;
  const fieldSources = detailed?.field_sources ?? {};
  const lastVerified = detailed?.last_verified;

  // Deterministic ordering: alphabetical by field name for reader scanning.
  const fieldEntries = Object.entries(fieldSources).sort(([a], [b]) =>
    (FIELD_LABEL[a] ?? a).localeCompare(FIELD_LABEL[b] ?? b),
  );

  const url = `/council/${slug}/provenance`;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      buildWebPageSchema(
        `Data provenance for ${name}`,
        `Every data point CivAccount publishes for ${name} has a direct link to its official source.`,
        url,
      ),
      {
        '@type': 'Dataset',
        '@id': `${BASE_URL}${url}#dataset`,
        name: `${name} — CivAccount data provenance`,
        description: `Source-URL manifest for every financial, leadership, and performance data point CivAccount publishes for ${name}.`,
        url: `${BASE_URL}${url}`,
        isAccessibleForFree: true,
        keywords: [
          name,
          'council data provenance',
          'local government finance',
          'data sources',
          'open government licence',
        ].join(', '),
        creator: { '@id': `${BASE_URL}/#organization` },
        publisher: { '@id': `${BASE_URL}/#organization` },
        license: 'https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/',
        ...(lastVerified && { dateModified: lastVerified }),
        spatialCoverage: {
          '@type': 'Place',
          name,
          addressCountry: 'GB',
        },
      },
      buildBreadcrumbSchema(
        [
          { name: 'Home', url: '/' },
          { name, url: `/council/${slug}` },
          { name: 'Data provenance' },
        ],
        url,
      ),
    ],
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }} />

      <PageContainer className="py-8 sm:py-12">
        <Breadcrumb
          items={[
            { label: 'Home', href: '/' },
            { label: name, href: `/council/${slug}` },
            { label: 'Data provenance' },
          ]}
        />

        <div className="text-center space-y-3 mb-10">
          <Badge variant="outline" className="mb-2">Transparency</Badge>
          <h1 className="type-title-1 font-semibold">Data provenance — {name}</h1>
          <p className="type-body-sm text-muted-foreground max-w-2xl mx-auto">
            Every figure on the {name} page links back to an official source. Here is the full manifest —
            what each data point is, where it comes from, and when it was last verified.
          </p>
        </div>

        {/* Headline trust card */}
        <section className="card-elevated p-5 sm:p-6 mb-5">
          <h2 className="type-title-2 mb-1">How we source {name} data</h2>
          <p className="type-body-sm text-muted-foreground mb-5">The bar is: every number traceable to a <code className="font-mono text-[13px] bg-muted px-1.5 py-0.5 rounded">.gov.uk</code> URL.</p>

          <div className="space-y-3">
            <div className="flex gap-3">
              <CheckCircle2 className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" aria-hidden="true" />
              <p className="type-body-sm text-muted-foreground">
                <span className="font-semibold text-foreground">Official UK government data only.</span>{' '}
                No third-party aggregators. All figures come from GOV.UK bulk datasets (MHCLG Revenue Account, ONS, DEFRA, LGBCE)
                or from {name}&apos;s own <code className="font-mono text-[13px] bg-muted px-1.5 py-0.5 rounded">.gov.uk</code> website.
              </p>
            </div>
            <div className="flex gap-3">
              <CheckCircle2 className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" aria-hidden="true" />
              <p className="type-body-sm text-muted-foreground">
                <span className="font-semibold text-foreground">Multi-source triangulation.</span>{' '}
                Budget and population figures are cross-checked against at least two sources (e.g. council&apos;s own budget
                report vs. MHCLG RA return). If two sources disagree, we flag it in our internal validator
                and hold off publishing until we can verify the correct figure.
              </p>
            </div>
            <div className="flex gap-3">
              <CheckCircle2 className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" aria-hidden="true" />
              <p className="type-body-sm text-muted-foreground">
                <span className="font-semibold text-foreground">Dated and auditable.</span>{' '}
                Every data point records the date it was verified. Spotted a discrepancy? Contact us and we&apos;ll
                investigate transparently — corrections are published on our{' '}
                <Link href="/changelog" className="hover:text-foreground transition-colors">change log</Link>.
              </p>
            </div>
          </div>

          {lastVerified && (
            <div className="mt-5 p-3 rounded-lg bg-muted/30 border border-border/50 flex items-center gap-3">
              <Calendar className="h-4 w-4 text-muted-foreground shrink-0" aria-hidden="true" />
              <p className="type-body-sm">
                <span className="text-muted-foreground">Detailed data last verified:</span>{' '}
                <span className="font-semibold tabular-nums">{lastVerified}</span>
              </p>
            </div>
          )}
        </section>

        {/* National / bulk sources */}
        <section className="card-elevated p-5 sm:p-6 mb-5">
          <h2 className="type-title-2 mb-1">National sources (every council)</h2>
          <p className="type-body-sm text-muted-foreground mb-5">
            Bulk datasets used for every council on CivAccount. Council tax, service budgets, and population all come from these.
          </p>

          <ul className="space-y-4">
            {NATIONAL_SOURCES.map((s) => (
              <li key={s.name} className="pb-4 border-b border-border/50 last:border-b-0 last:pb-0">
                <div className="flex items-start justify-between gap-4 mb-1">
                  <div className="min-w-0">
                    <p className="type-body-sm font-semibold">{s.name}</p>
                    <p className="type-caption text-muted-foreground">{s.publisher}</p>
                  </div>
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 inline-flex items-center gap-1.5 type-caption text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Open source
                    <ExternalLink className="h-3 w-3" aria-hidden="true" />
                    <span className="sr-only"> (opens in new tab)</span>
                  </a>
                </div>
                <ul className="mt-2 space-y-1">
                  {s.fields.map((f) => (
                    <li key={f} className="type-caption text-muted-foreground flex items-start gap-2 pl-3">
                      <span className="w-1 h-1 rounded-full bg-muted-foreground mt-1.5 shrink-0" aria-hidden="true" />
                      {f}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </section>

        {/* Per-field sources (council-specific) */}
        <section className="card-elevated p-5 sm:p-6 mb-5">
          <h2 className="type-title-2 mb-1">Field-level sources ({fieldEntries.length})</h2>
          <p className="type-body-sm text-muted-foreground mb-5">
            Council-specific fields with a direct source URL. Each links to the exact{' '}
            <code className="font-mono text-[13px] bg-muted px-1.5 py-0.5 rounded">.gov.uk</code> document CivAccount pulled the data from.
          </p>

          {fieldEntries.length === 0 ? (
            <p className="type-body-sm text-muted-foreground italic">
              No field-level sources captured yet for this council. Core data still comes from the national sources above.
            </p>
          ) : (
            <ul className="space-y-4">
              {fieldEntries.map(([fieldKey, src]) => (
                <li key={fieldKey} className="pb-4 border-b border-border/50 last:border-b-0 last:pb-0">
                  <div className="flex items-start justify-between gap-4 mb-1">
                    <div className="min-w-0">
                      <p className="type-body-sm font-semibold">{FIELD_LABEL[fieldKey] ?? fieldKey}</p>
                      <p className="type-caption text-muted-foreground break-words">{src.title}</p>
                      {src.page && (
                        <p className="type-caption text-muted-foreground mt-1">Page {src.page}</p>
                      )}
                    </div>
                    <a
                      href={src.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 inline-flex items-center gap-1.5 type-caption text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Open source
                      <ExternalLink className="h-3 w-3" aria-hidden="true" />
                      <span className="sr-only"> (opens in new tab)</span>
                    </a>
                  </div>
                  <p className="type-caption text-muted-foreground mt-2 flex items-center gap-1.5">
                    <Calendar className="h-3 w-3" aria-hidden="true" />
                    <span className="tabular-nums">Accessed {src.accessed}</span>
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Methodology link block */}
        <section className="card-elevated p-5 sm:p-6 mb-5">
          <div className="flex gap-3">
            <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
              <ShieldCheck className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
            </div>
            <div>
              <p className="type-title-3 font-semibold mb-1">Want the full methodology?</p>
              <p className="type-body-sm text-muted-foreground mb-3">
                How we collect, validate, and present council data — plus our correction policy, open data licence, and update cadence.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link
                  href="/methodology"
                  className="inline-flex items-center gap-1.5 type-body-sm font-medium hover:text-muted-foreground transition-colors"
                >
                  Methodology →
                </Link>
                <Link
                  href="/changelog"
                  className="inline-flex items-center gap-1.5 type-body-sm font-medium hover:text-muted-foreground transition-colors"
                >
                  Change log →
                </Link>
                <Link
                  href="/press"
                  className="inline-flex items-center gap-1.5 type-body-sm font-medium hover:text-muted-foreground transition-colors"
                >
                  Press kit →
                </Link>
                <a
                  href={`/api/v1/councils/${slug}`}
                  className="inline-flex items-center gap-1.5 type-body-sm font-medium hover:text-muted-foreground transition-colors"
                >
                  Raw JSON →
                </a>
              </div>
            </div>
          </div>
        </section>

        <nav className="mt-8">
          <Link
            href={`/council/${slug}`}
            className="inline-flex items-center gap-2 type-body-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Back to {name}
          </Link>
        </nav>
      </PageContainer>

      <Footer />
    </div>
  );
}
