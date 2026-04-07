import { ImageResponse } from 'next/og';
import { readFileSync } from 'fs';
import { join } from 'path';

export const runtime = 'nodejs';
export const alt = 'CivAccount - See where your council tax goes';
export const size = { width: 2400, height: 1200 };
export const contentType = 'image/png';

function loadFont(filename: string): ArrayBuffer {
  return readFileSync(join(process.cwd(), 'node_modules', 'geist', 'dist', 'fonts', 'geist-sans', filename)).buffer as ArrayBuffer;
}

const fonts = [
  { name: 'Geist', data: loadFont('Geist-Regular.ttf'), weight: 400 as const, style: 'normal' as const },
  { name: 'Geist', data: loadFont('Geist-Bold.ttf'), weight: 700 as const, style: 'normal' as const },
];

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
          background: 'linear-gradient(145deg, #22222a 0%, #1c1c20 40%, #181820 100%)',
          fontFamily: 'Geist, system-ui, sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 176, height: 176, background: '#f0f0f0', borderRadius: '50%', marginBottom: 64 }}>
          <svg width="96" height="96" viewBox="0 0 24 24" fill="none" stroke="#1c1c20" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" x2="21" y1="22" y2="22" />
            <line x1="6" x2="6" y1="18" y2="11" />
            <line x1="10" x2="10" y1="18" y2="11" />
            <line x1="14" x2="14" y1="18" y2="11" />
            <line x1="18" x2="18" y1="18" y2="11" />
            <polygon points="12 2 20 7 4 7" />
          </svg>
        </div>

        <div style={{ fontSize: 128, fontWeight: 700, color: '#f0f0f0', marginBottom: 28, letterSpacing: '-0.03em' }}>
          CivAccount
        </div>

        <div style={{ fontSize: 56, color: '#b0b0b0', textAlign: 'center', maxWidth: 1300 }}>
          See where your council tax goes
        </div>

        <div style={{ display: 'flex', alignItems: 'center', marginTop: 64, fontSize: 32, color: '#9a9a9a', letterSpacing: '0.05em' }}>
          ALL 317 ENGLISH COUNCILS
        </div>
      </div>
    ),
    { ...size, fonts }
  );
}
