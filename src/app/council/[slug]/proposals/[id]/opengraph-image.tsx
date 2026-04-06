import { ImageResponse } from 'next/og';
import { createClient } from '@/lib/supabase/server';
import { getCouncilBySlug, getCouncilDisplayName } from '@/data/councils';
import { BUDGET_CATEGORIES, PROPOSAL_STATUS_LABELS } from '@/lib/proposals';

export const runtime = 'nodejs';
export const alt = 'CivAccount Proposal';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image({ params }: { params: Promise<{ slug: string; id: string }> }) {
  const { slug, id } = await params;

  // Fetch proposal from Supabase
  const supabase = await createClient();
  const { data: proposal } = await supabase
    .from('proposals')
    .select('title, body, score, budget_category, status')
    .eq('id', id)
    .single();

  // Get council display name from static data
  const council = getCouncilBySlug(slug);
  const councilName = council ? getCouncilDisplayName(council) : slug
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

  // Fallback if proposal not found
  if (!proposal) {
    return new ImageResponse(
      (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            width: '100%',
            height: '100%',
            padding: '60px',
            backgroundColor: '#fafafa',
            fontFamily: 'system-ui, sans-serif',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                backgroundColor: '#1c1917',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '24px',
                fontWeight: 700,
              }}
            >
              C
            </div>
            <span style={{ fontSize: '28px', fontWeight: 700, color: '#1c1917' }}>CivAccount</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ fontSize: '48px', fontWeight: 700, color: '#1c1917', lineHeight: 1.2 }}>
              {councilName}
            </div>
            <div style={{ fontSize: '24px', color: '#737373' }}>Town Hall Proposal</div>
          </div>
          <div style={{ fontSize: '20px', color: '#a3a3a3' }}>civaccount.uk</div>
        </div>
      ),
      { ...size }
    );
  }

  const title = proposal.title;
  const category = BUDGET_CATEGORIES[proposal.budget_category] || proposal.budget_category;
  const score = proposal.score;
  const status = proposal.status;
  const bodyPreview = proposal.body.length > 120
    ? proposal.body.slice(0, 120).trimEnd() + '...'
    : proposal.body;

  // Responsive title size
  const titleFontSize = title.length > 80 ? 36 : title.length > 50 ? 42 : 48;

  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          width: '100%',
          height: '100%',
          padding: '56px 60px',
          backgroundColor: '#fafafa',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        {/* Top: Branding + Council */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '50%',
                backgroundColor: '#1c1917',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '22px',
                fontWeight: 700,
              }}
            >
              C
            </div>
            <span style={{ fontSize: '24px', fontWeight: 700, color: '#1c1917' }}>CivAccount</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '20px', color: '#737373' }}>{councilName}</span>
          </div>
        </div>

        {/* Middle: Proposal content */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', flex: 1, justifyContent: 'center' }}>
          {/* Category + Status badges */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                padding: '5px 14px',
                borderRadius: '9999px',
                backgroundColor: '#eef2ff',
                color: '#4338ca',
                fontSize: '16px',
                fontWeight: 600,
              }}
            >
              {category}
            </div>
            {status && status !== 'open' && (
              <div
                style={{
                  padding: '5px 14px',
                  borderRadius: '9999px',
                  backgroundColor: status === 'resolved' ? '#dcfce7' : status === 'in_progress' ? '#fef3c7' : '#f3f4f6',
                  color: status === 'resolved' ? '#166534' : status === 'in_progress' ? '#92400e' : '#4b5563',
                  fontSize: '16px',
                  fontWeight: 600,
                }}
              >
                {PROPOSAL_STATUS_LABELS[status] || status}
              </div>
            )}
          </div>

          {/* Title */}
          <div
            style={{
              fontSize: `${titleFontSize}px`,
              fontWeight: 700,
              color: '#1c1917',
              lineHeight: 1.2,
              maxWidth: '1000px',
              letterSpacing: '-0.02em',
            }}
          >
            {title}
          </div>

          {/* Body preview */}
          <div
            style={{
              fontSize: '20px',
              color: '#737373',
              lineHeight: 1.5,
              maxWidth: '900px',
            }}
          >
            {bodyPreview}
          </div>
        </div>

        {/* Bottom: Vote count + CTA */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            {/* Vote count */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke={score > 0 ? '#16a34a' : score < 0 ? '#dc2626' : '#737373'}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m18 15-6-6-6 6" />
              </svg>
              <span
                style={{
                  fontSize: '32px',
                  fontWeight: 700,
                  color: '#1c1917',
                }}
              >
                {score}
              </span>
              <span style={{ fontSize: '20px', color: '#a3a3a3', marginLeft: '4px' }}>
                {score === 1 ? 'vote' : 'votes'}
              </span>
            </div>
          </div>
          <span style={{ fontSize: '18px', color: '#a3a3a3' }}>
            Have your say on civaccount.uk
          </span>
        </div>
      </div>
    ),
    { ...size }
  );
}
