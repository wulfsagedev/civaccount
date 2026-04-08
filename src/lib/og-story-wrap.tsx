import type { ReactElement } from 'react';
import { OG, MIN_FONT } from '@/app/council/[slug]/card/_lib/og-shared';

/**
 * OG STORY FORMAT — Vertical wrapper for WhatsApp/Instagram Stories
 *
 * Canvas: 1080x1920 (1x DPI — stories are viewed on mobile at native res)
 * Large vertical insets push content toward centre, away from app chrome
 * (status bar ~90px, story UI top bar ~120px, home indicator ~60px)
 */

const SAFE_H = 80;
const SAFE_TOP = 260;    // clear of status bar + story UI overlays
const SAFE_BOTTOM = 200; // clear of home indicator + story reply bar

export function ogStoryWrap(children: ReactElement): ReactElement {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        width: '100%',
        height: '100%',
        padding: `${SAFE_TOP}px ${SAFE_H}px ${SAFE_BOTTOM}px`,
        background: 'linear-gradient(180deg, #22222a 0%, #1c1c20 40%, #181820 100%)',
        fontFamily: 'Geist, system-ui, sans-serif',
      }}
    >
      {children}
    </div>
  );
}

export function ogStoryBrand(councilName: string, typeName?: string): ReactElement {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px', width: '100%' }}>
      <span style={{ fontSize: '36px', fontWeight: 700, color: OG.text, letterSpacing: '-0.01em' }}>CivAccount</span>
      <span style={{ fontSize: '30px', fontWeight: 500, color: OG.secondary, textAlign: 'center' }}>
        {councilName}{typeName ? ` · ${typeName}` : ''} · 2025-26
      </span>
    </div>
  );
}
