import type { Council } from '@/data/councils';
import type { ReactElement } from 'react';
import { OG, ogWrap, ogBrand } from '../og-shared';

export function renderPerformance(council: Council, councilName: string): ReactElement {
  const kpis = council.detailed?.performance_kpis;
  if (!kpis?.length) return <div style={{ display: 'flex' }}>No data</div>;

  const top = kpis.slice(0, 6);
  const statusColors = { green: '#4ade80', amber: '#fbbf24', red: '#ef4444' };

  return ogWrap(
    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%' }}>
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
        <div style={{ display: 'flex', fontSize: '72px', fontWeight: 700, color: OG.text, marginBottom: '48px' }}>
          Council performance
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px' }}>
          {top.map((kpi, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
                padding: '28px 36px',
                borderRadius: '24px',
                backgroundColor: OG.surface,
                width: '680px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ display: 'flex', width: '24px', height: '24px', borderRadius: '50%', backgroundColor: statusColors[kpi.status] }} />
                <span style={{ fontSize: '34px', fontWeight: 600, color: OG.text }}>{kpi.metric}</span>
              </div>
              <span style={{ fontSize: '52px', fontWeight: 700, color: OG.text }}>{kpi.value}</span>
            </div>
          ))}
        </div>
      </div>

      {ogBrand(councilName, council.type_name)}
    </div>
  );
}
