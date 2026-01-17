'use client';

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Info, Users, Building, GraduationCap, Car, Heart, BookOpen, Trash2, MapPin, Settings, TrendingUp, ArrowUpRight, Shield, Home } from "lucide-react";
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
    percentage: number;
    amount: number;
    icon: typeof Shield;
    color: string;
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

    for (const service of serviceMap) {
      const amount = budget[service.key] as number | null;
      if (amount && amount > 0) {
        budgetBreakdown.push({
          category: service.name,
          percentage: (amount / total) * 100,
          amount: amount * 1000,
          icon: service.icon,
          color: service.color,
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
          <div className="card-elevated p-8">
            <div className="flex items-start justify-between mb-6">
              <div>
                <p className="text-overline mb-2">Annual Budget</p>
                <p className="text-metric text-foreground">
                  {totalBudget ? formatBudget(totalBudget / 1000) : 'N/A'}
                </p>
              </div>
              {selectedCouncil.detailed && (
                <Badge variant="outline" className="text-xs font-medium bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800">
                  Verified
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-lg">
              Total service expenditure for {selectedCouncil.name} in the 2025-26 financial year.
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
        <div className="card-elevated p-8 flex flex-col">
          <div className="flex-1">
            <p className="text-overline mb-2">Your Council Tax</p>
            <p className="text-metric text-foreground">
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
        <div className="card-elevated p-8">
          <div className="flex items-start justify-between mb-8">
            <div>
              <h2 className="text-xl font-semibold mb-1">Where the money goes</h2>
              <p className="text-sm text-muted-foreground">
                Breakdown of {selectedCouncil.name}&apos;s service expenditure
              </p>
            </div>
            <Badge variant="outline" className="text-xs">
              2025-26
            </Badge>
          </div>

          <div className="space-y-4">
            {budgetBreakdown.map((item, index) => {
              const Icon = item.icon;
              const barWidth = (item.percentage / maxPercentage) * 100;

              return (
                <div key={index} className="group">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                        <Icon className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <span className="font-medium text-sm">{item.category}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-muted-foreground tabular-nums">
                        {item.percentage.toFixed(1)}%
                      </span>
                      <span className="font-semibold text-sm tabular-nums min-w-[70px] text-right">
                        {formatBudget(item.amount / 1000)}
                      </span>
                    </div>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-stone-400 dark:bg-stone-500 rounded-full transition-all duration-500 ease-out"
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
            <span className="text-xl font-bold tabular-nums">
              {totalBudget ? formatBudget(totalBudget / 1000) : 'N/A'}
            </span>
          </div>
        </div>
      )}

      {/* Context Section - What this council does */}
      <div className="card-elevated p-8">
        <h2 className="text-xl font-semibold mb-6">
          What {selectedCouncil.type === 'SD' ? 'district councils do' : selectedCouncil.type === 'SC' ? 'county councils do' : 'this council does'}
        </h2>

        {selectedCouncil.type === 'SD' && (
          <div className="space-y-6">
            {/* Two-column layout for responsibilities */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* What they DO */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-foreground">
                  Responsible for
                </h3>
                <ul className="space-y-3">
                  {[
                    'Waste collection and recycling',
                    'Planning applications',
                    'Parks and open spaces',
                    'Housing and homelessness',
                    'Environmental health',
                    'Council tax collection',
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm">
                      <CheckCircle className="h-4 w-4 mt-0.5 shrink-0 text-stone-400" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* What they DON'T do */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-muted-foreground">
                  Not included
                </h3>
                <ul className="space-y-3">
                  {[
                    { service: 'Schools', provider: 'County Council' },
                    { service: 'Adult social care', provider: 'County Council' },
                    { service: 'Roads & highways', provider: 'County Council' },
                    { service: 'Police', provider: 'Kent Police' },
                    { service: 'Fire services', provider: 'Kent Fire' },
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-muted-foreground">
                      <span className="w-4 h-4 shrink-0" />
                      <span>{item.service} <span className="text-xs">({item.provider})</span></span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Why this matters - subtle callout */}
            <div className="mt-8 p-6 rounded-xl bg-muted/50 border border-border/50">
              <div className="flex gap-4">
                <div className="shrink-0">
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                    <Info className="h-5 w-5 text-muted-foreground" />
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-foreground mb-2">
                    Why this matters
                  </h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {selectedCouncil.name} only receives about 12% of your council tax bill.
                    When bills rise, most of the increase goes to Kent County Council for schools and social care.
                    A 5% rise in your total bill means less than £15 extra for this council.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {selectedCouncil.type === 'SC' && (
          <div className="space-y-6">
            <p className="text-muted-foreground leading-relaxed">
              County councils handle the largest and most expensive services across the whole county area.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { icon: Shield, title: 'Social Care', desc: 'Support for elderly and disabled residents' },
                { icon: GraduationCap, title: 'Education', desc: 'School support and special needs' },
                { icon: Car, title: 'Highways', desc: 'Roads, street lights, and transport' },
              ].map((item, i) => (
                <div key={i} className="p-4 rounded-xl bg-muted/50">
                  <item.icon className="h-5 w-5 text-primary mb-3" />
                  <h4 className="font-semibold text-sm mb-1">{item.title}</h4>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {(selectedCouncil.type === 'UA' || selectedCouncil.type === 'MD' || selectedCouncil.type === 'LB') && (
          <p className="text-muted-foreground leading-relaxed">
            As a {selectedCouncil.type_name.toLowerCase()}, this council provides all local government services
            in one place - from social care and schools to bins and planning.
          </p>
        )}
      </div>

      {/* Data sources link */}
      {selectedCouncil.detailed?.sources && selectedCouncil.detailed.sources.length > 0 && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Data verified from official sources</span>
          <ArrowUpRight className="h-3 w-3" />
        </div>
      )}
    </div>
  );
};

export default BudgetOverview;
