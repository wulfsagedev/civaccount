import { ImageResponse } from 'next/og';
import { OG, ogWrap, getGeistFonts } from '@/app/council/[slug]/card/_lib/og-shared';

export const runtime = 'nodejs';
export const alt = 'Council Leaderboards — all 317 English councils';
export const size = { width: 2400, height: 1260 };
export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    ogWrap(
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%' }}>
        <span style={{ fontSize: '48px', fontWeight: 700, color: OG.text }}>CivAccount</span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <span style={{ fontSize: '112px', fontWeight: 700, color: OG.text, letterSpacing: '-0.02em', lineHeight: 1.05 }}>
            Council Leaderboards
          </span>
          <span style={{ fontSize: '48px', fontWeight: 500, color: OG.secondary }}>
            Rankings for council tax, spending per resident, and CEO salary across all 317 English councils
          </span>
        </div>
        <span style={{ fontSize: '44px', fontWeight: 500, color: OG.secondary }}>2025-26 · Grouped by council type for fair comparison</span>
      </div>
    ),
    { ...size, fonts: getGeistFonts() }
  );
}
