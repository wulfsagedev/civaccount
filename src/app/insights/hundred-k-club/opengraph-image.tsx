import { ImageResponse } from 'next/og';
import { renderHundredKClub } from '@/app/insights/_lib/og-renderers/hundred-k-club';
import { getGeistFonts } from '@/app/council/[slug]/card/_lib/og-shared';

export const runtime = 'nodejs';
export const alt = 'The £100k club — CivAccount';
export const size = { width: 2400, height: 1260 };
export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(renderHundredKClub(), { ...size, fonts: getGeistFonts() });
}
