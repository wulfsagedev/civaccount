import type { Council } from '@/data/councils';
import type { ReactElement } from 'react';
import { OG, ogWrap, ogBrand, formatCurrencyOG } from '../og-shared';

export function renderSuppliers(council: Council, councilName: string): ReactElement {
  const suppliers = council.detailed?.top_suppliers;
  if (!suppliers?.length) return <div style={{ display: 'flex' }}>No data</div>;

  const top = suppliers.slice(0, 5);
  const maxSpend = top[0]?.annual_spend || 1;

  return ogWrap(
    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%' }}>
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
        <div style={{ display: 'flex', fontSize: '72px', fontWeight: 700, color: OG.text, marginBottom: '48px' }}>
          Top suppliers
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          {top.map((s, i) => {
            const pct = (s.annual_spend / maxSpend) * 100;
            return (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <span style={{ fontSize: '42px', fontWeight: 600, color: OG.text }}>{s.name}</span>
                  <span style={{ fontSize: '42px', fontWeight: 700, color: OG.text }}>{formatCurrencyOG(s.annual_spend, 0)}</span>
                </div>
                <div style={{ display: 'flex', height: '16px', borderRadius: '9999px', backgroundColor: OG.barBg, overflow: 'hidden' }}>
                  <div style={{ display: 'flex', width: `${pct}%`, height: '100%', borderRadius: '9999px', backgroundColor: OG.bar }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {ogBrand(councilName, council.type_name)}
    </div>
  );
}
