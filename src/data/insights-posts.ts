/**
 * Editorial posts under /insights/posts/<slug>.
 *
 * Distinct from the leaderboard "insight cards" in `insights.ts` — those
 * power data-driven pages (`/insights/ceo-pay-league` etc). This file
 * powers narrative posts that build topical authority + content velocity.
 *
 * Cadence: ~1 per month (per OPERATOR-CADENCE.md). Each entry produces
 * a static page + sitemap entry + Article JSON-LD schema, and ages well
 * because the content is anchored to a specific date and dataset state.
 */

export interface InsightPost {
  /** URL slug — route is /insights/posts/<slug>. */
  slug: string;
  /** ISO date YYYY-MM-DD — used as Article.datePublished. */
  date: string;
  /** Page <h1> + Open Graph title. */
  title: string;
  /** ≤160 char meta description. */
  description: string;
  /** Headline for the lede block (above the article body). */
  hook: string;
  /** Author display name — currently always CivAccount. */
  author: string;
  /** Reading time in minutes (approx). */
  readMinutes: number;
  /**
   * Body sections. Each section is a heading + array of paragraphs.
   * Plain Markdown is intentionally avoided so we control rendering
   * (preserves design-system typography, no MDX runtime).
   */
  sections: Array<{
    heading?: string;
    paragraphs: string[];
  }>;
  /** Related links shown at the bottom — sends users back into the dataset. */
  related?: Array<{ label: string; href: string }>;
  /** Source citations rendered at the bottom of the post. */
  sources?: Array<{ label: string; href: string }>;
}

