import type { ReactElement } from 'react';

export const OG_COLORS = {
  bg: '#f5f5f5',
  text: '#1c1917',
  secondary: '#737373',
  muted: '#a3a3a3',
  bar: '#1c1917',
  positive: '#16a34a',
  negative: '#f59e0b',
  badgeBg: '#eef2ff',
  badgeText: '#4338ca',
  border: '#e5e5e5',
} as const;

export function ogHeader(councilName: string, typeName?: string): ReactElement {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <div
          style={{
            width: '44px',
            height: '44px',
            borderRadius: '50%',
            backgroundColor: OG_COLORS.text,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: '22px',
            fontWeight: 700,
          }}
        >
          C
        </div>
        <span style={{ fontSize: '24px', fontWeight: 700, color: OG_COLORS.text }}>CivAccount</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {typeName && (
          <span style={{ fontSize: '16px', color: OG_COLORS.muted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {typeName}
          </span>
        )}
        <span style={{ fontSize: '20px', color: OG_COLORS.secondary, fontWeight: 500 }}>
          {councilName}
        </span>
      </div>
    </div>
  );
}

export function ogFooter(): ReactElement {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
      <span style={{ fontSize: '18px', color: OG_COLORS.muted }}>2025-26</span>
      <span style={{ fontSize: '18px', color: OG_COLORS.muted }}>civaccount.uk</span>
    </div>
  );
}

export function ogCardWrapper(children: ReactElement): ReactElement {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        width: '100%',
        height: '100%',
        padding: '48px 56px',
        backgroundColor: OG_COLORS.bg,
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      {children}
    </div>
  );
}

export function formatCurrencyOG(value: number, decimals = 0): string {
  return `\u00A3${value.toLocaleString('en-GB', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`;
}

export function formatBudgetOG(thousands: number): string {
  const actual = thousands * 1000;
  if (actual >= 1_000_000_000) return `\u00A3${(actual / 1_000_000_000).toFixed(1)}bn`;
  if (actual >= 1_000_000) return `\u00A3${(actual / 1_000_000).toFixed(1)}m`;
  return `\u00A3${(actual / 1000).toFixed(0)}k`;
}
