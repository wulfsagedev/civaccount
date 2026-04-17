import type { Metadata } from 'next';
import Link from 'next/link';
import { councils, formatCurrency, formatBudget, getCouncilDisplayName, getCouncilSlug, getCouncilPopulation } from '@/data/councils';
import { buildFAQPageSchema, buildBreadcrumbSchema } from '@/lib/structured-data';
import { COMPARABLE_GROUPS } from '@/lib/council-averages';
import Breadcrumb from '@/components/proposals/Breadcrumb';
import { PageShareButton } from '@/components/ui/page-share-button';

export const metadata: Metadata = {
  title: 'Council Leaderboards — Rankings for all 317 English Councils',
  description: 'See where every council ranks for council tax, spending per resident, and CEO salary. Ranked within comparable groups for fair comparison.',
  alternates: {
    canonical: '/insights/leaderboards',
  },
  openGraph: {
    title: 'Council Leaderboards — Where does your council rank?',
    description: 'Rankings for council tax, spending per resident, and CEO salary across all 317 English councils.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Council Leaderboards — Where does your council rank?',
    description: 'Rankings for council tax, spending per resident, and CEO salary across all 317 English councils.',
  },
};

type Metric = 'bandD' | 'spendingPerResident' | 'ceoSalary' | 'yoyChange';

interface RankedCouncil {
  name: string;
  displayName: string;
  slug: string;
  typeName: string;
  value: number;
  formatted: string;
}

function rankCouncils(types: readonly string[], metric: Metric): RankedCouncil[] {
  const filtered = councils.filter(c => (types as readonly string[]).includes(c.type));

  return filtered
    .map(c => {
      let value: number | null = null;
      let formatted = '';

      switch (metric) {
        case 'bandD':
          value = c.council_tax?.band_d_2025 ?? null;
          formatted = value !== null ? formatCurrency(value, { decimals: 2 }) : '';
          break;
        case 'spendingPerResident': {
          const pop = getCouncilPopulation(c.name);
          value = c.budget?.total_service && pop ? (c.budget.total_service * 1000) / pop : null;
          formatted = value !== null ? formatCurrency(Math.round(value), { decimals: 0 }) : '';
          break;
        }
        case 'ceoSalary':
          value = c.detailed?.chief_executive_salary ?? null;
          formatted = value !== null ? formatCurrency(value, { decimals: 0 }) : '';
          break;
        case 'yoyChange': {
          const curr = c.council_tax?.band_d_2025;
          const prev = c.council_tax?.band_d_2024;
          value = curr && prev ? ((curr - prev) / prev) * 100 : null;
          formatted = value !== null ? `${value > 0 ? '+' : ''}${value.toFixed(1)}%` : '';
          break;
        }
      }

      if (value === null) return null;
      return {
        name: c.name,
        displayName: getCouncilDisplayName(c),
        slug: getCouncilSlug(c),
        typeName: c.type_name || '',
        value,
        formatted,
      };
    })
    .filter((x): x is RankedCouncil => x !== null)
    .sort((a, b) => a.value - b.value);
}

const METRICS: { key: Metric; label: string; description: string }[] = [
  { key: 'bandD', label: 'Council Tax (Band D)', description: 'Cheapest to most expensive Band D rate for 2025-26' },
  { key: 'spendingPerResident', label: 'Spending per Resident', description: 'Total service budget divided by the local population' },
  { key: 'ceoSalary', label: 'CEO Salary', description: 'Chief executive salary, from each council’s published pay policy' },
  { key: 'yoyChange', label: 'Change since last year', description: 'Change in Band D from 2024-25 to 2025-26, as a percentage' },
];

