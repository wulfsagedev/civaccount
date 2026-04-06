import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getCouncilBySlug, getAllCouncilSlugs, getCouncilDisplayName, formatCurrency, formatBudget, getAverageBandDByType } from '@/data/councils';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return getAllCouncilSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const council = getCouncilBySlug(slug);
  if (!council) return { title: 'Embed' };
  return {
    title: `${getCouncilDisplayName(council)} — Council Tax Widget`,
    robots: { index: false, follow: false },
  };
}

export default async function EmbedCouncilPage({ params }: Props) {
  const { slug } = await params;
  const council = getCouncilBySlug(slug);

  if (!council) notFound();

  const displayName = getCouncilDisplayName(council);
  const bandD = council.council_tax?.band_d_2025;
  const bandD2024 = council.council_tax?.band_d_2024;
  const totalBudget = council.budget?.total_service ? formatBudget(council.budget.total_service) : null;
  const typeAvg = getAverageBandDByType(council.type);
  const vsAvg = bandD && typeAvg ? bandD - typeAvg : null;

  const taxChange = bandD && bandD2024
    ? ((bandD - bandD2024) / bandD2024) * 100
    : null;

  return (
    <html lang="en-GB">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <style>{`
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #1c1917;
            color: #fafaf9;
            padding: 16px;
          }
          .card {
            background: #292524;
            border: 1px solid rgba(255,255,255,0.1);
            border-radius: 12px;
            padding: 20px;
            max-width: 400px;
          }
          .badge {
            display: inline-block;
            font-size: 11px;
            font-weight: 500;
            padding: 2px 8px;
            border-radius: 4px;
            background: rgba(255,255,255,0.08);
            color: #a8a29e;
            margin-bottom: 8px;
          }
          .name {
            font-size: 18px;
            font-weight: 700;
            line-height: 1.2;
            margin-bottom: 12px;
          }
          .hero {
            font-size: 32px;
            font-weight: 700;
            line-height: 1;
            margin-bottom: 4px;
            font-variant-numeric: tabular-nums;
          }
          .hero span {
            font-size: 14px;
            font-weight: 400;
            color: #a8a29e;
          }
          .change {
            font-size: 13px;
            margin-bottom: 16px;
          }
          .change.up { color: #f59e0b; }
          .change.down { color: #10b981; }
          .row {
            display: flex;
            justify-content: space-between;
            align-items: baseline;
            padding: 6px 0;
            font-size: 13px;
          }
          .row .label { color: #a8a29e; }
          .row .value { font-weight: 600; font-variant-numeric: tabular-nums; }
          .divider {
            border-top: 1px solid rgba(255,255,255,0.08);
            margin: 12px 0;
          }
          .footer {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-top: 12px;
            padding-top: 12px;
            border-top: 1px solid rgba(255,255,255,0.08);
          }
          .footer a {
            color: #a8a29e;
            font-size: 11px;
            text-decoration: none;
          }
          .footer a:hover { color: #fafaf9; }
          .logo {
            font-size: 11px;
            font-weight: 600;
            color: #a8a29e;
          }
        `}</style>
      </head>
      <body>
        <div className="card">
          <span className="badge">{council.type_name} · 2025-26</span>
          <div className="name">{displayName}</div>

          {bandD && (
            <>
              <div className="hero">
                {formatCurrency(bandD, { decimals: 2 })}
                <span> /year</span>
              </div>
              {taxChange !== null && (
                <div className={`change ${taxChange > 0 ? 'up' : 'down'}`}>
                  {taxChange > 0 ? '+' : ''}{taxChange.toFixed(1)}% from last year
                </div>
              )}
            </>
          )}

          <div className="divider" />

          {totalBudget && (
            <div className="row">
              <span className="label">Total budget</span>
              <span className="value">{totalBudget}</span>
            </div>
          )}

          {vsAvg !== null && (
            <div className="row">
              <span className="label">vs average {council.type_name.toLowerCase()}</span>
              <span className="value" style={{ color: vsAvg > 0 ? '#f59e0b' : '#10b981' }}>
                {vsAvg > 0 ? '+' : ''}{formatCurrency(vsAvg, { decimals: 2 })}
              </span>
            </div>
          )}

          <div className="footer">
            <span className="logo">CivAccount</span>
            <a href={`https://www.civaccount.co.uk/council/${slug}`} target="_blank" rel="noopener noreferrer">
              View full dashboard
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
