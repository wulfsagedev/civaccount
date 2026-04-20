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
