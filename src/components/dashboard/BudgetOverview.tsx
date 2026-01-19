'use client';

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Users, Building, GraduationCap, Car, Heart, BookOpen, Trash2, MapPin, TrendingUp, Shield, Home } from "lucide-react";
import { useCouncil } from '@/context/CouncilContext';
import { formatBudget, formatCurrency, getCouncilPopulation, calculateEfficiencyMetrics } from '@/data/councils';

const BudgetOverview = () => {
  const { selectedCouncil } = useCouncil();

  if (!selectedCouncil) {
    return (
      <Card className="card-elevated">
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground">Please select a council to view budget information.</p>
        </CardContent>
      </Card>
    );
  }

  const budget = selectedCouncil.budget;
  const councilTax = selectedCouncil.council_tax;

  // Calculate total budget in pounds (data is in thousands)
  const totalBudget = budget?.total_service ? budget.total_service * 1000 : null;

  // Get population and efficiency metrics
  const population = getCouncilPopulation(selectedCouncil.name);
  const efficiencyMetrics = calculateEfficiencyMetrics(selectedCouncil);
  const perCapitaSpending = efficiencyMetrics?.perCapitaSpending || null;

  // Year-over-year change for council tax
  const taxChange = councilTax && councilTax.band_d_2024
    ? ((councilTax.band_d_2025 - councilTax.band_d_2024) / councilTax.band_d_2024 * 100)
    : null;

  // Build budget breakdown from actual data
  const budgetBreakdown: Array<{
    category: string;
    categoryKey: string;
    percentage: number;
    amount: number;
    icon: typeof Shield;
    color: string;
    details: Array<{ name: string; description: string; amount?: number }>;
  }> = [];

  if (budget) {
    const total = budget.total_service || 1;

    // Muted, earthy color palette - greys and subtle tones
    const serviceMap: Array<{ key: keyof typeof budget; name: string; icon: typeof Shield; color: string }> = [
      { key: 'environmental', name: 'Environment & Streets', icon: Trash2, color: 'bg-stone-500' },
      { key: 'planning', name: 'Planning & Development', icon: MapPin, color: 'bg-slate-500' },
      { key: 'central_services', name: 'Corporate Services', icon: Building, color: 'bg-zinc-500' },
      { key: 'cultural', name: 'Culture & Leisure', icon: BookOpen, color: 'bg-stone-600' },
      { key: 'housing', name: 'Housing', icon: Home, color: 'bg-stone-400' },
      { key: 'adult_social_care', name: 'Adult Social Care', icon: Shield, color: 'bg-slate-600' },
      { key: 'childrens_social_care', name: "Children's Services", icon: Users, color: 'bg-zinc-600' },
      { key: 'education', name: 'Education', icon: GraduationCap, color: 'bg-slate-400' },
      { key: 'transport', name: 'Transport & Highways', icon: Car, color: 'bg-stone-500' },
      { key: 'public_health', name: 'Public Health', icon: Heart, color: 'bg-zinc-400' },
    ];

    // Get detailed service spending if available
    const getServiceDetails = (categoryKey: string) => {
      return selectedCouncil.detailed?.service_spending?.find(s => s.category === categoryKey)?.services || [];
    };

    for (const service of serviceMap) {
      const amount = budget[service.key] as number | null;
      if (amount && amount > 0) {
        budgetBreakdown.push({
          category: service.name,
          categoryKey: service.key,
          percentage: (amount / total) * 100,
          amount: amount * 1000,
          icon: service.icon,
          color: service.color,
          details: getServiceDetails(service.key),
        });
      }
    }

    budgetBreakdown.sort((a, b) => b.percentage - a.percentage);
  }

  // Calculate the max percentage for scaling bars
  const maxPercentage = budgetBreakdown.length > 0 ? Math.max(...budgetBreakdown.map(b => b.percentage)) : 100;

  return (
    <div className="space-y-8">
      {/* Hero Metrics - Primary KPIs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Primary Metric - Annual Budget */}
        <div className="lg:col-span-2">
          <div className="card-elevated p-6 sm:p-8">
            <div className="flex items-start justify-between mb-6">
              <div>
                <p className="type-overline mb-2">Annual Budget</p>
                <p className="type-metric text-foreground">
                  {totalBudget ? formatBudget(totalBudget / 1000) : 'N/A'}
                </p>
              </div>
              {selectedCouncil.detailed && (
                <Badge variant="outline" className="text-xs font-medium bg-navy-50 text-navy-600 border-navy-200">
                  Verified
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-lg">
              Total service expenditure for {selectedCouncil.name} in the 2024-25 financial year.
              {selectedCouncil.type === 'SD' && " This covers local services like waste, planning, and parks."}
            </p>

            {/* Quick stats row */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 mt-8 pt-6 border-t border-border/50">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Per resident</p>
                <p className="text-xl font-semibold tabular-nums">
                  {perCapitaSpending ? formatCurrency(perCapitaSpending, { decimals: 0 }) : 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Population</p>
                <p className="text-xl font-semibold tabular-nums">
                  {population ? `${(population / 1000).toFixed(0)}k` : 'N/A'}
                </p>
              </div>
              <div className="hidden sm:block">
                <p className="text-sm text-muted-foreground mb-1">Service areas</p>
                <p className="text-xl font-semibold tabular-nums">
                  {budgetBreakdown.length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Secondary Metric - Council Tax */}
        <div className="card-elevated p-6 sm:p-8 flex flex-col">
          <div className="flex-1">
            <p className="type-overline mb-2">Your Council Tax</p>
            <p className="type-metric text-foreground">
              {councilTax ? formatCurrency(councilTax.band_d_2025, { decimals: 2 }) : 'N/A'}
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Band D, {selectedCouncil.name} portion only
            </p>
          </div>

          {taxChange !== null && (
            <div className="mt-6 pt-4 border-t border-border/50">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 text-sm font-medium text-foreground">
                  <TrendingUp className={`h-4 w-4 ${taxChange < 0 ? 'rotate-180' : ''}`} />
                  {taxChange > 0 ? '+' : ''}{taxChange.toFixed(1)}%
                </div>
                <span className="text-sm text-muted-foreground">vs last year</span>
              </div>
            </div>
          )}

          {selectedCouncil.detailed?.total_band_d && (
            <div className="mt-4 p-3 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">
                Full bill: <span className="font-semibold text-foreground">{formatCurrency(selectedCouncil.detailed.total_band_d, { decimals: 2 })}</span>
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Budget Breakdown - Visual Bar Chart */}
      {budgetBreakdown.length > 0 && (
        <div className="card-elevated p-6 sm:p-8">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-lg sm:text-xl font-semibold mb-1">Where the money goes</h2>
              <p className="text-sm text-muted-foreground">
                Breakdown of {selectedCouncil.name}&apos;s service expenditure
              </p>
            </div>
            <Badge variant="outline" className="text-xs">
              2024-25
            </Badge>
          </div>

          {/* Budget breakdown - Monzo/Apple style */}
          <div className="space-y-5">
            {budgetBreakdown.map((item, index) => {
              const barWidth = (item.percentage / maxPercentage) * 100;

              return (
                <div key={index}>
                  {/* Header row: category name + amount (Monzo pattern) */}
                  <div className="flex items-baseline justify-between mb-1">
                    <span className="type-body font-semibold">{item.category}</span>
                    <span className="type-body font-semibold tabular-nums">
                      {formatBudget(item.amount / 1000)}
                    </span>
                  </div>
                  {/* Percentage on second row */}
                  <div className="flex items-baseline justify-between mb-2">
                    <span className="type-caption text-muted-foreground">
                      {item.percentage.toFixed(0)}% of total budget
                    </span>
                  </div>
                  {/* Bar - visual reinforcement */}
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-foreground transition-all duration-300"
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Total */}
          <div className="mt-8 pt-6 border-t border-border/50 flex items-center justify-between">
            <span className="font-semibold">Total service expenditure</span>
            <span className="text-lg sm:text-xl font-bold tabular-nums">
              {totalBudget ? formatBudget(totalBudget / 1000) : 'N/A'}
            </span>
          </div>
        </div>
      )}

      {/* Context Section - What this council does */}
      <div className="card-elevated p-6 sm:p-8">
        <h2 className="text-lg sm:text-xl font-semibold mb-4">
          What {selectedCouncil.type === 'SD' ? 'district councils do' : selectedCouncil.type === 'SC' ? 'county councils do' : 'this council does'}
        </h2>

        {selectedCouncil.type === 'SD' && (
          <div className="space-y-4">
            {/* Compact chip layout for responsibilities */}
            <div>
              <p className="text-sm text-muted-foreground mb-3">Responsible for:</p>
              <div className="flex flex-wrap gap-2">
                {[
                  'Waste & recycling',
                  'Planning',
                  'Parks',
                  'Housing',
                  'Environmental health',
                  'Council tax collection',
                ].map((item, i) => (
                  <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted text-sm">
                    <CheckCircle className="h-3.5 w-3.5 text-stone-400" />
                    {item}
                  </span>
                ))}
              </div>
            </div>

            {/* Info callout - more compact */}
            <div className="p-4 rounded-xl bg-muted/50 border border-border/50">
              <p className="text-sm text-muted-foreground leading-relaxed">
                <span className="font-medium text-foreground">Note:</span> {selectedCouncil.name} only receives about 12% of your council tax bill. Schools, social care, roads, police and fire services are provided by other authorities.
              </p>
            </div>
          </div>
        )}

        {selectedCouncil.type === 'SC' && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground mb-3">
              County councils handle the largest services across the whole county:
            </p>
            <div className="flex flex-wrap gap-2">
              {[
                { icon: Shield, label: 'Social Care' },
                { icon: GraduationCap, label: 'Education' },
                { icon: Car, label: 'Highways' },
              ].map((item, i) => (
                <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted text-sm">
                  <item.icon className="h-3.5 w-3.5 text-muted-foreground" />
                  {item.label}
                </span>
              ))}
            </div>
          </div>
        )}

        {(selectedCouncil.type === 'UA' || selectedCouncil.type === 'MD' || selectedCouncil.type === 'LB') && (
          <p className="text-sm text-muted-foreground leading-relaxed">
            As a {selectedCouncil.type_name.toLowerCase()}, this council provides all local government services in one place - from social care and schools to bins and planning.
          </p>
        )}
      </div>
    </div>
  );
};

export default BudgetOverview;
