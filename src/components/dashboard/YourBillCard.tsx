'use client';

import Link from 'next/link';
import {
  TrendingUp,
  TrendingDown,
  ChevronRight,
} from "lucide-react";
import { formatCurrency, getCouncilByName, getCouncilSlug, councils, type Council } from '@/data/councils';
import ShareButton from '@/components/proposals/ShareButton';

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
  const councilTax = selectedCouncil.council_tax;
  const detailed = selectedCouncil.detailed;

  return (
    <section id="your-bill" className="card-elevated p-5 sm:p-6">
      {/* Primary amount - This council's share */}
      <div className="mb-6">
        <p className="type-caption text-muted-foreground mb-1">
          You pay this council
          <span className="ml-2 text-muted-foreground/60">(Published data)</span>
        </p>
        <div className="flex items-baseline gap-2">
          <span className="type-display">
            {thisCouncilBandD ? formatCurrency(thisCouncilBandD, { decimals: 2 }) : 'N/A'}
          </span>
          <span className="type-caption text-muted-foreground">/year</span>
        </div>

        {/* Year-on-year change */}
        {taxChange !== null && (
          <div className="mt-2">
            <div className="flex items-center gap-1.5">
              {taxChange > 0 ? (
                <TrendingUp className="h-3.5 w-3.5 text-negative" aria-hidden="true" />
              ) : (
                <TrendingDown className="h-3.5 w-3.5 text-positive" aria-hidden="true" />
              )}
              <span className={`type-body-sm ${taxChange > 0 ? 'text-negative' : 'text-positive'}`}>
                {taxChange > 0 ? 'Up' : 'Down'} {Math.abs(taxChange).toFixed(1)}% from last year
                {taxChangeAmount !== null && (
                  <span className="text-muted-foreground ml-1">
                    ({taxChangeAmount > 0 ? '+' : ''}{formatCurrency(taxChangeAmount, { decimals: 2 })})
                  </span>
                )}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Full bill breakdown with visual bar */}
      {detailed?.precepts && detailed.precepts.length > 0 && detailed.total_band_d && (
        <div className="pt-5 border-t border-border/50">
          <p className="type-body-sm font-semibold mb-4">Your total council tax bill</p>

          {/* Visual stacked bar with legend */}
          <div className="mb-4">
            <div className="h-2 rounded-full overflow-hidden flex bg-muted">
              {detailed.precepts.map((precept, index) => {
                const percentage = (precept.band_d / detailed.total_band_d!) * 100;
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
                    {formatCurrency(precept.band_d, { decimals: 2 })}
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
              <span className="type-body font-semibold">Total annual bill</span>
              {totalDailyCost && (
                <p className="type-caption text-muted-foreground">{formatCurrency(totalDailyCost, { decimals: 2 })} per day</p>
              )}
            </div>
            <span className="type-metric tabular-nums">
              {formatCurrency(detailed.total_band_d, { decimals: 2 })}
            </span>
          </div>
        </div>
      )}

      {/* Comparison callout */}
      {vsAverage !== null && (
        <div className="mt-5 p-3 rounded-lg bg-muted/30">
          <div className="flex items-center justify-between">
            <span className="type-caption text-muted-foreground">
              Compared to average {selectedCouncil.type_name.toLowerCase()}
              <span className="ml-1 text-muted-foreground/60">(Comparison)</span>
            </span>
            <span className={`type-body-sm font-semibold tabular-nums ${vsAverage > 0 ? 'text-negative' : vsAverage < 0 ? 'text-positive' : 'text-muted-foreground'}`}>
              {vsAverage > 0 ? '+' : ''}{formatCurrency(vsAverage, { decimals: 2 })}
            </span>
          </div>
        </div>
      )}

      {/* Compare CTA */}
      <Link
        href="/compare"
        className="mt-4 flex items-center justify-between p-3 rounded-xl border border-border/40 bg-card hover:bg-muted/50 transition-colors group cursor-pointer"
      >
        <div className="leading-tight">
          <p className="type-body-sm font-semibold group-hover:text-foreground transition-colors">
            {vsAverage !== null && vsAverage > 0 ? 'Paying more than average?' : 'Compare with other councils'}
          </p>
          <p className="type-caption text-muted-foreground">
            See how {selectedCouncil.name} compares side by side
          </p>
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground shrink-0" />
      </Link>

      {/* Share your council tax card */}
      <div className="mt-4">
        <ShareButton
          title={`${selectedCouncil.name} council tax`}
          text={`I pay ${thisCouncilBandD ? formatCurrency(thisCouncilBandD, { decimals: 2 }) : 'N/A'}/year to ${selectedCouncil.name}. See where your council tax goes.`}
          url={`${typeof window !== 'undefined' ? window.location.origin : ''}/council/${getCouncilSlug(selectedCouncil)}/card/your-bill`}
          imageUrl={`/api/share/${getCouncilSlug(selectedCouncil)}/your-bill?format=story`}
          variant="hero"
        />
      </div>
    </section>
  );
};

export default YourBillCard;