function LeaderboardTable({ ranked, metric }: { ranked: RankedCouncil[]; metric: Metric }) {
  const isHigherWorse = metric === 'bandD' || metric === 'ceoSalary' || metric === 'yoyChange';

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border/50">
            <th className="type-caption text-muted-foreground text-left py-2 pr-4 w-12">#</th>
            <th className="type-caption text-muted-foreground text-left py-2 pr-4">Council</th>
            <th className="type-caption text-muted-foreground text-right py-2">Value</th>
          </tr>
        </thead>
        <tbody>
          {ranked.map((council, idx) => (
            <tr key={council.slug} className="border-b border-border/30 hover:bg-muted/30 transition-colors">
              <td className="type-body-sm text-muted-foreground py-2.5 pr-4 tabular-nums">{idx + 1}</td>
              <td className="py-2.5 pr-4">
                <Link href={`/council/${council.slug}`} className="hover:underline cursor-pointer">
                  <span className="type-body-sm font-semibold">{council.displayName}</span>
                </Link>
              </td>
              <td className={`type-body-sm font-semibold tabular-nums text-right py-2.5 ${
                idx < 3 && !isHigherWorse ? 'text-positive' :
                idx < 3 && isHigherWorse ? 'text-positive' :
                idx >= ranked.length - 3 && isHigherWorse ? 'text-negative' :
                idx >= ranked.length - 3 && !isHigherWorse ? 'text-negative' :
                ''
              }`}>
                {council.formatted}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function LeaderboardsPage() {
  const faqs = [
    {
      question: 'How are councils compared fairly?',
      answer: 'Councils are ranked inside groups of councils that do the same jobs. All-in-one councils (unitary, metropolitan, London boroughs) run all services, so they are ranked together. District and county councils are ranked on their own, because they share services between them.',
    },
    {
      question: 'What does spending per resident mean?',
      answer: 'The total service budget divided by the number of people the council looks after. This evens things out for council size, so you can fairly compare a large city council with a smaller rural one.',
    },
  ];

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      buildFAQPageSchema(faqs, '/insights/leaderboards'),
      buildBreadcrumbSchema(
        [{ name: 'Home', url: '/' }, { name: 'Insights', url: '/insights' }, { name: 'Leaderboards' }],
        '/insights/leaderboards'
      ),
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <>
        <main id="main-content" className="flex-1">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
          <Breadcrumb items={[
            { label: 'Home', href: '/' },
            { label: 'Insights', href: '/insights' },
            { label: 'Leaderboards' },
          ]} />

          <div className="flex items-start justify-between gap-2 mt-6 mb-8">
            <div>
              <h1 className="type-title-1 mb-2">Council Leaderboards</h1>
              <p className="type-body-sm text-muted-foreground">
                See where every council ranks. Grouped by council type, so you compare like with like.
              </p>
            </div>
            <PageShareButton
              title="Council Leaderboards — CivAccount"
              description="See where every council ranks for council tax, spending, and CEO salary across all 317 English councils"
            />
          </div>

          {METRICS.map(metric => (
            <section key={metric.key} className="mb-12">
              <h2 className="type-title-2 mb-1">{metric.label}</h2>
              <p className="type-body-sm text-muted-foreground mb-6">{metric.description}</p>

              {COMPARABLE_GROUPS.map(group => {
                const ranked = rankCouncils(group.types, metric.key);
                if (ranked.length === 0) return null;

                return (
                  <div key={group.label} className="mb-8">
                    <h3 className="type-title-3 mb-1">{group.label}</h3>
                    <p className="type-caption text-muted-foreground mb-3">
                      {group.description} · {ranked.length} councils
                    </p>
                    <div className="card-elevated p-4 sm:p-5">
                      <LeaderboardTable ranked={ranked} metric={metric.key} />
                    </div>
                  </div>
                );
              })}
            </section>
          ))}

          {/* FAQ */}
          <section className="mt-12 pt-8 border-t border-border/50">
            <h2 className="type-title-2 mb-4">Common questions</h2>
            <div className="space-y-4">
              {faqs.map((faq, i) => (
                <div key={i}>
                  <h3 className="type-body-sm font-semibold mb-1">{faq.question}</h3>
                  <p className="type-body-sm text-muted-foreground">{faq.answer}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
        </main>
        </>
    </>
  );
}
