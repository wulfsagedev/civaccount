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

  {
    slug: 'three-year-squeeze',
    section: 'bill',
    title: 'Bigger bills, 2 years on',
    subtitle: 'How much more Band D costs than in 2023-24',
    metaDescription:
      'The Band D council tax rise from 2023-24 to 2025-26 for every English council — in pounds, not percentages. Shows how much more a typical household pays each year now than two years ago.',
    shareText:
      "How much more Band D costs per year than 2 years ago — ranked across all 317 English councils",
    longformCopy: [
      'Every spring, councils announce their new Band D rate and the percentage rise. Two years of rises compound quickly — the council that raised by 5% then 5% is now charging 10.25% more, not 10%.',
      "This card shows the story in pounds: how many more pounds a Band D household pays per year now compared with 2023-24. The biggest rises are over £300 more per year. The national median is around £160. All 317 English councils are included — Band D rates for both years are on the public record.",
    ],
    faq: [
      {
        question: 'How much has my Band D bill gone up in the last 2 years?',
        answer:
          "Find your council on the ranked list to see the exact figure. Across England, the typical council has added around £160 to a Band D bill since 2023-24. The biggest rises are more than double that.",
      },
      {
        question: 'Why is the rise bigger than if you add the two percentages?',
        answer:
          'Each yearly rise is calculated on top of the previous higher bill, not the original. A 5% rise followed by another 5% is actually 10.25%, not 10%. Over two years, most councils are up around 10% — worth around £160 on a typical Band D bill.',
      },
      {
        question: 'Where does this data come from?',
        answer:
          "Band D council tax rates for 2023-24 and 2025-26 are published by the Ministry of Housing, Communities and Local Government. We read each council's headline figure directly from GOV.UK and subtract one from the other.",
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

  {
    slug: 'where-every-pound-goes',
    section: 'spend',
    title: 'Where every £1 goes',
    subtitle: 'National breakdown of council spending by service',
    metaDescription:
      "How 100p of every £1 English councils spend is split across care, schools, bins, roads and everything else — aggregated across all 317 councils.",
    shareText:
      "Where every £1 of English council spending actually goes — 10 services, one chart",
    longformCopy: [
      "Councils spend public money on about ten big service areas. This card adds up every council's spending, then shows what share goes on each service.",
      "It's the single clearest view of what councils are actually for. Two services — adult care and children's services — dominate most of the pound. Everything else splits what's left.",
    ],
    faq: [
      {
        question: 'What do English councils spend money on?',
        answer:
          "Councils fund adult social care, children's services, schools, roads, bins, planning, housing, culture and the cost of running the council. Shares vary by council type.",
      },
      {
        question: 'Where does this data come from?',
        answer:
          "Each council's planned budget for 2025-26, published on its own website and collated into a standard service taxonomy. Values are net service spend in pounds.",
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

  {
    slug: 'big-five-outsourcers',
    section: 'suppliers',
    title: 'The Big Five outsourcers',
    subtitle: 'How much of top-supplier spend goes to Capita, Serco, Veolia, Biffa and Amey',
    metaDescription:
      "The combined share of top-supplier spend that English councils direct to the five best-known outsourcers — Capita, Serco, Veolia, Biffa and Amey.",
    shareText:
      "How much English council supplier spend goes to just five outsourcing companies",
    longformCopy: [
      "A lot of public services are delivered by the same handful of private companies. This card aggregates top-supplier disclosures across English councils and shows how much of that spend lands with just five of the best-known outsourcers.",
      "Only spend reported in each council's published top suppliers list is counted. The wider outsourcing picture is bigger — councils have thousands of contracts that don't make the top list.",
    ],
    faq: [
      {
        question: 'Why just these five companies?',
        answer:
          "Capita, Serco, Veolia, Biffa and Amey are the five suppliers most commonly associated with English local-government outsourcing — running back-office, waste, highways and facilities contracts. The card gives a like-for-like share across a familiar set.",
      },
      {
        question: 'Is this all the money councils spend with these companies?',
        answer:
          'No. Councils only publish their biggest suppliers — the true total is higher. This card shows the minimum disclosed spend.',
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

  {
    slug: 'hundred-k-club',
    section: 'workforce',
    title: "The £100k club",
    subtitle: 'Senior council staff earning £100,000 or more, disclosed band-by-band',
    metaDescription:
      'How many senior staff earn £100,000 or more at each English council, based on published salary band disclosures.',
    shareText:
      "The number of council staff earning £100,000 or more — council by council",
    longformCopy: [
      "Every council is required to publish how many of its staff earn £50,000 or more, in £5,000 bands. This card adds up the bands at or above £100,000 to give a per-council count of senior staff.",
      "Only councils that publish a complete salary-band table are included. Council size matters a lot — a big unitary with tens of thousands of staff will have more £100k roles than a small district.",
    ],
    faq: [
      {
        question: 'Does everyone in this group earn £100,000 or more?',
        answer:
          'Yes. The figure counts staff whose disclosed salary band starts at £100,000 or higher. It excludes pension contributions and benefits.',
      },
      {
        question: 'Why do some councils not appear?',
        answer:
          'Not every council has published its salary bands in a machine-readable form yet. Coverage is noted on the page. Some councils also have no staff in the £100k+ bracket.',
      },
    ],
    sources: [
      {
        title: 'Local Government Transparency Code 2015 — GOV.UK',
        url: 'https://www.gov.uk/government/publications/local-government-transparency-code-2015',
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
  {
    slug: 'cap-every-year',
    section: 'redflags',
    title: 'Cap every year',
    subtitle: 'Councils at the 4.99% cap in both 2024 and 2025',
    metaDescription:
      'The English councils that pushed Band D to — or past — the 4.99% referendum cap in two consecutive years. A signal of persistent financial pressure, not a one-off.',
    shareText:
      'The councils that hit the 4.99% council tax cap two years running',
    longformCopy: [
      "Most councils are limited to a Band D rise of 4.99% (2.99% core plus a 2% adult social care precept) before a referendum is required. A few councils in severe financial difficulty get special permission to exceed the cap.",
      "This card shows the councils that raised Band D by 4.99% or more in both 2024-25 AND 2025-26. A one-off big rise can follow a restructure; two in a row is a sustained signal of financial stress — the kind of pattern only a year-by-year comparison across all 317 councils reveals.",
    ],
    faq: [
      {
        question: 'Why does hitting the cap two years running matter?',
        answer:
          'Every year most councils raise Band D by well under the cap. Hitting the maximum permitted rise in consecutive years shows the council has little financial headroom — each year\'s bill rise is compounding.',
      },
      {
        question: 'Is this the same as the "Above the cap" card?',
        answer:
          "No. That card lists councils that went above 4.99% this year. This one narrows the list to councils that have pushed to or beyond the cap in BOTH 2024-25 and 2025-26 — a signal of sustained stress, not a single-year response.",
      },
      {
        question: 'Where does this data come from?',
        answer:
          "Band D council tax rates for 2023-24, 2024-25 and 2025-26 are published on GOV.UK. We compute each year's rise and check which councils cleared 4.99% in both of the last two.",
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
    slug: 'tax-cap-breakers',
    section: 'redflags',
    title: 'Above the cap',
    subtitle: 'Councils that raised Band D by 4.99% or more this year',
    metaDescription:
      'Which English councils pushed council tax to, or beyond, the 4.99% referendum cap in 2025-26 — and which needed government permission to exceed it.',
    shareText:
      'The councils that raised Band D to — or above — the 4.99% cap this year',
    longformCopy: [
      "Most councils are limited to a Band D rise of 4.99% (a 2.99% core increase plus a 2% social care precept) before a local referendum is required. A few councils in financial difficulty get special permission from government to go higher.",
      "This card counts every council at or above the cap, shows the national average rise for context, and lists the councils that exceeded it — typically the clearest sign of financial stress.",
    ],
    faq: [
      {
        question: 'What is the council tax cap?',
        answer:
          'Ministers set an annual cap on how much councils can raise Band D without holding a local referendum. For 2025-26 the core cap is 2.99% plus a 2% adult social care precept — 4.99% combined for upper-tier councils.',
      },
      {
        question: 'Why can some councils exceed the cap?',
        answer:
          "Councils in severe financial difficulty can apply to the Ministry of Housing, Communities and Local Government for an 'exceptional financial support' package. One condition of that support is often a council-tax rise above the standard cap.",
      },
    ],
    sources: [
      {
        title: 'Council Tax levels set by local authorities — GOV.UK',
        url: 'https://www.gov.uk/government/collections/council-tax-statistics',
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
