/**
 * Councils whose `top_suppliers` entries were rebuilt from that council's
 * own published payments-over-£500 CSV — i.e. actual payment totals, not
 * Contracts Finder contract ceilings.
 *
 * Same pattern as grants-allowlist.ts. The UI uses this to decide whether
 * the supplier section renders the "Data validation in progress" notice
 * (Contracts Finder data) or the quieter "Sourced from …" affirmation
 * (real payment-ledger data).
 *
 * Keys must match `Council.name` exactly.
 */
export interface VerifiedSupplierSource {
  council: string;
  sourceTitle: string;
  sourceUrl: string;
  period: string;
}

export const VERIFIED_SUPPLIER_COUNCILS: Record<string, VerifiedSupplierSource> = {
  Bradford: {
    council: 'Bradford',
    sourceTitle: "Bradford Council payments-over-£500 (4 quarterly CSVs, 2024-25)",
    sourceUrl: 'https://datahub.bradford.gov.uk/datasets/finance/bradford-council-expenditure-greater-than-500/',
    period: '2024-25',
  },
  Camden: {
    council: 'Camden',
    sourceTitle: "Camden Council Spend Over £500 (Socrata dataset 3ixw-qvb8, 2024-25)",
    sourceUrl: 'https://opendata.camden.gov.uk/Finance/Camden-Council-Spend-Over-500-GBP/3ixw-qvb8',
    period: '2024-25',
  },
};

export function isVerifiedSupplierCouncil(councilName: string): boolean {
  return Object.prototype.hasOwnProperty.call(VERIFIED_SUPPLIER_COUNCILS, councilName);
}

export function getVerifiedSupplierSource(councilName: string): VerifiedSupplierSource | undefined {
  return VERIFIED_SUPPLIER_COUNCILS[councilName];
}
