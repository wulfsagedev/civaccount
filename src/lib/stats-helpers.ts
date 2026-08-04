/**
 * Small pure statistics helpers.
 *
 * Deliberately a leaf file with NO dataset imports so tests (and future
 * server-boundary refactors) can use these without pulling the full council
 * dataset into the module graph.
 */

/** True median of a numeric array. Averages the two middle values on even length. */
export function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}
