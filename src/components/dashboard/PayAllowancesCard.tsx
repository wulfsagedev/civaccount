'use client';

import { useState } from 'react';
import {
  ChevronDown,
  ExternalLink,
} from "lucide-react";
import { formatCurrency, formatBudget, toSentenceTypeName, type Council } from '@/data/councils';
import CardShareHeader from '@/components/dashboard/CardShareHeader';
import { getTypeAverages } from '@/lib/council-averages';
import SourceAnnotation from '@/components/ui/source-annotation';
import { getProvenance } from '@/data/provenance';
import DataGapNotice from '@/components/ui/data-gap-notice';

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
            const avgAllowance = getTypeAverages(selectedCouncil.type).basicAllowance;
            const basic = detailed.councillor_basic_allowance;
            return (
              <div className="p-3 rounded-lg bg-muted/30 mb-4 space-y-1">
                <p className="type-body-sm">
                  <span className="font-semibold">Highest allowance:</span>{' '}
                  {highest.name} — <SourceAnnotation
                    provenance={getProvenance('detailed.councillor_allowances_detail', selectedCouncil)}
                    reportContext={{
                      council: selectedCouncil.name,
                      field: `Councillor allowance: ${highest.name} total`,
                      value: formatCurrency(highest.total, { decimals: 0 }),
                    }}
                  >{formatCurrency(highest.total, { decimals: 0 })}</SourceAnnotation>
                  <span className="text-muted-foreground"> · {detailed.councillor_allowances_detail!.length} councillors</span>
                </p>
                {basic && avgAllowance > 0 && (
                  <p className="type-caption text-muted-foreground">
                    Basic allowance: <SourceAnnotation
                      provenance={getProvenance('detailed.councillor_basic_allowance', selectedCouncil)}
                      reportContext={{
                        council: selectedCouncil.name,
                        field: 'Councillor basic allowance',
                        value: formatCurrency(basic, { decimals: 0 }),
                      }}
                    >{formatCurrency(basic, { decimals: 0 })}</SourceAnnotation> · Avg for {toSentenceTypeName(selectedCouncil.type_name)}s: <SourceAnnotation provenance={getProvenance('vs_average', selectedCouncil)}>{formatCurrency(Math.round(avgAllowance), { decimals: 0 })}</SourceAnnotation>
                  </p>
                )}
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
                    Basic <SourceAnnotation
                      provenance={getProvenance('detailed.councillor_allowances_detail', selectedCouncil)}
                      reportContext={{
                        council: selectedCouncil.name,
                        field: `Councillor allowance: ${cllr.name} basic`,
                        value: formatCurrency(cllr.basic, { decimals: 0 }),
                      }}
                    >{formatCurrency(cllr.basic, { decimals: 0 })}</SourceAnnotation>
                    {cllr.special ? <> + SRA <SourceAnnotation
                      provenance={getProvenance('detailed.councillor_allowances_detail', selectedCouncil)}
                      reportContext={{
                        council: selectedCouncil.name,
                        field: `Councillor allowance: ${cllr.name} special responsibility`,
                        value: formatCurrency(cllr.special, { decimals: 0 }),
                      }}
                    >{formatCurrency(cllr.special, { decimals: 0 })}</SourceAnnotation></> : ''}
                    {cllr.travel ? <> + Travel <SourceAnnotation
                      provenance={getProvenance('detailed.councillor_allowances_detail', selectedCouncil)}
                      reportContext={{
                        council: selectedCouncil.name,
                        field: `Councillor allowance: ${cllr.name} travel`,
                        value: formatCurrency(cllr.travel, { decimals: 0 }),
                      }}
                    >{formatCurrency(cllr.travel, { decimals: 0 })}</SourceAnnotation></> : ''}
                  </p>
                </div>
                <span className="type-body-sm font-semibold tabular-nums shrink-0">
                  <SourceAnnotation
                    provenance={getProvenance('detailed.councillor_allowances_detail', selectedCouncil)}
                    reportContext={{
                      council: selectedCouncil.name,
                      field: `Councillor allowance: ${cllr.name} total`,
                      value: formatCurrency(cllr.total, { decimals: 0 }),
                    }}
                  >{formatCurrency(cllr.total, { decimals: 0 })}</SourceAnnotation>
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

      {/* Salary band chart — heading/subtitle describe what's actually in the
          data. Most councils publish bands from £50k upwards (senior staff
          disclosure). Some publish from £20k upwards. We read the lowest band
          label and use the right wording so the header never contradicts the
          chart (old bug: heading said "over £50k" while bars started at £20k). */}
      {detailed.salary_bands && detailed.salary_bands.length > 0 && (() => {
        const maxCount = Math.max(...detailed.salary_bands!.map(b => b.count)) || 1;
        const totalStaff = detailed.salary_bands!.reduce((sum, b) => sum + b.count, 0);
        // Extract the numeric lower bound of the first band label, e.g.
        // "£20k–£25k" → 20, "£50k+" → 50. Fallback to 50 if we can't parse.
        const firstBandLabel = detailed.salary_bands![0]?.band ?? '';
        const lowerBoundMatch = firstBandLabel.match(/£(\d+)k/);
        const lowerK = lowerBoundMatch ? parseInt(lowerBoundMatch[1], 10) : 50;
        const threshold = `£${lowerK.toLocaleString('en-GB')},000`;
        const heading = lowerK >= 50
          ? `Staff earning ${threshold} or more`
          : `Staff pay breakdown`;
        const subtitleSuffix = lowerK >= 50
          ? ` staff earn ${threshold} or more`
          : ` staff are in these pay bands`;
        return (
          <div className={detailed?.councillor_allowances_detail?.length ? "mt-6 pt-5 border-t border-border/50" : ""}>
            <p className="type-body-sm font-semibold mb-1">{heading}</p>
            <p className="type-body-sm text-muted-foreground mb-4">
              <SourceAnnotation
                provenance={getProvenance('detailed.salary_bands', selectedCouncil)}
                reportContext={{
                  council: selectedCouncil.name,
                  field: `Total staff in published salary bands (from ${threshold})`,
                  value: totalStaff.toLocaleString('en-GB'),
                }}
              >{totalStaff.toLocaleString('en-GB')}</SourceAnnotation>{subtitleSuffix}
            </p>
            <div className="space-y-2.5">
              {detailed.salary_bands!.map((band, idx) => (
                <div key={idx}>
                  <div className="flex items-baseline justify-between mb-1">
                    <span className="type-body-sm text-muted-foreground">{band.band}</span>
                    <span className="type-body-sm font-medium tabular-nums">
                      <SourceAnnotation
                        provenance={getProvenance('detailed.salary_bands', selectedCouncil)}
                        reportContext={{
                          council: selectedCouncil.name,
                          field: `Salary band ${band.band} staff count`,
                          value: String(band.count),
                        }}
                      >{band.count}</SourceAnnotation>
                    </span>
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

      {/* Honest gap notices — tell readers when our per-councillor allowance
          table is partial (only top earners published) or absent, and why.
          Rendered at card bottom so it doesn't interrupt the hook stat. */}
      {(() => {
        const detailCount = detailed.councillor_allowances_detail?.length ?? 0;
        const totalCouncillors = detailed.total_councillors ?? 0;
        if (!detailCount) {
          return (
            <div className="mt-6 pt-5 border-t border-border/50">
              <DataGapNotice
                gapKey="councillor_allowances_detail.absent"
                council={selectedCouncil}
              />
            </div>
          );
        }
        // Threshold: 90% of councillors. Below that = thin.
        if (totalCouncillors > 0 && detailCount < totalCouncillors * 0.9) {
          return (
            <div className="mt-6 pt-5 border-t border-border/50">
              <DataGapNotice
                gapKey="councillor_allowances_detail.thin"
                council={selectedCouncil}
                extra={`We have ${detailCount} of ${totalCouncillors} councillors.`}
              />
            </div>
          );
        }
        return null;
      })()}

      {(() => {
        const bandCount = detailed.salary_bands?.length ?? 0;
        if (!bandCount) {
          return (
            <div className="mt-6 pt-5 border-t border-border/50">
              <DataGapNotice
                gapKey="salary_bands.absent"
                council={selectedCouncil}
              />
            </div>
          );
        }
        // Thin only for medium+ councils that really should have 6+ bands.
        if (bandCount < 4 && (detailed.staff_fte ?? 0) > 500) {
          return (
            <div className="mt-6 pt-5 border-t border-border/50">
              <DataGapNotice
                gapKey="salary_bands.thin"
                council={selectedCouncil}
                extra={`${bandCount} band${bandCount === 1 ? "" : "s"} published.`}
              />
            </div>
          );
        }
        return null;
      })()}
    </section>
  );
};

export default PayAllowancesCard;
