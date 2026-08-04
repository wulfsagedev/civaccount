import { NextRequest, NextResponse } from 'next/server';
import { getRecentDiffs, getDiffsForCouncil } from '@/lib/civic-diffs';
import { checkRateLimit, getClientIP } from '@/lib/rate-limit';
import { parseIntParam } from '@/lib/api-params';

export async function GET(request: NextRequest) {
  const ip = getClientIP(request);
  const { success: allowed, remaining } = await checkRateLimit(`v1-diffs:${ip}`, { limit: 100, windowSeconds: 60 });

  if (!allowed) {
    return NextResponse.json(
      { error: 'Rate limit exceeded. Max 100 requests per minute.' },
      { status: 429, headers: { 'X-RateLimit-Remaining': '0' } }
    );
  }

  const { searchParams } = new URL(request.url);
  const councilSlug = searchParams.get('council');
  const limit = parseIntParam(searchParams.get('limit'), { fallback: 20, min: 1, max: 50 });

  let data;
  if (councilSlug) {
    data = getDiffsForCouncil(councilSlug);
  } else {
    data = getRecentDiffs(limit);
  }

  return NextResponse.json(
    { data },
    { headers: { 'X-RateLimit-Remaining': String(remaining) } }
  );
}
