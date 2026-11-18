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
import { formatCurrency, getCouncilByName, getCouncilSlug, councils, toSentenceTypeName, getTotalBandD, getBillSplitYear, getOwnPrecept, type Council, type PreceptBreakdown } from '@/data/councils';
import ShareButton from '@/components/proposals/ShareButton';
import { useIsEmbed } from '@/lib/embed-context';
import SourceAnnotation from '@/components/ui/source-annotation';
import { getProvenance } from '@/data/provenance';
import { INFLATION_CONTEXT } from '@/lib/inflation-context';
import { SITE_URL, withReferral } from '@/lib/utils';

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

// Plain-English line under each bill row, by who the money goes to.
const describePrecept = (precept: PreceptBreakdown): string | null => {
  switch (precept.kind) {
    case 'council':
      return precept.includes_parish_average ? 'Includes the average for parish and other local councils' : null;
    case 'county': return 'Education, social care, highways';
    case 'gla': return 'Mayor of London';
    case 'police': return 'Local policing and crime prevention';
    case 'fire': return 'Fire and rescue services';
    case 'combined_authority': return 'Mayor and combined authority';
  }
  // Rows without a kind (build fixtures): guess from the name.
  const name = precept.authority.toLowerCase();
  if (name.includes('police')) return 'Local policing and crime prevention';
  if (name.includes('fire')) return 'Fire and rescue services';
  if (name.includes('county')) return 'Education, social care, highways';
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
  // The bill split (MHCLG Table 10): rows that add up to the area Band D, to
  // the penny. Everything in this card is in the split's year. A county has
  // no total — each district's share and any parish precept sit on top.
  const splitYear = getBillSplitYear(selectedCouncil);
  const splitProvenance = getProvenance(`bill_split.${splitYear}`, selectedCouncil);
  const totalBill = getTotalBandD(selectedCouncil);
  const ownPrecept = getOwnPrecept(selectedCouncil);
  const isCounty = selectedCouncil.type === 'SC';

  return (
    <section id="your-bill" className="card-elevated p-5 sm:p-6">
      {/* Primary amount - This council's share */}
      <div className="mb-6">
        <div className="flex items-center gap-1.5 mb-1">
          <span className="type-caption text-muted-foreground">
            Typical Band D share for this council · {splitYear}
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
            provenance={splitProvenance}
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
        {/* Year-on-year change callout removed 2026-04-22 per owner
            directive. Both the % change and the £ delta are
            CivAccount subtractions between this year's and last year's
            Tier 1 Band D figures. The calculation is trivial but the
            resulting value doesn't appear verbatim in any single
            council's publication, so it fails the "every data point
            directly from a linkable public document" bar. Readers can
            still see every individual year's Band D (all Tier 1
            sourced) in the "How your bill has changed" card below. */}
      </div>

      {/* Two-tier explainer — STRIPPED 2026-05-04 (same precedent as PR #118
          Adur rollout 2026-05-01). Previously rendered "About £252 of your
          bill goes to Bassetlaw; the remaining £2,288 goes to Nottinghamshire
          County Council" — but `£2,288` is `totalBill - thisCouncilBandD`,
          a CivAccount subtraction with no verbatim source. Plain-English
          context (which authority gets what) is preserved by the
          per-precept breakdown card immediately below this one. */}

      {/* Full bill breakdown with visual bar */}
      {detailed?.precepts && detailed.precepts.length > 0 && (
        <div className="pt-5 border-t border-border/50">
          <p className="type-body-sm font-semibold mb-1">
            {isCounty ? `Band D charges · ${splitYear}` : `Typical Band D bill · ${splitYear}`}
          </p>
          <p className="type-caption text-muted-foreground mb-4">
            {isCounty
              ? `What each authority charged a Band D home in ${splitYear}. Your district council and any parish council add their own charge, so the full bill depends on where you live.`
              : `How the ${splitYear} bill is split. Average across ${selectedCouncil.name} — actual bills vary by band, parish and discounts.`}
          </p>

          {/* Visual stacked bar with legend — only where the rows make up a
              whole bill. A county's rows are only part of one. */}
          {totalBill && (
            <div className="mb-4">
              <div className="h-2 rounded-full overflow-hidden flex bg-muted">
                {detailed.precepts.map((precept, index) => (
                  <div
                    key={index}
                    className={`h-full ${precept === ownPrecept ? 'bg-foreground' : 'bg-muted-foreground/40'}`}
                    style={{ width: `${(precept.band_d / totalBill) * 100}%` }}
                  />
                ))}
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
          )}

          {/* Breakdown list - consistent row heights with icons */}
          <div className="space-y-0">
            {detailed.precepts.map((precept, index) => {
              const isThisCouncil = precept === ownPrecept;
              const linkedCouncil = !isThisCouncil ? findLinkedCouncil(precept.authority) : null;
              const isLinkable = linkedCouncil && (precept.kind
                ? precept.kind === 'county'
                : !precept.authority.toLowerCase().includes('police') && !precept.authority.toLowerCase().includes('fire'));

              // The full name, as Table 10 and the council's own bill print it.
              // (Stripping " District Council" turned "City of Bradford
              // Metropolitan District Council" into "City of Bradford Metropolitan".)
              const displayName = precept.authority;
              const description = precept.description || describePrecept(precept);

              const rowContent = (
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <span className={`type-body-sm ${isThisCouncil ? 'font-semibold' : ''} ${isLinkable ? 'group-hover:text-foreground transition-colors' : ''}`}>
                      {displayName}
                    </span>
                    {description && (
                      <p className="type-caption text-muted-foreground">{description}</p>
                    )}
                  </div>
                  {isLinkable && (
                    <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors shrink-0 ml-2" />
                  )}
                  <span className={`type-body-sm font-semibold tabular-nums shrink-0 ml-3 ${isThisCouncil ? '' : 'text-muted-foreground'}`}>
                    <SourceAnnotation
                      provenance={splitProvenance}
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

          {/* Total — or, for a county, what sits on top */}
          {totalBill ? (
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-border/50">
              <div>
                <span className="type-body font-semibold">Typical Band D total · {splitYear}</span>
                {totalDailyCost && (
                  <p className="type-caption text-muted-foreground">
                    <SourceAnnotation
                      provenance={splitProvenance}
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
                  provenance={splitProvenance}
                  reportContext={{
                    council: selectedCouncil.name,
                    field: 'Band D total bill',
                    value: formatCurrency(totalBill, { decimals: 2 }),
                  }}
                >{formatCurrency(totalBill, { decimals: 2 })}</SourceAnnotation>
              </span>
            </div>
          ) : (
            <div className="mt-4 pt-4 border-t border-border/50">
              <p className="type-body-sm font-semibold">Plus your district council</p>
              <p className="type-caption text-muted-foreground">
                And your parish or town council, if you have one. Find your district council to see your full bill.
              </p>
            </div>
          )}

          {/* Check your exact bill CTA — links out to council's own calculator */}
          {detailed?.council_tax_url && (
            <a
              href={withReferral(detailed.council_tax_url, 'cta', 'check-your-bill')}
              target="_blank"
              rel="noopener"
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

      {/* "Compared to average" callout removed 2026-04-22 per owner
          directive. The comparator is a CivAccount-derived average
          across all councils of the same type; it doesn't appear
          verbatim in any single council's publication, so it fails
          the "every data point directly from a linkable public
          document" bar. Individual Band D values for every council
          are still published and sourced — readers can compare
          manually via /compare. */}

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
            url={withReferral(`${SITE_URL}/council/${getCouncilSlug(selectedCouncil)}/card/your-bill`, 'share', 'your-bill')}
            imageUrl={`/api/share/${getCouncilSlug(selectedCouncil)}/your-bill?format=story`}
            variant="hero"
          />
        </div>
      )}
    </section>
  );
};

export default YourBillCard;
