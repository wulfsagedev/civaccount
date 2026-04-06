import type { Council } from '@/data/councils';
import type { ReactElement } from 'react';
import { calculateBands } from '@/data/councils';
import { OG_COLORS, formatCurrencyOG } from '../og-shared';

export function renderTaxBands(council: Council, _councilName: string): ReactElement {
  const bandD = council.council_tax?.band_d_2025;
  if (!bandD) return <div style={{ display: 'flex' }}>No data</div>;

  const bands = calculateBands(bandD);
  const bandEntries = Object.entries(bands) as [string, number][];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', fontSize: '32px', fontWeight: 700, color: OG_COLORS.text }}>
        Council tax by band
      </div>
      <div style={{ display: 'flex', fontSize: '18px', color: OG_COLORS.secondary, marginBottom: '4px' }}>
        This council&apos;s portion only, 2025-26
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
        {bandEntries.map(([band, amount]) => {
          const isD = band === 'D';
          return (
            <div
              key={band}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '6px',
                padding: '16px 20px',
                borderRadius: '12px',
                backgroundColor: isD ? OG_COLORS.text : 'rgba(0,0,0,0.03)',
                minWidth: '120px',
              }}
            >
              <span style={{ fontSize: '18px', fontWeight: 600, color: isD ? '#fafafa' : OG_COLORS.secondary }}>
                Band {band}
              </span>
              <span style={{ fontSize: '26px', fontWeight: 700, color: isD ? '#fafafa' : OG_COLORS.text }}>
                {formatCurrencyOG(amount, 2)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
