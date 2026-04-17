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
  suppliers: { label: 'The suppliers', description: 'Who is paid' },
  workforce: { label: 'The workforce', description: 'Staff and senior pay' },
  politicians: { label: 'The politicians', description: 'Who runs England' },
  redflags: { label: 'Money pressure', description: 'Signs of financial strain' },
  outcomes: { label: 'The outcomes', description: 'How services perform' },
  build: { label: 'Building work', description: 'Big capital projects' },
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
    subtitle: 'The cheapest and priciest Band D bills',
    metaDescription:
      'The cheapest and most expensive Band D council tax bills in England for 2025-26, compared fairly between councils that do the same jobs.',
    shareText:
      "The gap between England's cheapest and priciest Band D council tax bill",
    longformCopy: [
      'Council tax rates are very different from one part of England to another. This card puts the cheapest and most expensive councils side by side so you can see the gap.',
      "We group councils before comparing them, because different types do different jobs. A district council looks after bins and planning. A unitary authority does all of that plus schools, roads and care. Comparing the two without grouping is not a fair comparison.",
    ],
    faq: [
      {
        question: 'Which council has the cheapest council tax in England?',
        answer:
          'The cheapest Band D council for 2025-26 is shown at the top of this page. Rates are grouped by council type so you compare like with like.',
      },
      {
        question: 'Why group councils before comparing?',
        answer:
          "Households in a two-tier area pay two bills — one to their district and one to their county. If you compare a district bill on its own to a unitary bill, the district looks much cheaper than it really is.",
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
      "The English councils that raised council tax the most in 2025-26, ranked by how much Band D went up compared with 2024-25.",
    shareText:
      'The English councils that raised council tax the most this year',
    longformCopy: [
      "Every year most councils put their Band D rate up. Some go up by more than others — a few with special permission from government.",
      "This card ranks councils by how much their Band D bill changed from last year. It is a like-for-like comparison of the same number in two years.",
    ],
    faq: [
      {
        question: 'Which councils raised council tax the most in 2025-26?',
        answer:
          'The councils with the biggest rises are listed on this page, alongside the national average for context.',
      },
      {
        question: 'Why can some councils raise council tax by more than others?',
        answer:
          'There is usually a limit on how much councils can put bills up without holding a local vote. Councils in financial difficulty can ask central government for permission to go above this limit.',
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
      'The rise in Band D council tax from 2023-24 to 2025-26 for every English council — in pounds, not percentages. Shows how much more a typical household now pays each year.',
    shareText:
      "How much more Band D costs per year than 2 years ago — every English council ranked",
    longformCopy: [
      'Each spring, councils tell people their new Band D rate and the percentage rise. Two years of rises add up fast — a council that raised by 5% then 5% is now charging 10.25% more, not 10%.',
      "This card shows the story in pounds: how much more a Band D household pays each year now than in 2023-24. The biggest rises are over £300 more per year. The middle (median) is around £160. All 317 English councils are included — both years' rates are on the public record.",
    ],
    faq: [
      {
        question: 'How much has my Band D bill gone up in the last 2 years?',
        answer:
          "Find your council in the ranked list to see the exact figure. Across England, the middle (median) council has added around £160 to a Band D bill since 2023-24. The biggest rises are more than double that.",
      },
      {
        question: 'Why is the total rise more than the two percentages added together?',
        answer:
          "Each year's rise is added on top of the new, higher bill — not the original. So a 5% rise followed by another 5% works out at 10.25%, not 10%. Across two years, most councils are up around 10% — about £160 on a typical Band D bill.",
      },
      {
        question: 'Where does this data come from?',
        answer:
          "Band D council tax rates for 2023-24 and 2025-26 are published by the Ministry of Housing, Communities and Local Government. We take each council's headline figure straight from GOV.UK and subtract one from the other.",
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
    subtitle: 'Share of every council budget that goes on care',
    metaDescription:
      "In many English council budgets, adult and children's care together take more than 60p of every £1. Here is the national share, and the councils with the biggest share.",
    shareText:
      "How much of every council budget goes on adult and children's care",
    longformCopy: [
      "Adult social care and children's services are the biggest things most councils spend on. In some councils they take more than 70p of every £1.",
      "This card shows the national share first, then ranks councils by how big the care share is in each one. Only councils that run both services are included. District councils do not, so they are not in the league.",
    ],
    faq: [
      {
        question: 'Why is social care such a big share of council spending?',
        answer:
          'By law, councils have to look after vulnerable adults and children. The cost of doing this has gone up faster than the money councils get from government, so it now takes up most of many council budgets.',
      },
      {
        question: 'Which councils spend the biggest share of their budget on care?',
        answer:
          'The councils with the highest care share are listed on this page. Unitary authorities, metropolitan districts, London boroughs and county councils all run both care services.',
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
    subtitle: 'How council spending splits between services',
    metaDescription:
      "How every £1 English councils spend is split between care, schools, bins, roads and everything else — added up across all 317 councils.",
    shareText:
      "Where every £1 of English council spending goes — 10 services, one chart",
    longformCopy: [
      "Councils spend public money on about ten big service areas. This card adds up every council's spending, then shows what share goes on each service.",
      "Most of every £1 goes on two services: adult care and children's services. Everything else shares what is left.",
    ],
    faq: [
      {
        question: 'What do English councils spend money on?',
        answer:
          "Councils pay for adult social care, children's services, schools, roads, bins, planning, housing, culture and the cost of running the council itself. The shares are different from one council type to another.",
      },
      {
        question: 'Where does this data come from?',
        answer:
          "Each council's planned budget for 2025-26, published on its own website. We sort each council's spending into the same set of service categories so we can add them up. Values are net spend on services, in pounds.",
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
    title: 'Biggest companies paid by councils',
    subtitle: 'The biggest private companies paid by English councils',
    metaDescription:
      "The private contractors that get the most money from English councils — added up from every council that publishes its top supplier list.",
    shareText:
      'The private companies paid the most by English councils',
    longformCopy: [
      'Each year, councils publish a list of their biggest suppliers. This card adds those lists up across every council to show the companies that get the most public money in total.',
      "Only councils that publish their list are included. Some contracts run for several years, so the yearly figure for each council is the most recent one it has published.",
    ],
    faq: [
      {
        question: 'Which companies get the most money from councils?',
        answer:
          'The biggest companies across all English councils that publish a supplier list are shown on this page. Names are tidied up so that "Capita plc" and "Capita Ltd" are counted as the same company.',
      },
      {
        question: 'Where does this data come from?',
        answer:
          "Under the Local Government Transparency Code, each council publishes invoices over £250 and a list of its biggest suppliers. We add these council-level figures up to get a national total.",
      },
      {
        question: 'Why is this total different from total council spend?',
        answer:
          "Not every council publishes a top supplier list, and the lists only include each council's biggest suppliers — not every single payment. So the figure here is the minimum we can see, not the full picture.",
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
    subtitle: 'Share of top-supplier spend going to Capita, Serco, Veolia, Biffa and Amey',
    metaDescription:
      "The combined share of published top-supplier spend that English councils pay to five well-known outsourcers — Capita, Serco, Veolia, Biffa and Amey.",
    shareText:
      "How much English council supplier spend goes to just five outsourcing companies",
    longformCopy: [
      "Many public services are run by the same group of private companies. This card adds up each council's top supplier list, then shows what share of that spend goes to five well-known outsourcers.",
      "Only spend that appears in each council's published top supplier list is counted. The full outsourcing picture is bigger — councils have thousands of contracts that do not make the top list.",
    ],
    faq: [
      {
        question: 'Why just these five companies?',
        answer:
          "Capita, Serco, Veolia, Biffa and Amey are the five private suppliers most often named when people talk about English council outsourcing. They run back-office, waste, roads and building contracts for many councils. Picking the same five for every council gives a fair, like-for-like share.",
      },
      {
        question: 'Is this all the money councils spend with these companies?',
        answer:
          'No. Councils only publish their biggest suppliers, so the real total is higher. This card shows the minimum that has been published.',
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
    subtitle: 'Total pay of chief executives across England',
    metaDescription:
      'The highest and lowest paid council chief executives in England, based on total pay (salary plus pension and benefits, where listed) for 2025-26.',
    shareText:
      "The highest-paid council chief executives in England — and the lowest",
    longformCopy: [
      "Every council has a chief executive — the most senior paid officer, who runs the council day to day. Each council publishes their pay in a yearly pay policy statement.",
      'This card shows the highest and lowest paid CEOs, plus the middle (median) figure for England. Total pay is salary plus any pension contribution and benefits the council has listed. If only the basic salary is listed, we use that.',
    ],
    faq: [
      {
        question: 'How much does a council chief executive earn?',
        answer:
          "Pay is very different from one council to another, mostly because of size. The middle (median) figure and both ends of the range are on this page.",
      },
      {
        question: 'What does "total pay" mean here?',
        answer:
          "Total pay is salary plus the employer's pension contribution and any benefits the council has listed. If we cannot find a total, we use the basic salary.",
      },
      {
        question: 'Where does this information come from?',
        answer:
          "Each year, every council publishes a pay policy statement. We read each statement straight from the council's own website.",
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
    subtitle: "Senior council staff paid £100,000 or more, taken from each council's published list",
    metaDescription:
      "How many senior staff earn £100,000 or more at each English council, based on each council's published list of salary bands.",
    shareText:
      "How many council staff are paid £100,000 or more — council by council",
    longformCopy: [
      "By law, every council has to publish how many of its staff earn £50,000 or more, in £5,000 bands. This card adds up all the bands that start at £100,000 or higher to give a count of senior staff for each council.",
      "Only councils that publish a full salary list are included. Size matters a lot — a big unitary with tens of thousands of staff will have more £100k roles than a small district.",
    ],
    faq: [
      {
        question: 'Does everyone in this group earn £100,000 or more?',
        answer:
          "Yes. The count includes any member of staff whose published salary band starts at £100,000 or higher. It does not include pension contributions or benefits.",
      },
      {
        question: 'Why do some councils not appear?',
        answer:
          "Not every council has published a salary list we can read yet. The page shows how many are included. Some councils that do publish a list have no staff in the £100,000-and-above bands.",
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
      "The English councils with the biggest budget gaps — the shortfall between what they plan to spend and the funding they have in place.",
    shareText:
      'The English councils with the biggest budget gaps this year',
    longformCopy: [
      "A budget gap is the difference between what a council plans to spend and the funding it has lined up. Councils close the gap by saving money, cutting services or using reserves. If they cannot, they issue a Section 114 notice — which works in practice like declaring bankruptcy.",
      "This card ranks councils by the size of their budget gap in pounds. Some councils publish their gap for one year. Others publish the total gap they expect over the next 3 to 5 years (their Medium Term Financial Strategy). Both are shown here. A bigger number means more financial work to do — not that the council is about to fail.",
    ],
    faq: [
      {
        question: 'What is a Section 114 notice?',
        answer:
          "Under Section 114 of the Local Government Finance Act 1988, a council's finance officer must issue a notice when the council cannot balance its budget. New spending is frozen until a recovery plan is agreed.",
      },
      {
        question: 'Does a big budget gap mean a council is about to go bust?',
        answer:
          "No. Most councils close their gap each year by saving money, cutting services or using reserves. A big gap is a sign of pressure, not a sign that the council is about to fail.",
      },
      {
        question: 'Where does the budget gap figure come from?',
        answer:
          "Each council publishes its budget and Medium Term Financial Strategy. We take the budget gap straight from those documents.",
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
    subtitle: 'Councils that hit the 4.99% cap in both 2024 and 2025',
    metaDescription:
      'The English councils that pushed Band D to — or past — the 4.99% cap in two years in a row. A pattern of ongoing financial pressure, not a one-off rise.',
    shareText:
      'The councils that hit the 4.99% council tax cap two years running',
    longformCopy: [
      "Most councils are limited to a Band D rise of 4.99% (a 2.99% basic rise plus a 2% extra charge for adult social care). To go higher, they normally have to hold a local vote. A few councils in serious financial difficulty get special permission from government to go above this limit.",
      "This card shows the councils that raised Band D by 4.99% or more in both 2024-25 AND 2025-26. One big rise can follow a one-off change. Two in a row is a longer-term sign of financial pressure — a pattern you only see by comparing all 317 councils year by year.",
    ],
    faq: [
      {
        question: 'Why does hitting the cap two years running matter?',
        answer:
          "Most years, most councils raise Band D by well under the cap. Hitting the highest allowed rise in two years in a row shows the council has little room to manoeuvre — and that each year's rise is sitting on top of an already higher bill.",
      },
      {
        question: 'How is this different from the "Above the cap" card?',
        answer:
          "The other card lists councils that went above 4.99% this year. This one narrows that list to councils that pushed to — or past — the cap in BOTH 2024-25 and 2025-26. That is a longer-term sign of pressure, not a one-year response.",
      },
      {
        question: 'Where does this data come from?',
        answer:
          "Band D council tax rates for 2023-24, 2024-25 and 2025-26 are published on GOV.UK. We work out each year's rise and pick out the councils that cleared 4.99% in both 2024-25 and 2025-26.",
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
      "The English councils that pushed council tax to — or above — the 4.99% cap in 2025-26, and the ones that needed government permission to go higher.",
    shareText:
      'The councils that raised Band D to — or above — the 4.99% cap this year',
    longformCopy: [
      "Most councils are limited to a Band D rise of 4.99% (a 2.99% basic rise plus a 2% extra charge for adult social care). To go higher, they normally have to hold a local vote. A few councils in financial difficulty get special permission from government to go above this limit.",
      "This card counts every council at or above the cap, shows the national average rise for context, and lists the councils that went above it. Going above the cap is one of the clearer signs of financial pressure.",
    ],
    faq: [
      {
        question: 'What is the council tax cap?',
        answer:
          "Each year, government sets a cap on how much councils can raise Band D without holding a local vote. For 2025-26 the basic cap is 2.99%, plus a 2% extra charge for adult social care — 4.99% in total for councils that run social care.",
      },
      {
        question: 'Why can some councils go above the cap?',
        answer:
          "Councils in serious financial difficulty can apply to the Ministry of Housing, Communities and Local Government for an 'exceptional financial support' package. One condition of that support is often a council tax rise above the normal cap.",
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
