'use client';

import Link from 'next/link';
import {
  TrendingUp,
  TrendingDown,
  ChevronRight,
  ExternalLink,
  Info,
} from "lucide-react";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '@/components/ui/popover';
import { formatCurrency, getCouncilByName, getCouncilSlug, councils, toSentenceTypeName, getTotalBandD, type Council } from '@/data/councils';
import ShareButton from '@/components/proposals/ShareButton';
import { useIsEmbed } from '@/lib/embed-context';
import SourceAnnotation from '@/components/ui/source-annotation';
import { getProvenance } from '@/data/provenance';
import { INFLATION_CONTEXT } from '@/lib/inflation-context';
import { SITE_URL } from '@/lib/utils';

// Helper function to find a linkable council from precept authority name
const findLinkedCouncil = (authorityName: string) => {
  const cleanName = authorityName
    .replace(' District Council', '')
    .replace(' County Council', '')
    .replace(' Council', '')
    .replace(' Borough', '')
    .trim();

  const council = getCouncilByName(cleanName) ||
                 getCouncilByName(authorityName) ||
                 councils.find(c => c.name.toLowerCase().includes(cleanName.toLowerCase()));

  if (council) {
    return { council, slug: getCouncilSlug(council) };
  }
  return null;
};

interface YourBillCardProps {
  selectedCouncil: Council;
  thisCouncilBandD: number | null;
  taxChange: number | null;
  taxChangeAmount: number | null;
  vsAverage: number | null;
  totalDailyCost: number | null;
}

