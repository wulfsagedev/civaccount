'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { DollarSign, Building, Users, PiggyBank, TrendingDown } from "lucide-react";
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
      <div className="p-6 bg-muted/50 rounded-xl text-center">
        <p className="text-muted-foreground">Please select a council to view revenue information.</p>
      </div>
    );
  }

  if (!revenueData) {
    return (
      <div className="p-6 bg-muted/50 rounded-xl text-center">
        <p className="text-muted-foreground">Revenue data not available for {selectedCouncil.name}.</p>
      </div>
    );
  }

  const { totalRevenue, streams } = revenueData;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Revenue Overview */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Where Does the Money Come From?</CardTitle>
          <CardDescription>{selectedCouncil.name} gets about {formatBudget(totalRevenue / 1000)} each year</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {streams.map((stream, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <stream.icon className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium text-sm">{stream.source}</span>
                    <Badge
                      variant={stream.stability === 'High' ? 'default' : stream.stability === 'Medium' ? 'secondary' : 'destructive'}
                      className="text-xs"
                    >
                      {stream.stability}
                    </Badge>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-sm">{formatBudget(stream.amount / 1000)}</span>
                    <span className="text-xs text-muted-foreground ml-2">{stream.percentage}%</span>
                  </div>
                </div>
                <Progress value={stream.percentage} className="h-1.5" />
                <p className="text-xs text-muted-foreground">{stream.description}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Revenue Stability */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Income Stability</CardTitle>
          <CardDescription>Some money is more reliable than others</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 bg-primary/5 rounded-xl text-center">
              <div className="text-xl font-bold text-primary">{formatBudget(streams[0].amount / 1000)}</div>
              <div className="text-xs text-muted-foreground mt-1">Steady (Council Tax)</div>
            </div>
            <div className="p-3 bg-muted/50 rounded-xl text-center">
              <div className="text-xl font-bold">{formatBudget((streams[1].amount + streams[2].amount) / 1000)}</div>
              <div className="text-xs text-muted-foreground mt-1">Variable (Fees & Grants)</div>
            </div>
            <div className="p-3 bg-destructive/5 rounded-xl text-center">
              <div className="text-xl font-bold text-destructive">{formatBudget((streams[3].amount + streams[4].amount) / 1000)}</div>
              <div className="text-xs text-muted-foreground mt-1">Uncertain</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Note about estimates */}
      <div className="p-4 bg-muted/30 rounded-xl text-center">
        <p className="text-sm text-muted-foreground">
          These are estimates based on typical {selectedCouncil.type_name} patterns. For exact figures, check {selectedCouncil.name}&apos;s website.
        </p>
      </div>
    </div>
  );
};

export default RevenueBreakdown;
