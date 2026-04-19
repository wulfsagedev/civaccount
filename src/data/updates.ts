/**
 * CivAccount release history — single source of truth.
 *
 * Consumed by:
 *   - /updates page (UI changelog)
 *   - /updates/rss.xml (feed for journalists + AI engines; fresh-content signal)
 *   - (future) indexnow-ping.mjs to prioritise pinging the latest release URL
 *
 * Date format: YYYY-MM-DD (ISO). The `date` field drives the RSS <pubDate>;
 * label is the human-friendly display.
 */

export type CivAccountUpdate = {
  version: string;
  date: string;        // ISO date YYYY-MM-DD
  label: string;       // human display: "April 2026"
  isCurrent: boolean;
  title: string;       // one-line summary for RSS item title
  summary: string;     // short paragraph for RSS description / social preview
  changes: string[];
};

export const updates: CivAccountUpdate[] = [
  {
    version: '3.0',
    date: '2026-04-06',
    label: 'April 2026',
    isCurrent: true,
    title: 'V3.0 — Town Hall launches across all 317 English councils',
    summary:
      'Residents can now propose how their council should spend money, vote on ideas, and join the discussion. Full leadership, salary, and spending data for every English council.',
    changes: [
      'Town Hall — have your say on how your council spends money',
      'Vote and comment on ideas from other residents',
      'Milestone progress bars on proposals (25 and 100 vote thresholds)',
      'Redesigned Town Hall homepage with product preview and postcode search',
      'Budget context shown on every proposal detail page',
      'Cabinet members and leadership for all 317 English councils',
      'Chief executive salary data for 99% of councils',
      'Councillor basic allowance data for 96% of councils',
      'Top suppliers and grant payments for 95% of councils',
      'Compare any two councils side by side with cross-links to budgets and Town Hall',
      'Embeddable Town Hall widgets you can share anywhere',
      'Performance data covering roads, waste, housing, and more',
      'Full design system audit — all typography, colours, and accessibility standards enforced',
      'Dashboard split into 10 focused components for faster page loads',
      'All interactive elements meet 44px minimum tap target for mobile',
    ],
  },
  {
    version: '2.0',
    date: '2026-03-05',
    label: 'March 2026',
    isCurrent: false,
    title: 'V2.0 — London borough coverage and leadership data',
    summary:
      'Full cabinet, Ofsted ratings, community grants, staff salary bands, and allowances for every London borough.',
    changes: [
      'See who leads your London borough — every cabinet member and their role',
      "Latest Ofsted ratings for children's services across all 33 London boroughs",
      'See which local charities and community groups your council funds',
      'Staff salary bands for every London borough',
      'What your elected councillors are paid in allowances',
      'Direct links to council budget documents, meetings, and open data',
    ],
  },
  {
    version: '1.8',
    date: '2026-02-07',
    label: 'February 2026',
    isCurrent: false,
    title: 'V1.8 — Kent becomes the gold-standard council entry',
    summary:
      'Detailed descriptions for every KCC supplier and grant recipient; data split into per-file modules for faster loads.',
    changes: [
      'Kent County Council now has the richest data on the site',
      'Detailed descriptions for all 15 KCC grant recipients',
      'Detailed descriptions for all 20 KCC top suppliers',
      'Tap any supplier or grant to see exactly what the money pays for',
      'Council data split into separate files for faster loading',
      'Bigger, clearer text for supplier and grant names',
      'All descriptions sourced from official records and charity registers',
    ],
  },
  {
    version: '1.6',
    date: '2026-01-25',
    label: 'January 2026',
    isCurrent: false,
    title: 'V1.6 — New landing page and 20 county councils',
    summary:
      'Animated landing, lightning-fast search, 20 county councils with detailed budget breakdowns, every data point linked to its GOV.UK source.',
    changes: [
      'New animated landing page with floating £ blocks',
      'Lightning-fast search to find your council instantly',
      '20 county councils now have detailed budget breakdowns',
      'All data linked to official government sources',
      'Contribute button to support CivAccount development',
      'Better mobile navigation',
      'Press F to search from any page',
    ],
  },
  {
    version: '1.4',
    date: '2026-01-15',
    label: 'January 2026',
    isCurrent: false,
    title: 'V1.4 — Sticky navigation and fairer insights',
    summary:
      'Scroll-following sticky nav, cleaner dashboard, better dark mode, accessibility improvements; insights now group councils for fair comparisons.',
    changes: [
      'Sticky navigation bar follows you as you scroll',
      'Quick access to all pages from the floating menu',
      'Cleaner, easier to read dashboard',
      'Better dark mode for easier reading',
      'Works better with screen readers and keyboards',
      'Insights page groups similar councils for fairer comparisons',
    ],
  },
  {
    version: '1.2',
    date: '2026-01-04',
    label: 'January 2026',
    isCurrent: false,
    title: 'V1.2 — Full English coverage (317 councils)',
    summary:
      'All 317 English councils live with council tax by band, spending breakdown, comparisons, and national insights.',
    changes: [
      'Now covers all 317 councils in England',
      'Search to find your council quickly',
      'See council tax for all bands (A to H)',
      'See where your council tax goes (district, county, police, fire)',
      'Links to official council websites',
      'Compare your council to similar councils',
      'National insights with averages across England',
    ],
  },
  {
    version: '1.0',
    date: '2025-12-15',
    label: 'December 2025',
    isCurrent: false,
    title: 'V1.0 — First release with Kent County Council',
    summary:
      'The very first release: Kent budget breakdown, council tax, dark mode, mobile-first.',
    changes: [
      'First release with Kent County Council',
      'Council tax and budget breakdown',
      'Dark mode',
      'Works on phones and tablets',
    ],
  },
];

export function getLatestUpdate(): CivAccountUpdate {
  return updates[0];
}
