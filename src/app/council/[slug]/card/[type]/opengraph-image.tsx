import { ImageResponse } from 'next/og';
import { getCouncilBySlug, getCouncilDisplayName } from '@/data/councils';
import { CARD_TYPES } from '../_lib/card-types';
import { ogHeader, ogFooter, ogCardWrapper, OG_COLORS } from '../_lib/og-shared';
import { renderBillHistory } from '../_lib/og-renderers/bill-history';
import { renderYourBill } from '../_lib/og-renderers/your-bill';
import { renderSpending } from '../_lib/og-renderers/spending';
import { renderBillBreakdown } from '../_lib/og-renderers/bill-breakdown';
import { renderFinancialHealth } from '../_lib/og-renderers/financial-health';
import { renderLeadership } from '../_lib/og-renderers/leadership';
import { renderPay } from '../_lib/og-renderers/pay';
import { renderTaxBands } from '../_lib/og-renderers/tax-bands';
import { renderSuppliers } from '../_lib/og-renderers/suppliers';
import { renderGrants } from '../_lib/og-renderers/grants';
import { renderPerformance } from '../_lib/og-renderers/performance';
import { renderServiceOutcomes } from '../_lib/og-renderers/service-outcomes';
import type { Council } from '@/data/councils';
import type { ReactElement } from 'react';

export const runtime = 'nodejs';
export const alt = 'CivAccount Card';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const dynamic = 'force-dynamic';

const renderers: Record<string, (council: Council, councilName: string) => ReactElement> = {
  'bill-history': renderBillHistory,
  'your-bill': renderYourBill,
  'spending': renderSpending,
  'bill-breakdown': renderBillBreakdown,
  'financial-health': renderFinancialHealth,
  'leadership': renderLeadership,
  'pay': renderPay,
  'tax-bands': renderTaxBands,
  'suppliers': renderSuppliers,
  'grants': renderGrants,
  'performance': renderPerformance,
  'service-outcomes': renderServiceOutcomes,
};

export default async function Image({ params }: { params: Promise<{ slug: string; type: string }> }) {
  const { slug, type } = await params;
  const council = getCouncilBySlug(slug);
  const displayName = council ? getCouncilDisplayName(council) : slug.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  const typeName = council?.type_name;
  const cardType = CARD_TYPES[type];
  const renderer = renderers[type];

  // Fallback if no renderer or no data
  if (!council || !renderer || (cardType && !cardType.hasData(council))) {
    return new ImageResponse(
      ogCardWrapper(
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%' }}>
          {ogHeader(displayName, typeName)}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1, justifyContent: 'center' }}>
            <div style={{ fontSize: '48px', fontWeight: 700, color: OG_COLORS.text }}>{displayName}</div>
            <div style={{ fontSize: '24px', color: OG_COLORS.secondary }}>Council Tax & Budget 2025-26</div>
          </div>
          {ogFooter()}
        </div>
      ),
      { ...size }
    );
  }

  const content = renderer(council, displayName);

  return new ImageResponse(
    ogCardWrapper(
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%' }}>
        {ogHeader(displayName, typeName)}
        <div style={{ display: 'flex', flex: 1, flexDirection: 'column', justifyContent: 'center', paddingTop: '16px', paddingBottom: '16px' }}>
          {content}
        </div>
        {ogFooter()}
      </div>
    ),
    { ...size }
  );
}
