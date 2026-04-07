import type { Council } from '@/data/councils';
import type { ReactElement } from 'react';
import { OG, ogWrap, ogBrand, formatCurrencyOG } from '../og-shared';

export function renderYourBill(council: Council, councilName: string): ReactElement {
  const bandD = council.council_tax?.band_d_2025;
  const bandDPrev = council.council_tax?.band_d_2024;

  if (!bandD) return <div style={{ display: 'flex' }}>No data</div>;

  const change = bandDPrev ? bandD - bandDPrev : null;
  const changePct = bandDPrev ? ((change! / bandDPrev) * 100).toFixed(1) : null;
  const dailyCost = (bandD / 365).toFixed(2);

  return ogWrap(
    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%' }}>
      {/* Data — fills ~85% of the card */}
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'center' }}>
        <div style={{ display: 'flex', fontSize: '40px', color: OG.muted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '24px' }}>
          You pay this council
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '20px' }}>
          <span style={{ fontSize: '260px', fontWeight: 700, color: OG.text, letterSpacing: '-0.03em', lineHeight: 0.9 }}>
            {formatCurrencyOG(bandD, 2)}
          </span>
          <span style={{ fontSize: '64px', color: OG.muted }}>/year</span>
        </div>
        <div style={{ display: 'flex', gap: '40px', marginTop: '48px', alignItems: 'baseline' }}>
          {change != null && changePct != null && (
            <span style={{ fontSize: '52px', fontWeight: 700, color: change > 0 ? OG.negative : OG.positive }}>
              {change > 0 ? '\u2197' : '\u2198'} {change > 0 ? '+' : ''}{changePct}% from last year
            </span>
          )}
          <span style={{ fontSize: '44px', color: OG.secondary }}>
            {`\u00A3${dailyCost}/day`}
          </span>
        </div>
      </div>

      {/* Tiny brand strip */}
      {ogBrand(councilName, council.type_name)}
    </div>
  );
}
