/**
 * lib/wayback.mjs — Internet Archive / Memento integration.
 *
 * Spec: NORTH-STAR.md §14 (Memento / Wayback integration)
 *
 * Two modes:
 *
 *   getLatestSnapshot(url) — check if a snapshot already exists.
 *     Uses https://archive.org/wayback/available?url=<url>
 *
 *   saveNow(url) — trigger a new snapshot.
 *     Uses https://web.archive.org/save/<url>
 *
 *     SavePageNow is rate-limited; accepts an optional authentication
 *     token via IA_API_KEY env var for faster processing, but works
 *     unauthenticated (slower, may queue).
 *
 * Both functions are best-effort. If the Internet Archive is unreachable
 * or rate-limits us, we log a warning and return null — archival proceeds
 * without the Wayback snapshot rather than failing the pipeline.
 */

/**
 * Get the most recent Wayback snapshot URL for a given live URL.
 * Returns { waybackUrl, timestamp } | null.
 */
export async function getLatestSnapshot(url) {
  try {
    const apiUrl = `https://archive.org/wayback/available?url=${encodeURIComponent(url)}`;
    const res = await fetch(apiUrl, {
      headers: { 'User-Agent': 'CivAccount-Archiver/1.0 (https://civaccount.co.uk)' },
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const closest = data?.archived_snapshots?.closest;
    if (!closest?.available || !closest.url) return null;
    return {
      waybackUrl: closest.url,
      timestamp: closest.timestamp,
    };
  } catch {
    return null;
  }
}

/**
 * Trigger a new Wayback snapshot. Best-effort; returns the snapshot
 * URL when available, null if IA is slow / unreachable.
 */
export async function saveNow(url) {
  try {
    const saveUrl = `https://web.archive.org/save/${url}`;
    const res = await fetch(saveUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'CivAccount-Archiver/1.0 (https://civaccount.co.uk)',
        ...(process.env.IA_API_KEY
          ? { Authorization: `LOW ${process.env.IA_API_KEY}` }
          : {}),
      },
      redirect: 'follow',
      signal: AbortSignal.timeout(60_000), // SavePageNow can be slow
    });
    if (!res.ok) {
      return { waybackUrl: null, ok: false, error: `HTTP ${res.status}` };
    }
    // SavePageNow redirects to the snapshot URL on success.
    // res.url is the final URL after redirects.
    if (res.url.includes('web.archive.org/web/')) {
      return { waybackUrl: res.url, ok: true, error: null };
    }
    // Sometimes it returns a job ID in a header — treat as async.
    return { waybackUrl: null, ok: true, error: 'async_snapshot_queued' };
  } catch (e) {
    return { waybackUrl: null, ok: false, error: String(e.message || e) };
  }
}

/**
 * Save a URL and return the Wayback URL. Checks for an existing recent
 * snapshot first; only triggers save-now if no snapshot in last 30 days.
 */
export async function ensureSnapshot(url) {
  const existing = await getLatestSnapshot(url);
  if (existing) {
    // Wayback timestamps are YYYYMMDDHHMMSS; compare to 30 days ago
    const ts = existing.timestamp || '';
    const y = parseInt(ts.slice(0, 4), 10);
    const m = parseInt(ts.slice(4, 6), 10) - 1;
    const d = parseInt(ts.slice(6, 8), 10);
    const snapshotDate = new Date(y, m, d);
    const daysAgo = (Date.now() - snapshotDate.getTime()) / (1000 * 60 * 60 * 24);
    if (daysAgo < 30) return existing.waybackUrl;
  }
  const result = await saveNow(url);
  return result.waybackUrl;
}
