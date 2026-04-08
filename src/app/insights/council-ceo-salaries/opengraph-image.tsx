import { ImageResponse } from 'next/og';
import { councils, formatCurrency } from '@/data/councils';
import { OG, ogWrap, getGeistFonts } from '@/app/council/[slug]/card/_lib/og-shared';

export const runtime = 'nodejs';
export const alt = 'Council CEO Salaries 2025-26';
export const size = { width: 2400, height: 1260 };
export const contentType = 'image/png';

export default async function Image() {
  const withSalary = councils.filter(c => c.detailed?.chief_executive_salary);
  const avgSalary = withSalary.reduce((s, c) => s + c.detailed!.chief_executive_salary!, 0) / withSalary.length;

  return new ImageResponse(
    ogWrap(
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%' }}>
        <span style={{ fontSize: '48px', fontWeight: 700, color: OG.text }}>CivAccount</span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <span style={{ fontSize: '96px', fontWeight: 700, color: OG.text, letterSpacing: '-0.02em', lineHeight: 1.05 }}>
            Council CEO Salaries
          </span>
          <span style={{ fontSize: '48px', fontWeight: 500, color: OG.secondary }}>
            Average CEO salary: {formatCurrency(Math.round(avgSalary), { decimals: 0 })} across {withSalary.length} councils
          </span>
        </div>
        <span style={{ fontSize: '44px', fontWeight: 500, color: OG.secondary }}>England 2025-26 · Published pay policy data</span>
      </div>
    ),
    { ...size, fonts: getGeistFonts() }
  );
}
