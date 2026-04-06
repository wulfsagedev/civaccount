import type { Metadata } from 'next';
import Link from 'next/link';
import { councils, formatBudget, formatCurrency, getCouncilDisplayName, getCouncilSlug } from '@/data/councils';
import { buildFAQPageSchema, buildBreadcrumbSchema } from '@/lib/structured-data';
import Breadcrumb from '@/components/proposals/Breadcrumb';

export const metadata: Metadata = {
  title: 'How UK Councils Spend Your Money — Guide to Council Spending | CivAccount',
  description: 'Understand how English councils spend your council tax. Learn about service budgets, statutory vs discretionary spending, and where the biggest costs are.',
  alternates: {
    canonical: '/guide/council-spending',
  },
  openGraph: {
    title: 'How UK Councils Spend Your Money',
    description: 'A plain-English guide to council budgets, service spending, and where your money goes.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'How UK Councils Spend Your Money',
    description: 'A plain-English guide to council budgets, service spending, and where your money goes.',
  },
};

const BUDGET_CATEGORIES = [
  { key: 'education', name: 'Education', statutory: true, description: 'Schools, special educational needs, school transport, early years provision.' },
  { key: 'adult_social_care', name: 'Adult Social Care', statutory: true, description: 'Care homes, home care, mental health services, support for disabled adults.' },
  { key: 'childrens_social_care', name: "Children's Social Care", statutory: true, description: 'Child protection, looked-after children, fostering, adoption services.' },
  { key: 'environmental', name: 'Environment & Streets', statutory: true, description: 'Waste collection, recycling, street cleaning, parks and open spaces.' },
  { key: 'transport', name: 'Roads & Transport', statutory: true, description: 'Road maintenance, pothole repairs, street lighting, concessionary fares.' },
  { key: 'housing', name: 'Housing', statutory: true, description: 'Homelessness prevention, temporary accommodation, housing standards.' },
  { key: 'public_health', name: 'Public Health', statutory: true, description: 'Community health, substance misuse, sexual health clinics, health visiting.' },
  { key: 'cultural', name: 'Leisure & Culture', statutory: false, description: 'Libraries, leisure centres, museums, arts funding, community centres.' },
  { key: 'planning', name: 'Planning', statutory: true, description: 'Planning applications, building control, conservation, local plans.' },
  { key: 'central_services', name: 'Council Running Costs', statutory: false, description: 'Staff, IT systems, legal services, finance, democratic services, elections.' },
];

