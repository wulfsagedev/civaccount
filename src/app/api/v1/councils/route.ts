import { NextRequest, NextResponse } from 'next/server';
import { councils, getCouncilDisplayName, getCouncilSlug } from '@/data/councils';
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
  const type = searchParams.get('type');
  const search = searchParams.get('search');
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '50'), 100);
  const offset = parseInt(searchParams.get('offset') ?? '0');

  let filtered = councils;

  if (type) {
    filtered = filtered.filter(c => c.type === type.toUpperCase());
  }

  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter(c => c.name.toLowerCase().includes(q));
  }

  const total = filtered.length;
  const page = filtered.slice(offset, offset + limit);

  const data = page.map(c => ({
    slug: getCouncilSlug(c),
    name: getCouncilDisplayName(c),
    ons_code: c.ons_code,
    type: c.type,
    type_name: c.type_name,
    band_d_2025: c.council_tax?.band_d_2025 ?? null,
    total_service_budget: c.budget?.total_service ?? null,
    population: c.population ?? null,
  }));

  return NextResponse.json(
    { data, total, limit, offset },
    { headers: { 'X-RateLimit-Remaining': String(remaining) } }
  );
}
