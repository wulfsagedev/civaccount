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
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">Please select a council to view revenue information.</p>
        </CardContent>
      </Card>
    );
  }

  if (!revenueData) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-3 text-muted-foreground">
            <Info className="h-5 w-5" />
            <p>Revenue data not available for {selectedCouncil.name}.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { totalRevenue, streams } = revenueData;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Revenue Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" />
            <div>
              <CardTitle className="text-lg sm:text-xl">Where Does the Money Come From?</CardTitle>
              <CardDescription className="text-sm sm:text-base">
                {selectedCouncil.name} gets about {formatBudget(totalRevenue / 1000)} each year
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 sm:space-y-4">
            {streams.map((stream, index) => (
              <div key={index} className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center space-x-3 min-w-0">
                    <stream.icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <div className="min-w-0">
                      <span className="font-medium text-sm sm:text-base">{stream.source}</span>
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
                    <div className="font-bold text-sm sm:text-base">{formatBudget(stream.amount / 1000)}</div>
                    <div className="text-xs sm:text-sm text-muted-foreground">{stream.percentage}%</div>
                  </div>
                </div>

                <Progress value={stream.percentage} className="h-3" />

                <div className="text-xs sm:text-sm text-muted-foreground bg-muted p-3 rounded-md">
                  {stream.description}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Revenue Stability Analysis */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <TrendingDown className="h-5 w-5 text-primary" />
            <div>
              <CardTitle className="text-lg sm:text-xl">How Safe Is This Money?</CardTitle>
              <CardDescription className="text-sm sm:text-base">
                Some money is more reliable than other money
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <div className="p-3 sm:p-4 bg-primary/10 rounded-lg border border-primary/20">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="h-4 w-4 text-primary" />
                <h3 className="font-semibold text-primary text-sm sm:text-base">Steady Income</h3>
              </div>
              <div className="text-xl sm:text-2xl font-bold text-primary mb-2">
                {formatBudget(streams[0].amount / 1000)}
              </div>
              <div className="text-xs sm:text-sm text-primary/80">
                <strong>Council Tax:</strong> Comes in regularly and increases each year
              </div>
            </div>
            <div className="p-3 sm:p-4 bg-secondary/50 rounded-lg border">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-4 w-4 text-secondary-foreground" />
                <h3 className="font-semibold text-secondary-foreground text-sm sm:text-base">Variable Income</h3>
              </div>
              <div className="text-xl sm:text-2xl font-bold text-secondary-foreground mb-2">
                {formatBudget((streams[1].amount + streams[2].amount) / 1000)}
              </div>
              <div className="text-xs sm:text-sm text-secondary-foreground/80">
                <strong>Fees & Some Grants:</strong> Amounts can change from year to year
              </div>
            </div>
            <div className="p-3 sm:p-4 bg-destructive/10 rounded-lg border border-destructive/20">
              <div className="flex items-center gap-2 mb-2">
                <TrendingDown className="h-4 w-4 text-destructive" />
                <h3 className="font-semibold text-destructive text-sm sm:text-base">Uncertain Income</h3>
              </div>
              <div className="text-xl sm:text-2xl font-bold text-destructive mb-2">
                {formatBudget((streams[3].amount + streams[4].amount) / 1000)}
              </div>
              <div className="text-xs sm:text-sm text-destructive/80">
                <strong>Government Money & Business Rates:</strong> These amounts can change significantly
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* What This Means for You */}
      <Card className="border-l-4 border-l-primary">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg sm:text-xl">Factors That Affect Council Tax</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold mb-2 text-sm sm:text-base">Costs Can Go Up When</h4>
                <div className="space-y-1 text-xs sm:text-sm">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-3 w-3 mt-0.5 shrink-0 text-primary" />
                    <span>More people need council services</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-3 w-3 mt-0.5 shrink-0 text-primary" />
                    <span>Prices for things like fuel and supplies go up</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-3 w-3 mt-0.5 shrink-0 text-primary" />
                    <span>Staff wages increase</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-3 w-3 mt-0.5 shrink-0 text-primary" />
                    <span>More elderly residents need social care</span>
                  </div>
                </div>
              </div>
              <div>
                <h4 className="font-semibold mb-2 text-sm sm:text-base">Income Can Change When</h4>
                <div className="space-y-1 text-xs sm:text-sm">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-3 w-3 mt-0.5 shrink-0 text-muted-foreground" />
                    <span>Government funding amounts change</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-3 w-3 mt-0.5 shrink-0 text-muted-foreground" />
                    <span>Business rates collected go up or down</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-3 w-3 mt-0.5 shrink-0 text-muted-foreground" />
                    <span>Fewer or more people use paid services</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-3 w-3 mt-0.5 shrink-0 text-muted-foreground" />
                    <span>New homes are built (more council tax payers)</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-3 sm:p-4 bg-primary/10 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Info className="h-4 w-4 text-primary" />
                <h4 className="font-semibold text-primary text-sm sm:text-base">How Council Tax Rates Are Set</h4>
              </div>
              <p className="text-xs sm:text-sm text-primary/80">
                Each year, councils work out how much money they need to run services.
                They look at what they expect to get from government and other sources.
                Council tax makes up the difference between what they need and what they get from other sources.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Note about estimates */}
      <Card className="border-dashed">
        <CardContent className="p-4">
          <div className="flex items-start gap-3 text-muted-foreground">
            <Info className="h-5 w-5 shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium mb-1">About these numbers</p>
              <p>
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
