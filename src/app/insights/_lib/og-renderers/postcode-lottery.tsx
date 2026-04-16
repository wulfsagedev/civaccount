import type { ReactElement } from 'react';
import { OG, ogWrap, ogBrandNational, formatCurrencyOG } from './og-shared-insights';
import { getHeadlineExtremes } from '@/lib/insights-stats';
import { getCouncilDisplayName } from '@/data/councils';

export function renderPostcodeLottery(): ReactElement {
  const { cheapest, mostExpensive } = getHeadlineExtremes();
  const cheapestBandD = cheapest.council_tax!.band_d_2025;
  const priciestBandD = mostExpensive.council_tax!.band_d_2025;
  const gap = priciestBandD - cheapestBandD;

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
        <span
          style={{
            fontSize: '44px',
            fontWeight: 600,
            color: OG.secondary,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
          }}
        >
          England&apos;s council tax postcode lottery
        </span>

        <div style={{ display: 'flex', gap: '64px', alignItems: 'stretch' }}>
          {/* Cheapest */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              flex: 1,
              padding: '40px',
              backgroundColor: OG.card,
              borderRadius: '24px',
              border: `2px solid ${OG.border}`,
            }}
          >
            <span
              style={{
                fontSize: '36px',
                fontWeight: 600,
                color: OG.positive,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
              }}
            >
              Cheapest
            </span>
            <span
              style={{
                fontSize: '100px',
                fontWeight: 700,
                color: OG.text,
                letterSpacing: '-0.02em',
                lineHeight: 1,
              }}
            >
              {formatCurrencyOG(cheapestBandD, 0)}
            </span>
            <span style={{ fontSize: '40px', fontWeight: 600, color: OG.text }}>
              {getCouncilDisplayName(cheapest)}
            </span>
          </div>

          {/* Priciest */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              flex: 1,
              padding: '40px',
              backgroundColor: OG.card,
              borderRadius: '24px',
              border: `2px solid ${OG.border}`,
            }}
          >
            <span
              style={{
                fontSize: '36px',
                fontWeight: 600,
                color: OG.negative,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
              }}
            >
              Most expensive
            </span>
            <span
              style={{
                fontSize: '100px',
                fontWeight: 700,
                color: OG.text,
                letterSpacing: '-0.02em',
                lineHeight: 1,
              }}
            >
              {formatCurrencyOG(priciestBandD, 0)}
            </span>
            <span style={{ fontSize: '40px', fontWeight: 600, color: OG.text }}>
              {getCouncilDisplayName(mostExpensive)}
            </span>
          </div>
        </div>

        <span
          style={{
            fontSize: '44px',
            fontWeight: 500,
            color: OG.secondary,
          }}
        >
          A Band D gap of {formatCurrencyOG(gap, 0)} between all-in-one councils
        </span>
      </div>

      {ogBrandNational('The bill')}
    </div>,
  );
}
