import type { Metadata } from 'next';
import Link from 'next/link';
import { councils, getCouncilDisplayName, getCouncilSlug, COUNCIL_TYPE_NAMES } from '@/data/councils';
import { buildWebPageSchema, buildBreadcrumbSchema, buildFAQPageSchema } from '@/lib/structured-data';
import { serializeJsonLd } from '@/lib/safe-json-ld';
import Breadcrumb from '@/components/proposals/Breadcrumb';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

/**
 * /councils — the A–Z index of every English council.
 *
 * This page exists for a structural reason, not an editorial one. Before it,
 * the homepage linked to zero council pages and so did /insights; the only
 * page linking all 317 was /insights/leaderboards, three clicks deep. Council
 * pages were reachable in practice only via the sitemap and the client-side
 * search box, which meant no internal link equity reached them and any crawler
 * that follows links rather than parsing sitemaps — a lot of the AI ones —
 * could not enumerate the site at all.
 *
 * Linked from the homepage, this puts every council two clicks from the root.
 *
 * Deliberately renders NO figures. Data Constitution Rule 3 requires every
 * rendered number to be wrapped in a SourceAnnotation the reader can click
 * through, and a navigation index has no business carrying 317 unsourced Band
 * D values. Names and types only — the numbers live on the council pages,
 * where their provenance does too.
 */

const TITLE = 'All English councils A–Z — every council on CivAccount';
const DESCRIPTION =
  'Browse all 317 English councils by name and type. County councils, district councils, unitary authorities, metropolitan districts and London boroughs — each linking to its council tax and budget breakdown.';

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: {
    canonical: '/councils',
  },
  openGraph: {
    title: 'All English councils A–Z',
    description: 'Every one of England\'s 317 councils, grouped by type, each linking to its council tax and spending breakdown.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'All English councils A–Z',
    description: 'Every one of England\'s 317 councils, grouped by type, each linking to its council tax and spending breakdown.',
  },
};

// Order runs largest-scope first, so a reader scanning for their own council
// meets the all-in-one authorities before the two-tier split that confuses
// most people.
const TYPE_ORDER = ['UA', 'MD', 'LB', 'SC', 'SD'] as const;

// Explicit, because "Unitary Authority" + "s" gives "Unitary Authoritys".
const TYPE_PLURAL: Record<string, string> = {
  UA: 'Unitary authorities',
  MD: 'Metropolitan districts',
  LB: 'London boroughs',
  SC: 'County councils',
  SD: 'District councils',
};

const TYPE_BLURB: Record<string, string> = {
  UA: 'One council for everything — bins, schools, roads and social care.',
  MD: 'All services in one council, in England\'s largest urban areas.',
  LB: 'All services in one council, across the 32 boroughs and the City of London.',
  SC: 'The upper tier — schools, social care and main roads. You also pay a district council.',
  SD: 'The lower tier — bins, planning and housing. You also pay a county council.',
};

interface Group {
  type: string;
  label: string;
  blurb: string;
  entries: Array<{ name: string; slug: string }>;
}

function buildGroups(): Group[] {
  return TYPE_ORDER.map((type) => {
    const entries = councils
      .filter((c) => c.type === type)
      .map((c) => ({ name: getCouncilDisplayName(c), slug: getCouncilSlug(c) }))
      .sort((a, b) => a.name.localeCompare(b.name, 'en-GB'));
    return {
      type,
      label: TYPE_PLURAL[type] ?? `${COUNCIL_TYPE_NAMES[type] ?? 'Council'}s`,
      blurb: TYPE_BLURB[type] ?? '',
      entries,
    };
  }).filter((g) => g.entries.length > 0);
}

export default function CouncilsIndexPage() {
  const groups = buildGroups();
  const total = groups.reduce((n, g) => n + g.entries.length, 0);

  const faqs = [
    {
      question: 'How many councils are there in England?',
      answer: `There are ${total} English councils on CivAccount: ${groups
        .map((g) => `${g.entries.length} ${g.label.toLowerCase()}`)
        .join(', ')}.`,
    },
    {
      question: 'Why do I pay two councils?',
      answer:
        'In two-tier areas you pay a county council for schools, social care and main roads, and a district council for bins, planning and housing. Both appear on the same bill. Everywhere else, a single council does all of it.',
    },
    {
      question: 'Which council am I in?',
      answer:
        'Search by postcode on the CivAccount homepage, or find your council by name in the lists below. The name on your council tax bill is the one to look for.',
    },
  ];

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      buildWebPageSchema(TITLE, DESCRIPTION, '/councils', { type: 'CollectionPage' }),
      {
        '@type': 'ItemList',
        '@id': 'https://www.civaccount.co.uk/councils#itemlist',
        name: 'English councils A–Z',
        description: DESCRIPTION,
        numberOfItems: total,
        itemListOrder: 'https://schema.org/ItemListOrderAscending',
        itemListElement: groups.flatMap((g) =>
          g.entries.map((e) => ({
            '@type': 'ListItem',
            name: e.name,
            url: `https://www.civaccount.co.uk/council/${e.slug}`,
          })),
        ),
      },
      buildFAQPageSchema(faqs, '/councils'),
      buildBreadcrumbSchema([{ name: 'Home', url: '/' }, { name: 'All councils' }], '/councils'),
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }} />
      <Header />
      <main id="main-content" className="flex-1">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
          <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'All councils' }]} />

          <div className="mt-6 mb-8">
            <h1 className="type-title-1 mb-2">All English councils</h1>
            <p className="type-body-sm text-muted-foreground">
              Every one of England&rsquo;s {total} councils, grouped by what they do. Pick yours to see
              where your council tax goes.
            </p>
          </div>

          {/* Jump links — 317 entries is a long page on a phone, and most
              people know their council type from the name on their bill. */}
          <nav aria-label="Jump to council type" className="mb-10 flex flex-wrap gap-2">
            {groups.map((g) => (
              <a
                key={g.type}
                href={`#${g.type.toLowerCase()}`}
                className="type-caption inline-flex items-center min-h-[44px] px-3 rounded-lg bg-muted/30 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
              >
                {g.label} <span className="ml-1.5 tabular-nums opacity-70">{g.entries.length}</span>
              </a>
            ))}
          </nav>

          {groups.map((group) => (
            <section key={group.type} id={group.type.toLowerCase()} className="mb-12 scroll-mt-20">
              <h2 className="type-title-2 mb-1">
                {group.label}{' '}
                <span className="type-body-sm text-muted-foreground font-normal tabular-nums">
                  ({group.entries.length})
                </span>
              </h2>
              <p className="type-body-sm text-muted-foreground mb-5">{group.blurb}</p>

              <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6">
                {group.entries.map((entry) => (
                  <li key={entry.slug} className="border-b border-border/40">
                    <Link
                      href={`/council/${entry.slug}`}
                      className="type-body-sm flex items-center min-h-[44px] text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                    >
                      {entry.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}

          <section className="mt-12 pt-8 border-t border-border/50">
            <h2 className="type-title-2 mb-4">Common questions</h2>
            <div className="space-y-4">
              {faqs.map((faq) => (
                <div key={faq.question}>
                  <h3 className="type-body-sm font-semibold mb-1">{faq.question}</h3>
                  <p className="type-body-sm text-muted-foreground">{faq.answer}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
