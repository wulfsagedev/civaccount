import type { Council } from '@/data/councils';
import type { ReactElement } from 'react';
import { OG, ogWrap, ogBrand, formatCurrencyOG } from '../og-shared';

export function renderPay(council: Council, councilName: string): ReactElement {
  const d = council.detailed;
  if (!d) return <div style={{ display: 'flex' }}>No data</div>;

  const ceoSalary = d.chief_executive_salary;
  const basicAllowance = d.councillor_basic_allowance;
  const totalAllowances = d.total_allowances_cost;

  return ogWrap(
    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%' }}>
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'center' }}>
        <div style={{ display: 'flex', fontSize: '72px', fontWeight: 700, color: OG.text, marginBottom: '64px' }}>
          Pay & allowances
        </div>

        <div style={{ display: 'flex', gap: '100px' }}>
          {ceoSalary && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <span style={{ fontSize: '32px', color: OG.muted, textTransform: 'uppercase', letterSpacing: '0.08em' }}>CEO salary</span>
              <span style={{ fontSize: '120px', fontWeight: 700, color: OG.text, letterSpacing: '-0.02em', lineHeight: 1 }}>{formatCurrencyOG(ceoSalary, 0)}</span>
            </div>
          )}
          {basicAllowance && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <span style={{ fontSize: '32px', color: OG.muted, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Councillor allowance</span>
              <span style={{ fontSize: '120px', fontWeight: 700, color: OG.text, letterSpacing: '-0.02em', lineHeight: 1 }}>{formatCurrencyOG(basicAllowance, 0)}</span>
              <span style={{ fontSize: '32px', color: OG.secondary, marginTop: '8px' }}>per year, per councillor</span>
            </div>
          )}
        </div>

        {totalAllowances && (
          <div style={{ display: 'flex', fontSize: '40px', color: OG.secondary, marginTop: '56px' }}>
            Total allowances paid: {formatCurrencyOG(totalAllowances, 0)}
          </div>
        )}
      </div>

      {ogBrand(councilName, council.type_name)}
    </div>
  );
}
