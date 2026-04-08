import { ImageResponse } from 'next/og';
import { councils, getCouncilDisplayName } from '@/data/councils';
import { OG, ogWrap, ogBrand, getGeistFonts, formatCurrencyOG, MIN_FONT } from '../council/[slug]/card/_lib/og-shared';

export const runtime = 'nodejs';
export const alt = 'Council Tax Insights — all 317 English councils';
export const size = { width: 2400, height: 1260 };
export const contentType = 'image/png';

const ogOptions = { ...size, fonts: getGeistFonts() };

export default async function Image() {
  const councilsWithTax = councils.filter(c => c.council_tax?.band_d_2025);
  const bandDValues = councilsWithTax.map(c => c.council_tax!.band_d_2025);
  const avgBandD = bandDValues.reduce((sum, v) => sum + v, 0) / bandDValues.length;

  const cheapest = councilsWithTax.reduce((min, c) =>
    c.council_tax!.band_d_2025 < min.council_tax!.band_d_2025 ? c : min
  );
  const mostExpensive = councilsWithTax.reduce((max, c) =>
    c.council_tax!.band_d_2025 > max.council_tax!.band_d_2025 ? c : max
  );

  const stats = [
    { label: 'Average Band D', value: formatCurrencyOG(Math.round(avgBandD)) },
    { label: 'Lowest', value: `${formatCurrencyOG(Math.round(cheapest.council_tax!.band_d_2025))}` },
    { label: 'Highest', value: `${formatCurrencyOG(Math.round(mostExpensive.council_tax!.band_d_2025))}` },
  ];

  return new ImageResponse(
    ogWrap(
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%' }}>
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'center' }}>
          {/* Title */}
          <div style={{ display: 'flex', fontSize: '44px', color: OG.muted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '20px' }}>
            2025-26
          </div>
          <div style={{ display: 'flex', fontSize: '112px', fontWeight: 700, color: OG.text, letterSpacing: '-0.02em', lineHeight: 1.1, marginBottom: '24px' }}>
            Council Tax Insights
          </div>
          <div style={{ display: 'flex', fontSize: '48px', color: OG.secondary, marginBottom: '64px' }}>
            Compare all {councilsWithTax.length} English councils
          </div>

          {/* Stats row */}
          <div style={{ display: 'flex', gap: '80px' }}>
            {stats.map((stat) => (
              <div key={stat.label} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <span style={{ fontSize: `${MIN_FONT}px`, color: OG.muted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {stat.label}
                </span>
                <span style={{ fontSize: '64px', fontWeight: 700, color: OG.text }}>
                  {stat.value}
                </span>
              </div>
            ))}
          </div>
        </div>

        {ogBrand('All Councils')}
      </div>
    ),
    ogOptions
  );
}
