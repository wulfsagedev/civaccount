import type { Metadata } from 'next';
import Link from 'next/link';
import { councils, formatCurrency, getCouncilDisplayName, getCouncilSlug } from '@/data/councils';
import { buildFAQPageSchema, buildBreadcrumbSchema } from '@/lib/structured-data';
import Breadcrumb from '@/components/proposals/Breadcrumb';

export const metadata: Metadata = {
  title: "Council CEO Salaries — England's Highest-Paid Executives | CivAccount",
  description: 'See how much council chief executives earn across England. Compare CEO salaries for all 317 councils, from the highest to the lowest paid.',
  alternates: {
    canonical: '/insights/council-ceo-salaries',
  },
  openGraph: {
    title: "Council CEO Salaries — England's Highest-Paid Executives",
    description: 'How much do council chief executives earn? See the full salary rankings.',
  },
  twitter: {
    card: 'summary_large_image',
    title: "Council CEO Salaries — England's Highest-Paid Executives",
    description: 'How much do council chief executives earn? See the full salary rankings.',
  },
};

export default function CouncilCeoSalariesPage() {
  const councilsWithSalary = councils
    .filter((c) => c.detailed?.chief_executive_salary && c.detailed?.chief_executive)
    .sort((a, b) => b.detailed!.chief_executive_salary! - a.detailed!.chief_executive_salary!);

  const avgSalary = councilsWithSalary.reduce((sum, c) => sum + c.detailed!.chief_executive_salary!, 0) / councilsWithSalary.length;

  const highest = councilsWithSalary[0];
  const highestName = getCouncilDisplayName(highest);
  const maxSalary = highest.detailed!.chief_executive_salary!;

  const faqs = [
    {
      question: 'Who is the highest-paid council chief executive in England?',
      answer: `${highest.detailed!.chief_executive} at ${highestName} is the highest-paid council chief executive, earning ${formatCurrency(maxSalary, { decimals: 0 })} per year.`,
    },
    {
      question: 'What is the average council CEO salary in England?',
      answer: `The average council chief executive salary across English councils is ${formatCurrency(avgSalary, { decimals: 0 })}.`,
    },
  ];

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      buildFAQPageSchema(faqs, '/insights/council-ceo-salaries'),
      buildBreadcrumbSchema(
        [
          { name: 'Home', url: '/' },
          { name: 'Insights', url: '/insights' },
          { name: 'Council CEO Salaries' },
        ],
        '/insights/council-ceo-salaries'
      ),
    ],
  };

  // Show top 50
  const topCouncils = councilsWithSalary.slice(0, 50);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <main id="main-content" className="container mx-auto px-4 max-w-3xl py-8">
        <Breadcrumb items={[
          { label: 'Home', href: '/' },
          { label: 'Insights', href: '/insights' },
          { label: 'Council CEO Salaries' },
        ]} />

        <h1 className="type-title-1 mb-2">Council CEO Salaries</h1>
        <p className="type-body-sm text-muted-foreground mb-8">
          The highest-paid council chief executive in England earns {formatCurrency(maxSalary, { decimals: 0 })} at {highestName}.
          The average CEO salary across {councilsWithSalary.length} councils is {formatCurrency(avgSalary, { decimals: 0 })}.
        </p>

        <section className="card-elevated p-5 sm:p-6 mb-5">
          <h2 className="type-title-2 mb-1">Highest-paid chief executives</h2>
          <p className="type-body-sm text-muted-foreground mb-6">Top 50 council CEO salaries in England</p>

          <div className="space-y-5">
            {topCouncils.map((council, index) => {
              const salary = council.detailed!.chief_executive_salary!;
              const ceoName = council.detailed!.chief_executive!;
              const name = getCouncilDisplayName(council);
              const slug = getCouncilSlug(council);
              const barWidth = maxSalary > 0 ? (salary / maxSalary) * 100 : 0;

              return (
                <div key={council.ons_code}>
                  <div className="flex items-baseline justify-between mb-1">
                    <Link
                      href={`/council/${slug}`}
                      className="type-body font-semibold hover:text-foreground transition-colors"
                    >
                      {index + 1}. {name}
                    </Link>
                    <span className="type-body font-semibold tabular-nums">
                      {formatCurrency(salary, { decimals: 0 })}
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between mb-2">
                    <span className="type-caption text-muted-foreground">
                      {ceoName}
                    </span>
                    <span className="type-caption text-muted-foreground">
                      {council.type_name}
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

          <p className="type-caption text-muted-foreground mt-6 pt-4 border-t border-border/50">
            Salary data from council pay policy statements published on .gov.uk websites.
            Showing basic salary only — total remuneration including pension contributions may be higher.
          </p>
        </section>

        <nav className="mt-8 space-y-2">
          <p className="type-body-sm font-semibold mb-3">More insights</p>
          <ul className="space-y-2">
            <li><Link href="/insights/cheapest-council-tax" className="type-body-sm text-muted-foreground hover:text-foreground transition-colors">Cheapest council tax</Link></li>
            <li><Link href="/insights/most-expensive-council-tax" className="type-body-sm text-muted-foreground hover:text-foreground transition-colors">Most expensive council tax</Link></li>
            <li><Link href="/insights/council-tax-increases" className="type-body-sm text-muted-foreground hover:text-foreground transition-colors">Council tax increases</Link></li>
            <li><Link href="/insights" className="type-body-sm text-muted-foreground hover:text-foreground transition-colors">All insights</Link></li>
          </ul>
        </nav>
      </main>
    </>
  );
}
