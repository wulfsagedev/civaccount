import type { ReactElement } from 'react';
import { OG, ogWrap, ogBrandNational } from './og-shared-insights';
import { getHundredKClub } from '@/lib/insights-stats';
import { getCouncilDisplayName } from '@/data/councils';

export function renderHundredKClub(): ReactElement {
  const { totalStaff, councilsWithAny, councilsDisclosing, medianPerCouncil, top } =
    getHundredKClub(5);

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
            Council staff earning £100,000 or more
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
            {totalStaff.toLocaleString('en-GB')}
          </span>
          <span style={{ fontSize: '40px', fontWeight: 500, color: OG.secondary }}>
            across {councilsWithAny} of {councilsDisclosing} councils · median {medianPerCouncil} per council
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
            Most £100k+ staff
          </span>
          {top.slice(0, 3).map((e, i) => (
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
              <span style={{ fontSize: '40px', fontWeight: 700, color: OG.text }}>
                {e.count.toLocaleString('en-GB')}
              </span>
            </div>
          ))}
        </div>
      </div>

      {ogBrandNational('The workforce')}
    </div>,
  );
}
