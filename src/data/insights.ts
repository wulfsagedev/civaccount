/**
 * Insights card registry.
 *
 * One entry per `/insights/<slug>` card. The `/insights` grid renders tiles
 * grouped by `section`; each sub-page reads its entry for copy, FAQ, and
 * sources.
 *
 * Only Phase A cards are active. Cards for later phases are omitted from this
 * file until they ship.
 */

export const INSIGHT_SECTIONS = {
  bill: { label: 'The bill', description: 'Where the money comes from' },
  spend: { label: 'The spend', description: 'Where it goes' },
  suppliers: { label: 'The suppliers', description: 'Who actually receives it' },
  workforce: { label: 'The workforce', description: 'Staff and senior pay' },
  politicians: { label: 'The politicians', description: 'Who runs England' },
  redflags: { label: 'The red flags', description: 'Financial warning signs' },
  outcomes: { label: 'The outcomes', description: 'Service quality' },
  build: { label: 'The big build', description: 'Capital projects' },
} as const;

export type InsightSectionKey = keyof typeof INSIGHT_SECTIONS;

export interface InsightFaq {
  question: string;
  answer: string;
}

export interface InsightSource {
  title: string;
  url: string;
}

export interface InsightCardEntry {
  /** URL slug — route is /insights/<slug>/ */
  slug: string;
  /** Section this card belongs to — drives grouping on the hub. */
  section: InsightSectionKey;
  /** Short, plain-English card title. Also used as the SEO <h1>. */
  title: string;
  /** One-line subtitle shown under the title on the tile and sub-page. */
  subtitle: string;
  /** Meta description for the sub-page (<160 chars recommended). */
  metaDescription: string;
  /** Pre-written share text — used by ShareButton on the tile and sub-page. */
  shareText: string;
  /** Longer body copy shown on the sub-page below the hero. 10-year-old reading age. */
  longformCopy: string[];
  /** FAQ block for the sub-page — powers FAQPage JSON-LD too. */
  faq: InsightFaq[];
  /** Sources section on the sub-page. */
  sources: InsightSource[];
}

