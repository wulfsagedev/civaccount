import { ImageResponse } from 'next/og';
import { createClient } from '@/lib/supabase/server';
import { getCouncilBySlug, getCouncilDisplayName } from '@/data/councils';
import { BUDGET_CATEGORIES, PROPOSAL_STATUS_LABELS } from '@/lib/proposals';
import { OG, ogWrap, ogBrand, getGeistFonts } from '../../card/_lib/og-shared';

export const runtime = 'nodejs';
export const alt = 'CivAccount Proposal';
export const size = { width: 2400, height: 1260 };
export const contentType = 'image/png';

const ogOptions = { ...size, fonts: getGeistFonts() };

export default async function Image({ params }: { params: Promise<{ slug: string; id: string }> }) {
  const { slug, id } = await params;

  const supabase = await createClient();
  const { data: proposal } = await supabase
    .from('proposals')
    .select('title, body, score, budget_category, status')
    .eq('id', id)
    .single();

  const council = getCouncilBySlug(slug);
  const councilName = council ? getCouncilDisplayName(council) : slug
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

  if (!proposal) {
    return new ImageResponse(
      ogWrap(
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%' }}>
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'center' }}>
            <div style={{ fontSize: '44px', fontWeight: 600, color: OG.secondary, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '16px' }}>
              Town Hall
            </div>
            <div style={{ fontSize: '96px', fontWeight: 700, color: OG.text }}>{councilName}</div>
          </div>
          {ogBrand(councilName, council?.type_name)}
        </div>
      ),
      ogOptions
    );
  }

  const title = proposal.title;
  const category = BUDGET_CATEGORIES[proposal.budget_category] || proposal.budget_category;
  const score = proposal.score;
  const bodyPreview = proposal.body.length > 150
    ? proposal.body.slice(0, 150).trimEnd() + '...'
    : proposal.body;
  const titleFontSize = title.length > 80 ? 64 : title.length > 50 ? 72 : 84;

  return new ImageResponse(
    ogWrap(
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%' }}>
        {/* Top — council + category */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <span style={{ fontSize: '40px', fontWeight: 600, color: OG.secondary, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            {councilName} · Town Hall
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span style={{ fontSize: '36px', fontWeight: 600, color: OG.accent, backgroundColor: `${OG.accent}20`, padding: '8px 24px', borderRadius: '12px' }}>
              {category}
            </span>
            {score > 0 && (
              <span style={{ fontSize: '36px', fontWeight: 700, color: OG.text }}>
                {score} {score === 1 ? 'vote' : 'votes'}
              </span>
            )}
          </div>
        </div>

        {/* Middle — title + body */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <span style={{ fontSize: `${titleFontSize}px`, fontWeight: 700, color: OG.text, lineHeight: 1.15, letterSpacing: '-0.02em' }}>
            {title}
          </span>
          <span style={{ fontSize: '40px', fontWeight: 400, color: OG.secondary, lineHeight: 1.5 }}>
            {bodyPreview}
          </span>
        </div>

        {/* Brand */}
        {ogBrand(councilName, council?.type_name)}
      </div>
    ),
    ogOptions
  );
}
