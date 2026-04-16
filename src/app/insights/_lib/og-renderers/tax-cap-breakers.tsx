import type { ReactElement } from 'react';
import { OG, ogWrap, ogBrandNational } from './og-shared-insights';
import { getTaxCapBreakers } from '@/lib/insights-stats';
import { getCouncilDisplayName } from '@/data/councils';

export function renderTaxCapBreakers(): ReactElement {
  const { atOrOverCap, overCap } = getTaxCapBreakers(4.99);

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
            Councils at or above the 4.99% Band D cap · 2025-26
          </span>
          <span
            style={{
              fontSize: '240px',
              fontWeight: 700,
              color: OG.text,
              letterSpacing: '-0.02em',
              lineHeight: 1,
            }}
          >
            {atOrOverCap.length}
          </span>
          <span style={{ fontSize: '40px', fontWeight: 500, color: OG.secondary }}>
            {overCap.length} exceeded the cap with special government permission
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <span
            style={{
              fontSize: '32px',
              fontWeight: 600,
              color: OG.secondary,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
            }}
          >
            Biggest rises above the cap
          </span>
          {atOrOverCap.slice(0, 3).map((e, i) => (
            <div
              key={e.council.ons_code}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'baseline',
              }}
            >
              <span style={{ fontSize: '40px', fontWeight: 600, color: OG.text }}>
                {i + 1}. {getCouncilDisplayName(e.council)}
              </span>
              <span style={{ fontSize: '40px', fontWeight: 700, color: OG.negative }}>
                +{e.risePct.toFixed(1)}%
              </span>
            </div>
          ))}
        </div>
      </div>

      {ogBrandNational('The red flags')}
    </div>,
  );
}
