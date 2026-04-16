import { ImageResponse } from 'next/og';
import { renderTopSuppliers } from '@/app/insights/_lib/og-renderers/top-suppliers';
import { getGeistFonts } from '@/app/council/[slug]/card/_lib/og-shared';

export const runtime = 'nodejs';
export const alt = 'Who really gets your council tax — CivAccount';
export const size = { width: 2400, height: 1260 };
export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(renderTopSuppliers(), { ...size, fonts: getGeistFonts() });
}
