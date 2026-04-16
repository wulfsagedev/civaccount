import { ImageResponse } from 'next/og';
import { renderTaxCapBreakers } from '@/app/insights/_lib/og-renderers/tax-cap-breakers';
import { getGeistFonts } from '@/app/council/[slug]/card/_lib/og-shared';

export const runtime = 'nodejs';
export const alt = 'Above the council tax cap — CivAccount';
export const size = { width: 2400, height: 1260 };
export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(renderTaxCapBreakers(), { ...size, fonts: getGeistFonts() });
}
