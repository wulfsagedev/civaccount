import { ImageResponse } from 'next/og';
import { renderBigFiveOutsourcers } from '@/app/insights/_lib/og-renderers/big-five-outsourcers';
import { getGeistFonts } from '@/app/council/[slug]/card/_lib/og-shared';

export const runtime = 'nodejs';
export const alt = 'The Big Five outsourcers — CivAccount';
export const size = { width: 2400, height: 1260 };
export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(renderBigFiveOutsourcers(), { ...size, fonts: getGeistFonts() });
}
