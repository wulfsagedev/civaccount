'use client';

import { useState, useMemo } from 'react';
import { Badge } from "@/components/ui/badge";
import { Home, CheckCircle, Lightbulb, Info, TrendingUp, TrendingDown, ExternalLink, Building2, Shield, Flame, ArrowRight } from "lucide-react";
import { useCouncil } from '@/context/CouncilContext';
import { calculateBands, getAverageBandDByType, formatCurrency } from '@/data/councils';

const CouncilTaxSection = () => {
  const { selectedCouncil } = useCouncil();
  const [selectedBand, setSelectedBand] = useState('D');

  const councilTaxData = useMemo(() => {
    if (!selectedCouncil?.council_tax) return null;

    const bandD = selectedCouncil.council_tax.band_d_2025;
    const bands = calculateBands(bandD);

    return {
      bandD,
      bandD_2024: selectedCouncil.council_tax.band_d_2024,
      bandD_2023: selectedCouncil.council_tax.band_d_2023,
      bands: {
        A: { rate: 6/9, amount: bands.A, description: "Small homes and flats" },
        B: { rate: 7/9, amount: bands.B, description: "Small houses" },
        C: { rate: 8/9, amount: bands.C, description: "Normal-sized family homes" },
        D: { rate: 1, amount: bands.D, description: "Medium-sized family homes (used as the standard)" },
        E: { rate: 11/9, amount: bands.E, description: "Bigger family homes" },
        F: { rate: 13/9, amount: bands.F, description: "Large houses" },
        G: { rate: 15/9, amount: bands.G, description: "Very big houses" },
        H: { rate: 18/9, amount: bands.H, description: "The biggest houses" }
      }
    };
  }, [selectedCouncil]);

  // Calculate year-over-year change
  const yearChange = useMemo(() => {
    if (!councilTaxData?.bandD || !councilTaxData?.bandD_2024) return null;
    const change = councilTaxData.bandD - councilTaxData.bandD_2024;
    const percentChange = (change / councilTaxData.bandD_2024) * 100;
    return { change, percentChange };
  }, [councilTaxData]);

  // Get average for comparison
  const typeAverage = useMemo(() => {
    if (!selectedCouncil) return null;
    return getAverageBandDByType(selectedCouncil.type);
  }, [selectedCouncil]);

  if (!selectedCouncil) {
    return (
      <div className="card-elevated p-8 text-center">
        <p className="text-muted-foreground">Please select a council to view council tax information.</p>
      </div>
    );
  }

  if (!councilTaxData) {
    return (
      <div className="card-elevated p-8">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Info className="h-5 w-5" />
          <p>Council tax data not available for {selectedCouncil.name}.</p>
        </div>
      </div>
    );
  }

  const calculateMonthlyPayment = (annualAmount: number) => formatCurrency(annualAmount / 10, { decimals: 2 });
  const calculateWeeklyPayment = (annualAmount: number) => formatCurrency(annualAmount / 52, { decimals: 2 });

  return (
    <div className="space-y-8">
      {/* Hero Section - Your Council Tax */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Primary Metric - Selected Band Amount */}
        <div className="lg:col-span-2">
          <div className="card-elevated p-6 sm:p-8">
            <div className="flex items-start justify-between mb-6">
              <div>
                <p className="type-overline mb-2">Band {selectedBand} Council Tax</p>
                <p className="type-metric text-foreground">
                  {formatCurrency(councilTaxData.bands[selectedBand as keyof typeof councilTaxData.bands].amount, { decimals: 2 })}
                </p>
              </div>
              {yearChange && (
                <Badge variant="outline" className="text-xs font-medium">
                  <span className="flex items-center gap-1">
                    {yearChange.change > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                    {yearChange.change > 0 ? '+' : ''}{yearChange.percentChange.toFixed(1)}%
                  </span>
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-lg mb-6">
              {councilTaxData.bands[selectedBand as keyof typeof councilTaxData.bands].description}. This is only the {selectedCouncil.name} portion of your bill.
            </p>

            {/* Payment breakdown */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 pt-6 border-t border-border/50">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Monthly (10 payments)</p>
                <p className="text-xl font-semibold tabular-nums">
                  {calculateMonthlyPayment(councilTaxData.bands[selectedBand as keyof typeof councilTaxData.bands].amount)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Weekly equivalent</p>
                <p className="text-xl font-semibold tabular-nums">
                  {calculateWeeklyPayment(councilTaxData.bands[selectedBand as keyof typeof councilTaxData.bands].amount)}
                </p>
              </div>
              <div className="hidden sm:block">
                <p className="text-sm text-muted-foreground mb-1">Daily cost</p>
                <p className="text-xl font-semibold tabular-nums">
                  {formatCurrency(councilTaxData.bands[selectedBand as keyof typeof councilTaxData.bands].amount / 365, { decimals: 2 })}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Band Selector - Compact */}
        <div className="card-elevated p-6 flex flex-col">
          <p className="type-overline mb-4">Select Your Band</p>
          <div className="grid grid-cols-4 gap-2 flex-1">
            {Object.entries(councilTaxData.bands).map(([band, data]) => (
              <button
                key={band}
                onClick={() => setSelectedBand(band)}
                className={`p-2 rounded-lg text-center transition-all cursor-pointer border ${
                  selectedBand === band
                    ? 'bg-muted border-border shadow-sm text-foreground'
                    : 'bg-muted/30 border-transparent hover:bg-muted/50 text-foreground'
                }`}
              >
                <div className="font-semibold text-sm">{band}</div>
                <div className={`text-xs tabular-nums ${selectedBand === band ? 'text-foreground/70' : 'text-muted-foreground'}`}>
                  £{Math.round(data.amount)}
                </div>
              </button>
            ))}
          </div>

          {/* Comparison with average */}
          {typeAverage && (
            <div className="mt-4 pt-4 border-t border-border/50">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">vs {selectedCouncil.type_name} avg</span>
                <span className="font-medium text-foreground">
                  {councilTaxData.bandD > typeAverage ? '+' : ''}{formatCurrency(councilTaxData.bandD - typeAverage, { decimals: 2 })}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Full Bill Breakdown - Only show if detailed data available */}
      {selectedCouncil.detailed?.precepts && selectedCouncil.detailed.precepts.length > 0 && (
        <div className="card-elevated p-6 sm:p-8">
          <div className="flex items-start justify-between mb-6 sm:mb-8">
            <div>
              <h2 className="text-lg sm:text-xl font-semibold mb-1">Where your full bill goes</h2>
              <p className="text-sm text-muted-foreground">
                Your council tax is split between several organisations
              </p>
            </div>
            <Badge variant="outline" className="text-xs font-medium bg-navy-50 text-navy-600 border-navy-200">
              Verified
            </Badge>
          </div>

          <div className="space-y-4">
            {selectedCouncil.detailed.precepts.map((precept, index) => {
              const totalBandD = selectedCouncil.detailed?.total_band_d || 0;
              const percentage = totalBandD > 0 ? (precept.band_d / totalBandD) * 100 : 0;
              const isDistrict = precept.authority.toLowerCase().includes(selectedCouncil.name.toLowerCase());
              const bandRatio = councilTaxData.bands[selectedBand as keyof typeof councilTaxData.bands].rate;
              const bandAmount = precept.band_d * bandRatio;
              const maxPercentage = Math.max(...(selectedCouncil.detailed?.precepts?.map(p => (p.band_d / totalBandD) * 100) || [100]));
              const barWidth = (percentage / maxPercentage) * 100;

              return (
                <div key={index} className="group">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                        {precept.authority.toLowerCase().includes('county') && <Building2 className="h-4 w-4 text-muted-foreground" />}
                        {precept.authority.toLowerCase().includes('police') && <Shield className="h-4 w-4 text-muted-foreground" />}
                        {precept.authority.toLowerCase().includes('fire') && <Flame className="h-4 w-4 text-muted-foreground" />}
                        {isDistrict && <Home className="h-4 w-4 text-foreground" />}
                      </div>
                      <span className={`font-medium text-sm ${isDistrict ? 'text-foreground' : ''}`}>{precept.authority}</span>
                      {isDistrict && (
                        <Badge variant="outline" className="text-xs">This council</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-muted-foreground tabular-nums">
                        {percentage.toFixed(1)}%
                      </span>
                      <span className="font-semibold text-sm tabular-nums min-w-[70px] text-right">
                        {formatCurrency(bandAmount, { decimals: 2 })}
                      </span>
                    </div>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ease-out ${isDistrict ? 'bg-foreground' : 'bg-stone-400 dark:bg-stone-500'}`}
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Total */}
          <div className="mt-8 pt-6 border-t border-border/50 flex items-center justify-between">
            <span className="font-semibold">Total Band {selectedBand} Council Tax</span>
            <span className="text-xl font-bold tabular-nums">
              {formatCurrency((selectedCouncil.detailed?.total_band_d || 0) * councilTaxData.bands[selectedBand as keyof typeof councilTaxData.bands].rate, { decimals: 2 })}
            </span>
          </div>

          {/* Myth-busting callout for district councils */}
          {selectedCouncil.type === 'SD' && (
            <div className="mt-8 p-6 rounded-xl bg-muted/50 border border-border/50">
              <div className="flex gap-4">
                <div className="shrink-0">
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                    <Info className="h-5 w-5 text-muted-foreground" />
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-foreground mb-2">
                    Common misunderstanding
                  </h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Most people think {selectedCouncil.name} controls their whole council tax bill.
                    In reality, {selectedCouncil.name} only receives about {((councilTaxData.bandD / (selectedCouncil.detailed?.total_band_d || councilTaxData.bandD)) * 100).toFixed(0)}% of what you pay.
                    The rest goes to the county council, police, and fire services.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Source link */}
          {selectedCouncil.detailed?.council_tax_url && (
            <div className="mt-6 flex items-center gap-2 text-sm text-muted-foreground">
              <span>Data verified from</span>
              <a
                href={selectedCouncil.detailed.council_tax_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline flex items-center gap-1 cursor-pointer"
              >
                official sources
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          )}
        </div>
      )}

      {/* All Bands Overview - Compact Table */}
      <div className="card-elevated p-6 sm:p-8">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-lg sm:text-xl font-semibold mb-1">All council tax bands</h2>
            <p className="text-sm text-muted-foreground">
              {selectedCouncil.name}&apos;s rates for each property band
            </p>
          </div>
          <Badge variant="outline" className="text-xs">2025-26</Badge>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/50">
                <th className="text-left text-sm font-medium text-muted-foreground pb-3">Band</th>
                <th className="text-left text-sm font-medium text-muted-foreground pb-3 hidden sm:table-cell">Property type</th>
                <th className="text-right text-sm font-medium text-muted-foreground pb-3">Rate</th>
                <th className="text-right text-sm font-medium text-muted-foreground pb-3">Annual</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(councilTaxData.bands).map(([band, data]) => {
                const isSelected = band === selectedBand;
                const percentOfD = Math.round(data.rate * 100);
                return (
                  <tr
                    key={band}
                    onClick={() => setSelectedBand(band)}
                    className={`border-b border-border/30 last:border-0 cursor-pointer transition-colors ${isSelected ? 'bg-muted/50' : 'hover:bg-muted/30'}`}
                  >
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <span className={`font-semibold ${isSelected ? 'text-foreground' : ''}`}>Band {band}</span>
                        {isSelected && <ArrowRight className="h-3 w-3 text-muted-foreground" />}
                      </div>
                    </td>
                    <td className="py-3 text-sm text-muted-foreground hidden sm:table-cell">{data.description}</td>
                    <td className="py-3 text-right">
                      <Badge variant="outline" className="text-xs border-muted-foreground/20">{percentOfD}%</Badge>
                    </td>
                    <td className={`py-3 text-right font-semibold tabular-nums ${isSelected ? 'text-foreground' : ''}`}>
                      {formatCurrency(data.amount, { decimals: 2 })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Understanding Council Tax - Streamlined */}
      <div className="card-elevated p-6 sm:p-8">
        <h2 className="text-lg sm:text-xl font-semibold mb-6">How council tax works</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground">
              About bands
            </h3>
            <ul className="space-y-3">
              {[
                'Based on your home\'s value in April 1991',
                'Set by the Valuation Office Agency (VOA)',
                'Band D is the standard for comparison',
                'Higher bands pay more, lower bands pay less',
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-sm">
                  <CheckCircle className="h-4 w-4 mt-0.5 shrink-0 text-stone-400" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground">
              Payment options
            </h3>
            <ul className="space-y-3">
              {[
                'Pay in 10 monthly instalments (April–January)',
                'Set up Direct Debit for automatic payments',
                '25% discount if you live alone',
                'Some councils offer early payment discounts',
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-sm">
                  <CheckCircle className="h-4 w-4 mt-0.5 shrink-0 text-stone-400" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Important note */}
        <div className="mt-8 p-4 bg-muted/50 rounded-xl">
          <div className="flex items-start gap-3">
            <Lightbulb className="h-5 w-5 shrink-0 text-primary mt-0.5" />
            <p className="text-sm text-muted-foreground leading-relaxed">
              <span className="font-medium text-foreground">Remember:</span>{' '}
              {selectedCouncil.type === 'SD' || selectedCouncil.type === 'SC'
                ? `These figures show only the ${selectedCouncil.name} portion. Your total bill also includes county council, police, and fire service charges.`
                : selectedCouncil.type === 'LB' || selectedCouncil.type === 'OLB' || selectedCouncil.type === 'ILB'
                ? `These figures show only the ${selectedCouncil.name} portion. Your total bill also includes the Greater London Authority (GLA) charge.`
                : `These figures show only the ${selectedCouncil.name} portion. Your total bill may also include police and fire charges.`
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CouncilTaxSection;
