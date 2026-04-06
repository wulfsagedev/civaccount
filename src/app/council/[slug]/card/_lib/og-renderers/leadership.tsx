import type { Council } from '@/data/councils';
import type { ReactElement } from 'react';
import { OG_COLORS } from '../og-shared';

export function renderLeadership(council: Council, councilName: string): ReactElement {
  const d = council.detailed;
  if (!d) return <div style={{ display: 'flex' }}>No data</div>;

  const leader = d.council_leader;
  const ceo = d.chief_executive;
  const cabinetCount = d.cabinet?.length || 0;
  const totalCouncillors = d.total_councillors;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', fontSize: '32px', fontWeight: 700, color: OG_COLORS.text }}>
        Who runs {councilName}
      </div>

      <div style={{ display: 'flex', gap: '40px' }}>
        {/* Leader */}
        {leader && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
            <span style={{ fontSize: '16px', color: OG_COLORS.muted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Council Leader
            </span>
            <span style={{ fontSize: '36px', fontWeight: 700, color: OG_COLORS.text, lineHeight: 1.1 }}>
              {leader}
            </span>
          </div>
        )}

        {/* CEO */}
        {ceo && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
            <span style={{ fontSize: '16px', color: OG_COLORS.muted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Chief Executive
            </span>
            <span style={{ fontSize: '36px', fontWeight: 700, color: OG_COLORS.text, lineHeight: 1.1 }}>
              {ceo}
            </span>
          </div>
        )}
      </div>

      {/* Summary stats */}
      <div style={{ display: 'flex', gap: '32px', marginTop: '8px' }}>
        {cabinetCount > 0 && (
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <span style={{ fontSize: '32px', fontWeight: 700, color: OG_COLORS.text }}>{cabinetCount}</span>
            <span style={{ fontSize: '20px', color: OG_COLORS.secondary }}>cabinet members</span>
          </div>
        )}
        {totalCouncillors && (
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <span style={{ fontSize: '32px', fontWeight: 700, color: OG_COLORS.text }}>{totalCouncillors}</span>
            <span style={{ fontSize: '20px', color: OG_COLORS.secondary }}>councillors</span>
          </div>
        )}
      </div>
    </div>
  );
}
