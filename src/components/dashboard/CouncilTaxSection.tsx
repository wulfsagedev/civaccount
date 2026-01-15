'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Home, Calculator, CreditCard, Calendar, CheckCircle, AlertTriangle, Lightbulb, Info, TrendingUp, TrendingDown } from "lucide-react";
import { useCouncil } from '@/context/CouncilContext';
import { calculateBands, councils, getAverageBandDByType } from '@/data/councils';

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
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">Please select a council to view council tax information.</p>
        </CardContent>
      </Card>
    );
  }

  if (!councilTaxData) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-3 text-muted-foreground">
            <Info className="h-5 w-5" />
            <p>Council tax data not available for {selectedCouncil.name}.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const calculateMonthlyPayment = (annualAmount: number) => (annualAmount / 10).toFixed(2);
  const calculateWeeklyPayment = (annualAmount: number) => (annualAmount / 52).toFixed(2);

  return (
    <div className="space-y-5 sm:space-y-8">
      {/* Band Selector */}
      <Card className="border-0 bg-card/50 shadow-sm">
        <CardHeader className="p-4 sm:p-6 pb-4">
          <div className="flex items-center gap-2.5">
            <Home className="h-5 w-5 text-primary opacity-70" />
            <div>
              <CardTitle className="text-lg sm:text-xl font-semibold">Pick Your Council Tax Band</CardTitle>
              <CardDescription className="text-sm sm:text-base leading-relaxed">
                Check your council tax bill to find which band your home is in
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-4 pb-4 sm:px-6 sm:pb-6">
          <div className="grid grid-cols-4 lg:grid-cols-8 gap-2 sm:gap-3">
            {Object.entries(councilTaxData.bands).map(([band, data]) => (
              <Button
                key={band}
                variant={selectedBand === band ? "default" : "outline"}
                onClick={() => setSelectedBand(band)}
                className={`h-auto p-2.5 sm:p-3.5 flex flex-col items-center rounded-xl ${selectedBand !== band ? 'border-muted-foreground/20 hover:border-muted-foreground/40' : ''}`}
              >
                <div className="font-bold text-xs sm:text-base">Band {band}</div>
                <div className="text-[10px] sm:text-xs text-center mt-0.5 leading-tight opacity-80">
                  £{data.amount.toFixed(0)}
                </div>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Selected Band Details */}
      <Card className="border-0 border-l-4 border-l-primary bg-primary/5 shadow-sm">
        <CardHeader className="p-4 sm:p-6 pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <Calculator className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg sm:text-xl font-semibold">Band {selectedBand} - Your Council Tax</CardTitle>
            </div>
            {yearChange && (
              <Badge variant={yearChange.change > 0 ? "destructive" : "default"} className="text-[10px] sm:text-xs w-fit flex items-center gap-1">
                {yearChange.change > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {yearChange.change > 0 ? '+' : ''}{yearChange.percentChange.toFixed(1)}% vs last year
              </Badge>
            )}
          </div>
          <CardDescription className="text-sm sm:text-base leading-relaxed">
            {councilTaxData.bands[selectedBand as keyof typeof councilTaxData.bands].description}
          </CardDescription>
        </CardHeader>
        <CardContent className="px-4 pb-4 sm:px-6 sm:pb-6">
          <div className="grid grid-cols-3 gap-2.5 sm:gap-4 mb-5 sm:mb-6">
            <div className="text-center p-3 sm:p-5 bg-background/80 rounded-xl">
              <CreditCard className="h-5 w-5 sm:h-6 sm:w-6 mx-auto mb-2 text-primary opacity-70" />
              <div className="text-lg sm:text-2xl font-bold text-primary">
                £{councilTaxData.bands[selectedBand as keyof typeof councilTaxData.bands].amount.toFixed(2)}
              </div>
              <div className="text-[10px] sm:text-sm text-primary/80 mt-1">Annual Charge</div>
            </div>
            <div className="text-center p-3 sm:p-5 bg-background/60 rounded-xl">
              <Calendar className="h-5 w-5 sm:h-6 sm:w-6 mx-auto mb-2 text-muted-foreground opacity-70" />
              <div className="text-lg sm:text-2xl font-bold">
                £{calculateMonthlyPayment(councilTaxData.bands[selectedBand as keyof typeof councilTaxData.bands].amount)}
              </div>
              <div className="text-[10px] sm:text-sm text-muted-foreground mt-1">Monthly Payment</div>
            </div>
            <div className="text-center p-3 sm:p-5 bg-background/60 rounded-xl">
              <Calendar className="h-5 w-5 sm:h-6 sm:w-6 mx-auto mb-2 text-muted-foreground opacity-70" />
              <div className="text-lg sm:text-2xl font-bold">
                £{calculateWeeklyPayment(councilTaxData.bands[selectedBand as keyof typeof councilTaxData.bands].amount)}
              </div>
              <div className="text-[10px] sm:text-sm text-muted-foreground mt-1">Weekly Cost</div>
            </div>
          </div>

          {/* Comparison with type average */}
          {typeAverage && (
            <div className="p-3.5 sm:p-4 bg-background/60 rounded-xl mb-4">
              <h4 className="font-semibold mb-2.5 text-sm sm:text-base flex items-center gap-2">
                <Info className="h-4 w-4 opacity-70" />
                How This Compares:
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm">
                <div>
                  <span className="text-muted-foreground">Average for {selectedCouncil.type_name}s:</span>
                  <span className="font-medium ml-2">£{typeAverage.toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Difference:</span>
                  <span className={`font-medium ml-2 ${councilTaxData.bandD > typeAverage ? 'text-destructive' : 'text-green-600'}`}>
                    {councilTaxData.bandD > typeAverage ? '+' : ''}£{(councilTaxData.bandD - typeAverage).toFixed(2)}
                    ({councilTaxData.bandD > typeAverage ? '+' : ''}{((councilTaxData.bandD - typeAverage) / typeAverage * 100).toFixed(1)}%)
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Historical trend */}
          {(councilTaxData.bandD_2024 || councilTaxData.bandD_2023) && (
            <div className="p-3.5 sm:p-4 bg-background/60 rounded-xl">
              <h4 className="font-semibold mb-3 text-sm sm:text-base flex items-center gap-2">
                <TrendingUp className="h-4 w-4 opacity-70" />
                Historical Band D Rates:
              </h4>
              <div className="space-y-2.5">
                <div className="flex justify-between items-center text-sm">
                  <span>2025-26</span>
                  <span className="font-bold">£{councilTaxData.bandD.toFixed(2)}</span>
                </div>
                {councilTaxData.bandD_2024 && (
                  <div className="flex justify-between items-center text-sm text-muted-foreground">
                    <span>2024-25</span>
                    <span>£{councilTaxData.bandD_2024.toFixed(2)}</span>
                  </div>
                )}
                {councilTaxData.bandD_2023 && (
                  <div className="flex justify-between items-center text-sm text-muted-foreground">
                    <span>2023-24</span>
                    <span>£{councilTaxData.bandD_2023.toFixed(2)}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Band Multipliers */}
      <Card className="border-0 bg-card/50 shadow-sm">
        <CardHeader className="p-4 sm:p-6 pb-4">
          <div className="flex items-center gap-2.5">
            <Calculator className="h-5 w-5 text-primary opacity-70" />
            <div>
              <CardTitle className="text-lg sm:text-xl font-semibold">Council Tax by Band</CardTitle>
              <CardDescription className="text-sm sm:text-base leading-relaxed">
                How {selectedCouncil.name}&apos;s council tax varies by band
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-4 pb-4 sm:px-6 sm:pb-6">
          <div className="space-y-3 sm:space-y-4">
            {Object.entries(councilTaxData.bands).map(([band, data]) => {
              const isSelected = band === selectedBand;
              const percentOfD = (data.rate * 100).toFixed(0);
              return (
                <div key={band} className={`space-y-2.5 p-2.5 sm:p-3 rounded-xl transition-colors ${isSelected ? 'bg-primary/10' : 'hover:bg-muted/50'}`}>
                  <div className="flex justify-between items-center gap-2">
                    <div className="flex items-center space-x-2.5 min-w-0">
                      <span className={`font-medium text-sm sm:text-base ${isSelected ? 'text-primary' : ''}`}>Band {band}</span>
                      <Badge variant="outline" className="text-[10px] sm:text-xs shrink-0 border-muted-foreground/30">{percentOfD}% of Band D</Badge>
                    </div>
                    <div className="text-right shrink-0">
                      <div className={`font-medium text-sm sm:text-base ${isSelected ? 'text-primary' : ''}`}>£{data.amount.toFixed(2)}</div>
                      <div className="text-[10px] sm:text-xs text-muted-foreground">per year</div>
                    </div>
                  </div>
                  <Progress value={data.rate * 50} className="h-1.5 sm:h-2" />
                  <div className="text-xs sm:text-sm text-muted-foreground leading-relaxed">{data.description}</div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Understanding Council Tax */}
      <Card className="border-0 border-l-4 border-l-amber-500 bg-amber-50/50 dark:bg-amber-950/20 shadow-sm">
        <CardHeader className="p-4 sm:p-6 pb-4">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-500" />
            <CardTitle className="text-lg sm:text-xl font-semibold">How Council Tax Bands Work</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="px-4 pb-4 sm:px-6 sm:pb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6">
            <div>
              <h4 className="font-semibold mb-3 text-sm sm:text-base">What is a band?</h4>
              <div className="space-y-2.5">
                <div className="flex items-start gap-2.5 text-xs sm:text-sm">
                  <CheckCircle className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
                  <span className="leading-relaxed">Your band depends on what your home was worth in 1991</span>
                </div>
                <div className="flex items-start gap-2.5 text-xs sm:text-sm">
                  <CheckCircle className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
                  <span className="leading-relaxed">The government decides which band your home is in</span>
                </div>
                <div className="flex items-start gap-2.5 text-xs sm:text-sm">
                  <CheckCircle className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
                  <span className="leading-relaxed">Band D is the middle band that everyone uses to compare</span>
                </div>
                <div className="flex items-start gap-2.5 text-xs sm:text-sm">
                  <CheckCircle className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
                  <span className="leading-relaxed">Bigger houses pay more, smaller homes pay less</span>
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-3 text-sm sm:text-base">How to pay</h4>
              <div className="space-y-2.5">
                <div className="flex items-start gap-2.5 text-xs sm:text-sm">
                  <CheckCircle className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
                  <span className="leading-relaxed">You pay in 10 chunks from April to January</span>
                </div>
                <div className="flex items-start gap-2.5 text-xs sm:text-sm">
                  <CheckCircle className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
                  <span className="leading-relaxed">You can set up automatic payments</span>
                </div>
                <div className="flex items-start gap-2.5 text-xs sm:text-sm">
                  <CheckCircle className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
                  <span className="leading-relaxed">Some councils give a discount if you pay it all at once</span>
                </div>
                <div className="flex items-start gap-2.5 text-xs sm:text-sm">
                  <CheckCircle className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
                  <span className="leading-relaxed">You might pay less if you live alone (25% off!)</span>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-5 p-3.5 sm:p-4 bg-amber-100/80 dark:bg-amber-900/30 rounded-xl text-xs sm:text-sm flex items-start gap-2.5">
            <Lightbulb className="h-4 w-4 mt-0.5 shrink-0 text-amber-600 dark:text-amber-500" />
            <div className="leading-relaxed">
              <span className="font-medium">Important:</span> {selectedCouncil.type === 'SD' || selectedCouncil.type === 'SC'
                ? `These figures show only the ${selectedCouncil.name} portion of your council tax. Your total bill will also include charges from your county council, police, and fire service.`
                : selectedCouncil.type === 'LB' || selectedCouncil.type === 'OLB' || selectedCouncil.type === 'ILB'
                ? `These figures show only the ${selectedCouncil.name} portion of your council tax. Your total bill will also include the Greater London Authority (GLA) charge.`
                : `These figures show only the ${selectedCouncil.name} portion of your council tax. Your total bill may also include police and fire charges.`
              }
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CouncilTaxSection;
