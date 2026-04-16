/**
 * Shared OG helpers for national insights cards.
 *
 * Wraps the council-level `og-shared.tsx` and adds a `ogBrandNational()` brand
 * strip that says "England · 2025-26" instead of a council name.
 */

import type { ReactElement } from 'react';
import { OG } from '@/app/council/[slug]/card/_lib/og-shared';

export { OG, MIN_FONT, ogWrap, getGeistFonts, formatCurrencyOG } from '@/app/council/[slug]/card/_lib/og-shared';

/** Format a pound figure with a magnitude suffix (bn / m / k). */
export function formatPoundsShort(pounds: number, decimals = 1): string {
  const sign = pounds < 0 ? '-' : '';
  const abs = Math.abs(pounds);
  if (abs >= 1_000_000_000) return `${sign}\u00A3${(abs / 1_000_000_000).toFixed(decimals)}bn`;
  if (abs >= 1_000_000) return `${sign}\u00A3${(abs / 1_000_000).toFixed(decimals)}m`;
  if (abs >= 1_000) return `${sign}\u00A3${(abs / 1_000).toFixed(0)}k`;
  return `${sign}\u00A3${abs.toLocaleString('en-GB', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`;
}

/**
 * National-variant brand strip. Sits at the bottom of national insight OG
 * images — same typography as `ogBrand()` but replaces the council name with
 * "England".
 */
export function ogBrandNational(section?: string): ReactElement {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
      }}
    >
      <span
        style={{
          fontSize: '48px',
          fontWeight: 700,
          color: OG.text,
          letterSpacing: '-0.01em',
        }}
      >
        CivAccount
      </span>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {section && (
          <span style={{ fontSize: '44px', fontWeight: 500, color: OG.secondary }}>
            {section}
          </span>
        )}
        <span style={{ fontSize: '44px', fontWeight: 600, color: OG.text }}>England</span>
        <span style={{ fontSize: '44px', fontWeight: 500, color: OG.secondary }}>
          · 2025-26
        </span>
      </div>
    </div>
  );
}
