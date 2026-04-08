import { ImageResponse } from 'next/og';
import { councils, getCouncilDisplayName, formatCurrency } from '@/data/councils';
import { OG, ogWrap, getGeistFonts } from '@/app/council/[slug]/card/_lib/og-shared';

export const runtime = 'nodejs';
export const alt = 'Cheapest Council Tax in England 2025-26';
export const size = { width: 2400, height: 1260 };
export const contentType = 'image/png';

export default async function Image() {
  const cheapest = councils
    .filter(c => c.council_tax?.band_d_2025)
    .reduce((min, c) => c.council_tax!.band_d_2025 < min.council_tax!.band_d_2025 ? c : min);

  return new ImageResponse(
    ogWrap(
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%' }}>
        <span style={{ fontSize: '48px', fontWeight: 700, color: OG.text }}>CivAccount</span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <span style={{ fontSize: '96px', fontWeight: 700, color: OG.text, letterSpacing: '-0.02em', lineHeight: 1.05 }}>
            Cheapest Council Tax
          </span>
          <span style={{ fontSize: '48px', fontWeight: 500, color: OG.secondary }}>
            {getCouncilDisplayName(cheapest)} has the lowest Band D at {formatCurrency(cheapest.council_tax!.band_d_2025, { decimals: 2 })}
          </span>
        </div>
        <span style={{ fontSize: '44px', fontWeight: 500, color: OG.secondary }}>England 2025-26 · Ranked by council type</span>
      </div>
    ),
    { ...size, fonts: getGeistFonts() }
  );
}
