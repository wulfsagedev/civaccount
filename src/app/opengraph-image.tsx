import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export const alt = 'CivAccount - See where your council tax goes';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default async function Image() {
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
            width: 96,
            height: 96,
            background: '#1c1917',
            borderRadius: '50%',
            marginBottom: 36,
          }}
        >
          <svg
            width="52"
            height="52"
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

        {/* Title */}
        <div
          style={{
            fontSize: 72,
            fontWeight: 700,
            color: '#1c1917',
            marginBottom: 16,
            letterSpacing: '-0.03em',
          }}
        >
          CivAccount
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: 30,
            color: '#737373',
            textAlign: 'center',
            maxWidth: 700,
          }}
        >
          See where your council tax goes
        </div>

        {/* Subtle descriptor */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            marginTop: 36,
            fontSize: 18,
            color: '#a3a3a3',
            letterSpacing: '0.05em',
          }}
        >
          ALL 317 ENGLISH COUNCILS
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
