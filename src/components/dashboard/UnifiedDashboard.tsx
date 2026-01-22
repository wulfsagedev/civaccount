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
  Phone,
  Check,
  HelpCircle
} from "lucide-react";
import { useCouncil } from '@/context/CouncilContext';
import { formatBudget, formatCurrency, getCouncilPopulation, getAverageBandDByType, calculateBands, calculateEfficiencyMetrics, getCouncilByName, getCouncilSlug, councils } from '@/data/councils';

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

          {/* Selected band details */}
          <div className="p-4 sm:p-5 rounded-lg bg-muted/30">
            <p className="type-caption text-muted-foreground mb-1">Band {selectedBand} · {bandDescriptions[selectedBand]}</p>
            <p className="type-metric mb-4">
              {formatCurrency(allBands[selectedBand as keyof typeof allBands], { decimals: 2 })}
            </p>
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border/50">
              <div>
                <p className="type-caption text-muted-foreground mb-0.5">Monthly (10 payments)</p>
                <p className="type-body font-semibold tabular-nums">
                  {formatCurrency(allBands[selectedBand as keyof typeof allBands] / 10, { decimals: 2 })}
                </p>
              </div>
              <div>
                <p className="type-caption text-muted-foreground mb-0.5">Weekly</p>
                <p className="type-body font-semibold tabular-nums">
                  {formatCurrency(allBands[selectedBand as keyof typeof allBands] / 52, { decimals: 2 })}
                </p>
              </div>
            </div>
          </div>

          {/* Full bill for selected band (if precepts available) */}
          {totalBandAmounts && (
            <div className="mt-4 p-3 rounded-lg bg-muted/30">
              <p className="type-body-sm text-muted-foreground">
                <span className="font-medium text-foreground">Full Band {selectedBand} bill:</span>{' '}
                <span className="font-semibold text-foreground tabular-nums">
                  {formatCurrency(totalBandAmounts[selectedBand as keyof typeof totalBandAmounts], { decimals: 2 })}
                </span>
                {' '}(including county, police & fire)
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
                      <p className={`text-xs sm:type-body-sm truncate ${index === data.length - 1 ? 'font-semibold' : 'text-muted-foreground'}`}>
                        {item.year}
                        {index === data.length - 1 && <span className="hidden sm:inline ml-1.5 type-caption text-muted-foreground font-normal">Current</span>}
                      </p>
                      <p className={`text-xs sm:type-body tabular-nums ${index === data.length - 1 ? 'font-semibold' : 'text-muted-foreground'}`}>
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

          {/* Service breakdown - Monzo/Apple style */}
          <div className="space-y-4">
            {spendingCategories.map((category) => {
              const details = SERVICE_DETAILS[category.key];
              return (
                <div key={category.key}>
                  {/* Header row: service name + amount (Monzo pattern) */}
                  <div className="flex items-baseline justify-between mb-1">
                    <span className="type-body font-semibold">{category.name}</span>
                    <span className="type-body font-semibold tabular-nums">
                      {category.yourShare ? formatCurrency(category.yourShare, { decimals: 0 }) : ''}
                    </span>
                  </div>
                  {/* Description + percentage */}
                  <div className="flex items-baseline justify-between mb-2">
                    <p className="type-caption text-muted-foreground pr-4">
                      {details?.description || ''}
                    </p>
                    <span className="type-caption text-muted-foreground tabular-nums shrink-0">
                      {category.percentage.toFixed(0)}%
                    </span>
                  </div>
                  {/* Bar - visual reinforcement */}
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-foreground"
                      style={{ width: `${category.percentage}%` }}
                    />
                  </div>
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
              <p className="type-display tabular-nums">
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
          SECTION 8: Leadership (if detailed data exists)
          ═══════════════════════════════════════════════════════════════════════ */}
      {(detailed?.chief_executive || detailed?.cabinet?.find(m => m.role === 'Leader')) && (
        <section className="card-elevated p-5 sm:p-6">
          <h2 className="type-title-2 mb-1">Who runs the council</h2>
          <p className="type-body-sm text-muted-foreground mb-5">Council leadership</p>

          {/* All leaders in consistent grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {detailed.cabinet?.find(m => m.role === 'Leader') && (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                  <User className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="min-w-0 space-y-1">
                  <p className="type-body-sm font-semibold leading-none truncate">{detailed.cabinet.find(m => m.role === 'Leader')?.name}</p>
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
                </div>
              </div>
            )}

            {/* Cabinet members in same grid */}
            {detailed.cabinet?.filter(m => m.role !== 'Leader').slice(0, 4).map((member, index) => (
              <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                  <User className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="min-w-0 space-y-1">
                  <p className="type-body-sm font-medium leading-none truncate">{member.name}</p>
                  <p className="type-caption leading-none text-muted-foreground truncate">{member.role}</p>
                </div>
              </div>
            ))}
          </div>

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
          SECTION 8a: Key facts (for county councils with key_facts data)
          Shows headline service statistics for county councils
          ═══════════════════════════════════════════════════════════════════════ */}
      {isCountyCouncil && detailed?.key_facts && (
        <section className="card-elevated p-5 sm:p-6">
          <h2 className="type-title-2 mb-1">At a glance</h2>
          <p className="type-body-sm text-muted-foreground mb-5">
            Key facts about {selectedCouncil.name}&apos;s services
          </p>

          <div className="grid grid-cols-2 gap-4">
            {detailed.key_facts.population_served && (
              <div className="p-3 rounded-lg bg-muted/30">
                <p className="type-metric font-semibold tabular-nums">{(detailed.key_facts.population_served / 1000000).toFixed(1)}m</p>
                <p className="type-caption text-muted-foreground">residents served</p>
              </div>
            )}
            {detailed.key_facts.roads_maintained_miles && (
              <div className="p-3 rounded-lg bg-muted/30">
                <p className="type-metric font-semibold tabular-nums">{detailed.key_facts.roads_maintained_miles.toLocaleString('en-GB')}</p>
                <p className="type-caption text-muted-foreground">miles of roads</p>
              </div>
            )}
            {detailed.key_facts.libraries && (
              <div className="p-3 rounded-lg bg-muted/30">
                <p className="type-metric font-semibold tabular-nums">{detailed.key_facts.libraries}</p>
                <p className="type-caption text-muted-foreground">libraries</p>
              </div>
            )}
            {detailed.key_facts.adult_social_care_clients && (
              <div className="p-3 rounded-lg bg-muted/30">
                <p className="type-metric font-semibold tabular-nums">{detailed.key_facts.adult_social_care_clients.toLocaleString('en-GB')}</p>
                <p className="type-caption text-muted-foreground">adults in care</p>
              </div>
            )}
          </div>

          {/* Additional facts in smaller format */}
          <div className="mt-4 pt-4 border-t border-border/50 space-y-2">
            {detailed.key_facts.library_visits_annual && (
              <div className="flex items-baseline justify-between">
                <span className="type-caption text-muted-foreground">Library visits per year</span>
                <span className="type-body-sm font-semibold tabular-nums">{(detailed.key_facts.library_visits_annual / 1000000).toFixed(1)}m</span>
              </div>
            )}
            {detailed.key_facts.potholes_repaired_2025 && (
              <div className="flex items-baseline justify-between">
                <span className="type-caption text-muted-foreground">Potholes repaired (2025)</span>
                <span className="type-body-sm font-semibold tabular-nums">{detailed.key_facts.potholes_repaired_2025.toLocaleString('en-GB')}</span>
              </div>
            )}
            {detailed.key_facts.school_transport_budget && (
              <div className="flex items-baseline justify-between">
                <span className="type-caption text-muted-foreground">School transport budget</span>
                <span className="type-body-sm font-semibold tabular-nums">{formatBudget(detailed.key_facts.school_transport_budget / 1000)}</span>
              </div>
            )}
          </div>

          {/* Source link */}
          <p className="mt-4 pt-3 border-t border-border/30 type-caption text-muted-foreground">
            Source:{' '}
            <a
              href={detailed?.website || 'https://www.gov.uk/find-local-council'}
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-foreground transition-colors cursor-pointer"
            >
              {selectedCouncil.name} website
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
                <p className="type-body-sm font-medium mb-1">What percentage of my bill goes to {selectedCouncil.name}?</p>
                <p className="type-caption text-muted-foreground">
                  <span className="font-semibold text-foreground">{((councilTax.band_d_2025 / detailed.total_band_d) * 100).toFixed(0)}%</span> of your total bill ({formatCurrency(councilTax.band_d_2025, { decimals: 2 })} out of {formatCurrency(detailed.total_band_d, { decimals: 2 })})
                </p>
              </div>
            )}

            {/* Q2: What's the biggest cost? */}
            {spendingCategories.length > 0 && (
              <div className="p-3 rounded-lg bg-muted/30">
                <p className="type-body-sm font-medium mb-1">What does most of my money go towards?</p>
                <p className="type-caption text-muted-foreground">
                  <span className="font-semibold text-foreground">{spendingCategories[0].name}</span> takes the biggest share at {spendingCategories[0].percentage.toFixed(0)}%
                  {spendingCategories[0].yourShare && ` (${formatCurrency(spendingCategories[0].yourShare, { decimals: 0 })} of your bill)`}
                </p>
              </div>
            )}

            {/* Q3: How does this compare to average? */}
            {vsAverage !== null && (
              <div className="p-3 rounded-lg bg-muted/30">
                <p className="type-body-sm font-medium mb-1">Is this council expensive compared to others?</p>
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
                <p className="type-body-sm font-medium mb-1">How much has my bill gone up this year?</p>
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