export default function CouncilSpendingGuidePage() {
  // Compute national spending totals
  const councilsWithBudget = councils.filter((c) => c.budget?.total_service);
  const totalNationalBudget = councilsWithBudget.reduce((sum, c) => sum + (c.budget?.total_service || 0), 0);

  // Category totals
  const categoryTotals = BUDGET_CATEGORIES.map((cat) => {
    const total = councilsWithBudget.reduce((sum, c) => {
      const val = c.budget?.[cat.key as keyof typeof c.budget] as number | null;
      return sum + (val || 0);
    }, 0);
    const pct = totalNationalBudget > 0 ? (total / totalNationalBudget) * 100 : 0;
    return { ...cat, total, pct };
  }).sort((a, b) => b.total - a.total);

  // Biggest spender per category
  const biggestSpenders = categoryTotals.slice(0, 3).map((cat) => {
    const biggest = councilsWithBudget
      .filter((c) => (c.budget?.[cat.key as keyof typeof c.budget] as number | null) !== null)
      .sort((a, b) => {
        const aVal = (a.budget?.[cat.key as keyof typeof a.budget] as number) || 0;
        const bVal = (b.budget?.[cat.key as keyof typeof b.budget] as number) || 0;
        return bVal - aVal;
      })[0];
    return { category: cat.name, council: biggest };
  });

  const faqs = [
    {
      question: 'What is the biggest cost for councils?',
      answer: `${categoryTotals[0].name} is the largest spending area, accounting for ${categoryTotals[0].pct.toFixed(0)}% of total council spending nationally (${formatBudget(categoryTotals[0].total)}).`,
    },
    {
      question: 'What is statutory vs discretionary spending?',
      answer: 'Statutory services are ones councils must provide by law (like social care, education, waste collection). Discretionary services are optional (like leisure centres, arts funding). When budgets are tight, discretionary services are usually cut first.',
    },
    {
      question: 'How much do all councils spend in total?',
      answer: `English councils collectively spend ${formatBudget(totalNationalBudget)} on services each year (2025-26 figures, net service expenditure).`,
    },
    {
      question: 'Where can I see my council\'s spending?',
      answer: 'You can see a full breakdown of your council\'s spending on CivAccount. Search for your council on the homepage to see their budget dashboard.',
    },
  ];

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Article',
        '@id': 'https://www.civaccount.co.uk/guide/council-spending#article',
        headline: 'How UK Councils Spend Your Money',
        description: 'A guide to council budgets, service spending categories, and where your council tax goes.',
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
      },
      buildFAQPageSchema(faqs, '/guide/council-spending'),
      buildBreadcrumbSchema(
        [{ name: 'Home', url: '/' }, { name: 'Guide: Council Spending' }],
        '/guide/council-spending'
      ),
    ],
  };

  const maxCatTotal = categoryTotals[0].total;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <main id="main-content" className="container mx-auto px-4 max-w-3xl py-8">
        <Breadcrumb items={[
          { label: 'Home', href: '/' },
          { label: 'Guide: Council Spending' },
        ]} />

        <h1 className="type-title-1 mb-2">How Councils Spend Your Money</h1>
        <p className="type-body-sm text-muted-foreground mb-8">
          English councils collectively spend {formatBudget(totalNationalBudget)} on services each year.
          {categoryTotals[0] && ` The biggest cost is ${categoryTotals[0].name.toLowerCase()}, which accounts for ${categoryTotals[0].pct.toFixed(0)}% of all spending.`}
        </p>

        {/* National spending breakdown */}
        <section className="card-elevated p-5 sm:p-6 mb-5">
          <h2 className="type-title-2 mb-1">National spending breakdown</h2>
          <p className="type-body-sm text-muted-foreground mb-6">How {formatBudget(totalNationalBudget)} is split across services</p>

          <div className="space-y-5">
            {categoryTotals.map((cat) => {
              const barWidth = maxCatTotal > 0 ? (cat.total / maxCatTotal) * 100 : 0;
              return (
                <div key={cat.key}>
                  <div className="flex items-baseline justify-between mb-1">
                    <span className="type-body font-semibold">{cat.name}</span>
                    <span className="type-body font-semibold tabular-nums">{formatBudget(cat.total)}</span>
                  </div>
                  <div className="flex items-baseline justify-between mb-2">
                    <span className="type-caption text-muted-foreground">
                      {cat.statutory ? 'Statutory' : 'Discretionary'}
                    </span>
                    <span className="type-caption text-muted-foreground tabular-nums">{cat.pct.toFixed(0)}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full bg-foreground" style={{ width: `${barWidth}%` }} />
                  </div>
                </div>
              );
            })}
          </div>

          <p className="type-caption text-muted-foreground mt-6 pt-4 border-t border-border/50">
            Source: GOV.UK Revenue Expenditure (RO returns) 2025-26. Net service expenditure.
          </p>
        </section>

        {/* What each service does */}
        <section className="card-elevated p-5 sm:p-6 mb-5">
          <h2 className="type-title-2 mb-1">What each service covers</h2>
          <p className="type-body-sm text-muted-foreground mb-5">A plain-English breakdown</p>

          <div className="space-y-4">
            {categoryTotals.map((cat) => (
              <div key={cat.key} className="py-2">
                <div className="flex items-baseline justify-between mb-1">
                  <p className="type-body-sm font-semibold">{cat.name}</p>
                  <span className="type-caption text-muted-foreground">{cat.statutory ? 'Must provide' : 'Optional'}</span>
                </div>
                <p className="type-caption text-muted-foreground">{cat.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Statutory vs discretionary */}
        <section className="card-elevated p-5 sm:p-6 mb-5">
          <h2 className="type-title-2 mb-1">Statutory vs discretionary services</h2>
          <p className="type-body-sm text-muted-foreground mb-5">What councils must provide by law</p>

          <div className="space-y-4 type-body-sm text-muted-foreground">
            <p>
              <span className="font-semibold text-foreground">Statutory services</span> are ones that councils are required by law to provide.
              These include education, social care, waste collection, and housing support.
              Councils cannot stop providing these services even if money is tight.
            </p>
            <p>
              <span className="font-semibold text-foreground">Discretionary services</span> are optional.
              These include libraries, leisure centres, arts funding, and community events.
              When councils need to save money, these services are usually the first to be cut or reduced.
            </p>
            <p>
              In recent years, rising costs in statutory areas (especially adult social care and children&apos;s services)
              have squeezed budgets for discretionary services across the country.
            </p>
          </div>
        </section>

        {/* How budgets are set */}
        <section className="card-elevated p-5 sm:p-6 mb-5">
          <h2 className="type-title-2 mb-1">How council budgets are set</h2>
          <p className="type-body-sm text-muted-foreground mb-5">The annual cycle</p>

          <div className="space-y-4 type-body-sm text-muted-foreground">
            <ol className="space-y-3 list-decimal pl-5">
              <li><span className="font-medium text-foreground">Autumn</span> — The government announces how much funding each council will receive</li>
              <li><span className="font-medium text-foreground">December-January</span> — Councils draft their budget and propose council tax levels</li>
              <li><span className="font-medium text-foreground">February</span> — The budget is debated and voted on by councillors</li>
              <li><span className="font-medium text-foreground">March</span> — Council tax bills are sent to residents</li>
              <li><span className="font-medium text-foreground">April</span> — The new financial year begins and the budget takes effect</li>
            </ol>
            <p>
              Council tax increases are capped by central government. Currently, councils can raise council tax by up to 5% without holding a referendum
              (2% general increase plus 3% adult social care precept).
            </p>
          </div>
        </section>

        {/* Where the money comes from */}
        <section className="card-elevated p-5 sm:p-6 mb-5">
          <h2 className="type-title-2 mb-1">Where council money comes from</h2>
          <p className="type-body-sm text-muted-foreground mb-5">Not all funding is from council tax</p>

          <div className="space-y-4 type-body-sm text-muted-foreground">
            <p>Council tax is only part of the picture. Councils are funded from several sources:</p>
            <div className="space-y-2">
              <div className="py-1">
                <span className="font-semibold text-foreground">Council tax</span>
                <span className="text-muted-foreground"> — About 50-60% of income for most councils</span>
              </div>
              <div className="py-1">
                <span className="font-semibold text-foreground">Government grants</span>
                <span className="text-muted-foreground"> — Central government funding, especially for education and social care</span>
              </div>
              <div className="py-1">
                <span className="font-semibold text-foreground">Business rates</span>
                <span className="text-muted-foreground"> — A share of taxes paid by local businesses</span>
              </div>
              <div className="py-1">
                <span className="font-semibold text-foreground">Fees and charges</span>
                <span className="text-muted-foreground"> — Planning fees, parking charges, leisure centre memberships</span>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="card-elevated p-5 sm:p-6 mb-5">
          <h2 className="type-title-2 mb-1">Common questions</h2>
          <p className="type-body-sm text-muted-foreground mb-5">About council spending</p>

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
            <li><Link href="/guide/council-tax" className="type-body-sm text-muted-foreground hover:text-foreground transition-colors">Guide: Council tax explained</Link></li>
            <li><Link href="/insights" className="type-body-sm text-muted-foreground hover:text-foreground transition-colors">National insights</Link></li>
            <li><Link href="/insights/council-ceo-salaries" className="type-body-sm text-muted-foreground hover:text-foreground transition-colors">CEO salary rankings</Link></li>
            <li><Link href="/data" className="type-body-sm text-muted-foreground hover:text-foreground transition-colors">Download the data (CSV/JSON)</Link></li>
          </ul>
        </nav>
      </main>
    </>
  );
}
