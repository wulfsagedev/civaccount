import { ImageResponse } from 'next/og';
import { readFileSync } from 'fs';
import { join } from 'path';
import { getCouncilBySlug, getCouncilDisplayName } from '@/data/councils';

export const runtime = 'nodejs';
export const alt = 'Council tax and budget breakdown';
export const size = { width: 2400, height: 1260 };
export const contentType = 'image/png';

function loadFont(filename: string): ArrayBuffer {
  return readFileSync(join(process.cwd(), 'node_modules', 'geist', 'dist', 'fonts', 'geist-sans', filename)).buffer as ArrayBuffer;
}

const fonts = [
  { name: 'Geist', data: loadFont('Geist-Regular.ttf'), weight: 400 as const, style: 'normal' as const },
  { name: 'Geist', data: loadFont('Geist-Bold.ttf'), weight: 700 as const, style: 'normal' as const },
];

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
          background: 'linear-gradient(145deg, #22222a 0%, #1c1c20 40%, #181820 100%)',
          fontFamily: 'Geist, system-ui, sans-serif',
        }}
      >
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 144, height: 144, background: '#f0f0f0', borderRadius: '50%', marginBottom: 56 }}>
          <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="#1c1c20" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" x2="21" y1="22" y2="22" />
            <line x1="6" x2="6" y1="18" y2="11" />
            <line x1="10" x2="10" y1="18" y2="11" />
            <line x1="14" x2="14" y1="18" y2="11" />
            <line x1="18" x2="18" y1="18" y2="11" />
            <polygon points="12 2 20 7 4 7" />
          </svg>
        </div>

        {/* Type */}
        <div style={{ display: 'flex', fontSize: 36, color: '#9a9a9a', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 24 }}>
          {typeName}
        </div>

        {/* Name */}
        <div style={{ fontSize: displayName.length > 30 ? 96 : 112, fontWeight: 700, color: '#f0f0f0', marginBottom: 40, letterSpacing: '-0.02em', textAlign: 'center', maxWidth: 2000, lineHeight: 1.1 }}>
          {displayName}
        </div>

        {/* Band D */}
        {bandD && (
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, fontSize: 64, color: '#b0b0b0' }}>
            <span style={{ color: '#9a9a9a', fontSize: 44 }}>Band D</span>
            <span style={{ fontWeight: 700, color: '#f0f0f0' }}>
              {`\u00A3${bandD.toLocaleString('en-GB', { minimumFractionDigits: 2 })}`}
            </span>
          </div>
        )}

        {/* Footer */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 32, marginTop: 72, fontSize: 36, color: '#9a9a9a' }}>
          <span>2025-26</span>
          <span style={{ color: '#3a3a40' }}>|</span>
          <span>CivAccount</span>
        </div>
      </div>
    ),
    { ...size, fonts }
  );
}
