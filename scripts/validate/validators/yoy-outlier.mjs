/**
 * yoy-outlier.mjs — validator scaffold.
 *
 * Flags values that changed > 30% year-on-year against historical
 * series. Most council values don't move that much year-on-year;
 * outliers are either genuine (e.g. reorganisation, one-off grant,
 * demographic shock) or data errors.
 *
 * Applies to time-series fields:
 *   - council_tax.band_d_{2021..2026}
 *   - budget.* (when we have multi-year)
 *   - detailed.reserves (annual)
 *   - detailed.capital_programme (annual)
 *   - service_outcomes.waste.recycling_rate_percent (annual)
 *
 * Spec: NORTH-STAR.md §8 (Statistical sanity), §16 (validator stack)
 *
 * Status: SCAFFOLD — lands in roadmap Phase E
 */

const YOY_THRESHOLD = 0.30; // 30% change flagged

// TODO: Phase E implementation
// 1. For each council with multi-year history:
//    a. Compute YoY % change for each consecutive pair
//    b. If |change| > YOY_THRESHOLD → warning with details
// 2. For confirmed-real outliers (e.g. Sheffield's £60m one-off
//    post-SEND-judgement): allow suppression via an allowlist file:
//    `scripts/validate/yoy-outlier-allowlist.json`
//    with a justification per entry

export function validate(councils, _population, report) {
  // No-op until Phase E
  report.tick();
  void councils; void YOY_THRESHOLD;
}
