import type { Council } from '@/data/councils';
import type { ReactElement } from 'react';
import { OG, ogWrap, ogBrand, formatCurrencyOG } from '../og-shared';

export function renderFinancialHealth(council: Council, councilName: string): ReactElement {
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
      value: `${reserveWeeks} weeks`,
      color: reserveWeeks < 8 ? '#ef4444' : reserveWeeks < 13 ? OG.negative : OG.positive,
    });
  }
  if (budgetGap) {
    metrics.push({ label: 'Budget gap', value: formatCurrencyOG(budgetGap, 0), color: OG.negative });
  }
  if (savingsTarget) {
    metrics.push({ label: 'Savings target', value: formatCurrencyOG(savingsTarget, 0), color: OG.text });
  }

  return ogWrap(
    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%' }}>
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'center' }}>
        <div style={{ display: 'flex', fontSize: '72px', fontWeight: 700, color: OG.text, marginBottom: '64px' }}>
          Financial health
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '56px' }}>
          {metrics.map((m) => (
            <div key={m.label} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <span style={{ fontSize: '36px', color: OG.muted, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{m.label}</span>
              <span style={{ fontSize: '100px', fontWeight: 700, color: m.color, letterSpacing: '-0.02em', lineHeight: 1 }}>{m.value}</span>
            </div>
          ))}
        </div>
      </div>

      {ogBrand(councilName, council.type_name)}
    </div>
  );
}
