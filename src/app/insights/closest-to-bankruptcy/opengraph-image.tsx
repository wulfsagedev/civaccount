import { ImageResponse } from 'next/og';
import { renderClosestToBankruptcy } from '@/app/insights/_lib/og-renderers/closest-to-bankruptcy';
import { getGeistFonts } from '@/app/council/[slug]/card/_lib/og-shared';

export const runtime = 'nodejs';
export const alt = 'Closest to bankruptcy — CivAccount';
export const size = { width: 2400, height: 1260 };
export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(renderClosestToBankruptcy(), { ...size, fonts: getGeistFonts() });
}
