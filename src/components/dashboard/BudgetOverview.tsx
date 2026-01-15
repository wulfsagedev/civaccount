'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
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
  const budgetBreakdown: Array<{category: string; percentage: number; amount: number; description: string}> = [];

  if (budget) {
    const total = budget.total_service || 1;

    if (budget.adult_social_care) {
      budgetBreakdown.push({
        category: "Adult Social Care",
        percentage: (budget.adult_social_care / total) * 100,
        amount: budget.adult_social_care * 1000,
        description: "Help for older people and people with disabilities"
      });
    }

    if (budget.childrens_social_care) {
      budgetBreakdown.push({
        category: "Children's Services",
        percentage: (budget.childrens_social_care / total) * 100,
        amount: budget.childrens_social_care * 1000,
        description: "Keeping children safe and helping families who need support"
      });
    }

    if (budget.education) {
      budgetBreakdown.push({
        category: "Education & Schools",
        percentage: (budget.education / total) * 100,
        amount: budget.education * 1000,
        description: "School buses, help for children with extra needs, and school support"
      });
    }

    if (budget.transport) {
      budgetBreakdown.push({
        category: "Roads & Transport",
        percentage: (budget.transport / total) * 100,
        amount: budget.transport * 1000,
        description: "Fixing roads, traffic lights, and helping buses run"
      });
    }

    if (budget.public_health) {
      budgetBreakdown.push({
        category: "Public Health",
        percentage: (budget.public_health / total) * 100,
        amount: budget.public_health * 1000,
        description: "Stopping illness from spreading and helping people stay healthy"
      });
    }

    if (budget.housing) {
      budgetBreakdown.push({
        category: "Housing",
        percentage: (budget.housing / total) * 100,
        amount: budget.housing * 1000,
        description: "Helping people find homes and stopping homelessness"
      });
    }

    if (budget.cultural) {
      budgetBreakdown.push({
        category: "Libraries & Fun Stuff",
        percentage: (budget.cultural / total) * 100,
        amount: budget.cultural * 1000,
        description: "Libraries, museums, art, and community centres"
      });
    }

    if (budget.environmental) {
      budgetBreakdown.push({
        category: "Bins & Streets",
        percentage: (budget.environmental / total) * 100,
        amount: budget.environmental * 1000,
        description: "Collecting bins, recycling, and cleaning streets"
      });
    }

    if (budget.planning) {
      budgetBreakdown.push({
        category: "Planning",
        percentage: (budget.planning / total) * 100,
        amount: budget.planning * 1000,
        description: "Deciding what can be built and where"
      });
    }

    if (budget.central_services) {
      budgetBreakdown.push({
        category: "Running the Council",
        percentage: (budget.central_services / total) * 100,
        amount: budget.central_services * 1000,
        description: "Meetings, staff, and keeping the council running"
      });
    }

    // Sort by percentage descending
    budgetBreakdown.sort((a, b) => b.percentage - a.percentage);
  }

  // Key metrics - simplified
  const keyMetrics = [
    {
      title: "Total Budget",
      value: totalBudget ? formatBudget(totalBudget / 1000) : 'N/A',
      subtitle: "per year"
    },
    {
      title: "Net Spending",
      value: netCurrent ? formatBudget(netCurrent / 1000) : 'N/A',
      subtitle: "council tax & grants"
    },
    {
      title: "Daily Cost",
      value: dailyCost ? `£${(dailyCost / 1000).toFixed(0)}K` : 'N/A',
      subtitle: "to run services"
    },
    {
      title: "Band D Tax",
      value: councilTax ? `£${councilTax.band_d_2025.toFixed(2)}` : 'N/A',
      subtitle: "council portion only"
    }
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Key Metrics Grid - Clean and simple */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {keyMetrics.map((metric, index) => (
          <div key={index} className="text-center p-4 bg-muted/50 rounded-xl">
            <p className="text-2xl sm:text-3xl font-bold">{metric.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{metric.subtitle}</p>
            <p className="text-sm font-medium mt-2">{metric.title}</p>
          </div>
        ))}
      </div>

      {/* Budget Breakdown */}
      {budgetBreakdown.length > 0 ? (
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Where Your Money Goes</CardTitle>
            <CardDescription>
              How {selectedCouncil.name} spends money across different services
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {budgetBreakdown.map((item, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">{item.category}</span>
                    <div className="text-right">
                      <span className="font-bold text-sm">{formatBudget(item.amount / 1000)}</span>
                      <span className="text-xs text-muted-foreground ml-2">{item.percentage.toFixed(0)}%</span>
                    </div>
                  </div>
                  <Progress value={Math.min(item.percentage, 100)} className="h-1.5" />
                  <p className="text-xs text-muted-foreground">{item.description}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="p-6 bg-muted/50 rounded-xl text-center">
          <p className="text-muted-foreground text-sm">Detailed budget breakdown not available for this council.</p>
        </div>
      )}

      {/* Context Box */}
      <div className="p-4 sm:p-6 bg-muted/30 rounded-xl border-l-4 border-l-primary">
        <h3 className="font-semibold mb-2">What Does This Council Do?</h3>
        <p className="text-sm mb-3">
          {selectedCouncil.name} is a {selectedCouncil.type_name}.
        </p>
        {selectedCouncil.type === 'SC' && (
          <p className="text-sm text-muted-foreground">
            County councils handle social care, education support, and main roads across the whole area.
          </p>
        )}
        {selectedCouncil.type === 'SD' && (
          <p className="text-sm text-muted-foreground">
            District councils handle housing, planning, and bin collections in your local area.
          </p>
        )}
        {(selectedCouncil.type === 'UA' || selectedCouncil.type === 'MD' || selectedCouncil.type === 'LB') && (
          <p className="text-sm text-muted-foreground">
            This council handles everything - social care, schools, housing, planning, bins, roads, and more.
          </p>
        )}
      </div>
    </div>
  );
};

export default BudgetOverview;
