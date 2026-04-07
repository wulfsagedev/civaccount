import type { Council } from '@/data/councils';
import type { ReactElement } from 'react';
import { OG_COLORS, formatCurrencyOG } from '../og-shared';

export function renderBillHistory(council: Council, _councilName: string): ReactElement {
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

  const values = years.map((y) => y.value);
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);
  const range = maxVal - minVal || 1;
  const pad = range * 0.25;
  const yMin = minVal - pad;
  const yMax = maxVal + pad;

  // Chart area
  const chartLeft = 60;
  const chartRight = 1020;
  const chartTop = 10;
  const chartBottom = 200;
  const chartWidth = chartRight - chartLeft;
  const chartHeight = chartBottom - chartTop;

  const points = years.map((y, i) => ({
    x: chartLeft + (i / (years.length - 1)) * chartWidth,
    y: chartTop + (1 - (y.value - yMin) / (yMax - yMin)) * chartHeight,
    year: y.year,
    value: y.value,
  }));

  // SVG path for line and area fill
  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaPath = linePath + ` L ${points[points.length - 1].x} ${chartBottom} L ${points[0].x} ${chartBottom} Z`;

  // 5-year change
  const firstVal = years[0].value;
  const lastVal = years[years.length - 1].value;
  const diff = lastVal - firstVal;
  const diffPct = ((diff / firstVal) * 100).toFixed(1);
  const sign = diff >= 0 ? '+' : '';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {/* Title */}
      <div style={{ display: 'flex', fontSize: '44px', fontWeight: 700, color: OG_COLORS.text, letterSpacing: '-0.02em' }}>
        How your bill has changed
      </div>
      <div style={{ display: 'flex', fontSize: '22px', color: OG_COLORS.secondary, marginBottom: '4px' }}>
        Band D council tax over the last {years.length} years
      </div>

      {/* Chart */}
      <div style={{ display: 'flex', position: 'relative', width: '1080px', height: '290px' }}>
        <svg width="1080" height="210" viewBox="0 0 1080 210" style={{ position: 'absolute', top: 0, left: 0 }}>
          <path d={areaPath} fill={OG_COLORS.text} fillOpacity="0.06" />
          <path d={linePath} fill="none" stroke={OG_COLORS.text} strokeWidth="3.5" />
          {points.map((p, i) => {
            const isLast = i === points.length - 1;
            return (
              <circle
                key={p.year}
                cx={p.x}
                cy={p.y}
                r={isLast ? 9 : 6}
                fill={isLast ? OG_COLORS.text : OG_COLORS.bg}
                stroke={OG_COLORS.text}
                strokeWidth={isLast ? 0 : 2.5}
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
                left: `${p.x - 55}px`,
                top: `${chartBottom + 14}px`,
                width: '110px',
              }}
            >
              <span style={{ fontSize: isLast ? '24px' : '22px', fontWeight: isLast ? 700 : 500, color: isLast ? OG_COLORS.text : OG_COLORS.secondary }}>
                {p.year}
              </span>
              <span style={{ fontSize: isLast ? '26px' : '22px', fontWeight: isLast ? 700 : 500, color: isLast ? OG_COLORS.text : OG_COLORS.secondary, marginTop: '4px' }}>
                {formatCurrencyOG(p.value, 0)}
              </span>
            </div>
          );
        })}
      </div>

      {/* Change summary */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 20px',
          backgroundColor: 'rgba(0,0,0,0.04)',
          borderRadius: '12px',
        }}
      >
        <span style={{ fontSize: '24px', fontWeight: 500, color: OG_COLORS.secondary }}>
          Change over {years.length} years
        </span>
        <span
          style={{
            fontSize: '28px',
            fontWeight: 700,
            color: diff > 0 ? '#b45309' : OG_COLORS.positive,
          }}
        >
          {sign}{formatCurrencyOG(Math.abs(diff), 2)} ({sign}{diffPct}%)
        </span>
      </div>
    </div>
  );
}
