import { ImageResponse } from 'next/og';
import { getCouncilBySlug, getCouncilDisplayName, getCouncilPopulation, getAreaBandD, getAreaBandDChange, councils, type Council } from '@/data/councils';
import { OG, ogWrap, ogBrand, getGeistFonts, formatCurrencyOG } from './card/_lib/og-shared';

export const runtime = 'nodejs';
export const alt = 'Council tax and budget breakdown';
export const size = { width: 2400, height: 1260 };
export const contentType = 'image/png';

// Rank by the most recent verified area Band D. Peers share a council type,
// so getAreaBandD returns the same year for every member — never mixed-year.
function getRankWithinType(council: Council): { rank: number; total: number } | null {
  const bandD = getAreaBandD(council)?.value;
  if (bandD == null) return null;

  const peerValues = councils
    .filter(c => c.type === council.type)
    .map(c => getAreaBandD(c)?.value)
    .filter((v): v is number => v != null)
    .sort((a, b) => a - b);
  const rank = peerValues.findIndex(v => v === bandD) + 1;
  if (rank === 0) return null;
  return { rank, total: peerValues.length };
}

function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

const ogOptions = { ...size, fonts: getGeistFonts() };

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const council = getCouncilBySlug(slug);

  if (!council) {
    return new ImageResponse(
      ogWrap(
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%' }}>
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'center' }}>
            <div style={{ fontSize: '120px', fontWeight: 700, color: OG.text, lineHeight: 1.1 }}>CivAccount</div>
            <div style={{ fontSize: '56px', color: OG.secondary, marginTop: '24px' }}>Where your council tax goes</div>
          </div>
          {ogBrand('CivAccount')}
        </div>
      ),
      ogOptions
    );
  }

  const displayName = getCouncilDisplayName(council);
  // Most recent verified AREA Band D — 2026-27 for billing authorities,
  // 2025-26 fallback for county councils. The year renders next to the number.
  const area = getAreaBandD(council);
  const areaChange = getAreaBandDChange(council);
  const population = getCouncilPopulation(council.name);
  const totalService = council.budget?.total_service;

  const spendingPerResident = totalService && population ? Math.round((totalService * 1000) / population) : null;
  const ranking = council ? getRankWithinType(council) : null;

  const stats: { label: string; value: string }[] = [];
  if (areaChange !== null) {
    const sign = areaChange.percent >= 0 ? '+' : '';
    stats.push({ label: `vs ${areaChange.fromYear}`, value: `${sign}${areaChange.percent.toFixed(1)}%` });
  }
  if (spendingPerResident !== null) {
    stats.push({ label: 'Per resident', value: formatCurrencyOG(spendingPerResident) });
  }
  if (ranking) {
    stats.push({ label: council.type_name || 'Rank', value: `${ordinal(ranking.rank)} of ${ranking.total}` });
  }

  const nameFontSize = displayName.length > 30 ? 96 : displayName.length > 20 ? 112 : 128;

  return new ImageResponse(
    ogWrap(
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%' }}>
        {/* Top section — council identity */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', fontSize: '44px', fontWeight: 600, color: OG.secondary, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '16px' }}>
            {council.type_name || 'Council'}
          </div>
          <div style={{ display: 'flex', fontSize: `${nameFontSize}px`, fontWeight: 700, color: OG.text, letterSpacing: '-0.02em', lineHeight: 1.05 }}>
            {displayName}
          </div>
        </div>

        {/* Middle section — hero number + stats */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {area && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '56px' }}>
              <span style={{ fontSize: '44px', fontWeight: 600, color: OG.secondary, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                {`Band D · Council Tax ${area.year}`}
              </span>
              <span style={{ fontSize: '120px', fontWeight: 700, color: OG.text, letterSpacing: '-0.02em', lineHeight: 1 }}>
                {formatCurrencyOG(area.value, 2)}<span style={{ fontSize: '56px', fontWeight: 500, color: OG.secondary }}> /year</span>
              </span>
            </div>
          )}

          {stats.length > 0 && (
            <div style={{ display: 'flex', gap: '80px' }}>
              {stats.map((stat) => (
                <div key={stat.label} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <span style={{ fontSize: '40px', fontWeight: 600, color: OG.secondary, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    {stat.label}
                  </span>
                  <span style={{ fontSize: '56px', fontWeight: 700, color: OG.text }}>
                    {stat.value}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Brand strip — stamped with the hero figure's year */}
        {ogBrand(displayName, council.type_name, area?.year ?? '2025-26')}
      </div>
    ),
    ogOptions
  );
}
