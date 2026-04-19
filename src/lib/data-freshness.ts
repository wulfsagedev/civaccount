/**
 * Data freshness helpers — a single source of truth for "when did CivAccount
 * last refresh the underlying council dataset?".
 *
 * Used by:
 *   - Article/WebPage schema `dateModified` so AI engines and search
 *     crawlers see a true data-change signal rather than today's render time.
 *   - /press page to stamp a "last refreshed" marker.
 *   - llms.txt generation if/when it becomes dynamic.
 */

import { councils } from '@/data/councils';

let _cached: string | null = null;

/** Max `last_verified` ISO date across all councils. Fallback: today. */
export function getDataLastVerified(): string {
  if (_cached) return _cached;

  let latest = '';
  for (const c of councils) {
    const d = c.detailed?.last_verified;
    if (d && d > latest) latest = d;
  }

  _cached = latest || new Date().toISOString().slice(0, 10);
  return _cached;
}

/** Earliest `last_verified` ISO date across councils — useful for "data coverage since". */
export function getDataFirstVerified(): string {
  let earliest = '9999-99-99';
  for (const c of councils) {
    const d = c.detailed?.last_verified;
    if (d && d < earliest) earliest = d;
  }
  return earliest === '9999-99-99' ? '2025-09-01' : earliest;
}
