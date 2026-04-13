import type { Council } from '@/data/councils';
import type { ReactElement } from 'react';
import { OG, ogWrap, ogBrand, formatCurrencyOG } from '../og-shared';

export function renderBillHistory(council: Council, councilName: string): ReactElement {
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
  const pad = range * 0.2;
  const yMin = minVal - pad;
  const yMax = maxVal + pad;

  const containerWidth = 2040; // fits inside ogWrap safe zone (2400 - 180px×2)
  const chartLeft = 120;
  const chartRight = 1920; // leaves 120px for label overhang
  const chartTop = 20;
  const chartBottom = 440;
  const chartWidth = chartRight - chartLeft;
  const chartHeight = chartBottom - chartTop;

  const points = years.map((y, i) => ({
    x: chartLeft + (i / (years.length - 1)) * chartWidth,
    y: chartTop + (1 - (y.value - yMin) / (yMax - yMin)) * chartHeight,
    year: y.year,
    value: y.value,
  }));

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaPath = linePath + ` L ${points[points.length - 1].x} ${chartBottom} L ${points[0].x} ${chartBottom} Z`;

  const firstVal = years[0].value;
  const lastVal = years[years.length - 1].value;
  const diff = lastVal - firstVal;
  const diffPct = ((diff / firstVal) * 100).toFixed(1);
  const sign = diff >= 0 ? '+' : '';

  return ogWrap(
    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%' }}>
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '16px' }}>
          <span style={{ fontSize: '72px', fontWeight: 700, color: OG.text }}>
            How your bill has changed
          </span>
          <span style={{ fontSize: '52px', fontWeight: 700, color: diff > 0 ? OG.negative : OG.positive }}>
            {sign}{formatCurrencyOG(Math.abs(diff), 2)} ({sign}{diffPct}%)
          </span>
        </div>

        {/* Chart fills remaining space */}
        <div style={{ display: 'flex', position: 'relative', width: `${containerWidth}px`, height: '580px', marginTop: '24px' }}>
          <svg width={containerWidth} height="460" viewBox={`0 0 ${containerWidth} 460`} style={{ position: 'absolute', top: 0, left: 0 }}>
            <path d={areaPath} fill={OG.accent} fillOpacity="0.12" />
            <path d={linePath} fill="none" stroke={OG.accent} strokeWidth="7" />
            {points.map((p, i) => {
              const isLast = i === points.length - 1;
              return (
                <circle
                  key={p.year}
                  cx={p.x}
                  cy={p.y}
                  r={isLast ? 18 : 12}
                  fill={isLast ? OG.accent : OG.bg}
                  stroke={OG.accent}
                  strokeWidth={isLast ? 0 : 5}
                />
              );
            })}
          </svg>

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
                  left: `${p.x - 120}px`,
                  top: `${chartBottom + 28}px`,
                  width: '240px',
                }}
              >
                <span style={{ fontSize: isLast ? '48px' : '40px', fontWeight: isLast ? 700 : 500, color: isLast ? OG.text : OG.secondary }}>
                  {formatCurrencyOG(p.value, 0)}
                </span>
                <span style={{ fontSize: '36px', fontWeight: 500, color: isLast ? OG.text : OG.muted, marginTop: '4px' }}>
                  {p.year}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {ogBrand(councilName, council.type_name)}
    </div>
  );
}
