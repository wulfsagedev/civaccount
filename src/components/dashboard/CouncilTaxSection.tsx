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
    <div className="space-y-4 sm:space-y-6">
      {/* Band Selector */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Home className="h-5 w-5 text-primary" />
            <div>
              <CardTitle className="text-lg sm:text-xl">Pick Your Council Tax Band</CardTitle>
              <CardDescription className="text-sm sm:text-base">
                Check your council tax letter to find which band your home is in
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 sm:gap-3">
            {Object.entries(councilTaxData.bands).map(([band, data]) => (
              <Button
                key={band}
                variant={selectedBand === band ? "default" : "outline"}
                onClick={() => setSelectedBand(band)}
                className="h-auto p-2 sm:p-3 flex flex-col items-center"
              >
                <div className="font-bold text-sm sm:text-lg">Band {band}</div>
                <div className="text-xs text-center mt-1 leading-tight">
                  £{data.amount.toFixed(0)}
                </div>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Selected Band Details */}
      <Card className="border-l-4 border-l-primary">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="flex items-center gap-2">
              <Calculator className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg sm:text-xl">Band {selectedBand} - Your Council Tax</CardTitle>
            </div>
            {yearChange && (
              <Badge variant={yearChange.change > 0 ? "destructive" : "default"} className="text-xs w-fit flex items-center gap-1">
                {yearChange.change > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {yearChange.change > 0 ? '+' : ''}{yearChange.percentChange.toFixed(1)}% vs last year
              </Badge>
            )}
          </div>
          <CardDescription className="text-sm sm:text-base">
            {councilTaxData.bands[selectedBand as keyof typeof councilTaxData.bands].description}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6">
            <div className="text-center p-3 sm:p-4 bg-primary/5 rounded-lg border">
              <CreditCard className="h-6 w-6 mx-auto mb-2 text-primary" />
              <div className="text-xl sm:text-2xl font-bold text-primary">
                £{councilTaxData.bands[selectedBand as keyof typeof councilTaxData.bands].amount.toFixed(2)}
              </div>
              <div className="text-xs sm:text-sm text-primary">Annual Charge</div>
            </div>
            <div className="text-center p-3 sm:p-4 bg-secondary/50 rounded-lg border">
              <Calendar className="h-6 w-6 mx-auto mb-2 text-secondary-foreground" />
              <div className="text-xl sm:text-2xl font-bold text-secondary-foreground">
                £{calculateMonthlyPayment(councilTaxData.bands[selectedBand as keyof typeof councilTaxData.bands].amount)}
              </div>
              <div className="text-xs sm:text-sm text-secondary-foreground">Monthly Payment</div>
            </div>
            <div className="text-center p-3 sm:p-4 bg-muted rounded-lg border">
              <Calendar className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
              <div className="text-xl sm:text-2xl font-bold text-muted-foreground">
                £{calculateWeeklyPayment(councilTaxData.bands[selectedBand as keyof typeof councilTaxData.bands].amount)}
              </div>
              <div className="text-xs sm:text-sm text-muted-foreground">Weekly Cost</div>
            </div>
          </div>

          {/* Comparison with type average */}
          {typeAverage && (
            <div className="p-3 sm:p-4 bg-muted rounded-lg mb-4">
              <h4 className="font-semibold mb-2 text-sm sm:text-base flex items-center gap-2">
                <Info className="h-4 w-4" />
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
            <div className="p-3 sm:p-4 bg-muted rounded-lg">
              <h4 className="font-semibold mb-3 text-sm sm:text-base flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Historical Band D Rates:
              </h4>
              <div className="space-y-2">
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
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-primary" />
            <div>
              <CardTitle className="text-lg sm:text-xl">Council Tax by Band</CardTitle>
              <CardDescription className="text-sm sm:text-base">
                How {selectedCouncil.name}&apos;s council tax varies by band
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 sm:space-y-4">
            {Object.entries(councilTaxData.bands).map(([band, data]) => {
              const isSelected = band === selectedBand;
              const percentOfD = (data.rate * 100).toFixed(0);
              return (
                <div key={band} className={`space-y-2 p-2 rounded-lg ${isSelected ? 'bg-primary/10 border border-primary/20' : ''}`}>
                  <div className="flex justify-between items-center gap-2">
                    <div className="flex items-center space-x-2 min-w-0">
                      <span className={`font-medium text-sm sm:text-base ${isSelected ? 'text-primary' : ''}`}>Band {band}</span>
                      <Badge variant="outline" className="text-xs shrink-0">{percentOfD}% of Band D</Badge>
                    </div>
                    <div className="text-right shrink-0">
                      <div className={`font-medium text-sm sm:text-base ${isSelected ? 'text-primary' : ''}`}>£{data.amount.toFixed(2)}</div>
                      <div className="text-xs text-muted-foreground">per year</div>
                    </div>
                  </div>
                  <Progress value={data.rate * 50} className="h-2" />
                  <div className="text-xs sm:text-sm text-muted-foreground">{data.description}</div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Understanding Council Tax */}
      <Card className="border-l-4 border-l-destructive">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <CardTitle className="text-lg sm:text-xl">How Council Tax Bands Work</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <div>
              <h4 className="font-semibold mb-3 text-sm sm:text-base">What is a band?</h4>
              <div className="space-y-2">
                <div className="flex items-start gap-2 text-xs sm:text-sm">
                  <CheckCircle className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
                  <span>Your band depends on what your home was worth in 1991</span>
                </div>
                <div className="flex items-start gap-2 text-xs sm:text-sm">
                  <CheckCircle className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
                  <span>The government decides which band your home is in</span>
                </div>
                <div className="flex items-start gap-2 text-xs sm:text-sm">
                  <CheckCircle className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
                  <span>Band D is the middle band that everyone uses to compare</span>
                </div>
                <div className="flex items-start gap-2 text-xs sm:text-sm">
                  <CheckCircle className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
                  <span>Bigger houses pay more, smaller homes pay less</span>
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-3 text-sm sm:text-base">How to pay</h4>
              <div className="space-y-2">
                <div className="flex items-start gap-2 text-xs sm:text-sm">
                  <CheckCircle className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
                  <span>You pay in 10 chunks from April to January</span>
                </div>
                <div className="flex items-start gap-2 text-xs sm:text-sm">
                  <CheckCircle className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
                  <span>You can set up automatic payments</span>
                </div>
                <div className="flex items-start gap-2 text-xs sm:text-sm">
                  <CheckCircle className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
                  <span>Some councils give a discount if you pay it all at once</span>
                </div>
                <div className="flex items-start gap-2 text-xs sm:text-sm">
                  <CheckCircle className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
                  <span>You might pay less if you live alone (25% off!)</span>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-4 p-3 bg-destructive/10 rounded text-xs sm:text-sm flex items-start gap-2">
            <Lightbulb className="h-4 w-4 mt-0.5 shrink-0 text-destructive" />
            <div>
              <span className="font-medium">Good to know:</span> {selectedCouncil.type === 'SD' || selectedCouncil.type === 'SC'
                ? `This is just what you pay to ${selectedCouncil.name}. Your total bill might include money for other councils too.`
                : `This is the full council tax you pay to ${selectedCouncil.name}.`
              }
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CouncilTaxSection;
