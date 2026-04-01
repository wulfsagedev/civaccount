import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkRateLimit } from '../rate-limit';

export async function GET(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') ?? 'unknown';
  const { allowed, remaining } = checkRateLimit(ip);

  if (!allowed) {
    return NextResponse.json(
      { error: 'Rate limit exceeded. Max 100 requests per minute.' },
      { status: 429, headers: { 'X-RateLimit-Remaining': '0' } }
    );
  }

  const { searchParams } = new URL(request.url);
  const councilSlug = searchParams.get('council');
  const sort = searchParams.get('sort') ?? 'score';
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '20'), 50);
  const offset = parseInt(searchParams.get('offset') ?? '0');

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
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(
    { data: data ?? [], limit, offset },
    { headers: { 'X-RateLimit-Remaining': String(remaining) } }
  );
}
