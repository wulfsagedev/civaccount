/**
 * Honest, per-field explanations for why a given council may not publish
 * data in a format we can display. Shown inside dashboard cards next to the
 * affected section — or wrapping a whole card when an entire block is absent.
 *
 * Each entry provides:
 *   - `label`: short section name the reader sees
 *   - `reason`: 1–2 sentence plain-English explanation of the typical gap.
 *     Use `{Council}` as a placeholder — the component substitutes the
 *     council name at render time.
 *   - `nextStepLabel` / `nextStepKey`: CTA that points to the council's own
 *     transparency page (the right place to dig further)
 *   - `severity`: visual weight — `info` (neutral tan notice) vs
 *     `warning` (slightly stronger). We keep it neutral for almost all.
 */

export type GapSeverity = "info" | "warning";

export interface GapExplanation {
  label: string;
  reason: string;
  nextStepLabel?: string;
  /** Key of a URL on detailed.* that points the user to the council's page. */
  nextStepKey?:
    | "transparency_url"
    | "accounts_url"
    | "councillors_url"
    | "budget_url"
    | "council_tax_url"
    | "website";
  severity: GapSeverity;
}

/**
 * Field identifier → explanation. Kept one place so we can reuse wording
 * across cards and keep the voice consistent ("honest, non-blaming").
 */
