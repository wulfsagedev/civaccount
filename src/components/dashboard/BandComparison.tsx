'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Scale, MapPin, TrendingUp, Calculator, Clock, Info, CheckCircle, BarChart3, TrendingDown, ArrowUpDown } from "lucide-react";
import { useCouncil } from '@/context/CouncilContext';
import { councils, getCouncilsByType, getAverageBandDByType, COUNCIL_TYPE_NAMES, formatBudget } from '@/data/councils';

const BandComparison = () => {
  const { selectedCouncil } = useCouncil();
  const [selectedComparison, setSelectedComparison] = useState('councils');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Get similar councils (same type) for comparison
  const similarCouncils = useMemo(() => {
    if (!selectedCouncil) return [];

    return councils
      .filter(c =>
        c.type === selectedCouncil.type &&
        c.ons_code !== selectedCouncil.ons_code &&
        c.council_tax?.band_d_2025
      )
      .sort((a, b) => {
        const diff = (b.council_tax?.band_d_2025 || 0) - (a.council_tax?.band_d_2025 || 0);
        return sortOrder === 'desc' ? diff : -diff;
      })
      .slice(0, 10);
  }, [selectedCouncil, sortOrder]);

  // Get highest and lowest councils for comparison
  const extremeCouncils = useMemo(() => {
    if (!selectedCouncil) return { highest: [], lowest: [] };

    const sameType = councils.filter(c =>
      c.type === selectedCouncil.type &&
      c.council_tax?.band_d_2025
    );

    const sorted = [...sameType].sort((a, b) =>
      (b.council_tax?.band_d_2025 || 0) - (a.council_tax?.band_d_2025 || 0)
    );

    return {
      highest: sorted.slice(0, 5),
      lowest: sorted.slice(-5).reverse()
    };
  }, [selectedCouncil]);

  // Calculate averages
  const averages = useMemo(() => {
    if (!selectedCouncil?.council_tax) return null;

    const typeAvg = getAverageBandDByType(selectedCouncil.type);
    const allCouncilsWithTax = councils.filter(c => c.council_tax?.band_d_2025);
    const nationalAvg = allCouncilsWithTax.reduce((sum, c) =>
      sum + (c.council_tax?.band_d_2025 || 0), 0
    ) / allCouncilsWithTax.length;

    return {
      typeAverage: typeAvg,
      nationalAverage: nationalAvg,
      differenceFromType: selectedCouncil.council_tax.band_d_2025 - typeAvg,
      differenceFromNational: selectedCouncil.council_tax.band_d_2025 - nationalAvg,
    };
  }, [selectedCouncil]);

  // Historical data for current council
  const historicalData = useMemo(() => {
    if (!selectedCouncil?.council_tax) return [];

    const data: { year: string; bandD: number }[] = [];
    const ct = selectedCouncil.council_tax;

    if (ct.band_d_2023) {
      data.push({ year: '2023-24', bandD: ct.band_d_2023 });
    }
    if (ct.band_d_2024) {
      data.push({ year: '2024-25', bandD: ct.band_d_2024 });
    }
    data.push({ year: '2025-26', bandD: ct.band_d_2025 });

    // Calculate increases
    return data.map((item, index) => {
      if (index === 0) return { ...item, increase: null };
      const prev = data[index - 1].bandD;
      return {
        ...item,
        increase: ((item.bandD - prev) / prev) * 100
      };
    });
  }, [selectedCouncil]);

  if (!selectedCouncil) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">Please select a council to view comparisons.</p>
        </CardContent>
      </Card>
    );
  }

  if (!selectedCouncil.council_tax) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-3 text-muted-foreground">
            <Info className="h-5 w-5" />
            <p>Council tax comparison data not available for {selectedCouncil.name}.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Comparison Type Selector */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Scale className="h-5 w-5 text-primary" />
            <div>
              <CardTitle className="text-lg sm:text-xl">Compare {selectedCouncil.name}</CardTitle>
              <CardDescription className="text-sm sm:text-base">
                See how this council compares with others
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
            <Button
              variant={selectedComparison === 'councils' ? "default" : "outline"}
              onClick={() => setSelectedComparison('councils')}
              className="h-auto p-3 flex flex-col gap-1"
            >
              <MapPin className="h-4 w-4" />
              <span className="font-semibold text-sm">Similar Councils</span>
              <span className="text-xs text-muted-foreground">Same council type</span>
            </Button>
            <Button
              variant={selectedComparison === 'ranking' ? "default" : "outline"}
              onClick={() => setSelectedComparison('ranking')}
              className="h-auto p-3 flex flex-col gap-1"
            >
              <BarChart3 className="h-4 w-4" />
              <span className="font-semibold text-sm">Rankings</span>
              <span className="text-xs text-muted-foreground">Highest & lowest</span>
            </Button>
            <Button
              variant={selectedComparison === 'averages' ? "default" : "outline"}
              onClick={() => setSelectedComparison('averages')}
              className="h-auto p-3 flex flex-col gap-1"
            >
              <Calculator className="h-4 w-4" />
              <span className="font-semibold text-sm">Averages</span>
              <span className="text-xs text-muted-foreground">Type & national</span>
            </Button>
            <Button
              variant={selectedComparison === 'historical' ? "default" : "outline"}
              onClick={() => setSelectedComparison('historical')}
              className="h-auto p-3 flex flex-col gap-1"
            >
              <Clock className="h-4 w-4" />
              <span className="font-semibold text-sm">Over Time</span>
              <span className="text-xs text-muted-foreground">Year-on-year</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Council Comparison */}
      {selectedComparison === 'councils' && (
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                <div>
                  <CardTitle className="text-lg sm:text-xl">Similar {COUNCIL_TYPE_NAMES[selectedCouncil.type]}s</CardTitle>
                  <CardDescription className="text-sm sm:text-base">
                    Band D council tax rates for councils of the same type
                  </CardDescription>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
                className="flex items-center gap-1"
              >
                <ArrowUpDown className="h-4 w-4" />
                {sortOrder === 'desc' ? 'Highest first' : 'Lowest first'}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 sm:space-y-4">
              {/* Current council highlighted */}
              <div className="p-3 sm:p-4 border-2 border-primary rounded-lg bg-primary/5">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <CheckCircle className="h-4 w-4 shrink-0 text-primary" />
                      <h3 className="font-semibold text-sm sm:text-base">{selectedCouncil.name}</h3>
                      <Badge variant="default" className="text-xs">Selected</Badge>
                    </div>
                    <p className="text-xs sm:text-sm text-muted-foreground">{selectedCouncil.type_name}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-lg sm:text-2xl font-bold text-primary">
                      £{selectedCouncil.council_tax.band_d_2025.toFixed(2)}
                    </div>
                    <div className="text-xs sm:text-sm text-muted-foreground">Band D annual</div>
                  </div>
                </div>
              </div>

              {/* Similar councils */}
              {similarCouncils.map((council, index) => {
                const diff = council.council_tax!.band_d_2025 - selectedCouncil.council_tax!.band_d_2025;
                const isHigher = diff > 0;
                return (
                  <div key={council.ons_code} className="p-3 sm:p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs text-muted-foreground w-6">{index + 1}.</span>
                          <h3 className="font-medium text-sm sm:text-base truncate">{council.name}</h3>
                        </div>
                        <div className="flex items-center gap-2 ml-6">
                          <Badge variant={isHigher ? "destructive" : "default"} className="text-xs flex items-center gap-1">
                            {isHigher ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                            {isHigher ? '+' : ''}£{diff.toFixed(2)}
                          </Badge>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-lg sm:text-xl font-bold">
                          £{council.council_tax!.band_d_2025.toFixed(2)}
                        </div>
                        <div className="text-xs sm:text-sm text-muted-foreground">Band D</div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {similarCouncils.length === 0 && (
                <p className="text-center text-muted-foreground py-4">
                  No other {COUNCIL_TYPE_NAMES[selectedCouncil.type]}s found for comparison.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Rankings */}
      {selectedComparison === 'ranking' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-destructive" />
                <div>
                  <CardTitle className="text-lg sm:text-xl">Highest Council Tax</CardTitle>
                  <CardDescription className="text-sm">Top 5 {COUNCIL_TYPE_NAMES[selectedCouncil.type]}s</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {extremeCouncils.highest.map((council, index) => {
                  const isSelected = council.ons_code === selectedCouncil.ons_code;
                  return (
                    <div
                      key={council.ons_code}
                      className={`flex items-center justify-between p-3 rounded-lg ${isSelected ? 'bg-primary/10 border border-primary' : 'border'}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                          {index + 1}
                        </div>
                        <div>
                          <p className={`font-medium text-sm ${isSelected ? 'text-primary' : ''}`}>{council.name}</p>
                          {isSelected && <Badge variant="secondary" className="text-xs mt-1">Your council</Badge>}
                        </div>
                      </div>
                      <span className={`font-bold ${isSelected ? 'text-primary' : ''}`}>
                        £{council.council_tax?.band_d_2025.toFixed(2)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <TrendingDown className="h-5 w-5 text-green-600" />
                <div>
                  <CardTitle className="text-lg sm:text-xl">Lowest Council Tax</CardTitle>
                  <CardDescription className="text-sm">Bottom 5 {COUNCIL_TYPE_NAMES[selectedCouncil.type]}s</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {extremeCouncils.lowest.map((council, index) => {
                  const isSelected = council.ons_code === selectedCouncil.ons_code;
                  return (
                    <div
                      key={council.ons_code}
                      className={`flex items-center justify-between p-3 rounded-lg ${isSelected ? 'bg-primary/10 border border-primary' : 'border'}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                          {index + 1}
                        </div>
                        <div>
                          <p className={`font-medium text-sm ${isSelected ? 'text-primary' : ''}`}>{council.name}</p>
                          {isSelected && <Badge variant="secondary" className="text-xs mt-1">Your council</Badge>}
                        </div>
                      </div>
                      <span className={`font-bold ${isSelected ? 'text-primary' : ''}`}>
                        £{council.council_tax?.band_d_2025.toFixed(2)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Averages Comparison */}
      {selectedComparison === 'averages' && averages && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Calculator className="h-5 w-5 text-primary" />
              <div>
                <CardTitle className="text-lg sm:text-xl">How {selectedCouncil.name} Compares</CardTitle>
                <CardDescription className="text-sm sm:text-base">
                  Comparison with average rates
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <div className="text-center p-4 bg-primary/5 rounded-lg border-2 border-primary">
                <p className="text-sm text-muted-foreground mb-1">{selectedCouncil.name}</p>
                <p className="text-2xl font-bold text-primary">£{selectedCouncil.council_tax.band_d_2025.toFixed(2)}</p>
                <p className="text-xs text-muted-foreground mt-1">Band D 2025-26</p>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg border">
                <p className="text-sm text-muted-foreground mb-1">{COUNCIL_TYPE_NAMES[selectedCouncil.type]} Average</p>
                <p className="text-2xl font-bold">£{averages.typeAverage.toFixed(2)}</p>
                <p className={`text-xs mt-1 ${averages.differenceFromType > 0 ? 'text-destructive' : 'text-green-600'}`}>
                  {averages.differenceFromType > 0 ? '+' : ''}£{averages.differenceFromType.toFixed(2)} difference
                </p>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg border">
                <p className="text-sm text-muted-foreground mb-1">All Councils Average</p>
                <p className="text-2xl font-bold">£{averages.nationalAverage.toFixed(2)}</p>
                <p className={`text-xs mt-1 ${averages.differenceFromNational > 0 ? 'text-destructive' : 'text-green-600'}`}>
                  {averages.differenceFromNational > 0 ? '+' : ''}£{averages.differenceFromNational.toFixed(2)} difference
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <Info className="h-4 w-4" />
                  What this means
                </h4>
                <p className="text-sm text-muted-foreground">
                  {averages.differenceFromType > 0
                    ? `${selectedCouncil.name}'s council tax is £${averages.differenceFromType.toFixed(2)} higher than the average for ${COUNCIL_TYPE_NAMES[selectedCouncil.type]}s.`
                    : averages.differenceFromType < 0
                      ? `${selectedCouncil.name}'s council tax is £${Math.abs(averages.differenceFromType).toFixed(2)} lower than the average for ${COUNCIL_TYPE_NAMES[selectedCouncil.type]}s.`
                      : `${selectedCouncil.name}'s council tax is about the same as the average for ${COUNCIL_TYPE_NAMES[selectedCouncil.type]}s.`
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Historical Comparison */}
      {selectedComparison === 'historical' && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              <div>
                <CardTitle className="text-lg sm:text-xl">Council Tax History</CardTitle>
                <CardDescription className="text-sm sm:text-base">
                  How {selectedCouncil.name}&apos;s Band D rate has changed
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {historicalData.length > 1 ? (
              <div className="space-y-4">
                {historicalData.map((item, index) => (
                  <div key={item.year} className={`p-4 border rounded-lg ${index === historicalData.length - 1 ? 'border-primary bg-primary/5' : ''}`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold">{item.year}</h3>
                        {index === historicalData.length - 1 && (
                          <Badge variant="default" className="text-xs mt-1">Current</Badge>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-bold">£{item.bandD.toFixed(2)}</div>
                        {item.increase !== null && (
                          <Badge
                            variant={item.increase > 5 ? 'destructive' : item.increase > 3 ? 'secondary' : 'default'}
                            className="text-xs"
                          >
                            {item.increase > 0 ? '+' : ''}{item.increase.toFixed(1)}%
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {historicalData.length >= 2 && (
                  <div className="p-4 bg-muted rounded-lg">
                    <h4 className="font-semibold mb-2">Total Change</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">From {historicalData[0].year}</p>
                        <p className="text-lg font-bold">
                          +£{(historicalData[historicalData.length - 1].bandD - historicalData[0].bandD).toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Percentage increase</p>
                        <p className="text-lg font-bold">
                          +{(((historicalData[historicalData.length - 1].bandD - historicalData[0].bandD) / historicalData[0].bandD) * 100).toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Info className="h-8 w-8 mx-auto mb-2" />
                <p>Historical data not available for this council.</p>
                <p className="text-sm mt-1">Only the current year rate is available.</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default BandComparison;
