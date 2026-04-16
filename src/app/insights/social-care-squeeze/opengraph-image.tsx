import { ImageResponse } from 'next/og';
import { renderSocialCareSqueeze } from '@/app/insights/_lib/og-renderers/social-care-squeeze';
import { getGeistFonts } from '@/app/council/[slug]/card/_lib/og-shared';

export const runtime = 'nodejs';
export const alt = 'The social care squeeze — CivAccount';
export const size = { width: 2400, height: 1260 };
export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(renderSocialCareSqueeze(), { ...size, fonts: getGeistFonts() });
}
