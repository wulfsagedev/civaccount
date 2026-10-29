import type { Council } from '@/data/councils';
import type { ReactElement } from 'react';
import { getTotalBandD, getBillSplitYear } from '@/data/councils';
import { OG, ogWrap, ogBrand, formatCurrencyOG, MIN_FONT } from '../og-shared';

export function renderBillBreakdown(council: Council, councilName: string): ReactElement {
  const precepts = council.detailed?.precepts;
  if (!precepts?.length) return <div style={{ display: 'flex' }}>No data</div>;

  // The bill split's rows add up to its total to the penny (bill-split.mjs).
  // A county has no total — the district's share and any parish precept sit
  // on top — so its card shows the rows without a total, bar or percentages.
  const total = getTotalBandD(council);
  const year = getBillSplitYear(council);
  const colors = ['#ececec', '#a3a3a3', '#71717a', '#52525b', '#3a3a40'];

  return ogWrap(
    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%' }}>
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '48px' }}>
          <span style={{ fontSize: '72px', fontWeight: 700, color: OG.text }}>{total ? 'Where your bill goes' : 'Band D charges'}</span>
          {total && <span style={{ fontSize: '56px', fontWeight: 700, color: OG.text }}>{formatCurrencyOG(total, 2)}</span>}
        </div>

        {total && (
          <div style={{ display: 'flex', height: '56px', borderRadius: '28px', overflow: 'hidden', gap: '4px', marginBottom: '48px' }}>
            {precepts.map((p, i) => (
              <div key={p.authority} style={{ display: 'flex', width: `${(p.band_d / total) * 100}%`, height: '100%', backgroundColor: colors[i % colors.length] }} />
            ))}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          {precepts.map((p, i) => (
            <div key={p.authority} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                <div style={{ display: 'flex', width: '32px', height: '32px', borderRadius: '8px', backgroundColor: colors[i % colors.length] }} />
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '42px', color: OG.text }}>{p.authority}</span>
                  {p.includes_parish_average && (
                    <span style={{ fontSize: `${MIN_FONT}px`, color: OG.muted }}>Includes average parish and local council charge</span>
                  )}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '24px' }}>
                {total && <span style={{ fontSize: '36px', color: OG.muted }}>{((p.band_d / total) * 100).toFixed(0)}%</span>}
                <span style={{ fontSize: '42px', fontWeight: 700, color: OG.text }}>{formatCurrencyOG(p.band_d, 2)}</span>
              </div>
            </div>
          ))}
          {!total && (
            <span style={{ fontSize: `${MIN_FONT}px`, color: OG.muted }}>Plus your district council and any parish council</span>
          )}
        </div>
      </div>

      {ogBrand(councilName, council.type_name, year)}
    </div>
  );
}
