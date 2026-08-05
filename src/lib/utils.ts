import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Design system constants - use these for consistency
export const CARD_STYLES = "border border-border/40 bg-card shadow-sm rounded-xl" as const;
export const CARD_PADDING = "p-6 sm:p-8" as const;

// Search/filter limits
export const SEARCH_RESULT_LIMIT = 10 as const;
export const SELECTOR_RESULT_LIMIT = 50 as const;

// Canonical production origin — used everywhere a shareable absolute URL is
// needed (share modals, copy-link, native share, social embeds). Never rely
// on `window.location.origin` — it's empty during SSR and can be stale during
// client navigation, which produced relative/generic share URLs in the past.
export const SITE_URL = "https://www.civaccount.co.uk" as const;

/** Build a shareable absolute URL from a path. Query/hash are preserved. */
export function buildShareUrl(path: string | null | undefined): string {
  if (!path) return SITE_URL;
  if (path.startsWith("http")) return path;
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

/**
 * Tag a link so the destination's analytics can name CivAccount as the source.
 *
 * NEVER use this on a citation. A cited URL is provenance: it is recorded in
 * `field_sources`, hashed, archived, and checked verbatim by the link checker
 * and the live-site reality check. Appending tracking parameters would change
 * the cited URL, break archive matching, and violate Rule 2 of
 * DATA-CONSTITUTION.md. Anything rendered under a "Source:" label, inside a
 * SourceAnnotation, or inside a provenance notice is off limits.
 *
 * Use it only for:
 *   - navigational CTAs out to a council ("Check your exact bill on X")
 *   - our own share and embed URLs, so social/embed traffic is attributable
 *
 * Outbound attribution is otherwise carried by the Referer header — the site
 * sets Referrer-Policy: strict-origin-when-cross-origin and outbound links use
 * rel="noopener" (never "noreferrer", which would strip it). UTM is the
 * explicit, named version of the same signal for the surfaces that warrant it.
 */
export function withReferral(
  url: string | null | undefined,
  medium: "cta" | "share" | "embed",
  content?: string,
): string {
  if (!url) return "";
  try {
    const u = new URL(url);
    // Never clobber tagging a destination already carries.
    if (u.searchParams.has("utm_source")) return url;
    u.searchParams.set("utm_source", "civaccount");
    u.searchParams.set("utm_medium", medium);
    if (content) u.searchParams.set("utm_content", content);
    return u.toString();
  } catch {
    // Not an absolute URL (or unparseable) — leave it exactly as-is rather
    // than risk mangling a link.
    return url;
  }
}
