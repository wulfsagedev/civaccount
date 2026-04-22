'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ChevronDown,
  ChevronRight,
  ExternalLink,
} from "lucide-react";
import { formatCurrency, formatBudget, getCouncilSlug, getCouncilPopulation, toSentenceTypeName, type Council, type ServiceSpendingDetail } from '@/data/councils';
import CardShareHeader from '@/components/dashboard/CardShareHeader';
import { getTypeAverages } from '@/lib/council-averages';
import SourceAnnotation from '@/components/ui/source-annotation';
import { getProvenance } from '@/data/provenance';
import DataGapNotice from '@/components/ui/data-gap-notice';
import { RankedBarList, RankedBarRow } from '@/components/insights/RankedBarRow';

// Service descriptions with examples
const SERVICE_DETAILS: Record<string, { description: string; examples: string[] }> = {
  environmental: {
    description: 'Bin collection and street cleaning services',
    examples: ['Bin collection', 'Recycling centres', 'Street cleaning', 'Fly-tipping removal']
  },
  planning: {
    description: 'Planning applications and building control',
    examples: ['Planning applications', 'Building control', 'Conservation areas', 'Listed buildings']
  },
  central_services: {
    description: 'Council administration and customer services',
    examples: ['Customer service', 'Council tax collection', 'Elections', 'IT systems']
  },
  cultural: {
    description: 'Libraries, parks, and leisure facilities',
    examples: ['Libraries', 'Parks', 'Leisure centres', 'Museums', 'Sports facilities']
  },
  housing: {
    description: 'Council housing and homelessness services',
    examples: ['Council housing', 'Homelessness support', 'Housing benefits', 'Private rental checks']
  },
  adult_social_care: {
    description: 'Care services for adults and older people',
    examples: ['Care homes', 'Home care visits', 'Disability support', 'Mental health services']
  },
  childrens_social_care: {
    description: 'Child protection and family services',
    examples: ['Child protection', 'Foster care', 'Adoption services', 'Family support']
  },
  education: {
    description: 'School transport and special educational needs',
    examples: ['School transport', 'Special educational needs', 'Education welfare', 'School admissions']
  },
  transport: {
    description: 'Roads, street lights, and footpaths',
    examples: ['Road repairs', 'Potholes', 'Street lights', 'Traffic signals', 'Footpaths']
  },
  public_health: {
    description: 'Public health and prevention services',
    examples: ['Stop smoking services', 'Health visitors', 'Drug & alcohol support', 'Sexual health']
  }
};

interface SpendingCategory {
  name: string;
  amount: number;
  percentage: number;
  key: string;
  yourShare: number | null;
}

interface SpendingCardProps {
  selectedCouncil: Council;
  spendingCategories: SpendingCategory[];
  serviceSpendingMap: Map<string, ServiceSpendingDetail>;
  totalBudget: number | null;
  population: number | null | undefined;
}

