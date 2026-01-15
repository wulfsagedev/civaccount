'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { DollarSign, Building2, Calendar, Users, Lightbulb, AlertTriangle, Shield, CheckCircle, Info } from "lucide-react";
import { useCouncil } from '@/context/CouncilContext';
import { formatBudget } from '@/data/councils';

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
        icon: Building2,
        description: "School buses, help for children with extra needs, and school support"
      });
    }

    if (budget.transport) {
      budgetBreakdown.push({
        category: "Roads & Transport",
        percentage: (budget.transport / total) * 100,
        amount: budget.transport * 1000,
        priority: "Medium",
        icon: Calendar,
        description: "Fixing roads, traffic lights, and helping buses run"
      });
    }

    if (budget.public_health) {
      budgetBreakdown.push({
        category: "Public Health",
        percentage: (budget.public_health / total) * 100,
        amount: budget.public_health * 1000,
        priority: "Medium",
        icon: Shield,
        description: "Stopping illness from spreading and helping people stay healthy"
      });
    }

    if (budget.housing) {
      budgetBreakdown.push({
        category: "Housing",
        percentage: (budget.housing / total) * 100,
        amount: budget.housing * 1000,
        priority: "Medium",
        icon: Building2,
        description: "Helping people find homes and stopping homelessness"
      });
    }

    if (budget.cultural) {
      budgetBreakdown.push({
        category: "Libraries & Fun Stuff",
        percentage: (budget.cultural / total) * 100,
        amount: budget.cultural * 1000,
        priority: "Medium",
        icon: Building2,
        description: "Libraries, museums, art, and community centres"
      });
    }

    if (budget.environmental) {
      budgetBreakdown.push({
        category: "Bins & Streets",
        percentage: (budget.environmental / total) * 100,
        amount: budget.environmental * 1000,
        priority: "Medium",
        icon: CheckCircle,
        description: "Collecting bins, recycling, and cleaning streets"
      });
    }

    if (budget.planning) {
      budgetBreakdown.push({
        category: "Planning",
        percentage: (budget.planning / total) * 100,
        amount: budget.planning * 1000,
        priority: "Low",
        icon: Building2,
        description: "Deciding what can be built and where"
      });
    }

    if (budget.central_services) {
      budgetBreakdown.push({
        category: "Running the Council",
        percentage: (budget.central_services / total) * 100,
        amount: budget.central_services * 1000,
        priority: "Low",
        icon: CheckCircle,
        description: "Meetings, staff, and keeping the council running"
      });
    }

    // Sort by percentage descending
    budgetBreakdown.sort((a, b) => b.percentage - a.percentage);
  }

  // Key metrics
  const keyMetrics = [
    {
      title: "Total Budget",
      value: totalBudget ? formatBudget(totalBudget / 1000) : 'N/A',
      description: `How much ${selectedCouncil.name} spends in one year`,
      explanation: "This pays for all the things your council does",
      badge: "Yearly Total",
      icon: DollarSign,
      color: "text-primary"
    },
    {
      title: "What You Pay For",
      value: netCurrent ? formatBudget(netCurrent / 1000) : 'N/A',
      description: "The part paid by council tax and government",
      explanation: "This is what your council tax and government money covers",
      badge: "Your Share",
      icon: Building2,
      color: "text-primary"
    },
    {
      title: "Daily Cost",
      value: dailyCost ? `£${(dailyCost / 1000).toFixed(0)}K` : 'N/A',
      description: "What it costs to run everything each day",
      explanation: "Your council works every single day of the year",
      badge: "Per Day",
      icon: Calendar,
      color: "text-primary"
    },
    {
      title: "Band D Council Tax",
      value: councilTax ? `£${councilTax.band_d_2025.toFixed(2)}` : 'N/A',
      description: `${selectedCouncil.name} portion only`,
      explanation: "This is only what you pay to this council. Your total bill includes other charges too.",
      badge: "Council Only",
      icon: Users,
      color: "text-primary"
    }
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {keyMetrics.map((metric, index) => (
          <Card key={index} className="relative overflow-hidden">
            <CardHeader className="pb-2 space-y-2">
              <div className="flex items-center justify-between">
                <Badge variant="secondary" className="text-xs">{metric.badge}</Badge>
                <metric.icon className={`h-4 w-4 ${metric.color}`} />
              </div>
              <CardTitle className="text-lg sm:text-xl lg:text-2xl font-bold">{metric.value}</CardTitle>
              <CardDescription className="text-xs sm:text-sm">{metric.description}</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-xs bg-muted p-2 rounded-md flex items-start gap-2">
                <Lightbulb className="h-3 w-3 mt-0.5 shrink-0" />
                <div>
                  <span className="font-medium">Note:</span> {metric.explanation}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Budget Breakdown */}
      {budgetBreakdown.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl">Where Your Money Goes</CardTitle>
            <CardDescription className="text-sm sm:text-base">
              How {selectedCouncil.name} spends money across different services
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 sm:space-y-6">
              {budgetBreakdown.map((item, index) => (
                <div key={index} className="space-y-2 sm:space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center space-x-2 min-w-0">
                      <item.icon className="h-4 w-4 shrink-0 text-muted-foreground" />
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
                      <div className="font-bold text-sm sm:text-base">{formatBudget(item.amount / 1000)}</div>
                      <div className="text-xs sm:text-sm text-muted-foreground">{item.percentage.toFixed(1)}%</div>
                    </div>
                  </div>
                  <Progress value={Math.min(item.percentage, 100)} className="h-2" />
                  <div className="text-xs sm:text-sm text-muted-foreground">
                    {item.description}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3 text-muted-foreground">
              <Info className="h-5 w-5" />
              <p>Detailed budget breakdown not available for this council.</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Context Box */}
      <Card className="border-l-4 border-l-primary">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-primary" />
            <CardTitle className="text-base sm:text-lg">What Does This Council Do?</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 sm:space-y-4">
            <p className="text-sm sm:text-base">
              <strong>{selectedCouncil.name} is a {selectedCouncil.type_name}.</strong>
            </p>
            {selectedCouncil.type === 'SC' && (
              <div className="space-y-2">
                <p className="text-xs sm:text-sm text-muted-foreground">
                  County councils look after the big stuff for the whole area:
                </p>
                <div className="space-y-2">
                  <div className="flex items-start gap-2 text-xs sm:text-sm">
                    <CheckCircle className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
                    <div><strong>Social Care:</strong> Looking after older people and children who need help</div>
                  </div>
                  <div className="flex items-start gap-2 text-xs sm:text-sm">
                    <CheckCircle className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
                    <div><strong>Education:</strong> School buses and helping children with extra needs</div>
                  </div>
                  <div className="flex items-start gap-2 text-xs sm:text-sm">
                    <CheckCircle className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
                    <div><strong>Roads:</strong> Main roads, fixing potholes, and traffic lights</div>
                  </div>
                </div>
              </div>
            )}
            {selectedCouncil.type === 'SD' && (
              <div className="space-y-2">
                <p className="text-xs sm:text-sm text-muted-foreground">
                  District councils look after local things in your area:
                </p>
                <div className="space-y-2">
                  <div className="flex items-start gap-2 text-xs sm:text-sm">
                    <CheckCircle className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
                    <div><strong>Housing:</strong> Helping people find homes</div>
                  </div>
                  <div className="flex items-start gap-2 text-xs sm:text-sm">
                    <CheckCircle className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
                    <div><strong>Planning:</strong> Deciding what buildings can be built</div>
                  </div>
                  <div className="flex items-start gap-2 text-xs sm:text-sm">
                    <CheckCircle className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
                    <div><strong>Bins:</strong> Collecting rubbish and recycling</div>
                  </div>
                </div>
              </div>
            )}
            {(selectedCouncil.type === 'UA' || selectedCouncil.type === 'MD' || selectedCouncil.type === 'LB') && (
              <div className="space-y-2">
                <p className="text-xs sm:text-sm text-muted-foreground">
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
