import { ImageResponse } from 'next/og';
import { councils } from '@/data/councils';
import { OG, ogWrap, getGeistFonts } from '@/app/council/[slug]/card/_lib/og-shared';

export const runtime = 'nodejs';
export const alt = 'Council Tax Increases 2025-26';
export const size = { width: 2400, height: 1260 };
export const contentType = 'image/png';

export default async function Image() {
  const withBothYears = councils.filter(c => c.council_tax?.band_d_2025 && c.council_tax?.band_d_2024);
  const avgChange = withBothYears.reduce((s, c) => s + ((c.council_tax!.band_d_2025 - c.council_tax!.band_d_2024!) / c.council_tax!.band_d_2024!) * 100, 0) / withBothYears.length;

  return new ImageResponse(
    ogWrap(
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%' }}>
        <span style={{ fontSize: '48px', fontWeight: 700, color: OG.text }}>CivAccount</span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <span style={{ fontSize: '96px', fontWeight: 700, color: OG.text, letterSpacing: '-0.02em', lineHeight: 1.05 }}>
            Council Tax Increases
          </span>
          <span style={{ fontSize: '48px', fontWeight: 500, color: OG.secondary }}>
            Average increase of +{avgChange.toFixed(1)}% across {withBothYears.length} councils in 2025-26
          </span>
        </div>
        <span style={{ fontSize: '44px', fontWeight: 500, color: OG.secondary }}>England 2025-26 · See which councils raised the most</span>
      </div>
    ),
    { ...size, fonts: getGeistFonts() }
  );
}
