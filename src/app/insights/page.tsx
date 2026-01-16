'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  TrendingUp,
  TrendingDown,
  PoundSterling,
  Building,
  MapPin,
  Users,
  AlertTriangle,
  CheckCircle,
  Info,
  ArrowUpDown,
  Scale,
  Landmark,
  BarChart3
} from 'lucide-react';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { councils, COUNCIL_TYPE_NAMES, formatCurrency } from '@/data/councils';

export default function InsightsPage() {
  // Calculate all statistics
  const stats = useMemo(() => {
    const councilsWithTax = councils.filter(c => c.council_tax?.band_d_2025);
    const councilsWithBudget = councils.filter(c => c.budget?.total_service);

    // Basic counts
    const totalCouncils = councils.length;

    // Band D statistics
    const bandDValues = councilsWithTax.map(c => c.council_tax!.band_d_2025);
    const avgBandD = bandDValues.reduce((a, b) => a + b, 0) / bandDValues.length;
    const minBandD = Math.min(...bandDValues);
    const maxBandD = Math.max(...bandDValues);
    const medianBandD = [...bandDValues].sort((a, b) => a - b)[Math.floor(bandDValues.length / 2)];

    // Find highest and lowest councils
    const sortedByTax = [...councilsWithTax].sort((a, b) =>
      (b.council_tax?.band_d_2025 || 0) - (a.council_tax?.band_d_2025 || 0)
    );
    const highest5 = sortedByTax.slice(0, 5);
    const lowest5 = sortedByTax.slice(-5).reverse();

    // Year-over-year changes
    const councilsWithHistory = councilsWithTax.filter(c => c.council_tax?.band_d_2024);
    const yoyChanges = councilsWithHistory.map(c => ({
      council: c,
      change: c.council_tax!.band_d_2025 - c.council_tax!.band_d_2024!,
      percentChange: ((c.council_tax!.band_d_2025 - c.council_tax!.band_d_2024!) / c.council_tax!.band_d_2024!) * 100
    }));

    const avgYoyChange = yoyChanges.reduce((sum, c) => sum + c.percentChange, 0) / yoyChanges.length;
    const biggestIncreases = [...yoyChanges].sort((a, b) => b.percentChange - a.percentChange).slice(0, 5);
    const smallestIncreases = [...yoyChanges].sort((a, b) => a.percentChange - b.percentChange).slice(0, 5);

    // Statistics by council type
    const typeStats: Record<string, { count: number; avgBandD: number; minBandD: number; maxBandD: number }> = {};
    Object.keys(COUNCIL_TYPE_NAMES).forEach(type => {
      const typeCouncils = councilsWithTax.filter(c => c.type === type);
      if (typeCouncils.length > 0) {
        const values = typeCouncils.map(c => c.council_tax!.band_d_2025);
        typeStats[type] = {
          count: typeCouncils.length,
          avgBandD: values.reduce((a, b) => a + b, 0) / values.length,
          minBandD: Math.min(...values),
          maxBandD: Math.max(...values)
        };
      }
    });

    // Budget statistics
    const totalBudget = councilsWithBudget.reduce((sum, c) => sum + (c.budget?.total_service || 0), 0) * 1000;

    // Service spending aggregates
    const serviceSpending = {
      adult_social_care: 0,
      childrens_social_care: 0,
      education: 0,
      transport: 0,
      public_health: 0,
      housing: 0,
      cultural: 0,
      environmental: 0,
      planning: 0,
      central_services: 0
    };

    councilsWithBudget.forEach(c => {
      if (c.budget) {
        serviceSpending.adult_social_care += c.budget.adult_social_care || 0;
        serviceSpending.childrens_social_care += c.budget.childrens_social_care || 0;
        serviceSpending.education += c.budget.education || 0;
        serviceSpending.transport += c.budget.transport || 0;
        serviceSpending.public_health += c.budget.public_health || 0;
        serviceSpending.housing += c.budget.housing || 0;
        serviceSpending.cultural += c.budget.cultural || 0;
        serviceSpending.environmental += c.budget.environmental || 0;
        serviceSpending.planning += c.budget.planning || 0;
        serviceSpending.central_services += c.budget.central_services || 0;
      }
    });

    // Convert to array and sort
    const serviceSpendingArray = Object.entries(serviceSpending)
      .map(([key, value]) => ({ key, value: value * 1000 }))
      .filter(s => s.value > 0)
      .sort((a, b) => b.value - a.value);

    const totalServiceSpending = serviceSpendingArray.reduce((sum, s) => sum + s.value, 0);

    // Price bands distribution
    const priceBands = [
      { label: 'Under £200', min: 0, max: 200, count: 0 },
      { label: '£200 - £400', min: 200, max: 400, count: 0 },
      { label: '£400 - £600', min: 400, max: 600, count: 0 },
      { label: '£600 - £1,000', min: 600, max: 1000, count: 0 },
      { label: '£1,000 - £1,500', min: 1000, max: 1500, count: 0 },
      { label: '£1,500 - £2,000', min: 1500, max: 2000, count: 0 },
      { label: 'Over £2,000', min: 2000, max: Infinity, count: 0 },
    ];

    bandDValues.forEach(value => {
      const band = priceBands.find(b => value >= b.min && value < b.max);
      if (band) band.count++;
    });

    return {
      totalCouncils,
      councilsWithTax: councilsWithTax.length,
      councilsWithBudget: councilsWithBudget.length,
      avgBandD,
      minBandD,
      maxBandD,
      medianBandD,
      highest5,
      lowest5,
      avgYoyChange,
      biggestIncreases,
      smallestIncreases,
      typeStats,
      totalBudget,
      serviceSpendingArray,
      totalServiceSpending,
      priceBands
    };
  }, []);

  const SERVICE_NAMES: Record<string, string> = {
    adult_social_care: 'Adult Social Care',
    childrens_social_care: "Children's Services",
    education: 'Education',
    transport: 'Roads & Transport',
    public_health: 'Public Health',
    housing: 'Housing',
    cultural: 'Culture & Leisure',
    environmental: 'Environment',
    planning: 'Planning',
    central_services: 'Central Services'
  };

  const formatBillions = (amount: number) => {
    if (amount >= 1000000000) {
      return `£${(amount / 1000000000).toFixed(1)} billion`;
    }
    if (amount >= 1000000) {
      return `£${(amount / 1000000).toFixed(0)} million`;
    }
    return `£${amount.toLocaleString('en-GB')}`;
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1">
        <div className="container mx-auto px-4 py-8 sm:px-6 sm:py-12 max-w-7xl">
          {/* Page Header */}
          <div className="text-center mb-10 sm:mb-12">
            <Badge variant="secondary" className="mb-4">2025-26 Data</Badge>
            <h1 className="text-3xl sm:text-4xl font-bold mb-4">Council Tax in England</h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              A complete picture of how council tax works across {stats.totalCouncils} local authorities
            </p>
          </div>

          {/* Key Statistics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
            <Card className="border border-border/40 bg-card shadow-sm rounded-xl">
              <CardContent className="p-5 sm:p-6">
                <div className="flex items-center justify-between mb-3">
                  <PoundSterling className="h-5 w-5 text-primary opacity-70" />
                  <Badge variant="outline" className="text-xs">Average</Badge>
                </div>
                <p className="text-2xl sm:text-3xl font-bold">{formatCurrency(stats.avgBandD, { decimals: 0 })}</p>
                <p className="text-sm text-muted-foreground mt-1">Band D average</p>
              </CardContent>
            </Card>

            <Card className="border border-border/40 bg-card shadow-sm rounded-xl">
              <CardContent className="p-5 sm:p-6">
                <div className="flex items-center justify-between mb-3">
                  <ArrowUpDown className="h-5 w-5 text-primary opacity-70" />
                  <Badge variant="outline" className="text-xs">Range</Badge>
                </div>
                <p className="text-2xl sm:text-3xl font-bold">{formatCurrency(stats.maxBandD - stats.minBandD, { decimals: 0 })}</p>
                <p className="text-sm text-muted-foreground mt-1">Gap between highest & lowest</p>
              </CardContent>
            </Card>

            <Card className="border border-border/40 bg-card shadow-sm rounded-xl">
              <CardContent className="p-5 sm:p-6">
                <div className="flex items-center justify-between mb-3">
                  <TrendingUp className="h-5 w-5 text-destructive opacity-70" />
                  <Badge variant="destructive" className="text-xs">Rising</Badge>
                </div>
                <p className="text-2xl sm:text-3xl font-bold">+{stats.avgYoyChange.toFixed(1)}%</p>
                <p className="text-sm text-muted-foreground mt-1">Average increase this year</p>
              </CardContent>
            </Card>

            <Card className="border border-border/40 bg-card shadow-sm rounded-xl">
              <CardContent className="p-5 sm:p-6">
                <div className="flex items-center justify-between mb-3">
                  <Landmark className="h-5 w-5 text-primary opacity-70" />
                  <Badge variant="outline" className="text-xs">Total</Badge>
                </div>
                <p className="text-2xl sm:text-3xl font-bold">{formatBillions(stats.totalBudget)}</p>
                <p className="text-sm text-muted-foreground mt-1">Combined council spending</p>
              </CardContent>
            </Card>
          </div>

          {/* Main Insight Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 mb-8">
            {/* Highest and Lowest */}
            <Card className="border border-border/40 bg-card shadow-sm rounded-xl">
              <CardHeader className="p-5 sm:p-6 pb-4">
                <div className="flex items-center gap-3">
                  <Scale className="h-5 w-5 text-primary opacity-70" />
                  <div>
                    <CardTitle className="text-lg sm:text-xl font-semibold">The Extremes</CardTitle>
                    <CardDescription>Highest and lowest Band D rates</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="px-5 pb-5 sm:px-6 sm:pb-6">
                <div className="space-y-6">
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <TrendingUp className="h-4 w-4 text-destructive" />
                      <span className="font-medium text-sm">Highest Council Tax</span>
                    </div>
                    <div className="space-y-2">
                      {stats.highest5.map((council, i) => (
                        <div key={council.ons_code} className="flex items-center justify-between p-2 rounded-lg bg-destructive/5">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground w-4">{i + 1}.</span>
                            <span className="text-sm font-medium">{council.name}</span>
                            <Badge variant="outline" className="text-xs">{council.type_name}</Badge>
                          </div>
                          <span className="font-bold text-destructive">{formatCurrency(council.council_tax!.band_d_2025, { decimals: 0 })}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <TrendingDown className="h-4 w-4 text-green-600" />
                      <span className="font-medium text-sm">Lowest Council Tax</span>
                    </div>
                    <div className="space-y-2">
                      {stats.lowest5.map((council, i) => (
                        <div key={council.ons_code} className="flex items-center justify-between p-2 rounded-lg bg-green-500/5">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground w-4">{i + 1}.</span>
                            <span className="text-sm font-medium">{council.name}</span>
                            <Badge variant="outline" className="text-xs">{council.type_name}</Badge>
                          </div>
                          <span className="font-bold text-green-600">{formatCurrency(council.council_tax!.band_d_2025, { decimals: 0 })}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Year-over-Year Changes */}
            <Card className="border border-border/40 bg-card shadow-sm rounded-xl">
              <CardHeader className="p-5 sm:p-6 pb-4">
                <div className="flex items-center gap-3">
                  <TrendingUp className="h-5 w-5 text-primary opacity-70" />
                  <div>
                    <CardTitle className="text-lg sm:text-xl font-semibold">This Year&apos;s Changes</CardTitle>
                    <CardDescription>Biggest increases and smallest rises</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="px-5 pb-5 sm:px-6 sm:pb-6">
                <div className="space-y-6">
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <AlertTriangle className="h-4 w-4 text-destructive" />
                      <span className="font-medium text-sm">Biggest Increases</span>
                    </div>
                    <div className="space-y-2">
                      {stats.biggestIncreases.map((item, i) => (
                        <div key={item.council.ons_code} className="flex items-center justify-between p-2 rounded-lg bg-destructive/5">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground w-4">{i + 1}.</span>
                            <span className="text-sm font-medium">{item.council.name}</span>
                          </div>
                          <Badge variant="destructive" className="text-xs">+{item.percentChange.toFixed(1)}%</Badge>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="font-medium text-sm">Smallest Increases</span>
                    </div>
                    <div className="space-y-2">
                      {stats.smallestIncreases.map((item, i) => (
                        <div key={item.council.ons_code} className="flex items-center justify-between p-2 rounded-lg bg-green-500/5">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground w-4">{i + 1}.</span>
                            <span className="text-sm font-medium">{item.council.name}</span>
                          </div>
                          <Badge variant="default" className="text-xs bg-green-600">+{item.percentChange.toFixed(1)}%</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Distribution by Price Band */}
          <Card className="border border-border/40 bg-card shadow-sm rounded-xl mb-8">
            <CardHeader className="p-5 sm:p-6 pb-4">
              <div className="flex items-center gap-3">
                <BarChart3 className="h-5 w-5 text-primary opacity-70" />
                <div>
                  <CardTitle className="text-lg sm:text-xl font-semibold">How Council Tax Rates Are Spread</CardTitle>
                  <CardDescription>Distribution of Band D rates across all councils</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="px-5 pb-5 sm:px-6 sm:pb-6">
              <div className="space-y-4">
                {stats.priceBands.map((band) => {
                  const percentage = (band.count / stats.councilsWithTax) * 100;
                  return (
                    <div key={band.label} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">{band.label}</span>
                        <span className="text-muted-foreground">{band.count} councils ({percentage.toFixed(0)}%)</span>
                      </div>
                      <Progress value={percentage} className="h-3" />
                    </div>
                  );
                })}
              </div>
              <div className="mt-6 p-4 bg-muted/50 rounded-xl">
                <div className="flex items-start gap-3">
                  <Info className="h-4 w-4 mt-0.5 text-primary" />
                  <p className="text-sm text-muted-foreground">
                    The median Band D rate is <strong className="text-foreground">{formatCurrency(stats.medianBandD, { decimals: 0 })}</strong>,
                    meaning half of all councils charge more and half charge less. The gap between the cheapest
                    ({formatCurrency(stats.minBandD, { decimals: 0 })}) and most expensive ({formatCurrency(stats.maxBandD, { decimals: 0 })})
                    is <strong className="text-foreground">{formatCurrency(stats.maxBandD - stats.minBandD, { decimals: 0 })}</strong>.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* By Council Type */}
          <Card className="border border-border/40 bg-card shadow-sm rounded-xl mb-8">
            <CardHeader className="p-5 sm:p-6 pb-4">
              <div className="flex items-center gap-3">
                <Building className="h-5 w-5 text-primary opacity-70" />
                <div>
                  <CardTitle className="text-lg sm:text-xl font-semibold">By Council Type</CardTitle>
                  <CardDescription>How rates vary across different types of local authority</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="px-5 pb-5 sm:px-6 sm:pb-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(stats.typeStats)
                  .sort((a, b) => b[1].avgBandD - a[1].avgBandD)
                  .map(([type, data]) => (
                  <div key={type} className="p-4 border rounded-xl">
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-semibold text-sm">{COUNCIL_TYPE_NAMES[type]}</span>
                      <Badge variant="secondary" className="text-xs">{data.count}</Badge>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Average</span>
                        <span className="font-bold">{formatCurrency(data.avgBandD, { decimals: 0 })}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Range</span>
                        <span>{formatCurrency(data.minBandD, { decimals: 0 })} - {formatCurrency(data.maxBandD, { decimals: 0 })}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6 p-4 bg-muted/50 rounded-xl">
                <div className="flex items-start gap-3">
                  <Info className="h-4 w-4 mt-0.5 text-primary" />
                  <p className="text-sm text-muted-foreground">
                    <strong className="text-foreground">Why the difference?</strong> Unitary authorities and metropolitan districts
                    tend to have higher rates because they provide all services (social care, education, roads, bins, etc.) in one council.
                    District councils have lower rates because county councils handle the expensive services like social care and education.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Where the Money Goes */}
          <Card className="border border-border/40 bg-card shadow-sm rounded-xl mb-8">
            <CardHeader className="p-5 sm:p-6 pb-4">
              <div className="flex items-center gap-3">
                <PoundSterling className="h-5 w-5 text-primary opacity-70" />
                <div>
                  <CardTitle className="text-lg sm:text-xl font-semibold">Where All the Money Goes</CardTitle>
                  <CardDescription>Combined spending across all {stats.councilsWithBudget} councils with budget data</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="px-5 pb-5 sm:px-6 sm:pb-6">
              <div className="space-y-4">
                {stats.serviceSpendingArray.slice(0, 6).map((service) => {
                  const percentage = (service.value / stats.totalServiceSpending) * 100;
                  return (
                    <div key={service.key} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">{SERVICE_NAMES[service.key]}</span>
                        <div className="text-right">
                          <span className="font-bold">{formatBillions(service.value)}</span>
                          <span className="text-muted-foreground ml-2">({percentage.toFixed(0)}%)</span>
                        </div>
                      </div>
                      <Progress value={percentage} className="h-3" />
                    </div>
                  );
                })}
              </div>
              <div className="mt-6 p-4 bg-primary/5 rounded-xl">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-4 w-4 mt-0.5 text-primary" />
                  <div className="text-sm">
                    <p className="font-medium text-primary mb-1">Social care dominates council budgets</p>
                    <p className="text-primary/80">
                      Adult and children&apos;s social care together account for over half of most councils&apos; spending.
                      This is the main reason council tax keeps rising - demand for care services grows every year as the population ages.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Key Insights Summary */}
          <Card className="border border-border/40 bg-card shadow-sm rounded-xl mb-8">
            <CardHeader className="p-5 sm:p-6 pb-4">
              <div className="flex items-center gap-3">
                <Info className="h-5 w-5 text-primary opacity-70" />
                <CardTitle className="text-lg sm:text-xl font-semibold">Key Takeaways</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="px-5 pb-5 sm:px-6 sm:pb-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-muted/50 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="h-4 w-4 text-destructive" />
                    <span className="font-semibold text-sm">Rising Every Year</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Council tax has risen faster than inflation for over a decade. The average increase this year is {stats.avgYoyChange.toFixed(1)}%.
                  </p>
                </div>

                <div className="p-4 bg-muted/50 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="h-4 w-4 text-primary" />
                    <span className="font-semibold text-sm">Location Matters</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Where you live makes a big difference. The gap between the highest and lowest councils is {formatCurrency(stats.maxBandD - stats.minBandD, { decimals: 0 })}.
                  </p>
                </div>

                <div className="p-4 bg-muted/50 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="h-4 w-4 text-primary" />
                    <span className="font-semibold text-sm">Social Care Pressure</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Adult social care is the single biggest cost for most councils. An ageing population means this keeps growing.
                  </p>
                </div>

                <div className="p-4 bg-muted/50 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <Building className="h-4 w-4 text-primary" />
                    <span className="font-semibold text-sm">Council Type Explains A Lot</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Unitary authorities charge more because they do everything. District councils charge less because counties handle expensive services.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* CTA */}
          <div className="text-center">
            <p className="text-muted-foreground mb-4">Want to see how your council compares?</p>
            <Link
              href="/"
              className="inline-flex items-center justify-center px-8 py-4 bg-primary text-primary-foreground rounded-xl font-semibold hover:bg-primary/90 transition-colors cursor-pointer"
            >
              Find Your Council
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
