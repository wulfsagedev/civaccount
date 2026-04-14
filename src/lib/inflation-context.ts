/**
 * Inflation and wage context — single source of truth for the economic
 * yardsticks displayed alongside council tax changes on the dashboard.
 *
 * These two figures cover the period from the start of the previous council
 * tax year to the start of the current one (April → March, 12 months).
 *
 * Updating: when the council tax year ticks over in April, update:
 *   - PERIOD: the new council tax year this context applies to
 *   - CPI_RATE: ONS CPI 12-month rate for the March reading in the
 *     outgoing year (i.e. the rate at the end of the prior council tax year)
 *   - WAGE_GROWTH_RATE: ONS Average Weekly Earnings (regular pay, 3-month
 *     year-on-year) at the same March reading
 *
 * We show both figures, unchanged, so the reader can pick the yardstick
 * that's relevant to them (prices for retirees on fixed income; wages
 * for workers). We deliberately do not subtract one from the other or
 * interpret "real terms" for the reader — that's their call.
 */

export const INFLATION_CONTEXT = {
  /** Council tax year this context applies to (bill rose during the prior year). */
  period: '2024-25 → 2025-26',

  /**
   * ONS CPI 12-month inflation rate at March 2025.
   * Source: https://www.ons.gov.uk/economy/inflationandpriceindices/bulletins/consumerpriceinflation/latest
   */
  cpi_rate: 2.8,
  cpi_source_url: 'https://www.ons.gov.uk/economy/inflationandpriceindices/bulletins/consumerpriceinflation/latest',

  /**
   * ONS Average Weekly Earnings — total pay (including bonuses), 3-month
   * average year-on-year growth at March 2025.
   * Source: https://www.ons.gov.uk/employmentandlabourmarket/peopleinwork/earningsandworkinghours/bulletins/averageweeklyearningsingreatbritain/latest
   */
  wage_growth_rate: 5.1,
  wage_source_url: 'https://www.ons.gov.uk/employmentandlabourmarket/peopleinwork/earningsandworkinghours/bulletins/averageweeklyearningsingreatbritain/latest',
} as const;
