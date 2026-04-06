'use client';

import { memo } from 'react';

/**
 * Product preview — three example dashboard cards.
 * Center card is full opacity with spending data.
 * Side cards are faded with different stats, creating depth.
 */

function MiniCard({ amount, label, items, className }: {
  amount: string;
  label: string;
  items: { name: string; value: string; width: string }[];
  className?: string;
}) {
  return (
    <div className={`rounded-lg border border-border/40 bg-card shadow-sm p-3 text-left ${className || ''}`}>
      <p className="type-overline text-muted-foreground/70 mb-0.5">{label}</p>
      <p className="type-body-lg font-bold tabular-nums leading-tight">{amount}<span className="type-overline font-normal text-muted-foreground ml-0.5">/yr</span></p>
      <div className="h-px bg-border/30 my-2" />
      <div className="space-y-1.5">
        {items.map((item) => (
          <div key={item.name}>
            <div className="flex justify-between">
              <span className="text-[9px] text-muted-foreground">{item.name}</span>
              <span className="text-[9px] text-muted-foreground tabular-nums">{item.value}</span>
            </div>
            <div className="h-[3px] rounded-full bg-muted overflow-hidden">
              <div className="h-full rounded-full bg-foreground/60" style={{ width: item.width }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const DataFlowAnimation = memo(function DataFlowAnimation() {
  return (
    <div
      className="flex items-center justify-center w-full max-w-[480px] mx-auto pointer-events-none select-none"
      aria-hidden="true"
    >
      {/* Left card — faded, slightly smaller, overlaps center */}
      <div className="w-[140px] sm:w-[160px] shrink-0 opacity-[0.15] -mr-3 sm:-mr-4">
        <MiniCard
          amount="£487.00"
          label="You pay this council"
          items={[
            { name: 'Housing', value: '£142', width: '45%' },
            { name: 'Environment', value: '£118', width: '35%' },
            { name: 'Planning', value: '£67', width: '18%' },
          ]}
        />
      </div>

      {/* Center card — full visibility, larger */}
      <div className="w-[180px] sm:w-[200px] shrink-0 z-10">
        <MiniCard
          amount="£1,247.00"
          label="You pay this council"
          items={[
            { name: 'Education', value: '£412', width: '55%' },
            { name: 'Social Care', value: '£318', width: '38%' },
            { name: 'Roads', value: '£156', width: '18%' },
          ]}
        />
      </div>

      {/* Right card — faded, slightly smaller, overlaps center */}
      <div className="w-[140px] sm:w-[160px] shrink-0 opacity-[0.15] -ml-3 sm:-ml-4">
        <MiniCard
          amount="£1,891.00"
          label="You pay this council"
          items={[
            { name: 'Social Care', value: '£612', width: '52%' },
            { name: 'Education', value: '£498', width: '40%' },
            { name: 'Highways', value: '£203', width: '16%' },
          ]}
        />
      </div>
    </div>
  );
});

export { DataFlowAnimation };
