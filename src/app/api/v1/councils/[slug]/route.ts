import { NextRequest, NextResponse } from 'next/server';
import { getCouncilBySlug, getCouncilDisplayName, getCouncilSlug, formatBudget } from '@/data/councils';
import { BUDGET_CATEGORIES } from '@/lib/proposals';
import { checkRateLimit, getClientIP } from '@/lib/rate-limit';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const ip = getClientIP(request);
  const { success: allowed, remaining } = await checkRateLimit(ip, { limit: 100, windowSeconds: 60 });

  if (!allowed) {
    return NextResponse.json(
      { error: 'Rate limit exceeded. Max 100 requests per minute.' },
      { status: 429, headers: { 'X-RateLimit-Remaining': '0' } }
    );
  }

  const { slug } = await params;
  const council = getCouncilBySlug(slug);

  if (!council) {
    return NextResponse.json({ error: 'Council not found' }, { status: 404 });
  }

  const budget = council.budget;
  const budgetBreakdown = budget ? Object.entries(BUDGET_CATEGORIES).map(([key, label]) => ({
    category: key,
    label,
    amount_thousands: budget[key as keyof typeof budget] as number | null,
  })).filter(b => b.amount_thousands !== null && b.amount_thousands !== 0) : [];

  const data = {
    slug: getCouncilSlug(council),
    name: getCouncilDisplayName(council),
    ons_code: council.ons_code,
    type: council.type,
    type_name: council.type_name,
    population: council.population ?? null,
    council_tax: council.council_tax ?? null,
    budget: {
      total_service: budget?.total_service ?? null,
      net_current: budget?.net_current ?? null,
      breakdown: budgetBreakdown,
    },
    leadership: council.detailed ? {
      council_leader: council.detailed.council_leader ?? null,
      chief_executive: council.detailed.chief_executive ?? null,
      total_councillors: council.detailed.total_councillors ?? null,
    } : null,
    website: council.detailed?.website ?? null,
  };

  return NextResponse.json(
    { data },
    { headers: { 'X-RateLimit-Remaining': String(remaining) } }
  );
}
