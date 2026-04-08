import { ImageResponse } from 'next/og';
import { getCouncilBySlug, getCouncilDisplayName, getCouncilPopulation, councils } from '@/data/councils';
import { OG, ogWrap, ogBrand, getGeistFonts, formatCurrencyOG } from './card/_lib/og-shared';

export const runtime = 'nodejs';
export const alt = 'Council tax and budget breakdown';
export const size = { width: 2400, height: 1260 };
export const contentType = 'image/png';

function getRankWithinType(council: { type: string; council_tax?: { band_d_2025?: number | null } }): { rank: number; total: number } | null {
  const bandD = council.council_tax?.band_d_2025;
  if (bandD == null) return null;

  const peers = councils.filter(c => c.type === council.type && c.council_tax?.band_d_2025 != null);
  const sorted = [...peers].sort((a, b) => (a.council_tax!.band_d_2025! - b.council_tax!.band_d_2025!));
  const rank = sorted.findIndex(c => c.council_tax!.band_d_2025 === bandD) + 1;
  return { rank, total: sorted.length };
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
  const bandD = council.council_tax?.band_d_2025;
  const bandDPrev = council.council_tax?.band_d_2024;
  const population = getCouncilPopulation(council.name);
  const totalService = council.budget?.total_service;

  const changePct = bandD && bandDPrev ? ((bandD - bandDPrev) / bandDPrev * 100) : null;
  const spendingPerResident = totalService && population ? Math.round((totalService * 1000) / population) : null;
  const ranking = council ? getRankWithinType(council) : null;

  const stats: { label: string; value: string }[] = [];
  if (changePct !== null) {
    const sign = changePct >= 0 ? '+' : '';
    stats.push({ label: 'Year-on-year', value: `${sign}${changePct.toFixed(1)}%` });
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
          {bandD && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '56px' }}>
              <span style={{ fontSize: '44px', fontWeight: 600, color: OG.secondary, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Band D · Council Tax
              </span>
              <span style={{ fontSize: '120px', fontWeight: 700, color: OG.text, letterSpacing: '-0.02em', lineHeight: 1 }}>
                {formatCurrencyOG(bandD, 2)}<span style={{ fontSize: '56px', fontWeight: 500, color: OG.secondary }}> /year</span>
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

        {/* Brand strip */}
        {ogBrand(displayName, council.type_name)}
      </div>
    ),
    ogOptions
  );
}
