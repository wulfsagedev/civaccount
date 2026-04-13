import type { Council } from '@/data/councils';
import type { ReactElement } from 'react';
import { calculateBands } from '@/data/councils';
import { OG, ogWrap, ogBrand, formatCurrencyOG } from '../og-shared';

export function renderTaxBands(council: Council, councilName: string): ReactElement {
  const bandD = council.council_tax?.band_d_2025;
  if (!bandD) return <div style={{ display: 'flex' }}>No data</div>;

  const bands = calculateBands(bandD);
  const bandEntries = Object.entries(bands) as [string, number][];

  return ogWrap(
    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%' }}>
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'center' }}>
        <div style={{ display: 'flex', fontSize: '72px', fontWeight: 700, color: OG.text, marginBottom: '16px' }}>
          Council tax by band
        </div>
        <div style={{ display: 'flex', fontSize: '36px', color: OG.secondary, marginBottom: '48px' }}>
          This council&apos;s portion only, 2025-26
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px' }}>
          {bandEntries.map(([band, amount]) => {
            const isD = band === 'D';
            return (
              <div
                key={band}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '32px 40px',
                  borderRadius: '24px',
                  backgroundColor: isD ? OG.accent : OG.surface,
                  width: '230px',
                }}
              >
                <span style={{ fontSize: '36px', fontWeight: 600, color: isD ? '#fafafa' : OG.secondary }}>Band {band}</span>
                <span style={{ fontSize: '56px', fontWeight: 700, color: isD ? '#fafafa' : OG.text }}>{formatCurrencyOG(amount, 2)}</span>
              </div>
            );
          })}
        </div>
      </div>

      {ogBrand(councilName, council.type_name)}
    </div>
  );
}