export const GAP_EXPLANATIONS: Record<string, GapExplanation> = {
  // -----------------------------------------------------------------------
  // Suppliers
  // -----------------------------------------------------------------------
  "top_suppliers.absent": {
    label: "Who the council pays",
    reason:
      "{Council} hasn't published a named top-suppliers list for this year yet. Payments over £500 may still be downloadable as a monthly spreadsheet — new data usually lands quarterly.",
    nextStepLabel: "Check the transparency page",
    nextStepKey: "transparency_url",
    severity: "info",
  },
  "top_suppliers.thin": {
    label: "Who the council pays",
    reason:
      "We only have a partial supplier list for this council — the full payments record is usually in their monthly \"payments over £500\" CSV.",
    nextStepLabel: "Open the council's spending page",
    nextStepKey: "transparency_url",
    severity: "info",
  },

  // -----------------------------------------------------------------------
  // Grants
  // -----------------------------------------------------------------------
  "grant_payments.absent": {
    label: "Grants to local organisations",
    reason:
      "{Council} hasn't published a machine-readable grants register on a public page. Records may be inside monthly spending files or committee reports — and new 2026 data usually lands from May onwards.",
    nextStepLabel: "Check the transparency page",
    nextStepKey: "transparency_url",
    severity: "info",
  },
  "grant_payments.thin": {
    label: "Grants to local organisations",
    reason:
      "We show the biggest awards; the full annual register may be published as a PDF or across multiple committee reports.",
    nextStepLabel: "Open the council's grants page",
    nextStepKey: "transparency_url",
    severity: "info",
  },

  // -----------------------------------------------------------------------
  // Councillor allowances
  // -----------------------------------------------------------------------
  "councillor_allowances_detail.absent": {
    label: "Per-councillor allowances",
    reason:
      "{Council} publishes a total allowances cost but not a per-councillor breakdown on its public website. Some councils only release the individual list on request.",
    nextStepLabel: "Check the councillors page",
    nextStepKey: "councillors_url",
    severity: "info",
  },
  "councillor_allowances_detail.thin": {
    label: "Per-councillor allowances",
    reason:
      "We show allowances for the top-paid councillors; the full annual schedule may be published as a PDF we can't currently parse automatically.",
    nextStepLabel: "Open the councillors page",
    nextStepKey: "councillors_url",
    severity: "info",
  },

  // -----------------------------------------------------------------------
  // Salary bands
  // -----------------------------------------------------------------------
  "salary_bands.absent": {
    label: "Staff pay bands",
    reason:
      "{Council} does not publish a £50k+ remuneration band table in its annual Pay Policy Statement.",
    nextStepLabel: "Check the accounts page",
    nextStepKey: "accounts_url",
    severity: "info",
  },
  "salary_bands.thin": {
    label: "Staff pay bands",
    reason:
      "Only a few bands are published — small councils often have very few staff earning £50k+ so a shorter table is expected.",
    severity: "info",
  },

  // -----------------------------------------------------------------------
  // Performance KPIs
  // -----------------------------------------------------------------------
  "performance_kpis.absent": {
    label: "Performance scorecard",
    reason:
      "{Council} does not publish a quarterly or annual performance scorecard with numbered targets on its public website.",
    nextStepLabel: "Visit the council's website",
    nextStepKey: "website",
    severity: "info",
  },
  "performance_kpis.thin": {
    label: "Performance scorecard",
    reason:
      "We show a handful of published KPIs; the council may report more indicators inside committee papers that aren't compiled on one page.",
    severity: "info",
  },

  // -----------------------------------------------------------------------
  // Cabinet
  // -----------------------------------------------------------------------
  "cabinet.thin": {
    label: "Cabinet members",
    reason:
      "We show the main cabinet roles but there may be additional deputy or assistant cabinet members not yet captured.",
    nextStepLabel: "See all councillors",
    nextStepKey: "councillors_url",
    severity: "info",
  },

  // -----------------------------------------------------------------------
  // Documents / Open data
  // -----------------------------------------------------------------------
  "documents.thin": {
    label: "Key documents",
    reason:
      "We link to a subset of this council's published budget, accounts and strategy documents — older years may be on an archive page.",
    nextStepLabel: "Open the finance page",
    nextStepKey: "accounts_url",
    severity: "info",
  },
  "documents.absent": {
    label: "Key documents",
    reason:
      "No Statement of Accounts, budget or strategy documents linked for {Council} yet — national sources are shown below.",
    severity: "info",
  },
  "open_data_links.thin": {
    label: "Open data links",
    reason:
      "Not every council organises its published data into the same themes. Some topics (education, social care) may only exist on the relevant county council's pages.",
    severity: "info",
  },
  "open_data_links.absent": {
    label: "Open data links",
    reason:
      "{Council} doesn't publish a themed open-data index. National sources are shown below.",
    severity: "info",
  },

  // -----------------------------------------------------------------------
  // Service spending (district structural exemption)
  // -----------------------------------------------------------------------
  "service_spending.district_structural": {
    label: "Service spending breakdown",
    reason:
      "District councils do not deliver education, adult social care, children's services, public health or transport — those services are run by the county council. This is why fewer spending categories appear here than for a unitary authority.",
    severity: "info",
  },

  // -----------------------------------------------------------------------
  // Whole-section absences (used when an entire card would otherwise hide)
  // -----------------------------------------------------------------------
  "bill_history.absent": {
    label: "Bill history",
    reason:
      "We don't have 5 years of Band D history for {Council} on file — usually because boundary changes, a unitary reorganisation or a new council reset the series.",
    nextStepLabel: "Check the council tax page",
    nextStepKey: "council_tax_url",
    severity: "info",
  },

  "leadership.absent": {
    label: "Council leadership",
    reason:
      "{Council} hasn't published a cabinet or chief executive listing in a format we can parse. Leadership information is usually on the \"Your councillors\" page.",
    nextStepLabel: "See the councillors page",
    nextStepKey: "councillors_url",
    severity: "info",
  },

  "pay.absent": {
    label: "Staff pay & councillor allowances",
    reason:
      "{Council} hasn't published senior-officer salary bands or a per-councillor allowance list yet. These usually appear with the annual Statement of Accounts (autumn).",
    nextStepLabel: "Check the accounts page",
    nextStepKey: "accounts_url",
    severity: "info",
  },

  "service_outcomes.absent": {
    label: "Performance & outcomes",
    reason:
      "{Council} hasn't published a recycling rate, housing delivery number or performance scorecard in an open format yet.",
    nextStepLabel: "Visit the council's website",
    nextStepKey: "website",
    severity: "info",
  },

  "precepts.absent": {
    label: "Council tax breakdown",
    reason:
      "Full breakdown of who gets your council tax isn't published yet for {Council}.",
    nextStepLabel: "Check the council tax page",
    nextStepKey: "council_tax_url",
    severity: "info",
  },

  "suppliers_grants.absent": {
    label: "Suppliers and grants",
    reason:
      "{Council} hasn't published supplier or grant data in a format we can display yet. These usually appear in quarterly transparency updates.",
    nextStepLabel: "Check the transparency page",
    nextStepKey: "transparency_url",
    severity: "info",
  },

  "finances.absent": {
    label: "Council finances",
    reason:
      "{Council} hasn't published key financial figures (reserves, savings target, budget gap) in a format we can display yet.",
    nextStepLabel: "Check the accounts page",
    nextStepKey: "accounts_url",
    severity: "info",
  },
};
