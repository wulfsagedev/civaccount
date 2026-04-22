/**
 * lib/wayback.mjs — Internet Archive Memento integration.
 *
 * Exports:
 *   saveNow(url) → { waybackUrl, archivedAt, ok }
 *   getLatestSnapshot(url) → { waybackUrl, archivedAt } | null
 *   getSnapshotAt(url, datetime) → { waybackUrl, archivedAt } | null
 *
 * Uses:
 *   - Internet Archive's SavePageNow: https://web.archive.org/save/<url>
 *   - Memento TimeMap API (RFC 7089): https://timetravel.mementoweb.org/
 *
 * Spec: NORTH-STAR.md §13 (Memento / Wayback integration)
 *
 * Scaffold — implementation in Phase B.
 */

// TODO:
// - saveNow: POST to SavePageNow with Capture-All option
// - Poll for completion (SavePageNow returns a job_id to poll)
// - getLatestSnapshot: GET https://archive.org/wayback/available?url=<url>
// - Memento protocol allows "give me this URL at 2026-04-22T12:00Z"
//   via TimeMap — useful if we want to fetch a specific past version
// - Error handling: IA sometimes rate-limits; retry with backoff

export async function saveNow(_url) {
  throw new Error('saveNow: not yet implemented — scaffold only');
}

export async function getLatestSnapshot(_url) {
  throw new Error('getLatestSnapshot: not yet implemented — scaffold only');
}

export async function getSnapshotAt(_url, _datetime) {
  throw new Error('getSnapshotAt: not yet implemented — scaffold only');
}
