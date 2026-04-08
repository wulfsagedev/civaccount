import { ImageResponse } from 'next/og';
import { getCouncilBySlug, getCouncilDisplayName, getCouncilPopulation, formatCurrency } from '@/data/councils';
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
  const bandDA = councilA.council_tax?.band_d_2025;
  const bandDB = councilB.council_tax?.band_d_2025;
  const popA = getCouncilPopulation(councilA.name);
  const popB = getCouncilPopulation(councilB.name);
  const spendA = councilA.budget?.total_service && popA ? Math.round((councilA.budget.total_service * 1000) / popA) : null;
  const spendB = councilB.budget?.total_service && popB ? Math.round((councilB.budget.total_service * 1000) / popB) : null;
  const ceoA = councilA.detailed?.chief_executive_salary;
  const ceoB = councilB.detailed?.chief_executive_salary;

  // Build comparison rows
  const rows: { label: string; a: string; b: string }[] = [];
  if (bandDA && bandDB) rows.push({ label: 'Band D', a: formatCurrencyOG(bandDA, 2), b: formatCurrencyOG(bandDB, 2) });
  if (spendA && spendB) rows.push({ label: 'Per resident', a: formatCurrencyOG(spendA), b: formatCurrencyOG(spendB) });
  if (ceoA && ceoB) rows.push({ label: 'CEO salary', a: formatCurrencyOG(ceoA), b: formatCurrencyOG(ceoB) });

  const nameASize = nameA.length > 25 ? 56 : 64;
  const nameBSize = nameB.length > 25 ? 56 : 64;

  return new ImageResponse(
    ogWrap(
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%' }}>
        {/* Title */}
        <div style={{ display: 'flex', fontSize: '48px', fontWeight: 600, color: OG.secondary, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Council Comparison · 2025-26
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
              <div key={row.label} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ fontSize: '36px', fontWeight: 600, color: OG.secondary, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{row.label}</span>
                <span style={{ fontSize: '56px', fontWeight: 700, color: OG.text }}>{row.a}</span>
              </div>
            ))}
          </div>

          {/* VS divider */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
            <div style={{ width: '2px', height: '200px', backgroundColor: OG.border }} />
            <span style={{ fontSize: '48px', fontWeight: 700, color: OG.secondary }}>vs</span>
            <div style={{ width: '2px', height: '200px', backgroundColor: OG.border }} />
          </div>

          {/* Column B */}
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, gap: '32px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <span style={{ fontSize: '36px', fontWeight: 600, color: OG.secondary, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{councilB.type_name}</span>
              <span style={{ fontSize: `${nameBSize}px`, fontWeight: 700, color: OG.text, lineHeight: 1.1 }}>{nameB}</span>
            </div>
            {rows.map(row => (
              <div key={row.label} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ fontSize: '36px', fontWeight: 600, color: OG.secondary, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{row.label}</span>
                <span style={{ fontSize: '56px', fontWeight: 700, color: OG.text }}>{row.b}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Brand */}
        {ogBrand(`${nameA} vs ${nameB}`)}
      </div>
    ),
    ogOptions
  );
}
