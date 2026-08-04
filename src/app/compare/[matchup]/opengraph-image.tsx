import { ImageResponse } from 'next/og';
import { getCouncilBySlug, getCouncilDisplayName, getCouncilPopulation, getAreaBandD } from '@/data/councils';
import { OG, ogWrap, ogBrand, getGeistFonts, formatCurrencyOG } from '@/app/council/[slug]/card/_lib/og-shared';

export const runtime = 'nodejs';
export const alt = 'Council comparison';
export const size = { width: 2400, height: 1260 };
export const contentType = 'image/png';

const ogOptions = { ...size, fonts: getGeistFonts() };

export default async function Image({ params }: { params: Promise<{ matchup: string }> }) {
  const { matchup } = await params;
  const parts = matchup.split('-vs-');

  if (parts.length !== 2) {
    return new ImageResponse(
      ogWrap(
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%' }}>
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'center' }}>
            <div style={{ fontSize: '96px', fontWeight: 700, color: OG.text }}>Compare Councils</div>
            <div style={{ fontSize: '48px', color: OG.secondary, marginTop: '24px' }}>Side-by-side council tax and spending</div>
          </div>
          {ogBrand('CivAccount')}
        </div>
      ),
      ogOptions
    );
  }

  const councilA = getCouncilBySlug(parts[0]);
  const councilB = getCouncilBySlug(parts[1]);

  if (!councilA || !councilB) {
    return new ImageResponse(
      ogWrap(
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%' }}>
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'center' }}>
            <div style={{ fontSize: '96px', fontWeight: 700, color: OG.text }}>Compare Councils</div>
          </div>
          {ogBrand('CivAccount')}
        </div>
      ),
      ogOptions
    );
  }

  const nameA = getCouncilDisplayName(councilA);
  const nameB = getCouncilDisplayName(councilB);
  // Most recent verified AREA Band D per side — years can differ (billing
  // authority 2026-27 vs county council 2025-26), so every row label carries
  // its own year per column.
  const areaA = getAreaBandD(councilA);
  const areaB = getAreaBandD(councilB);
  const popA = getCouncilPopulation(councilA.name);
  const popB = getCouncilPopulation(councilB.name);
  const spendA = councilA.budget?.total_service && popA ? Math.round((councilA.budget.total_service * 1000) / popA) : null;
  const spendB = councilB.budget?.total_service && popB ? Math.round((councilB.budget.total_service * 1000) / popB) : null;
  const ceoA = councilA.detailed?.chief_executive_salary;
  const ceoB = councilB.detailed?.chief_executive_salary;

  // Build comparison rows — each side gets its own label so years stay honest
  const rows: { labelA: string; labelB: string; a: string; b: string }[] = [];
  if (areaA && areaB) {
    rows.push({
      labelA: `Band D · ${areaA.year}`,
      labelB: `Band D · ${areaB.year}`,
      a: formatCurrencyOG(areaA.value, 2),
      b: formatCurrencyOG(areaB.value, 2),
    });
  }
  if (spendA && spendB) rows.push({ labelA: 'Per resident · 2025-26', labelB: 'Per resident · 2025-26', a: formatCurrencyOG(spendA), b: formatCurrencyOG(spendB) });
  if (ceoA && ceoB) rows.push({ labelA: 'CEO salary', labelB: 'CEO salary', a: formatCurrencyOG(ceoA), b: formatCurrencyOG(ceoB) });

  const nameASize = nameA.length > 25 ? 56 : 64;
  const nameBSize = nameB.length > 25 ? 56 : 64;

  return new ImageResponse(
    ogWrap(
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%' }}>
        {/* Title — no single year: each figure below carries its own year */}
        <div style={{ display: 'flex', fontSize: '48px', fontWeight: 600, color: OG.secondary, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Council Comparison
        </div>

        {/* Two-column comparison */}
        <div style={{ display: 'flex', gap: '64px', flex: 1, alignItems: 'center' }}>
          {/* Column A */}
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, gap: '32px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <span style={{ fontSize: '36px', fontWeight: 600, color: OG.secondary, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{councilA.type_name}</span>
              <span style={{ fontSize: `${nameASize}px`, fontWeight: 700, color: OG.text, lineHeight: 1.1 }}>{nameA}</span>
            </div>
            {rows.map(row => (
              <div key={row.labelA} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ fontSize: '36px', fontWeight: 600, color: OG.secondary, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{row.labelA}</span>
                <span style={{ fontSize: '56px', fontWeight: 700, color: OG.text }}>{row.a}</span>
              </div>
            ))}
          </div>

          {/* Divider */}
          <div style={{ display: 'flex', width: '3px', height: '100%', backgroundColor: OG.border }} />

          {/* Column B */}
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, gap: '32px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <span style={{ fontSize: '36px', fontWeight: 600, color: OG.secondary, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{councilB.type_name}</span>
              <span style={{ fontSize: `${nameBSize}px`, fontWeight: 700, color: OG.text, lineHeight: 1.1 }}>{nameB}</span>
            </div>
            {rows.map(row => (
              <div key={row.labelB} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ fontSize: '36px', fontWeight: 600, color: OG.secondary, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{row.labelB}</span>
                <span style={{ fontSize: '56px', fontWeight: 700, color: OG.text }}>{row.b}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Brand — no year stamp: each figure above is labelled per-year */}
        {ogBrand(`${nameA} vs ${nameB}`, undefined, null)}
      </div>
    ),
    ogOptions
  );
}
