'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { PoundSterling, Receipt, CalendarDays, Home, Shield, CheckCircle, Info, Users, Building, GraduationCap, Car, Heart, BookOpen, Trash2, MapPin, Settings } from "lucide-react";
import { useCouncil } from '@/context/CouncilContext';
import { formatBudget, formatCurrency, formatDailyCost, getCouncilPopulation, calculateEfficiencyMetrics } from '@/data/councils';

const BudgetOverview = () => {
  const { selectedCouncil } = useCouncil();

  if (!selectedCouncil) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">Please select a council to view budget information.</p>
        </CardContent>
      </Card>
    );
  }

  const budget = selectedCouncil.budget;
  const councilTax = selectedCouncil.council_tax;

  // Calculate total budget in pounds (data is in thousands)
  const totalBudget = budget?.total_service ? budget.total_service * 1000 : null;
  const netCurrent = budget?.net_current ? budget.net_current * 1000 : null;

  // Calculate daily cost
  const dailyCost = totalBudget ? totalBudget / 365 : null;

  // Get population and efficiency metrics
  const population = getCouncilPopulation(selectedCouncil.name);
  const efficiencyMetrics = calculateEfficiencyMetrics(selectedCouncil);
  const perCapitaSpending = efficiencyMetrics?.perCapitaSpending || null;

  // Build budget breakdown from actual data
  const budgetBreakdown = [];

  if (budget) {
    const total = budget.total_service || 1;

    if (budget.adult_social_care) {
      budgetBreakdown.push({
        category: "Adult Social Care",
        percentage: (budget.adult_social_care / total) * 100,
        amount: budget.adult_social_care * 1000,
        priority: "High",
        icon: Shield,
        description: "Help for older people and people with disabilities"
      });
    }

    if (budget.childrens_social_care) {
      budgetBreakdown.push({
        category: "Children's Services",
        percentage: (budget.childrens_social_care / total) * 100,
        amount: budget.childrens_social_care * 1000,
        priority: "High",
        icon: Users,
        description: "Keeping children safe and helping families who need support"
      });
    }

    if (budget.education) {
      budgetBreakdown.push({
        category: "Education & Schools",
        percentage: (budget.education / total) * 100,
        amount: budget.education * 1000,
        priority: "High",
        icon: GraduationCap,
        description: "School buses, help for children with extra needs, and school support"
      });
    }

    if (budget.transport) {
      budgetBreakdown.push({
        category: "Roads & Transport",
        percentage: (budget.transport / total) * 100,
        amount: budget.transport * 1000,
        priority: "Medium",
        icon: Car,
        description: "Fixing roads, traffic lights, and helping buses run"
      });
    }

    if (budget.public_health) {
      budgetBreakdown.push({
        category: "Public Health",
        percentage: (budget.public_health / total) * 100,
        amount: budget.public_health * 1000,
        priority: "Medium",
        icon: Heart,
        description: "Stopping illness from spreading and helping people stay healthy"
      });
    }

    if (budget.housing) {
      budgetBreakdown.push({
        category: "Housing",
        percentage: (budget.housing / total) * 100,
        amount: budget.housing * 1000,
        priority: "Medium",
        icon: Home,
        description: "Helping people find homes and stopping homelessness"
      });
    }

    if (budget.cultural) {
      budgetBreakdown.push({
        category: "Libraries & Fun Stuff",
        percentage: (budget.cultural / total) * 100,
        amount: budget.cultural * 1000,
        priority: "Medium",
        icon: BookOpen,
        description: "Libraries, museums, art, and community centres"
      });
    }

    if (budget.environmental) {
      budgetBreakdown.push({
        category: "Bins & Streets",
        percentage: (budget.environmental / total) * 100,
        amount: budget.environmental * 1000,
        priority: "Medium",
        icon: Trash2,
        description: "Collecting bins, recycling, and cleaning streets"
      });
    }

    if (budget.planning) {
      budgetBreakdown.push({
        category: "Planning",
        percentage: (budget.planning / total) * 100,
        amount: budget.planning * 1000,
        priority: "Low",
        icon: MapPin,
        description: "Deciding what can be built and where"
      });
    }

    if (budget.central_services) {
      budgetBreakdown.push({
        category: "Running the Council",
        percentage: (budget.central_services / total) * 100,
        amount: budget.central_services * 1000,
        priority: "Low",
        icon: Building,
        description: "Meetings, staff, and keeping the council running"
      });
    }

    // Sort by percentage descending
    budgetBreakdown.sort((a, b) => b.percentage - a.percentage);
  }

  // Key metrics
  const keyMetrics = [
    {
      title: "Yearly Budget",
      value: totalBudget ? formatBudget(totalBudget / 1000) : 'N/A',
      description: `How much ${selectedCouncil.name} spends in one year`,
      badge: "Total Spend",
      icon: PoundSterling,
    },
    {
      title: "Per Person",
      value: perCapitaSpending ? formatCurrency(perCapitaSpending, { decimals: 0 }) : 'N/A',
      description: population ? `Spending per resident (${(population / 1000).toFixed(0)}k population)` : "Per resident annually",
      badge: "Per Capita",
      icon: Users,
    },
    {
      title: "Daily Running Cost",
      value: dailyCost ? formatDailyCost(dailyCost) : 'N/A',
      description: "What it costs to run all services each day",
      badge: "Per Day",
      icon: CalendarDays,
    },
    {
      title: "Band D Council Tax",
      value: councilTax ? formatCurrency(councilTax.band_d_2025, { decimals: 2 }) : 'N/A',
      description: `${selectedCouncil.name} portion only`,
      badge: "This Council",
      icon: Home,
    }
  ];

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {keyMetrics.map((metric, index) => (
          <Card key={index} className="border border-border/40 bg-card shadow-sm rounded-xl">
            <CardContent className="p-5 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <Badge variant="secondary" className="text-xs font-medium">{metric.badge}</Badge>
                <metric.icon className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="text-2xl sm:text-3xl font-bold tracking-tight mb-2">{metric.value}</p>
              <p className="text-sm text-muted-foreground leading-relaxed">{metric.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Budget Breakdown */}
      {budgetBreakdown.length > 0 ? (
        <Card className="border border-border/40 bg-card shadow-sm rounded-xl">
          <CardHeader className="p-5 sm:p-6 pb-4">
            <CardTitle className="text-lg sm:text-xl font-semibold">Where Your Money Goes</CardTitle>
            <CardDescription className="text-sm sm:text-base leading-relaxed mt-1">
              How {selectedCouncil.name} spends money across different services
            </CardDescription>
          </CardHeader>
          <CardContent className="px-5 pb-5 sm:px-6 sm:pb-6">
            <div className="space-y-6">
              {budgetBreakdown.map((item, index) => (
                <div key={index} className="space-y-3">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <item.icon className="h-5 w-5 shrink-0 text-muted-foreground/70" />
                      <span className="font-medium text-sm sm:text-base truncate">{item.category}</span>
                      {item.percentage > 20 && (
                        <Badge
                          variant="destructive"
                          className="text-xs shrink-0"
                        >
                          Major
                        </Badge>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-bold text-base">{formatBudget(item.amount / 1000)}</div>
                      <div className="text-sm text-muted-foreground">{item.percentage.toLocaleString('en-GB', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%</div>
                    </div>
                  </div>
                  <Progress value={Math.min(item.percentage, 100)} className="h-2" />
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border border-border/40 bg-card shadow-sm rounded-xl">
          <CardContent className="p-6">
            <div className="flex items-center gap-4 text-muted-foreground">
              <Info className="h-5 w-5" />
              <p className="text-sm sm:text-base">Detailed budget breakdown not available for this council.</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Context Box */}
      <Card className="border border-border/40 bg-card shadow-sm rounded-xl">
        <CardContent className="p-5 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold mb-4">What Does This Council Do?</h3>
          <div className="space-y-4">
            <p className="text-sm sm:text-base text-muted-foreground">
              <strong className="text-foreground">{selectedCouncil.name}</strong> is a {selectedCouncil.type_name}.
            </p>
            {selectedCouncil.type === 'SC' && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  County councils look after the big stuff for the whole area:
                </p>
                <div className="space-y-3">
                  <div className="flex items-start gap-3 text-sm">
                    <CheckCircle className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
                    <span className="leading-relaxed"><strong>Social Care:</strong> Looking after older people and children who need help</span>
                  </div>
                  <div className="flex items-start gap-3 text-sm">
                    <CheckCircle className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
                    <span className="leading-relaxed"><strong>Education:</strong> School buses and helping children with extra needs</span>
                  </div>
                  <div className="flex items-start gap-3 text-sm">
                    <CheckCircle className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
                    <span className="leading-relaxed"><strong>Roads:</strong> Main roads, fixing potholes, and traffic lights</span>
                  </div>
                </div>
              </div>
            )}
            {selectedCouncil.type === 'SD' && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  District councils look after local things in your area:
                </p>
                <div className="space-y-3">
                  <div className="flex items-start gap-3 text-sm">
                    <CheckCircle className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
                    <span className="leading-relaxed"><strong>Housing:</strong> Helping people find homes</span>
                  </div>
                  <div className="flex items-start gap-3 text-sm">
                    <CheckCircle className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
                    <span className="leading-relaxed"><strong>Planning:</strong> Deciding what buildings can be built</span>
                  </div>
                  <div className="flex items-start gap-3 text-sm">
                    <CheckCircle className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
                    <span className="leading-relaxed"><strong>Bins:</strong> Collecting rubbish and recycling</span>
                  </div>
                </div>
              </div>
            )}
            {(selectedCouncil.type === 'UA' || selectedCouncil.type === 'MD' || selectedCouncil.type === 'LB') && (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  This council does everything! They look after social care, schools, housing, planning, bins, roads, and more - all in one place.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BudgetOverview;
