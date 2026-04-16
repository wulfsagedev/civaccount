'use client';

import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { useCouncil } from '@/context/CouncilContext';
import { formatCurrency, calculateBands, getCouncilSlug, toSentenceTypeName, getTotalBandD } from '@/data/councils';
import { BUDGET_CATEGORIES } from '@/lib/proposals';
import { getTypeAverages } from '@/lib/council-averages';
import ShareButton from '@/components/proposals/ShareButton';
import Header from '@/components/Header';

const bandDescriptions: Record<string, string> = {
  A: 'Smallest properties',
  B: 'Small properties',
  C: 'Smaller than average',
  D: 'Average properties',
  E: 'Larger than average',
  F: 'Large properties',
  G: 'Very large properties',
  H: 'Highest value properties',
};

// UK median full-time gross weekly pay (ONS 2024) — £682
const UK_MEDIAN_WEEKLY_PAY = 682;

// Real-world weekly cost comparisons
function getEquivalents(weeklyCost: number): { label: string; icon: string }[] {
  const items: { label: string; icon: string; cost: number }[] = [
    { label: 'cups of coffee', icon: '☕', cost: 3.50 },
    { label: 'loaves of bread', icon: '🍞', cost: 1.35 },
    { label: 'litres of petrol', icon: '⛽', cost: 1.45 },
    { label: 'pints of milk', icon: '🥛', cost: 0.65 },
  ];
  return items
    .map(item => ({
      label: `${Math.round(weeklyCost / item.cost)} ${item.label}`,
      icon: item.icon,
    }))
    .slice(0, 3);
}

function Divider() {
  return <div className="border-t border-dashed border-border/50 my-5" />;
}

