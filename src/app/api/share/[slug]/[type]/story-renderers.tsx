import type { Council } from '@/data/councils';
import type { ReactElement } from 'react';
import { OG, formatCurrencyOG, formatBudgetOG } from '@/app/council/[slug]/card/_lib/og-shared';
import { ogStoryWrap, ogStoryBrand } from '@/lib/og-story-wrap';
import { BUDGET_CATEGORIES } from '@/lib/proposals';

// ── Your Bill (Story) ─────────────────────────────────────────────────────────

export function renderYourBillStory(council: Council, councilName: string): ReactElement {
  const bandD = council.council_tax?.band_d_2025;
  const bandDPrev = council.council_tax?.band_d_2024;

  if (!bandD) return <div style={{ display: 'flex' }}>No data</div>;

  const change = bandDPrev ? bandD - bandDPrev : null;
  const changePct = bandDPrev ? ((change! / bandDPrev) * 100).toFixed(1) : null;
  const dailyCost = (bandD / 365).toFixed(2);

  return ogStoryWrap(
    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%' }}>
      {/* Top section */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <span style={{ fontSize: '24px', color: OG.muted, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          {council.type_name}
        </span>
      </div>

      {/* Center — hero data */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px' }}>
        <span style={{ fontSize: '28px', color: OG.muted, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          You pay this council
        </span>
        <span style={{ fontSize: '120px', fontWeight: 700, color: OG.text, letterSpacing: '-0.03em', lineHeight: 1 }}>
          {formatCurrencyOG(bandD, 2)}
        </span>
        <span style={{ fontSize: '32px', color: OG.muted }}>/year</span>

        {/* Change + daily */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', marginTop: '32px' }}>
          {change != null && changePct != null && (
            <span style={{ fontSize: '32px', fontWeight: 700, color: change > 0 ? OG.negative : OG.positive }}>
              {change > 0 ? '\u2197' : '\u2198'} {change > 0 ? '+' : ''}{changePct}% from last year
            </span>
          )}
          <span style={{ fontSize: '28px', color: OG.secondary }}>
            {`\u00A3${dailyCost}/day`}
          </span>
        </div>
      </div>

      {/* Brand */}
      {ogStoryBrand(councilName, council.type_name)}
    </div>
  );
}

// ── Spending (Story) ──────────────────────────────────────────────────────────

export function renderSpendingStory(council: Council, councilName: string): ReactElement {
  const budget = council.budget;
  if (!budget?.total_service) return <div style={{ display: 'flex' }}>No data</div>;

  const categories = Object.entries(BUDGET_CATEGORIES)
    .map(([key, label]) => ({
      key,
      label,
      value: (budget[key as keyof typeof budget] as number | null) ?? 0,
    }))
    .filter((c) => c.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);

  const maxValue = categories[0]?.value || 1;

  return ogStoryWrap(
    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%' }}>
      {/* Title */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
        <span style={{ fontSize: '24px', color: OG.muted, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          {council.type_name}
        </span>
        <span style={{ fontSize: '48px', fontWeight: 700, color: OG.text }}>
          What your tax pays for
        </span>
        <span style={{ fontSize: '28px', color: OG.muted }}>
          {formatBudgetOG(budget.total_service)} total budget
        </span>
      </div>

      {/* Bars */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '36px' }}>
        {categories.map((cat) => {
          const pct = (cat.value / maxValue) * 100;
          return (
            <div key={cat.key} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span style={{ fontSize: '28px', fontWeight: 600, color: OG.text }}>{cat.label}</span>
                <span style={{ fontSize: '28px', fontWeight: 700, color: OG.text }}>
                  {formatBudgetOG(cat.value)}
                </span>
              </div>
              <div style={{ display: 'flex', height: '14px', borderRadius: '9999px', backgroundColor: OG.barBg, overflow: 'hidden' }}>
                <div style={{ display: 'flex', width: `${pct}%`, height: '100%', borderRadius: '9999px', backgroundColor: OG.bar }} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Brand */}
      {ogStoryBrand(councilName, council.type_name)}
    </div>
  );
}

// ── Bill History (Story) ──────────────────────────────────────────────────────

export function renderBillHistoryStory(council: Council, councilName: string): ReactElement {
  const tax = council.council_tax;
  if (!tax) return <div style={{ display: 'flex' }}>No data</div>;

  const years = [
    { year: '2021', value: tax.band_d_2021 },
    { year: '2022', value: tax.band_d_2022 },
    { year: '2023', value: tax.band_d_2023 },
    { year: '2024', value: tax.band_d_2024 },
    { year: '2025', value: tax.band_d_2025 },
  ].filter((y): y is { year: string; value: number } => y.value != null);

  if (years.length < 2) return <div style={{ display: 'flex' }}>Not enough data</div>;

  const values = years.map(y => y.value);
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);
  const range = maxVal - minVal || 1;
  const pad = range * 0.2;
  const yMin = minVal - pad;
  const yMax = maxVal + pad;

  const chartWidth = 864; // 1080 - 2*108 safe margin
  const chartHeight = 500;

  const points = years.map((y, i) => ({
    x: (i / (years.length - 1)) * chartWidth,
    y: (1 - (y.value - yMin) / (yMax - yMin)) * chartHeight,
    year: y.year,
    value: y.value,
  }));

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaPath = linePath + ` L ${points[points.length - 1].x} ${chartHeight} L ${points[0].x} ${chartHeight} Z`;

  const firstVal = years[0].value;
  const lastVal = years[years.length - 1].value;
  const diff = lastVal - firstVal;
  const diffPct = ((diff / firstVal) * 100).toFixed(1);
  const sign = diff >= 0 ? '+' : '';

  return ogStoryWrap(
    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%' }}>
      {/* Title */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
        <span style={{ fontSize: '24px', color: OG.muted, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          {council.type_name}
        </span>
        <span style={{ fontSize: '48px', fontWeight: 700, color: OG.text }}>
          How your bill has changed
        </span>
        <span style={{ fontSize: '36px', fontWeight: 700, color: diff > 0 ? OG.negative : OG.positive }}>
          {sign}{formatCurrencyOG(Math.abs(diff), 2)} ({sign}{diffPct}%)
        </span>
      </div>

      {/* Chart */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ display: 'flex', position: 'relative', width: `${chartWidth}px`, height: `${chartHeight + 100}px` }}>
          <svg width={chartWidth} height={chartHeight} viewBox={`0 0 ${chartWidth} ${chartHeight}`} style={{ position: 'absolute', top: 0, left: 0 }}>
            <path d={areaPath} fill={OG.accent} fillOpacity="0.12" />
            <path d={linePath} fill="none" stroke={OG.accent} strokeWidth="5" />
            {points.map((p, i) => {
              const isLast = i === points.length - 1;
              return (
                <circle
                  key={p.year}
                  cx={p.x}
                  cy={p.y}
                  r={isLast ? 14 : 9}
                  fill={isLast ? OG.accent : OG.bg}
                  stroke={OG.accent}
                  strokeWidth={isLast ? 0 : 4}
                />
              );
            })}
          </svg>

          {/* Labels below chart */}
          {points.map((p, i) => {
            const isLast = i === points.length - 1;
            return (
              <div
                key={p.year}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  position: 'absolute',
                  left: `${p.x - 80}px`,
                  top: `${chartHeight + 16}px`,
                  width: '160px',
                }}
              >
                <span style={{ fontSize: isLast ? '28px' : '24px', fontWeight: isLast ? 700 : 500, color: isLast ? OG.text : OG.secondary }}>
                  {formatCurrencyOG(p.value, 0)}
                </span>
                <span style={{ fontSize: '22px', fontWeight: 500, color: isLast ? OG.text : OG.muted, marginTop: '4px' }}>
                  {p.year}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Brand */}
      {ogStoryBrand(councilName, council.type_name)}
    </div>
  );
}
