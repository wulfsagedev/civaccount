import type { ReactElement } from 'react';
import { OG, ogWrap, ogBrandNational } from './og-shared-insights';
import { getCapEveryYear } from '@/lib/insights-stats';
import { getCouncilDisplayName } from '@/data/councils';

export function renderCapEveryYear(): ReactElement {
  const { bothYearsAtCap, bothYearsOverCap } = getCapEveryYear(4.99);

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
            Councils at the 4.99% cap in both 2024 and 2025
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
            {bothYearsAtCap.length}
          </span>
          <span style={{ fontSize: '40px', fontWeight: 500, color: OG.secondary }}>
            {bothYearsOverCap.length} strictly exceeded the cap in both years
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
            Biggest 2-year compound rise
          </span>
          {bothYearsAtCap.slice(0, 3).map((e, i) => (
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
                +{e.compoundPct.toFixed(1)}%
              </span>
            </div>
          ))}
        </div>
      </div>

      {ogBrandNational('The red flags')}
    </div>,
  );
}
