import type { Metadata } from 'next';
import Link from 'next/link';
import { buildFAQPageSchema, buildBreadcrumbSchema } from '@/lib/structured-data';
import Breadcrumb from '@/components/proposals/Breadcrumb';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { serializeJsonLd } from '@/lib/safe-json-ld';

export const metadata: Metadata = {
  title: 'How to Influence Your Council — Guide to Local Democracy',
  description: 'Learn how to have your say on council decisions: attending meetings, submitting FOI requests, contacting councillors, and participating in local democracy.',
  alternates: {
    canonical: '/guide/local-democracy',
  },
  openGraph: {
    title: 'How to Influence Your Council',
    description: 'Practical guide to making your voice heard in local government.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'How to Influence Your Council',
    description: 'Practical guide to making your voice heard in local government.',
  },
};

export default function LocalDemocracyGuidePage() {
  const faqs = [
    {
      question: 'Can I attend council meetings?',
      answer: 'Yes. Full council meetings and most committee meetings are open to the public. Many councils also livestream meetings online. You can find meeting dates on your council\'s website, usually under "meetings" or "democracy".',
    },
    {
      question: 'How do I contact my councillor?',
      answer: 'Find your councillor on your council\'s website by entering your postcode. You can usually email them directly. Councillors hold regular surgeries where you can meet them in person.',
    },
    {
      question: 'What is a freedom of information request?',
      answer: 'A freedom of information (FOI) request lets you ask for any information held by the council. They must respond within 20 working days. You can submit requests by email or through the council\'s website. Common requests include spending data, contracts, and decision documents.',
    },
    {
      question: 'How do I object to a planning application?',
      answer: 'Find the application on your council\'s planning portal. You can submit comments (for or against) during the consultation period, usually 21 days. Your comment must relate to planning grounds (like impact on neighbours, traffic, or character of the area), not personal objections.',
    },
    {
      question: 'Can I petition the council?',
      answer: 'Yes. Most councils have a petitions scheme. If your petition reaches a certain number of signatures (often 1,500+), it must be debated at a full council meeting. Some councils accept e-petitions online.',
    },
    {
      question: 'How can I influence the council budget?',
      answer: 'Councils consult on their budget each year, usually between December and February. You can respond to the consultation, attend budget meetings, or contact your councillor directly. CivAccount\'s Town Hall feature also lets you vote on budget priorities.',
    },
  ];

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Article',
        '@id': 'https://www.civaccount.co.uk/guide/local-democracy#article',
        headline: 'How to Influence Your Council — Guide to Local Democracy',
        description: 'Practical ways to participate in local government and make your voice heard.',
        datePublished: '2026-04-06',
        dateModified: '2026-04-06',
        publisher: {
          '@type': 'Organization',
          '@id': 'https://www.civaccount.co.uk/#organization',
          name: 'CivAccount',
        },
      },
      buildFAQPageSchema(faqs, '/guide/local-democracy'),
      buildBreadcrumbSchema(
        [{ name: 'Home', url: '/' }, { name: 'Guide: Local Democracy' }],
        '/guide/local-democracy'
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
        <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Guide: Local Democracy' }]} />

        <h1 className="type-title-1 mb-2">How to Influence Your Council</h1>
        <p className="type-body-sm text-muted-foreground mb-8">
          Your council makes decisions that affect your daily life — from bin collection to school places.
          Here are practical ways to have your say.
        </p>

        {/* Section 1: Attend meetings */}
        <section className="card-elevated p-5 sm:p-6 mb-5">
          <h2 className="type-title-2 mb-1">Attend council meetings</h2>
          <p className="type-body-sm text-muted-foreground mb-5">Open to the public</p>

          <div className="space-y-4 type-body-sm text-muted-foreground">
            <p>
              Most council meetings are open to the public. You can sit in the public gallery and watch councillors debate and vote on decisions.
            </p>
            <div>
              <p className="font-semibold text-foreground mb-2">Types of meetings</p>
              <div className="space-y-2">
                <div className="py-1"><span className="font-semibold text-foreground">Full council</span> — All councillors meet to vote on major decisions like the budget. Usually 4-6 times per year.</div>
                <div className="py-1"><span className="font-semibold text-foreground">Cabinet</span> — The leader and cabinet members make executive decisions. Usually monthly.</div>
                <div className="py-1"><span className="font-semibold text-foreground">Scrutiny committees</span> — Review and challenge cabinet decisions. Can call in decisions for reconsideration.</div>
                <div className="py-1"><span className="font-semibold text-foreground">Planning committees</span> — Decide on planning applications. Open to public speaking (usually 3 minutes for/against).</div>
              </div>
            </div>
            <p>
              Many councils now livestream meetings and publish recordings. Check your council&apos;s website for dates and agendas.
            </p>
          </div>
        </section>

        {/* Section 2: Contact councillors */}
        <section className="card-elevated p-5 sm:p-6 mb-5">
          <h2 className="type-title-2 mb-1">Contact your councillor</h2>
          <p className="type-body-sm text-muted-foreground mb-5">They work for you</p>

          <div className="space-y-4 type-body-sm text-muted-foreground">
            <p>
              Your ward councillor represents you on the council. They can raise issues on your behalf, ask questions at meetings, and lobby for changes.
            </p>
            <div>
              <p className="font-semibold text-foreground mb-2">How to get in touch</p>
              <ol className="space-y-2 list-decimal pl-5">
                <li>Find your councillor on your council&apos;s website (search by postcode)</li>
                <li>Email them directly — most councillors publish their email address</li>
                <li>Attend a surgery — councillors hold regular drop-in sessions in their ward</li>
                <li>Write a formal letter to the council offices</li>
              </ol>
            </div>
            <p>
              Be specific about what you want and why. Councillors receive many messages, so a clear, concise email is more effective than a long one.
            </p>
          </div>
        </section>

        {/* Section 3: FOI */}
        <section className="card-elevated p-5 sm:p-6 mb-5">
          <h2 className="type-title-2 mb-1">Submit a freedom of information request</h2>
          <p className="type-body-sm text-muted-foreground mb-5">Your right to know</p>

          <div className="space-y-4 type-body-sm text-muted-foreground">
            <p>
              Under the Freedom of Information Act 2000, you have the right to request any information held by the council. They must respond within 20 working days.
            </p>
            <div>
              <p className="font-semibold text-foreground mb-2">How to make a request</p>
              <ol className="space-y-2 list-decimal pl-5">
                <li>Check if the information is already published (many councils have transparency pages)</li>
                <li>Email the council&apos;s FOI team or use their online form</li>
                <li>Be specific about what information you want</li>
                <li>You do not need to explain why you want it</li>
              </ol>
            </div>
            <div>
              <p className="font-semibold text-foreground mb-2">Common FOI requests</p>
              <ul className="space-y-1 list-disc pl-5">
                <li>Staff salary bands and senior pay</li>
                <li>Contracts with suppliers and their value</li>
                <li>Spending on specific services</li>
                <li>Internal reports and decision papers</li>
                <li>Complaints data and response times</li>
              </ul>
            </div>
            <p>
              If the council refuses your request, you can appeal to the Information Commissioner&apos;s Office (ICO) at{' '}
              <a href="https://ico.org.uk" target="_blank" rel="noopener noreferrer" className="font-medium text-foreground hover:text-muted-foreground transition-colors">
                ico.org.uk
                <span className="sr-only"> (opens in new tab)</span>
              </a>.
            </p>
          </div>
        </section>

        {/* Section 4: Consultations */}
        <section className="card-elevated p-5 sm:p-6 mb-5">
          <h2 className="type-title-2 mb-1">Respond to consultations</h2>
          <p className="type-body-sm text-muted-foreground mb-5">Have your say on plans and policies</p>

          <div className="space-y-4 type-body-sm text-muted-foreground">
            <p>
              Councils are required to consult residents on many decisions, including the annual budget, planning applications, and major service changes.
            </p>
            <div>
              <p className="font-semibold text-foreground mb-2">Key consultations each year</p>
              <div className="space-y-2">
                <div className="py-1"><span className="font-semibold text-foreground">Budget consultation</span> — December to February. Your chance to influence spending priorities.</div>
                <div className="py-1"><span className="font-semibold text-foreground">Local Plan</span> — Major planning document that shapes development for 15+ years. Consulted on every few years.</div>
                <div className="py-1"><span className="font-semibold text-foreground">Service changes</span> — Councils must consult before closing libraries, changing bin collections, or cutting services.</div>
              </div>
            </div>
            <p>
              Check your council&apos;s website for current consultations. Many also advertise them on social media.
            </p>
          </div>
        </section>

        {/* Section 5: Petitions */}
        <section className="card-elevated p-5 sm:p-6 mb-5">
          <h2 className="type-title-2 mb-1">Start or sign a petition</h2>
          <p className="type-body-sm text-muted-foreground mb-5">Collective action</p>

          <div className="space-y-4 type-body-sm text-muted-foreground">
            <p>
              Most councils have a petitions scheme. If enough people sign, the council must respond formally.
            </p>
            <div className="space-y-2">
              <div className="py-1"><span className="font-semibold text-foreground">Standard petition</span> — The council must acknowledge and respond in writing.</div>
              <div className="py-1"><span className="font-semibold text-foreground">Debate threshold</span> — Usually 1,500+ signatures triggers a full council debate.</div>
              <div className="py-1"><span className="font-semibold text-foreground">Officer response threshold</span> — Usually 500+ signatures gets a formal officer report.</div>
            </div>
            <p>
              You can also use CivAccount&apos;s{' '}
              <Link href="/townhall" className="font-medium text-foreground hover:text-muted-foreground transition-colors">Town Hall</Link>
              {' '}feature to propose ideas and vote on budget priorities for your council.
            </p>
          </div>
        </section>

        {/* Section 6: Stand for election */}
        <section className="card-elevated p-5 sm:p-6 mb-5">
          <h2 className="type-title-2 mb-1">Stand for election</h2>
          <p className="type-body-sm text-muted-foreground mb-5">Become a councillor</p>

          <div className="space-y-4 type-body-sm text-muted-foreground">
            <p>
              Anyone aged 18 or over who is a British citizen (or qualifying Commonwealth or EU citizen) and lives or works in the council area can stand for election.
            </p>
            <div>
              <p className="font-semibold text-foreground mb-2">Requirements</p>
              <ul className="space-y-1 list-disc pl-5">
                <li>Be 18 or older on the day of nomination</li>
                <li>Be a British, Irish, Commonwealth, or EU citizen</li>
                <li>Live, work, or own property in the council area</li>
                <li>Not be disqualified (e.g., bankrupt, certain criminal convictions)</li>
              </ul>
            </div>
            <p>
              You can stand as a member of a political party or as an independent. Contact the{' '}
              <a href="https://www.electoralcommission.org.uk" target="_blank" rel="noopener noreferrer" className="font-medium text-foreground hover:text-muted-foreground transition-colors">
                Electoral Commission
                <span className="sr-only"> (opens in new tab)</span>
              </a>
              {' '}for guidance on the nomination process.
            </p>
          </div>
        </section>

        {/* FAQ */}
        <section className="card-elevated p-5 sm:p-6 mb-5">
          <h2 className="type-title-2 mb-1">Common questions</h2>
          <p className="type-body-sm text-muted-foreground mb-5">About local democracy</p>
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
            <li><Link href="/guide/council-leadership" className="type-body-sm text-muted-foreground hover:text-foreground transition-colors">Guide: Who runs your council</Link></li>
            <li><Link href="/guide/council-tax" className="type-body-sm text-muted-foreground hover:text-foreground transition-colors">Guide: Council tax explained</Link></li>
            <li><Link href="/guide/council-spending" className="type-body-sm text-muted-foreground hover:text-foreground transition-colors">Guide: How councils spend your money</Link></li>
            <li><Link href="/townhall" className="type-body-sm text-muted-foreground hover:text-foreground transition-colors">Town Hall — Have your say</Link></li>
          </ul>
        </nav>
      </main>
      <Footer />
    </div>
  );
}
