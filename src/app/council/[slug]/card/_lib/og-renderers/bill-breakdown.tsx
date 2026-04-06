import type { Council } from '@/data/councils';
import type { ReactElement } from 'react';
import { OG_COLORS, formatCurrencyOG } from '../og-shared';

export function renderBillBreakdown(council: Council, _councilName: string): ReactElement {
  const precepts = council.detailed?.precepts;
  if (!precepts?.length) return <div style={{ display: 'flex' }}>No data</div>;

  const total = precepts.reduce((sum, p) => sum + p.band_d, 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <div style={{ display: 'flex', fontSize: '32px', fontWeight: 700, color: OG_COLORS.text }}>
          Where your bill goes
        </div>
        <div style={{ display: 'flex', fontSize: '24px', fontWeight: 700, color: OG_COLORS.text }}>
          Total: {formatCurrencyOG(total, 2)}
        </div>
      </div>

      {/* Stacked bar */}
      <div style={{ display: 'flex', height: '32px', borderRadius: '16px', overflow: 'hidden', gap: '2px' }}>
        {precepts.map((p, i) => {
          const pct = (p.band_d / total) * 100;
          const colors = ['#1c1917', '#525252', '#737373', '#a3a3a3', '#d4d4d4'];
          return (
            <div
              key={p.authority}
              style={{
                display: 'flex',
                width: `${pct}%`,
                height: '100%',
                backgroundColor: colors[i % colors.length],
              }}
            />
          );
        })}
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '8px' }}>
        {precepts.map((p, i) => {
          const pct = ((p.band_d / total) * 100).toFixed(0);
          const colors = ['#1c1917', '#525252', '#737373', '#a3a3a3', '#d4d4d4'];
          return (
            <div key={p.authority} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ display: 'flex', width: '16px', height: '16px', borderRadius: '4px', backgroundColor: colors[i % colors.length] }} />
                <span style={{ fontSize: '20px', color: OG_COLORS.text }}>{p.authority}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px' }}>
                <span style={{ fontSize: '18px', color: OG_COLORS.muted }}>{pct}%</span>
                <span style={{ fontSize: '20px', fontWeight: 600, color: OG_COLORS.text }}>
                  {formatCurrencyOG(p.band_d, 2)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
