import { ImageResponse } from 'next/og';
import { renderPostcodeLottery } from '@/app/insights/_lib/og-renderers/postcode-lottery';
import { getGeistFonts } from '@/app/council/[slug]/card/_lib/og-shared';

export const runtime = 'nodejs';
export const alt = "England's council tax postcode lottery — CivAccount";
export const size = { width: 2400, height: 1260 };
export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(renderPostcodeLottery(), { ...size, fonts: getGeistFonts() });
}
