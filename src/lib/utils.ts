import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Design system constants - use these for consistency
// Standard card - subtle border and shadow
export const CARD_STYLES = "border border-border/40 bg-card shadow-sm rounded-xl" as const;
// Elevated card - more prominent shadow, Stripe-style
export const CARD_ELEVATED = "card-elevated" as const;
// Featured card - accent border glow
export const CARD_FEATURED = "card-featured" as const;
// Metric card - gradient background
export const CARD_METRIC = "card-metric p-6" as const;

export const CARD_PADDING = "p-6 sm:p-8" as const;
export const CARD_PADDING_COMPACT = "p-5 sm:p-6" as const;
export const CARD_HEADER_PADDING = "p-6 sm:p-8 pb-4" as const;

// Search/filter limits
export const SEARCH_RESULT_LIMIT = 10 as const;
export const SELECTOR_RESULT_LIMIT = 50 as const;

// Format number with en-GB locale (use instead of inline toLocaleString)
export function formatNumber(value: number, options?: { decimals?: number }): string {
  const { decimals = 0 } = options ?? {};
  return value.toLocaleString('en-GB', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

// Format percentage consistently
export function formatPercent(value: number, decimals = 1): string {
  return formatNumber(value, { decimals }) + '%';
}
