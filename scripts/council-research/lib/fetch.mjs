/**
 * lib/fetch.mjs — HTTP fetching with realistic UA, retry, and
 * Wayback Machine fallback for bot-blocked URLs.
 *
 * Exports:
 *   fetchUrl(url, opts) → { ok, status, body, contentType, finalUrl, viaWayback }
 *   savePageNow(url)    → { waybackUrl, archivedAt }
 *
 * Spec: NORTH-STAR.md §13 (Memento protocol), §6 Phase 1 (Wayback fallback)
 *
 * Scaffold — implementation in Phase B.
 */

// TODO:
// - Realistic Mozilla UA string, accept headers matching Firefox
// - Timeout default 30s
// - Retry on 5xx (3 attempts, exponential backoff)
// - On 403 + Cloudflare: fall back to web.archive.org/web/<url>
// - SavePageNow: POST https://web.archive.org/save/<url>
//   → follow redirect → Content-Location header → final archived URL
// - Return `viaWayback: true` when Wayback was used

export async function fetchUrl(_url, _opts = {}) {
  throw new Error('fetchUrl: not yet implemented — scaffold only');
}

export async function savePageNow(_url) {
  throw new Error('savePageNow: not yet implemented — scaffold only');
}
