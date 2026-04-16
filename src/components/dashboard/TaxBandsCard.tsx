'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { formatCurrency, type Council } from '@/data/councils';
import CardShareHeader from '@/components/dashboard/CardShareHeader';
import SourceAnnotation from '@/components/ui/source-annotation';
import { getProvenance } from '@/data/provenance';

const bandDescriptions: Record<string, string> = {
  A: 'Smallest properties',
  B: 'Small properties',
  C: 'Smaller than average',
  D: 'Average properties',
  E: 'Larger than average',
  F: 'Large properties',
  G: 'Very large properties',
  H: 'Highest value properties'
};

interface TaxBandsCardProps {
  selectedCouncil: Council;
  allBands: Record<string, number>;
  totalBandAmounts: Record<string, number> | null;
}

const TaxBandsCard = ({
  selectedCouncil,
  allBands,
  totalBandAmounts,
}: TaxBandsCardProps) => {
  const searchParams = useSearchParams();
  const bandFromUrl = searchParams.get('band')?.toUpperCase();
  const validBands = Object.keys(allBands);
  const initialBand = bandFromUrl && validBands.includes(bandFromUrl) ? bandFromUrl : 'D';
  const [selectedBand, setSelectedBand] = useState(initialBand);
  const detailed = selectedCouncil.detailed;

  // Sync band selection to URL (without adding history entries)
  useEffect(() => {
    const url = new URL(window.location.href);
    if (selectedBand === 'D') {
      url.searchParams.delete('band');
    } else {
      url.searchParams.set('band', selectedBand);
    }
    window.history.replaceState({}, '', url.toString());
  }, [selectedBand]);

  return (
    <section id="tax-bands" className="card-elevated p-5 sm:p-6">
      <CardShareHeader
        cardType="tax-bands"
        title="Council tax by band"
        subtitle="Pick your property band to see how much you pay"
        councilName={selectedCouncil.name}
      />

      {/* Band selector — 4×2 on mobile, 8×1 from sm up. Eight pills in one
          row on a 320–375px viewport forced each 44px-min tap target to
          overlap its neighbour by ~10px; two rows keeps chunky-finger
          targets AND clean gaps. */}
      <div role="radiogroup" aria-label="Select council tax band" className="grid grid-cols-4 sm:grid-cols-8 gap-1.5 mb-5">
        {Object.keys(allBands).map((band) => (
          <button
            key={band}
            role="radio"
            aria-checked={selectedBand === band}
            onClick={() => setSelectedBand(band)}
            className={`py-2.5 sm:py-3 rounded-lg type-body-sm font-semibold transition-colors cursor-pointer ${
              selectedBand === band
                ? 'bg-foreground text-background'
                : 'bg-muted hover:bg-muted/80'
            }`}
          >
            {band}
          </button>
        ))}
      </div>

      {/* Selected band details - show total bill as primary when available */}
      <div className="p-4 sm:p-5 rounded-lg bg-muted/30">
        <p className="type-caption text-muted-foreground mb-1">Band {selectedBand} · {bandDescriptions[selectedBand]}</p>
        <p className="type-metric mb-4">
          <SourceAnnotation
            provenance={getProvenance('tax_bands', selectedCouncil)}
            reportContext={{
              council: selectedCouncil.name,
              field: `Council tax Band ${selectedBand} (annual)`,
              value: formatCurrency(
                totalBandAmounts
                  ? totalBandAmounts[selectedBand as keyof typeof totalBandAmounts]
                  : allBands[selectedBand as keyof typeof allBands],
                { decimals: 2 }
              ),
            }}
          >
            {formatCurrency(
              totalBandAmounts
                ? totalBandAmounts[selectedBand as keyof typeof totalBandAmounts]
                : allBands[selectedBand as keyof typeof allBands],
              { decimals: 2 }
            )}
          </SourceAnnotation>
        </p>
        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border/50">
          <div>
            <p className="type-caption text-muted-foreground mb-0.5">Monthly (10 payments)</p>
            <p className="type-body font-semibold tabular-nums">
              <SourceAnnotation
                provenance={getProvenance('tax_bands', selectedCouncil)}
                reportContext={{
                  council: selectedCouncil.name,
                  field: `Council tax Band ${selectedBand} (monthly, 10 payments)`,
                  value: formatCurrency(
                    (totalBandAmounts
                      ? totalBandAmounts[selectedBand as keyof typeof totalBandAmounts]
                      : allBands[selectedBand as keyof typeof allBands]) / 10,
                    { decimals: 2 }
                  ),
                }}
              >
                {formatCurrency(
                  (totalBandAmounts
                    ? totalBandAmounts[selectedBand as keyof typeof totalBandAmounts]
                    : allBands[selectedBand as keyof typeof allBands]) / 10,
                  { decimals: 2 }
                )}
              </SourceAnnotation>
            </p>
          </div>
          <div>
            <p className="type-caption text-muted-foreground mb-0.5">Weekly</p>
            <p className="type-body font-semibold tabular-nums">
              <SourceAnnotation
                provenance={getProvenance('tax_bands', selectedCouncil)}
                reportContext={{
                  council: selectedCouncil.name,
                  field: `Council tax Band ${selectedBand} (weekly)`,
                  value: formatCurrency(
                    (totalBandAmounts
                      ? totalBandAmounts[selectedBand as keyof typeof totalBandAmounts]
                      : allBands[selectedBand as keyof typeof allBands]) / 52,
                    { decimals: 2 }
                  ),
                }}
              >
                {formatCurrency(
                  (totalBandAmounts
                    ? totalBandAmounts[selectedBand as keyof typeof totalBandAmounts]
                    : allBands[selectedBand as keyof typeof allBands]) / 52,
                  { decimals: 2 }
                )}
              </SourceAnnotation>
            </p>
          </div>
        </div>
      </div>

      {/* Council's share context - shown when total includes other authorities */}
      {totalBandAmounts && (
        <div className="mt-4 p-3 rounded-lg bg-muted/30">
          <p className="type-body-sm text-muted-foreground">
            <span className="font-medium text-foreground">{selectedCouncil.name}&apos;s share:</span>{' '}
            <span className="font-semibold text-foreground tabular-nums">
              <SourceAnnotation
                provenance={getProvenance('council_tax.band_d_2025', selectedCouncil)}
                reportContext={{
                  council: selectedCouncil.name,
                  field: `Council's share of Band ${selectedBand}`,
                  value: formatCurrency(allBands[selectedBand as keyof typeof allBands], { decimals: 2 }),
                }}
              >
                {formatCurrency(allBands[selectedBand as keyof typeof allBands], { decimals: 2 })}
              </SourceAnnotation>
            </span>
            {' '}of your Band {selectedBand} bill
          </p>
        </div>
      )}

      {/* Band estimation helper */}
      <div className="mt-4 p-3 rounded-lg bg-muted/30">
        <p className="type-caption text-muted-foreground">
          <span className="font-medium text-foreground">Don&apos;t know your band?</span>{' '}
          <a
            href="https://www.gov.uk/council-tax-bands"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-foreground transition-colors cursor-pointer"
          >
            Find your band on GOV.UK
            <span className="sr-only"> (opens in new tab)</span>
          </a>
        </p>
      </div>

      {/* Source link */}
      {detailed?.council_tax_url && (
        <p className="mt-4 pt-3 border-t border-border/30 type-caption text-muted-foreground">
          Source:{' '}
          <a
            href={detailed.council_tax_url}
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-foreground transition-colors cursor-pointer"
          >
            {selectedCouncil.name} council tax rates
            <span className="sr-only"> (opens in new tab)</span>
          </a>
        </p>
      )}
    </section>
  );
};

export default TaxBandsCard;
