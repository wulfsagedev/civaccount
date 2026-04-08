import { ImageResponse } from 'next/og';
import { getCouncilBySlug, getCouncilDisplayName } from '@/data/councils';
import { getGeistFonts } from '../card/_lib/og-shared';
import { renderTaxCard } from '../card/_lib/og-renderers/tax-card';

export const runtime = 'nodejs';
export const alt = 'Council tax receipt';
export const size = { width: 2400, height: 1260 };
export const contentType = 'image/png';

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const council = getCouncilBySlug(slug);

  if (!council || !council.council_tax?.band_d_2025) {
    const { ogWrap, ogBrand, OG } = await import('../card/_lib/og-shared');
    return new ImageResponse(
      ogWrap(
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%' }}>
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'center' }}>
            <div style={{ fontSize: '96px', fontWeight: 700, color: OG.text }}>Council Tax Card</div>
          </div>
          {ogBrand('CivAccount')}
        </div>
      ),
      { ...size, fonts: getGeistFonts() }
    );
  }

  const displayName = getCouncilDisplayName(council);
  return new ImageResponse(renderTaxCard(council, displayName), { ...size, fonts: getGeistFonts() });
}
