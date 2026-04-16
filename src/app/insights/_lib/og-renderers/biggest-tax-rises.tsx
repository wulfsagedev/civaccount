import type { ReactElement } from 'react';
import { OG, ogWrap, ogBrandNational } from './og-shared-insights';
import { getBiggestTaxRises, getAverageTaxRise } from '@/lib/insights-stats';
import { getCouncilDisplayName } from '@/data/councils';

export function renderBiggestTaxRises(): ReactElement {
  const top = getBiggestTaxRises(5);
  const avg = getAverageTaxRise();
  const max = top[0]?.changePct ?? 1;

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
            Biggest Band D tax rises · 2025-26
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
            National average rise: {avg.toFixed(1)}%
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
          {top.map((r, i) => {
            const name = getCouncilDisplayName(r.council);
            const pct = (r.changePct / max) * 100;
            return (
              <div key={r.council.ons_code} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
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
                  <span style={{ fontSize: '42px', fontWeight: 700, color: OG.negative }}>
                    +{r.changePct.toFixed(1)}%
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
                      backgroundColor: OG.negative,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {ogBrandNational('The bill')}
    </div>,
  );
}
