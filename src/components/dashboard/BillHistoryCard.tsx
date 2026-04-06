'use client';

import { formatCurrency, type Council } from '@/data/councils';
import CardShareHeader from '@/components/dashboard/CardShareHeader';

interface BillHistoryCardProps {
  selectedCouncil: Council;
}

const BillHistoryCard = ({ selectedCouncil }: BillHistoryCardProps) => {
  const councilTax = selectedCouncil.council_tax!;

  const data = [
    { year: '2021-22', amount: councilTax.band_d_2021! },
    { year: '2022-23', amount: councilTax.band_d_2022! },
    { year: '2023-24', amount: councilTax.band_d_2023! },
    { year: '2024-25', amount: councilTax.band_d_2024! },
    { year: '2025-26', amount: councilTax.band_d_2025 },
  ];
  const values = data.map(d => d.amount);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const padding = (maxValue - minValue) * 0.2 || 10;
  const chartMin = minValue - padding;
  const chartMax = maxValue + padding;
  const chartHeight = 120;

  // Calculate points for the line
  const points = data.map((item, index) => {
    const x = (index / (data.length - 1)) * 100;
    const y = chartHeight - ((item.amount - chartMin) / (chartMax - chartMin)) * chartHeight;
    return { x, y, ...item };
  });

  // Create SVG path
  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

  // Create area path (for gradient fill)
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${chartHeight} L ${points[0].x} ${chartHeight} Z`;

  const fiveYearChange = councilTax.band_d_2025 - councilTax.band_d_2021!;
  const fiveYearPercent = ((councilTax.band_d_2025 - councilTax.band_d_2021!) / councilTax.band_d_2021!) * 100;

  return (
    <section id="bill-history" className="card-elevated p-5 sm:p-6">
      <CardShareHeader
        cardType="bill-history"
        title="How your bill has changed"
        subtitle="Band D council tax over the last 5 years"
        councilName={selectedCouncil.name}
      />

      {/* Chart */}
      <div>
        {/* Chart container with explicit height for circle positioning */}
        <div className="relative h-32">
          <svg
            viewBox={`0 0 100 ${chartHeight}`}
            preserveAspectRatio="none"
            className="w-full h-full"
          >
            {/* Gradient definition */}
            <defs>
              <linearGradient id="billHistoryGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" className="[stop-color:hsl(var(--foreground))] [stop-opacity:0.08]" />
                <stop offset="100%" className="[stop-color:hsl(var(--foreground))] [stop-opacity:0]" />
              </linearGradient>
            </defs>

            {/* Area fill */}
            <path d={areaPath} fill="url(#billHistoryGradient)" />

            {/* Line */}
            <path
              d={linePath}
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-foreground"
              vectorEffect="non-scaling-stroke"
            />
          </svg>

          {/* Data points as HTML elements to avoid SVG stretching */}
          {points.map((point, index) => (
            <div
              key={point.year}
              className={`absolute w-3 h-3 rounded-full border-2 border-foreground -translate-x-1/2 -translate-y-1/2 ${
                index === points.length - 1 ? 'bg-foreground' : 'bg-background'
              }`}
              style={{
                left: `${point.x}%`,
                top: `${(point.y / chartHeight) * 100}%`,
              }}
            />
          ))}
        </div>

        {/* X-axis labels - responsive sizing */}
        <div className="flex justify-between mt-4 gap-1">
          {data.map((item, index) => (
            <div key={item.year} className="text-center min-w-0 flex-1">
              <p className={`type-caption truncate ${index === data.length - 1 ? 'font-semibold' : 'text-muted-foreground'}`}>
                {item.year.split('-')[0]}
              </p>
              <p className={`type-caption tabular-nums ${index === data.length - 1 ? 'font-semibold' : 'text-muted-foreground'}`}>
                {formatCurrency(item.amount, { decimals: 0 })}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* 5-year change callout */}
      <div className="mt-5 p-3 rounded-lg bg-muted/30">
        <div className="flex items-center justify-between">
          <span className="type-caption text-muted-foreground">Change over 5 years</span>
          <span className={`type-body-sm font-semibold tabular-nums ${fiveYearChange > 0 ? 'text-negative' : 'text-positive'}`}>
            {fiveYearChange > 0 ? '+' : ''}{formatCurrency(fiveYearChange, { decimals: 2 })} ({fiveYearPercent > 0 ? '+' : ''}{fiveYearPercent.toFixed(1)}%)
          </span>
        </div>
      </div>

      {/* Source link */}
      <p className="mt-4 pt-3 border-t border-border/30 type-caption text-muted-foreground">
        Source:{' '}
        <a
          href="https://www.gov.uk/government/collections/council-tax-statistics"
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-foreground transition-colors cursor-pointer"
        >
          GOV.UK Council Tax Statistics
          <span className="sr-only"> (opens in new tab)</span>
        </a>
      </p>
    </section>
  );
};

export default BillHistoryCard;
