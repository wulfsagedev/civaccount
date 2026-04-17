'use client';

import { useState } from 'react';
import {
  ChevronDown,
  ExternalLink,
} from "lucide-react";
import { formatCurrency, formatBudget, type Council } from '@/data/councils';
import CardShareHeader from '@/components/dashboard/CardShareHeader';
import SourceAnnotation from '@/components/ui/source-annotation';
import { getProvenance } from '@/data/provenance';
import DataGapNotice from '@/components/ui/data-gap-notice';

interface SuppliersGrantsCardProps {
  selectedCouncil: Council;
}

const SuppliersGrantsCard = ({ selectedCouncil }: SuppliersGrantsCardProps) => {
  const [showAllSuppliers, setShowAllSuppliers] = useState(false);
  const [showAllGrants, setShowAllGrants] = useState(false);
  const [expandedSupplier, setExpandedSupplier] = useState<number | null>(null);
  const [expandedGrant, setExpandedGrant] = useState<number | null>(null);

  const detailed = selectedCouncil.detailed;

  return (
    <section id="suppliers" className="card-elevated p-5 sm:p-6">
      <CardShareHeader
        cardType="suppliers"
        title="Where the money goes"
        subtitle="See exactly who the council pays and which local organisations receive grants"
        councilName={selectedCouncil.name}
        subtitleClassName="mb-6"
      />

      {/* Top suppliers */}
      {detailed?.top_suppliers && detailed.top_suppliers.length > 0 && (
        <>
          {/* Subsection header */}
          <div className="mb-4">
            <div className="flex items-center justify-between">
              <h3 className="type-title-3">Who the council pays</h3>
              <span className="type-caption text-muted-foreground">2024-25</span>
            </div>
            <p className="type-body-sm text-muted-foreground mt-1">The biggest companies and organisations paid by the council</p>
          </div>

          {/* Hook stat */}
          <div className="p-3 rounded-lg bg-muted/30 mb-2">
            <p className="type-body-sm">
              <span className="font-semibold">Largest supplier:</span>{' '}
              {detailed.top_suppliers[0].name} — <SourceAnnotation
                provenance={getProvenance('detailed.top_suppliers.annual_spend', selectedCouncil)}
                reportContext={{
                  council: selectedCouncil.name,
                  field: `Supplier spend: ${detailed.top_suppliers[0].name}`,
                  value: formatBudget(detailed.top_suppliers[0].annual_spend / 1000),
                }}
              >{formatBudget(detailed.top_suppliers[0].annual_spend / 1000)}</SourceAnnotation>
              <span className="text-muted-foreground"> · {detailed.top_suppliers.length} suppliers published</span>
            </p>
          </div>
          {detailed.top_suppliers.some(s => s.description) && (
            <p className="type-caption text-muted-foreground mb-3">Tap any name to see what the money pays for</p>
          )}

          {/* Supplier rows */}
          <div className="space-y-1">
            {(showAllSuppliers
              ? detailed.top_suppliers
              : detailed.top_suppliers.slice(0, 5)
            ).map((supplier, idx) => {
              const isExpanded = expandedSupplier === idx;
              const hasDescription = !!supplier.description;

              return hasDescription ? (
                <button
                  key={idx}
                  onClick={() => setExpandedSupplier(isExpanded ? null : idx)}
                  className="w-full text-left py-3 px-2 -mx-2 rounded-lg hover:bg-muted transition-colors border-b border-border/30 cursor-pointer min-h-[44px]"
                  aria-expanded={isExpanded}
                >
                  <div className="flex items-baseline justify-between">
                    <div className="min-w-0 mr-3">
                      <span className="type-body font-semibold flex items-center gap-1.5">
                        {supplier.name}
                        <ChevronDown
                          className={`h-3.5 w-3.5 text-muted-foreground transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                          aria-hidden="true"
                        />
                      </span>
                      {supplier.category && (
                        <p className="type-body-sm text-muted-foreground">{supplier.category}</p>
                      )}
                    </div>
                    <span className="type-body font-semibold tabular-nums shrink-0">
                      {formatBudget(supplier.annual_spend / 1000)}
                    </span>
                  </div>
                  {isExpanded && (
                    <div className="mt-2 p-3 bg-muted/20 rounded-lg">
                      <p className="type-body-sm text-muted-foreground leading-relaxed">{supplier.description}</p>
                    </div>
                  )}
                </button>
              ) : (
                <div key={idx} className="py-3 px-2 -mx-2 border-b border-border/30">
                  <div className="flex items-baseline justify-between">
                    <div className="min-w-0 mr-3">
                      <p className="type-body font-semibold">{supplier.name}</p>
                      {supplier.category && (
                        <p className="type-body-sm text-muted-foreground">{supplier.category}</p>
                      )}
                    </div>
                    <span className="type-body font-semibold tabular-nums shrink-0">
                      <SourceAnnotation
                        provenance={getProvenance('detailed.top_suppliers.annual_spend', selectedCouncil)}
                        reportContext={{
                          council: selectedCouncil.name,
                          field: `Supplier spend: ${supplier.name}`,
                          value: formatBudget(supplier.annual_spend / 1000),
                        }}
                      >{formatBudget(supplier.annual_spend / 1000)}</SourceAnnotation>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Prominent expand button */}
          {detailed.top_suppliers.length > 5 && (
            <button
              onClick={() => setShowAllSuppliers(!showAllSuppliers)}
              className="w-full mt-3 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-muted/40 hover:bg-muted/60 transition-colors type-body-sm font-medium text-foreground cursor-pointer min-h-[44px]"
              aria-expanded={showAllSuppliers}
            >
              <ChevronDown className={`h-4 w-4 transition-transform ${showAllSuppliers ? 'rotate-180' : ''}`} aria-hidden="true" />
              {showAllSuppliers
                ? 'Show less'
                : `Show all ${detailed.top_suppliers.length} suppliers`
              }
            </button>
          )}
        </>
      )}

      {/* Grant payments — not published state */}
      {(!detailed?.grant_payments || detailed.grant_payments.length === 0) && (
        <div className={detailed?.top_suppliers?.length ? "mt-8 pt-6 border-t border-border/50" : ""}>
          <div className="mb-4">
            <h3 className="type-title-3">Grants to local organisations</h3>
            <p className="type-body-sm text-muted-foreground mt-1">Money given to charities, community groups and local projects</p>
          </div>
          <div className="p-4 rounded-lg bg-muted/30 border border-border/40">
            <p className="type-body-sm font-semibold mb-1">Not published in a format we can show here</p>
            <p className="type-body-sm text-muted-foreground mb-3">
              {selectedCouncil.name} does not publish a machine-readable grants register on a public page. Grant records may exist inside their monthly spending files or committee reports.
            </p>
            {detailed?.transparency_url && (
              <a
                href={detailed.transparency_url}
                target="_blank"
                rel="noopener noreferrer"
                className="type-body-sm underline hover:text-foreground transition-colors inline-flex items-center gap-1"
              >
                Check the council&apos;s transparency page
                <ExternalLink className="h-3 w-3 text-muted-foreground" aria-hidden="true" />
                <span className="sr-only"> (opens in new tab)</span>
              </a>
            )}
          </div>
        </div>
      )}

      {/* Grant payments */}
      {detailed?.grant_payments && detailed.grant_payments.length > 0 && (
        <div className={detailed?.top_suppliers?.length ? "mt-8 pt-6 border-t border-border/50" : ""}>
          {/* Subsection header */}
          <div className="mb-4">
            <div className="flex items-center justify-between">
              <h3 className="type-title-3">Grants to local organisations</h3>
              <span className="type-caption text-muted-foreground">2022-23</span>
            </div>
            <p className="type-body-sm text-muted-foreground mt-1">Money given to charities and community groups</p>
          </div>

          {/* Hook stat */}
          {(() => {
            const largest = [...detailed.grant_payments].sort((a, b) => b.amount - a.amount)[0];
            return (
              <div className="p-3 rounded-lg bg-muted/30 mb-2">
                <p className="type-body-sm">
                  <span className="font-semibold">Largest grant:</span>{' '}
                  {largest.recipient} — <SourceAnnotation
                    provenance={getProvenance('detailed.grant_payments', selectedCouncil)}
                    reportContext={{
                      council: selectedCouncil.name,
                      field: `Grant payment: ${largest.recipient}`,
                      value: formatCurrency(largest.amount, { decimals: 0 }),
                    }}
                  >{formatCurrency(largest.amount, { decimals: 0 })}</SourceAnnotation>
                  <span className="text-muted-foreground"> · {detailed.grant_payments.length} grants published</span>
                </p>
              </div>
            );
          })()}
          {detailed.grant_payments.some(g => g.description) && (
            <p className="type-caption text-muted-foreground mb-3">Tap any name to see what the grant funds</p>
          )}

          {/* Grant rows */}
          <div className="space-y-1">
            {(showAllGrants
              ? detailed.grant_payments
              : detailed.grant_payments.slice(0, 5)
            ).map((grant, idx) => {
              const isExpanded = expandedGrant === idx;
              const hasDescription = !!grant.description;

              return hasDescription ? (
                <button
                  key={idx}
                  onClick={() => setExpandedGrant(isExpanded ? null : idx)}
                  className="w-full text-left py-3 px-2 -mx-2 rounded-lg hover:bg-muted transition-colors border-b border-border/30 cursor-pointer min-h-[44px]"
                  aria-expanded={isExpanded}
                >
                  <div className="flex items-baseline justify-between">
                    <div className="min-w-0 mr-3">
                      <span className="type-body font-semibold flex items-center gap-1.5">
                        {grant.recipient}
                        <ChevronDown
                          className={`h-3.5 w-3.5 text-muted-foreground transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                          aria-hidden="true"
                        />
                      </span>
                      {grant.purpose && (
                        <p className="type-body-sm text-muted-foreground">{grant.purpose}</p>
                      )}
                    </div>
                    <span className="type-body font-semibold tabular-nums shrink-0">
                      {formatCurrency(grant.amount, { decimals: 0 })}
                    </span>
                  </div>
                  {isExpanded && (
                    <div className="mt-2 p-3 bg-muted/20 rounded-lg">
                      <p className="type-body-sm text-muted-foreground leading-relaxed">{grant.description}</p>
                    </div>
                  )}
                </button>
              ) : (
                <div key={idx} className="py-3 px-2 -mx-2 border-b border-border/30">
                  <div className="flex items-baseline justify-between">
                    <div className="min-w-0 mr-3">
                      <p className="type-body font-semibold">{grant.recipient}</p>
                      {grant.purpose && (
                        <p className="type-body-sm text-muted-foreground">{grant.purpose}</p>
                      )}
                    </div>
                    <span className="type-body font-semibold tabular-nums shrink-0">
                      <SourceAnnotation
                        provenance={getProvenance('detailed.grant_payments', selectedCouncil)}
                        reportContext={{
                          council: selectedCouncil.name,
                          field: `Grant payment: ${grant.recipient}`,
                          value: formatCurrency(grant.amount, { decimals: 0 }),
                        }}
                      >{formatCurrency(grant.amount, { decimals: 0 })}</SourceAnnotation>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Prominent expand button */}
          {detailed.grant_payments.length > 5 && (
            <button
              onClick={() => setShowAllGrants(!showAllGrants)}
              className="w-full mt-3 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-muted/40 hover:bg-muted/60 transition-colors type-body-sm font-medium text-foreground cursor-pointer min-h-[44px]"
              aria-expanded={showAllGrants}
            >
              <ChevronDown className={`h-4 w-4 transition-transform ${showAllGrants ? 'rotate-180' : ''}`} aria-hidden="true" />
              {showAllGrants
                ? 'Show less'
                : `Show all ${detailed.grant_payments.length} grants`
              }
            </button>
          )}
        </div>
      )}

      {/* Section transparency links for finances */}
      {detailed?.section_transparency?.finances && (
        <div className="mt-6 pt-4 border-t border-border/40">
          <p className="type-caption font-semibold text-muted-foreground mb-2">See the raw data</p>
          <div className="space-y-1.5">
            {detailed.section_transparency.finances.map((link, idx) => (
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

      {/* Thin-list notice for top_suppliers — when the council has a list but
          it's well below the depth we'd show for a comparable council. We
          don't render this on the "absent" path because the existing grants
          block (above) already renders its own notice. */}
      {detailed?.top_suppliers && detailed.top_suppliers.length > 0 && detailed.top_suppliers.length < 10 && (
        <div className="mt-6 pt-5 border-t border-border/50">
          <DataGapNotice
            gapKey="top_suppliers.thin"
            council={selectedCouncil}
            extra={`${detailed.top_suppliers.length} supplier${detailed.top_suppliers.length === 1 ? "" : "s"} published.`}
          />
        </div>
      )}
    </section>
  );
};

export default SuppliersGrantsCard;
