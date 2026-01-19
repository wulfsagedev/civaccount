'use client';

import { useMemo, useEffect } from 'react';
import { Badge } from "@/components/ui/badge";
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
  BarChart3,
  Target,
  Calculator,
  Percent
} from 'lucide-react';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { councils, COUNCIL_TYPE_NAMES, formatCurrency, getCouncilPopulation, getNationalEfficiencyStats } from '@/data/councils';

export default function InsightsPage() {
  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

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

    // Find highest and lowest councils - NOW GROUPED BY COMPARABLE TYPES
    // Group 1: "All-in-one" councils (UA, MD, LB) - these are directly comparable
    // Group 2: District councils (SD) - only comparable to other districts
    // Group 3: County councils (SC) - only comparable to other counties

    const allInOneCouncils = councilsWithTax.filter(c => ['UA', 'MD', 'LB'].includes(c.type));
    const districtCouncils = councilsWithTax.filter(c => c.type === 'SD');
    const countyCouncils = councilsWithTax.filter(c => c.type === 'SC');

    const sortedAllInOne = [...allInOneCouncils].sort((a, b) =>
      (b.council_tax?.band_d_2025 || 0) - (a.council_tax?.band_d_2025 || 0)
    );
    const sortedDistricts = [...districtCouncils].sort((a, b) =>
      (b.council_tax?.band_d_2025 || 0) - (a.council_tax?.band_d_2025 || 0)
    );
    const sortedCounties = [...countyCouncils].sort((a, b) =>
      (b.council_tax?.band_d_2025 || 0) - (a.council_tax?.band_d_2025 || 0)
    );

    // Top/bottom 5 for each comparable group
    const highestAllInOne = sortedAllInOne.slice(0, 5);
    const lowestAllInOne = sortedAllInOne.slice(-5).reverse();
    const highestDistricts = sortedDistricts.slice(0, 5);
    const lowestDistricts = sortedDistricts.slice(-5).reverse();
    const highestCounties = sortedCounties.slice(0, 5);
    const lowestCounties = sortedCounties.slice(-5).reverse();

    // Keep overall for reference
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

    // Spending by council type
    const spendingByType: Record<string, { total: number; count: number; services: Record<string, number> }> = {};
    councilsWithBudget.forEach(c => {
      if (!c.budget || !c.type) return;
      if (!spendingByType[c.type]) {
        spendingByType[c.type] = { total: 0, count: 0, services: {} };
      }
      spendingByType[c.type].count++;
      spendingByType[c.type].total += (c.budget.total_service || 0) * 1000;

      // Track service spending
      const budget = c.budget;
      if (budget) {
        const services = ['adult_social_care', 'childrens_social_care', 'education', 'environmental', 'housing', 'transport'] as const;
        services.forEach(service => {
          const value = budget[service];
          if (typeof value === 'number') {
            spendingByType[c.type].services[service] = (spendingByType[c.type].services[service] || 0) + value * 1000;
          }
        });
      }
    });

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

    // Efficiency statistics
    const efficiencyStats = getNationalEfficiencyStats();

    // Total population served (with population data)
    const totalPopulation = councils.reduce((sum, c) => sum + (getCouncilPopulation(c.name) || 0), 0);

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
      // Grouped by comparable types
      highestAllInOne,
      lowestAllInOne,
      highestDistricts,
      lowestDistricts,
      highestCounties,
      lowestCounties,
      allInOneCount: allInOneCouncils.length,
      districtCount: districtCouncils.length,
      countyCount: countyCouncils.length,
      avgYoyChange,
      biggestIncreases,
      smallestIncreases,
      typeStats,
      totalBudget,
      serviceSpendingArray,
      totalServiceSpending,
      spendingByType,
      priceBands,
      efficiencyStats,
      totalPopulation
    };
  }, []);

  const SERVICE_INFO: Record<string, { name: string; description: string; includes: string[] }> = {
    adult_social_care: {
      name: 'Adult Social Care',
      description: 'Support for elderly and disabled adults',
      includes: ['Care homes', 'Home care visits', 'Day centres', 'Mental health support', 'Learning disability services', 'Safeguarding adults']
    },
    childrens_social_care: {
      name: "Children's Services",
      description: 'Protection and support for children and families',
      includes: ['Child protection', 'Foster care', 'Adoption services', 'Family support', 'Children in care', 'Youth services']
    },
    education: {
      name: 'Education',
      description: 'Schools and learning support',
      includes: ['School transport', 'Special educational needs (SEND)', 'Early years funding', 'School improvement', 'Adult education', 'Education welfare']
    },
    transport: {
      name: 'Roads & Transport',
      description: 'Getting around your area',
      includes: ['Road maintenance', 'Street lighting', 'Traffic management', 'Bus subsidies', 'Parking services', 'Highway drainage']
    },
    public_health: {
      name: 'Public Health',
      description: 'Keeping communities healthy',
      includes: ['Health visitors', 'Sexual health services', 'Drug & alcohol support', 'Smoking cessation', 'Obesity programmes', 'Health checks']
    },
    housing: {
      name: 'Housing',
      description: 'Homes and homelessness prevention',
      includes: ['Homelessness prevention', 'Housing advice', 'Council housing management', 'Housing benefit admin', 'Private sector housing standards']
    },
    cultural: {
      name: 'Culture & Leisure',
      description: 'Recreation and community facilities',
      includes: ['Libraries', 'Museums', 'Sports centres', 'Parks maintenance', 'Arts funding', 'Community centres']
    },
    environmental: {
      name: 'Environment',
      description: 'Waste and local environment',
      includes: ['Bin collections', 'Recycling', 'Street cleaning', 'Environmental health', 'Trading standards', 'Pest control']
    },
    planning: {
      name: 'Planning',
      description: 'Development and land use',
      includes: ['Planning applications', 'Building control', 'Local plans', 'Conservation', 'Enforcement', 'Land charges']
    },
    central_services: {
      name: 'Central Services',
      description: 'Running the council',
      includes: ['Council tax collection', 'HR & payroll', 'IT systems', 'Legal services', 'Democratic services', 'Finance']
    }
  };

  const SERVICE_NAMES: Record<string, string> = Object.fromEntries(
    Object.entries(SERVICE_INFO).map(([key, info]) => [key, info.name])
  );

  const formatBillions = (amount: number) => {
    if (amount >= 1000000000) {
      return `£${(amount / 1000000000).toFixed(1)} billion`;
    }
    if (amount >= 1000000) {
      return `£${(amount / 1000000).toFixed(0)} million`;
    }
    return `£${amount.toLocaleString('en-GB')}`;
  };

  // Calculate max for bar widths
  const maxPriceBandCount = Math.max(...stats.priceBands.map(b => b.count));
  const maxServiceSpending = Math.max(...stats.serviceSpendingArray.map(s => s.value));

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main id="main-content" className="flex-1">
        <div className="container mx-auto px-4 py-8 sm:px-6 sm:py-12 max-w-7xl">
          {/* Page Header */}
          <div className="text-center mb-10 sm:mb-12">
            <Badge variant="outline" className="mb-4">2025-26 Data</Badge>
            <h1 className="text-3xl sm:text-4xl font-bold mb-4">Council tax in England</h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              A complete picture of how council tax works across {stats.totalCouncils} local authorities
            </p>
          </div>

          {/* Key Statistics - Hero Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
            <div className="card-elevated p-5 sm:p-6">
              <div className="flex items-center justify-between mb-3">
                <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                  <PoundSterling className="h-4 w-4 text-muted-foreground" />
                </div>
                <Badge variant="outline" className="text-xs">Average</Badge>
              </div>
              <p className="text-2xl sm:text-3xl font-bold tabular-nums">{formatCurrency(stats.avgBandD, { decimals: 0 })}</p>
              <p className="text-sm text-muted-foreground mt-1">Band D average</p>
            </div>

            <div className="card-elevated p-5 sm:p-6">
              <div className="flex items-center justify-between mb-3">
                <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                  <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
                </div>
                <Badge variant="outline" className="text-xs">Range</Badge>
              </div>
              <p className="text-2xl sm:text-3xl font-bold tabular-nums">{formatCurrency(stats.maxBandD - stats.minBandD, { decimals: 0 })}</p>
              <p className="text-sm text-muted-foreground mt-1">Gap between highest & lowest</p>
            </div>

            <div className="card-elevated p-5 sm:p-6">
              <div className="flex items-center justify-between mb-3">
                <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </div>
                <Badge variant="outline" className="text-xs">Rising</Badge>
              </div>
              <p className="text-2xl sm:text-3xl font-bold tabular-nums">+{stats.avgYoyChange.toFixed(1)}%</p>
              <p className="text-sm text-muted-foreground mt-1">Average increase this year</p>
            </div>

            <div className="card-elevated p-5 sm:p-6">
              <div className="flex items-center justify-between mb-3">
                <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                  <Landmark className="h-4 w-4 text-muted-foreground" />
                </div>
                <Badge variant="outline" className="text-xs">Total</Badge>
              </div>
              <p className="text-2xl sm:text-3xl font-bold">{formatBillions(stats.totalBudget)}</p>
              <p className="text-sm text-muted-foreground mt-1">Combined council spending</p>
            </div>
          </div>

          {/* Rankings by Council Type - Fair Comparisons */}
          <div className="card-elevated p-6 sm:p-8 mb-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                <Scale className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <h2 className="type-title-2">Comparing like with like</h2>
                <p className="text-sm text-muted-foreground">Rankings grouped by council type for fair comparison</p>
              </div>
            </div>

            {/* All-in-one councils (UA, MD, LB) */}
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <Badge variant="secondary" className="text-xs">Unitary, Metropolitan & London Boroughs</Badge>
                <span className="text-sm text-muted-foreground">({stats.allInOneCount} councils)</span>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                These councils provide all services - education, social care, roads, bins, and more. Their tax covers everything.
              </p>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium text-sm">Highest</span>
                  </div>
                  <div className="space-y-2">
                    {stats.highestAllInOne.map((council, i) => (
                      <div key={council.ons_code} className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
                        <div className="flex items-center gap-3">
                          <span className="text-sm text-muted-foreground w-4 tabular-nums">{i + 1}.</span>
                          <span className="text-sm font-medium truncate">{council.name}</span>
                        </div>
                        <span className="font-bold tabular-nums shrink-0">{formatCurrency(council.council_tax!.band_d_2025, { decimals: 0 })}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <TrendingDown className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium text-sm">Lowest</span>
                  </div>
                  <div className="space-y-2">
                    {stats.lowestAllInOne.map((council, i) => (
                      <div key={council.ons_code} className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
                        <div className="flex items-center gap-3">
                          <span className="text-sm text-muted-foreground w-4 tabular-nums">{i + 1}.</span>
                          <span className="text-sm font-medium truncate">{council.name}</span>
                        </div>
                        <span className="font-bold tabular-nums shrink-0">{formatCurrency(council.council_tax!.band_d_2025, { decimals: 0 })}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* District councils */}
            <div className="mb-8 pt-6 border-t border-border/50">
              <div className="flex items-center gap-2 mb-4">
                <Badge variant="secondary" className="text-xs">District Councils</Badge>
                <span className="text-sm text-muted-foreground">({stats.districtCount} councils)</span>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                District councils handle bins, planning, housing, and local services. You also pay county council tax on top.
              </p>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium text-sm">Highest</span>
                  </div>
                  <div className="space-y-2">
                    {stats.highestDistricts.map((council, i) => (
                      <div key={council.ons_code} className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
                        <div className="flex items-center gap-3">
                          <span className="text-sm text-muted-foreground w-4 tabular-nums">{i + 1}.</span>
                          <span className="text-sm font-medium truncate">{council.name}</span>
                        </div>
                        <span className="font-bold tabular-nums shrink-0">{formatCurrency(council.council_tax!.band_d_2025, { decimals: 0 })}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <TrendingDown className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium text-sm">Lowest</span>
                  </div>
                  <div className="space-y-2">
                    {stats.lowestDistricts.map((council, i) => (
                      <div key={council.ons_code} className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
                        <div className="flex items-center gap-3">
                          <span className="text-sm text-muted-foreground w-4 tabular-nums">{i + 1}.</span>
                          <span className="text-sm font-medium truncate">{council.name}</span>
                        </div>
                        <span className="font-bold tabular-nums shrink-0">{formatCurrency(council.council_tax!.band_d_2025, { decimals: 0 })}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* County councils */}
            <div className="pt-6 border-t border-border/50">
              <div className="flex items-center gap-2 mb-4">
                <Badge variant="secondary" className="text-xs">County Councils</Badge>
                <span className="text-sm text-muted-foreground">({stats.countyCount} councils)</span>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                County councils handle education, social care, and roads. Their share is the biggest part of your bill in two-tier areas.
              </p>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium text-sm">Highest</span>
                  </div>
                  <div className="space-y-2">
                    {stats.highestCounties.map((council, i) => (
                      <div key={council.ons_code} className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
                        <div className="flex items-center gap-3">
                          <span className="text-sm text-muted-foreground w-4 tabular-nums">{i + 1}.</span>
                          <span className="text-sm font-medium truncate">{council.name}</span>
                        </div>
                        <span className="font-bold tabular-nums shrink-0">{formatCurrency(council.council_tax!.band_d_2025, { decimals: 0 })}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <TrendingDown className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium text-sm">Lowest</span>
                  </div>
                  <div className="space-y-2">
                    {stats.lowestCounties.map((council, i) => (
                      <div key={council.ons_code} className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
                        <div className="flex items-center gap-3">
                          <span className="text-sm text-muted-foreground w-4 tabular-nums">{i + 1}.</span>
                          <span className="text-sm font-medium truncate">{council.name}</span>
                        </div>
                        <span className="font-bold tabular-nums shrink-0">{formatCurrency(council.council_tax!.band_d_2025, { decimals: 0 })}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 p-4 bg-muted/30 rounded-xl">
              <div className="flex items-start gap-3">
                <Info className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                <p className="text-sm text-muted-foreground leading-relaxed">
                  <strong className="text-foreground">Why group councils this way?</strong> Comparing a district council to a unitary authority
                  is like comparing apples to oranges. Districts appear cheaper, but you also pay county council tax.
                  By grouping similar councils together, you can see who really charges more for equivalent services.
                </p>
              </div>
            </div>
          </div>

          {/* Year-over-Year Changes */}
          <div className="card-elevated p-6 sm:p-8 mb-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <h2 className="type-title-2">This year&apos;s changes</h2>
                <p className="text-sm text-muted-foreground">Biggest increases and smallest rises from 2024-25 to 2025-26</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium text-sm">Biggest increases</span>
                </div>
                <div className="space-y-2">
                  {stats.biggestIncreases.map((item, i) => (
                    <div key={item.council.ons_code} className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-muted-foreground w-4 tabular-nums">{i + 1}.</span>
                        <span className="text-sm font-medium truncate">{item.council.name}</span>
                        <Badge variant="outline" className="text-xs hidden sm:inline-flex">{item.council.type_name}</Badge>
                      </div>
                      <Badge variant="outline" className="text-xs tabular-nums shrink-0">+{item.percentChange.toFixed(1)}%</Badge>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle className="h-4 w-4 text-stone-400" />
                  <span className="font-medium text-sm">Smallest increases</span>
                </div>
                <div className="space-y-2">
                  {stats.smallestIncreases.map((item, i) => (
                    <div key={item.council.ons_code} className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-muted-foreground w-4 tabular-nums">{i + 1}.</span>
                        <span className="text-sm font-medium truncate">{item.council.name}</span>
                        <Badge variant="outline" className="text-xs hidden sm:inline-flex">{item.council.type_name}</Badge>
                      </div>
                      <Badge variant="outline" className="text-xs bg-navy-50 text-navy-600 border-navy-200 dark:bg-navy-950/30 dark:text-navy-400 dark:border-navy-800 tabular-nums shrink-0">
                        +{item.percentChange.toFixed(1)}%
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Distribution by Price Band */}
          <div className="card-elevated p-6 sm:p-8 mb-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                <BarChart3 className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <h2 className="type-title-2">How council tax rates are spread</h2>
                <p className="text-sm text-muted-foreground">Distribution of Band D rates across all councils</p>
              </div>
            </div>

            <div className="space-y-4">
              {stats.priceBands.map((band) => {
                const percentage = (band.count / stats.councilsWithTax) * 100;
                const barWidth = (band.count / maxPriceBandCount) * 100;
                return (
                  <div key={band.label}>
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="font-medium">{band.label}</span>
                      <span className="text-muted-foreground tabular-nums">{band.count} councils ({percentage.toFixed(0)}%)</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-foreground rounded-full transition-all duration-500"
                        style={{ width: `${barWidth}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-6 p-4 bg-muted/30 rounded-xl">
              <div className="flex items-start gap-3">
                <Info className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                <p className="text-sm text-muted-foreground leading-relaxed">
                  The median Band D rate is <strong className="text-foreground tabular-nums">{formatCurrency(stats.medianBandD, { decimals: 0 })}</strong>,
                  meaning half of all councils charge more and half charge less. The gap between the cheapest
                  ({formatCurrency(stats.minBandD, { decimals: 0 })}) and most expensive ({formatCurrency(stats.maxBandD, { decimals: 0 })})
                  is <strong className="text-foreground tabular-nums">{formatCurrency(stats.maxBandD - stats.minBandD, { decimals: 0 })}</strong>.
                </p>
              </div>
            </div>
          </div>

          {/* By Council Type */}
          <div className="card-elevated p-6 sm:p-8 mb-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                <Building className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <h2 className="type-title-2">By council type</h2>
                <p className="text-sm text-muted-foreground">How rates vary across different types of local authority</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(stats.typeStats)
                .sort((a, b) => b[1].avgBandD - a[1].avgBandD)
                .map(([type, data]) => (
                <div key={type} className="p-4 border border-border/50 rounded-xl">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-semibold text-sm">{COUNCIL_TYPE_NAMES[type]}</span>
                    <Badge variant="outline" className="text-xs">{data.count}</Badge>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Average</span>
                      <span className="font-bold tabular-nums">{formatCurrency(data.avgBandD, { decimals: 0 })}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Range</span>
                      <span className="tabular-nums">{formatCurrency(data.minBandD, { decimals: 0 })} - {formatCurrency(data.maxBandD, { decimals: 0 })}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 p-4 bg-muted/30 rounded-xl">
              <div className="flex items-start gap-3">
                <Info className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                <p className="text-sm text-muted-foreground leading-relaxed">
                  <strong className="text-foreground">Why the difference?</strong> Unitary authorities and metropolitan districts
                  tend to have higher rates because they provide all services (social care, education, roads, bins, etc.) in one council.
                  District councils have lower rates because county councils handle the expensive services like social care and education.
                </p>
              </div>
            </div>
          </div>

          {/* Where the Money Goes */}
          <div className="card-elevated p-6 sm:p-8 mb-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                <PoundSterling className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <h2 className="type-title-2">Where all the money goes</h2>
                <p className="text-sm text-muted-foreground">Combined spending across all {stats.councilsWithBudget} councils with budget data</p>
              </div>
            </div>

            <div className="space-y-6">
              {stats.serviceSpendingArray.map((service) => {
                const percentage = (service.value / stats.totalServiceSpending) * 100;
                const barWidth = (service.value / maxServiceSpending) * 100;
                const info = SERVICE_INFO[service.key];
                return (
                  <div key={service.key}>
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <span className="font-medium text-sm">{SERVICE_NAMES[service.key]}</span>
                        <p className="text-sm text-muted-foreground">{info?.description}</p>
                      </div>
                      <div className="text-right shrink-0 ml-4">
                        <span className="font-bold">{formatBillions(service.value)}</span>
                        <span className="text-muted-foreground ml-2 text-sm tabular-nums">({percentage.toFixed(0)}%)</span>
                      </div>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden mb-3">
                      <div
                        className="h-full bg-foreground rounded-full transition-all duration-500"
                        style={{ width: `${barWidth}%` }}
                      />
                    </div>
                    {info?.includes && (
                      <div className="flex flex-wrap gap-1.5">
                        {info.includes.slice(0, 4).map((item) => (
                          <Badge key={item} variant="outline" className="text-xs font-normal">
                            {item}
                          </Badge>
                        ))}
                        {info.includes.length > 4 && (
                          <Badge variant="outline" className="text-xs font-normal text-muted-foreground">
                            +{info.includes.length - 4} more
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="mt-6 p-4 bg-muted/30 rounded-xl">
              <div className="flex items-start gap-3">
                <Info className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                <div className="text-sm">
                  <p className="font-medium text-foreground mb-1">Education and social care dominate council budgets</p>
                  <p className="text-muted-foreground leading-relaxed">
                    Education (including school transport and special needs) is the single largest category, followed by adult and children&apos;s social care.
                    Together, these three services account for around 80% of total council spending - and demand keeps growing.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Efficiency Metrics */}
          {stats.efficiencyStats && (
            <div className="card-elevated p-6 sm:p-8 mb-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                  <Target className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <h2 className="type-title-2">Efficiency & value for money</h2>
                  <p className="text-sm text-muted-foreground">How much councils spend per person and on administration</p>
                </div>
              </div>

              {/* Key efficiency metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <div className="p-4 bg-muted/30 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <Calculator className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium text-sm">Average per person</span>
                  </div>
                  <p className="text-2xl font-bold tabular-nums">
                    {formatCurrency(stats.efficiencyStats.averagePerCapitaSpending, { decimals: 0 })}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Spent per resident annually
                  </p>
                </div>
                <div className="p-4 bg-muted/30 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <Percent className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium text-sm">Admin overhead</span>
                  </div>
                  <p className="text-2xl font-bold tabular-nums">
                    {stats.efficiencyStats.averageAdminOverhead.toFixed(1)}%
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Of budget on central services
                  </p>
                </div>
                <div className="p-4 bg-muted/30 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium text-sm">Population covered</span>
                  </div>
                  <p className="text-2xl font-bold tabular-nums">
                    {(stats.totalPopulation / 1000000).toFixed(1)}m
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Residents with data
                  </p>
                </div>
              </div>

              {/* Per-capita spending comparison */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <TrendingDown className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium text-sm">Lowest spending per person</span>
                  </div>
                  <div className="space-y-2">
                    {stats.efficiencyStats.lowestPerCapita.map((item, i) => (
                      <div key={item.council.ons_code} className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
                        <div className="flex items-center gap-3">
                          <span className="text-sm text-muted-foreground w-4 tabular-nums">{i + 1}.</span>
                          <span className="text-sm font-medium">{item.council.name}</span>
                          <Badge variant="outline" className="text-xs">{item.council.type_name}</Badge>
                        </div>
                        <span className="font-bold tabular-nums">{formatCurrency(item.perCapitaSpending, { decimals: 0 })}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium text-sm">Highest spending per person</span>
                  </div>
                  <div className="space-y-2">
                    {stats.efficiencyStats.highestPerCapita.map((item, i) => (
                      <div key={item.council.ons_code} className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
                        <div className="flex items-center gap-3">
                          <span className="text-sm text-muted-foreground w-4 tabular-nums">{i + 1}.</span>
                          <span className="text-sm font-medium">{item.council.name}</span>
                          <Badge variant="outline" className="text-xs">{item.council.type_name}</Badge>
                        </div>
                        <span className="font-bold tabular-nums">{formatCurrency(item.perCapitaSpending, { decimals: 0 })}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Admin overhead comparison */}
              <div className="mt-6 pt-6 border-t border-border/50">
                <h4 className="font-semibold text-sm mb-4 flex items-center gap-2">
                  <Building className="h-4 w-4 text-muted-foreground" />
                  Administrative overhead comparison
                </h4>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <CheckCircle className="h-4 w-4 text-stone-400" />
                      <span className="font-medium text-sm">Lowest admin overhead</span>
                    </div>
                    <div className="space-y-2">
                      {stats.efficiencyStats.lowestAdminOverhead.map((item, i) => (
                        <div key={item.council.ons_code} className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
                          <div className="flex items-center gap-3">
                            <span className="text-sm text-muted-foreground w-4 tabular-nums">{i + 1}.</span>
                            <span className="text-sm font-medium">{item.council.name}</span>
                          </div>
                          <Badge variant="outline" className="text-xs bg-navy-50 text-navy-600 border-navy-200 dark:bg-navy-950/30 dark:text-navy-400 dark:border-navy-800 tabular-nums">
                            {item.adminOverheadPercent.toFixed(1)}%
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium text-sm">Highest admin overhead</span>
                    </div>
                    <div className="space-y-2">
                      {stats.efficiencyStats.highestAdminOverhead.map((item, i) => (
                        <div key={item.council.ons_code} className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
                          <div className="flex items-center gap-3">
                            <span className="text-sm text-muted-foreground w-4 tabular-nums">{i + 1}.</span>
                            <span className="text-sm font-medium">{item.council.name}</span>
                          </div>
                          <Badge variant="outline" className="text-xs tabular-nums">{item.adminOverheadPercent.toFixed(1)}%</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 p-4 bg-muted/30 rounded-xl">
                <div className="flex items-start gap-3">
                  <Info className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                  <div className="text-sm text-muted-foreground">
                    <p className="font-medium text-foreground mb-1">What do these numbers mean?</p>
                    <p className="leading-relaxed">
                      <strong className="text-foreground">Per-capita spending</strong> shows how much each council spends divided by their population.
                      Higher isn&apos;t necessarily bad - councils with more elderly residents or deprived areas will naturally spend more on social care.
                      <strong className="text-foreground"> Admin overhead</strong> shows what percentage of the budget goes to central services like HR, IT, and council tax collection.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Spending by Council Type */}
          <div className="card-elevated p-6 sm:p-8 mb-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                <Building className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <h2 className="type-title-2">How spending varies by council type</h2>
                <p className="text-sm text-muted-foreground">Different councils have very different spending priorities</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {Object.entries(stats.spendingByType)
                .filter(([, data]) => data.total > 0)
                .sort((a, b) => b[1].total - a[1].total)
                .slice(0, 4)
                .map(([type, data]) => {
                  const topServices = Object.entries(data.services)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 3);
                  const hasEducation = data.services.education > 0;
                  const hasSocialCare = (data.services.adult_social_care || 0) > 0;
                  const maxService = Math.max(...topServices.map(s => s[1]));

                  return (
                    <div key={type} className="p-4 border border-border/50 rounded-xl">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <span className="font-semibold">{COUNCIL_TYPE_NAMES[type]}</span>
                          <p className="text-sm text-muted-foreground">{data.count} councils</p>
                        </div>
                        <Badge variant="outline" className="text-xs">{formatBillions(data.total)} total</Badge>
                      </div>

                      <div className="space-y-3 mb-3">
                        {topServices.map(([service, amount]) => {
                          const percentage = (amount / data.total) * 100;
                          const barWidth = (amount / maxService) * 100;
                          return (
                            <div key={service}>
                              <div className="flex items-center justify-between text-sm mb-1">
                                <span className="text-muted-foreground">{SERVICE_NAMES[service]}</span>
                                <span className="font-medium tabular-nums">{percentage.toFixed(0)}%</span>
                              </div>
                              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-foreground rounded-full"
                                  style={{ width: `${barWidth}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      <p className="text-sm text-muted-foreground">
                        {hasEducation && hasSocialCare
                          ? 'Provides all services including education and social care'
                          : hasEducation
                          ? 'Handles education but not social care'
                          : hasSocialCare
                          ? 'Handles social care but education is separate'
                          : 'Focuses on local services like bins, planning, and housing'}
                      </p>
                    </div>
                  );
                })}
            </div>

            <div className="mt-6 p-4 bg-muted/30 rounded-xl">
              <div className="flex items-start gap-3">
                <Info className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                <p className="text-sm text-muted-foreground leading-relaxed">
                  <strong className="text-foreground">Why such big differences?</strong> County councils and unitary authorities handle
                  expensive services like education and social care. District councils focus on local services like bins, planning,
                  and housing - which is why their budgets are much smaller.
                </p>
              </div>
            </div>
          </div>

          {/* Key Insights Summary */}
          <div className="card-elevated p-6 sm:p-8 mb-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                <Info className="h-5 w-5 text-muted-foreground" />
              </div>
              <h2 className="type-title-2">Key takeaways</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 bg-muted/30 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  <span className="font-semibold text-sm">Rising every year</span>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Council tax has risen faster than inflation for over a decade. The average increase this year is {stats.avgYoyChange.toFixed(1)}%.
                </p>
              </div>

              <div className="p-4 bg-muted/30 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="font-semibold text-sm">Location matters</span>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Where you live makes a big difference. The gap between the highest and lowest councils is {formatCurrency(stats.maxBandD - stats.minBandD, { decimals: 0 })}.
                </p>
              </div>

              <div className="p-4 bg-muted/30 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="font-semibold text-sm">Education & care dominate</span>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Education, adult social care, and children&apos;s services together make up around 80% of council spending.
                </p>
              </div>

              <div className="p-4 bg-muted/30 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <Building className="h-4 w-4 text-muted-foreground" />
                  <span className="font-semibold text-sm">Council type explains a lot</span>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Unitary authorities charge more because they do everything. District councils charge less because counties handle expensive services.
                </p>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="text-center">
            <p className="text-muted-foreground mb-4">Want to see how your council compares?</p>
            <Link
              href="/"
              className="inline-flex items-center justify-center px-8 py-4 bg-foreground text-background rounded-xl font-semibold hover:bg-foreground/90 transition-colors cursor-pointer"
            >
              Find your council
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
