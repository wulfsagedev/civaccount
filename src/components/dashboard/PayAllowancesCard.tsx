'use client';

import { useState } from 'react';
import {
  ChevronDown,
  ExternalLink,
} from "lucide-react";
import { formatCurrency, formatBudget, type Council } from '@/data/councils';
import CardShareHeader from '@/components/dashboard/CardShareHeader';

interface PayAllowancesCardProps {
  selectedCouncil: Council;
}

const PayAllowancesCard = ({ selectedCouncil }: PayAllowancesCardProps) => {
  const [showAllCouncillors, setShowAllCouncillors] = useState(false);
  const detailed = selectedCouncil.detailed!;

  return (
    <section id="pay" className="card-elevated p-5 sm:p-6">
      <CardShareHeader
        cardType="pay"
        title="Pay & allowances"
        subtitle="Published salary and allowance data"
        councilName={selectedCouncil.name}
      />

      {/* Councillor allowances detail table */}
      {detailed.councillor_allowances_detail && detailed.councillor_allowances_detail.length > 0 && (
        <>
          {/* Subsection header with year chip */}
          <div className="flex items-center justify-between mb-3">
            <p className="type-body-sm font-semibold">Councillor allowances</p>
            <span className="type-caption text-muted-foreground">2024-25</span>
          </div>
          <p className="type-body-sm text-muted-foreground mb-3">Allowances for elected role — most councillors also hold other jobs</p>

          {/* Hook stat */}
          {(() => {
            const highest = [...detailed.councillor_allowances_detail!].sort((a, b) => b.total - a.total)[0];
            return (
              <div className="p-3 rounded-lg bg-muted/30 mb-4">
                <p className="type-body-sm">
                  <span className="font-semibold">Highest allowance:</span>{' '}
                  {highest.name} — {formatCurrency(highest.total, { decimals: 0 })}
                  <span className="text-muted-foreground"> · {detailed.councillor_allowances_detail!.length} councillors</span>
                </p>
              </div>
            );
          })()}

          {/* Councillor rows */}
          <div className="space-y-0">
            {(showAllCouncillors
              ? detailed.councillor_allowances_detail
              : detailed.councillor_allowances_detail.slice(0, 5)
            ).map((cllr, idx) => (
              <div key={idx} className="flex items-baseline justify-between py-2.5 px-2 -mx-2 rounded hover:bg-muted transition-colors">
                <div className="min-w-0 mr-3">
                  <p className="type-body-sm font-medium truncate">{cllr.name}</p>
                  <p className="type-body-sm text-muted-foreground">
                    Basic {formatCurrency(cllr.basic, { decimals: 0 })}
                    {cllr.special ? ` + SRA ${formatCurrency(cllr.special, { decimals: 0 })}` : ''}
                    {cllr.travel ? ` + Travel ${formatCurrency(cllr.travel, { decimals: 0 })}` : ''}
                  </p>
                </div>
                <span className="type-body-sm font-semibold tabular-nums shrink-0">
                  {formatCurrency(cllr.total, { decimals: 0 })}
                </span>
              </div>
            ))}
          </div>

          {/* Prominent expand button */}
          {detailed.councillor_allowances_detail.length > 5 && (
            <button
              onClick={() => setShowAllCouncillors(!showAllCouncillors)}
              className="w-full mt-3 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-muted/40 hover:bg-muted/60 transition-colors type-body-sm font-medium text-foreground cursor-pointer min-h-[44px]"
              aria-expanded={showAllCouncillors}
              aria-controls="councillor-allowances-list"
            >
              <ChevronDown className={`h-4 w-4 transition-transform ${showAllCouncillors ? 'rotate-180' : ''}`} aria-hidden="true" />
              {showAllCouncillors
                ? 'Show less'
                : `Show all ${detailed.councillor_allowances_detail.length} councillors`
              }
            </button>
          )}
        </>
      )}

      {/* Salary band chart */}
      {detailed.salary_bands && detailed.salary_bands.length > 0 && (() => {
        const maxCount = Math.max(...detailed.salary_bands!.map(b => b.count)) || 1;
        const totalStaff = detailed.salary_bands!.reduce((sum, b) => sum + b.count, 0);
        return (
          <div className={detailed?.councillor_allowances_detail?.length ? "mt-6 pt-5 border-t border-border/50" : ""}>
            <p className="type-body-sm font-semibold mb-1">Staff earning over £50,000</p>
            <p className="type-body-sm text-muted-foreground mb-4">{totalStaff.toLocaleString('en-GB')} staff in salary bands above £50k</p>
            <div className="space-y-2.5">
              {detailed.salary_bands!.map((band, idx) => (
                <div key={idx}>
                  <div className="flex items-baseline justify-between mb-1">
                    <span className="type-body-sm text-muted-foreground">{band.band}</span>
                    <span className="type-body-sm font-medium tabular-nums">{band.count}</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-foreground"
                      style={{ width: `${(band.count / maxCount) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      {/* Governance transparency links */}
      {detailed.governance_transparency && detailed.governance_transparency.length > 0 && (
        <div className="mt-6 pt-4 border-t border-border/40">
          <p className="type-caption font-semibold text-muted-foreground mb-2">See the raw data</p>
          <div className="space-y-1.5">
            {detailed.governance_transparency.map((link, idx) => (
              <div key={idx}>
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="type-body-sm underline hover:text-foreground transition-colors inline-flex items-center gap-1"
                >
                  {link.label}
                  <ExternalLink className="h-3 w-3 text-muted-foreground" aria-hidden="true" />
                  <span className="sr-only"> (opens in new tab)</span>
                </a>
                {link.description && (
                  <p className="type-body-sm text-muted-foreground">{link.description}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
};

export default PayAllowancesCard;
