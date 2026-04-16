import type { ReactElement } from 'react';
import { OG, ogWrap, ogBrandNational, formatCurrencyOG } from './og-shared-insights';
import { getCeoPayStats } from '@/lib/insights-stats';
import { getCouncilDisplayName } from '@/data/councils';

export function renderCeoPayLeague(): ReactElement {
  const { top, median, highestPaid } = getCeoPayStats(5);
  const max = highestPaid.total;

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
            Highest-paid council CEOs · 2025-26
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
            National median: {formatCurrencyOG(median, 0)}
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
          {top.map((entry, i) => {
            const name = getCouncilDisplayName(entry.council);
            const pct = max > 0 ? (entry.total / max) * 100 : 0;
            return (
              <div key={entry.council.ons_code} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
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
                  <span style={{ fontSize: '42px', fontWeight: 700, color: OG.text }}>
                    {formatCurrencyOG(entry.total, 0)}
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
                      backgroundColor: OG.bar,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {ogBrandNational('Workforce')}
    </div>,
  );
}
