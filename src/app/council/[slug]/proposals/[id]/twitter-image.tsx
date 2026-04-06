import { ImageResponse } from 'next/og';
import { createClient } from '@/lib/supabase/server';
import { getCouncilBySlug, getCouncilDisplayName } from '@/data/councils';
import { BUDGET_CATEGORIES, PROPOSAL_STATUS_LABELS } from '@/lib/proposals';

export const runtime = 'nodejs';
export const alt = 'CivAccount Proposal';
export const size = { width: 1200, height: 600 };
export const contentType = 'image/png';

export default async function Image({ params }: { params: Promise<{ slug: string; id: string }> }) {
  const { slug, id } = await params;

  const supabase = await createClient();
  const { data: proposal } = await supabase
    .from('proposals')
    .select('title, body, score, budget_category, status')
    .eq('id', id)
    .single();

  const council = getCouncilBySlug(slug);
  const councilName = council ? getCouncilDisplayName(council) : slug.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

  if (!proposal) {
    return new ImageResponse(
      (
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', width: '100%', height: '100%', padding: '48px 56px', backgroundColor: '#fafafa', fontFamily: 'system-ui, sans-serif' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '50%', backgroundColor: '#1c1917', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '22px', fontWeight: 700 }}>C</div>
            <span style={{ fontSize: '24px', fontWeight: 700, color: '#1c1917' }}>CivAccount</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', fontSize: '44px', fontWeight: 700, color: '#1c1917' }}>{councilName}</div>
            <div style={{ display: 'flex', fontSize: '22px', color: '#737373' }}>Town Hall Proposal</div>
          </div>
          <div style={{ display: 'flex', fontSize: '18px', color: '#a3a3a3' }}>civaccount.uk</div>
        </div>
      ),
      { ...size }
    );
  }

  const category = BUDGET_CATEGORIES[proposal.budget_category] || proposal.budget_category;
  const title = proposal.title;
  const titleFontSize = title.length > 80 ? 34 : title.length > 50 ? 40 : 44;
  const bodyPreview = proposal.body.length > 100 ? proposal.body.slice(0, 100).trimEnd() + '...' : proposal.body;

  return new ImageResponse(
    (
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', width: '100%', height: '100%', padding: '44px 56px', backgroundColor: '#fafafa', fontFamily: 'system-ui, sans-serif' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#1c1917', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '20px', fontWeight: 700 }}>C</div>
            <span style={{ fontSize: '22px', fontWeight: 700, color: '#1c1917' }}>CivAccount</span>
          </div>
          <span style={{ fontSize: '18px', color: '#737373' }}>{councilName}</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1, justifyContent: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ display: 'flex', padding: '4px 12px', borderRadius: '9999px', backgroundColor: '#eef2ff', color: '#4338ca', fontSize: '15px', fontWeight: 600 }}>{category}</div>
            {proposal.status && proposal.status !== 'open' && (
              <div style={{ display: 'flex', padding: '4px 12px', borderRadius: '9999px', backgroundColor: '#f3f4f6', color: '#4b5563', fontSize: '15px', fontWeight: 600 }}>
                {PROPOSAL_STATUS_LABELS[proposal.status] || proposal.status}
              </div>
            )}
          </div>
          <div style={{ display: 'flex', fontSize: `${titleFontSize}px`, fontWeight: 700, color: '#1c1917', lineHeight: 1.2, letterSpacing: '-0.02em' }}>{title}</div>
          <div style={{ display: 'flex', fontSize: '18px', color: '#737373', lineHeight: 1.5 }}>{bodyPreview}</div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '28px', fontWeight: 700, color: '#1c1917' }}>{proposal.score}</span>
            <span style={{ fontSize: '18px', color: '#a3a3a3' }}>{proposal.score === 1 ? 'vote' : 'votes'}</span>
          </div>
          <span style={{ fontSize: '16px', color: '#a3a3a3' }}>civaccount.uk</span>
        </div>
      </div>
    ),
    { ...size }
  );
}
