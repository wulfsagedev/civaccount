import { ImageResponse } from 'next/og';
import { renderCapEveryYear } from '@/app/insights/_lib/og-renderers/cap-every-year';
import { getGeistFonts } from '@/app/council/[slug]/card/_lib/og-shared';

export const runtime = 'nodejs';
export const alt = 'Cap every year — CivAccount';
export const size = { width: 2400, height: 1260 };
export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(renderCapEveryYear(), { ...size, fonts: getGeistFonts() });
}
