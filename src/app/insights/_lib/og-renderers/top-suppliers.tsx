import type { ReactElement } from 'react';
import { OG, ogWrap, ogBrandNational, formatPoundsShort } from './og-shared-insights';
import { getTopSuppliersNational } from '@/lib/insights-stats';

export function renderTopSuppliers(): ReactElement {
  const { top, totalAggregateSpend } = getTopSuppliersNational(5);
  const maxSpend = top[0]?.totalSpend ?? 1;

  return ogWrap(
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        height: '100%',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '36px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <span
            style={{
              fontSize: '40px',
              fontWeight: 600,
              color: OG.secondary,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
            }}
          >
            Who really gets your council tax
          </span>
          <span
            style={{
              fontSize: '112px',
              fontWeight: 700,
              color: OG.text,
              letterSpacing: '-0.02em',
              lineHeight: 1,
            }}
          >
            {formatPoundsShort(totalAggregateSpend, 1)}
          </span>
          <span style={{ fontSize: '40px', fontWeight: 500, color: OG.secondary }}>
            to the top {top.length} private suppliers to English councils
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
          {top.map((s, i) => {
            const pct = (s.totalSpend / maxSpend) * 100;
            return (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'baseline',
                  }}
                >
                  <span style={{ fontSize: '40px', fontWeight: 600, color: OG.text }}>
                    {i + 1}. {s.name}
                  </span>
                  <span style={{ fontSize: '40px', fontWeight: 700, color: OG.text }}>
                    {formatPoundsShort(s.totalSpend, 1)}
                  </span>
                </div>
                <div
                  style={{
                    display: 'flex',
                    height: '12px',
                    borderRadius: '9999px',
                    backgroundColor: OG.barBg,
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      width: `${pct}%`,
                      height: '100%',
                      borderRadius: '9999px',
                      backgroundColor: OG.accent,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {ogBrandNational('Suppliers')}
    </div>,
  );
}
