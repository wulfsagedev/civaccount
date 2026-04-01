import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'CivAccount Proposal';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image({ params }: { params: Promise<{ slug: string; id: string }> }) {
  const { slug } = await params;

  // Format council name from slug
  const councilName = slug
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

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
        {/* Top: CivAccount branding */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              backgroundColor: '#1a1a2e',
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
          <span style={{ fontSize: '28px', fontWeight: 700, color: '#1a1a2e' }}>
            CivAccount
          </span>
        </div>

        {/* Middle: Council name + proposal label */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <div
              style={{
                padding: '6px 16px',
                borderRadius: '9999px',
                backgroundColor: '#eef2ff',
                color: '#4338ca',
                fontSize: '20px',
                fontWeight: 600,
              }}
            >
              Community Proposal
            </div>
          </div>
          <div
            style={{
              fontSize: '48px',
              fontWeight: 700,
              color: '#1a1a2e',
              lineHeight: 1.2,
              maxWidth: '900px',
            }}
          >
            {councilName}
          </div>
        </div>

        {/* Bottom: CTA */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '22px', color: '#6b7280' }}>
            Vote, discuss, and shape how your council spends your money
          </span>
        </div>
      </div>
    ),
    { ...size }
  );
}
