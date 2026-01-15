'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, TrendingDown } from "lucide-react";
import { useCouncil } from '@/context/CouncilContext';
import { calculateBands, getAverageBandDByType } from '@/data/councils';

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
      <div className="p-6 bg-muted/50 rounded-xl text-center">
        <p className="text-muted-foreground">Please select a council to view council tax information.</p>
      </div>
    );
  }

  if (!councilTaxData) {
    return (
      <div className="p-6 bg-muted/50 rounded-xl text-center">
        <p className="text-muted-foreground">Council tax data not available for {selectedCouncil.name}.</p>
      </div>
    );
  }

  const calculateMonthlyPayment = (annualAmount: number) => (annualAmount / 10).toFixed(2);
  const calculateWeeklyPayment = (annualAmount: number) => (annualAmount / 52).toFixed(2);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Band Selector */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Pick Your Council Tax Band</CardTitle>
          <CardDescription>Check your council tax bill to find which band your home is in</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 lg:grid-cols-8 gap-2">
            {Object.entries(councilTaxData.bands).map(([band, data]) => (
              <Button
                key={band}
                variant={selectedBand === band ? "default" : "outline"}
                onClick={() => setSelectedBand(band)}
                className="h-auto py-2 px-1 flex flex-col items-center"
              >
                <span className="font-bold text-sm">Band {band}</span>
                <span className="text-xs">£{data.amount.toFixed(0)}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Selected Band Details */}
      <Card className="border-l-4 border-l-primary">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="text-lg">Band {selectedBand} - Your Council Tax</CardTitle>
            {yearChange && (
              <Badge variant={yearChange.change > 0 ? "destructive" : "default"} className="text-xs flex items-center gap-1">
                {yearChange.change > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {yearChange.change > 0 ? '+' : ''}{yearChange.percentChange.toFixed(1)}% vs last year
              </Badge>
            )}
          </div>
          <CardDescription>{councilTaxData.bands[selectedBand as keyof typeof councilTaxData.bands].description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Payment breakdown */}
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center p-3 bg-primary/5 rounded-xl">
              <div className="text-xl font-bold text-primary">
                £{councilTaxData.bands[selectedBand as keyof typeof councilTaxData.bands].amount.toFixed(2)}
              </div>
              <div className="text-xs text-muted-foreground mt-1">per year</div>
            </div>
            <div className="text-center p-3 bg-muted/50 rounded-xl">
              <div className="text-xl font-bold">
                £{calculateMonthlyPayment(councilTaxData.bands[selectedBand as keyof typeof councilTaxData.bands].amount)}
              </div>
              <div className="text-xs text-muted-foreground mt-1">per month</div>
            </div>
            <div className="text-center p-3 bg-muted/50 rounded-xl">
              <div className="text-xl font-bold">
                £{calculateWeeklyPayment(councilTaxData.bands[selectedBand as keyof typeof councilTaxData.bands].amount)}
              </div>
              <div className="text-xs text-muted-foreground mt-1">per week</div>
            </div>
          </div>

          {/* Comparison with type average */}
          {typeAverage && (
            <div className="p-4 bg-muted/30 rounded-xl">
              <p className="text-sm">
                <span className="text-muted-foreground">Average for {selectedCouncil.type_name}s: </span>
                <span className="font-medium">£{typeAverage.toFixed(2)}</span>
                <span className={`font-medium ml-2 ${councilTaxData.bandD > typeAverage ? 'text-destructive' : 'text-green-600'}`}>
                  ({councilTaxData.bandD > typeAverage ? '+' : ''}{((councilTaxData.bandD - typeAverage) / typeAverage * 100).toFixed(1)}%)
                </span>
              </p>
            </div>
          )}

          {/* Historical trend */}
          {(councilTaxData.bandD_2024 || councilTaxData.bandD_2023) && (
            <div className="p-4 bg-muted/30 rounded-xl">
              <h4 className="font-medium mb-2 text-sm">Band D History</h4>
              <div className="flex gap-4 text-sm">
                <span><strong>2025-26:</strong> £{councilTaxData.bandD.toFixed(2)}</span>
                {councilTaxData.bandD_2024 && <span className="text-muted-foreground">2024-25: £{councilTaxData.bandD_2024.toFixed(2)}</span>}
                {councilTaxData.bandD_2023 && <span className="text-muted-foreground">2023-24: £{councilTaxData.bandD_2023.toFixed(2)}</span>}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Band Multipliers */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">All Council Tax Bands</CardTitle>
          <CardDescription>How {selectedCouncil.name}&apos;s council tax varies by band</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Object.entries(councilTaxData.bands).map(([band, data]) => {
              const isSelected = band === selectedBand;
              return (
                <div key={band} className={`space-y-1.5 p-2 rounded-lg ${isSelected ? 'bg-primary/10' : ''}`}>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className={`font-medium text-sm ${isSelected ? 'text-primary' : ''}`}>Band {band}</span>
                      <span className="text-xs text-muted-foreground">{(data.rate * 100).toFixed(0)}% of D</span>
                    </div>
                    <span className={`font-medium text-sm ${isSelected ? 'text-primary' : ''}`}>£{data.amount.toFixed(2)}</span>
                  </div>
                  <Progress value={data.rate * 50} className="h-1.5" />
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Important Note */}
      <div className="p-4 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-800">
        <p className="text-sm">
          <strong>Important:</strong> {selectedCouncil.type === 'SD' || selectedCouncil.type === 'SC'
            ? `These figures show only the ${selectedCouncil.name} portion. Your total bill also includes county council, police, and fire charges.`
            : selectedCouncil.type === 'LB' || selectedCouncil.type === 'OLB' || selectedCouncil.type === 'ILB'
            ? `These figures show only the ${selectedCouncil.name} portion. Your total bill also includes the Greater London Authority (GLA) charge.`
            : `These figures show only the ${selectedCouncil.name} portion. Your total bill may also include police and fire charges.`
          }
        </p>
        <p className="text-xs text-muted-foreground mt-2">
          Bands are based on 1991 property values. You pay in 10 monthly instalments from April to January. Single occupants get 25% off.
        </p>
      </div>
    </div>
  );
};

export default CouncilTaxSection;
