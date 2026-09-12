/**
 * What Google actually renders in a search result.
 *
 * These are display limits, not validation rules — a longer title or
 * description is legal, it is simply cut off with an ellipsis, and everything
 * past the cut is wasted. The cut is by pixel width, not characters, so treat
 * these as safe budgets rather than exact thresholds.
 *
 * Measured on the CivAccount pages in September 2026, the correlation was
 * plain: /insights/council-ceo-salaries had a 138-character description that
 * fit and converted at 2.08%, while the two council-tax ranking pages had
 * 242- and 249-character descriptions that were cut, and converted at 0.92%
 * and 0.77% from better ranking positions.
 */

/** Titles are cut around 580px, roughly 60 characters. */
export const TITLE_MAX = 60;

/** Descriptions are cut around 920px, roughly 160 characters. Aim under. */
export const DESCRIPTION_MAX = 155;

/**
 * Pick the first candidate that fits, falling back through progressively
 * shorter forms.
 *
 * Order candidates best-first: the richest version that names the answer, then
 * shorter variants, and last a generic form guaranteed to fit whatever the data
 * does. The final candidate is returned even if it is too long, so a caller
 * that supplies only over-length options still gets a string rather than
 * undefined — the accompanying test is what keeps that from happening quietly.
 */
export function pickWithinLimit(candidates: readonly string[], max: number): string {
  return candidates.find((c) => c.length <= max) ?? candidates[candidates.length - 1];
}
