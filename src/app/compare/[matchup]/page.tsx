import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getCouncilBySlug, getCouncilDisplayName, getCouncilSlug, formatCurrency, formatBudget, getCouncilPopulation, toSentenceTypeName, getAreaBandD, getAreaBandDChange } from '@/data/councils';
import { buildFAQPageSchema, buildBreadcrumbSchema } from '@/lib/structured-data';
import { serializeJsonLd } from '@/lib/safe-json-ld';
import { getPopularComparisons } from '@/lib/comparisons';
import Breadcrumb from '@/components/proposals/Breadcrumb';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Check } from 'lucide-react';

interface Props {
  params: Promise<{ matchup: string }>;
}

export async function generateStaticParams() {
  return getPopularComparisons().map((matchup) => ({ matchup }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { matchup } = await params;
  const parts = matchup.split('-vs-');
  if (parts.length !== 2) return { title: 'Compare Councils' };

  const councilA = getCouncilBySlug(parts[0]);
  const councilB = getCouncilBySlug(parts[1]);
  if (!councilA || !councilB) return { title: 'Compare Councils' };

  const nameA = getCouncilDisplayName(councilA);
  const nameB = getCouncilDisplayName(councilB);

  // Each side's most recent verified area Band D year — 2026-27 for billing
  // authorities, 2025-26 for county councils. Same-type matchups always share
  // a year; mixed matchups label each side explicitly.
  const yearA = getAreaBandD(councilA)?.year ?? '2025-26';
  const yearB = getAreaBandD(councilB)?.year ?? '2025-26';
  const sameYear = yearA === yearB;

  return {
    title: sameYear
      ? `${nameA} vs ${nameB} Council Tax ${yearA}`
      : `${nameA} vs ${nameB} Council Tax`,
    description: sameYear
      ? `Compare ${nameA} and ${nameB} council tax rates, spending, and budgets for ${yearA}. Side-by-side comparison of Band D rates, service budgets, and CEO salaries.`
      : `Compare ${nameA} (${yearA} rates) and ${nameB} (${yearB} rates) council tax, spending, and budgets. Side-by-side comparison of Band D rates, service budgets, and CEO salaries.`,
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

  // Most recent verified AREA Band D per side — 2026-27 for billing
  // authorities, 2025-26 for county councils. When the two sides' years
  // differ, every Band D value is labelled with its year and no "winner"
  // is declared (a cross-year comparison would be misleading).
  const areaA = getAreaBandD(councilA);
  const areaB = getAreaBandD(councilB);
  const sameTaxYear = areaA?.year === areaB?.year;
  const bandDA = areaA?.value;
  const bandDB = areaB?.value;
  const popA = getCouncilPopulation(councilA.name);
  const popB = getCouncilPopulation(councilB.name);

  // Comparison metrics
  const metrics: Array<{ label: string; valueA: string; valueB: string; winner?: 'a' | 'b' | null }> = [];

  if (areaA && areaB && bandDA && bandDB) {
    metrics.push({
      label: sameTaxYear ? `Band D Council Tax (${areaA.year})` : 'Band D Council Tax',
      valueA: sameTaxYear
        ? formatCurrency(bandDA, { decimals: 2 })
        : `${formatCurrency(bandDA, { decimals: 2 })} (${areaA.year})`,
      valueB: sameTaxYear
        ? formatCurrency(bandDB, { decimals: 2 })
        : `${formatCurrency(bandDB, { decimals: 2 })} (${areaB.year})`,
      winner: sameTaxYear ? (bandDA < bandDB ? 'a' : bandDA > bandDB ? 'b' : null) : null,
    });
  }

  // YoY change — computed from each side's two most recent published years
  const changeA = getAreaBandDChange(councilA);
  const changeB = getAreaBandDChange(councilB);
  if (changeA && changeB) {
    metrics.push({
      label: 'Year-on-year change',
      valueA: sameTaxYear
        ? `${changeA.percent > 0 ? '+' : ''}${changeA.percent.toFixed(1)}%`
        : `${changeA.percent > 0 ? '+' : ''}${changeA.percent.toFixed(1)}% (to ${changeA.toYear})`,
      valueB: sameTaxYear
        ? `${changeB.percent > 0 ? '+' : ''}${changeB.percent.toFixed(1)}%`
        : `${changeB.percent > 0 ? '+' : ''}${changeB.percent.toFixed(1)}% (to ${changeB.toYear})`,
      winner: sameTaxYear ? (changeA.percent < changeB.percent ? 'a' : changeA.percent > changeB.percent ? 'b' : null) : null,
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
  let openingText = `Compare ${nameA} and ${nameB} council tax and spending.`;
  if (areaA && areaB && bandDA && bandDB) {
    if (sameTaxYear) {
      const diff = Math.abs(bandDA - bandDB);
      const cheaper = bandDA < bandDB ? nameA : nameB;
      openingText = `${nameA} charges ${formatCurrency(bandDA, { decimals: 2 })} Band D council tax in ${areaA.year}, compared to ${formatCurrency(bandDB, { decimals: 2 })} for ${nameB} — a difference of ${formatCurrency(diff, { decimals: 2 })}. ${cheaper} is cheaper.`;
    } else {
      openingText = `${nameA} charges ${formatCurrency(bandDA, { decimals: 2 })} Band D council tax in ${areaA.year}, while ${nameB} charged ${formatCurrency(bandDB, { decimals: 2 })} in ${areaB.year}. County council figures stay on ${areaA.year === '2025-26' ? areaA.year : areaB.year} until their next-year precepts are published, so the two figures cover different years.`;
    }
  }

  // "Which is cheaper" only makes sense when both figures are for the same
  // year — a cross-year verdict would silently mix 2025-26 and 2026-27.
  const faqs = [
    ...(sameTaxYear && areaA && bandDA && bandDB ? [{
      question: `Which is cheaper, ${councilA.name} or ${councilB.name} council tax?`,
      answer: bandDA < bandDB
        ? `In ${areaA.year}, ${nameA} is cheaper at ${formatCurrency(bandDA, { decimals: 2 })} Band D, compared to ${formatCurrency(bandDB, { decimals: 2 })} for ${nameB}.`
        : bandDB < bandDA
          ? `In ${areaA.year}, ${nameB} is cheaper at ${formatCurrency(bandDB, { decimals: 2 })} Band D, compared to ${formatCurrency(bandDA, { decimals: 2 })} for ${nameA}.`
          : `In ${areaA.year}, both councils charge the same Band D rate of ${formatCurrency(bandDA, { decimals: 2 })}.`,
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
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
      />
      <main id="main-content" className="flex-1 container mx-auto px-4 max-w-3xl py-8">
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
          <p className="type-body-sm text-muted-foreground mb-6">
            {sameTaxYear && areaA
              ? `Council tax for ${areaA.year} · budget figures for 2025-26`
              : 'Council tax labelled with each council’s year · budget figures for 2025-26'}
          </p>

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
                  {metric.winner === 'a' && <><Check className="h-3.5 w-3.5 inline ml-1" aria-hidden="true" /><span className="sr-only"> (lower)</span></>}
                </span>
                <span className={`type-body-sm font-semibold tabular-nums text-right w-1/3 ${metric.winner === 'b' ? 'text-positive' : ''}`}>
                  {metric.valueB}
                  {metric.winner === 'b' && <><Check className="h-3.5 w-3.5 inline ml-1" aria-hidden="true" /><span className="sr-only"> (lower)</span></>}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Spending breakdown */}
        {spendingComparison.length > 0 && (
          <section className="card-elevated p-5 sm:p-6 mb-5">
            <h2 className="type-title-2 mb-1">Spending by service</h2>
            <p className="type-body-sm text-muted-foreground mb-6">Budget allocation comparison for 2025-26</p>

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
              {nameA} is a {toSentenceTypeName(councilA.type_name)} and {nameB} is a {toSentenceTypeName(councilB.type_name)}.
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
      <Footer />
    </div>
  );
}
