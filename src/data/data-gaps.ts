/**
 * Honest, per-field explanations for why a given council may not publish
 * data in a format we can display. Shown inside dashboard cards next to the
 * affected section.
 *
 * Each entry provides:
 *   - `label`: short section name the reader sees
 *   - `reason`: 1–2 sentence plain-English explanation of the typical gap
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
    | "website";
  severity: GapSeverity;
}

/**
 * Field identifier → explanation. Kept one place so we can reuse wording
 * across cards and keep the voice consistent ("honest, non-blaming").
 */
export const GAP_EXPLANATIONS: Record<string, GapExplanation> = {
  "top_suppliers.absent": {
    label: "Who the council pays",
    reason:
      "This council does not publish a named top-suppliers list on its transparency pages. Payments over £500 may still be downloadable as a spreadsheet.",
    nextStepLabel: "Check the council's transparency page",
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

  "grant_payments.absent": {
    label: "Grants to local organisations",
    reason:
      "This council does not publish a machine-readable grants register on a public page. Grant records may exist inside monthly spending files or committee reports.",
    nextStepLabel: "Check the council's transparency page",
    nextStepKey: "transparency_url",
    severity: "info",
  },
  "grant_payments.thin": {
    label: "Grants to local organisations",
    reason:
      "We have captured a sample of this council's recent community-grant awards, but the full annual register may not be published in one place.",
    nextStepLabel: "Open the council's grants page",
    nextStepKey: "transparency_url",
    severity: "info",
  },

  "councillor_allowances_detail.absent": {
    label: "Per-councillor allowances",
    reason:
      "This council publishes a total allowances cost but not a per-councillor breakdown on its public website. Some councils only release the individual list on request.",
    nextStepLabel: "Check the councillors page",
    nextStepKey: "councillors_url",
    severity: "info",
  },
  "councillor_allowances_detail.thin": {
    label: "Per-councillor allowances",
    reason:
      "We have allowances for the top-paid councillors; the full annual schedule may be published as a PDF we cannot currently parse automatically.",
    nextStepLabel: "Open the councillors page",
    nextStepKey: "councillors_url",
    severity: "info",
  },

  "salary_bands.absent": {
    label: "Staff pay bands",
    reason:
      "This council does not publish a £50k+ remuneration band table in its annual Pay Policy Statement.",
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

  "performance_kpis.absent": {
    label: "Performance scorecard",
    reason:
      "This council does not publish a quarterly or annual performance scorecard with numbered targets on its public website.",
    nextStepLabel: "Visit the council's website",
    nextStepKey: "website",
    severity: "info",
  },
  "performance_kpis.thin": {
    label: "Performance scorecard",
    reason:
      "We have a handful of published KPIs; the council may report more indicators inside committee papers that are not compiled on one page.",
    severity: "info",
  },

  "cabinet.thin": {
    label: "Cabinet members",
    reason:
      "We have the main cabinet roles but there may be additional deputy or assistant cabinet members not yet captured.",
    nextStepLabel: "See all councillors",
    nextStepKey: "councillors_url",
    severity: "info",
  },

  "documents.thin": {
    label: "Key documents",
    reason:
      "We link to a subset of this council's published budget, accounts and strategy documents — older years may be on an archive page.",
    nextStepLabel: "Open the finance page",
    nextStepKey: "accounts_url",
    severity: "info",
  },

  "open_data_links.thin": {
    label: "Open data links",
    reason:
      "Not every council organises its published data into the same themes. Some topics (education, social care) may only exist on the relevant county council's pages.",
    severity: "info",
  },

  "service_spending.district_structural": {
    label: "Service spending breakdown",
    reason:
      "District councils do not deliver education, adult social care, children's services, public health or transport — those services are run by the county council. This is why fewer spending categories appear here than for a unitary authority.",
    severity: "info",
  },
};
