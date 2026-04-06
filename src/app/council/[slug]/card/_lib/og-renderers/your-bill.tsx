import type { Council } from '@/data/councils';
import type { ReactElement } from 'react';
import { OG_COLORS, formatCurrencyOG } from '../og-shared';

export function renderYourBill(council: Council, _councilName: string): ReactElement {
  const bandD = council.council_tax?.band_d_2025;
  const bandDPrev = council.council_tax?.band_d_2024;

  if (!bandD) return <div style={{ display: 'flex' }}>No data</div>;

  const change = bandDPrev ? bandD - bandDPrev : null;
  const changePct = bandDPrev ? ((change! / bandDPrev) * 100).toFixed(1) : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ fontSize: '20px', color: OG_COLORS.secondary, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        You pay this council
      </div>
      <div style={{ fontSize: '96px', fontWeight: 700, color: OG_COLORS.text, letterSpacing: '-0.03em', lineHeight: 1 }}>
        {formatCurrencyOG(bandD, 2)}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '24px' }}>
        <span style={{ color: OG_COLORS.secondary }}>Band D 2025-26</span>
        {change != null && changePct != null && (
          <span style={{ color: change > 0 ? '#b45309' : OG_COLORS.positive, marginLeft: '16px', fontWeight: 600 }}>
            {change > 0 ? '+' : ''}{formatCurrencyOG(Math.abs(change), 2)} ({change > 0 ? '+' : ''}{changePct}%) from last year
          </span>
        )}
      </div>
    </div>
  );
}
