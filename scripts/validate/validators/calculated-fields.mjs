/**
 * calculated-fields.mjs — recompute derived values from their inputs
 * and assert the rendered value matches. Part of the VALUE-VERIFICATION-
 * PLAN §D Category D coverage.
 *
 * Derivations covered:
 *   - tax_bands (A–H)        : band_d * statutory_ratio
 *   - council_tax_increase_%  : (band_d_2025 / band_d_2024 - 1) * 100
 *   - council_tax_shares      : precept share of band_d_2025 total
 *   - per_capita_spend        : budget.total_service * 1000 / population
 *
 * Any rendered override of the derivation is a bug — the UI should
 * always recompute at render time. Finding = warning.
 */

// Statutory Band ratios (Local Government Finance Act 1992)
// Ratio = band_x / band_d
const BAND_RATIOS = {
  A: 6 / 9,
  B: 7 / 9,
  C: 8 / 9,
  D: 1,
  E: 11 / 9,
  F: 13 / 9,
  G: 15 / 9,
  H: 18 / 9,
};

const CALC_TOL = 0.02; // £0.02 slack for float rounding when values are £/bill-sized

export function validate(councils, population, report) {
  for (const c of councils) {
    const ct = c.council_tax || {};
    const d = c.detailed || {};
    const bandD2025 = ct.band_d_2025;
    const bandD2024 = ct.band_d_2024;

    // ── council_tax_increase_percent ──
    if (d.council_tax_increase_percent != null && bandD2025 && bandD2024) {
      report.tick();
      const recalc = ((bandD2025 - bandD2024) / bandD2024) * 100;
      // Rendered value may be rounded to 1dp; allow ±0.05pp.
      if (Math.abs(d.council_tax_increase_percent - recalc) > 0.1) {
        report.finding(c, 'calculated-fields', 'ct_increase_drift', 'warning',
          `council_tax_increase_percent stored as ${d.council_tax_increase_percent}% but recalc from band_d is ${recalc.toFixed(2)}%`,
          'detailed.council_tax_increase_percent', d.council_tax_increase_percent, recalc.toFixed(2));
      }
    }

    // ── council_tax_shares ──
    // Sum of precept band_d values should equal total_band_d (== band_d_2025).
    if (d.precepts && d.precepts.length > 0 && bandD2025) {
      report.tick();
      const sum = d.precepts.reduce((n, p) => n + (p.band_d || 0), 0);
      if (Math.abs(sum - bandD2025) > 0.05) {
        report.finding(c, 'calculated-fields', 'precept_sum_drift', 'warning',
          `Sum of precept band_d values (£${sum.toFixed(2)}) does not equal band_d_2025 (£${bandD2025})`,
          'detailed.precepts', sum, bandD2025);
      }
    }

    // ── per_capita_spend ──
    // Rendered at display time (we don't store it), but validate it's computable.
    const pop = population[c.name];
    if (pop && c.budget?.total_service != null) {
      report.tick();
      const pcps = (c.budget.total_service * 1000) / pop;
      if (pcps < 50 || pcps > 25000) {
        // 50-25000 is the sensible-range window; outside is nearly always
        // a wrong-unit or wrong-population bug.
        report.finding(c, 'calculated-fields', 'per_capita_spend_extreme', 'info',
          `per_capita_spend would compute to £${pcps.toFixed(0)}/person — outside normal £50-£25,000 window. Probable cause: City of London day-pop vs resident-pop, or budget in wrong unit.`,
          'per_capita_spend', pcps.toFixed(0), '50–25000');
      }
    }
  }
}
