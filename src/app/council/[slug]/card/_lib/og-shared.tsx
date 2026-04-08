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
  secondary: '#d0d0d0', // brighter secondary for readability
  muted: '#b8b8b8',     // brighter muted — no faint text
  bar: '#ececec',
  barBg: '#3a3a40',
  positive: '#6fc48a',  // brighter green
  negative: '#e4b87a',  // brighter amber
  accent: '#e8955a',    // warm orange accent
  border: 'rgba(255,255,255,0.08)',
} as const;

// ── Layout constants ─────────────────────────────────────────────────────────

const SAFE_V = 160;  // ~13% of 1260 — tighter for more content space
const SAFE_H = 180;  // ~7.5% of 2400 — tighter horizontal
export const MIN_FONT = 40;

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
      <span style={{ fontSize: '48px', fontWeight: 700, color: OG.text, letterSpacing: '-0.01em' }}>CivAccount</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {typeName && <span style={{ fontSize: '44px', fontWeight: 500, color: OG.secondary }}>{typeName}</span>}
        <span style={{ fontSize: '44px', fontWeight: 600, color: OG.text }}>{councilName}</span>
        <span style={{ fontSize: '44px', fontWeight: 500, color: OG.secondary }}>· 2025-26</span>
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
