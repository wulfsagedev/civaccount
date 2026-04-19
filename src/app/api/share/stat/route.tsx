import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';
import { OG, ogWrap, ogBrand, getGeistFonts } from '@/app/council/[slug]/card/_lib/og-shared';
import { clamp } from '@/lib/security';
import { checkRateLimit, getClientIP } from '@/lib/rate-limit';

export const runtime = 'nodejs';

// Query-string input caps.  Oversized inputs here don't just make the image
// ugly — they make Satori's text-layout pass expensive, so they're a
// realistic DoS vector on a public endpoint.  We truncate silently so a
// slightly-too-long share still renders a usable card.
const MAX_LABEL_LEN = 80;
const MAX_VALUE_LEN = 40;
const MAX_COUNCIL_LEN = 80;
const MAX_TYPE_LEN = 40;
const MAX_CONTEXT_LEN = 120;

// Rate limit: 30 card generations per minute per IP.  Cards are cached for
// 24h on the CDN so legitimate share traffic almost never hits the origin.
const RATE_LIMIT = { limit: 30, windowSeconds: 60 };

/**
 * Single-stat share card generator.
 * GET /api/share/stat?label=CEO+Salary&value=£223,979&council=Kent+County+Council&type=County+Council
 */
export async function GET(request: NextRequest) {
  const ip = getClientIP(request);
  const { success: allowed } = await checkRateLimit(`share-stat:${ip}`, RATE_LIMIT);
  if (!allowed) {
    return new Response('Rate limit exceeded', { status: 429 });
  }

  const { searchParams } = request.nextUrl;
  const label = clamp(searchParams.get('label'), MAX_LABEL_LEN) || 'Stat';
  const value = clamp(searchParams.get('value'), MAX_VALUE_LEN) || '—';
  const council = clamp(searchParams.get('council'), MAX_COUNCIL_LEN);
  const typeName = clamp(searchParams.get('type'), MAX_TYPE_LEN);
  const context = clamp(searchParams.get('context'), MAX_CONTEXT_LEN);

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
