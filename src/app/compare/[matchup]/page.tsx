import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getCouncilBySlug, getCouncilDisplayName, getCouncilSlug, formatCurrency, formatBudget, getCouncilPopulation } from '@/data/councils';
import { buildFAQPageSchema, buildBreadcrumbSchema } from '@/lib/structured-data';
import { getPopularComparisons } from '@/lib/comparisons';
import Breadcrumb from '@/components/proposals/Breadcrumb';

interface Props {
  params: Promise<{ matchup: string }>;
}

export async function generateStaticParams() {
  return getPopularComparisons().map((matchup) => ({ matchup }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { matchup } = await params;
  const parts = matchup.split('-vs-');
  if (parts.length !== 2) return { title: 'Compare Councils | CivAccount' };

  const councilA = getCouncilBySlug(parts[0]);
  const councilB = getCouncilBySlug(parts[1]);
  if (!councilA || !councilB) return { title: 'Compare Councils | CivAccount' };

  const nameA = getCouncilDisplayName(councilA);
  const nameB = getCouncilDisplayName(councilB);

  return {
    title: `${nameA} vs ${nameB} Council Tax 2025-26 | CivAccount`,
    description: `Compare ${nameA} and ${nameB} council tax rates, spending, and budgets for 2025-26. Side-by-side comparison of Band D rates, service budgets, and CEO salaries.`,
    alternates: {
      canonical: `/compare/${matchup}`,
    },
    openGraph: {
      title: `${nameA} vs ${nameB} — Council Tax Comparison`,
      description: `How do ${nameA} and ${nameB} compare on council tax and spending?`,
    },
    twitter: {
      card: 'summary_large_image',
      title: `${nameA} vs ${nameB} — Council Tax Comparison`,
      description: `How do ${nameA} and ${nameB} compare on council tax and spending?`,
    },
  };
}

// Service category mapping
const SERVICE_MAP = [
  { key: 'education', name: 'Education' },
  { key: 'adult_social_care', name: 'Adult Social Care' },
  { key: 'childrens_social_care', name: "Children's Services" },
  { key: 'environmental', name: 'Environment & Streets' },
  { key: 'transport', name: 'Roads & Transport' },
  { key: 'housing', name: 'Housing' },
  { key: 'cultural', name: 'Leisure & Culture' },
  { key: 'public_health', name: 'Public Health' },
  { key: 'planning', name: 'Planning' },
  { key: 'central_services', name: 'Council Services' },
];

export default async function MatchupPage({ params }: Props) {
  const { matchup } = await params;
  const parts = matchup.split('-vs-');
  if (parts.length !== 2) notFound();

  const councilA = getCouncilBySlug(parts[0]);
  const councilB = getCouncilBySlug(parts[1]);
  if (!councilA || !councilB) notFound();

  const nameA = getCouncilDisplayName(councilA);
  const nameB = getCouncilDisplayName(councilB);
  const slugA = getCouncilSlug(councilA);
  const slugB = getCouncilSlug(councilB);

  const bandDA = councilA.council_tax?.band_d_2025;
  const bandDB = councilB.council_tax?.band_d_2025;
  const popA = getCouncilPopulation(councilA.name);
  const popB = getCouncilPopulation(councilB.name);

  // Comparison metrics
  const metrics: Array<{ label: string; valueA: string; valueB: string; winner?: 'a' | 'b' | null }> = [];

  if (bandDA && bandDB) {
    metrics.push({
      label: 'Band D Council Tax',
      valueA: formatCurrency(bandDA, { decimals: 2 }),
      valueB: formatCurrency(bandDB, { decimals: 2 }),
      winner: bandDA < bandDB ? 'a' : bandDA > bandDB ? 'b' : null,
    });
  }

  // YoY change
  if (councilA.council_tax?.band_d_2024 && bandDA && councilB.council_tax?.band_d_2024 && bandDB) {
    const changeA = ((bandDA - councilA.council_tax.band_d_2024) / councilA.council_tax.band_d_2024) * 100;
    const changeB = ((bandDB - councilB.council_tax.band_d_2024) / councilB.council_tax.band_d_2024) * 100;
    metrics.push({
      label: 'Year-on-year change',
      valueA: `${changeA > 0 ? '+' : ''}${changeA.toFixed(1)}%`,
      valueB: `${changeB > 0 ? '+' : ''}${changeB.toFixed(1)}%`,
      winner: changeA < changeB ? 'a' : changeA > changeB ? 'b' : null,
    });
  }

  if (councilA.budget?.total_service && councilB.budget?.total_service) {
    metrics.push({
      label: 'Total service budget',
      valueA: formatBudget(councilA.budget.total_service),
      valueB: formatBudget(councilB.budget.total_service),
    });
  }

  if (popA && popB) {
    metrics.push({
      label: 'Population',
      valueA: popA.toLocaleString('en-GB'),
      valueB: popB.toLocaleString('en-GB'),
    });
  }

  // Spending per person
  if (councilA.budget?.total_service && popA && councilB.budget?.total_service && popB) {
    const perPersonA = (councilA.budget.total_service * 1000) / popA;
    const perPersonB = (councilB.budget.total_service * 1000) / popB;
    metrics.push({
      label: 'Spending per person',
      valueA: formatCurrency(perPersonA, { decimals: 0 }),
      valueB: formatCurrency(perPersonB, { decimals: 0 }),
    });
  }

  if (councilA.detailed?.chief_executive_salary && councilB.detailed?.chief_executive_salary) {
    metrics.push({
      label: 'CEO salary',
      valueA: formatCurrency(councilA.detailed.chief_executive_salary, { decimals: 0 }),
      valueB: formatCurrency(councilB.detailed.chief_executive_salary, { decimals: 0 }),
    });
  }

  // Spending breakdown
  const spendingComparison: Array<{ name: string; amountA: string; amountB: string }> = [];
  if (councilA.budget && councilB.budget) {
    for (const service of SERVICE_MAP) {
      const amountA = councilA.budget[service.key as keyof typeof councilA.budget] as number | null;
      const amountB = councilB.budget[service.key as keyof typeof councilB.budget] as number | null;
      if (amountA || amountB) {
        spendingComparison.push({
          name: service.name,
          amountA: amountA ? formatBudget(amountA) : 'N/A',
          amountB: amountB ? formatBudget(amountB) : 'N/A',
        });
      }
    }
  }

  // Direct-answer text
  let openingText = `Compare ${nameA} and ${nameB} council tax and spending for 2025-26.`;
  if (bandDA && bandDB) {
    const diff = Math.abs(bandDA - bandDB);
    const cheaper = bandDA < bandDB ? nameA : nameB;
    openingText = `${nameA} charges ${formatCurrency(bandDA, { decimals: 2 })} Band D council tax in 2025-26, compared to ${formatCurrency(bandDB, { decimals: 2 })} for ${nameB} — a difference of ${formatCurrency(diff, { decimals: 2 })}. ${cheaper} is cheaper.`;
  }

  const faqs = [
    ...(bandDA && bandDB ? [{
      question: `Which is cheaper, ${councilA.name} or ${councilB.name} council tax?`,
      answer: bandDA < bandDB
        ? `${nameA} is cheaper at ${formatCurrency(bandDA, { decimals: 2 })} Band D, compared to ${formatCurrency(bandDB, { decimals: 2 })} for ${nameB}.`
        : bandDB < bandDA
          ? `${nameB} is cheaper at ${formatCurrency(bandDB, { decimals: 2 })} Band D, compared to ${formatCurrency(bandDA, { decimals: 2 })} for ${nameA}.`
          : `Both councils charge the same Band D rate of ${formatCurrency(bandDA, { decimals: 2 })}.`,
    }] : []),
  ];

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      ...(faqs.length > 0 ? [buildFAQPageSchema(faqs, `/compare/${matchup}`)] : []),
      buildBreadcrumbSchema(
        [
          { name: 'Home', url: '/' },
          { name: 'Compare', url: '/compare' },
          { name: `${councilA.name} vs ${councilB.name}` },
        ],
        `/compare/${matchup}`
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
          { label: 'Compare', href: '/compare' },
          { label: `${councilA.name} vs ${councilB.name}` },
        ]} />

        <h1 className="type-title-1 mb-2">{councilA.name} vs {councilB.name}</h1>
        <p className="type-body-sm text-muted-foreground mb-8">{openingText}</p>

        {/* Key metrics comparison */}
        <section className="card-elevated p-5 sm:p-6 mb-5">
          <h2 className="type-title-2 mb-1">Key metrics</h2>
          <p className="type-body-sm text-muted-foreground mb-6">Side-by-side comparison for 2025-26</p>

          {/* Column headers */}
          <div className="flex items-baseline justify-between mb-4 pb-3 border-b border-border/50">
            <span className="type-body-sm font-medium w-1/3">&nbsp;</span>
            <span className="type-body-sm font-semibold text-right w-1/3 truncate">{councilA.name}</span>
            <span className="type-body-sm font-semibold text-right w-1/3 truncate">{councilB.name}</span>
          </div>

          <div className="space-y-3">
            {metrics.map((metric) => (
              <div key={metric.label} className="flex items-baseline justify-between py-2">
                <span className="type-body-sm text-muted-foreground w-1/3">{metric.label}</span>
                <span className={`type-body-sm font-semibold tabular-nums text-right w-1/3 ${metric.winner === 'a' ? 'text-positive' : ''}`}>
                  {metric.valueA}
                </span>
                <span className={`type-body-sm font-semibold tabular-nums text-right w-1/3 ${metric.winner === 'b' ? 'text-positive' : ''}`}>
                  {metric.valueB}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Spending breakdown */}
        {spendingComparison.length > 0 && (
          <section className="card-elevated p-5 sm:p-6 mb-5">
            <h2 className="type-title-2 mb-1">Spending by service</h2>
            <p className="type-body-sm text-muted-foreground mb-6">Budget allocation comparison</p>

            <div className="flex items-baseline justify-between mb-4 pb-3 border-b border-border/50">
              <span className="type-body-sm font-medium w-1/3">&nbsp;</span>
              <span className="type-body-sm font-semibold text-right w-1/3 truncate">{councilA.name}</span>
              <span className="type-body-sm font-semibold text-right w-1/3 truncate">{councilB.name}</span>
            </div>

            <div className="space-y-3">
              {spendingComparison.map((item) => (
                <div key={item.name} className="flex items-baseline justify-between py-2">
                  <span className="type-body-sm text-muted-foreground w-1/3">{item.name}</span>
                  <span className="type-body-sm font-semibold tabular-nums text-right w-1/3">{item.amountA}</span>
                  <span className="type-body-sm font-semibold tabular-nums text-right w-1/3">{item.amountB}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Type notice */}
        {councilA.type !== councilB.type && (
          <div className="p-3 rounded-lg bg-muted/30 mb-5">
            <p className="type-caption text-muted-foreground">
              {nameA} is a {councilA.type_name.toLowerCase()} and {nameB} is a {councilB.type_name.toLowerCase()}.
              Different council types provide different services, so direct comparisons may not tell the full story.
            </p>
          </div>
        )}

        {/* Links to full pages */}
        <div className="flex flex-col sm:flex-row gap-3 mb-8">
          <Link
            href={`/council/${slugA}`}
            className="flex-1 card-elevated p-4 text-center type-body-sm font-semibold hover:bg-muted transition-colors"
          >
            View {councilA.name} full dashboard
          </Link>
          <Link
            href={`/council/${slugB}`}
            className="flex-1 card-elevated p-4 text-center type-body-sm font-semibold hover:bg-muted transition-colors"
          >
            View {councilB.name} full dashboard
          </Link>
        </div>

        <nav className="mt-8 space-y-2">
          <p className="type-body-sm font-semibold mb-3">More</p>
          <ul className="space-y-2">
            <li><Link href="/compare" className="type-body-sm text-muted-foreground hover:text-foreground transition-colors">Compare up to 5 councils</Link></li>
            <li><Link href="/insights" className="type-body-sm text-muted-foreground hover:text-foreground transition-colors">National insights</Link></li>
          </ul>
        </nav>
      </main>
    </>
  );
}
