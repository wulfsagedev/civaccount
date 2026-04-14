'use client';

import {
  AlertTriangle,
  AlertOctagon,
  FileWarning,
} from "lucide-react";
import { formatCurrency, type Council } from '@/data/councils';
import CardShareHeader from '@/components/dashboard/CardShareHeader';
import SourceAnnotation from '@/components/ui/source-annotation';
import { getProvenance } from '@/data/provenance';

interface FinancialHealthCardProps {
  selectedCouncil: Council;
  reservesInWeeks: number | null;
}

const FinancialHealthCard = ({
  selectedCouncil,
  reservesInWeeks,
}: FinancialHealthCardProps) => {
  const detailed = selectedCouncil.detailed!;

  return (
    <>
      {/* Financial Health */}
      {(detailed.savings_achieved || detailed.reserves || detailed.mtfs_deficit) && (
        <section id="financial-health" className="card-elevated p-5 sm:p-6">
          <CardShareHeader
            cardType="financial-health"
            title="Council finances"
            subtitle="Key financial figures"
            councilName={selectedCouncil.name}
          />

          {/* Primary metric - reserves */}
          {detailed.reserves && (
            <div className="mb-5">
              <p className="type-caption text-muted-foreground mb-1">Emergency reserves</p>
              <SourceAnnotation
                provenance={getProvenance('detailed.reserves', selectedCouncil)}
                reportContext={{
                  council: selectedCouncil.name,
                  field: 'Emergency reserves',
                  value: formatCurrency(detailed.reserves, { decimals: 0 }),
                }}
              >
                <p className="type-metric tabular-nums">
                  {formatCurrency(detailed.reserves, { decimals: 0 })}
                </p>
              </SourceAnnotation>
              {reservesInWeeks && (
                <p className="type-body-sm text-muted-foreground mt-1">
                  Enough to cover {reservesInWeeks} weeks of running costs
                </p>
              )}
            </div>
          )}

          {/* Secondary metrics */}
          {(detailed.savings_achieved || detailed.mtfs_deficit) && (
            <div className="space-y-3 pt-4 border-t border-border/50">
              {detailed.savings_achieved && (
                <div className="flex items-baseline justify-between">
                  <span className="type-body-sm text-muted-foreground">Saved this year</span>
                  <span className="type-body font-semibold tabular-nums text-positive">
                    <SourceAnnotation
                      provenance={getProvenance('detailed.savings_target', selectedCouncil)}
                      reportContext={{
                        council: selectedCouncil.name,
                        field: 'Savings achieved this year',
                        value: formatCurrency(detailed.savings_achieved, { decimals: 0 }),
                      }}
                    >{formatCurrency(detailed.savings_achieved, { decimals: 0 })}</SourceAnnotation>
                  </span>
                </div>
              )}
              {detailed.mtfs_deficit && (
                <div className="flex items-baseline justify-between">
                  <span className="type-body-sm text-muted-foreground">Budget gap to close</span>
                  <span className="type-body font-semibold tabular-nums text-negative">
                    <SourceAnnotation
                      provenance={getProvenance('detailed.budget_gap', selectedCouncil)}
                      reportContext={{
                        council: selectedCouncil.name,
                        field: 'Budget gap to close',
                        value: formatCurrency(detailed.mtfs_deficit, { decimals: 0 }),
                      }}
                    >{formatCurrency(detailed.mtfs_deficit, { decimals: 0 })}</SourceAnnotation>
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Context footer */}
          <div className="mt-5 p-3 rounded-lg bg-muted/30">
            <p className="type-caption text-muted-foreground">
              <span className="font-medium text-foreground">About reserves:</span>{' '}
              Savings for emergencies. This is normal practice.
            </p>
          </div>

          {/* Source link */}
          <p className="mt-4 pt-3 border-t border-border/30 type-caption text-muted-foreground">
            Source:{' '}
            {detailed.budget_url ? (
              <a
                href={detailed.budget_url}
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-foreground transition-colors cursor-pointer"
              >
                {selectedCouncil.name} budget
                <span className="sr-only"> (opens in new tab)</span>
              </a>
            ) : detailed.accounts_url ? (
              <a
                href={detailed.accounts_url}
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-foreground transition-colors cursor-pointer"
              >
                {selectedCouncil.name} accounts
                <span className="sr-only"> (opens in new tab)</span>
              </a>
            ) : (
              <a
                href={detailed.website || `https://www.gov.uk/find-local-council`}
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-foreground transition-colors cursor-pointer"
              >
                {selectedCouncil.name} website
                <span className="sr-only"> (opens in new tab)</span>
              </a>
            )}
          </p>
        </section>
      )}

      {/* Accountability */}
      {detailed.accountability && (
        <section className="card-elevated p-5 sm:p-6">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="h-5 w-5 text-negative shrink-0" />
            <h2 className="type-title-2">Accountability</h2>
          </div>
          <p className="type-body-sm text-muted-foreground mb-5">
            Financial concerns flagged by auditors or government
          </p>

          <div className="space-y-3">
            {/* Section 114 notice */}
            {detailed.accountability.section_114?.issued && (
              <div className="p-4 rounded-lg bg-negative/10 border border-negative/20">
                <div className="flex items-start gap-3">
                  <AlertOctagon className="h-5 w-5 text-negative shrink-0 mt-0.5" />
                  <div>
                    <p className="type-body font-semibold text-negative">
                      Section 114 notice issued
                    </p>
                    <p className="type-body-sm text-muted-foreground mt-1">
                      {selectedCouncil.name} said it could not balance its budget
                      {detailed.accountability.section_114.dates?.[0] && (
                        <> in <SourceAnnotation
                          provenance={getProvenance('detailed.accountability', selectedCouncil)}
                          reportContext={{
                            council: selectedCouncil.name,
                            field: 'Section 114 notice date',
                            value: new Date(detailed.accountability.section_114.dates[0]).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }),
                          }}
                        >{new Date(detailed.accountability.section_114.dates[0]).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}</SourceAnnotation></>
                      )}
                      {(detailed.accountability.section_114.dates?.length ?? 0) > 1 && (
                        <> (and again in <SourceAnnotation
                          provenance={getProvenance('detailed.accountability', selectedCouncil)}
                          reportContext={{
                            council: selectedCouncil.name,
                            field: 'Section 114 notice date (latest)',
                            value: new Date(detailed.accountability.section_114.dates![detailed.accountability.section_114.dates!.length - 1]).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }),
                          }}
                        >{new Date(detailed.accountability.section_114.dates![detailed.accountability.section_114.dates!.length - 1]).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}</SourceAnnotation>)</>
                      )}
                      . This is rare — only 8 councils have done this since 2018.
                    </p>
                    {detailed.accountability.section_114.reason && (
                      <p className="type-caption text-muted-foreground mt-2">
                        {detailed.accountability.section_114.reason}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Government intervention */}
            {detailed.accountability.government_intervention && (
              <div className="p-4 rounded-lg bg-negative/5 border border-border/50">
                <div className="flex items-start gap-3">
                  <FileWarning className="h-5 w-5 text-negative/80 shrink-0 mt-0.5" />
                  <div>
                    <p className="type-body font-semibold">
                      Government commissioners appointed
                    </p>
                    <p className="type-body-sm text-muted-foreground mt-1">
                      {detailed.accountability.intervention_reason || `The government sent in commissioners to oversee ${selectedCouncil.name}'s finances.`}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Audit opinion */}
            {detailed.accountability.audit_opinion && (
              <div className="flex items-baseline justify-between p-3 rounded-lg bg-muted/30">
                <span className="type-body-sm text-muted-foreground">
                  Audit opinion{detailed.accountability.audit_year ? (
                    <> (<SourceAnnotation
                      provenance={getProvenance('detailed.accountability', selectedCouncil)}
                      reportContext={{
                        council: selectedCouncil.name,
                        field: 'Audit year',
                        value: String(detailed.accountability.audit_year),
                      }}
                    >{detailed.accountability.audit_year}</SourceAnnotation>)</>
                  ) : ''}
                </span>
                <span className={`type-body-sm font-semibold ${
                  detailed.accountability.audit_opinion === 'Qualified' || detailed.accountability.audit_opinion === 'Adverse'
                    ? 'text-negative'
                    : detailed.accountability.audit_opinion === 'Disclaimed'
                    ? 'text-muted-foreground'
                    : 'text-foreground'
                }`}>
                  <SourceAnnotation
                    provenance={getProvenance('detailed.accountability', selectedCouncil)}
                    reportContext={{
                      council: selectedCouncil.name,
                      field: 'Audit opinion',
                      value: detailed.accountability.audit_opinion,
                    }}
                  >{detailed.accountability.audit_opinion}</SourceAnnotation>
                </span>
              </div>
            )}
          </div>

          {/* Context footer */}
          <div className="mt-5 p-3 rounded-lg bg-muted/30">
            <p className="type-caption text-muted-foreground">
              <span className="font-medium text-foreground">What is a Section 114 notice?</span>{' '}
              When a council cannot balance its budget, the chief finance officer must issue a Section 114 notice. This stops all new spending except essential services.
            </p>
          </div>

          {/* Source */}
          <p className="mt-4 pt-3 border-t border-border/30 type-caption text-muted-foreground">
            Source:{' '}
            <a
              href="https://www.instituteforgovernment.org.uk/explainer/local-authority-section-114-notices"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-foreground transition-colors cursor-pointer"
            >
              Institute for Government
              <span className="sr-only"> (opens in new tab)</span>
            </a>
          </p>
        </section>
      )}
    </>
  );
};

export default FinancialHealthCard;
