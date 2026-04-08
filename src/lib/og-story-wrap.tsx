import type { ReactElement } from 'react';
import { OG, MIN_FONT } from '@/app/council/[slug]/card/_lib/og-shared';

/**
 * OG STORY FORMAT — Vertical wrapper for WhatsApp/Instagram Stories
 *
 * Canvas: 1080x1920 (1x DPI — stories are viewed on mobile at native res)
 * Safe zone: 10% horizontal (108px), 8% vertical (154px)
 */

const SAFE_H = 108;
const SAFE_V = 154;

export function ogStoryWrap(children: ReactElement): ReactElement {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        width: '100%',
        height: '100%',
        padding: `${SAFE_V}px ${SAFE_H}px`,
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
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', width: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: OG.text, display: 'flex', alignItems: 'center', justifyContent: 'center', color: OG.bg, fontSize: '18px', fontWeight: 700 }}>C</div>
        <span style={{ fontSize: '24px', fontWeight: 600, color: OG.muted }}>CivAccount</span>
      </div>
      <span style={{ fontSize: '20px', color: OG.muted, textAlign: 'center' }}>
        {councilName}{typeName ? ` · ${typeName}` : ''} · 2025-26
      </span>
    </div>
  );
}