export const INSIGHT_CARDS: InsightCardEntry[] = [
  // ── §1 The bill ──────────────────────────────────────────────────────────────
  {
    slug: 'postcode-lottery',
    section: 'bill',
    title: "England's postcode lottery",
    subtitle: 'Band D bills at either end of the scale',
    metaDescription:
      'The cheapest and most expensive Band D council tax bills in England for 2025-26, compared fairly across council types.',
    shareText:
      "England's council tax postcode lottery — the gap between cheapest and priciest Band D bill",
    longformCopy: [
      'Council tax rates vary a lot across England. This card puts the cheapest and most expensive councils side by side so you can see the real spread.',
      "We group councils before comparing, because different types do different jobs. A district council and a unitary authority aren't directly comparable — one handles bins, the other handles everything.",
    ],
    faq: [
      {
        question: 'Which council has the cheapest council tax in England?',
        answer:
          'The cheapest Band D council for 2025-26 is shown on this page. Rates are grouped by council type so the comparison is fair.',
      },
      {
        question: 'Why group councils before comparing?',
        answer:
          'Residents in a two-tier area pay both a district bill and a county bill. Comparing a district rate to a unitary rate without grouping makes the district look artificially cheap.',
      },
    ],
    sources: [
      {
        title: 'Council Tax levels set by local authorities — GOV.UK',
        url: 'https://www.gov.uk/government/collections/council-tax-statistics',
      },
    ],
  },
  {
    slug: 'biggest-tax-rises',
    section: 'bill',
    title: 'Biggest tax rises this year',
    subtitle: 'Councils that put Band D up the most in 2025-26',
    metaDescription:
      'The English councils that raised council tax the most in 2025-26, ranked by percentage increase compared to 2024-25.',
    shareText:
      'The English councils that raised council tax the most this year',
    longformCopy: [
      "Every year most councils put their Band D rate up by a small amount. A few go higher — sometimes because they have a special government agreement.",
      "This card ranks councils by how much their Band D bill changed from last year. It's a simple like-for-like comparison of the same number in two years.",
    ],
    faq: [
      {
        question: 'Which councils raised council tax the most in 2025-26?',
        answer:
          'The top councils by percentage rise are shown on this page, along with the national average rise for context.',
      },
      {
        question: 'Why can some councils raise council tax by more than others?',
        answer:
          'Councils usually have a cap on how much they can put bills up without a referendum. Some councils in financial difficulty get special permission from central government to exceed the cap.',
      },
    ],
    sources: [
      {
        title: 'Council Tax levels set by local authorities — GOV.UK',
        url: 'https://www.gov.uk/government/collections/council-tax-statistics',
      },
    ],
  },

  // ── §2 The spend ─────────────────────────────────────────────────────────────
  {
    slug: 'social-care-squeeze',
    section: 'spend',
    title: 'The social care squeeze',
    subtitle: 'How much of every council budget is locked in care',
    metaDescription:
      "Adult and children's social care together take more than 60p of every £1 in many English council budgets. Here's the national share, and which councils are most squeezed.",
    shareText:
      "The social care squeeze — how much of every council budget goes on adult and children's care",
    longformCopy: [
      "Adult social care and children's services are the biggest things most councils spend on. In some councils they take more than 70p of every £1 — leaving less for everything else.",
      "This card shows the national share first, then ranks councils by how squeezed their budget is. Only councils that provide both services are included — district councils don't, so they're excluded from the league.",
    ],
    faq: [
      {
        question: 'Why is social care so much of council spending?',
        answer:
          'Councils are legally required to look after vulnerable adults and children. That bill has grown faster than funding, so it now dominates most council budgets.',
      },
      {
        question: 'Which councils spend most of their budget on care?',
        answer:
          'The councils with the highest share are listed on this page. Unitary authorities, metropolitan districts, London boroughs and county councils all deliver both care services.',
      },
    ],
    sources: [
      {
        title: 'Local authority revenue expenditure and financing — GOV.UK',
        url: 'https://www.gov.uk/government/collections/local-authority-revenue-expenditure-and-financing',
      },
    ],
  },

  // ── §3 The suppliers ★ ───────────────────────────────────────────────────────
  {
    slug: 'top-suppliers',
    section: 'suppliers',
    title: 'Who really gets your council tax',
    subtitle: 'The biggest private companies paid by English councils',
    metaDescription:
      'The private contractors that receive the most council money across England — aggregated from every council that publishes its top suppliers.',
    shareText:
      'The private companies that receive the most council tax money in England',
    longformCopy: [
      'Councils publish a list of their biggest suppliers every year. This card adds them up across every council to show the companies that receive the most public money nationally.',
      'Only councils that publish supplier data are included. Some contracts run over several years, so the annual figures shown are the most recent disclosed amounts per council.',
    ],
    faq: [
      {
        question: 'Which companies get the most council tax money?',
        answer:
          'The top aggregated suppliers across all English councils that publish supplier lists are shown on this page. Names are normalised so "Capita plc" and "Capita Ltd" aggregate together.',
      },
      {
        question: 'Where does this data come from?',
        answer:
          'Each council publishes invoices over £250 and a top suppliers list under the Local Government Transparency Code. We aggregate the per-council figures to a national total.',
      },
      {
        question: 'Why is the total different from total council spend?',
        answer:
          "Not every council publishes a top suppliers list, and councils only list their biggest suppliers — not every payment. So the total here is a floor, not the full picture.",
      },
    ],
    sources: [
      {
        title: 'Local Government Transparency Code 2015 — GOV.UK',
        url: 'https://www.gov.uk/government/publications/local-government-transparency-code-2015',
      },
    ],
  },

  // ── §4 The workforce ────────────────────────────────────────────────────────
  {
    slug: 'ceo-pay-league',
    section: 'workforce',
    title: 'Highest-paid council CEOs',
    subtitle: 'Total remuneration of chief executives across England',
    metaDescription:
      'The highest and lowest paid council chief executives in England, based on total disclosed remuneration for 2025-26.',
    shareText:
      "The highest-paid council chief executives in England — and the lowest",
    longformCopy: [
      "Every council has a chief executive — the most senior paid officer who runs the organisation day to day. Their salary and total remuneration are published in each council's pay policy statement.",
      'This card shows the highest and lowest paid CEOs alongside the national median. Total remuneration includes salary plus any published pension contribution and benefits, where disclosed — otherwise the base salary.',
    ],
    faq: [
      {
        question: 'How much does a council chief executive earn?',
        answer:
          'Salaries vary a lot by council size. The national median and both extremes are shown on this page.',
      },
      {
        question: 'What is included in total remuneration?',
        answer:
          'Total remuneration is salary plus published employer pension contribution and any disclosed benefits. Where total remuneration is not separately disclosed, base salary is used.',
      },
      {
        question: 'Where does this information come from?',
        answer:
          "Every council publishes a pay policy statement each year. We read each statement directly from the council's own website.",
      },
    ],
    sources: [
      {
        title: 'Pay policy statements — published by each council under the Localism Act',
        url: 'https://www.gov.uk/government/publications/openness-and-accountability-in-local-pay-guidance',
      },
    ],
  },

  // ── §6 The red flags ★ ───────────────────────────────────────────────────────
  {
    slug: 'closest-to-bankruptcy',
    section: 'redflags',
    title: 'Closest to bankruptcy',
    subtitle: 'Councils with the biggest gap between spending and funding',
    metaDescription:
      'The English councils with the biggest budget gaps — the shortfall between what they plan to spend and the funding they have in place.',
    shareText:
      'The English councils with the biggest budget gaps this year',
    longformCopy: [
      "A budget gap is the difference between what a council plans to spend and the funding it has lined up. Councils close the gap through savings, cuts or using reserves. When they can't, they issue a Section 114 notice — an effective bankruptcy declaration.",
      "This card ranks councils by the size of their budget gap in pounds. Some councils publish a single-year gap; others publish the cumulative shortfall they expect across their Medium Term Financial Strategy (typically 3–5 years). Both are shown here — a bigger number means more financial work to do, not certainty of failure.",
    ],
    faq: [
      {
        question: 'What is a Section 114 notice?',
        answer:
          "Section 114 of the Local Government Finance Act 1988 requires a council's finance officer to issue a notice when the council cannot balance its budget. New spending is frozen until a recovery plan is agreed.",
      },
      {
        question: 'Does a big budget gap mean a council is going bust?',
        answer:
          'No. Most councils close their gaps each year through savings, cuts or drawing down reserves. A big gap signals pressure, not certainty of failure.',
      },
      {
        question: 'Where does the budget gap figure come from?',
        answer:
          "Each council publishes its budget and Medium Term Financial Strategy. We read the budget gap directly from those documents.",
      },
    ],
    sources: [
      {
        title: "Section 114 notices — Ministry of Housing, Communities and Local Government",
        url: 'https://www.gov.uk/government/publications/local-government-finance-act-1988',
      },
    ],
  },
];

export function getInsightCard(slug: string): InsightCardEntry | undefined {
  return INSIGHT_CARDS.find((c) => c.slug === slug);
}

/** Ordered list of section keys that contain at least one active card. */
export function getActiveSectionKeys(): InsightSectionKey[] {
  const keys = new Set<InsightSectionKey>();
  for (const card of INSIGHT_CARDS) keys.add(card.section);
  // Preserve the order defined in INSIGHT_SECTIONS.
  return (Object.keys(INSIGHT_SECTIONS) as InsightSectionKey[]).filter((k) =>
    keys.has(k),
  );
}

export function getCardsForSection(section: InsightSectionKey): InsightCardEntry[] {
  return INSIGHT_CARDS.filter((c) => c.section === section);
}
