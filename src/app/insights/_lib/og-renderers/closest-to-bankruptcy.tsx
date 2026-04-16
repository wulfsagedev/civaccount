import type { ReactElement } from 'react';
import { OG, ogWrap, ogBrandNational, formatPoundsShort } from './og-shared-insights';
import { getClosestToBankruptcy } from '@/lib/insights-stats';
import { getCouncilDisplayName } from '@/data/councils';

export function renderClosestToBankruptcy(): ReactElement {
  const { top, over10pct, councilsWithData } = getClosestToBankruptcy(5);
  const max = top[0]?.gapPounds ?? 1;

  return ogWrap(
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        height: '100%',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <span
            style={{
              fontSize: '40px',
              fontWeight: 600,
              color: OG.secondary,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
            }}
          >
            Closest to bankruptcy · 2025-26
          </span>
          <span
            style={{
              fontSize: '64px',
              fontWeight: 700,
              color: OG.text,
              letterSpacing: '-0.01em',
              lineHeight: 1.05,
            }}
          >
            {over10pct} of {councilsWithData} councils have a budget gap of 10% or more
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
          {top.map((r, i) => {
            const name = getCouncilDisplayName(r.council);
            const pct = (r.gapPounds / max) * 100;
            return (
              <div
                key={r.council.ons_code}
                style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'baseline',
                  }}
                >
                  <span style={{ fontSize: '42px', fontWeight: 600, color: OG.text }}>
                    {i + 1}. {name}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '16px' }}>
                    <span style={{ fontSize: '34px', fontWeight: 500, color: OG.secondary }}>
                      {r.gapPct.toFixed(0)}% of net
                    </span>
                    <span style={{ fontSize: '42px', fontWeight: 700, color: OG.negative }}>
                      {formatPoundsShort(r.gapPounds, 0)}
                    </span>
                  </div>
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
                      backgroundColor: OG.negative,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {ogBrandNational('Red flags')}
    </div>,
  );
}
