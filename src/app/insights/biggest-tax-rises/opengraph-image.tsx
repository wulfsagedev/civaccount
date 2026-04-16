import { ImageResponse } from 'next/og';
import { renderBiggestTaxRises } from '@/app/insights/_lib/og-renderers/biggest-tax-rises';
import { getGeistFonts } from '@/app/council/[slug]/card/_lib/og-shared';

export const runtime = 'nodejs';
export const alt = 'Biggest tax rises this year — CivAccount';
export const size = { width: 2400, height: 1260 };
export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(renderBiggestTaxRises(), { ...size, fonts: getGeistFonts() });
}
