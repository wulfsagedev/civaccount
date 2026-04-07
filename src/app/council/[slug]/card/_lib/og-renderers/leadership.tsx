import type { Council } from '@/data/councils';
import type { ReactElement } from 'react';
import { OG, ogWrap, ogBrand } from '../og-shared';

export function renderLeadership(council: Council, councilName: string): ReactElement {
  const d = council.detailed;
  if (!d) return <div style={{ display: 'flex' }}>No data</div>;

  const leader = d.council_leader;
  const ceo = d.chief_executive;
  const cabinetCount = d.cabinet?.length || 0;
  const totalCouncillors = d.total_councillors;

  return ogWrap(
    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%' }}>
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'center' }}>
        <div style={{ display: 'flex', fontSize: '72px', fontWeight: 700, color: OG.text, marginBottom: '64px' }}>
          Who runs {councilName}
        </div>

        <div style={{ display: 'flex', gap: '80px', marginBottom: '56px' }}>
          {leader && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
              <span style={{ fontSize: '32px', color: OG.muted, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Council Leader</span>
              <span style={{ fontSize: '72px', fontWeight: 700, color: OG.text, lineHeight: 1.1 }}>{leader}</span>
            </div>
          )}
          {ceo && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
              <span style={{ fontSize: '32px', color: OG.muted, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Chief Executive</span>
              <span style={{ fontSize: '72px', fontWeight: 700, color: OG.text, lineHeight: 1.1 }}>{ceo}</span>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: '64px' }}>
          {cabinetCount > 0 && (
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '16px' }}>
              <span style={{ fontSize: '72px', fontWeight: 700, color: OG.accent }}>{cabinetCount}</span>
              <span style={{ fontSize: '44px', color: OG.secondary }}>cabinet members</span>
            </div>
          )}
          {totalCouncillors && (
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '16px' }}>
              <span style={{ fontSize: '72px', fontWeight: 700, color: OG.accent }}>{totalCouncillors}</span>
              <span style={{ fontSize: '44px', color: OG.secondary }}>councillors</span>
            </div>
          )}
        </div>
      </div>

      {ogBrand(councilName, council.type_name)}
    </div>
  );
}
