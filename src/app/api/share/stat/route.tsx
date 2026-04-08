import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';
import { OG, ogWrap, ogBrand, getGeistFonts } from '@/app/council/[slug]/card/_lib/og-shared';

export const runtime = 'nodejs';

/**
 * Single-stat share card generator.
 * GET /api/share/stat?label=CEO+Salary&value=£223,979&council=Kent+County+Council&type=County+Council
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const label = searchParams.get('label') || 'Stat';
  const value = searchParams.get('value') || '—';
  const council = searchParams.get('council') || '';
  const typeName = searchParams.get('type') || '';
  const context = searchParams.get('context') || '';

  const response = new ImageResponse(
    ogWrap(
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%' }}>
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'center' }}>
          {/* Label */}
          <div style={{ display: 'flex', fontSize: '56px', fontWeight: 600, color: OG.secondary, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '28px' }}>
            {label}
          </div>
          {/* Value — hero */}
          <div style={{ display: 'flex', fontSize: value.length > 15 ? '180px' : '240px', fontWeight: 700, color: OG.text, letterSpacing: '-0.03em', lineHeight: 0.95 }}>
            {value}
          </div>
          {/* Context line */}
          {context && (
            <div style={{ display: 'flex', fontSize: '56px', fontWeight: 500, color: OG.secondary, marginTop: '36px' }}>
              {context}
            </div>
          )}
        </div>
        {ogBrand(council, typeName)}
      </div>
    ),
    {
      width: 2400,
      height: 1260,
      fonts: getGeistFonts(),
    }
  );

  response.headers.set('Cache-Control', 'public, max-age=3600, s-maxage=86400');
  return response;
}
