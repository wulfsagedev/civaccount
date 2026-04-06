import { NextRequest, NextResponse } from 'next/server';
import { councils, getCouncilDisplayName, getCouncilSlug } from '@/data/councils';
import { checkRateLimit, getClientIP } from '@/lib/rate-limit';

function buildRow(c: (typeof councils)[number]) {
  const slug = getCouncilSlug(c);
  const name = getCouncilDisplayName(c);
  const bandD2025 = c.council_tax?.band_d_2025 ?? null;
  const bandD2024 = c.council_tax?.band_d_2024 ?? null;
  const bandD2023 = c.council_tax?.band_d_2023 ?? null;
  const bandD2022 = c.council_tax?.band_d_2022 ?? null;
  const bandD2021 = c.council_tax?.band_d_2021 ?? null;
  const yoyChange = bandD2025 && bandD2024
    ? Number((((bandD2025 - bandD2024) / bandD2024) * 100).toFixed(1))
    : null;

  return {
    slug,
    name,
    ons_code: c.ons_code,
    type: c.type,
    type_name: c.type_name,
    population: c.population ?? null,
    band_d_2025: bandD2025,
    band_d_2024: bandD2024,
    band_d_2023: bandD2023,
    band_d_2022: bandD2022,
    band_d_2021: bandD2021,
    yoy_change_percent: yoyChange,
    total_service_budget_thousands: c.budget?.total_service ?? null,
    education_thousands: c.budget?.education ?? null,
    transport_thousands: c.budget?.transport ?? null,
    childrens_social_care_thousands: c.budget?.childrens_social_care ?? null,
    adult_social_care_thousands: c.budget?.adult_social_care ?? null,
    public_health_thousands: c.budget?.public_health ?? null,
    housing_thousands: c.budget?.housing ?? null,
    cultural_thousands: c.budget?.cultural ?? null,
    environmental_thousands: c.budget?.environmental ?? null,
    planning_thousands: c.budget?.planning ?? null,
    central_services_thousands: c.budget?.central_services ?? null,
    chief_executive: c.detailed?.chief_executive ?? null,
    chief_executive_salary: c.detailed?.chief_executive_salary ?? null,
    council_leader: c.detailed?.council_leader ?? null,
    councillor_basic_allowance: c.detailed?.councillor_basic_allowance ?? null,
    website: c.detailed?.website ?? null,
    url: `https://www.civaccount.co.uk/council/${slug}`,
  };
}

function toCsv(rows: ReturnType<typeof buildRow>[]) {
  if (rows.length === 0) return '';
  const headers = Object.keys(rows[0]);
  const lines = [headers.join(',')];

  for (const row of rows) {
    const values = headers.map((h) => {
      const val = row[h as keyof typeof row];
      if (val === null || val === undefined) return '';
      const str = String(val);
      // Escape CSV values containing commas, quotes, or newlines
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    });
    lines.push(values.join(','));
  }

  return lines.join('\n');
}

export async function GET(request: NextRequest) {
  const ip = getClientIP(request);
  const { success: allowed } = checkRateLimit(ip, { limit: 10, windowSeconds: 60 });

  if (!allowed) {
    return NextResponse.json(
      { error: 'Rate limit exceeded. Max 10 downloads per minute.' },
      { status: 429 }
    );
  }

  const { searchParams } = new URL(request.url);
  const format = searchParams.get('format') ?? 'json';

  const rows = councils.map(buildRow);

  if (format === 'csv') {
    const csv = toCsv(rows);
    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="civaccount-council-data-2025-26.csv"',
        'Cache-Control': 'public, max-age=86400',
      },
    });
  }

  // JSON format
  return NextResponse.json(
    {
      metadata: {
        title: 'CivAccount Council Data 2025-26',
        description: 'Council tax rates, budgets, and leadership data for all 317 English councils',
        source: 'https://www.civaccount.co.uk',
        license: 'Open Government Licence v3.0',
        license_url: 'https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/',
        total_councils: rows.length,
        generated: new Date().toISOString(),
        budget_unit: 'thousands of pounds (multiply by 1000 for actual value)',
        council_tax_unit: 'pounds',
      },
      data: rows,
    },
    {
      headers: {
        'Content-Disposition': 'attachment; filename="civaccount-council-data-2025-26.json"',
        'Cache-Control': 'public, max-age=86400',
      },
    }
  );
}
