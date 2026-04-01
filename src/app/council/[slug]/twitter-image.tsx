import { ImageResponse } from 'next/og';
import { getCouncilBySlug, getCouncilDisplayName } from '@/data/councils';

export const runtime = 'nodejs';

export const alt = 'Council tax and budget breakdown';
export const size = {
  width: 1200,
  height: 600,
};
export const contentType = 'image/png';

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const council = getCouncilBySlug(slug);

  const displayName = council ? getCouncilDisplayName(council) : 'Council';
  const bandD = council?.council_tax?.band_d_2025;
  const typeName = council?.type_name || 'Council';

  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#f5f5f5',
          fontFamily: 'system-ui, sans-serif',
          border: '1px solid #e5e5e5',
        }}
      >
        {/* Logo icon */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 64,
            height: 64,
            background: '#1c1917',
            borderRadius: '50%',
            marginBottom: 24,
          }}
        >
          <svg
            width="36"
            height="36"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#fafaf9"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="3" x2="21" y1="22" y2="22" />
            <line x1="6" x2="6" y1="18" y2="11" />
            <line x1="10" x2="10" y1="18" y2="11" />
            <line x1="14" x2="14" y1="18" y2="11" />
            <line x1="18" x2="18" y1="18" y2="11" />
            <polygon points="12 2 20 7 4 7" />
          </svg>
        </div>

        {/* Type badge */}
        <div
          style={{
            display: 'flex',
            fontSize: 16,
            color: '#737373',
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            marginBottom: 10,
          }}
        >
          {typeName}
        </div>

        {/* Council name */}
        <div
          style={{
            fontSize: displayName.length > 30 ? 44 : 52,
            fontWeight: 700,
            color: '#1c1917',
            marginBottom: 18,
            letterSpacing: '-0.02em',
            textAlign: 'center',
            maxWidth: 1000,
            lineHeight: 1.1,
          }}
        >
          {displayName}
        </div>

        {/* Band D rate */}
        {bandD && (
          <div
            style={{
              display: 'flex',
              alignItems: 'baseline',
              gap: 8,
              fontSize: 28,
              color: '#525252',
            }}
          >
            <span style={{ color: '#a3a3a3', fontSize: 20 }}>Band D</span>
            <span style={{ fontWeight: 700, color: '#1c1917' }}>
              {`\u00A3${bandD.toLocaleString('en-GB', { minimumFractionDigits: 2 })}`}
            </span>
          </div>
        )}

        {/* Year + branding */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            marginTop: 28,
            fontSize: 16,
            color: '#a3a3a3',
          }}
        >
          <span>2025-26</span>
          <span style={{ color: '#d4d4d4' }}>|</span>
          <span>CivAccount</span>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
