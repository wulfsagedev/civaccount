import type { ReactElement } from 'react';
import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * OG IMAGE DESIGN SYSTEM
 *
 * Rules (enforced by ogWrap):
 *   1. 20% safe margin — no content touches outer 20% of any edge
 *   2. Minimum font size: 32px (renders as 16px at 1x after 2x downscale)
 *   3. Colours match app dark mode (oklch approximations)
 *   4. Soft white text (#ececec), never pure white
 *   5. Geist Sans font — Regular (400), Medium (500), Bold (700)
 *   6. Subtle gradient background — not flat
 *   7. Civic building watermark in corner — visual motif
 *   8. One hero number per card — oversized, dominant
 *   9. Brand strip: minimal single line at bottom
 *  10. Satori limitation: inline styles only, no Tailwind/CSS classes
 *
 * Canvas: 2400x1260 (2x DPI, served as 1200x630)
 */

// ── Colours ──────────────────────────────────────────────────────────────────

export const OG = {
  bg: '#1c1c20',
  card: '#252529',
  surface: '#2e2e33',
  text: '#f0f0f0',     // 14.8:1 on bg — AAA
  secondary: '#b0b0b0', // 8.2:1 on bg — AAA
  muted: '#9a9a9a',     // 7.1:1 on bg — AAA minimum
  bar: '#ececec',
  barBg: '#3a3a40',
  positive: '#5fa876',
  negative: '#d4a86a',
  accent: '#7c82d4',
  border: 'rgba(255,255,255,0.08)',
} as const;

// ── Layout constants ─────────────────────────────────────────────────────────

const SAFE_V = 252;  // 20% of 1260
const SAFE_H = 240;  // 10% of 2400
export const MIN_FONT = 32;

// ── Fonts (loaded once, cached by Node.js module system) ─────────────────────

function loadFont(filename: string): ArrayBuffer {
  const fontPath = join(process.cwd(), 'node_modules', 'geist', 'dist', 'fonts', 'geist-sans', filename);
  return readFileSync(fontPath).buffer as ArrayBuffer;
}

type FontWeight = 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900;
type FontEntry = { name: string; data: ArrayBuffer; weight: FontWeight; style: 'normal' };

let _fonts: FontEntry[] | null = null;

export function getGeistFonts(): FontEntry[] {
  if (_fonts) return _fonts;
  _fonts = [
    { name: 'Geist', data: loadFont('Geist-Regular.ttf'), weight: 400 as const, style: 'normal' as const },
    { name: 'Geist', data: loadFont('Geist-Medium.ttf'), weight: 500 as const, style: 'normal' as const },
    { name: 'Geist', data: loadFont('Geist-SemiBold.ttf'), weight: 600 as const, style: 'normal' as const },
    { name: 'Geist', data: loadFont('Geist-Bold.ttf'), weight: 700 as const, style: 'normal' as const },
  ];
  return _fonts;
}

// ── Wrapper ──────────────────────────────────────────────────────────────────

export function ogWrap(children: ReactElement): ReactElement {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        width: '100%',
        height: '100%',
        padding: `${SAFE_V}px ${SAFE_H}px`,
        background: 'linear-gradient(145deg, #22222a 0%, #1c1c20 40%, #181820 100%)',
        fontFamily: 'Geist, system-ui, sans-serif',
      }}
    >
      {children}
    </div>
  );
}

// ── Brand strip ──────────────────────────────────────────────────────────────

export function ogBrand(councilName: string, typeName?: string): ReactElement {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: OG.text, display: 'flex', alignItems: 'center', justifyContent: 'center', color: OG.bg, fontSize: '24px', fontWeight: 700 }}>C</div>
        <span style={{ fontSize: `${MIN_FONT}px`, fontWeight: 600, color: OG.muted }}>CivAccount</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {typeName && <span style={{ fontSize: `${MIN_FONT}px`, color: OG.muted }}>{typeName}</span>}
        <span style={{ fontSize: `${MIN_FONT}px`, color: OG.secondary }}>{councilName}</span>
        <span style={{ fontSize: `${MIN_FONT}px`, color: OG.muted }}>· 2025-26</span>
      </div>
    </div>
  );
}

// Legacy aliases
export const ogHeader = ogBrand;
export function ogFooter(): ReactElement {
  return <div style={{ display: 'flex' }} />;
}
export const ogCardWrapper = ogWrap;

// ── Formatters ───────────────────────────────────────────────────────────────

export function formatCurrencyOG(value: number, decimals = 0): string {
  return `\u00A3${value.toLocaleString('en-GB', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`;
}

export function formatBudgetOG(thousands: number): string {
  const actual = thousands * 1000;
  if (actual >= 1_000_000_000) return `\u00A3${(actual / 1_000_000_000).toFixed(1)}bn`;
  if (actual >= 1_000_000) return `\u00A3${(actual / 1_000_000).toFixed(1)}m`;
  return `\u00A3${(actual / 1000).toFixed(0)}k`;
}
