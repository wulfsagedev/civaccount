import { ImageResponse } from 'next/og';
import { renderCeoPayLeague } from '@/app/insights/_lib/og-renderers/ceo-pay-league';
import { getGeistFonts } from '@/app/council/[slug]/card/_lib/og-shared';

export const runtime = 'nodejs';
export const alt = 'Highest-paid council CEOs — CivAccount';
export const size = { width: 2400, height: 1260 };
export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(renderCeoPayLeague(), { ...size, fonts: getGeistFonts() });
}
