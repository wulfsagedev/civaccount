import type { Council } from '@/data/councils';
import type { ReactElement } from 'react';
import { OG_COLORS, formatCurrencyOG } from '../og-shared';

export function renderYourBill(council: Council, councilName: string): ReactElement {
  const bandD = council.council_tax?.band_d_2025;
  const bandDPrev = council.council_tax?.band_d_2024;

  if (!bandD) return <div style={{ display: 'flex' }}>No data</div>;

  const change = bandDPrev ? bandD - bandDPrev : null;
  const changePct = bandDPrev ? ((change! / bandDPrev) * 100).toFixed(1) : null;
  const dailyCost = (bandD / 365).toFixed(2);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ display: 'flex', fontSize: '24px', color: OG_COLORS.secondary, fontWeight: 600, letterSpacing: '0.02em' }}>
        You pay this council
      </div>
      <div style={{ display: 'flex', fontSize: '128px', fontWeight: 700, color: OG_COLORS.text, letterSpacing: '-0.03em', lineHeight: 1 }}>
        {formatCurrencyOG(bandD, 2)}
      </div>
      <div style={{ display: 'flex', fontSize: '32px', color: OG_COLORS.secondary, fontWeight: 500, marginTop: '4px' }}>
        {`${councilName} \u00B7 \u00A3${dailyCost}/day`}
      </div>
      {change != null && changePct != null && (
        <div style={{ display: 'flex', alignItems: 'center', fontSize: '28px', marginTop: '8px' }}>
          <span style={{ color: change > 0 ? '#b45309' : OG_COLORS.positive, fontWeight: 700 }}>
            {`${change > 0 ? '+' : ''}${formatCurrencyOG(Math.abs(change), 2)} (${change > 0 ? '+' : ''}${changePct}%)`}
          </span>
          <span style={{ color: OG_COLORS.muted, marginLeft: '12px' }}>from last year</span>
        </div>
      )}
    </div>
  );
}
