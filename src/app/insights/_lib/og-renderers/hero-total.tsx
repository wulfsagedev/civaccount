import type { ReactElement } from 'react';
import { OG, ogWrap, ogBrandNational, formatPoundsShort } from './og-shared-insights';
import { getNationalSpendStats } from '@/lib/insights-stats';

export function renderHeroTotal(): ReactElement {
  const { totalSpend, councilCount, spendPerPerson } = getNationalSpendStats();

  return ogWrap(
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        height: '100%',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <span
          style={{
            fontSize: '44px',
            fontWeight: 600,
            color: OG.secondary,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
          }}
        >
          Total English council spending · 2025-26
        </span>
        <span
          style={{
            fontSize: '260px',
            fontWeight: 700,
            color: OG.text,
            letterSpacing: '-0.03em',
            lineHeight: 1,
          }}
        >
          {formatPoundsShort(totalSpend, 1)}
        </span>
        <span
          style={{
            fontSize: '52px',
            fontWeight: 500,
            color: OG.secondary,
          }}
        >
          Across {councilCount} councils · {formatPoundsShort(spendPerPerson, 0)} per person
        </span>
      </div>

      {ogBrandNational()}
    </div>,
  );
}
