import type { Council } from '@/data/councils';
import type { ReactElement } from 'react';
import { OG, ogWrap, ogBrand, formatBudgetOG } from '../og-shared';
import { BUDGET_CATEGORIES } from '@/lib/proposals';

export function renderSpending(council: Council, councilName: string): ReactElement {
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
    .slice(0, 5);

  const maxValue = categories[0]?.value || 1;

  return ogWrap(
    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%' }}>
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '56px' }}>
          <span style={{ fontSize: '72px', fontWeight: 700, color: OG.text }}>
            What your tax pays for
          </span>
          <span style={{ fontSize: '48px', color: OG.muted }}>
            {formatBudgetOG(budget.total_service)} total
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
          {categories.map((cat) => {
            const pct = (cat.value / maxValue) * 100;
            return (
              <div key={cat.key} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <span style={{ fontSize: '44px', fontWeight: 600, color: OG.text }}>{cat.label}</span>
                  <span style={{ fontSize: '44px', fontWeight: 700, color: OG.text }}>
                    {formatBudgetOG(cat.value)}
                  </span>
                </div>
                <div style={{ display: 'flex', height: '20px', borderRadius: '9999px', backgroundColor: OG.barBg, overflow: 'hidden' }}>
                  <div style={{ display: 'flex', width: `${pct}%`, height: '100%', borderRadius: '9999px', backgroundColor: OG.bar }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {ogBrand(councilName, council.type_name)}
    </div>
  );
}
