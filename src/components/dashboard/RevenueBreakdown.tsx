'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { DollarSign, Building, Users, PiggyBank, TrendingDown, Info, AlertTriangle, CheckCircle, Lightbulb } from "lucide-react";
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
          icon: DollarSign,
          description: "Money that you and your neighbours pay to the council",
          stability: "High",
          volatility: "Steady - goes up a little each year"
        },
        {
          source: "Government Money (For Specific Things)",
          amount: netCurrent * govGrantsRingfencedPercent,
          percentage: Math.round(govGrantsRingfencedPercent * 100),
          icon: Building,
          description: "Money the government gives that must be spent on certain things",
          stability: "Medium",
          volatility: "Depends on what the government decides"
        },
        {
          source: "Fees for Services",
          amount: netCurrent * serviceIncomePercent,
          percentage: Math.round(serviceIncomePercent * 100),
          icon: Users,
          description: "Money people pay when they use council services (like parking)",
          stability: "Medium",
          volatility: "Changes based on how many people use services"
        },
        {
          source: "Government Money (Flexible)",
          amount: netCurrent * govGrantsUnringfencedPercent,
          percentage: Math.round(govGrantsUnringfencedPercent * 100),
          icon: PiggyBank,
          description: "Money the government gives that can be spent on anything",
          stability: "Low",
          volatility: "Can change a lot if the government cuts spending"
        },
        {
          source: "Business Rates",
          amount: netCurrent * businessRatesPercent,
          percentage: Math.round(businessRatesPercent * 100),
          icon: TrendingDown,
          description: "Taxes paid by shops and businesses in the area",
          stability: "Low",
          volatility: "Goes down when shops close"
        }
      ]
    };
  }, [selectedCouncil]);

  if (!selectedCouncil) {
    return (
      <Card className="border border-border/40 bg-card shadow-sm">
        <CardContent className="p-5 sm:p-6 text-center">
          <p className="text-muted-foreground text-sm sm:text-base">Please select a council to view revenue information.</p>
        </CardContent>
      </Card>
    );
  }

  if (!revenueData) {
    return (
      <Card className="border border-border/40 bg-card shadow-sm">
        <CardContent className="p-5 sm:p-6">
          <div className="flex items-center gap-3 text-muted-foreground">
            <Info className="h-5 w-5" />
            <p className="text-sm sm:text-base">Revenue data not available for {selectedCouncil.name}.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { totalRevenue, streams } = revenueData;

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Revenue Overview */}
      <Card className="border border-border/40 bg-card shadow-sm">
        <CardHeader className="p-5 sm:p-6 pb-4">
          <div className="flex items-center gap-3">
            <DollarSign className="h-5 w-5 text-primary opacity-70" />
            <div>
              <CardTitle className="text-lg sm:text-xl font-semibold">Where Does the Money Come From?</CardTitle>
              <CardDescription className="text-sm sm:text-base leading-relaxed">
                {selectedCouncil.name} gets about {formatBudget(totalRevenue / 1000)} each year
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-4 pb-4 sm:px-6 sm:pb-6">
          <div className="space-y-4 sm:space-y-5">
            {streams.map((stream, index) => (
              <div key={index} className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center space-x-2.5 min-w-0">
                    <stream.icon className="h-4 w-4 shrink-0 text-muted-foreground opacity-70" />
                    <div className="min-w-0">
                      <span className="font-medium text-xs sm:text-base">{stream.source}</span>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge
                          variant={
                            stream.stability === 'High' ? 'default' :
                            stream.stability === 'Medium' ? 'secondary' : 'destructive'
                          }
                          className="text-xs"
                        >
                          {stream.stability} Stability
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-bold text-xs sm:text-base">{formatBudget(stream.amount / 1000)}</div>
                    <div className="text-xs sm:text-sm text-muted-foreground">{stream.percentage}%</div>
                  </div>
                </div>

                <Progress value={stream.percentage} className="h-2 sm:h-3" />

                <div className="text-xs sm:text-sm text-muted-foreground bg-muted/30 p-2.5 sm:p-3 rounded-xl leading-relaxed">
                  {stream.description}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Revenue Stability Analysis */}
      <Card className="border border-border/40 bg-card shadow-sm">
        <CardHeader className="p-5 sm:p-6 pb-4">
          <div className="flex items-center gap-3">
            <TrendingDown className="h-5 w-5 text-primary opacity-70" />
            <div>
              <CardTitle className="text-lg sm:text-xl font-semibold">How Safe Is This Money?</CardTitle>
              <CardDescription className="text-sm sm:text-base leading-relaxed">
                Some money is more reliable than other money
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-4 pb-4 sm:px-6 sm:pb-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <div className="p-4 sm:p-5 bg-primary/5 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="h-4 w-4 text-primary" />
                <h3 className="font-semibold text-primary text-xs sm:text-base">Steady Income</h3>
              </div>
              <div className="text-lg sm:text-2xl font-bold text-primary mb-2">
                {formatBudget(streams[0].amount / 1000)}
              </div>
              <div className="text-xs sm:text-sm text-primary/80 leading-relaxed">
                <strong>Council Tax:</strong> Comes in regularly and increases each year
              </div>
            </div>
            <div className="p-4 sm:p-5 bg-muted/50 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                <h3 className="font-semibold text-xs sm:text-base">Variable Income</h3>
              </div>
              <div className="text-lg sm:text-2xl font-bold mb-2">
                {formatBudget((streams[1].amount + streams[2].amount) / 1000)}
              </div>
              <div className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                <strong>Fees & Some Grants:</strong> Amounts can change from year to year
              </div>
            </div>
            <div className="p-4 sm:p-5 bg-destructive/5 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <TrendingDown className="h-4 w-4 text-destructive" />
                <h3 className="font-semibold text-destructive text-xs sm:text-base">Uncertain Income</h3>
              </div>
              <div className="text-lg sm:text-2xl font-bold text-destructive mb-2">
                {formatBudget((streams[3].amount + streams[4].amount) / 1000)}
              </div>
              <div className="text-xs sm:text-sm text-destructive/80 leading-relaxed">
                <strong>Government Money & Business Rates:</strong> These amounts can change significantly
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* What This Means for You */}
      <Card className="border border-border/40 border-l-4 border-l-primary bg-muted/30 shadow-sm">
        <CardHeader className="p-5 sm:p-6 pb-4">
          <div className="flex items-center gap-3">
            <Lightbulb className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg sm:text-xl font-semibold">Factors That Affect Council Tax</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="px-4 pb-4 sm:px-6 sm:pb-6">
          <div className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <h4 className="font-semibold mb-3 text-sm sm:text-base">Costs Can Go Up When</h4>
                <div className="space-y-2 text-xs sm:text-sm">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-3.5 w-3.5 mt-0.5 shrink-0 text-primary" />
                    <span className="leading-relaxed">More people need council services</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-3.5 w-3.5 mt-0.5 shrink-0 text-primary" />
                    <span className="leading-relaxed">Prices for things like fuel and supplies go up</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-3.5 w-3.5 mt-0.5 shrink-0 text-primary" />
                    <span className="leading-relaxed">Staff wages increase</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-3.5 w-3.5 mt-0.5 shrink-0 text-primary" />
                    <span className="leading-relaxed">More elderly residents need social care</span>
                  </div>
                </div>
              </div>
              <div>
                <h4 className="font-semibold mb-3 text-sm sm:text-base">Income Can Change When</h4>
                <div className="space-y-2 text-xs sm:text-sm">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0 text-muted-foreground" />
                    <span className="leading-relaxed">Government funding amounts change</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0 text-muted-foreground" />
                    <span className="leading-relaxed">Business rates collected go up or down</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0 text-muted-foreground" />
                    <span className="leading-relaxed">Fewer or more people use paid services</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0 text-muted-foreground" />
                    <span className="leading-relaxed">New homes are built (more council tax payers)</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 sm:p-4 bg-background/60 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <Info className="h-4 w-4 text-primary opacity-70" />
                <h4 className="font-semibold text-primary text-sm sm:text-base">How Council Tax Rates Are Set</h4>
              </div>
              <p className="text-xs sm:text-sm text-primary/80 leading-relaxed">
                Each year, councils work out how much money they need to run services.
                They look at what they expect to get from government and other sources.
                Council tax makes up the difference between what they need and what they get from other sources.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Note about estimates */}
      <Card className="border border-border/40 bg-muted/30 shadow-sm">
        <CardContent className="p-4 sm:p-5">
          <div className="flex items-start gap-3 text-muted-foreground">
            <Info className="h-5 w-5 shrink-0 mt-0.5 opacity-70" />
            <div className="text-xs sm:text-sm">
              <p className="font-medium mb-1">About these numbers</p>
              <p className="leading-relaxed">
                These are estimates based on what most {selectedCouncil.type_name}s look like.
                The real numbers might be a bit different. For exact figures, check {selectedCouncil.name}&apos;s website.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RevenueBreakdown;
