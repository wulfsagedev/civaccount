'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  TrendingUp,
  TrendingDown,
  Trash2,
  MapPin,
  Building,
  Home,
  Users,
  User,
  Building2,
  Shield,
  Flame,
  ExternalLink,
  Info,
  GraduationCap,
  Car,
  Heart,
  BookOpen,
  ChevronRight,
  ChevronDown,
  Phone,
  Check,
  HelpCircle,
  AlertTriangle,
  AlertOctagon,
  FileWarning,
  Recycle,
  HardHat,
  Hammer
} from "lucide-react";
import { useCouncil } from '@/context/CouncilContext';
import { formatBudget, formatCurrency, getCouncilPopulation, getAverageBandDByType, calculateBands, calculateEfficiencyMetrics, getCouncilByName, getCouncilSlug, councils, type ServiceSpendingDetail } from '@/data/councils';
import { getRecyclingContext, getHomesBuiltContext, getOfstedContext, getRoadConditionContext } from '@/data/benchmarks';

// Service descriptions with examples - simple, neutral language for all reading levels
const SERVICE_DETAILS: Record<string, { description: string; examples: string[] }> = {
  environmental: {
    description: 'Bin collection and street cleaning services',
    examples: ['Bin collection', 'Recycling centres', 'Street cleaning', 'Fly-tipping removal']
  },
  planning: {
    description: 'Planning applications and building control',
    examples: ['Planning applications', 'Building control', 'Conservation areas', 'Listed buildings']
  },
  central_services: {
    description: 'Council administration and customer services',
    examples: ['Customer service', 'Council tax collection', 'Elections', 'IT systems']
  },
  cultural: {
    description: 'Libraries, parks, and leisure facilities',
    examples: ['Libraries', 'Parks', 'Leisure centres', 'Museums', 'Sports facilities']
  },
  housing: {
    description: 'Council housing and homelessness services',
    examples: ['Council housing', 'Homelessness support', 'Housing benefits', 'Private rental checks']
  },
  adult_social_care: {
    description: 'Care services for adults and older people',
    examples: ['Care homes', 'Home care visits', 'Disability support', 'Mental health services']
  },
  childrens_social_care: {
    description: 'Child protection and family services',
    examples: ['Child protection', 'Foster care', 'Adoption services', 'Family support']
  },
  education: {
    description: 'School transport and special educational needs',
    examples: ['School transport', 'Special educational needs', 'Education welfare', 'School admissions']
  },
  transport: {
    description: 'Roads, street lights, and footpaths',
    examples: ['Road repairs', 'Potholes', 'Street lights', 'Traffic signals', 'Footpaths']
  },
  public_health: {
    description: 'Public health and prevention services',
    examples: ['Stop smoking services', 'Health visitors', 'Drug & alcohol support', 'Sexual health']
  }
};

// Helper function to find a linkable council from precept authority name
const findLinkedCouncil = (authorityName: string) => {
  // Clean the authority name
  const cleanName = authorityName
    .replace(' District Council', '')
    .replace(' County Council', '')
    .replace(' Council', '')
    .replace(' Borough', '')
    .trim();

  // Try to find a matching council
  const council = getCouncilByName(cleanName) ||
                 getCouncilByName(authorityName) ||
                 councils.find(c => c.name.toLowerCase().includes(cleanName.toLowerCase()));

  if (council) {
    return { council, slug: getCouncilSlug(council) };
  }
  return null;
};

// Common contact issues for "Who to Contact" section
const CONTACT_ISSUES = {
  district: [
    { issue: 'Missed bin collection', contact: 'district' },
    { issue: 'Planning application', contact: 'district' },
    { issue: 'Council tax bill', contact: 'district' },
    { issue: 'Housing problem', contact: 'district' },
    { issue: 'Noisy neighbours', contact: 'district' },
    { issue: 'Parks and playgrounds', contact: 'district' },
  ],
  county: [
    { issue: 'Pothole or road damage', contact: 'county' },
    { issue: 'Street lights not working', contact: 'county' },
    { issue: 'School transport', contact: 'county' },
    { issue: 'Social care for adults', contact: 'county' },
    { issue: 'Children\'s services', contact: 'county' },
    { issue: 'Library services', contact: 'county' },
  ],
};

