'use client';

import {
  Car,
  Heart,
  BookOpen,
  Users,
  Recycle,
  Hammer,
  ExternalLink,
} from "lucide-react";
import { formatCurrency, formatBudget, type Council } from '@/data/councils';
import { getRecyclingContext, getHomesBuiltContext, getOfstedContext, getRoadConditionContext } from '@/data/benchmarks';
import CardShareHeader from '@/components/dashboard/CardShareHeader';
import SourceAnnotation from '@/components/ui/source-annotation';
import { getProvenance } from '@/data/provenance';
import { DATA_YEARS } from '@/lib/data-years';

interface ServiceOutcomesCardProps {
  selectedCouncil: Council;
}

const ServiceOutcomesCard = ({ selectedCouncil }: ServiceOutcomesCardProps) => {
  const detailed = selectedCouncil.detailed!;

  return (
    <>
      {/* Service outcomes */}
      {detailed.service_outcomes && (
        <section id="service-outcomes" className="card-elevated p-5 sm:p-6">
          <CardShareHeader
            cardType="service-outcomes"
            title="What your money does"
            subtitle={`How ${selectedCouncil.name} is performing`}
            councilName={selectedCouncil.name}
          />

          {/* Metrics grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {detailed.service_outcomes.waste?.recycling_rate_percent != null && (() => {
              const ctx = getRecyclingContext(detailed.service_outcomes.waste.recycling_rate_percent, selectedCouncil.type);
              return (
                <div className="p-3 rounded-lg bg-muted/30">
                  <div className="flex items-center gap-2 mb-1">
                    <Recycle className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                    <p className="type-caption text-muted-foreground">Recycling rate</p>
                  </div>
                  <SourceAnnotation
                    provenance={getProvenance('service_outcomes.waste.recycling_rate_percent', selectedCouncil)}
                    reportContext={{
                      council: selectedCouncil.name,
                      field: 'Recycling rate',
                      value: `${detailed.service_outcomes.waste.recycling_rate_percent.toFixed(1)}%`,
                    }}
                  >
                    <p className="type-metric font-semibold tabular-nums">{detailed.service_outcomes.waste.recycling_rate_percent.toFixed(1)}%</p>
                  </SourceAnnotation>
                  <p className="type-caption text-muted-foreground/60">
                    {detailed.service_outcomes.waste.year || DATA_YEARS.waste} data
                  </p>
                  <p className="type-caption text-muted-foreground/60 mt-1">
                    Average for {ctx.compareLabel}: {ctx.compareAverage}%
                  </p>
                </div>
              );
            })()}

            {detailed.service_outcomes.housing?.homes_built != null && detailed.service_outcomes.housing.homes_built > 0 && (() => {
              const ctx = getHomesBuiltContext(detailed.service_outcomes.housing!.homes_built!, selectedCouncil.type);
              return (
                <div className="p-3 rounded-lg bg-muted/30">
                  <div className="flex items-center gap-2 mb-1">
                    <Hammer className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                    <p className="type-caption text-muted-foreground">Homes built</p>
                  </div>
                  <p className="type-metric font-semibold tabular-nums">{detailed.service_outcomes.housing!.homes_built!.toLocaleString('en-GB')}</p>
                  {detailed.service_outcomes.housing!.homes_built_year && (
                    <p className="type-caption text-muted-foreground/60">{detailed.service_outcomes.housing!.homes_built_year}</p>
                  )}
                  {detailed.service_outcomes.housing!.homes_target ? (
                    <p className="type-caption text-muted-foreground/60 mt-1">
                      Government target: {detailed.service_outcomes.housing!.homes_target.toLocaleString('en-GB')}/yr
                    </p>
                  ) : (
                    <p className="type-caption text-muted-foreground/60 mt-1">
                      Average for {ctx.compareLabel}: {ctx.compareAverage.toLocaleString('en-GB')}
                    </p>
                  )}
                </div>
              );
            })()}

            {/* Roads data */}
            {detailed.service_outcomes.roads?.condition_good_percent != null ? (() => {
              const roadCtx = getRoadConditionContext(detailed.service_outcomes.roads!.condition_good_percent!, selectedCouncil.type);
              return (
                <div className="p-3 rounded-lg bg-muted/30">
                  <div className="flex items-center gap-2 mb-1">
                    <Car className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                    <p className="type-caption text-muted-foreground">Road condition</p>
                  </div>
                  <SourceAnnotation
                    provenance={getProvenance('service_outcomes.roads.condition_good_percent', selectedCouncil)}
                    reportContext={{
                      council: selectedCouncil.name,
                      field: 'Road condition (% good or acceptable)',
                      value: `${detailed.service_outcomes.roads!.condition_good_percent}%`,
                    }}
                  >
                    <p className="type-metric font-semibold tabular-nums">{detailed.service_outcomes.roads!.condition_good_percent}%</p>
                  </SourceAnnotation>
                  <p className="type-caption text-muted-foreground/60">in good or acceptable condition <span className="text-muted-foreground/50">({DATA_YEARS.road_condition} data)</span></p>
                  <p className="type-caption text-muted-foreground/60 mt-1">
                    Average for {roadCtx.compareLabel}: {roadCtx.compareAverage}%
                  </p>
                </div>
              );
            })() : detailed.service_outcomes.roads?.maintained_miles ? (
              <div className="p-3 rounded-lg bg-muted/30">
                <div className="flex items-center gap-2 mb-1">
                  <Car className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                  <p className="type-caption text-muted-foreground">Roads maintained</p>
                </div>
                <p className="type-metric font-semibold tabular-nums">{detailed.service_outcomes.roads.maintained_miles.toLocaleString('en-GB')}</p>
                <p className="type-caption text-muted-foreground/60">miles</p>
              </div>
            ) : null}

            {detailed.service_outcomes.roads?.potholes_repaired && (
              <div className="p-3 rounded-lg bg-muted/30">
                <div className="flex items-center gap-2 mb-1">
                  <Hammer className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                  <p className="type-caption text-muted-foreground">Potholes fixed</p>
                </div>
                <p className="type-metric font-semibold tabular-nums">{detailed.service_outcomes.roads.potholes_repaired.toLocaleString('en-GB')}</p>
                <p className="type-caption text-muted-foreground/60">2025</p>
              </div>
            )}

            {detailed.service_outcomes.libraries?.count && (
              <div className="p-3 rounded-lg bg-muted/30">
                <div className="flex items-center gap-2 mb-1">
                  <BookOpen className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                  <p className="type-caption text-muted-foreground">Libraries</p>
                </div>
                <p className="type-metric font-semibold tabular-nums">{detailed.service_outcomes.libraries.count}</p>
                {detailed.service_outcomes.libraries.visits_annual && (
                  <p className="type-caption text-muted-foreground/60">{(detailed.service_outcomes.libraries.visits_annual / 1000000).toFixed(1)}m visits/year</p>
                )}
              </div>
            )}

            {detailed.service_outcomes.population_served && (
              <div className="p-3 rounded-lg bg-muted/30">
                <div className="flex items-center gap-2 mb-1">
                  <Users className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                  <p className="type-caption text-muted-foreground">People served</p>
                </div>
                <p className="type-metric font-semibold tabular-nums">{(detailed.service_outcomes.population_served / 1000000).toFixed(1)}m</p>
              </div>
            )}
          </div>

          {/* Service quality ratings */}
          {(detailed.service_outcomes.children_services?.ofsted_rating || detailed.service_outcomes.adult_social_care?.cqc_rating) && (
            <div className="mt-5 pt-5 border-t border-border/50">
              <p className="type-body-sm font-semibold mb-3">Service quality</p>
              <div className="space-y-2">
                {detailed.service_outcomes.children_services?.ofsted_rating && (() => {
                  const ofstedCtx = getOfstedContext(detailed.service_outcomes.children_services.ofsted_rating);
                  return (
                    <div className="p-3 rounded-lg bg-muted/30">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                          <span className="type-body-sm">Children&apos;s services</span>
                        </div>
                        <span className={`type-body-sm font-semibold px-2.5 py-0.5 rounded-full ${
                          detailed.service_outcomes.children_services.ofsted_rating === 'Outstanding'
                            ? 'bg-positive/10 text-positive'
                            : detailed.service_outcomes.children_services.ofsted_rating === 'Good'
                            ? 'bg-positive/10 text-positive'
                            : detailed.service_outcomes.children_services.ofsted_rating === 'Requires improvement'
                            ? 'bg-negative/10 text-negative'
                            : 'bg-negative/20 text-negative'
                        }`}>
                          {detailed.service_outcomes.children_services.ofsted_rating}
                          <span className="sr-only"> rated by Ofsted</span>
                        </span>
                      </div>
                      <p className="type-caption text-muted-foreground/60 mt-1.5">
                        {ofstedCtx.sameRatingCount} of {ofstedCtx.totalAssessed} councils rated {detailed.service_outcomes.children_services.ofsted_rating}
                        <span className="text-muted-foreground/50"> · {DATA_YEARS.ofsted} data</span>
                      </p>
                    </div>
                  );
                })()}

                {detailed.service_outcomes.adult_social_care?.cqc_rating && (
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                    <div className="flex items-center gap-2">
                      <Heart className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                      <span className="type-body-sm">Adult social care</span>
                    </div>
                    <span className={`type-body-sm font-semibold px-2.5 py-0.5 rounded-full ${
                      detailed.service_outcomes.adult_social_care.cqc_rating === 'Outstanding'
                        ? 'bg-positive/10 text-positive'
                        : detailed.service_outcomes.adult_social_care.cqc_rating === 'Good'
                        ? 'bg-positive/10 text-positive'
                        : detailed.service_outcomes.adult_social_care.cqc_rating === 'Requires improvement'
                        ? 'bg-negative/10 text-negative'
                        : 'bg-negative/20 text-negative'
                    }`}>
                      {detailed.service_outcomes.adult_social_care.cqc_rating}
                      <span className="sr-only"> rated by CQC</span>
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Source */}
          <p className="mt-4 pt-3 border-t border-border/30 type-caption text-muted-foreground">
            Source:{' '}
            {detailed.service_outcomes.waste && (
              <><a
                href="https://www.gov.uk/government/statistical-data-sets/env18-local-authority-collected-waste-annual-results-tables"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-foreground transition-colors cursor-pointer"
              >
                DEFRA waste statistics
                <span className="sr-only"> (opens in new tab)</span>
              </a></>
            )}
            {detailed.service_outcomes.housing?.homes_built && (
              <>{detailed.service_outcomes.waste ? ' · ' : ''}<a
                href="https://www.gov.uk/government/statistical-data-sets/live-tables-on-net-supply-of-housing"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-foreground transition-colors cursor-pointer"
              >
                MHCLG housing supply
                <span className="sr-only"> (opens in new tab)</span>
              </a></>
            )}
            {detailed.service_outcomes.roads?.condition_good_percent != null && (
              <>{(detailed.service_outcomes.waste || detailed.service_outcomes.housing?.homes_built) ? ' · ' : ''}<a
                href="https://www.gov.uk/government/statistical-data-sets/road-condition-statistics-data-tables-rdc"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-foreground transition-colors cursor-pointer"
              >
                DfT road condition
                <span className="sr-only"> (opens in new tab)</span>
              </a></>
            )}
            {detailed.service_outcomes.children_services?.ofsted_rating && (
              <>{' · '}<a
                href="https://www.gov.uk/government/publications/five-year-ofsted-inspection-data"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-foreground transition-colors cursor-pointer"
              >
                Ofsted
                <span className="sr-only"> (opens in new tab)</span>
              </a></>
            )}
          </p>
        </section>
      )}

      {/* Council performance (KPIs + waste + roads) */}
      {(detailed.performance_kpis?.length || detailed.waste_destinations?.length || detailed.service_outcomes?.roads?.maintenance_backlog) && (
        <section id="performance" className="card-elevated p-5 sm:p-6">
          <CardShareHeader
            cardType="performance"
            title="Council performance"
            subtitle="Targets, waste and road maintenance"
            councilName={selectedCouncil.name}
          />

          {/* Performance KPIs */}
          {detailed.performance_kpis && detailed.performance_kpis.length > 0 && (
            <>
              <div className="space-y-2">
                {detailed.performance_kpis.map((kpi, idx) => (
                  <div key={idx} className="p-3 rounded-lg bg-muted/30">
                    <div className="flex items-center justify-between gap-3">
                      <p className="type-body-sm font-medium min-w-0">{kpi.metric}</p>
                      <span className={`type-body-sm font-semibold px-2.5 py-0.5 rounded-full shrink-0 ${
                        kpi.status === 'green'
                          ? 'bg-positive/10 text-positive'
                          : kpi.status === 'amber'
                          ? 'bg-negative/10 text-negative'
                          : 'bg-negative/20 text-negative'
                      }`}>
                        {kpi.value}
                        <span className="sr-only"> — {kpi.status} status</span>
                      </span>
                    </div>
                    <p className="type-body-sm text-muted-foreground mt-1">
                      {kpi.target && `Target: ${kpi.target} · `}{kpi.period}
                    </p>
                  </div>
                ))}
              </div>
              {detailed.sources && detailed.sources.length > 0 && (
                <p className="mt-3 type-caption text-muted-foreground">
                  Source:{' '}
                  <a
                    href={detailed.sources[0].url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline hover:text-foreground transition-colors"
                  >
                    {detailed.sources[0].title}
                    <span className="sr-only"> (opens in new tab)</span>
                  </a>
                </p>
              )}
            </>
          )}

          {/* Waste destinations chart */}
          {detailed.waste_destinations && detailed.waste_destinations.length > 0 && (() => {
            const maxPct = Math.max(...detailed.waste_destinations!.map(w => w.percentage));
            return (
              <div className={detailed?.performance_kpis?.length ? "mt-6 pt-5 border-t border-border/50" : ""}>
                <p className="type-body-sm font-semibold mb-1">Where your waste goes</p>
                <p className="type-body-sm text-muted-foreground mb-4">
                  {detailed.waste_destinations!.reduce((sum, w) => sum + w.tonnage, 0).toLocaleString('en-GB')} tonnes total (2023-24)
                </p>
                <div className="space-y-3">
                  {detailed.waste_destinations!.map((dest, idx) => (
                    <div key={idx}>
                      <div className="flex items-baseline justify-between mb-1">
                        <span className="type-body-sm font-medium">{dest.type}</span>
                        <span className="type-body-sm font-semibold tabular-nums">{dest.percentage}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full bg-foreground"
                          style={{ width: `${(dest.percentage / maxPct) * 100}%` }}
                        />
                      </div>
                      <p className="type-body-sm text-muted-foreground mt-0.5">
                        {dest.tonnage.toLocaleString('en-GB')} tonnes
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}

          {/* Road maintenance */}
          {detailed.service_outcomes && (detailed.service_outcomes.roads?.maintenance_backlog || detailed.service_outcomes.roads?.annual_investment) && (
            <div className="mt-6 pt-5 border-t border-border/50">
              <p className="type-body-sm font-semibold mb-3">Road maintenance</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {detailed.service_outcomes.roads?.maintenance_backlog && (
                  <div className="p-3 rounded-lg bg-muted/30">
                    <p className="type-body-sm text-muted-foreground mb-1">Maintenance backlog</p>
                    <p className="type-metric font-semibold tabular-nums">{formatBudget(detailed.service_outcomes.roads.maintenance_backlog / 1000)}</p>
                  </div>
                )}
                {detailed.service_outcomes.roads?.annual_investment && (
                  <div className="p-3 rounded-lg bg-muted/30">
                    <p className="type-body-sm text-muted-foreground mb-1">Annual investment</p>
                    <p className="type-metric font-semibold tabular-nums">{formatBudget(detailed.service_outcomes.roads.annual_investment / 1000)}</p>
                  </div>
                )}
                {detailed.service_outcomes.roads?.network_length_miles && (
                  <div className="p-3 rounded-lg bg-muted/30">
                    <p className="type-body-sm text-muted-foreground mb-1">Road network</p>
                    <p className="type-metric font-semibold tabular-nums">{detailed.service_outcomes.roads.network_length_miles.toLocaleString('en-GB')}</p>
                    <p className="type-body-sm text-muted-foreground/60">miles</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Section transparency links */}
          {detailed.section_transparency?.outcomes && (
            <div className="mt-6 pt-4 border-t border-border/40">
              <p className="type-caption font-semibold text-muted-foreground mb-2">See the raw data</p>
              <div className="space-y-1.5">
                {detailed.section_transparency.outcomes.map((link, idx) => (
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
      )}
    </>
  );
};

export default ServiceOutcomesCard;
