import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export const alt = 'CivAccount - UK Council Budget Dashboard';
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
          background: 'linear-gradient(135deg, #1c1917 0%, #292524 100%)',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        {/* Logo */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 120,
            height: 120,
            background: '#fafaf9',
            borderRadius: '50%',
            marginBottom: 40,
          }}
        >
          {/* Landmark icon SVG */}
          <svg
            width="64"
            height="64"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#1c1917"
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
            color: '#fafaf9',
            marginBottom: 16,
            letterSpacing: '-0.02em',
          }}
        >
          CivAccount
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: 32,
            color: '#a8a29e',
            textAlign: 'center',
            maxWidth: 800,
          }}
        >
          See where your council tax goes
        </div>

        {/* Version badge */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            marginTop: 40,
            padding: '8px 20px',
            background: 'rgba(250, 250, 249, 0.1)',
            borderRadius: 9999,
            border: '1px solid rgba(250, 250, 249, 0.2)',
          }}
        >
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: '#22c55e',
              marginRight: 12,
            }}
          />
          <span
            style={{
              fontSize: 20,
              color: '#fafaf9',
            }}
          >
            v1.6 - All 317 English councils
          </span>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
