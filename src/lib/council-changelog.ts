/**
 * council-changelog.ts — surface per-council "what changed" entries +
 * per-field freshness helpers.
 *
 * "What changed" entries come from `councilChangelogData` (a small public-repo
 * mirror of the `phase_3_5_drift_fixes` / `phase_3_6_personnel_currency_fixes`
 * sections of each manifest in `src/data/councils/manifests/<slug>.json`).
 *
 * Per-field freshness comes from each council's own `field_sources[k].accessed`
 * date — the Phase C.3 signal that's harder to stale than a single
 * `last_verified` timestamp.
 *
 * Manifests for un-audited councils don't exist; helpers return empty/null
 * so callers can degrade gracefully.
 */

import { type Council } from '@/data/councils';
import {
  councilChangelogData,
  type CouncilChangelogEntry,
} from '@/data/council-changelog-data';

export type { CouncilChangelogEntry };

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Returns the most recent change(s) for a council, sorted by date desc.
 */
export function getCouncilChangelog(
  council: Council,
  limit = 3,
): CouncilChangelogEntry[] {
  const slug = slugify(council.name);
  const entries = councilChangelogData[slug] ?? [];
  return [...entries]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, limit);
}

/**
 * Returns the most-recent `accessed` date across all field_sources entries
 * for a council. Used as the "Most-recent verified data point" signal —
 * a per-field freshness number that's harder to stale than the single
 * `last_verified` date.
 */
export function getMostRecentFieldAccess(
  council: Council,
): { date: string; field: string } | null {
  const fs = council.detailed?.field_sources;
  if (!fs) return null;

  let best: { date: string; field: string } | null = null;
  for (const [field, entry] of Object.entries(fs)) {
    if (!entry || typeof entry !== 'object') continue;
    const accessed = (entry as { accessed?: string }).accessed;
    if (!accessed) continue;
    if (!best || accessed > best.date) {
      best = { date: accessed, field };
    }
  }
  return best;
}

/**
 * Returns true if this council has changelog entries (i.e. is North-Star
 * compliant with documented manifest fixes).
 */
export function hasChangelog(council: Council): boolean {
  return (councilChangelogData[slugify(council.name)] ?? []).length > 0;
}

/**
 * Convert a snake_case field name to a friendly label for display.
 */
export function friendlyFieldName(field: string): string {
  const map: Record<string, string> = {
    chief_executive: 'Chief executive',
    council_leader: 'Council leader',
    cabinet: 'Cabinet roster',
    total_councillors: 'Councillor count',
    revenue_budget: 'Revenue budget',
    capital_programme: 'Capital programme',
    council_tax_requirement: 'Council tax requirement',
    council_tax_base: 'Council tax base',
    reserves: 'Reserves',
    councillor_basic_allowance: 'Basic allowance',
    leader_allowance: 'Leader allowance',
    total_band_d: 'Total Band D',
  };
  return map[field] ?? field.replace(/_/g, ' ');
}