const YourBillCard = ({
  selectedCouncil,
  thisCouncilBandD,
  taxChange,
  taxChangeAmount,
  vsAverage,
  totalDailyCost,
}: YourBillCardProps) => {
  const isEmbed = useIsEmbed();
  const councilTax = selectedCouncil.council_tax;
  const detailed = selectedCouncil.detailed;
  // True total bill across all precepting authorities. We compute it here
  // rather than reading detailed.total_band_d directly because several data
  // entries (particularly county councils) have total_band_d wrongly set to
  // just this council's own share.
  const totalBill = getTotalBandD(selectedCouncil);

  return (
    <section id="your-bill" className="card-elevated p-5 sm:p-6">
      {/* Primary amount - This council's share */}
      <div className="mb-6">
        <div className="flex items-center gap-1.5 mb-1">
          <span className="type-caption text-muted-foreground">
            Typical Band D share for this council
          </span>
          <Popover>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="touch-hitbox inline-flex items-center text-muted-foreground hover:text-foreground transition-colors cursor-pointer rounded-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                aria-label="What is Band D?"
              >
                <Info className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-72 p-3" side="top" align="start" sideOffset={4}>
              <div className="space-y-2">
                <p className="type-caption font-semibold text-foreground">What is Band D?</p>
                <p className="type-caption text-muted-foreground leading-relaxed">
                  Band D is the reference property band used to report council tax.
                  Your actual bill depends on your property&apos;s band, parish, and any discounts (single person, students, etc.).
                </p>
                <p className="type-caption text-muted-foreground leading-relaxed">
                  <span className="font-medium text-foreground">Bands at a glance:</span>{' '}
                  A = ⅔ Band D · B = 7⁄9 · C = 8⁄9 · E = 11⁄9 · H = 2×
                </p>
              </div>
            </PopoverContent>
          </Popover>
        </div>
        <div className="flex items-baseline gap-2">
          <SourceAnnotation
            provenance={getProvenance('council_tax.band_d_2025', selectedCouncil)}
            reportContext={{
              council: selectedCouncil.name,
              field: 'Council tax (your share)',
              value: thisCouncilBandD ? formatCurrency(thisCouncilBandD, { decimals: 2 }) : 'N/A',
            }}
          >
            <span className="type-display">
              {thisCouncilBandD ? formatCurrency(thisCouncilBandD, { decimals: 2 }) : 'N/A'}
            </span>
          </SourceAnnotation>
          <span className="type-caption text-muted-foreground">/year</span>
        </div>

        {/* Year-on-year change — show cash-terms change alongside two familiar
            yardsticks (prices and pay) so the reader can pick the lens that's
            relevant to them. We deliberately don't subtract one from the other
            or interpret "real terms" — that's the reader's call. See
            src/lib/inflation-context.ts for the sources. */}
        {taxChange !== null && (
          <div className="mt-2 space-y-0.5">
            {/* Neutral framing: arrow icon carries direction, colour is reserved
                for genuine concern (ie. this is transparency, not a warning). */}
            <div className="flex items-center gap-1.5">
              {taxChange > 0 ? (
                <TrendingUp className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
              ) : (
                <TrendingDown className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
              )}
              <span className="type-body-sm text-foreground">
                <span className="font-semibold">{taxChange > 0 ? 'Up' : 'Down'} {Math.abs(taxChange).toFixed(1)}%</span>
                {' from last year'}
                {taxChangeAmount !== null && (
                  <span className="text-muted-foreground ml-1 whitespace-nowrap">
                    (<SourceAnnotation
                      provenance={getProvenance('council_tax_increase_percent', selectedCouncil)}
                      reportContext={{
                        council: selectedCouncil.name,
                        field: 'Band D change vs prior year (£)',
                        value: `${taxChangeAmount > 0 ? '+' : ''}${formatCurrency(taxChangeAmount, { decimals: 2 })}`,
                      }}
                    >{taxChangeAmount > 0 ? '+' : ''}{formatCurrency(taxChangeAmount, { decimals: 2 })}</SourceAnnotation>)
                  </span>
                )}
              </span>
            </div>
            <p className="type-caption text-muted-foreground pl-5">
              Over the same year, prices rose {INFLATION_CONTEXT.cpi_rate}% and average pay rose {INFLATION_CONTEXT.wage_growth_rate}%.
            </p>
          </div>
        )}
      </div>

      {/* Two-tier explainer — district residents also pay county council tax,
          and vice versa. Without this, users see their small council budget
          next to a large bill total and assume the mismatch is an error. */}
      {(() => {
        if (!detailed?.precepts || detailed.precepts.length === 0 || !thisCouncilBandD || !totalBill) return null;
        // Find the "other tier" precept (county for districts, or the district share for counties)
        const countyPrecept = selectedCouncil.type === 'SD'
          ? detailed.precepts.find(p => p.authority.toLowerCase().includes('county'))
          : null;
        // For counties, don't show this callout (districts vary — we can't pick one)
        if (!countyPrecept) return null;
        const linked = findLinkedCouncil(countyPrecept.authority);
        const remainder = totalBill - thisCouncilBandD;
        const countyShareLabel = `£${Math.round(countyPrecept.band_d).toLocaleString('en-GB')}`;
        const remainderLabel = `£${Math.round(remainder).toLocaleString('en-GB')}`;
        const content = (
          <>
            <p className="type-body-sm">
              <span className="font-semibold">{selectedCouncil.name} is a district council.</span>{' '}
              About <span className="font-semibold tabular-nums">£{Math.round(thisCouncilBandD).toLocaleString('en-GB')}</span> of your Band D bill goes to {selectedCouncil.name} for bins, planning and housing. The remaining <span className="font-semibold tabular-nums">{remainderLabel}</span> goes to <span className="font-semibold">{countyPrecept.authority.replace(' Council', '')}</span> ({countyShareLabel}), police and fire — see the breakdown below.
            </p>
          </>
        );
        return (
          <div className="mt-4 p-3 rounded-lg bg-muted/30 border border-border/40">
            {linked ? (
              <Link href={`/council/${linked.slug}`} className="group cursor-pointer block hover:opacity-80 transition-opacity">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">{content}</div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" aria-hidden="true" />
                </div>
              </Link>
            ) : content}
          </div>
        );
      })()}

      {/* Full bill breakdown with visual bar */}
      {detailed?.precepts && detailed.precepts.length > 0 && totalBill && (
        <div className="pt-5 border-t border-border/50">
          <p className="type-body-sm font-semibold mb-1">Typical Band D bill</p>
          <p className="type-caption text-muted-foreground mb-4">Average across {selectedCouncil.name}. Actual bills vary by band, parish and discounts.</p>

          {/* Visual stacked bar with legend */}
          <div className="mb-4">
            <div className="h-2 rounded-full overflow-hidden flex bg-muted">
              {detailed.precepts.map((precept, index) => {
                const percentage = (precept.band_d / totalBill) * 100;
                const isThisCouncil = precept.authority.toLowerCase().includes(selectedCouncil.name.toLowerCase().split(' ')[0]);
                return (
                  <div
                    key={index}
                    className={`h-full ${isThisCouncil ? 'bg-foreground' : 'bg-muted-foreground/40'}`}
                    style={{ width: `${percentage}%` }}
                  />
                );
              })}
            </div>
            {/* Legend */}
            <div className="flex items-center gap-4 mt-2">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-foreground" />
                <span className="type-caption text-muted-foreground">{selectedCouncil.name}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-muted-foreground/40" />
                <span className="type-caption text-muted-foreground">Other authorities</span>
              </div>
            </div>
          </div>

          {/* Breakdown list - consistent row heights with icons */}
          <div className="space-y-0">
            {detailed.precepts.map((precept, index) => {
              const isThisCouncil = precept.authority.toLowerCase().includes(selectedCouncil.name.toLowerCase().split(' ')[0]);
              const linkedCouncil = !isThisCouncil ? findLinkedCouncil(precept.authority) : null;
              const isLinkable = linkedCouncil && !precept.authority.toLowerCase().includes('police') && !precept.authority.toLowerCase().includes('fire');

              // Keep "Council" in the name for clarity
              const displayName = precept.authority
                .replace(' District Council', '')
                .replace(' County Council', ' County Council')
                .replace(/^(.+) Council$/, '$1 Council');

              // Default descriptions for common authority types
              const getDefaultDescription = () => {
                if (precept.authority.toLowerCase().includes('police')) return 'Local policing and crime prevention';
                if (precept.authority.toLowerCase().includes('fire')) return 'Fire and rescue services';
                if (precept.authority.toLowerCase().includes('county')) return 'Education, social care, highways';
                return null;
              };
              const description = precept.description || getDefaultDescription();

              const rowContent = (
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <span className={`type-body-sm ${isThisCouncil ? 'font-semibold' : ''} ${isLinkable ? 'group-hover:text-foreground transition-colors' : ''}`}>
                      {displayName}
                    </span>
                    {description && (
                      <p className="type-caption text-muted-foreground truncate">{description}</p>
                    )}
                  </div>
                  {isLinkable && (
                    <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors shrink-0 ml-2" />
                  )}
                  <span className={`type-body-sm font-semibold tabular-nums shrink-0 ml-3 ${isThisCouncil ? '' : 'text-muted-foreground'}`}>
                    <SourceAnnotation
                      provenance={getProvenance('council_tax.band_d_2025', selectedCouncil)}
                      reportContext={{
                        council: selectedCouncil.name,
                        field: `Precept share: ${precept.authority}`,
                        value: formatCurrency(precept.band_d, { decimals: 2 }),
                      }}
                    >{formatCurrency(precept.band_d, { decimals: 2 })}</SourceAnnotation>
                  </span>
                </div>
              );

              return (
                <div key={index} className="-mx-2 px-2 py-2 rounded-lg hover:bg-muted transition-colors">
                  {isLinkable ? (
                    <Link href={`/council/${linkedCouncil.slug}`} className="group cursor-pointer">
                      {rowContent}
                    </Link>
                  ) : (
                    rowContent
                  )}
                </div>
              );
            })}
          </div>

          {/* Total */}
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-border/50">
            <div>
              <span className="type-body font-semibold">Typical Band D total</span>
              {totalDailyCost && (
                <p className="type-caption text-muted-foreground">
                  <SourceAnnotation
                    provenance={getProvenance('council_tax.band_d_2025', selectedCouncil)}
                    reportContext={{
                      council: selectedCouncil.name,
                      field: 'Band D daily cost',
                      value: `${formatCurrency(totalDailyCost, { decimals: 2 })} per day`,
                    }}
                  >{formatCurrency(totalDailyCost, { decimals: 2 })}</SourceAnnotation>
                  {' per day'}
                </p>
              )}
            </div>
            <span className="type-metric tabular-nums whitespace-nowrap">
              <SourceAnnotation
                provenance={getProvenance('council_tax.band_d_2025', selectedCouncil)}
                reportContext={{
                  council: selectedCouncil.name,
                  field: 'Band D total bill',
                  value: formatCurrency(totalBill, { decimals: 2 }),
                }}
              >{formatCurrency(totalBill, { decimals: 2 })}</SourceAnnotation>
            </span>
          </div>

          {/* Check your exact bill CTA — links out to council's own calculator */}
          {detailed?.council_tax_url && (
            <a
              href={detailed.council_tax_url}
              target="_blank"
              rel="noopener noreferrer"
              className="cta-card mt-4 flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted group cursor-pointer"
            >
              <div className="leading-tight">
                <p className="type-body-sm font-semibold group-hover:text-foreground transition-colors">
                  Check your exact bill on {selectedCouncil.name}
                  <span className="sr-only"> (opens in new tab)</span>
                </p>
                <p className="type-caption text-muted-foreground">Band, parish, and discounts make your bill different from the average</p>
              </div>
              <ExternalLink className="cta-chevron h-4 w-4 text-muted-foreground group-hover:text-foreground shrink-0 ml-3" aria-hidden="true" />
            </a>
          )}
        </div>
      )}

      {/* Comparison callout — neutral framing. Direction is clear from the
          sign; colouring it green/amber implies judgement ("you're overpaying")
          which isn't the job of this app. */}
      {vsAverage !== null && (
        <div className="mt-5 p-3 rounded-lg bg-muted/30">
          <div className="flex items-center justify-between gap-3">
            <span className="type-caption text-muted-foreground">
              Compared to average {toSentenceTypeName(selectedCouncil.type_name)}
            </span>
            <SourceAnnotation provenance={getProvenance('vs_average')}>
              <span className="type-body-sm font-semibold tabular-nums whitespace-nowrap shrink-0 text-foreground">
                {vsAverage > 0 ? '+' : ''}{formatCurrency(vsAverage, { decimals: 2 })}
              </span>
            </SourceAnnotation>
          </div>
        </div>
      )}

      {/* Compare CTA */}
      <Link
        href="/compare"
        className="cta-card mt-4 flex items-center justify-between p-3 rounded-xl border border-border/40 bg-card hover:bg-muted/50 group cursor-pointer"
      >
        <div className="leading-tight">
          <p className="type-body-sm font-semibold group-hover:text-foreground transition-colors">
            {vsAverage !== null && vsAverage > 0 ? 'Paying more than average?' : 'Compare with other councils'}
          </p>
          <p className="type-caption text-muted-foreground">
            See how {selectedCouncil.name} compares side by side
          </p>
        </div>
        <ChevronRight className="cta-chevron h-4 w-4 text-muted-foreground group-hover:text-foreground shrink-0" />
      </Link>

      {/* Get your tax card */}
      <Link
        href={`/council/${getCouncilSlug(selectedCouncil)}/tax-card`}
        className="cta-card mt-4 flex items-center justify-between p-3 rounded-xl border border-border/40 bg-card hover:bg-muted/50 group cursor-pointer"
      >
        <div className="leading-tight">
          <p className="type-body-sm font-semibold group-hover:text-foreground transition-colors">
            Get your council tax card
          </p>
          <p className="type-caption text-muted-foreground">
            A personalised receipt showing where your money goes
          </p>
        </div>
        <ChevronRight className="cta-chevron h-4 w-4 text-muted-foreground group-hover:text-foreground shrink-0" />
      </Link>

      {/* Share your council tax card */}
      {!isEmbed && (
        <div className="mt-4">
          <ShareButton
            title={`${selectedCouncil.name} council tax`}
            text={`I pay ${thisCouncilBandD ? formatCurrency(thisCouncilBandD, { decimals: 2 }) : 'N/A'}/year to ${selectedCouncil.name}. See where your council tax goes.`}
            url={`${SITE_URL}/council/${getCouncilSlug(selectedCouncil)}/card/your-bill`}
            imageUrl={`/api/share/${getCouncilSlug(selectedCouncil)}/your-bill?format=story`}
            variant="hero"
          />
        </div>
      )}
    </section>
  );
};

export default YourBillCard;
