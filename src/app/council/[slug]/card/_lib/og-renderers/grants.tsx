import type { Council } from '@/data/councils';
import type { ReactElement } from 'react';
import { OG_COLORS, formatCurrencyOG } from '../og-shared';

export function renderGrants(council: Council, _councilName: string): ReactElement {
  const grants = council.detailed?.grant_payments;
  if (!grants?.length) return <div style={{ display: 'flex' }}>No data</div>;

  const top5 = grants.slice(0, 5);
  const maxAmount = top5[0]?.amount || 1;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ display: 'flex', fontSize: '32px', fontWeight: 700, color: OG_COLORS.text }}>
        Grant payments
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '4px' }}>
        {top5.map((g, i) => {
          const pct = (g.amount / maxAmount) * 100;
          return (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span style={{ fontSize: '20px', fontWeight: 600, color: OG_COLORS.text }}>{g.recipient}</span>
                <span style={{ fontSize: '20px', fontWeight: 600, color: OG_COLORS.text }}>
                  {formatCurrencyOG(g.amount, 0)}
                </span>
              </div>
              <div style={{ display: 'flex', height: '6px', borderRadius: '9999px', backgroundColor: '#e5e5e5', overflow: 'hidden' }}>
                <div style={{ display: 'flex', width: `${pct}%`, height: '100%', borderRadius: '9999px', backgroundColor: OG_COLORS.bar }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
