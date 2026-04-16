import type { ReactElement } from 'react';
import { OG, ogWrap, ogBrandNational } from './og-shared-insights';
import { getWhereEveryPoundGoes } from '@/lib/insights-stats';

export function renderWhereEveryPoundGoes(): ReactElement {
  const services = getWhereEveryPoundGoes().slice(0, 6);

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
            fontSize: '40px',
            fontWeight: 600,
            color: OG.secondary,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
          }}
        >
          Where every £1 goes · English councils 2025-26
        </span>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
          {services.map((s) => (
            <div
              key={s.key}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'baseline',
                }}
              >
                <span style={{ fontSize: '38px', fontWeight: 600, color: OG.text }}>
                  {s.name}
                </span>
                <span style={{ fontSize: '44px', fontWeight: 700, color: OG.text }}>
                  {s.pence.toFixed(0)}p
                </span>
              </div>
              <div
                style={{
                  display: 'flex',
                  height: '18px',
                  backgroundColor: OG.muted,
                  borderRadius: '9999px',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    width: `${s.pence}%`,
                    backgroundColor: OG.text,
                    borderRadius: '9999px',
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {ogBrandNational('The spend')}
    </div>,
  );
}
