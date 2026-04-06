import type { Council } from '@/data/councils';
import type { ReactElement } from 'react';
import { OG_COLORS, formatCurrencyOG } from '../og-shared';

export function renderFinancialHealth(council: Council, _councilName: string): ReactElement {
  const d = council.detailed;
  if (!d) return <div style={{ display: 'flex' }}>No data</div>;

  const reserves = d.reserves;
  const revenueBudget = d.revenue_budget;
  const reserveWeeks = reserves && revenueBudget ? Math.round((reserves / revenueBudget) * 52) : null;
  const budgetGap = d.budget_gap;
  const savingsTarget = d.savings_target;

  const metrics: Array<{ label: string; value: string; color: string }> = [];

  if (reserveWeeks != null && reserves) {
    metrics.push({
      label: 'Reserves',
      value: `${reserveWeeks} weeks (${formatCurrencyOG(reserves, 0)})`,
      color: reserveWeeks < 8 ? '#dc2626' : reserveWeeks < 13 ? '#f59e0b' : OG_COLORS.positive,
    });
  }
  if (budgetGap) {
    metrics.push({
      label: 'Budget gap',
      value: formatCurrencyOG(budgetGap, 0),
      color: '#b45309',
    });
  }
  if (savingsTarget) {
    metrics.push({
      label: 'Savings target',
      value: formatCurrencyOG(savingsTarget, 0),
      color: OG_COLORS.text,
    });
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', fontSize: '32px', fontWeight: 700, color: OG_COLORS.text }}>
        Financial health
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {metrics.map((m) => (
          <div key={m.label} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontSize: '18px', color: OG_COLORS.secondary, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {m.label}
            </span>
            <span style={{ fontSize: '40px', fontWeight: 700, color: m.color, letterSpacing: '-0.02em' }}>
              {m.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
