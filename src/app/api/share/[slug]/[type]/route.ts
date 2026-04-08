import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';
import { getCouncilBySlug, getCouncilDisplayName } from '@/data/councils';
import { getGeistFonts } from '@/app/council/[slug]/card/_lib/og-shared';
import { renderYourBill } from '@/app/council/[slug]/card/_lib/og-renderers/your-bill';
import { renderSpending } from '@/app/council/[slug]/card/_lib/og-renderers/spending';
import { renderBillHistory } from '@/app/council/[slug]/card/_lib/og-renderers/bill-history';
import { renderBillBreakdown } from '@/app/council/[slug]/card/_lib/og-renderers/bill-breakdown';
import { renderTaxBands } from '@/app/council/[slug]/card/_lib/og-renderers/tax-bands';
import { renderFinancialHealth } from '@/app/council/[slug]/card/_lib/og-renderers/financial-health';
import { renderLeadership } from '@/app/council/[slug]/card/_lib/og-renderers/leadership';
import { renderPay } from '@/app/council/[slug]/card/_lib/og-renderers/pay';
import { renderSuppliers } from '@/app/council/[slug]/card/_lib/og-renderers/suppliers';
import { renderGrants } from '@/app/council/[slug]/card/_lib/og-renderers/grants';
import { renderPerformance } from '@/app/council/[slug]/card/_lib/og-renderers/performance';
import { renderServiceOutcomes } from '@/app/council/[slug]/card/_lib/og-renderers/service-outcomes';
import { renderYourBillStory, renderSpendingStory, renderBillHistoryStory, renderTaxCardStory } from './story-renderers';
import { renderTaxCard } from '@/app/council/[slug]/card/_lib/og-renderers/tax-card';
import type { Council } from '@/data/councils';
import type { ReactElement } from 'react';

export const runtime = 'nodejs';

const OG_SIZE = { width: 2400, height: 1260 };
const STORY_SIZE = { width: 1080, height: 1920 };

const ogRenderers: Record<string, (council: Council, councilName: string) => ReactElement> = {
  'your-bill': renderYourBill,
  'spending': renderSpending,
  'bill-history': renderBillHistory,
  'bill-breakdown': renderBillBreakdown,
  'tax-bands': renderTaxBands,
  'financial-health': renderFinancialHealth,
  'leadership': renderLeadership,
  'pay': renderPay,
  'suppliers': renderSuppliers,
  'grants': renderGrants,
  'performance': renderPerformance,
  'service-outcomes': renderServiceOutcomes,
  'tax-card': renderTaxCard,
};

const storyRenderers: Record<string, (council: Council, councilName: string) => ReactElement> = {
  'your-bill': renderYourBillStory,
  'spending': renderSpendingStory,
  'bill-history': renderBillHistoryStory,
  'tax-card': renderTaxCardStory,
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; type: string }> }
) {
  const { slug, type } = await params;
  const format = request.nextUrl.searchParams.get('format') || 'og';

  const council = getCouncilBySlug(slug);
  if (!council) {
    return new Response('Council not found', { status: 404 });
  }

  const displayName = getCouncilDisplayName(council);
  const isStory = format === 'story';

  // For story format: use story renderer if available, fall back to OG renderer
  const renderer = isStory
    ? (storyRenderers[type] || ogRenderers[type])
    : ogRenderers[type];

  if (!renderer) {
    return new Response(`Card type "${type}" not supported`, { status: 400 });
  }

  // Use story dimensions only when a dedicated story renderer exists; OG fallback keeps OG dimensions
  const hasStoryRenderer = isStory && type in storyRenderers;
  const size = hasStoryRenderer ? STORY_SIZE : OG_SIZE;

  const response = new ImageResponse(renderer(council, displayName), {
    ...size,
    fonts: getGeistFonts(),
  });

  // Cache for 24 hours on CDN, 1 hour in browser
  response.headers.set('Cache-Control', 'public, max-age=3600, s-maxage=86400');
  return response;
}
