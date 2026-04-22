/**
 * benford.mjs — validator scaffold.
 *
 * Per-council first-digit distribution test following Nigrini's
 * methodology (Journal of Accountancy, 2022; Benford's Law 2012).
 *
 * Expected distribution (Benford's Law):
 *   P(first digit = d) = log10(1 + 1/d)
 *
 *   1: 30.1%    4:  9.7%    7: 5.8%
 *   2: 17.6%    5:  7.9%    8: 5.1%
 *   3: 12.5%    6:  6.7%    9: 4.6%
 *
 * Naturally-occurring financial data conforms. Fabricated data tends
 * to deviate (fabricators spread digits more uniformly).
 *
 * Application: per-council z-score on first-digit distribution across
 * every numeric value rendered for that council. z > 1.96 → flag for
 * human spot-check (not a hard failure — Benford has known false
 * positives at small N).
 *
 * Minimum sample size per Nigrini: N ≥ 30 for reliable results. Below
 * that, test is skipped with an info-level note.
 *
 * Spec: NORTH-STAR.md §8 (Statistical sanity), §16 (validator stack)
 *
 * Status: SCAFFOLD — lands in roadmap Phase E
 */

const BENFORD = {
  1: 0.301, 2: 0.176, 3: 0.125, 4: 0.097, 5: 0.079,
  6: 0.067, 7: 0.058, 8: 0.051, 9: 0.046,
};

function firstDigit(n) {
  const s = Math.abs(Math.floor(Math.abs(Number(n)))).toString();
  const d = s.match(/[1-9]/)?.[0];
  return d ? parseInt(d, 10) : null;
}

// TODO: Phase E implementation
// 1. For each council, collect every numeric value rendered
//    (budget categories, allowances, MTFS figures, salary bands
//    counts, service spending, etc.)
// 2. Skip if N < 30
// 3. Compute observed first-digit distribution
// 4. Compute z-score vs Benford expected
// 5. z > 1.96 → warning (possible fabrication or non-Benford data)
// 6. Emit per-council log: {council, N, z_score, p_value, outliers}

export function validate(councils, _population, report) {
  // No-op until Phase E
  report.tick();
  void councils; void BENFORD; void firstDigit;
}