export default function TaxCardClient() {
  const { selectedCouncil } = useCouncil();
  const params = useParams<{ slug: string }>();
  const searchParams = useSearchParams();

  const bandFromUrl = searchParams.get('band')?.toUpperCase();
  const validBands = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
  const initialBand = bandFromUrl && validBands.includes(bandFromUrl) ? bandFromUrl : 'D';
  const [selectedBand, setSelectedBand] = useState(initialBand);

  const slug = params?.slug || '';

  // Sync band to URL
  useEffect(() => {
    const url = new URL(window.location.href);
    if (selectedBand === 'D') {
      url.searchParams.delete('band');
    } else {
      url.searchParams.set('band', selectedBand);
    }
    window.history.replaceState({}, '', url.toString());
  }, [selectedBand]);

  if (!selectedCouncil || !selectedCouncil.council_tax?.band_d_2025) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="type-body-sm text-muted-foreground">Loading...</p>
      </div>
    );
  }

  const council = selectedCouncil;
  const councilTax = council.council_tax!;
  const bandD = councilTax.band_d_2025;
  const bandDPrev = councilTax.band_d_2024;
  const allBands = calculateBands(bandD);
  const precepts = council.detailed?.precepts;
  // Prefer the derived total (sum of precepts) — the raw data field is wrong
  // for many county councils where it equals only the council's own share.
  const totalBandD = getTotalBandD(council);
  const budget = council.budget;

  // Calculate amounts for selected band
  const bandDAmount = allBands[selectedBand as keyof typeof allBands];
  const ratio = bandDAmount / bandD;
  const totalForBand = totalBandD ? totalBandD * ratio : bandDAmount;
  const preceptsForBand = precepts?.map(p => ({
    ...p,
    amount: p.band_d * ratio,
  }));

  const weeklyCost = totalForBand / 52;
  const monthlyCost = totalForBand / 10;
  const changePct = bandDPrev ? ((bandD - bandDPrev) / bandDPrev * 100) : null;
  const changeWeekly = bandDPrev ? (totalForBand - (totalBandD ? totalBandD * ((allBands[selectedBand as keyof typeof allBands] / bandDPrev) * (bandDPrev / bandD)) : bandDPrev * ratio)) / 52 : null;

  // Service-level weekly costs (from budget — council's share only, not precepts)
  const serviceWeeklyCosts = budget?.total_service
    ? Object.entries(BUDGET_CATEGORIES)
        .map(([key, label]) => {
          const amount = (budget[key as keyof typeof budget] as number | null) ?? 0;
          if (amount <= 0) return null;
          const pct = amount / budget.total_service!;
          const weeklyAmount = (bandDAmount / 52) * pct;
          return { key, label, weeklyAmount, pct };
        })
        .filter((x): x is NonNullable<typeof x> => x !== null)
        .sort((a, b) => b.weeklyAmount - a.weeklyAmount)
        .slice(0, 6)
    : [];

  // Band comparison — show adjacent bands
  const bandIdx = validBands.indexOf(selectedBand);
  const lowerBand = bandIdx > 0 ? validBands[bandIdx - 1] : null;
  const higherBand = bandIdx < validBands.length - 1 ? validBands[bandIdx + 1] : null;
  const lowerTotal = lowerBand ? (totalBandD ? totalBandD * (allBands[lowerBand as keyof typeof allBands] / bandD) : allBands[lowerBand as keyof typeof allBands]) : null;
  const higherTotal = higherBand ? (totalBandD ? totalBandD * (allBands[higherBand as keyof typeof allBands] / bandD) : allBands[higherBand as keyof typeof allBands]) : null;

  // Compared to average
  const typeAvg = getTypeAverages(council.type);
  const avgWeekly = typeAvg.bandD / 52;
  const vAvgWeekly = weeklyCost - avgWeekly;

  // Time-to-earn
  const hoursToEarn = totalForBand / (UK_MEDIAN_WEEKLY_PAY / 5 / 8); // hourly rate
  const daysToEarn = Math.floor(hoursToEarn / 8);
  const remainingHours = Math.round(hoursToEarn % 8);

  // Real-world equivalents
  const equivalents = getEquivalents(weeklyCost);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main id="main-content" className="max-w-lg mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Back link */}
        <Link
          href={`/council/${slug}`}
          className="inline-flex items-center gap-1.5 type-body-sm text-muted-foreground hover:text-foreground transition-colors mb-6 cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to {council.name}
        </Link>

        {/* Band selector */}
        <div className="mb-6">
          <p className="type-body-sm text-muted-foreground mb-3">Pick your property band</p>
          <div className="grid grid-cols-8 gap-1 sm:gap-1.5">
            {validBands.map((band) => (
              <button
                key={band}
                onClick={() => setSelectedBand(band)}
                className={`py-2.5 sm:py-3 rounded-lg type-body-sm font-semibold transition-all cursor-pointer ${
                  selectedBand === band
                    ? 'bg-foreground text-background'
                    : 'bg-muted hover:bg-muted/80'
                }`}
              >
                {band}
              </button>
            ))}
          </div>
        </div>

        {/* The receipt card */}
        <div className="card-elevated p-6 sm:p-8">
          {/* Receipt header */}
          <div className="text-center mb-6">
            <p className="type-overline text-muted-foreground tracking-widest mb-1">{council.type_name}</p>
            <h1 className="type-title-2 mb-1">{council.name}</h1>
            <p className="type-caption text-muted-foreground">Council tax receipt · 2025-26</p>
          </div>

          <Divider />

          {/* Hero amount */}
          <div className="text-center mb-2">
            <p className="type-caption text-muted-foreground mb-1">Band {selectedBand} · {bandDescriptions[selectedBand]}</p>
            <p className="type-display tabular-nums">
              {formatCurrency(totalForBand, { decimals: 2 })}
              <span className="type-body-sm text-muted-foreground font-normal">/year</span>
            </p>
          </div>

          {/* Weekly + monthly */}
          <div className="flex justify-center gap-6 mb-2">
            <p className="type-body-sm text-muted-foreground">
              <span className="font-semibold text-foreground tabular-nums">{formatCurrency(weeklyCost, { decimals: 2 })}</span>/week
            </p>
            <p className="type-body-sm text-muted-foreground">
              <span className="font-semibold text-foreground tabular-nums">{formatCurrency(monthlyCost, { decimals: 2 })}</span>/month
            </p>
          </div>

          {/* YoY change */}
          {changePct !== null && (
            <p className="type-caption text-muted-foreground text-center">
              {changePct > 0 ? 'Up' : 'Down'}{' '}
              <span className={`font-semibold ${changePct > 0 ? 'text-negative' : 'text-positive'}`}>
                {changePct > 0 ? '+' : ''}{changePct.toFixed(1)}%
              </span>
              {' '}from last year
            </p>
          )}

          <Divider />

          {/* Precepts breakdown */}
          {preceptsForBand && preceptsForBand.length > 0 && (
            <>
              <p className="type-overline text-muted-foreground tracking-widest mb-3">Where it goes</p>
              <div className="space-y-2 mb-1">
                {preceptsForBand.map((p) => (
                  <div key={p.authority} className="flex items-baseline justify-between py-1">
                    <p className="type-body-sm font-medium truncate min-w-0 flex-1 mr-3">{p.authority}</p>
                    <p className="type-body-sm tabular-nums shrink-0">
                      <span className="font-semibold">{formatCurrency(p.amount, { decimals: 2 })}</span>
                      <span className="text-muted-foreground ml-2">{((p.amount / totalForBand) * 100).toFixed(0)}%</span>
                    </p>
                  </div>
                ))}
              </div>
              <Divider />
            </>
          )}

          {/* Service-level weekly costs */}
          {serviceWeeklyCosts.length > 0 && (
            <>
              <p className="type-overline text-muted-foreground tracking-widest mb-3">Your weekly breakdown</p>
              <div className="space-y-2 mb-1">
                {serviceWeeklyCosts.map((s) => (
                  <div key={s.key} className="flex items-baseline justify-between py-1">
                    <p className="type-body-sm text-muted-foreground min-w-0 flex-1 mr-3">{s.label}</p>
                    <p className="type-body-sm font-semibold tabular-nums shrink-0">
                      {formatCurrency(s.weeklyAmount, { decimals: 2 })}<span className="text-muted-foreground font-normal">/wk</span>
                    </p>
                  </div>
                ))}
              </div>
              <Divider />
            </>
          )}

          {/* Band comparison */}
          {(lowerBand || higherBand) && (
            <>
              <p className="type-overline text-muted-foreground tracking-widest mb-3">If you were in a different band</p>
              <div className="space-y-2 mb-1">
                {lowerBand && lowerTotal !== null && (
                  <div className="flex items-baseline justify-between py-1">
                    <p className="type-body-sm text-muted-foreground">Band {lowerBand}</p>
                    <p className="type-body-sm tabular-nums">
                      <span className="font-semibold text-positive">{formatCurrency(lowerTotal - totalForBand, { decimals: 0 })}</span>
                      <span className="text-muted-foreground ml-2">({formatCurrency(lowerTotal, { decimals: 2 })})</span>
                    </p>
                  </div>
                )}
                {higherBand && higherTotal !== null && (
                  <div className="flex items-baseline justify-between py-1">
                    <p className="type-body-sm text-muted-foreground">Band {higherBand}</p>
                    <p className="type-body-sm tabular-nums">
                      <span className="font-semibold text-negative">+{formatCurrency(higherTotal - totalForBand, { decimals: 0 })}</span>
                      <span className="text-muted-foreground ml-2">({formatCurrency(higherTotal, { decimals: 2 })})</span>
                    </p>
                  </div>
                )}
              </div>
              <Divider />
            </>
          )}

          {/* Compared to average + time to earn + equivalents */}
          <div className="space-y-3">
            {/* Compared to average */}
            <p className="type-body-sm text-muted-foreground">
              Compared to the average {toSentenceTypeName(council.type_name)},{' '}
              <span className={`font-semibold ${vAvgWeekly > 0 ? 'text-negative' : vAvgWeekly < 0 ? 'text-positive' : ''}`}>
                you pay {formatCurrency(Math.abs(vAvgWeekly), { decimals: 2 })} {vAvgWeekly > 0 ? 'more' : 'less'} per week
              </span>
            </p>

            {/* Time to earn */}
            <p className="type-body-sm text-muted-foreground">
              At the UK median salary, your annual council tax takes{' '}
              <span className="font-semibold text-foreground">
                {daysToEarn} working day{daysToEarn !== 1 ? 's' : ''}{remainingHours > 0 ? ` and ${remainingHours} hour${remainingHours !== 1 ? 's' : ''}` : ''}
              </span>
              {' '}to earn
            </p>

            {/* Real-world equivalents */}
            <p className="type-body-sm text-muted-foreground">
              Each week, that&apos;s the same as{' '}
              {equivalents.map((eq, i) => (
                <span key={eq.label}>
                  {i > 0 && (i === equivalents.length - 1 ? ', or ' : ', ')}
                  <span className="font-semibold text-foreground">{eq.label}</span>
                </span>
              ))}
            </p>
          </div>

          <Divider />

          {/* Branding */}
          <p className="type-caption text-muted-foreground text-center">
            CivAccount · {council.name} · 2025-26
          </p>
        </div>

        {/* Share CTA */}
        <div className="mt-6">
          <ShareButton
            title={`My council tax card — ${council.name}`}
            text={`I pay ${formatCurrency(weeklyCost, { decimals: 2 })}/week in council tax to ${council.name}. What do you pay? Check yours:`}
            url={`${typeof window !== 'undefined' ? window.location.origin : ''}/council/${slug}/tax-card${selectedBand !== 'D' ? `?band=${selectedBand}` : ''}`}
            imageUrl={`/api/share/${slug}/tax-card?format=story`}
            variant="hero"
            label="Share your tax card"
            showPreview
          />
        </div>

        {/* Link to full dashboard */}
        <div className="mt-4 text-center">
          <Link
            href={`/council/${slug}`}
            className="type-body-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer underline"
          >
            See the full {council.name} dashboard
          </Link>
        </div>
      </main>
    </div>
  );
}
