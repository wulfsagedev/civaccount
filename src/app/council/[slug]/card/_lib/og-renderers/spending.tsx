import type { Council } from '@/data/councils';
import type { ReactElement } from 'react';
import { OG_COLORS, formatBudgetOG } from '../og-shared';
import { BUDGET_CATEGORIES } from '@/lib/proposals';

export function renderSpending(council: Council, _councilName: string): ReactElement {
  const budget = council.budget;
  if (!budget?.total_service) return <div style={{ display: 'flex' }}>No data</div>;

  const total = budget.total_service * 1000;
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <div style={{ display: 'flex', fontSize: '32px', fontWeight: 700, color: OG_COLORS.text }}>
          What your tax pays for
        </div>
        <div style={{ display: 'flex', fontSize: '20px', color: OG_COLORS.muted }}>
          Total: {formatBudgetOG(budget.total_service)}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '8px' }}>
        {categories.map((cat) => {
          const pct = (cat.value / maxValue) * 100;
          return (
            <div key={cat.key} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span style={{ fontSize: '20px', fontWeight: 600, color: OG_COLORS.text }}>{cat.label}</span>
                <span style={{ fontSize: '20px', fontWeight: 600, color: OG_COLORS.text }}>
                  {formatBudgetOG(cat.value)}
                </span>
              </div>
              <div style={{ display: 'flex', height: '8px', borderRadius: '9999px', backgroundColor: '#e5e5e5', overflow: 'hidden' }}>
                <div style={{ display: 'flex', width: `${pct}%`, height: '100%', borderRadius: '9999px', backgroundColor: OG_COLORS.bar }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