const SpendingCard = ({
  selectedCouncil,
  spendingCategories,
  serviceSpendingMap,
  totalBudget,
  population,
}: SpendingCardProps) => {
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const detailed = selectedCouncil.detailed;

  return (
    <>
      {/* Spending breakdown */}
      <section id="spending" className="card-elevated p-5 sm:p-6">
        <CardShareHeader
          cardType="spending"
          title="What your council tax pays for"
          subtitle="This shows how the budget is structured"
          councilName={selectedCouncil.name}
        />

        {/* Service breakdown - uses shared RankedBarRow for consistent spacing/typography */}
        <RankedBarList>
          {spendingCategories.map((category) => {
            const details = SERVICE_DETAILS[category.key];
            const spending = serviceSpendingMap.get(category.key);
            const isExpanded = expandedCategory === category.key;
            const hasDrillDown = !!spending;
            const categoryId = `spending-${category.key}`;
            const shareValue = category.yourShare
              ? formatCurrency(category.yourShare, { decimals: 0 })
              : '';
            const pctText = `${category.percentage.toFixed(0)}%`;

            const row = hasDrillDown ? (
              <RankedBarRow
                title={
                  <span className="flex items-center gap-1.5">
                    {category.name}
                    <ChevronDown
                      className={`h-3.5 w-3.5 text-muted-foreground transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                      aria-hidden="true"
                    />
                  </span>
                }
                value={
                  category.yourShare ? (
                    <SourceAnnotation
                      provenance={getProvenance(`budget.${category.key}`, selectedCouncil)}
                      reportContext={{
                        council: selectedCouncil.name,
                        field: `${category.name} budget (your share)`,
                        value: shareValue,
                      }}
                    >{shareValue}</SourceAnnotation>
                  ) : shareValue
                }
                subLeft={details?.description || ''}
                subRight={
                  <SourceAnnotation
                    provenance={getProvenance(`budget.${category.key}`, selectedCouncil)}
                    reportContext={{
                      council: selectedCouncil.name,
                      field: `${category.name} budget share (%)`,
                      value: pctText,
                    }}
                  >{pctText}</SourceAnnotation>
                }
                fillPct={category.percentage}
              />
            ) : (
              <RankedBarRow
                title={category.name}
                value={
                  category.yourShare ? (
                    <SourceAnnotation
                      provenance={getProvenance(`budget.${category.key}`, selectedCouncil)}
                      reportContext={{
                        council: selectedCouncil.name,
                        field: `${category.name} budget (your share)`,
                        value: shareValue,
                      }}
                    >{shareValue}</SourceAnnotation>
                  ) : ''
                }
                subLeft={details?.description || ''}
                subRight={
                  <SourceAnnotation
                    provenance={getProvenance(`budget.${category.key}`, selectedCouncil)}
                    reportContext={{
                      council: selectedCouncil.name,
                      field: `${category.name} budget share (%)`,
                      value: pctText,
                    }}
                  >{pctText}</SourceAnnotation>
                }
                fillPct={category.percentage}
              />
            );

            return (
              <div key={category.key}>
                {hasDrillDown ? (
                  <button
                    onClick={() => setExpandedCategory(isExpanded ? null : category.key)}
                    className="block w-[calc(100%+2.5rem)] -ml-5 sm:w-[calc(100%+3rem)] sm:-ml-6 text-left min-h-[44px] cursor-pointer py-3 px-5 sm:px-6 hover:bg-muted transition-colors"
                    aria-expanded={isExpanded}
                    aria-controls={categoryId}
                  >
                    {row}
                  </button>
                ) : (
                  row
                )}

                {/* Expanded drill-down content */}
                {isExpanded && spending && (
                  <div
                    id={categoryId}
                    role="region"
                    aria-label={`${category.name} spending details`}
                    className="mt-3 rounded-lg bg-muted/20 p-4 animate-in fade-in slide-in-from-top-1 duration-180 ease-out-snap motion-reduce:animate-none"
                  >
                    {/* No amounts indicator */}
                    {spending.services.every(s => !s.amount) && (
                      <p className="type-body-sm text-muted-foreground/60 italic mb-4">
                        Detailed spending amounts not yet published for this category
                      </p>
                    )}

                    {/* Layer 1: Sub-service budget lines */}
                    <div className="space-y-0">
                      {spending.services.map((service, idx) => (
                        <div key={idx} className="flex items-start justify-between gap-3 py-2.5 border-b border-border/50 last:border-b-0">
                          <div className="min-w-0 space-y-0">
                            <p className="type-body-sm font-medium leading-none">{service.name}</p>
                            <p className="type-body-sm text-muted-foreground leading-none mt-1">{service.description}</p>
                          </div>
                          <span className="type-body-sm font-semibold tabular-nums shrink-0">
                            {!service.amount ? '—'
                              : service.amount < 0
                              ? <span className="text-positive" title="This service earns more than it costs"><SourceAnnotation
                                  provenance={getProvenance('detailed.service_spending', selectedCouncil)}
                                  reportContext={{
                                    council: selectedCouncil.name,
                                    field: `Service income: ${service.name}`,
                                    value: formatBudget(Math.abs(service.amount) / 1000),
                                  }}
                                >{formatBudget(Math.abs(service.amount) / 1000)}</SourceAnnotation> income</span>
                              : <SourceAnnotation
                                  provenance={getProvenance('detailed.service_spending', selectedCouncil)}
                                  reportContext={{
                                    council: selectedCouncil.name,
                                    field: `Service spending: ${service.name}`,
                                    value: formatBudget(service.amount / 1000),
                                  }}
                                >{formatBudget(service.amount / 1000)}</SourceAnnotation>
                            }
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Layer 2: Top contracts */}
                    {spending.contracts && spending.contracts.length > 0 && (
                      <div className="mt-5 pt-4 border-t border-border/50">
                        <p className="type-body-sm font-semibold mb-3">Top contracts</p>
                        <div className="space-y-3">
                          {spending.contracts.map((contract, idx) => (
                            <div key={idx} className="space-y-1">
                              <p className="type-body font-semibold">{contract.supplier}</p>
                              <p className="type-body-sm text-muted-foreground">
                                {contract.description}
                              </p>
                              <p className="type-body-sm text-muted-foreground">
                                {contract.annual_value && <><SourceAnnotation
                                  provenance={getProvenance('detailed.top_suppliers.annual_spend', selectedCouncil)}
                                  reportContext={{
                                    council: selectedCouncil.name,
                                    field: `Contract annual value: ${contract.supplier}`,
                                    value: formatBudget(contract.annual_value / 1000),
                                  }}
                                >{formatBudget(contract.annual_value / 1000)}</SourceAnnotation>/year</>}
                                {contract.annual_value && contract.contract_period && ' · '}
                                {contract.contract_period && contract.contract_period}
                              </p>
                              {contract.source_url && (
                                <a
                                  href={contract.source_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="type-body-sm text-muted-foreground underline hover:text-foreground transition-colors inline-flex items-center gap-1 mt-0.5"
                                >
                                  Source
                                  <ExternalLink className="h-2.5 w-2.5" aria-hidden="true" />
                                  <span className="sr-only"> (opens in new tab)</span>
                                </a>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Layer 3: Transparency links */}
                    {spending.transparency_links && spending.transparency_links.length > 0 && (
                      <div className="mt-5 pt-4 border-t border-border/50">
                        <p className="type-body-sm font-semibold mb-3">See the raw data</p>
                        <div className="space-y-2.5">
                          {spending.transparency_links.map((link, idx) => (
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
                                <p className="type-body-sm text-muted-foreground mt-0.5">{link.description}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </RankedBarList>

        {/* Context footer */}
        {totalBudget && (() => {
          const typeAvg = getTypeAverages(selectedCouncil.type);
          const perResident = population ? Math.round((totalBudget) / population) : null;
          const avgPerResident = typeAvg.spendingPerResident ? Math.round(typeAvg.spendingPerResident) : null;
          const diff = perResident && avgPerResident ? perResident - avgPerResident : null;
          return (
            <div className="mt-5 p-3 rounded-lg bg-muted/30 space-y-2">
              <p className="type-body-sm text-muted-foreground">
                <span className="font-medium text-foreground">Total budget:</span>{' '}
                <SourceAnnotation
                  provenance={getProvenance('budget.total_service', selectedCouncil)}
                  reportContext={{
                    council: selectedCouncil.name,
                    field: 'Total annual budget',
                    value: formatBudget(totalBudget / 1000),
                  }}
                >
                  <span className="font-semibold text-foreground">{formatBudget(totalBudget / 1000)}</span>
                </SourceAnnotation>/year
                {population && (
                  <span className="type-caption"> · Serving <SourceAnnotation
                    provenance={getProvenance('population', selectedCouncil)}
                    reportContext={{
                      council: selectedCouncil.name,
                      field: 'Population',
                      value: population.toLocaleString('en-GB'),
                    }}
                  >{population.toLocaleString('en-GB')}</SourceAnnotation> residents</span>
                )}
              </p>
              {diff !== null && (
                <p className="type-caption text-muted-foreground">
                  Compared to average {toSentenceTypeName(selectedCouncil.type_name)}:{' '}
                  {/* Neutral: higher/lower per-resident spend isn't inherently
                      good or bad (could be efficiency, could be reduced service). */}
                  <span className="font-semibold whitespace-nowrap text-foreground">
                    <SourceAnnotation provenance={getProvenance('per_capita_spend', selectedCouncil)}>{diff > 0 ? '+' : ''}{formatCurrency(diff, { decimals: 0 })}</SourceAnnotation>
                  </span>
                  {' '}per resident
                </p>
              )}
            </div>
          );
        })()}

        {/* Source link */}
        <p className="mt-4 pt-3 border-t border-border/30 type-caption text-muted-foreground">
          Source:{' '}
          {detailed?.budget_url ? (
            <a
              href={detailed.budget_url}
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-foreground transition-colors cursor-pointer"
            >
              {selectedCouncil.name} budget
              <span className="sr-only"> (opens in new tab)</span>
            </a>
          ) : (
            <a
              href="https://www.gov.uk/government/collections/local-authority-revenue-expenditure-and-financing"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-foreground transition-colors cursor-pointer"
            >
              GOV.UK Local Authority Finance
              <span className="sr-only"> (opens in new tab)</span>
            </a>
          )}
        </p>

        {/* Structural gap notice for district councils — they don't deliver
            education, adult social care, public health or transport, so the
            service_spending table naturally has fewer categories than a
            county council or unitary. Telling readers this up front prevents
            the "why isn't education here?" confusion. */}
        {selectedCouncil.type === "SD" && (
          <div className="mt-6 pt-5 border-t border-border/50">
            <DataGapNotice
              gapKey="service_spending.district_structural"
              council={selectedCouncil}
            />
          </div>
        )}
      </section>

      {/* Have your say CTA */}
      <section className="card-elevated p-5 sm:p-6">
        <h2 className="type-title-2 mb-1">Have your say</h2>
        <p className="type-body-sm text-muted-foreground mb-5">
          Think {selectedCouncil.name} could spend your money better? Suggest a change.
        </p>

        {/* Top spending categories as tappable links */}
        <div className="flex flex-wrap gap-2 mb-5">
          {spendingCategories.slice(0, 3).map((cat) => (
            <Link
              key={cat.key}
              href={`/council/${getCouncilSlug(selectedCouncil)}/proposals/new`}
              className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-lg bg-muted hover:bg-muted/80 transition-colors cursor-pointer min-h-[44px]"
            >
              <span className="type-body-sm font-medium">{cat.name}</span>
              <span className="type-caption text-muted-foreground">
                <SourceAnnotation
                  provenance={getProvenance(`budget.${cat.key}`, selectedCouncil)}
                  reportContext={{
                    council: selectedCouncil.name,
                    field: `${cat.name} budget`,
                    value: formatBudget(cat.amount / 1000),
                  }}
                >{formatBudget(cat.amount / 1000)}</SourceAnnotation>
              </span>
            </Link>
          ))}
        </div>

        {/* Link to all proposals */}
        <Link
          href={`/council/${getCouncilSlug(selectedCouncil)}/proposals`}
          className="flex items-center justify-between p-3 rounded-xl border border-border/40 bg-card hover:bg-muted/50 transition-colors group cursor-pointer"
        >
          <div className="leading-tight">
            <p className="type-body-sm font-semibold group-hover:text-foreground transition-colors">
              Go to Town Hall
            </p>
            <p className="type-caption text-muted-foreground">
              See what others have suggested
            </p>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground shrink-0" />
        </Link>
      </section>
    </>
  );
};

export default SpendingCard;
