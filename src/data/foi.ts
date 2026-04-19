/**
 * FOI (Freedom of Information) request archive.
 *
 * Each entry is a request filed on a UK council and the response received.
 * Raw responses (CSVs, PDFs) live under /public/foi/ so they are directly
 * citable URLs. Populate this list as responses come back.
 *
 * Status values:
 *   - filed:     request sent, awaiting response
 *   - responded: response received and published below
 *   - refused:   refused under an exemption (record reason)
 *   - overdue:   past statutory 20 working day window — escalation noted
 */

export type FoiStatus = "filed" | "responded" | "refused" | "overdue";

export interface FoiRequest {
  /** Stable slug used in URLs: /foi/[slug] */
  slug: string;
  /** Council the request was filed on (display name) */
  council: string;
  /** Council slug for linking to /council/[slug] */
  council_slug: string;
  /** Short human title */
  title: string;
  /** The exact text of the request */
  request_text: string;
  /** When filed (ISO date) */
  filed_date: string;
  /** When response received (ISO date) */
  response_date?: string;
  status: FoiStatus;
  /** WhatDoTheyKnow URL (or council's FOI portal) */
  request_url?: string;
  /** Link to the response file on our site or theirs */
  response_url?: string;
  /** Short summary of what the response contained */
  summary?: string;
  /** Category tags for filtering: e.g. "household-support", "senior-pay" */
  tags: string[];
}

/**
 * Current archive. Empty — populate as you file and receive responses.
 *
 * Example entry (keep commented — replace with real ones):
 *
 * {
 *   slug: "amber-valley-hsf-recipients-2024",
 *   council: "Amber Valley",
 *   council_slug: "amber-valley",
 *   title: "Household Support Fund 2024-25 recipient organisations",
 *   request_text: "Please provide a full list of organisations that received..."
 *     + " Household Support Fund allocations from Amber Valley Borough Council"
 *     + " during financial year 2024-25, including amounts and purpose.",
 *   filed_date: "2026-05-02",
 *   response_date: "2026-05-14",
 *   status: "responded",
 *   request_url: "https://www.whatdotheyknow.com/request/...",
 *   response_url: "/foi/amber-valley-hsf-recipients-2024.csv",
 *   summary: "19 organisations listed, £94,000 total. Largest recipient: ...",
 *   tags: ["household-support", "grants"],
 * },
 */
export const FOI_REQUESTS: FoiRequest[] = [];

/**
 * Suggested requests to file next. Kept here so the user can glance at the
 * backlog and not repeat work. Move entries out of this list into
 * FOI_REQUESTS once filed.
 */
export const FOI_BACKLOG: Array<{
  title: string;
  rationale: string;
  target: string;
}> = [
  {
    title: "Household Support Fund 2024-25 and 2025-26 recipient list",
    rationale:
      "Councils receive ~£500m/yr from MHCLG for HSF but most do not publish recipient-level breakdowns. The 8 councils blocked on grant_payments all benefit from this.",
    target: "All 317 councils (batch by council type)",
  },
  {
    title: "Senior officer pension employer contributions 2024-25",
    rationale:
      "Pay Policy Statements publish base salary but rarely the employer pension contribution. Real total remuneration is typically 20-30% higher than published figures.",
    target: "All 317 councils",
  },
  {
    title: "SEND home-to-school transport cost per child, by provider",
    rationale:
      "County councils report SEND transport as a single spend line. Request provider-level breakdown and per-child costs — a major service budget pressure.",
    target: "21 county councils + 63 unitaries providing education",
  },
  {
    title: "Councillor taxi, train and mileage claims 2024-25",
    rationale:
      "Allowances schemes publish totals but not claim-level detail. FOI can extract individual journeys — a strong journalism hook.",
    target: "High-allowance councils (top 50 by total_allowances_cost)",
  },
  {
    title: "Agency-staff and interim-officer spend 2024-25",
    rationale:
      "Many councils rely on agency staff during recruitment gaps. These do not appear in salary_bands. Total agency spend is a hidden cost pressure.",
    target: "All 317 councils",
  },
  {
    title: "Full supplier list for councils where top_suppliers < 10",
    rationale:
      "116 councils have fewer than 20 suppliers published. FOI requests for the 'payments over £500' register for a full year would fill this gap directly.",
    target: "Top 50 thinnest: see /developers for the list",
  },
];
