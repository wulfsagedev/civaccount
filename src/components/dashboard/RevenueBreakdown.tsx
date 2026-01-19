'use client';

import { useMemo } from 'react';
import { Badge } from "@/components/ui/badge";
import { PoundSterling, Landmark, Receipt, Wallet, Store, TrendingDown, Info, AlertTriangle, CheckCircle, Lightbulb } from "lucide-react";
import { useCouncil } from '@/context/CouncilContext';
import { formatBudget } from '@/data/councils';

const RevenueBreakdown = () => {
  const { selectedCouncil } = useCouncil();

  // Calculate revenue estimates based on budget data
  const revenueData = useMemo(() => {
    if (!selectedCouncil?.budget?.total_service) return null;

    const totalBudget = selectedCouncil.budget.total_service * 1000;
    const netCurrent = selectedCouncil.budget.net_current ? selectedCouncil.budget.net_current * 1000 : totalBudget * 0.85;

    // Estimate revenue breakdown based on typical council percentages
    // These are estimates as actual revenue breakdown isn't in the source data
    const councilTaxPercent = selectedCouncil.type === 'SD' ? 0.55 : 0.40;
    const govGrantsRingfencedPercent = selectedCouncil.type === 'SC' ? 0.30 : 0.20;
    const serviceIncomePercent = 0.15;
    const govGrantsUnringfencedPercent = 0.10;
    const businessRatesPercent = selectedCouncil.type === 'SD' ? 0.05 : 0.05;

    return {
      totalRevenue: netCurrent,
      streams: [
        {
          source: "Council Tax",
          amount: netCurrent * councilTaxPercent,
          percentage: Math.round(councilTaxPercent * 100),
          icon: PoundSterling,
          description: "Money that you and your neighbours pay to the council",
          stability: "High",
          volatility: "Steady - goes up a little each year"
        },
        {
          source: "Government Money (For Specific Things)",
          amount: netCurrent * govGrantsRingfencedPercent,
          percentage: Math.round(govGrantsRingfencedPercent * 100),
          icon: Landmark,
          description: "Money the government gives that must be spent on certain things",
          stability: "Medium",
          volatility: "Depends on what the government decides"
        },
        {
          source: "Fees for Services",
          amount: netCurrent * serviceIncomePercent,
          percentage: Math.round(serviceIncomePercent * 100),
          icon: Receipt,
          description: "Money people pay when they use council services (like parking)",
          stability: "Medium",
          volatility: "Changes based on how many people use services"
        },
        {
          source: "Government Money (Flexible)",
          amount: netCurrent * govGrantsUnringfencedPercent,
          percentage: Math.round(govGrantsUnringfencedPercent * 100),
          icon: Wallet,
          description: "Money the government gives that can be spent on anything",
          stability: "Low",
          volatility: "Can change a lot if the government cuts spending"
        },
        {
          source: "Business Rates",
          amount: netCurrent * businessRatesPercent,
          percentage: Math.round(businessRatesPercent * 100),
          icon: Store,
          description: "Taxes paid by shops and businesses in the area",
          stability: "Low",
          volatility: "Goes down when shops close"
        }
      ]
    };
  }, [selectedCouncil]);

  if (!selectedCouncil) {
    return (
      <div className="card-elevated p-6 sm:p-8 text-center">
        <p className="text-muted-foreground">Please select a council to view revenue information.</p>
      </div>
    );
  }

  if (!revenueData) {
    return (
      <div className="card-elevated p-6 sm:p-8">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Info className="h-5 w-5" />
          <p>Revenue data not available for {selectedCouncil.name}.</p>
        </div>
      </div>
    );
  }

  const { totalRevenue, streams } = revenueData;
  const maxPercentage = Math.max(...streams.map(s => s.percentage));

  return (
    <div className="space-y-8">
      {/* Hero Section - Total Revenue */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Primary Metric */}
        <div className="lg:col-span-2">
          <div className="card-elevated p-6 sm:p-8">
            <div className="flex items-start justify-between mb-6">
              <div>
                <p className="type-overline mb-2">Estimated Annual Revenue</p>
                <p className="type-metric text-foreground">
                  {formatBudget(totalRevenue / 1000)}
                </p>
              </div>
              <Badge variant="outline" className="text-xs font-medium">
                Estimate
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-lg">
              This is roughly how much money {selectedCouncil.name} receives each year to fund all its services.
            </p>
          </div>
        </div>

        {/* Revenue Stability Summary */}
        <div className="card-elevated p-6">
          <p className="type-overline mb-4">Income Stability</p>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-foreground" />
                <span className="text-sm">Stable</span>
              </div>
              <span className="font-semibold text-sm tabular-nums">{streams[0].percentage}%</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-stone-400" />
                <span className="text-sm">Variable</span>
              </div>
              <span className="font-semibold text-sm tabular-nums">{streams[1].percentage + streams[2].percentage}%</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-stone-300 dark:bg-stone-600" />
                <span className="text-sm">Uncertain</span>
              </div>
              <span className="font-semibold text-sm tabular-nums">{streams[3].percentage + streams[4].percentage}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Revenue Streams Bar Chart */}
      <div className="card-elevated p-6 sm:p-8">
        <div className="flex items-start justify-between mb-8">
          <div>
            <h2 className="text-lg sm:text-xl font-semibold mb-1">Where the money comes from</h2>
            <p className="text-sm text-muted-foreground">
              Breakdown of {selectedCouncil.name}&apos;s funding sources
            </p>
          </div>
          <Badge variant="outline" className="text-xs">2024-25</Badge>
        </div>

        {/* Revenue breakdown - Monzo/Apple style */}
        <div className="space-y-5">
          {streams.map((stream) => {
            const barWidth = (stream.percentage / maxPercentage) * 100;
            const isHighStability = stream.stability === 'High';

            return (
              <div key={stream.source}>
                {/* Header row: source name + amount (Monzo pattern) */}
                <div className="flex items-baseline justify-between mb-1">
                  <span className="type-body font-semibold">{stream.source}</span>
                  <span className="type-body font-semibold tabular-nums">
                    {formatBudget(stream.amount / 1000)}
                  </span>
                </div>
                {/* Description + percentage */}
                <div className="flex items-baseline justify-between mb-2">
                  <p className="type-caption text-muted-foreground">
                    {stream.description}
                  </p>
                  <span className="type-caption text-muted-foreground tabular-nums">
                    {stream.percentage}%
                  </span>
                </div>
                {/* Bar - visual reinforcement */}
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${isHighStability ? 'bg-foreground' : 'bg-muted-foreground/40'}`}
                    style={{ width: `${barWidth}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Total */}
        <div className="mt-8 pt-6 border-t border-border/50 flex items-center justify-between">
          <span className="font-semibold">Total estimated revenue</span>
          <span className="text-xl font-bold tabular-nums">
            {formatBudget(totalRevenue / 1000)}
          </span>
        </div>
      </div>

      {/* Revenue Stability Explainer */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card-elevated p-6">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle className="h-4 w-4 text-stone-400" />
            <h3 className="font-semibold text-sm">Stable Income</h3>
          </div>
          <p className="text-2xl font-bold mb-2 tabular-nums">
            {formatBudget(streams[0].amount / 1000)}
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            <span className="font-medium text-foreground">Council Tax</span> is reliable - it comes in regularly and increases a little each year.
          </p>
        </div>

        <div className="card-elevated p-6">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="h-4 w-4 text-stone-400" />
            <h3 className="font-semibold text-sm">Variable Income</h3>
          </div>
          <p className="text-2xl font-bold mb-2 tabular-nums">
            {formatBudget((streams[1].amount + streams[2].amount) / 1000)}
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            <span className="font-medium text-foreground">Fees and ringfenced grants</span> can change from year to year based on usage and government decisions.
          </p>
        </div>

        <div className="card-elevated p-6">
          <div className="flex items-center gap-2 mb-3">
            <TrendingDown className="h-4 w-4 text-stone-400" />
            <h3 className="font-semibold text-sm">Uncertain Income</h3>
          </div>
          <p className="text-2xl font-bold mb-2 tabular-nums">
            {formatBudget((streams[3].amount + streams[4].amount) / 1000)}
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            <span className="font-medium text-foreground">Flexible grants and business rates</span> can change significantly if the government cuts spending or shops close.
          </p>
        </div>
      </div>

      {/* Factors That Affect Council Tax */}
      <div className="card-elevated p-6 sm:p-8">
        <div className="flex items-center gap-3 mb-6">
          <Lightbulb className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-lg sm:text-xl font-semibold">Why council tax changes</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-4">
              Costs can go up when
            </h3>
            <ul className="space-y-3">
              {[
                'More people need council services',
                'Prices for fuel and supplies increase',
                'Staff wages rise',
                'More elderly residents need social care',
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-sm">
                  <CheckCircle className="h-4 w-4 mt-0.5 shrink-0 text-stone-400" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-foreground mb-4">
              Income can change when
            </h3>
            <ul className="space-y-3">
              {[
                'Government funding amounts change',
                'Business rates collected go up or down',
                'Fewer or more people use paid services',
                'New homes are built (more council tax payers)',
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-muted-foreground">
                  <span className="w-4 h-4 shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* How rates are set */}
        <div className="mt-8 p-6 rounded-xl bg-muted/50 border border-border/50">
          <div className="flex gap-4">
            <div className="shrink-0">
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                <Info className="h-5 w-5 text-muted-foreground" />
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-2">
                How council tax rates are set
              </h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Each year, councils work out how much money they need to run services.
                They look at what they expect to get from government and other sources.
                Council tax makes up the difference between what they need and what they get from other sources.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Note about estimates */}
      <div className="card-elevated p-6 bg-muted/30">
        <div className="flex items-start gap-3 text-muted-foreground">
          <Info className="h-5 w-5 shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-foreground mb-1">About these numbers</p>
            <p className="leading-relaxed">
              These are estimates based on typical funding patterns for {selectedCouncil.type_name}s.
              The actual numbers may differ. For exact figures, check {selectedCouncil.name}&apos;s published accounts.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RevenueBreakdown;
