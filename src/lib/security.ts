/**
 * Security helpers — shared by API routes.
 *
 * These are small primitives, not a framework. Each function does one
 * well-scoped thing so the call-sites in route handlers stay readable.
 */

/**
 * Allow-list of origins that may POST to our state-changing APIs.
 *
 * Any origin not in this list is rejected before the handler runs.  We
 * deliberately do NOT read this from an env var — the list should be part
 * of the committed source so a stolen Vercel env can't add a new allowed
 * origin without a PR.
 *
 * The `localhost` entries cover `npm run dev` (3000) and the Playwright
 * preview (5173 is Vite's default; included in case we ever wire it up).
 * Codespaces / gitpod URLs are NOT on the list — add them explicitly and
 * temporarily if you're doing a test session, and remove before merge.
 */
const ALLOWED_ORIGINS: readonly string[] = [
  'https://www.civaccount.co.uk',
  'https://civaccount.co.uk',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
];

/**
 * Vercel preview URL shape: https://<slug>-<hash>-wulfsagedev.vercel.app
 * and https://<slug>-wulfsagedev.vercel.app.  Explicit regex rather than
 * substring match so an attacker can't register
 * `civaccount.co.uk.attacker.vercel.app` and pass the check.
 */
const VERCEL_PREVIEW_ORIGIN = /^https:\/\/[a-z0-9-]+-wulfsagedev\.vercel\.app$/;

/**
 * Validate the Origin (or Referer fallback) of a state-changing request.
 *
 * Returns `{ ok: true }` if the origin is acceptable, or
 * `{ ok: false, reason }` with a short human-readable reason otherwise.
 * The caller is expected to respond 403 on failure — we don't throw, so
 * the route handler retains control of the response shape.
 *
 * Why Origin first, Referer fallback: Origin is always sent on POSTs by
 * every modern browser since ~2014, but some browser extensions and older
 * fetch shims strip it.  Referer is less reliable (can be sanitised by
 * `Referrer-Policy: no-referrer`) but is a useful secondary signal.  If
 * both are missing, we reject — a request without an origin is more
 * likely to be a crafted CSRF attempt than a legitimate browser.
 */
export function checkOrigin(request: Request): { ok: true } | { ok: false; reason: string } {
  const origin = request.headers.get('origin');

  if (origin) {
    return isAllowedOrigin(origin)
      ? { ok: true }
      : { ok: false, reason: `origin ${JSON.stringify(origin)} not on allow-list` };
  }

  const referer = request.headers.get('referer');
  if (referer) {
    try {
      const refererOrigin = new URL(referer).origin;
      return isAllowedOrigin(refererOrigin)
        ? { ok: true }
        : { ok: false, reason: `referer origin ${JSON.stringify(refererOrigin)} not on allow-list` };
    } catch {
      return { ok: false, reason: 'referer header is not a valid URL' };
    }
  }

  return { ok: false, reason: 'no origin or referer header present' };
}

function isAllowedOrigin(origin: string): boolean {
  if (ALLOWED_ORIGINS.includes(origin)) return true;
  if (VERCEL_PREVIEW_ORIGIN.test(origin)) return true;
  return false;
}

/**
 * Truncate a user-provided string to a maximum length, collapsing any
 * interior newlines and control characters.  Use for anything that will
 * be rendered into SVG/PNG via Satori, HTML attributes, or log lines.
 *
 * We prefer silent truncation over throwing on over-length input because
 * the shared use-case (OG image generation) should degrade gracefully —
 * a clipped label is better than a 500 for a share card.
 */
export function clamp(input: string | null | undefined, maxLen: number): string {
  if (!input) return '';
  // Strip ASCII control characters (0x00–0x1F, 0x7F) except tab/newline
  // which we flatten to spaces.  This is the same treatment Satori applies
  // internally, but doing it here keeps our own log lines clean too.
  const cleaned = input
    .replace(/[\t\n\r]+/g, ' ')
    .replace(/[\u0000-\u001F\u007F]/g, '')
    .trim();

  if (cleaned.length <= maxLen) return cleaned;
  // Preserve a visible truncation marker so the output is never silently
  // wrong — readers know the value was clipped.
  return cleaned.slice(0, maxLen - 1).trimEnd() + '…';
}