const UnifiedDashboard = () => {
  const { selectedCouncil } = useCouncil();
  const [selectedBand, setSelectedBand] = useState('D');
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [showAllCabinet, setShowAllCabinet] = useState(false);
  const [showAllCouncillors, setShowAllCouncillors] = useState(false);
  const [showAllSuppliers, setShowAllSuppliers] = useState(false);
  const [showAllGrants, setShowAllGrants] = useState(false);
  const [expandedSupplier, setExpandedSupplier] = useState<number | null>(null);
  const [expandedGrant, setExpandedGrant] = useState<number | null>(null);

  // All data calculations
  const budget = selectedCouncil?.budget;
  const councilTax = selectedCouncil?.council_tax;
  const detailed = selectedCouncil?.detailed;

  const totalBudget = budget?.total_service ? budget.total_service * 1000 : null;
  const population = selectedCouncil ? getCouncilPopulation(selectedCouncil.name) : null;
  const perCapita = totalBudget && population ? totalBudget / population : null;
  const efficiencyMetrics = selectedCouncil ? calculateEfficiencyMetrics(selectedCouncil) : null;

  // Get the council's own portion from precepts (more precise) or fall back to band_d_2025
  const thisCouncilBandD = useMemo(() => {
    if (!selectedCouncil || !councilTax) return null;

    // If we have detailed precepts, find this council's precise amount
    if (detailed?.precepts && detailed.precepts.length > 0) {
      const councilNameLower = selectedCouncil.name.toLowerCase();
      const matchingPrecept = detailed.precepts.find(p => {
        const authLower = p.authority.toLowerCase();
        // Check if the authority name contains the council name
        return authLower.includes(councilNameLower) ||
               councilNameLower.split(' ').some(word => word.length > 3 && authLower.includes(word));
      });
      if (matchingPrecept) {
        return matchingPrecept.band_d;
      }
    }
    // Fall back to band_d_2025
    return councilTax.band_d_2025;
  }, [selectedCouncil, councilTax, detailed]);

  const taxChange = councilTax && councilTax.band_d_2024
    ? ((councilTax.band_d_2025 - councilTax.band_d_2024) / councilTax.band_d_2024 * 100)
    : null;

  const typeAverage = selectedCouncil ? getAverageBandDByType(selectedCouncil.type) : null;
  const vsAverage = typeAverage && councilTax ? councilTax.band_d_2025 - typeAverage : null;

  // Daily cost calculation
  const dailyCost = councilTax ? councilTax.band_d_2025 / 365 : null;
  const totalDailyCost = detailed?.total_band_d ? detailed.total_band_d / 365 : null;

  // Calculate year-on-year change in actual pounds (for change breakdown)
  const taxChangeAmount = councilTax && councilTax.band_d_2024
    ? councilTax.band_d_2025 - councilTax.band_d_2024
    : null;

  // Calculate reserves in weeks of operation (use revenue_budget if available, else totalBudget)
  const reservesInWeeks = useMemo(() => {
    if (!detailed?.reserves) return null;
    // Prefer revenue_budget from detailed data (for county councils with enriched data)
    const annualBudget = detailed.revenue_budget || totalBudget;
    if (!annualBudget || annualBudget === 0) return null;
    const weeklyBudget = annualBudget / 52;
    const weeks = Math.round(detailed.reserves / weeklyBudget);
    // Only return if it's a meaningful number (at least 1 week)
    return weeks > 0 ? weeks : null;
  }, [detailed?.reserves, detailed?.revenue_budget, totalBudget]);

  // Calculate all bands
  const allBands = useMemo(() => {
    if (!councilTax) return null;
    return calculateBands(councilTax.band_d_2025);
  }, [councilTax]);

  // Calculate total band amounts including precepts
  const totalBandAmounts = useMemo(() => {
    if (!detailed?.total_band_d || !allBands) return null;
    const bandDRatio = detailed.total_band_d / councilTax!.band_d_2025;
    return {
      A: allBands.A * bandDRatio,
      B: allBands.B * bandDRatio,
      C: allBands.C * bandDRatio,
      D: detailed.total_band_d,
      E: allBands.E * bandDRatio,
      F: allBands.F * bandDRatio,
      G: allBands.G * bandDRatio,
      H: allBands.H * bandDRatio,
    };
  }, [detailed, allBands, councilTax]);

  // Build spending categories with "your share" calculation
  const spendingCategories = useMemo(() => {
    if (!budget) return [];

    const total = budget.total_service || 1;
    const categories: Array<{
      name: string;
      icon: typeof Trash2;
      amount: number;
      percentage: number;
      key: string;
      yourShare: number | null; // How much of your council tax goes to this
    }> = [];

    const serviceMap = [
      { key: 'environmental', name: 'Environment & Streets', icon: Trash2 },
      { key: 'planning', name: 'Planning', icon: MapPin },
      { key: 'central_services', name: 'Council Services', icon: Building },
      { key: 'cultural', name: 'Leisure & Culture', icon: BookOpen },
      { key: 'housing', name: 'Housing', icon: Home },
      { key: 'adult_social_care', name: 'Adult Social Care', icon: Heart },
      { key: 'childrens_social_care', name: "Children's Services", icon: Users },
      { key: 'education', name: 'Education', icon: GraduationCap },
      { key: 'transport', name: 'Roads & Transport', icon: Car },
      { key: 'public_health', name: 'Public Health', icon: Shield },
    ];

    for (const service of serviceMap) {
      const amount = budget[service.key as keyof typeof budget] as number | null;
      if (amount && amount > 0) {
        const percentage = (amount / total) * 100;
        // Calculate "your share" - what portion of Band D tax goes to this service
        const yourShare = councilTax ? (councilTax.band_d_2025 * percentage) / 100 : null;

        categories.push({
          name: service.name,
          icon: service.icon,
          amount: amount * 1000,
          percentage,
          key: service.key,
          yourShare,
        });
      }
    }

    return categories.sort((a, b) => b.percentage - a.percentage);
  }, [budget, councilTax]);

  // Build lookup from service_spending for drill-down data
  const serviceSpendingMap = useMemo(() => {
    const map = new Map<string, ServiceSpendingDetail>();
    if (detailed?.service_spending) {
      for (const item of detailed.service_spending) {
        map.set(item.category, item);
      }
    }
    return map;
  }, [detailed]);

  if (!selectedCouncil) {
    return (
      <div className="card-elevated p-8 text-center">
        <p className="text-muted-foreground">Please select a council to view information.</p>
      </div>
    );
  }

  const isDistrictCouncil = selectedCouncil.type === 'SD';
  const isCountyCouncil = selectedCouncil.type === 'SC';

  // Band descriptions
  const bandDescriptions: Record<string, string> = {
    A: 'Smallest properties',
    B: 'Small properties',
    C: 'Smaller than average',
    D: 'Average properties',
    E: 'Larger than average',
    F: 'Large properties',
    G: 'Very large properties',
    H: 'Highest value properties'
  };

  // Top spending category
  const topSpending = spendingCategories[0];

  return (
    <div className="space-y-5">
      {/* ═══════════════════════════════════════════════════════════════════════
          SECTION 1: THE HERO - Your Bill (Above the fold on mobile)
          ═══════════════════════════════════════════════════════════════════════ */}
      <section className="card-elevated p-5 sm:p-6">
        {/* Primary amount - This council's share */}
        <div className="mb-6">
          <p className="type-caption text-muted-foreground mb-1">
            You pay this council
            <span className="ml-2 text-muted-foreground/60">(Published data)</span>
          </p>
          <div className="flex items-baseline gap-2">
            <span className="type-display">
              {thisCouncilBandD ? formatCurrency(thisCouncilBandD, { decimals: 2 }) : 'N/A'}
            </span>
            <span className="type-caption text-muted-foreground">/year</span>
          </div>

          {/* Year-on-year change */}
          {taxChange !== null && (
            <div className="mt-2">
              <div className="flex items-center gap-1.5">
                {taxChange > 0 ? (
                  <TrendingUp className="h-3.5 w-3.5 text-negative" aria-hidden="true" />
                ) : (
                  <TrendingDown className="h-3.5 w-3.5 text-positive" aria-hidden="true" />
                )}
                <span className={`type-body-sm ${taxChange > 0 ? 'text-negative' : 'text-positive'}`}>
                  {taxChange > 0 ? 'Up' : 'Down'} {Math.abs(taxChange).toFixed(1)}% from last year
                  {taxChangeAmount !== null && (
                    <span className="text-muted-foreground ml-1">
                      ({taxChangeAmount > 0 ? '+' : ''}{formatCurrency(taxChangeAmount, { decimals: 2 })})
                    </span>
                  )}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Full bill breakdown with visual bar */}
        {detailed?.precepts && detailed.precepts.length > 0 && detailed.total_band_d && (
          <div className="pt-5 border-t border-border/50">
            <p className="type-body-sm font-semibold mb-4">Your total council tax bill</p>

            {/* Visual stacked bar with legend */}
            <div className="mb-4">
              <div className="h-2 rounded-full overflow-hidden flex bg-muted">
                {detailed.precepts.map((precept, index) => {
                  const percentage = (precept.band_d / detailed.total_band_d!) * 100;
                  const isThisCouncil = precept.authority.toLowerCase().includes(selectedCouncil.name.toLowerCase().split(' ')[0]);
                  return (
                    <div
                      key={index}
                      className={`h-full ${isThisCouncil ? 'bg-foreground' : 'bg-muted-foreground/40'}`}
                      style={{ width: `${percentage}%` }}
                    />
                  );
                })}
              </div>
              {/* Legend */}
              <div className="flex items-center gap-4 mt-2">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-foreground" />
                  <span className="type-caption text-muted-foreground">{selectedCouncil.name}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-muted-foreground/40" />
                  <span className="type-caption text-muted-foreground">Other authorities</span>
                </div>
              </div>
            </div>

            {/* Breakdown list - consistent row heights with icons */}
            <div className="space-y-0">
              {detailed.precepts.map((precept, index) => {
                const isThisCouncil = precept.authority.toLowerCase().includes(selectedCouncil.name.toLowerCase().split(' ')[0]);
                const linkedCouncil = !isThisCouncil ? findLinkedCouncil(precept.authority) : null;
                const isLinkable = linkedCouncil && !precept.authority.toLowerCase().includes('police') && !precept.authority.toLowerCase().includes('fire');

                // Keep "Council" in the name for clarity
                const displayName = precept.authority
                  .replace(' District Council', '')
                  .replace(' County Council', ' County Council')
                  .replace(/^(.+) Council$/, '$1 Council');

                // Choose appropriate icon
                let Icon = Building;
                if (precept.authority.toLowerCase().includes('county')) Icon = Building2;
                if (precept.authority.toLowerCase().includes('police')) Icon = Shield;
                if (precept.authority.toLowerCase().includes('fire')) Icon = Flame;
                if (isThisCouncil) Icon = Home;

                // Default descriptions for common authority types
                const getDefaultDescription = () => {
                  if (precept.authority.toLowerCase().includes('police')) return 'Local policing and crime prevention';
                  if (precept.authority.toLowerCase().includes('fire')) return 'Fire and rescue services';
                  if (precept.authority.toLowerCase().includes('county')) return 'Education, social care, highways';
                  return null;
                };
                const description = precept.description || getDefaultDescription();

                const rowContent = (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${isThisCouncil ? 'bg-foreground/10' : 'bg-muted'}`}>
                        <Icon className={`h-4 w-4 ${isThisCouncil ? 'text-foreground' : 'text-muted-foreground'}`} />
                      </div>
                      <div className="min-w-0">
                        <span className={`type-body-sm ${isThisCouncil ? 'font-semibold' : ''} ${isLinkable ? 'group-hover:text-foreground transition-colors' : ''}`}>
                          {displayName}
                        </span>
                        {description && (
                          <p className="type-caption text-muted-foreground truncate">{description}</p>
                        )}
                      </div>
                      {isLinkable && (
                        <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
                      )}
                    </div>
                    <span className={`type-body-sm font-semibold tabular-nums shrink-0 ml-3 ${isThisCouncil ? '' : 'text-muted-foreground'}`}>
                      {formatCurrency(precept.band_d, { decimals: 2 })}
                    </span>
                  </div>
                );

                return (
                  <div key={index} className="-mx-2 px-2 py-2 rounded-lg hover:bg-muted/50 transition-colors">
                    {isLinkable ? (
                      <Link href={`/council/${linkedCouncil.slug}`} className="group cursor-pointer">
                        {rowContent}
                      </Link>
                    ) : (
                      rowContent
                    )}
                  </div>
                );
              })}
            </div>

            {/* Total */}
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-border/50">
              <div>
                <span className="type-body font-semibold">Total annual bill</span>
                {totalDailyCost && (
                  <p className="type-caption text-muted-foreground">{formatCurrency(totalDailyCost, { decimals: 2 })} per day</p>
                )}
              </div>
              <span className="type-metric tabular-nums">
                {formatCurrency(detailed.total_band_d, { decimals: 2 })}
              </span>
            </div>
          </div>
        )}

        {/* Comparison callout */}
        {vsAverage !== null && (
          <div className="mt-5 p-3 rounded-lg bg-muted/30">
            <div className="flex items-center justify-between">
              <span className="type-caption text-muted-foreground">
                Compared to average {selectedCouncil.type_name.toLowerCase()}
                <span className="ml-1 text-muted-foreground/60">(Comparison)</span>
              </span>
              <span className={`type-body-sm font-semibold tabular-nums ${vsAverage > 0 ? 'text-negative' : vsAverage < 0 ? 'text-positive' : 'text-muted-foreground'}`}>
                {vsAverage > 0 ? '+' : ''}{formatCurrency(vsAverage, { decimals: 2 })}
              </span>
            </div>
          </div>
        )}
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
          SECTION 2: Council Tax by Band - Always visible
          ═══════════════════════════════════════════════════════════════════════ */}
      {allBands && (
        <section className="card-elevated p-5 sm:p-6">
          <h2 className="type-title-2 mb-1">Council tax by band</h2>
          <p className="type-body-sm text-muted-foreground mb-5">
            Pick your property band to see how much you pay
            <span className="ml-1 text-muted-foreground/60">(Calculated from Band D)</span>
          </p>

          {/* Band selector - horizontal grid that always fits */}
          <div className="grid grid-cols-8 gap-1 sm:gap-1.5 mb-5">
            {Object.keys(allBands).map((band) => (
              <button
                key={band}
                onClick={() => setSelectedBand(band)}
                className={`py-2.5 sm:py-3 rounded-lg type-body-sm font-semibold transition-all cursor-pointer ${
                  selectedBand === band
                    ? 'bg-foreground text-background'
                    : 'bg-muted hover:bg-muted/80'
                }`}
              >
                {band}
              </button>
            ))}
          </div>

          {/* Selected band details - show total bill as primary when available */}
          <div className="p-4 sm:p-5 rounded-lg bg-muted/30">
            <p className="type-caption text-muted-foreground mb-1">Band {selectedBand} · {bandDescriptions[selectedBand]}</p>
            <p className="type-metric mb-4">
              {formatCurrency(
                totalBandAmounts
                  ? totalBandAmounts[selectedBand as keyof typeof totalBandAmounts]
                  : allBands[selectedBand as keyof typeof allBands],
                { decimals: 2 }
              )}
            </p>
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border/50">
              <div>
                <p className="type-caption text-muted-foreground mb-0.5">Monthly (10 payments)</p>
                <p className="type-body font-semibold tabular-nums">
                  {formatCurrency(
                    (totalBandAmounts
                      ? totalBandAmounts[selectedBand as keyof typeof totalBandAmounts]
                      : allBands[selectedBand as keyof typeof allBands]) / 10,
                    { decimals: 2 }
                  )}
                </p>
              </div>
              <div>
                <p className="type-caption text-muted-foreground mb-0.5">Weekly</p>
                <p className="type-body font-semibold tabular-nums">
                  {formatCurrency(
                    (totalBandAmounts
                      ? totalBandAmounts[selectedBand as keyof typeof totalBandAmounts]
                      : allBands[selectedBand as keyof typeof allBands]) / 52,
                    { decimals: 2 }
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Council's share context - shown when total includes other authorities */}
          {totalBandAmounts && (
            <div className="mt-4 p-3 rounded-lg bg-muted/30">
              <p className="type-body-sm text-muted-foreground">
                <span className="font-medium text-foreground">{selectedCouncil.name}&apos;s share:</span>{' '}
                <span className="font-semibold text-foreground tabular-nums">
                  {formatCurrency(allBands[selectedBand as keyof typeof allBands], { decimals: 2 })}
                </span>
                {' '}of your Band {selectedBand} bill
              </p>
            </div>
          )}

          {/* Band estimation helper */}
          <div className="mt-4 p-3 rounded-lg bg-muted/30">
            <p className="type-caption text-muted-foreground">
              <span className="font-medium text-foreground">Don&apos;t know your band?</span>{' '}
              <a
                href="https://www.gov.uk/council-tax-bands"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-foreground transition-colors cursor-pointer"
              >
                Find your band on GOV.UK
                <span className="sr-only"> (opens in new tab)</span>
              </a>
            </p>
          </div>

          {/* Source link */}
          {detailed?.council_tax_url && (
            <p className="mt-4 pt-3 border-t border-border/30 type-caption text-muted-foreground">
              Source:{' '}
              <a
                href={detailed.council_tax_url}
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-foreground transition-colors cursor-pointer"
              >
                {selectedCouncil.name} council tax rates
                <span className="sr-only"> (opens in new tab)</span>
              </a>
            </p>
          )}
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          SECTION 2.5: Historical Comparison (5-year trend)
          ═══════════════════════════════════════════════════════════════════════ */}
      {councilTax?.band_d_2021 && councilTax?.band_d_2022 && councilTax?.band_d_2023 && councilTax?.band_d_2024 && (
        <section className="card-elevated p-5 sm:p-6">
          <h2 className="type-title-2 mb-1">How your bill has changed</h2>
          <p className="type-body-sm text-muted-foreground mb-5">
            Band D council tax over the last 5 years
          </p>

          {/* 5-year line graph */}
          {(() => {
            const data = [
              { year: '2021-22', amount: councilTax.band_d_2021 },
              { year: '2022-23', amount: councilTax.band_d_2022 },
              { year: '2023-24', amount: councilTax.band_d_2023 },
              { year: '2024-25', amount: councilTax.band_d_2024 },
              { year: '2025-26', amount: councilTax.band_d_2025 },
            ];
            const values = data.map(d => d.amount);
            const minValue = Math.min(...values);
            const maxValue = Math.max(...values);
            const padding = (maxValue - minValue) * 0.2 || 10;
            const chartMin = minValue - padding;
            const chartMax = maxValue + padding;
            const chartHeight = 120;

            // Calculate points for the line
            const points = data.map((item, index) => {
              const x = (index / (data.length - 1)) * 100;
              const y = chartHeight - ((item.amount - chartMin) / (chartMax - chartMin)) * chartHeight;
              return { x, y, ...item };
            });

            // Create SVG path
            const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

            // Create area path (for gradient fill)
            const areaPath = `${linePath} L ${points[points.length - 1].x} ${chartHeight} L ${points[0].x} ${chartHeight} Z`;

            return (
              <div>
                {/* Chart container with explicit height for circle positioning */}
                <div className="relative h-32">
                  <svg
                    viewBox={`0 0 100 ${chartHeight}`}
                    preserveAspectRatio="none"
                    className="w-full h-full"
                  >
                    {/* Gradient definition */}
                    <defs>
                      <linearGradient id="billHistoryGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" className="[stop-color:hsl(var(--foreground))] [stop-opacity:0.08]" />
                        <stop offset="100%" className="[stop-color:hsl(var(--foreground))] [stop-opacity:0]" />
                      </linearGradient>
                    </defs>

                    {/* Area fill */}
                    <path d={areaPath} fill="url(#billHistoryGradient)" />

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
                  </svg>

                  {/* Data points as HTML elements to avoid SVG stretching */}
                  {points.map((point, index) => (
                    <div
                      key={point.year}
                      className={`absolute w-3 h-3 rounded-full border-2 border-foreground -translate-x-1/2 -translate-y-1/2 ${
                        index === points.length - 1 ? 'bg-foreground' : 'bg-background'
                      }`}
                      style={{
                        left: `${point.x}%`,
                        top: `${(point.y / chartHeight) * 100}%`,
                      }}
                    />
                  ))}
                </div>

                {/* X-axis labels - responsive sizing */}
                <div className="flex justify-between mt-4 gap-1">
                  {data.map((item, index) => (
                    <div key={item.year} className="text-center min-w-0 flex-1">
                      <p className={`type-caption sm:type-body-sm truncate ${index === data.length - 1 ? 'font-semibold' : 'text-muted-foreground'}`}>
                        {item.year}
                        {index === data.length - 1 && <span className="hidden sm:inline ml-1.5 type-caption text-muted-foreground font-normal">Current</span>}
                      </p>
                      <p className={`type-caption sm:type-body tabular-nums ${index === data.length - 1 ? 'font-semibold' : 'text-muted-foreground'}`}>
                        {formatCurrency(item.amount, { decimals: 2 })}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}

          {/* 5-year change callout */}
          {(() => {
            const fiveYearChange = councilTax.band_d_2025 - councilTax.band_d_2021;
            const fiveYearPercent = ((councilTax.band_d_2025 - councilTax.band_d_2021) / councilTax.band_d_2021) * 100;
            return (
              <div className="mt-5 p-3 rounded-lg bg-muted/30">
                <div className="flex items-center justify-between">
                  <span className="type-caption text-muted-foreground">Change over 5 years</span>
                  <span className={`type-body-sm font-semibold tabular-nums ${fiveYearChange > 0 ? 'text-negative' : 'text-positive'}`}>
                    {fiveYearChange > 0 ? '+' : ''}{formatCurrency(fiveYearChange, { decimals: 2 })} ({fiveYearPercent > 0 ? '+' : ''}{fiveYearPercent.toFixed(1)}%)
                  </span>
                </div>
              </div>
            );
          })()}

          {/* Source link */}
          <p className="mt-4 pt-3 border-t border-border/30 type-caption text-muted-foreground">
            Source:{' '}
            <a
              href="https://www.gov.uk/government/collections/council-tax-statistics"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-foreground transition-colors cursor-pointer"
            >
              GOV.UK Council Tax Statistics
              <span className="sr-only"> (opens in new tab)</span>
            </a>
          </p>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          SECTION 3: What your council tax pays for
          Combined spending breakdown with service descriptions
          ═══════════════════════════════════════════════════════════════════════ */}
      {spendingCategories.length > 0 && (
        <section className="card-elevated p-5 sm:p-6">
          <h2 className="type-title-2 mb-1">What your council tax pays for</h2>
          <p className="type-body-sm text-muted-foreground mb-5">
            This shows how the budget is structured
            <span className="ml-1 text-muted-foreground/60">(Calculated from published budget)</span>
          </p>

          {/* Service breakdown - Monzo/Apple style with optional drill-down */}
          <div className="space-y-4">
            {spendingCategories.map((category) => {
              const details = SERVICE_DETAILS[category.key];
              const spending = serviceSpendingMap.get(category.key);
              const isExpanded = expandedCategory === category.key;
              const hasDrillDown = !!spending;
              const categoryId = `spending-${category.key}`;

              return (
                <div key={category.key}>
                  {/* Header row: service name + amount — tappable if drill-down data exists */}
                  {hasDrillDown ? (
                    <button
                      onClick={() => setExpandedCategory(isExpanded ? null : category.key)}
                      className="w-full text-left min-h-[44px] cursor-pointer rounded-lg -mx-2 px-2 hover:bg-muted/30 transition-colors"
                      aria-expanded={isExpanded}
                      aria-controls={categoryId}
                    >
                      <div className="flex items-baseline justify-between mb-1">
                        <span className="type-body font-semibold flex items-center gap-1.5">
                          {category.name}
                          <ChevronDown
                            className={`h-3.5 w-3.5 text-muted-foreground transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                            aria-hidden="true"
                          />
                        </span>
                        <span className="type-body font-semibold tabular-nums">
                          {category.yourShare ? formatCurrency(category.yourShare, { decimals: 0 }) : ''}
                        </span>
                      </div>
                      <div className="flex items-baseline justify-between mb-2">
                        <p className="type-caption text-muted-foreground pr-4">
                          {details?.description || ''}
                        </p>
                        <span className="type-caption text-muted-foreground tabular-nums shrink-0">
                          {category.percentage.toFixed(0)}%
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full bg-foreground"
                          style={{ width: `${category.percentage}%` }}
                        />
                      </div>
                    </button>
                  ) : (
                    <div>
                      <div className="flex items-baseline justify-between mb-1">
                        <span className="type-body font-semibold">{category.name}</span>
                        <span className="type-body font-semibold tabular-nums">
                          {category.yourShare ? formatCurrency(category.yourShare, { decimals: 0 }) : ''}
                        </span>
                      </div>
                      <div className="flex items-baseline justify-between mb-2">
                        <p className="type-caption text-muted-foreground pr-4">
                          {details?.description || ''}
                        </p>
                        <span className="type-caption text-muted-foreground tabular-nums shrink-0">
                          {category.percentage.toFixed(0)}%
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full bg-foreground"
                          style={{ width: `${category.percentage}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Expanded drill-down content */}
                  {isExpanded && spending && (
                    <div
                      id={categoryId}
                      role="region"
                      aria-label={`${category.name} spending details`}
                      className="mt-3 rounded-lg bg-muted/20 p-4"
                    >
                      {/* No amounts indicator */}
                      {spending.services.every(s => !s.amount) && (
                        <p className="type-caption text-muted-foreground/60 italic mb-4">
                          Detailed spending amounts not yet published for this category
                        </p>
                      )}

                      {/* Layer 1: Sub-service budget lines */}
                      <div className="space-y-5">
                        {spending.services.map((service, idx) => (
                          <div key={idx} className="flex items-baseline justify-between gap-3">
                            <div className="min-w-0">
                              <p className="type-body font-semibold leading-snug">{service.name}</p>
                              <p className="type-caption text-muted-foreground mt-1">{service.description}</p>
                            </div>
                            <span className="type-body font-semibold tabular-nums shrink-0">
                              {service.amount ? formatBudget(service.amount / 1000) : '—'}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Layer 2: Top contracts */}
                      {spending.contracts && spending.contracts.length > 0 && (
                        <div className="mt-5 pt-4 border-t border-border/50">
                          <p className="type-body-sm font-semibold mb-3">Top contracts</p>
                          <div className="space-y-3">
                            {spending.contracts.map((contract, idx) => (
                              <div key={idx} className="space-y-1">
                                <p className="type-body font-semibold">{contract.supplier}</p>
                                <p className="type-body-sm text-muted-foreground">
                                  {contract.description}
                                </p>
                                <p className="type-caption text-muted-foreground">
                                  {contract.annual_value && `${formatBudget(contract.annual_value / 1000)}/year`}
                                  {contract.annual_value && contract.contract_period && ' · '}
                                  {contract.contract_period && contract.contract_period}
                                </p>
                                {contract.source_url && (
                                  <a
                                    href={contract.source_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="type-caption text-muted-foreground underline hover:text-foreground transition-colors inline-flex items-center gap-1 mt-0.5"
                                  >
                                    Source
                                    <ExternalLink className="h-2.5 w-2.5" aria-hidden="true" />
                                    <span className="sr-only"> (opens in new tab)</span>
                                  </a>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Layer 3: Transparency links */}
                      {spending.transparency_links && spending.transparency_links.length > 0 && (
                        <div className="mt-5 pt-4 border-t border-border/50">
                          <p className="type-body-sm font-semibold mb-3">See the raw data</p>
                          <div className="space-y-2.5">
                            {spending.transparency_links.map((link, idx) => (
                              <div key={idx}>
                                <a
                                  href={link.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="type-body-sm underline hover:text-foreground transition-colors inline-flex items-center gap-1"
                                >
                                  {link.label}
                                  <ExternalLink className="h-3 w-3 text-muted-foreground" aria-hidden="true" />
                                  <span className="sr-only"> (opens in new tab)</span>
                                </a>
                                {link.description && (
                                  <p className="type-caption text-muted-foreground mt-0.5">{link.description}</p>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Context footer */}
          {totalBudget && (
            <div className="mt-5 p-3 rounded-lg bg-muted/30">
              <p className="type-body-sm text-muted-foreground">
                <span className="font-medium text-foreground">Total budget:</span>{' '}
                <span className="font-semibold text-foreground">{formatBudget(totalBudget / 1000)}</span>/year
                {population && (
                  <span className="type-caption"> · Serving {population.toLocaleString('en-GB')} residents</span>
                )}
              </p>
            </div>
          )}

          {/* Source link */}
          <p className="mt-4 pt-3 border-t border-border/30 type-caption text-muted-foreground">
            Source:{' '}
            {detailed?.budget_url ? (
              <a
                href={detailed.budget_url}
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-foreground transition-colors cursor-pointer"
              >
                {selectedCouncil.name} budget
                <span className="sr-only"> (opens in new tab)</span>
              </a>
            ) : (
              <a
                href="https://www.gov.uk/government/collections/local-authority-revenue-expenditure-and-financing"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-foreground transition-colors cursor-pointer"
              >
                GOV.UK Local Authority Finance
                <span className="sr-only"> (opens in new tab)</span>
              </a>
            )}
          </p>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          SECTION 3b: Where the money goes (suppliers + grants)
          Split from spending card for scannability
          ═══════════════════════════════════════════════════════════════════════ */}
      {(detailed?.top_suppliers?.length || detailed?.grant_payments?.length) && (
        <section className="card-elevated p-5 sm:p-6">
          <h2 className="type-title-2 mb-1">Where the money goes</h2>
          <p className="type-body-sm text-muted-foreground mb-6">See exactly who the council pays and which local organisations receive grants</p>

          {/* Top suppliers */}
          {detailed?.top_suppliers && detailed.top_suppliers.length > 0 && (
            <>
              {/* Subsection header */}
              <div className="mb-4">
                <div className="flex items-center justify-between">
                  <h3 className="type-title-3">Who the council pays</h3>
                  <span className="type-caption text-muted-foreground">2024-25</span>
                </div>
                <p className="type-body-sm text-muted-foreground mt-1">The biggest companies and organisations paid by the council</p>
              </div>

              {/* Hook stat */}
              <div className="p-3 rounded-lg bg-muted/30 mb-2">
                <p className="type-body-sm">
                  <span className="font-semibold">Largest supplier:</span>{' '}
                  {detailed.top_suppliers[0].name} — {formatBudget(detailed.top_suppliers[0].annual_spend / 1000)}
                  <span className="text-muted-foreground"> · {detailed.top_suppliers.length} suppliers published</span>
                </p>
              </div>
              {detailed.top_suppliers.some(s => s.description) && (
                <p className="type-caption text-muted-foreground mb-3">Tap any name to see what the money pays for</p>
              )}

              {/* Supplier rows */}
              <div className="space-y-1">
                {(showAllSuppliers
                  ? detailed.top_suppliers
                  : detailed.top_suppliers.slice(0, 5)
                ).map((supplier, idx) => {
                  const isExpanded = expandedSupplier === idx;
                  const hasDescription = !!supplier.description;

                  return hasDescription ? (
                    <button
                      key={idx}
                      onClick={() => setExpandedSupplier(isExpanded ? null : idx)}
                      className="w-full text-left py-3 px-2 -mx-2 rounded-lg hover:bg-muted/30 transition-colors border-b border-border/30 cursor-pointer min-h-[44px]"
                      aria-expanded={isExpanded}
                    >
                      <div className="flex items-baseline justify-between">
                        <div className="min-w-0 mr-3">
                          <span className="type-body font-semibold flex items-center gap-1.5">
                            {supplier.name}
                            <ChevronDown
                              className={`h-3.5 w-3.5 text-muted-foreground transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                              aria-hidden="true"
                            />
                          </span>
                          {supplier.category && (
                            <p className="type-body-sm text-muted-foreground">{supplier.category}</p>
                          )}
                        </div>
                        <span className="type-body font-semibold tabular-nums shrink-0">
                          {formatBudget(supplier.annual_spend / 1000)}
                        </span>
                      </div>
                      {isExpanded && (
                        <div className="mt-2 p-3 bg-muted/20 rounded-lg">
                          <p className="type-body-sm text-muted-foreground leading-relaxed">{supplier.description}</p>
                        </div>
                      )}
                    </button>
                  ) : (
                    <div key={idx} className="py-3 px-2 -mx-2 border-b border-border/30">
                      <div className="flex items-baseline justify-between">
                        <div className="min-w-0 mr-3">
                          <p className="type-body font-semibold">{supplier.name}</p>
                          {supplier.category && (
                            <p className="type-body-sm text-muted-foreground">{supplier.category}</p>
                          )}
                        </div>
                        <span className="type-body font-semibold tabular-nums shrink-0">
                          {formatBudget(supplier.annual_spend / 1000)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Prominent expand button */}
              {detailed.top_suppliers.length > 5 && (
                <button
                  onClick={() => setShowAllSuppliers(!showAllSuppliers)}
                  className="w-full mt-3 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-muted/40 hover:bg-muted/60 transition-colors type-body-sm font-medium text-foreground cursor-pointer min-h-[44px]"
                  aria-expanded={showAllSuppliers}
                >
                  <ChevronDown className={`h-4 w-4 transition-transform ${showAllSuppliers ? 'rotate-180' : ''}`} aria-hidden="true" />
                  {showAllSuppliers
                    ? 'Show less'
                    : `Show all ${detailed.top_suppliers.length} suppliers`
                  }
                </button>
              )}
            </>
          )}

          {/* Grant payments */}
          {detailed?.grant_payments && detailed.grant_payments.length > 0 && (
            <div className={detailed?.top_suppliers?.length ? "mt-8 pt-6 border-t border-border/50" : ""}>
              {/* Subsection header */}
              <div className="mb-4">
                <div className="flex items-center justify-between">
                  <h3 className="type-title-3">Grants to local organisations</h3>
                  <span className="type-caption text-muted-foreground">2022-23</span>
                </div>
                <p className="type-body-sm text-muted-foreground mt-1">Money given to charities and community groups</p>
              </div>

              {/* Hook stat */}
              {(() => {
                const largest = [...detailed.grant_payments].sort((a, b) => b.amount - a.amount)[0];
                return (
                  <div className="p-3 rounded-lg bg-muted/30 mb-2">
                    <p className="type-body-sm">
                      <span className="font-semibold">Largest grant:</span>{' '}
                      {largest.recipient} — {formatCurrency(largest.amount, { decimals: 0 })}
                      <span className="text-muted-foreground"> · {detailed.grant_payments.length} grants published</span>
                    </p>
                  </div>
                );
              })()}
              {detailed.grant_payments.some(g => g.description) && (
                <p className="type-caption text-muted-foreground mb-3">Tap any name to see what the grant funds</p>
              )}

              {/* Grant rows */}
              <div className="space-y-1">
                {(showAllGrants
                  ? detailed.grant_payments
                  : detailed.grant_payments.slice(0, 5)
                ).map((grant, idx) => {
                  const isExpanded = expandedGrant === idx;
                  const hasDescription = !!grant.description;

                  return hasDescription ? (
                    <button
                      key={idx}
                      onClick={() => setExpandedGrant(isExpanded ? null : idx)}
                      className="w-full text-left py-3 px-2 -mx-2 rounded-lg hover:bg-muted/30 transition-colors border-b border-border/30 cursor-pointer min-h-[44px]"
                      aria-expanded={isExpanded}
                    >
                      <div className="flex items-baseline justify-between">
                        <div className="min-w-0 mr-3">
                          <span className="type-body font-semibold flex items-center gap-1.5">
                            {grant.recipient}
                            <ChevronDown
                              className={`h-3.5 w-3.5 text-muted-foreground transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                              aria-hidden="true"
                            />
                          </span>
                          {grant.purpose && (
                            <p className="type-body-sm text-muted-foreground">{grant.purpose}</p>
                          )}
                        </div>
                        <span className="type-body font-semibold tabular-nums shrink-0">
                          {formatCurrency(grant.amount, { decimals: 0 })}
                        </span>
                      </div>
                      {isExpanded && (
                        <div className="mt-2 p-3 bg-muted/20 rounded-lg">
                          <p className="type-body-sm text-muted-foreground leading-relaxed">{grant.description}</p>
                        </div>
                      )}
                    </button>
                  ) : (
                    <div key={idx} className="py-3 px-2 -mx-2 border-b border-border/30">
                      <div className="flex items-baseline justify-between">
                        <div className="min-w-0 mr-3">
                          <p className="type-body font-semibold">{grant.recipient}</p>
                          {grant.purpose && (
                            <p className="type-body-sm text-muted-foreground">{grant.purpose}</p>
                          )}
                        </div>
                        <span className="type-body font-semibold tabular-nums shrink-0">
                          {formatCurrency(grant.amount, { decimals: 0 })}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Prominent expand button */}
              {detailed.grant_payments.length > 5 && (
                <button
                  onClick={() => setShowAllGrants(!showAllGrants)}
                  className="w-full mt-3 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-muted/40 hover:bg-muted/60 transition-colors type-body-sm font-medium text-foreground cursor-pointer min-h-[44px]"
                  aria-expanded={showAllGrants}
                >
                  <ChevronDown className={`h-4 w-4 transition-transform ${showAllGrants ? 'rotate-180' : ''}`} aria-hidden="true" />
                  {showAllGrants
                    ? 'Show less'
                    : `Show all ${detailed.grant_payments.length} grants`
                  }
                </button>
              )}
            </div>
          )}

          {/* Section transparency links for finances */}
          {detailed?.section_transparency?.finances && (
            <div className="mt-6 pt-4 border-t border-border/40">
              <p className="type-caption font-semibold text-muted-foreground mb-2">See the raw data</p>
              <div className="space-y-1.5">
                {detailed.section_transparency.finances.map((link, idx) => (
                  <div key={idx}>
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="type-body-sm underline hover:text-foreground transition-colors inline-flex items-center gap-1"
                    >
                      {link.label}
                      <ExternalLink className="h-3 w-3 text-muted-foreground" aria-hidden="true" />
                      <span className="sr-only"> (opens in new tab)</span>
                    </a>
                    {link.description && (
                      <p className="type-body-sm text-muted-foreground">{link.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          SECTION 5: Financial Health (if detailed data exists)
          ═══════════════════════════════════════════════════════════════════════ */}
      {(detailed?.savings_achieved || detailed?.reserves || detailed?.mtfs_deficit) && (
        <section className="card-elevated p-5 sm:p-6">
          <h2 className="type-title-2 mb-1">Council finances</h2>
          <p className="type-body-sm text-muted-foreground mb-5">Key financial figures</p>

          {/* Primary metric - reserves (most important for financial health) */}
          {detailed.reserves && (
            <div className="mb-5">
              <p className="type-caption text-muted-foreground mb-1">Emergency reserves</p>
              <p className="type-metric tabular-nums">
                {formatCurrency(detailed.reserves, { decimals: 0 })}
              </p>
              {reservesInWeeks && (
                <p className="type-body-sm text-muted-foreground mt-1">
                  Enough to cover {reservesInWeeks} weeks of running costs
                </p>
              )}
            </div>
          )}

          {/* Secondary metrics as simple list */}
          {(detailed.savings_achieved || detailed.mtfs_deficit) && (
            <div className="space-y-3 pt-4 border-t border-border/50">
              {detailed.savings_achieved && (
                <div className="flex items-baseline justify-between">
                  <span className="type-body-sm text-muted-foreground">Saved this year</span>
                  <span className="type-body font-semibold tabular-nums text-positive">
                    {formatCurrency(detailed.savings_achieved, { decimals: 0 })}
                  </span>
                </div>
              )}
              {detailed.mtfs_deficit && (
                <div className="flex items-baseline justify-between">
                  <span className="type-body-sm text-muted-foreground">Budget gap to close</span>
                  <span className="type-body font-semibold tabular-nums text-negative">
                    {formatCurrency(detailed.mtfs_deficit, { decimals: 0 })}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Context footer */}
          <div className="mt-5 p-3 rounded-lg bg-muted/30">
            <p className="type-caption text-muted-foreground">
              <span className="font-medium text-foreground">About reserves:</span>{' '}
              Savings for emergencies. This is normal practice.
            </p>
          </div>

          {/* Source link */}
          <p className="mt-4 pt-3 border-t border-border/30 type-caption text-muted-foreground">
            Source:{' '}
            {detailed?.budget_url ? (
              <a
                href={detailed.budget_url}
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-foreground transition-colors cursor-pointer"
              >
                {selectedCouncil.name} budget
                <span className="sr-only"> (opens in new tab)</span>
              </a>
            ) : detailed?.accounts_url ? (
              <a
                href={detailed.accounts_url}
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-foreground transition-colors cursor-pointer"
              >
                {selectedCouncil.name} accounts
                <span className="sr-only"> (opens in new tab)</span>
              </a>
            ) : (
              <a
                href={detailed?.website || `https://www.gov.uk/find-local-council`}
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-foreground transition-colors cursor-pointer"
              >
                {selectedCouncil.name} website
                <span className="sr-only"> (opens in new tab)</span>
              </a>
            )}
          </p>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          SECTION 5b: Accountability (if issues exist)
          Shows Section 114 notices, government intervention, audit concerns
          ═══════════════════════════════════════════════════════════════════════ */}
      {detailed?.accountability && (
        <section className="card-elevated p-5 sm:p-6">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="h-5 w-5 text-negative shrink-0" />
            <h2 className="type-title-2">Accountability</h2>
          </div>
          <p className="type-body-sm text-muted-foreground mb-5">
            Financial concerns flagged by auditors or government
          </p>

          <div className="space-y-3">
            {/* Section 114 notice */}
            {detailed.accountability.section_114?.issued && (
              <div className="p-4 rounded-lg bg-negative/10 border border-negative/20">
                <div className="flex items-start gap-3">
                  <AlertOctagon className="h-5 w-5 text-negative shrink-0 mt-0.5" />
                  <div>
                    <p className="type-body font-semibold text-negative">
                      Section 114 notice issued
                    </p>
                    <p className="type-body-sm text-muted-foreground mt-1">
                      {selectedCouncil.name} said it could not balance its budget
                      {detailed.accountability.section_114.dates?.[0] && (
                        <> in {new Date(detailed.accountability.section_114.dates[0]).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}</>
                      )}
                      {(detailed.accountability.section_114.dates?.length ?? 0) > 1 && (
                        <> (and again in {new Date(detailed.accountability.section_114.dates![detailed.accountability.section_114.dates!.length - 1]).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })})</>
                      )}
                      . This is rare — only 8 councils have done this since 2018.
                    </p>
                    {detailed.accountability.section_114.reason && (
                      <p className="type-caption text-muted-foreground mt-2">
                        {detailed.accountability.section_114.reason}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Government intervention */}
            {detailed.accountability.government_intervention && (
              <div className="p-4 rounded-lg bg-negative/5 border border-border/50">
                <div className="flex items-start gap-3">
                  <FileWarning className="h-5 w-5 text-negative/80 shrink-0 mt-0.5" />
                  <div>
                    <p className="type-body font-semibold">
                      Government commissioners appointed
                    </p>
                    <p className="type-body-sm text-muted-foreground mt-1">
                      {detailed.accountability.intervention_reason || `The government sent in commissioners to oversee ${selectedCouncil.name}'s finances.`}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Audit opinion */}
            {detailed.accountability.audit_opinion && (
              <div className="flex items-baseline justify-between p-3 rounded-lg bg-muted/30">
                <span className="type-body-sm text-muted-foreground">
                  Audit opinion{detailed.accountability.audit_year ? ` (${detailed.accountability.audit_year})` : ''}
                </span>
                <span className={`type-body-sm font-semibold ${
                  detailed.accountability.audit_opinion === 'Qualified' || detailed.accountability.audit_opinion === 'Adverse'
                    ? 'text-negative'
                    : detailed.accountability.audit_opinion === 'Disclaimed'
                    ? 'text-muted-foreground'
                    : 'text-foreground'
                }`}>
                  {detailed.accountability.audit_opinion}
                </span>
              </div>
            )}
          </div>

          {/* Context footer */}
          <div className="mt-5 p-3 rounded-lg bg-muted/30">
            <p className="type-caption text-muted-foreground">
              <span className="font-medium text-foreground">What is a Section 114 notice?</span>{' '}
              When a council cannot balance its budget, the chief finance officer must issue a Section 114 notice. This stops all new spending except essential services.
            </p>
          </div>

          {/* Source */}
          <p className="mt-4 pt-3 border-t border-border/30 type-caption text-muted-foreground">
            Source:{' '}
            <a
              href="https://www.instituteforgovernment.org.uk/explainer/local-authority-section-114-notices"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-foreground transition-colors cursor-pointer"
            >
              Institute for Government
              <span className="sr-only"> (opens in new tab)</span>
            </a>
          </p>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          SECTION 8: Leadership (if detailed data exists)
          ═══════════════════════════════════════════════════════════════════════ */}
      {(detailed?.chief_executive || detailed?.cabinet?.find(m => m.role === 'Leader')) && (() => {
        const leader = detailed.cabinet?.find(m => m.role === 'Leader');
        const otherMembers = detailed.cabinet?.filter(m => m.role !== 'Leader') || [];
        const visibleMembers = showAllCabinet ? otherMembers : otherMembers.slice(0, 4);
        return (
        <section className="card-elevated p-5 sm:p-6">
          <h2 className="type-title-2 mb-1">Who runs the council</h2>
          <p className="type-body-sm text-muted-foreground mb-5">
            {detailed.chief_executive_salary || detailed.staff_fte ? 'Leadership, pay and staffing' : 'Council leadership'}
          </p>

          {/* All leaders in consistent grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {leader && (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                  <User className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="min-w-0 space-y-1">
                  <p className="type-body-sm font-semibold leading-none truncate">{leader.name}</p>
                  <p className="type-caption leading-none text-muted-foreground">Council Leader</p>
                </div>
              </div>
            )}

            {detailed.chief_executive && (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                  <User className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="min-w-0 space-y-1">
                  <p className="type-body-sm font-semibold leading-none truncate">{detailed.chief_executive}</p>
                  <p className="type-caption leading-none text-muted-foreground">Chief Executive</p>
                  {detailed.chief_executive_salary && (
                    <p className="type-caption leading-none text-muted-foreground">
                      Salary: {formatCurrency(detailed.chief_executive_salary, { decimals: 0 })}/year
                      {detailed.chief_executive_total_remuneration && (
                        <span> · {formatCurrency(detailed.chief_executive_total_remuneration, { decimals: 0 })} total package</span>
                      )}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Cabinet members in same grid */}
            {visibleMembers.map((member, index) => (
              <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                  <User className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="min-w-0 space-y-1">
                  <p className="type-body-sm font-semibold leading-none truncate">{member.name}</p>
                  <p className="type-caption leading-none text-muted-foreground truncate">{member.portfolio}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Show all cabinet button */}
          {otherMembers.length > 4 && (
            <button
              onClick={() => setShowAllCabinet(!showAllCabinet)}
              className="w-full mt-3 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-muted/40 hover:bg-muted/60 transition-colors type-body-sm font-medium text-foreground cursor-pointer min-h-[44px]"
              aria-expanded={showAllCabinet}
            >
              <ChevronDown className={`h-4 w-4 transition-transform ${showAllCabinet ? 'rotate-180' : ''}`} aria-hidden="true" />
              {showAllCabinet
                ? 'Show less'
                : `Show all ${otherMembers.length + (leader ? 1 : 0)} cabinet members`
              }
            </button>
          )}

          {/* Workforce stats */}
          {(detailed.staff_fte || detailed.agency_staff_count) && (
            <div className="mt-4 p-3 rounded-lg bg-muted/30">
              <p className="type-body-sm font-semibold mb-1">Council workforce</p>
              <div className="flex flex-wrap gap-x-6 gap-y-1">
                {detailed.staff_fte && (
                  <p className="type-caption text-muted-foreground">
                    <span className="font-medium text-foreground">{detailed.staff_fte.toLocaleString('en-GB')}</span> staff (FTE)
                  </p>
                )}
                {detailed.agency_staff_count && (
                  <p className="type-caption text-muted-foreground">
                    <span className="font-medium text-foreground">{detailed.agency_staff_count.toLocaleString('en-GB')}</span> agency staff
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Councillor allowances summary */}
          {detailed.councillor_basic_allowance && detailed.total_councillors && (
            <div className="mt-3 p-3 rounded-lg bg-muted/30">
              <p className="type-body-sm font-semibold mb-1">Councillor allowances</p>
              <p className="type-caption text-muted-foreground">
                <span className="font-medium text-foreground">{formatCurrency(detailed.councillor_basic_allowance, { decimals: 0 })}</span> basic allowance × {detailed.total_councillors} councillors
                {detailed.total_allowances_cost && (
                  <span> · Total cost: <span className="font-medium text-foreground">{formatCurrency(detailed.total_allowances_cost, { decimals: 0 })}</span>/year</span>
                )}
              </p>
            </div>
          )}

          {(detailed.total_councillors || detailed.councillors_url) && (
            <div className="mt-4">
              <a
                href={detailed.councillors_url || "https://www.writetothem.com/"}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted transition-colors group cursor-pointer"
              >
                <div>
                  <p className="type-body-sm font-semibold group-hover:text-foreground transition-colors">
                    Find your councillor
                    <span className="sr-only"> (opens in new tab)</span>
                  </p>
                  <p className="type-caption text-muted-foreground">
                    {detailed.total_councillors
                      ? `${detailed.total_councillors} councillors represent this area`
                      : "View all councillors on the council website"}
                  </p>
                </div>
                <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-foreground shrink-0 ml-3" aria-hidden="true" />
              </a>
            </div>
          )}
        </section>
        );
      })()}

      {/* ═══════════════════════════════════════════════════════════════════════
          SECTION 8b: Pay & allowances (councillor detail + salary bands)
          Split from leadership card for scannability
          ═══════════════════════════════════════════════════════════════════════ */}
      {(detailed?.councillor_allowances_detail?.length || detailed?.salary_bands?.length) && (
        <section className="card-elevated p-5 sm:p-6">
          <h2 className="type-title-2 mb-1">Pay & allowances</h2>
          <p className="type-body-sm text-muted-foreground mb-5">Published salary and allowance data</p>

          {/* Councillor allowances detail table */}
          {detailed.councillor_allowances_detail && detailed.councillor_allowances_detail.length > 0 && (
            <>
              {/* Subsection header with year chip */}
              <div className="flex items-center justify-between mb-3">
                <p className="type-body-sm font-semibold">Councillor allowances</p>
                <span className="type-caption text-muted-foreground">2024-25</span>
              </div>
              <p className="type-body-sm text-muted-foreground mb-3">Allowances for elected role — most councillors also hold other jobs</p>

              {/* Hook stat */}
              {(() => {
                const highest = [...detailed.councillor_allowances_detail].sort((a, b) => b.total - a.total)[0];
                return (
                  <div className="p-3 rounded-lg bg-muted/30 mb-4">
                    <p className="type-body-sm">
                      <span className="font-semibold">Highest allowance:</span>{' '}
                      {highest.name} — {formatCurrency(highest.total, { decimals: 0 })}
                      <span className="text-muted-foreground"> · {detailed.councillor_allowances_detail.length} councillors</span>
                    </p>
                  </div>
                );
              })()}

              {/* Councillor rows */}
              <div className="space-y-0">
                {(showAllCouncillors
                  ? detailed.councillor_allowances_detail
                  : detailed.councillor_allowances_detail.slice(0, 5)
                ).map((cllr, idx) => (
                  <div key={idx} className="flex items-baseline justify-between py-2.5 px-2 -mx-2 rounded hover:bg-muted/30 transition-colors">
                    <div className="min-w-0 mr-3">
                      <p className="type-body-sm font-medium truncate">{cllr.name}</p>
                      <p className="type-body-sm text-muted-foreground">
                        Basic {formatCurrency(cllr.basic, { decimals: 0 })}
                        {cllr.special ? ` + SRA ${formatCurrency(cllr.special, { decimals: 0 })}` : ''}
                        {cllr.travel ? ` + Travel ${formatCurrency(cllr.travel, { decimals: 0 })}` : ''}
                      </p>
                    </div>
                    <span className="type-body-sm font-semibold tabular-nums shrink-0">
                      {formatCurrency(cllr.total, { decimals: 0 })}
                    </span>
                  </div>
                ))}
              </div>

              {/* Prominent expand button */}
              {detailed.councillor_allowances_detail.length > 5 && (
                <button
                  onClick={() => setShowAllCouncillors(!showAllCouncillors)}
                  className="w-full mt-3 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-muted/40 hover:bg-muted/60 transition-colors type-body-sm font-medium text-foreground cursor-pointer min-h-[44px]"
                  aria-expanded={showAllCouncillors}
                >
                  <ChevronDown className={`h-4 w-4 transition-transform ${showAllCouncillors ? 'rotate-180' : ''}`} aria-hidden="true" />
                  {showAllCouncillors
                    ? 'Show less'
                    : `Show all ${detailed.councillor_allowances_detail.length} councillors`
                  }
                </button>
              )}
            </>
          )}

          {/* Salary band chart */}
          {detailed.salary_bands && detailed.salary_bands.length > 0 && (() => {
            const maxCount = Math.max(...detailed.salary_bands!.map(b => b.count)) || 1;
            const totalStaff = detailed.salary_bands!.reduce((sum, b) => sum + b.count, 0);
            return (
              <div className={detailed?.councillor_allowances_detail?.length ? "mt-6 pt-5 border-t border-border/50" : ""}>
                <p className="type-body-sm font-semibold mb-1">Staff earning over £50,000</p>
                <p className="type-body-sm text-muted-foreground mb-4">{totalStaff.toLocaleString('en-GB')} staff in salary bands above £50k</p>
                <div className="space-y-2.5">
                  {detailed.salary_bands!.map((band, idx) => (
                    <div key={idx}>
                      <div className="flex items-baseline justify-between mb-1">
                        <span className="type-body-sm text-muted-foreground">{band.band}</span>
                        <span className="type-body-sm font-medium tabular-nums">{band.count}</span>
                      </div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full bg-foreground"
                          style={{ width: `${(band.count / maxCount) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}

          {/* Governance transparency links */}
          {detailed.governance_transparency && detailed.governance_transparency.length > 0 && (
            <div className="mt-6 pt-4 border-t border-border/40">
              <p className="type-caption font-semibold text-muted-foreground mb-2">See the raw data</p>
              <div className="space-y-1.5">
                {detailed.governance_transparency.map((link, idx) => (
                  <div key={idx}>
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="type-body-sm underline hover:text-foreground transition-colors inline-flex items-center gap-1"
                    >
                      {link.label}
                      <ExternalLink className="h-3 w-3 text-muted-foreground" aria-hidden="true" />
                      <span className="sr-only"> (opens in new tab)</span>
                    </a>
                    {link.description && (
                      <p className="type-body-sm text-muted-foreground">{link.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          SECTION 8: Who to contact (for two-tier areas)
          Adjacent to leadership for council info grouping
          ═══════════════════════════════════════════════════════════════════════ */}
      {isDistrictCouncil && (
        <section className="card-elevated p-5 sm:p-6">
          <h2 className="type-title-2 mb-1">Who to contact</h2>
          <p className="type-body-sm text-muted-foreground mb-5">
            You have two councils. Here&apos;s who handles what.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* District council card */}
            <div className="p-4 rounded-lg bg-foreground/5 border border-foreground/10">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-foreground/10 flex items-center justify-center shrink-0">
                  <Home className="h-4 w-4 text-foreground" aria-hidden="true" />
                </div>
                <p className="type-body-sm font-semibold">{selectedCouncil.name}</p>
              </div>
              <div className="space-y-2 mb-4">
                {CONTACT_ISSUES.district.map((item, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-muted-foreground shrink-0" aria-hidden="true" />
                    <span className="type-caption text-muted-foreground">{item.issue}</span>
                  </div>
                ))}
              </div>
              {/* CTA for district council */}
              {detailed?.website && (
                <a
                  href={detailed.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-lg bg-foreground text-background type-body-sm font-semibold hover:bg-foreground/90 transition-colors cursor-pointer"
                >
                  Contact {selectedCouncil.name}
                  <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                  <span className="sr-only">(opens in new tab)</span>
                </a>
              )}
            </div>

            {/* County council card */}
            {(() => {
              const countyPrecept = detailed?.precepts?.find(p => p.authority.toLowerCase().includes('county'));
              const countyLink = countyPrecept ? findLinkedCouncil(countyPrecept.authority) : null;
              const countyName = countyPrecept?.authority.replace(' Council', '') || null;
              const countyWebsite = countyLink?.council?.detailed?.website;

              if (!countyName) return null;

              return (
                <div className="p-4 rounded-lg bg-muted/30">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                      <Building2 className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                    </div>
                    <p className="type-body-sm font-semibold">{countyName}</p>
                  </div>
                  <div className="space-y-2 mb-4">
                    {CONTACT_ISSUES.county.map((item, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <Check className="h-3.5 w-3.5 text-muted-foreground shrink-0" aria-hidden="true" />
                        <span className="type-caption text-muted-foreground">{item.issue}</span>
                      </div>
                    ))}
                  </div>
                  {/* CTA for county council - link to their page or external site */}
                  {countyLink ? (
                    <Link
                      href={`/council/${countyLink.slug}`}
                      className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-lg bg-muted text-foreground type-body-sm font-semibold hover:bg-muted/70 transition-colors cursor-pointer"
                    >
                      View {countyName} budget
                      <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
                    </Link>
                  ) : countyWebsite ? (
                    <a
                      href={countyWebsite}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-lg bg-muted text-foreground type-body-sm font-semibold hover:bg-muted/70 transition-colors cursor-pointer"
                    >
                      Contact {countyName}
                      <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                      <span className="sr-only">(opens in new tab)</span>
                    </a>
                  ) : null}
                </div>
              );
            })()}
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          SECTION 8a: What your money does (universal — all council types)
          Shows service outcomes from GOV.UK published data
          ═══════════════════════════════════════════════════════════════════════ */}
      {detailed?.service_outcomes && (
        <section className="card-elevated p-5 sm:p-6">
          <h2 className="type-title-2 mb-1">What your money does</h2>
          <p className="type-body-sm text-muted-foreground mb-5">
            How {selectedCouncil.name} is performing
          </p>

          {/* Metrics grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {detailed.service_outcomes.waste?.recycling_rate_percent != null && (() => {
              const ctx = getRecyclingContext(detailed.service_outcomes.waste.recycling_rate_percent, selectedCouncil.type);
              return (
                <div className="p-3 rounded-lg bg-muted/30">
                  <div className="flex items-center gap-2 mb-1">
                    <Recycle className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                    <p className="type-caption text-muted-foreground">Recycling rate</p>
                  </div>
                  <p className="type-metric font-semibold tabular-nums">{detailed.service_outcomes.waste.recycling_rate_percent.toFixed(1)}%</p>
                  {detailed.service_outcomes.waste.year && (
                    <p className="type-caption text-muted-foreground/60">{detailed.service_outcomes.waste.year}</p>
                  )}
                  <p className="type-caption text-muted-foreground/60 mt-1">
                    Average for {ctx.compareLabel}: {ctx.compareAverage}%
                  </p>
                </div>
              );
            })()}

            {detailed.service_outcomes.housing?.homes_built != null && detailed.service_outcomes.housing.homes_built > 0 && (() => {
              const ctx = getHomesBuiltContext(detailed.service_outcomes.housing!.homes_built!, selectedCouncil.type);
              return (
                <div className="p-3 rounded-lg bg-muted/30">
                  <div className="flex items-center gap-2 mb-1">
                    <Hammer className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                    <p className="type-caption text-muted-foreground">Homes built</p>
                  </div>
                  <p className="type-metric font-semibold tabular-nums">{detailed.service_outcomes.housing!.homes_built!.toLocaleString('en-GB')}</p>
                  {detailed.service_outcomes.housing!.homes_built_year && (
                    <p className="type-caption text-muted-foreground/60">{detailed.service_outcomes.housing!.homes_built_year}</p>
                  )}
                  {detailed.service_outcomes.housing!.homes_target ? (
                    <p className="type-caption text-muted-foreground/60 mt-1">
                      Government target: {detailed.service_outcomes.housing!.homes_target.toLocaleString('en-GB')}/yr
                    </p>
                  ) : (
                    <p className="type-caption text-muted-foreground/60 mt-1">
                      Average for {ctx.compareLabel}: {ctx.compareAverage.toLocaleString('en-GB')}
                    </p>
                  )}
                </div>
              );
            })()}

            {/* Roads data (highway authorities) — condition % preferred, miles as fallback */}
            {detailed.service_outcomes.roads?.condition_good_percent != null ? (() => {
              const roadCtx = getRoadConditionContext(detailed.service_outcomes.roads!.condition_good_percent!, selectedCouncil.type);
              return (
                <div className="p-3 rounded-lg bg-muted/30">
                  <div className="flex items-center gap-2 mb-1">
                    <Car className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                    <p className="type-caption text-muted-foreground">Road condition</p>
                  </div>
                  <p className="type-metric font-semibold tabular-nums">{detailed.service_outcomes.roads!.condition_good_percent}%</p>
                  <p className="type-caption text-muted-foreground/60">in good or acceptable condition</p>
                  <p className="type-caption text-muted-foreground/60 mt-1">
                    Average for {roadCtx.compareLabel}: {roadCtx.compareAverage}%
                  </p>
                </div>
              );
            })() : detailed.service_outcomes.roads?.maintained_miles ? (
              <div className="p-3 rounded-lg bg-muted/30">
                <div className="flex items-center gap-2 mb-1">
                  <Car className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                  <p className="type-caption text-muted-foreground">Roads maintained</p>
                </div>
                <p className="type-metric font-semibold tabular-nums">{detailed.service_outcomes.roads.maintained_miles.toLocaleString('en-GB')}</p>
                <p className="type-caption text-muted-foreground/60">miles</p>
              </div>
            ) : null}

            {detailed.service_outcomes.roads?.potholes_repaired && (
              <div className="p-3 rounded-lg bg-muted/30">
                <div className="flex items-center gap-2 mb-1">
                  <Hammer className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                  <p className="type-caption text-muted-foreground">Potholes fixed</p>
                </div>
                <p className="type-metric font-semibold tabular-nums">{detailed.service_outcomes.roads.potholes_repaired.toLocaleString('en-GB')}</p>
                <p className="type-caption text-muted-foreground/60">2025</p>
              </div>
            )}

            {detailed.service_outcomes.libraries?.count && (
              <div className="p-3 rounded-lg bg-muted/30">
                <div className="flex items-center gap-2 mb-1">
                  <BookOpen className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                  <p className="type-caption text-muted-foreground">Libraries</p>
                </div>
                <p className="type-metric font-semibold tabular-nums">{detailed.service_outcomes.libraries.count}</p>
                {detailed.service_outcomes.libraries.visits_annual && (
                  <p className="type-caption text-muted-foreground/60">{(detailed.service_outcomes.libraries.visits_annual / 1000000).toFixed(1)}m visits/year</p>
                )}
              </div>
            )}

            {detailed.service_outcomes.population_served && (
              <div className="p-3 rounded-lg bg-muted/30">
                <div className="flex items-center gap-2 mb-1">
                  <Users className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                  <p className="type-caption text-muted-foreground">People served</p>
                </div>
                <p className="type-metric font-semibold tabular-nums">{(detailed.service_outcomes.population_served / 1000000).toFixed(1)}m</p>
              </div>
            )}
          </div>

          {/* Service quality ratings - Ofsted / CQC */}
          {(detailed.service_outcomes.children_services?.ofsted_rating || detailed.service_outcomes.adult_social_care?.cqc_rating) && (
            <div className="mt-5 pt-5 border-t border-border/50">
              <p className="type-body-sm font-semibold mb-3">Service quality</p>
              <div className="space-y-2">
                {detailed.service_outcomes.children_services?.ofsted_rating && (() => {
                  const ofstedCtx = getOfstedContext(detailed.service_outcomes.children_services.ofsted_rating);
                  return (
                    <div className="p-3 rounded-lg bg-muted/30">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                          <span className="type-body-sm">Children&apos;s services</span>
                        </div>
                        <span className={`type-body-sm font-semibold px-2.5 py-0.5 rounded-full ${
                          detailed.service_outcomes.children_services.ofsted_rating === 'Outstanding'
                            ? 'bg-positive/10 text-positive'
                            : detailed.service_outcomes.children_services.ofsted_rating === 'Good'
                            ? 'bg-positive/10 text-positive'
                            : detailed.service_outcomes.children_services.ofsted_rating === 'Requires improvement'
                            ? 'bg-negative/10 text-negative'
                            : 'bg-negative/20 text-negative'
                        }`}>
                          {detailed.service_outcomes.children_services.ofsted_rating}
                          <span className="sr-only"> rated by Ofsted</span>
                        </span>
                      </div>
                      <p className="type-caption text-muted-foreground/60 mt-1.5">
                        {ofstedCtx.sameRatingCount} of {ofstedCtx.totalAssessed} councils rated {detailed.service_outcomes.children_services.ofsted_rating}
                      </p>
                    </div>
                  );
                })()}

                {detailed.service_outcomes.adult_social_care?.cqc_rating && (
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                    <div className="flex items-center gap-2">
                      <Heart className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                      <span className="type-body-sm">Adult social care</span>
                    </div>
                    <span className={`type-body-sm font-semibold px-2.5 py-0.5 rounded-full ${
                      detailed.service_outcomes.adult_social_care.cqc_rating === 'Outstanding'
                        ? 'bg-positive/10 text-positive'
                        : detailed.service_outcomes.adult_social_care.cqc_rating === 'Good'
                        ? 'bg-positive/10 text-positive'
                        : detailed.service_outcomes.adult_social_care.cqc_rating === 'Requires improvement'
                        ? 'bg-negative/10 text-negative'
                        : 'bg-negative/20 text-negative'
                    }`}>
                      {detailed.service_outcomes.adult_social_care.cqc_rating}
                      <span className="sr-only"> rated by CQC</span>
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Source */}
          <p className="mt-4 pt-3 border-t border-border/30 type-caption text-muted-foreground">
            Source:{' '}
            {detailed.service_outcomes.waste && (
              <><a
                href="https://www.gov.uk/government/statistical-data-sets/env18-local-authority-collected-waste-annual-results-tables"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-foreground transition-colors cursor-pointer"
              >
                DEFRA waste statistics
                <span className="sr-only"> (opens in new tab)</span>
              </a></>
            )}
            {detailed.service_outcomes.housing?.homes_built && (
              <>{detailed.service_outcomes.waste ? ' · ' : ''}<a
                href="https://www.gov.uk/government/statistical-data-sets/live-tables-on-net-supply-of-housing"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-foreground transition-colors cursor-pointer"
              >
                MHCLG housing supply
                <span className="sr-only"> (opens in new tab)</span>
              </a></>
            )}
            {detailed.service_outcomes.roads?.condition_good_percent != null && (
              <>{(detailed.service_outcomes.waste || detailed.service_outcomes.housing?.homes_built) ? ' · ' : ''}<a
                href="https://www.gov.uk/government/statistical-data-sets/road-condition-statistics-data-tables-rdc"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-foreground transition-colors cursor-pointer"
              >
                DfT road condition
                <span className="sr-only"> (opens in new tab)</span>
              </a></>
            )}
            {detailed.service_outcomes.children_services?.ofsted_rating && (
              <>{' · '}<a
                href="https://www.gov.uk/government/publications/five-year-ofsted-inspection-data"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-foreground transition-colors cursor-pointer"
              >
                Ofsted
                <span className="sr-only"> (opens in new tab)</span>
              </a></>
            )}
          </p>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          SECTION 8a.2: Council performance (KPIs + waste + roads)
          Split from outcomes card for scannability
          ═══════════════════════════════════════════════════════════════════════ */}
      {(detailed?.performance_kpis?.length || detailed?.waste_destinations?.length || detailed?.service_outcomes?.roads?.maintenance_backlog) && (
        <section className="card-elevated p-5 sm:p-6">
          <h2 className="type-title-2 mb-1">Council performance</h2>
          <p className="type-body-sm text-muted-foreground mb-5">Targets, waste and road maintenance</p>

          {/* Performance KPIs with RAG badges */}
          {detailed.performance_kpis && detailed.performance_kpis.length > 0 && (
            <>
              <div className="space-y-2">
                {detailed.performance_kpis.map((kpi, idx) => (
                  <div key={idx} className="p-3 rounded-lg bg-muted/30">
                    <div className="flex items-center justify-between gap-3">
                      <p className="type-body-sm font-medium min-w-0">{kpi.metric}</p>
                      <span className={`type-body-sm font-semibold px-2.5 py-0.5 rounded-full shrink-0 ${
                        kpi.status === 'green'
                          ? 'bg-positive/10 text-positive'
                          : kpi.status === 'amber'
                          ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                          : 'bg-negative/20 text-negative'
                      }`}>
                        {kpi.value}
                        <span className="sr-only"> — {kpi.status} status</span>
                      </span>
                    </div>
                    <p className="type-body-sm text-muted-foreground mt-1">
                      {kpi.target && `Target: ${kpi.target} · `}{kpi.period}
                    </p>
                  </div>
                ))}
              </div>
              {detailed.sources && detailed.sources.length > 0 && (
                <p className="mt-3 type-caption text-muted-foreground">
                  Source:{' '}
                  <a
                    href={detailed.sources[0].url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline hover:text-foreground transition-colors"
                  >
                    {detailed.sources[0].title}
                    <span className="sr-only"> (opens in new tab)</span>
                  </a>
                </p>
              )}
            </>
          )}

          {/* Waste destinations chart */}
          {detailed.waste_destinations && detailed.waste_destinations.length > 0 && (() => {
            const maxPct = Math.max(...detailed.waste_destinations!.map(w => w.percentage));
            return (
              <div className={detailed?.performance_kpis?.length ? "mt-6 pt-5 border-t border-border/50" : ""}>
                <p className="type-body-sm font-semibold mb-1">Where your waste goes</p>
                <p className="type-body-sm text-muted-foreground mb-4">
                  {detailed.waste_destinations!.reduce((sum, w) => sum + w.tonnage, 0).toLocaleString('en-GB')} tonnes total (2023-24)
                </p>
                <div className="space-y-3">
                  {detailed.waste_destinations!.map((dest, idx) => (
                    <div key={idx}>
                      <div className="flex items-baseline justify-between mb-1">
                        <span className="type-body-sm font-medium">{dest.type}</span>
                        <span className="type-body-sm font-semibold tabular-nums">{dest.percentage}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full bg-foreground"
                          style={{ width: `${(dest.percentage / maxPct) * 100}%` }}
                        />
                      </div>
                      <p className="type-body-sm text-muted-foreground mt-0.5">
                        {dest.tonnage.toLocaleString('en-GB')} tonnes
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}

          {/* Road maintenance metric cards */}
          {detailed.service_outcomes && (detailed.service_outcomes.roads?.maintenance_backlog || detailed.service_outcomes.roads?.annual_investment) && (
            <div className="mt-6 pt-5 border-t border-border/50">
              <p className="type-body-sm font-semibold mb-3">Road maintenance</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {detailed.service_outcomes.roads?.maintenance_backlog && (
                  <div className="p-3 rounded-lg bg-muted/30">
                    <p className="type-body-sm text-muted-foreground mb-1">Maintenance backlog</p>
                    <p className="type-metric font-semibold tabular-nums">{formatBudget(detailed.service_outcomes.roads.maintenance_backlog / 1000)}</p>
                  </div>
                )}
                {detailed.service_outcomes.roads?.annual_investment && (
                  <div className="p-3 rounded-lg bg-muted/30">
                    <p className="type-body-sm text-muted-foreground mb-1">Annual investment</p>
                    <p className="type-metric font-semibold tabular-nums">{formatBudget(detailed.service_outcomes.roads.annual_investment / 1000)}</p>
                  </div>
                )}
                {detailed.service_outcomes.roads?.network_length_miles && (
                  <div className="p-3 rounded-lg bg-muted/30">
                    <p className="type-body-sm text-muted-foreground mb-1">Road network</p>
                    <p className="type-metric font-semibold tabular-nums">{detailed.service_outcomes.roads.network_length_miles.toLocaleString('en-GB')}</p>
                    <p className="type-body-sm text-muted-foreground/60">miles</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Section transparency links for outcomes */}
          {detailed.section_transparency?.outcomes && (
            <div className="mt-6 pt-4 border-t border-border/40">
              <p className="type-caption font-semibold text-muted-foreground mb-2">See the raw data</p>
              <div className="space-y-1.5">
                {detailed.section_transparency.outcomes.map((link, idx) => (
                  <div key={idx}>
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="type-body-sm underline hover:text-foreground transition-colors inline-flex items-center gap-1"
                    >
                      {link.label}
                      <ExternalLink className="h-3 w-3 text-muted-foreground" aria-hidden="true" />
                      <span className="sr-only"> (opens in new tab)</span>
                    </a>
                    {link.description && (
                      <p className="type-body-sm text-muted-foreground">{link.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          SECTION 8a.5: Open data & transparency (if open_data_links exist)
          All published datasets for this council, grouped by theme
          ═══════════════════════════════════════════════════════════════════════ */}
      {detailed?.open_data_links && detailed.open_data_links.length > 0 && (
        <section className="card-elevated p-5 sm:p-6">
          <h2 className="type-title-2 mb-1">Open data &amp; transparency</h2>
          <p className="type-body-sm text-muted-foreground mb-5">
            All published datasets for {selectedCouncil.name}
          </p>

          <div className="space-y-3">
            {detailed.open_data_links.map((group, gIdx) => (
              <div key={gIdx} className="p-4 rounded-lg bg-muted/30">
                <p className="type-body-sm font-semibold mb-2">{group.theme}</p>
                <div className="space-y-1.5">
                  {group.links.map((link, lIdx) => (
                    <div key={lIdx}>
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="type-body-sm underline hover:text-foreground transition-colors inline-flex items-center gap-1"
                      >
                        {link.label}
                        <ExternalLink className="h-3 w-3 text-muted-foreground" aria-hidden="true" />
                        <span className="sr-only"> (opens in new tab)</span>
                      </a>
                      {link.description && (
                        <p className="type-body-sm text-muted-foreground">{link.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <p className="mt-6 pt-4 border-t border-border/40 type-caption text-muted-foreground">
            Source:{' '}
            <a
              href="https://www.kent.gov.uk/about-the-council/information-and-data"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-foreground transition-colors cursor-pointer"
            >
              kent.gov.uk information and data
              <span className="sr-only"> (opens in new tab)</span>
            </a>
          </p>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          SECTION 8b: District councils in your area (for county councils)
          Shows which district councils residents might also pay
          ═══════════════════════════════════════════════════════════════════════ */}
      {isCountyCouncil && (
        <section className="card-elevated p-5 sm:p-6">
          <h2 className="type-title-2 mb-1">Your local councils</h2>
          <p className="type-body-sm text-muted-foreground mb-5">
            You also have a district or borough council for local services.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* County council card (this council) */}
            <div className="p-4 rounded-lg bg-foreground/5 border border-foreground/10">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-foreground/10 flex items-center justify-center shrink-0">
                  <Building2 className="h-4 w-4 text-foreground" aria-hidden="true" />
                </div>
                <p className="type-body-sm font-semibold">{selectedCouncil.name}</p>
              </div>
              <div className="space-y-2 mb-4">
                {CONTACT_ISSUES.county.map((item, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-muted-foreground shrink-0" aria-hidden="true" />
                    <span className="type-caption text-muted-foreground">{item.issue}</span>
                  </div>
                ))}
              </div>
              {/* CTA for county council */}
              {detailed?.website && (
                <a
                  href={detailed.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-lg bg-foreground text-background type-body-sm font-semibold hover:bg-foreground/90 transition-colors cursor-pointer"
                >
                  Contact {selectedCouncil.name}
                  <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                  <span className="sr-only">(opens in new tab)</span>
                </a>
              )}
            </div>

            {/* District councils info */}
            <div className="p-4 rounded-lg bg-muted/30">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                  <Home className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                </div>
                <p className="type-body-sm font-semibold">Your district council</p>
              </div>
              <div className="space-y-2 mb-4">
                {CONTACT_ISSUES.district.map((item, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-muted-foreground shrink-0" aria-hidden="true" />
                    <span className="type-caption text-muted-foreground">{item.issue}</span>
                  </div>
                ))}
              </div>
              {/* CTA to find district council */}
              <a
                href="https://www.gov.uk/find-local-council"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-lg bg-muted text-foreground type-body-sm font-semibold hover:bg-muted/70 transition-colors cursor-pointer"
              >
                Find your district council
                <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                <span className="sr-only">(opens in new tab)</span>
              </a>
            </div>
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          SECTION 8.5: Common Questions (Natural Language FAQ)
          ═══════════════════════════════════════════════════════════════════════ */}
      {councilTax && (
        <section className="card-elevated p-5 sm:p-6">
          <h2 className="type-title-2 mb-1">Common questions</h2>
          <p className="type-body-sm text-muted-foreground mb-5">Quick answers about your council tax</p>

          <div className="space-y-3">
            {/* Q1: What percentage goes to this council? */}
            {detailed?.total_band_d && (
              <div className="p-3 rounded-lg bg-muted/30">
                <p className="type-body-sm font-semibold mb-1">What percentage of my bill goes to {selectedCouncil.name}?</p>
                <p className="type-caption text-muted-foreground">
                  <span className="font-semibold text-foreground">{((councilTax.band_d_2025 / detailed.total_band_d) * 100).toFixed(0)}%</span> of your total bill ({formatCurrency(councilTax.band_d_2025, { decimals: 2 })} out of {formatCurrency(detailed.total_band_d, { decimals: 2 })})
                </p>
              </div>
            )}

            {/* Q2: What's the biggest cost? */}
            {spendingCategories.length > 0 && (
              <div className="p-3 rounded-lg bg-muted/30">
                <p className="type-body-sm font-semibold mb-1">What does most of my money go towards?</p>
                <p className="type-caption text-muted-foreground">
                  <span className="font-semibold text-foreground">{spendingCategories[0].name}</span> takes the biggest share at {spendingCategories[0].percentage.toFixed(0)}%
                  {spendingCategories[0].yourShare && ` (${formatCurrency(spendingCategories[0].yourShare, { decimals: 0 })} of your bill)`}
                </p>
              </div>
            )}

            {/* Q3: How does this compare to average? */}
            {vsAverage !== null && (
              <div className="p-3 rounded-lg bg-muted/30">
                <p className="type-body-sm font-semibold mb-1">Is this council expensive compared to others?</p>
                <p className="type-caption text-muted-foreground">
                  {vsAverage > 0 ? (
                    <>This council charges <span className="font-semibold text-negative">{formatCurrency(vsAverage, { decimals: 2 })} more</span> than the average {selectedCouncil.type_name.toLowerCase()}</>
                  ) : vsAverage < 0 ? (
                    <>This council charges <span className="font-semibold text-positive">{formatCurrency(Math.abs(vsAverage), { decimals: 2 })} less</span> than the average {selectedCouncil.type_name.toLowerCase()}</>
                  ) : (
                    <>This council charges about the same as the average {selectedCouncil.type_name.toLowerCase()}</>
                  )}
                </p>
              </div>
            )}

            {/* Q4: How much has it gone up? */}
            {taxChange !== null && taxChangeAmount !== null && (
              <div className="p-3 rounded-lg bg-muted/30">
                <p className="type-body-sm font-semibold mb-1">How much has my bill gone up this year?</p>
                <p className="type-caption text-muted-foreground">
                  {taxChangeAmount > 0 ? (
                    <>Your bill went up by <span className="font-semibold text-negative">{formatCurrency(taxChangeAmount, { decimals: 2 })}</span> ({taxChange.toFixed(1)}%) from last year</>
                  ) : taxChangeAmount < 0 ? (
                    <>Your bill went down by <span className="font-semibold text-positive">{formatCurrency(Math.abs(taxChangeAmount), { decimals: 2 })}</span> ({Math.abs(taxChange).toFixed(1)}%) from last year</>
                  ) : (
                    <>Your bill stayed the same as last year</>
                  )}
                </p>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Data sources, documents, and methodology are consolidated in DataSourcesFooter */}
    </div>
  );
};

export default UnifiedDashboard;
