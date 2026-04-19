import { NextRequest, NextResponse } from 'next/server';
import { councils, getCouncilDisplayName, getCouncilSlug } from '@/data/councils';
import { checkRateLimit, getClientIP } from '@/lib/rate-limit';

/**
 * GET /api/v1/councils
 *
 * Public *filtered* search over the council index. A filter (`search` or `type`)
 * is REQUIRED — unfiltered enumeration is not offered. If you need all 317
 * councils, look them up one at a time at `/api/v1/councils/[slug]`; slugs are
 * in the sitemap.
 *
 * This is a deliberate trade-off: individual lookups serve the mission
 * (embeds, lookups, civic access), while unfiltered enumeration would hand a
 * scraper the entire curated dataset in a few calls.
 *
 * Params:
 *   - search:  substring match over council name (case-insensitive). Required*.
 *   - type:    SC | SD | UA | MD | LB. Required*.
 *   - limit:   max 20 (default 20).
 *     (*) at least one of `search` or `type` must be present.
 *
 * Returns slim records: slug, name, ons_code, type, type_name only.
 * For the full record, call `/api/v1/councils/[slug]`.
 */
export async function GET(request: NextRequest) {
  const ip = getClientIP(request);
  const { success: allowed, remaining } = await checkRateLimit(ip, { limit: 60, windowSeconds: 60 });

  if (!allowed) {
    return NextResponse.json(
      { error: 'Rate limit exceeded. Max 60 requests per minute.' },
      { status: 429, headers: { 'X-RateLimit-Remaining': '0' } },
    );
  }

  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');
  const search = searchParams.get('search');
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '20'), 20);

  if (!type && !search) {
    return NextResponse.json(
      {
        error:
          'A filter is required. Pass `search=<name>` or `type=<SC|SD|UA|MD|LB>`. Unfiltered listing is not offered — look up individual councils at /api/v1/councils/[slug].',
      },
      { status: 400 },
    );
  }

  let filtered = councils;

  if (type) {
    filtered = filtered.filter((c) => c.type === type.toUpperCase());
  }

  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter((c) => c.name.toLowerCase().includes(q));
  }

  const total = filtered.length;
  const page = filtered.slice(0, limit);

  const data = page.map((c) => ({
    slug: getCouncilSlug(c),
    name: getCouncilDisplayName(c),
    ons_code: c.ons_code,
    type: c.type,
    type_name: c.type_name,
  }));

  return NextResponse.json(
    { data, total, limit },
    { headers: { 'X-RateLimit-Remaining': String(remaining) } },
  );
}
