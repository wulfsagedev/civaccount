import type { Council } from '@/data/councils';
import type { ReactElement } from 'react';
import { OG, ogWrap, ogBrand, formatCurrencyOG } from '../og-shared';
import { BUDGET_CATEGORIES } from '@/lib/proposals';

export function renderTaxCard(council: Council, councilName: string): ReactElement {
  const precepts = council.detailed?.precepts;
  const bandD = council.council_tax?.band_d_2025;
  const bandDPrev = council.council_tax?.band_d_2024;

  if (!bandD) return <div style={{ display: 'flex' }}>No data</div>;

  const total = precepts?.length ? precepts.reduce((s, p) => s + p.band_d, 0) : bandD;
  const weeklyCost = (total / 52).toFixed(2);
  const changePct = bandDPrev ? (((bandD - bandDPrev) / bandDPrev) * 100).toFixed(1) : null;

  // Top 3 service weekly costs
  const budget = council.budget;
  const serviceCosts = budget?.total_service
    ? Object.entries(BUDGET_CATEGORIES)
        .map(([key, label]) => {
          const amount = (budget[key as keyof typeof budget] as number | null) ?? 0;
          if (amount <= 0) return null;
          return { label, weekly: ((bandD / 52) * (amount / budget.total_service!)) };
        })
        .filter((x): x is NonNullable<typeof x> => x !== null)
        .sort((a, b) => b.weekly - a.weekly)
        .slice(0, 3)
    : [];

  return ogWrap(
    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%' }}>
      {/* Top — council name */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <span style={{ fontSize: '40px', fontWeight: 600, color: OG.secondary, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          {council.type_name}
        </span>
        <span style={{ fontSize: '76px', fontWeight: 700, color: OG.text, lineHeight: 1.05 }}>
          {councilName}
        </span>
        <span style={{ fontSize: '40px', fontWeight: 500, color: OG.secondary }}>
          Council tax receipt · 2025-26
        </span>
      </div>

      {/* Middle — receipt body */}
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {/* Hero — weekly cost */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '24px', marginBottom: '40px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontSize: '36px', fontWeight: 600, color: OG.secondary, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Band D · Per week
            </span>
            <span style={{ fontSize: '120px', fontWeight: 700, color: OG.text, letterSpacing: '-0.02em', lineHeight: 1 }}>
              {`\u00A3${weeklyCost}`}
            </span>
          </div>
          <span style={{ fontSize: '44px', fontWeight: 500, color: OG.secondary }}>
            {formatCurrencyOG(total, 2)}/year
          </span>
        </div>

        {/* Service weekly breakdown */}
        {serviceCosts.length > 0 && (
          <div style={{ display: 'flex', gap: '48px', marginBottom: '40px' }}>
            {serviceCosts.map((s) => (
              <div key={s.label} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ fontSize: '32px', fontWeight: 600, color: OG.secondary, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  {s.label}
                </span>
                <span style={{ fontSize: '48px', fontWeight: 700, color: OG.text }}>
                  {formatCurrencyOG(s.weekly, 2)}<span style={{ fontSize: '32px', color: OG.secondary }}>/wk</span>
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Footer — change + CTA */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: `2px solid ${OG.border}`, paddingTop: '24px' }}>
          <span style={{ fontSize: '40px', fontWeight: 500, color: OG.secondary }}>
            {changePct ? `${Number(changePct) > 0 ? '+' : ''}${changePct}% from last year` : ''}
          </span>
          <span style={{ fontSize: '40px', fontWeight: 600, color: OG.text }}>
            What do you pay?
          </span>
        </div>
      </div>

      {/* Brand */}
      {ogBrand(councilName, council.type_name)}
    </div>
  );
}