export const insightPosts: InsightPost[] = [
  {
    slug: 'adur-first-district-north-star',
    date: '2026-05-02',
    title:
      'Adur is the first district council with Datasheet-for-Datasets-grade transparency',
    description:
      "How Adur District Council became the fourth fully-compliant reference council under CivAccount's North-Star v1.3 methodology — and what we found in the process.",
    hook:
      "Every figure on Adur's page now traces back to a specific page of a specific PDF Adur Council itself published. Here's what that took.",
    author: 'CivAccount',
    readMinutes: 6,
    sections: [
      {
        paragraphs: [
          "Adur District Council, on the West Sussex coast, is the smallest authority you've probably never thought about. Population 64,889. Twenty-nine councillors. A net service budget of £26m. It shares its chief executive with Worthing Borough Council next door.",
          "On 1 May 2026, Adur became the fourth English council — and the first district — to pass CivAccount's full North-Star audit. Every rendered figure on its page now traces back, via sha256 hash, to a specific page of a specific PDF that Adur itself published. No estimates. No peer averages. No CivAccount subtractions.",
          "Three things came out of the process that are worth sharing publicly.",
        ],
      },
      {
        heading: '1. The chief executive changed and we hadn\'t noticed',
        paragraphs: [
          "Until this week, our Adur record listed Dr Catherine Howe as chief executive. The 2024-25 Statement of Accounts (page 93, verbatim) confirms she held the role through both 2023/24 and 2024/25.",
          "But the live Adur & Worthing senior-management page (last updated 13 January 2026) names Paul Brewer as the current chief executive. The transition happened during 2025/26.",
          "We can't carry forward Dr Howe's £166,626 salary against Paul Brewer's name — that would be a misattribution. So `chief_executive_salary` is now stripped from Adur until the 2025-26 SoA publishes Brewer's actual remuneration. The page shows the current postholder; the salary returns when the source document does.",
          "This isn't a one-off. We've now added a Phase 3.6 step to every council rollout: re-verify the chief executive and council leader against the live council site, and strip mismatches rather than carry forward stale attribution.",
        ],
      },
      {
        heading: '2. Adur changed political control on 23 May 2024',
        paragraphs: [
          "Adur was Conservative-controlled for 24 years under Cllr Neil Parkin. On 23 May 2024, Labour gained control. Cllr Jeremy Gardner became Leader, with a new six-member Cabinet:",
          "Cllr Lee Cowen (Deputy Leader, Housing & Citizen Services), Cllr Becky Allinson (Regeneration & Strategic Planning), Cllr Andrew Harvey (Environment & Leisure), Cllr Saffa Jan (Finance & Resources), Cllr Sharon Sluman (Communities & Wellbeing).",
          "The portfolios are quoted verbatim from democracy.adur-worthing.gov.uk (Adur Cabinet Committee 138). The site is Cloudflare-blocked to direct fetch, so we read it via the Internet Archive's Wayback Machine — every entry on the council page records its `archive_exempt: cloudflare_blocked` flag for audit traceability.",
          "Corroborating evidence: the Members' Allowances Payments schedule for 2024/25 shows Cllr Gardner with the largest Special Responsibility Allowance on the table (£21,959.17) — consistent with a Leader-rate part-year payment after 23 May.",
        ],
      },
      {
        heading: '3. We had to remove a bit of UI on every district page',
        paragraphs: [
          "The live UX audit (`ux-audit.mjs`) flagged three unwrapped numeric values on Adur's page: `365`, `£2,068`, and `£1,677`. All three came from a friendly explainer card we'd added to district pages: \"About £365 of your bill goes to Adur; the remaining £2,068 goes to West Sussex County Council, police and fire.\"",
          "The £2,068 figure is `totalBill − thisCouncilBandD` — a calculation CivAccount performs at render time. It doesn't appear verbatim in any single document Adur publishes. Per North-Star principle 3 (\"every rendered value must appear verbatim in a linkable public document\"), it had to go.",
          "We removed the entire callout. Same precedent as the year-on-year change comparison we removed in April 2026. The per-precept breakdown card immediately below it shows the same information — but each row is a real precept value, not a CivAccount subtraction.",
          "This change affects all 164 English district councils.",
        ],
      },
      {
        heading: 'What this means for the other 313 councils',
        paragraphs: [
          "Three councils — Bradford (April 2026), Kent (April 2026), Camden (April 2026) — were already North-Star compliant. Adur makes four. That leaves 313 councils whose data was added under earlier, looser criteria.",
          "Of those, 35 districts (Bassetlaw, Braintree, Brentwood, ..., Ipswich) shipped during a breadth-first batch in late April 2026 with only partial depth: chief executive name and salary, plus the standard strip-list. They are now flagged for v1.3 remediation, in alphabetical order.",
          "The remaining 178 councils have not yet been audited under any iteration of the North-Star methodology. Their data is the dataset CivAccount inherited from earlier scraping runs — accurate at the Tier-1 level (everything from MHCLG, ONS, LGBCE), but with looser per-council provenance.",
          "Our commitment: one council per session, full 14-phase audit, no shortcuts. At the current cadence that's roughly one per week. The full set takes about a year to complete properly. We will not breadth-ship again.",
        ],
      },
      {
        heading: 'Read the full audit',
        paragraphs: [
          "The Adur audit is published as a Datasheet for Datasets (Gebru et al., Communications of the ACM 2021) covering motivation, composition, collection process, preprocessing, uses, distribution, maintenance, and a full per-field source register. It also documents every field we stripped and why.",
          "The Adur PR (#118 on the public repo, #88 on the data repo) lists every check that passed: 0/5 north-star gaps, 0/0 UX-audit violations, 0 mismatched screenshots, 6 verbatim spot-checks. Both PRs are merged.",
        ],
      },
    ],
    related: [
      { label: "Adur's full council page", href: '/council/adur' },
      { label: "Bradford — the first North-Star council", href: '/council/bradford' },
      { label: 'Our methodology', href: '/methodology' },
      { label: 'Insights — national leaderboards', href: '/insights' },
    ],
    sources: [
      {
        label: 'Adur DC Statement of Accounts 2024-25 (Tier-3 PDF, sha256 3bd2386e…)',
        href: 'https://www.adur-worthing.gov.uk/about-the-councils/finance/statement-of-accounts/',
      },
      {
        label: "Adur DC Members' Allowances Scheme 2025-26",
        href: 'https://www.adur-worthing.gov.uk/councillors-and-mps/allowances/',
      },
      {
        label: 'Adur & Worthing Senior Management Structure (live page)',
        href: 'https://www.adur-worthing.gov.uk/about-the-councils/senior-management-structure/',
      },
      {
        label: 'Datasheets for Datasets — Gebru et al., CACM 2021',
        href: 'https://cacm.acm.org/research/datasheets-for-datasets/',
      },
      {
        label: 'NORTH-STAR.md — full methodology spec',
        href: 'https://github.com/wulfsagedev/civaccount/blob/main/NORTH-STAR.md',
      },
    ],
  },
];

export function getInsightPost(slug: string): InsightPost | null {
  return insightPosts.find((p) => p.slug === slug) ?? null;
}

export function getAllInsightPostSlugs(): string[] {
  return insightPosts.map((p) => p.slug);
}
