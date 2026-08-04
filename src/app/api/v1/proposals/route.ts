import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkRateLimit, getClientIP } from '@/lib/rate-limit';
import { parseIntParam } from '@/lib/api-params';

export async function GET(request: NextRequest) {
  const ip = getClientIP(request);
  const { success: allowed, remaining } = await checkRateLimit(`v1-proposals:${ip}`, { limit: 100, windowSeconds: 60 });

  if (!allowed) {
    return NextResponse.json(
      { error: 'Rate limit exceeded. Max 100 requests per minute.' },
      { status: 429, headers: { 'X-RateLimit-Remaining': '0' } }
    );
  }

  const { searchParams } = new URL(request.url);
  const councilSlug = searchParams.get('council');
  const sort = searchParams.get('sort') ?? 'score';
  const limit = parseIntParam(searchParams.get('limit'), { fallback: 20, min: 1, max: 50 });
  const offset = parseIntParam(searchParams.get('offset'), { fallback: 0, min: 0, max: 100000 });

  const supabase = await createClient();

  let query = supabase
    .from('proposals')
    .select('id, council_slug, budget_category, title, body, score, status, labels, comment_count, created_at')
    .neq('status', 'flagged');

  if (councilSlug) {
    query = query.eq('council_slug', councilSlug);
  }

  if (sort === 'new') {
    query = query.order('created_at', { ascending: false });
  } else {
    query = query.order('score', { ascending: false });
  }

  query = query.range(offset, offset + limit - 1);

  const { data, error } = await query;

  if (error) {
    console.error('[api/v1/proposals] supabase error:', error.message);
    return NextResponse.json({ error: 'Could not fetch proposals' }, { status: 500 });
  }

  return NextResponse.json(
    { data: data ?? [], limit, offset },
    { headers: { 'X-RateLimit-Remaining': String(remaining) } }
  );
}
