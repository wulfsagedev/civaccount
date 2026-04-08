import { ImageResponse } from 'next/og';
import { OG, ogWrap, getGeistFonts } from './council/[slug]/card/_lib/og-shared';

export const runtime = 'nodejs';
export const alt = 'CivAccount - See where your council tax goes';
export const size = { width: 2400, height: 1260 };
export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    ogWrap(
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%' }}>
        {/* Top — brand */}
        <span style={{ fontSize: '48px', fontWeight: 700, color: OG.text, letterSpacing: '-0.01em' }}>
          CivAccount
        </span>

        {/* Middle — hero */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <span style={{ fontSize: '128px', fontWeight: 700, color: OG.text, letterSpacing: '-0.03em', lineHeight: 1.05 }}>
            Where your council{'\n'}tax goes
          </span>
          <span style={{ fontSize: '52px', fontWeight: 500, color: OG.secondary }}>
            Budget breakdowns, council tax rates, and spending{'\n'}data for all 317 English councils
          </span>
        </div>

        {/* Bottom — stats */}
        <div style={{ display: 'flex', gap: '80px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <span style={{ fontSize: '40px', fontWeight: 600, color: OG.secondary, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Councils</span>
            <span style={{ fontSize: '56px', fontWeight: 700, color: OG.text }}>317</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <span style={{ fontSize: '40px', fontWeight: 600, color: OG.secondary, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Year</span>
            <span style={{ fontSize: '56px', fontWeight: 700, color: OG.text }}>2025-26</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <span style={{ fontSize: '40px', fontWeight: 600, color: OG.secondary, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Free</span>
            <span style={{ fontSize: '56px', fontWeight: 700, color: OG.text }}>Always</span>
          </div>
        </div>
      </div>
    ),
    { ...size, fonts: getGeistFonts() }
  );
}
