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
