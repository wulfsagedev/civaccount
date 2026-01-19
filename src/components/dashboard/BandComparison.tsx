'use client';

import { useState, useMemo } from 'react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Scale, MapPin, TrendingUp, Calculator, Clock, Info, CheckCircle, BarChart3, TrendingDown, ArrowUpDown } from "lucide-react";
import { useCouncil } from '@/context/CouncilContext';
import { councils, getAverageBandDByType, COUNCIL_TYPE_NAMES, formatCurrency } from '@/data/councils';

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
      <div className="card-elevated p-6 sm:p-8 text-center">
        <p className="text-muted-foreground">Please select a council to view comparisons.</p>
      </div>
    );
  }

  if (!selectedCouncil.council_tax) {
    return (
      <div className="card-elevated p-6 sm:p-8">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Info className="h-5 w-5" />
          <p>Council tax comparison data not available for {selectedCouncil.name}.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Comparison Type Selector */}
      <div className="card-elevated p-6 sm:p-8">
        <div className="flex items-center gap-3 mb-6">
          <Scale className="h-5 w-5 text-muted-foreground" />
          <div>
            <h2 className="text-lg sm:text-xl font-semibold">Compare {selectedCouncil.name}</h2>
            <p className="text-sm text-muted-foreground">
              See how this council compares with others
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
          <button
            onClick={() => setSelectedComparison('councils')}
            className={`p-4 rounded-xl text-left transition-all cursor-pointer border ${
              selectedComparison === 'councils'
                ? 'bg-muted border-border shadow-sm'
                : 'border-transparent hover:bg-muted/50'
            }`}
          >
            <MapPin className={`h-4 w-4 mb-2 ${selectedComparison === 'councils' ? 'text-foreground' : 'text-muted-foreground'}`} />
            <div className={`font-semibold text-sm ${selectedComparison === 'councils' ? 'text-foreground' : ''}`}>Similar Councils</div>
            <div className="text-xs text-muted-foreground mt-0.5">Same council type</div>
          </button>
          <button
            onClick={() => setSelectedComparison('ranking')}
            className={`p-4 rounded-xl text-left transition-all cursor-pointer border ${
              selectedComparison === 'ranking'
                ? 'bg-muted border-border shadow-sm'
                : 'border-transparent hover:bg-muted/50'
            }`}
          >
            <BarChart3 className={`h-4 w-4 mb-2 ${selectedComparison === 'ranking' ? 'text-foreground' : 'text-muted-foreground'}`} />
            <div className={`font-semibold text-sm ${selectedComparison === 'ranking' ? 'text-foreground' : ''}`}>Rankings</div>
            <div className="text-xs text-muted-foreground mt-0.5">Highest & lowest</div>
          </button>
          <button
            onClick={() => setSelectedComparison('averages')}
            className={`p-4 rounded-xl text-left transition-all cursor-pointer border ${
              selectedComparison === 'averages'
                ? 'bg-muted border-border shadow-sm'
                : 'border-transparent hover:bg-muted/50'
            }`}
          >
            <Calculator className={`h-4 w-4 mb-2 ${selectedComparison === 'averages' ? 'text-foreground' : 'text-muted-foreground'}`} />
            <div className={`font-semibold text-sm ${selectedComparison === 'averages' ? 'text-foreground' : ''}`}>Averages</div>
            <div className="text-xs text-muted-foreground mt-0.5">Type & national</div>
          </button>
          <button
            onClick={() => setSelectedComparison('historical')}
            className={`p-4 rounded-xl text-left transition-all cursor-pointer border ${
              selectedComparison === 'historical'
                ? 'bg-muted border-border shadow-sm'
                : 'border-transparent hover:bg-muted/50'
            }`}
          >
            <Clock className={`h-4 w-4 mb-2 ${selectedComparison === 'historical' ? 'text-foreground' : 'text-muted-foreground'}`} />
            <div className={`font-semibold text-sm ${selectedComparison === 'historical' ? 'text-foreground' : ''}`}>Over Time</div>
            <div className="text-xs text-muted-foreground mt-0.5">Year-on-year</div>
          </button>
        </div>
      </div>

      {/* Council Comparison */}
      {selectedComparison === 'councils' && (
        <div className="card-elevated p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <MapPin className="h-5 w-5 text-muted-foreground" />
              <div>
                <h2 className="text-lg sm:text-xl font-semibold">Similar {COUNCIL_TYPE_NAMES[selectedCouncil.type]}s</h2>
                <p className="text-sm text-muted-foreground">
                  Band D council tax rates for councils of the same type
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
              className="flex items-center gap-1 cursor-pointer"
            >
              <ArrowUpDown className="h-4 w-4" />
              {sortOrder === 'desc' ? 'Highest first' : 'Lowest first'}
            </Button>
          </div>

          <div className="space-y-3">
            {/* Current council highlighted */}
            <div className="p-4 border-2 border-foreground/20 rounded-xl bg-muted/30">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircle className="h-4 w-4 shrink-0 text-stone-400" />
                    <h3 className="font-semibold text-sm sm:text-base">{selectedCouncil.name}</h3>
                    <Badge variant="outline" className="text-xs bg-navy-50 text-navy-600 border-navy-200 dark:bg-navy-950/30 dark:text-navy-400 dark:border-navy-800">Selected</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{selectedCouncil.type_name}</p>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-lg sm:text-2xl font-bold tabular-nums">
                    {formatCurrency(selectedCouncil.council_tax.band_d_2025, { decimals: 2 })}
                  </div>
                  <div className="text-sm text-muted-foreground">Band D annual</div>
                </div>
              </div>
            </div>

            {/* Similar councils */}
            {similarCouncils.map((council, index) => {
              const diff = council.council_tax!.band_d_2025 - selectedCouncil.council_tax!.band_d_2025;
              const isHigher = diff > 0;
              return (
                <div key={council.ons_code} className="p-4 border border-border/50 rounded-xl hover:bg-muted/30 transition-colors">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm text-muted-foreground w-6 tabular-nums">{index + 1}.</span>
                        <h3 className="font-medium text-sm sm:text-base truncate">{council.name}</h3>
                      </div>
                      <div className="flex items-center gap-2 ml-6">
                        <Badge variant="outline" className="text-xs flex items-center gap-1">
                          {isHigher ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                          {isHigher ? '+' : ''}{formatCurrency(diff, { decimals: 2 })}
                        </Badge>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-lg sm:text-xl font-bold tabular-nums">
                        {formatCurrency(council.council_tax!.band_d_2025, { decimals: 2 })}
                      </div>
                      <div className="text-sm text-muted-foreground">Band D</div>
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
        </div>
      )}

      {/* Rankings */}
      {selectedComparison === 'ranking' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card-elevated p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-6">
              <TrendingUp className="h-5 w-5 text-muted-foreground" />
              <div>
                <h2 className="text-lg sm:text-xl font-semibold">Highest council tax</h2>
                <p className="text-sm text-muted-foreground">Top 5 {COUNCIL_TYPE_NAMES[selectedCouncil.type]}s</p>
              </div>
            </div>

            <div className="space-y-3">
              {extremeCouncils.highest.map((council, index) => {
                const isSelected = council.ons_code === selectedCouncil.ons_code;
                return (
                  <div
                    key={council.ons_code}
                    className={`flex items-center justify-between p-4 rounded-xl ${isSelected ? 'bg-muted/50 border border-border' : 'border border-border/50'}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold tabular-nums ${isSelected ? 'bg-foreground text-background' : 'bg-muted'}`}>
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{council.name}</p>
                        {isSelected && <Badge variant="outline" className="text-xs mt-1 bg-navy-50 text-navy-600 border-navy-200 dark:bg-navy-950/30 dark:text-navy-400 dark:border-navy-800">Your council</Badge>}
                      </div>
                    </div>
                    <span className="font-bold tabular-nums">
                      {formatCurrency(council.council_tax?.band_d_2025 || 0, { decimals: 2 })}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="card-elevated p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-6">
              <TrendingDown className="h-5 w-5 text-muted-foreground" />
              <div>
                <h2 className="text-lg sm:text-xl font-semibold">Lowest council tax</h2>
                <p className="text-sm text-muted-foreground">Bottom 5 {COUNCIL_TYPE_NAMES[selectedCouncil.type]}s</p>
              </div>
            </div>

            <div className="space-y-3">
              {extremeCouncils.lowest.map((council, index) => {
                const isSelected = council.ons_code === selectedCouncil.ons_code;
                return (
                  <div
                    key={council.ons_code}
                    className={`flex items-center justify-between p-4 rounded-xl ${isSelected ? 'bg-muted/50 border border-border' : 'border border-border/50'}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold tabular-nums ${isSelected ? 'bg-foreground text-background' : 'bg-muted'}`}>
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{council.name}</p>
                        {isSelected && <Badge variant="outline" className="text-xs mt-1 bg-navy-50 text-navy-600 border-navy-200 dark:bg-navy-950/30 dark:text-navy-400 dark:border-navy-800">Your council</Badge>}
                      </div>
                    </div>
                    <span className="font-bold tabular-nums">
                      {formatCurrency(council.council_tax?.band_d_2025 || 0, { decimals: 2 })}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Averages Comparison */}
      {selectedComparison === 'averages' && averages && (
        <div className="card-elevated p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-6">
            <Calculator className="h-5 w-5 text-muted-foreground" />
            <div>
              <h2 className="text-lg sm:text-xl font-semibold">How {selectedCouncil.name} compares</h2>
              <p className="text-sm text-muted-foreground">
                Comparison with average rates
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="text-center p-5 bg-muted/50 rounded-xl border border-border">
              <p className="text-sm text-muted-foreground mb-1">{selectedCouncil.name}</p>
              <p className="text-2xl font-bold tabular-nums">{formatCurrency(selectedCouncil.council_tax.band_d_2025, { decimals: 2 })}</p>
              <p className="text-sm text-muted-foreground mt-1">Band D 2025-26</p>
            </div>
            <div className="text-center p-5 bg-muted/30 rounded-xl border border-border/50">
              <p className="text-sm text-muted-foreground mb-1">{COUNCIL_TYPE_NAMES[selectedCouncil.type]} Average</p>
              <p className="text-2xl font-bold tabular-nums">{formatCurrency(averages.typeAverage, { decimals: 2 })}</p>
              <p className="text-sm text-muted-foreground mt-1">
                {averages.differenceFromType > 0 ? '+' : ''}{formatCurrency(averages.differenceFromType, { decimals: 2 })} difference
              </p>
            </div>
            <div className="text-center p-5 bg-muted/30 rounded-xl border border-border/50">
              <p className="text-sm text-muted-foreground mb-1">All Councils Average</p>
              <p className="text-2xl font-bold tabular-nums">{formatCurrency(averages.nationalAverage, { decimals: 2 })}</p>
              <p className="text-sm text-muted-foreground mt-1">
                {averages.differenceFromNational > 0 ? '+' : ''}{formatCurrency(averages.differenceFromNational, { decimals: 2 })} difference
              </p>
            </div>
          </div>

          <div className="p-5 bg-muted/30 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <Info className="h-4 w-4 text-muted-foreground" />
              <h4 className="font-semibold text-sm">What this means</h4>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {averages.differenceFromType > 0
                ? `${selectedCouncil.name}'s council tax is ${formatCurrency(averages.differenceFromType, { decimals: 2 })} higher than the average for ${COUNCIL_TYPE_NAMES[selectedCouncil.type]}s.`
                : averages.differenceFromType < 0
                  ? `${selectedCouncil.name}'s council tax is ${formatCurrency(Math.abs(averages.differenceFromType), { decimals: 2 })} lower than the average for ${COUNCIL_TYPE_NAMES[selectedCouncil.type]}s.`
                  : `${selectedCouncil.name}'s council tax is about the same as the average for ${COUNCIL_TYPE_NAMES[selectedCouncil.type]}s.`
              }
            </p>
          </div>
        </div>
      )}

      {/* Historical Comparison */}
      {selectedComparison === 'historical' && (
        <div className="card-elevated p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-6">
            <Clock className="h-5 w-5 text-muted-foreground" />
            <div>
              <h2 className="text-lg sm:text-xl font-semibold">Council tax history</h2>
              <p className="text-sm text-muted-foreground">
                How {selectedCouncil.name}&apos;s Band D rate has changed
              </p>
            </div>
          </div>

          {historicalData.length > 1 ? (
            <div className="space-y-6">
              {/* Line Graph */}
              {(() => {
                const values = historicalData.map(d => d.bandD);
                const minValue = Math.min(...values);
                const maxValue = Math.max(...values);
                const padding = (maxValue - minValue) * 0.15 || 10;
                const chartMin = minValue - padding;
                const chartMax = maxValue + padding;
                const chartHeight = 160;
                const chartWidth = 100; // percentage

                // Calculate points for the line
                const points = historicalData.map((item, index) => {
                  const x = historicalData.length === 1 ? 50 : (index / (historicalData.length - 1)) * 100;
                  const y = chartHeight - ((item.bandD - chartMin) / (chartMax - chartMin)) * chartHeight;
                  return { x, y, ...item };
                });

                // Create SVG path
                const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

                // Create area path (for gradient fill)
                const areaPath = `${linePath} L ${points[points.length - 1].x} ${chartHeight} L ${points[0].x} ${chartHeight} Z`;

                return (
                  <div className="relative">
                    <svg
                      viewBox={`0 0 100 ${chartHeight}`}
                      preserveAspectRatio="none"
                      className="w-full h-40"
                    >
                      {/* Gradient definition */}
                      <defs>
                        <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" className="[stop-color:hsl(var(--foreground))] [stop-opacity:0.1]" />
                          <stop offset="100%" className="[stop-color:hsl(var(--foreground))] [stop-opacity:0]" />
                        </linearGradient>
                      </defs>

                      {/* Area fill */}
                      <path
                        d={areaPath}
                        fill="url(#areaGradient)"
                      />

                      {/* Line */}
                      <path
                        d={linePath}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-foreground"
                        vectorEffect="non-scaling-stroke"
                      />

                      {/* Data points */}
                      {points.map((point, index) => (
                        <circle
                          key={point.year}
                          cx={point.x}
                          cy={point.y}
                          r="4"
                          className={index === points.length - 1 ? 'fill-foreground' : 'fill-background stroke-foreground'}
                          strokeWidth="2"
                          vectorEffect="non-scaling-stroke"
                        />
                      ))}
                    </svg>

                    {/* X-axis labels */}
                    <div className="flex justify-between mt-3">
                      {historicalData.map((item, index) => (
                        <div key={item.year} className="text-center">
                          <p className="text-sm font-medium">{item.year}</p>
                          <p className="text-lg font-bold tabular-nums">{formatCurrency(item.bandD, { decimals: 2 })}</p>
                          {item.increase !== null && (
                            <p className="text-xs text-muted-foreground tabular-nums">
                              {item.increase > 0 ? '+' : ''}{item.increase.toFixed(1)}%
                            </p>
                          )}
                          {index === historicalData.length - 1 && (
                            <Badge variant="outline" className="text-xs mt-1 bg-navy-50 text-navy-600 border-navy-200">Current</Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* Summary */}
              {historicalData.length >= 2 && (
                <div className="p-5 bg-muted/30 rounded-xl">
                  <h4 className="font-semibold mb-3">Total change</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">From {historicalData[0].year}</p>
                      <p className="text-lg font-bold tabular-nums">
                        +{formatCurrency(historicalData[historicalData.length - 1].bandD - historicalData[0].bandD, { decimals: 2 })}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Percentage increase</p>
                      <p className="text-lg font-bold tabular-nums">
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
        </div>
      )}
    </div>
  );
};

export default BandComparison;
