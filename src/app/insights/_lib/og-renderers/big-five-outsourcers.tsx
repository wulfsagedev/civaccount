import type { ReactElement } from 'react';
import { OG, ogWrap, ogBrandNational, formatPoundsShort } from './og-shared-insights';
import { getBigFiveOutsourcers } from '@/lib/insights-stats';

export function renderBigFiveOutsourcers(): ReactElement {
  const { brands, sharePct, combinedSpend } = getBigFiveOutsourcers();

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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <span
            style={{
              fontSize: '40px',
              fontWeight: 600,
              color: OG.secondary,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
            }}
          >
            Share of top-supplier spend with Capita, Serco, Veolia, Biffa, Amey
          </span>
          <span
            style={{
              fontSize: '200px',
              fontWeight: 700,
              color: OG.text,
              letterSpacing: '-0.02em',
              lineHeight: 1,
            }}
          >
            {sharePct.toFixed(0)}%
          </span>
          <span style={{ fontSize: '40px', fontWeight: 500, color: OG.secondary }}>
            ≈ {formatPoundsShort(combinedSpend, 1)} across published top-supplier lists
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {brands.slice(0, 5).map((b) => (
            <div
              key={b.brand}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'baseline',
              }}
            >
              <span style={{ fontSize: '40px', fontWeight: 600, color: OG.text }}>
                {b.brand}
              </span>
              <span style={{ fontSize: '40px', fontWeight: 700, color: OG.text }}>
                {formatPoundsShort(b.totalSpend, 1)}
                <span style={{ fontSize: '32px', fontWeight: 500, color: OG.secondary, marginLeft: '16px' }}>
                  · {b.councilCount} council{b.councilCount === 1 ? '' : 's'}
                </span>
              </span>
            </div>
          ))}
        </div>
      </div>

      {ogBrandNational('The suppliers')}
    </div>,
  );
}
