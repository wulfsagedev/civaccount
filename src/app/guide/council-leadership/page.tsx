import type { Metadata } from 'next';
import Link from 'next/link';
import { councils, formatCurrency, getCouncilDisplayName, getCouncilSlug } from '@/data/councils';
import { buildFAQPageSchema, buildBreadcrumbSchema } from '@/lib/structured-data';
import Breadcrumb from '@/components/proposals/Breadcrumb';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  title: 'Who Runs Your Council — Guide to Council Leadership',
  description: 'Understand who leads English councils: chief executives, council leaders, cabinet members, and councillors. Learn about their roles, salaries, and accountability.',
  alternates: {
    canonical: '/guide/council-leadership',
  },
  openGraph: {
    title: 'Who Runs Your Council — Council Leadership Explained',
    description: 'Chief executives, council leaders, cabinet members — who does what and how much they earn.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Who Runs Your Council — Council Leadership Explained',
    description: 'Chief executives, council leaders, cabinet members — who does what and how much they earn.',
  },
};

export default function CouncilLeadershipGuidePage() {
  const councilsWithSalary = councils
    .filter((c) => c.detailed?.chief_executive_salary && c.detailed?.chief_executive)
    .sort((a, b) => b.detailed!.chief_executive_salary! - a.detailed!.chief_executive_salary!);

  const avgSalary = councilsWithSalary.length > 0
    ? councilsWithSalary.reduce((sum, c) => sum + c.detailed!.chief_executive_salary!, 0) / councilsWithSalary.length
    : 0;

  const highest = councilsWithSalary[0];
  const lowest = councilsWithSalary[councilsWithSalary.length - 1];

  const councilsWithAllowance = councils.filter((c) => c.detailed?.councillor_basic_allowance);
  const avgAllowance = councilsWithAllowance.length > 0
    ? councilsWithAllowance.reduce((sum, c) => sum + c.detailed!.councillor_basic_allowance!, 0) / councilsWithAllowance.length
    : 0;

  const faqs = [
    {
      question: 'What does a council chief executive do?',
      answer: 'The chief executive is the most senior officer in a council. They manage all council staff, implement decisions made by councillors, and are responsible for the day-to-day running of the organisation. They are an employee, not an elected politician.',
    },
    {
      question: 'How much do council chief executives earn?',
      answer: `The average council chief executive salary in England is ${formatCurrency(avgSalary, { decimals: 0 })}. The highest paid earns ${formatCurrency(highest?.detailed?.chief_executive_salary || 0, { decimals: 0 })} at ${getCouncilDisplayName(highest)}.`,
    },
    {
      question: 'What is the difference between the council leader and the chief executive?',
      answer: 'The council leader is an elected councillor chosen by other councillors to lead the council politically. The chief executive is a paid employee who runs the council operationally. The leader sets direction, the chief executive delivers it.',
    },
    {
      question: 'How much do councillors get paid?',
      answer: `Councillors receive a basic allowance, not a salary. The average basic allowance across English councils is ${formatCurrency(avgAllowance, { decimals: 0 })} per year. Councillors with extra responsibilities (like cabinet members) receive additional special responsibility allowances.`,
    },
    {
      question: 'How are councillors elected?',
      answer: 'Councillors are elected by residents in local elections. Each council ward elects one or more councillors. Elections happen every four years in most areas, though some councils elect a third of their councillors each year.',
    },
    {
      question: 'Who holds the council accountable?',
      answer: 'Councils are held accountable through local elections, external audits, government inspections (like Ofsted and CQC), scrutiny committees, freedom of information requests, and the Local Government Ombudsman.',
    },
  ];

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Article',
        '@id': 'https://www.civaccount.co.uk/guide/council-leadership#article',
        headline: 'Who Runs Your Council — Guide to Council Leadership',
        description: 'Understanding council chief executives, leaders, cabinet members, and councillors in England.',
        datePublished: '2026-04-06',
        dateModified: '2026-04-06',
        publisher: {
          '@type': 'Organization',
          '@id': 'https://www.civaccount.co.uk/#organization',
          name: 'CivAccount',
        },
      },
      buildFAQPageSchema(faqs, '/guide/council-leadership'),
      buildBreadcrumbSchema(
        [{ name: 'Home', url: '/' }, { name: 'Guide: Council Leadership' }],
        '/guide/council-leadership'
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
        <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Guide: Council Leadership' }]} />

        <h1 className="type-title-1 mb-2">Who Runs Your Council</h1>
        <p className="type-body-sm text-muted-foreground mb-8">
          Every council is run by elected councillors and paid officers.
          The average chief executive earns {formatCurrency(avgSalary, { decimals: 0 })}, while councillors receive a basic allowance of {formatCurrency(avgAllowance, { decimals: 0 })} per year.
        </p>

        {/* Key roles */}
        <section className="card-elevated p-5 sm:p-6 mb-5">
          <h2 className="type-title-2 mb-1">Key roles in a council</h2>
          <p className="type-body-sm text-muted-foreground mb-5">Who does what</p>

          <div className="space-y-5">
            <div className="py-2">
              <p className="type-body-sm font-semibold mb-1">Chief Executive (Head Paid Service)</p>
              <p className="type-body-sm text-muted-foreground">
                The most senior employee. Manages all staff, implements council decisions, and is responsible for the organisation. Not elected — hired by the council. Salary typically ranges from {formatCurrency(lowest?.detailed?.chief_executive_salary || 120000, { decimals: 0 })} to {formatCurrency(highest?.detailed?.chief_executive_salary || 300000, { decimals: 0 })}.
              </p>
            </div>
            <div className="py-2">
              <p className="type-body-sm font-semibold mb-1">Council Leader</p>
              <p className="type-body-sm text-muted-foreground">
                An elected councillor chosen by fellow councillors to lead politically. Sets the council&apos;s priorities and chairs the cabinet. Receives a special responsibility allowance on top of their basic councillor allowance.
              </p>
            </div>
            <div className="py-2">
              <p className="type-body-sm font-semibold mb-1">Cabinet Members</p>
              <p className="type-body-sm text-muted-foreground">
                Councillors appointed by the leader to oversee specific areas like education, housing, or finance. They make decisions within their portfolio and report to scrutiny committees. Usually 6-10 members.
              </p>
            </div>
            <div className="py-2">
              <p className="type-body-sm font-semibold mb-1">Councillors (Backbenchers)</p>
              <p className="type-body-sm text-muted-foreground">
                Elected to represent their local ward. They vote on the budget, attend full council meetings, sit on committees, and help residents with local issues. Most councils have 30-80 councillors.
              </p>
            </div>
            <div className="py-2">
              <p className="type-body-sm font-semibold mb-1">Scrutiny Committees</p>
              <p className="type-body-sm text-muted-foreground">
                Groups of councillors who examine and challenge cabinet decisions. They can call in decisions for review and hold the leader and chief executive to account.
              </p>
            </div>
          </div>
        </section>

        {/* CEO salaries */}
        <section className="card-elevated p-5 sm:p-6 mb-5">
          <h2 className="type-title-2 mb-1">Chief executive salaries</h2>
          <p className="type-body-sm text-muted-foreground mb-5">What the top officers earn</p>

          <div className="space-y-3">
            <div className="flex items-baseline justify-between py-2">
              <span className="type-body-sm text-muted-foreground">Average salary</span>
              <span className="type-body-sm font-semibold tabular-nums">{formatCurrency(avgSalary, { decimals: 0 })}</span>
            </div>
            {highest && (
              <div className="flex items-baseline justify-between py-2">
                <span className="type-body-sm text-muted-foreground">
                  Highest —{' '}
                  <Link href={`/council/${getCouncilSlug(highest)}`} className="hover:text-foreground transition-colors">
                    {getCouncilDisplayName(highest)}
                  </Link>
                </span>
                <span className="type-body-sm font-semibold tabular-nums">{formatCurrency(highest.detailed!.chief_executive_salary!, { decimals: 0 })}</span>
              </div>
            )}
            {lowest && (
              <div className="flex items-baseline justify-between py-2">
                <span className="type-body-sm text-muted-foreground">
                  Lowest —{' '}
                  <Link href={`/council/${getCouncilSlug(lowest)}`} className="hover:text-foreground transition-colors">
                    {getCouncilDisplayName(lowest)}
                  </Link>
                </span>
                <span className="type-body-sm font-semibold tabular-nums">{formatCurrency(lowest.detailed!.chief_executive_salary!, { decimals: 0 })}</span>
              </div>
            )}
          </div>

          <div className="mt-5 p-3 rounded-lg bg-muted/30">
            <p className="type-caption text-muted-foreground">
              <Link href="/insights/council-ceo-salaries" className="hover:text-foreground transition-colors">See the full CEO salary rankings</Link>
              {' · '}
              Salary data from council pay policy statements on .gov.uk websites.
            </p>
          </div>
        </section>

        {/* Councillor pay */}
        <section className="card-elevated p-5 sm:p-6 mb-5">
          <h2 className="type-title-2 mb-1">Councillor allowances</h2>
          <p className="type-body-sm text-muted-foreground mb-5">What elected members receive</p>

          <div className="space-y-4 type-body-sm text-muted-foreground">
            <p>
              Councillors are not paid a salary. Instead, they receive allowances to cover the costs of their role.
            </p>
            <div className="space-y-2">
              <div className="py-1">
                <span className="font-semibold text-foreground">Basic allowance</span>
                <span> — Paid to all councillors. Average across England is {formatCurrency(avgAllowance, { decimals: 0 })} per year.</span>
              </div>
              <div className="py-1">
                <span className="font-semibold text-foreground">Special responsibility allowance (SRA)</span>
                <span> — Extra pay for roles like leader, cabinet member, or committee chair. Can be substantial — leaders often receive 2-3x the basic allowance.</span>
              </div>
              <div className="py-1">
                <span className="font-semibold text-foreground">Travel and subsistence</span>
                <span> — Reimbursement for travel to council meetings and events.</span>
              </div>
            </div>
            <p>
              Allowance levels are set by an independent remuneration panel and published each year. You can see individual councillor allowances on your council&apos;s website.
            </p>
          </div>
        </section>

        {/* Council structures */}
        <section className="card-elevated p-5 sm:p-6 mb-5">
          <h2 className="type-title-2 mb-1">Council structures</h2>
          <p className="type-body-sm text-muted-foreground mb-5">How different councils are organised</p>

          <div className="space-y-4 type-body-sm text-muted-foreground">
            <div className="space-y-3">
              <div className="py-2">
                <p className="font-semibold text-foreground mb-1">Unitary authorities (63)</p>
                <p>Provide all local services. One council, one set of councillors, one chief executive.</p>
              </div>
              <div className="py-2">
                <p className="font-semibold text-foreground mb-1">Metropolitan districts (36)</p>
                <p>Large urban councils providing all services. Often part of combined authorities with elected mayors.</p>
              </div>
              <div className="py-2">
                <p className="font-semibold text-foreground mb-1">London boroughs (33)</p>
                <p>Provide most services in London. Some functions are shared with the Greater London Authority and the Mayor of London.</p>
              </div>
              <div className="py-2">
                <p className="font-semibold text-foreground mb-1">County councils (21) + district councils (164)</p>
                <p>Two-tier system. The county handles big services (education, social care, roads). The district handles local services (bins, planning, housing). Each has its own councillors and chief executive.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Accountability */}
        <section className="card-elevated p-5 sm:p-6 mb-5">
          <h2 className="type-title-2 mb-1">How councils are held accountable</h2>
          <p className="type-body-sm text-muted-foreground mb-5">Checks and balances</p>

          <div className="space-y-4 type-body-sm text-muted-foreground">
            <div className="space-y-2">
              <div className="py-1"><span className="font-semibold text-foreground">Local elections</span> — Residents vote for councillors every 4 years (or annually in some areas)</div>
              <div className="py-1"><span className="font-semibold text-foreground">External audit</span> — Independent auditors check the council&apos;s accounts each year</div>
              <div className="py-1"><span className="font-semibold text-foreground">Government inspections</span> — Ofsted (children&apos;s services), CQC (adult social care), and others rate council performance</div>
              <div className="py-1"><span className="font-semibold text-foreground">Freedom of information</span> — Anyone can request information about how the council spends money</div>
              <div className="py-1"><span className="font-semibold text-foreground">Local Government Ombudsman</span> — Investigates complaints about council services</div>
              <div className="py-1"><span className="font-semibold text-foreground">Section 114 notice</span> — A legal mechanism where the finance officer declares the council cannot balance its budget. Effectively a bankruptcy warning.</div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="card-elevated p-5 sm:p-6 mb-5">
          <h2 className="type-title-2 mb-1">Common questions</h2>
          <p className="type-body-sm text-muted-foreground mb-5">About council leadership</p>
          <div className="space-y-3">
            {faqs.map((faq) => (
              <div key={faq.question} className="p-3 rounded-lg bg-muted/30">
                <p className="type-body-sm font-semibold mb-1">{faq.question}</p>
                <p className="type-caption text-muted-foreground">{faq.answer}</p>
              </div>
            ))}
          </div>
        </section>

        <nav className="mt-8 space-y-2">
          <p className="type-body-sm font-semibold mb-3">Related</p>
          <ul className="space-y-2">
            <li><Link href="/guide/council-tax" className="type-body-sm text-muted-foreground hover:text-foreground transition-colors">Guide: Council tax explained</Link></li>
            <li><Link href="/guide/council-spending" className="type-body-sm text-muted-foreground hover:text-foreground transition-colors">Guide: How councils spend your money</Link></li>
            <li><Link href="/guide/local-democracy" className="type-body-sm text-muted-foreground hover:text-foreground transition-colors">Guide: How to influence your council</Link></li>
            <li><Link href="/insights/council-ceo-salaries" className="type-body-sm text-muted-foreground hover:text-foreground transition-colors">CEO salary rankings</Link></li>
          </ul>
        </nav>
      </main>
      <Footer />
    </div>
  );
}
