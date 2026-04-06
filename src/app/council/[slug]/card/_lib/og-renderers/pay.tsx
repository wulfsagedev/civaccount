import type { Council } from '@/data/councils';
import type { ReactElement } from 'react';
import { OG_COLORS, formatCurrencyOG } from '../og-shared';

export function renderPay(council: Council, _councilName: string): ReactElement {
  const d = council.detailed;
  if (!d) return <div style={{ display: 'flex' }}>No data</div>;

  const ceoSalary = d.chief_executive_salary;
  const basicAllowance = d.councillor_basic_allowance;
  const totalAllowances = d.total_allowances_cost;
  const topBands = d.salary_bands?.slice(0, 4);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', fontSize: '32px', fontWeight: 700, color: OG_COLORS.text }}>
        Pay & allowances
      </div>

      <div style={{ display: 'flex', gap: '48px' }}>
        {/* CEO Salary */}
        {ceoSalary && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontSize: '16px', color: OG_COLORS.muted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              CEO salary
            </span>
            <span style={{ fontSize: '48px', fontWeight: 700, color: OG_COLORS.text, letterSpacing: '-0.02em' }}>
              {formatCurrencyOG(ceoSalary, 0)}
            </span>
          </div>
        )}

        {/* Basic allowance */}
        {basicAllowance && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontSize: '16px', color: OG_COLORS.muted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Councillor allowance
            </span>
            <span style={{ fontSize: '48px', fontWeight: 700, color: OG_COLORS.text, letterSpacing: '-0.02em' }}>
              {formatCurrencyOG(basicAllowance, 0)}
            </span>
            <span style={{ fontSize: '16px', color: OG_COLORS.secondary }}>per year, per councillor</span>
          </div>
        )}
      </div>

      {/* Salary bands */}
      {topBands && topBands.length > 0 && (
        <div style={{ display: 'flex', gap: '24px', marginTop: '4px' }}>
          {topBands.map((band) => (
            <div key={band.band} style={{ display: 'flex', flexDirection: 'column', gap: '2px', padding: '8px 16px', backgroundColor: 'rgba(0,0,0,0.03)', borderRadius: '8px' }}>
              <span style={{ fontSize: '14px', color: OG_COLORS.muted }}>{band.band}</span>
              <span style={{ fontSize: '24px', fontWeight: 700, color: OG_COLORS.text }}>{band.count}</span>
              <span style={{ fontSize: '14px', color: OG_COLORS.muted }}>staff</span>
            </div>
          ))}
        </div>
      )}

      {totalAllowances && (
        <div style={{ display: 'flex', fontSize: '18px', color: OG_COLORS.secondary }}>
          Total allowances paid: {formatCurrencyOG(totalAllowances, 0)}
        </div>
      )}
    </div>
  );
}
