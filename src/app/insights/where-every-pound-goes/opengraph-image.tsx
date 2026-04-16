import { ImageResponse } from 'next/og';
import { renderWhereEveryPoundGoes } from '@/app/insights/_lib/og-renderers/where-every-pound-goes';
import { getGeistFonts } from '@/app/council/[slug]/card/_lib/og-shared';

export const runtime = 'nodejs';
export const alt = 'Where every £1 of English council spending goes — CivAccount';
export const size = { width: 2400, height: 1260 };
export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(renderWhereEveryPoundGoes(), { ...size, fonts: getGeistFonts() });
}
