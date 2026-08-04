/**
 * Parse a query-string integer with a default and clamped bounds.
 * Non-numeric / NaN / negative / out-of-range inputs collapse to a safe value
 * so untrusted params can never reach a database range() or an array slice()
 * as NaN.
 */
export function parseIntParam(
  raw: string | null,
  { fallback, min, max }: { fallback: number; min: number; max: number },
): number {
  const n = raw == null ? fallback : Number.parseInt(raw, 10);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(Math.max(Math.trunc(n), min), max);
}
