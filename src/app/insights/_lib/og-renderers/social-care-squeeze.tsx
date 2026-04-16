import type { ReactElement } from 'react';
import { OG, ogWrap, ogBrandNational } from './og-shared-insights';
import { getSocialCareSqueeze } from '@/lib/insights-stats';
import { getCouncilDisplayName } from '@/data/councils';

export function renderSocialCareSqueeze(): ReactElement {
  const { nationalPct, medianPct, top, over60pct } = getSocialCareSqueeze(5);

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
            Social care share of council spending
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
            {nationalPct.toFixed(0)}p
          </span>
          <span style={{ fontSize: '44px', fontWeight: 500, color: OG.secondary }}>
            of every £1 nationally · median council {medianPct.toFixed(0)}% · {over60pct} councils over 60%
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
            Most squeezed
          </span>
          {top.slice(0, 3).map((entry, i) => {
            const name = getCouncilDisplayName(entry.council);
            return (
              <div
                key={entry.council.ons_code}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'baseline',
                }}
              >
                <span style={{ fontSize: '40px', fontWeight: 600, color: OG.text }}>
                  {i + 1}. {name}
                </span>
                <span style={{ fontSize: '40px', fontWeight: 700, color: OG.negative }}>
                  {entry.squeezePct.toFixed(0)}%
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {ogBrandNational('The spend')}
    </div>,
  );
}
