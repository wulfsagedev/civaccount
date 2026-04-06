import type { Council } from '@/data/councils';
import type { ReactElement } from 'react';
import { OG_COLORS } from '../og-shared';

export function renderPerformance(council: Council, _councilName: string): ReactElement {
  const kpis = council.detailed?.performance_kpis;
  if (!kpis?.length) return <div style={{ display: 'flex' }}>No data</div>;

  const top6 = kpis.slice(0, 6);
  const statusColors = { green: '#16a34a', amber: '#f59e0b', red: '#dc2626' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', fontSize: '32px', fontWeight: 700, color: OG_COLORS.text }}>
        Council performance
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
        {top6.map((kpi, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              padding: '14px 18px',
              borderRadius: '12px',
              backgroundColor: 'rgba(0,0,0,0.03)',
              width: '330px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ display: 'flex', width: '12px', height: '12px', borderRadius: '50%', backgroundColor: statusColors[kpi.status] }} />
              <span style={{ fontSize: '16px', fontWeight: 600, color: OG_COLORS.text }}>
                {kpi.metric}
              </span>
            </div>
            <span style={{ fontSize: '24px', fontWeight: 700, color: OG_COLORS.text }}>
              {kpi.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
