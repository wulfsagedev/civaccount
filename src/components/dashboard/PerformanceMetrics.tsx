'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Calendar, PoundSterling, Building, Receipt, CheckCircle, AlertTriangle, Info, Search, ClipboardList, Percent, Users } from 'lucide-react';
import { useCouncil } from '@/context/CouncilContext';
import { calculateEfficiencyMetrics, getCouncilPopulation, formatCurrency } from '@/data/councils';

const PerformanceMetrics = () => {
  const { selectedCouncil } = useCouncil();

  if (!selectedCouncil) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">Please select a council to view performance information.</p>
        </CardContent>
      </Card>
    );
  }

  // Get efficiency metrics (after null check)
  const efficiencyMetrics = calculateEfficiencyMetrics(selectedCouncil);
  const population = getCouncilPopulation(selectedCouncil.name);

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold tracking-tight">How Is {selectedCouncil.name} Doing?</h2>
        <p className="text-muted-foreground">
          What we know about how this council is performing
        </p>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border border-border/40 bg-card shadow-sm rounded-xl p-4">
          <div className="flex items-center gap-3">
            <Building className="h-5 w-5 text-primary opacity-70" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">Council Type</p>
              <p className="text-lg font-bold text-primary">{selectedCouncil.type_name}</p>
            </div>
          </div>
        </Card>

        <Card className="border border-border/40 bg-card shadow-sm rounded-xl p-4">
          <div className="flex items-center gap-3">
            <Calendar className="h-5 w-5 text-primary opacity-70" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">Data Year</p>
              <p className="text-lg font-bold text-primary">2025-26</p>
            </div>
          </div>
        </Card>

        <Card className="border border-border/40 bg-card shadow-sm rounded-xl p-4">
          <div className="flex items-center gap-3">
            <PoundSterling className="h-5 w-5 text-primary opacity-70" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">Budget Data</p>
              <p className="text-lg font-bold text-primary">{selectedCouncil.budget ? 'Available' : 'Limited'}</p>
            </div>
          </div>
        </Card>

        <Card className="border border-border/40 bg-card shadow-sm rounded-xl p-4">
          <div className="flex items-center gap-3">
            <Receipt className="h-5 w-5 text-primary opacity-70" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">Tax Data</p>
              <p className="text-lg font-bold text-primary">{selectedCouncil.council_tax ? 'Available' : 'Limited'}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Efficiency Metrics */}
      {(efficiencyMetrics || population) && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {population && (
            <Card className="border border-border/40 bg-card shadow-sm rounded-xl p-4">
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-primary opacity-70" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">Population Served</p>
                  <p className="text-lg font-bold text-primary">{population.toLocaleString('en-GB')}</p>
                  <p className="text-xs text-muted-foreground">ONS mid-2024 estimate</p>
                </div>
              </div>
            </Card>
          )}

          {efficiencyMetrics?.perCapitaSpending && (
            <Card className="border border-border/40 bg-card shadow-sm rounded-xl p-4">
              <div className="flex items-center gap-3">
                <PoundSterling className="h-5 w-5 text-primary opacity-70" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">Spending Per Person</p>
                  <p className="text-lg font-bold text-primary">{formatCurrency(efficiencyMetrics.perCapitaSpending, { decimals: 0 })}</p>
                  <p className="text-xs text-muted-foreground">Total budget ÷ population</p>
                </div>
              </div>
            </Card>
          )}

          {efficiencyMetrics?.adminOverheadPercent !== null && efficiencyMetrics?.adminOverheadPercent !== undefined && (
            <Card className="border border-border/40 bg-card shadow-sm rounded-xl p-4">
              <div className="flex items-center gap-3">
                <Percent className="h-5 w-5 text-primary opacity-70" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">Admin Overhead</p>
                  <p className="text-lg font-bold text-primary">{efficiencyMetrics.adminOverheadPercent.toFixed(1)}%</p>
                  <p className="text-xs text-muted-foreground">Central services as % of budget</p>
                </div>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Performance Note */}
      <Card className="border border-border/40 bg-card shadow-sm rounded-xl">
        <CardHeader className="p-5 sm:p-6 pb-4">
          <div className="flex items-center gap-3">
            <Info className="h-5 w-5 text-primary opacity-70" />
            <CardTitle className="text-lg sm:text-xl font-semibold">Where to Find More Information</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="px-5 pb-5 sm:px-6 sm:pb-6">
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Want to know if your council is doing a good job? Each council publishes reports about how well they are doing.
              You can also check government websites that rate councils.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 bg-muted rounded-xl">
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <Search className="h-4 w-4 text-primary" />
                  Where to Look
                </h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>- Your council&apos;s website</li>
                  <li>- Ofsted (checks children&apos;s services)</li>
                  <li>- CQC (checks care services)</li>
                  <li>- LGA (compares councils)</li>
                  <li>- Government websites</li>
                </ul>
              </div>

              <div className="p-4 bg-muted rounded-xl">
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <ClipboardList className="h-4 w-4 text-primary" />
                  What They Measure
                </h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>- How happy residents are</li>
                  <li>- How quickly they answer questions</li>
                  <li>- How fast they process building plans</li>
                  <li>- How much gets recycled</li>
                  <li>- How quickly they help people who need care</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* General UK Council Performance Context */}
      <Card className="border border-border/40 bg-card shadow-sm rounded-xl">
        <CardHeader className="p-5 sm:p-6 pb-4">
          <CardTitle className="flex items-center gap-3 text-lg sm:text-xl font-semibold">
            <TrendingUp className="h-5 w-5 text-primary opacity-70" />
            What&apos;s Happening Across UK Councils
          </CardTitle>
          <CardDescription className="text-sm sm:text-base leading-relaxed">
            Challenges that many councils like {selectedCouncil.name} are dealing with
          </CardDescription>
        </CardHeader>
        <CardContent className="px-5 pb-5 sm:px-6 sm:pb-6 space-y-4">
          {(selectedCouncil.type === 'SC' || selectedCouncil.type === 'UA' || selectedCouncil.type === 'MD') && (
            <>
              <div className="p-4 border rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold">Adult Social Care</h4>
                  <Badge variant="secondary">High Demand</Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-2">
                  The number of people needing adult social care is increasing across the UK as the population ages.
                </p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <AlertTriangle className="h-3 w-3" />
                  <span>This is one of the largest areas of council spending</span>
                </div>
              </div>

              <div className="p-4 border rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold">Children&apos;s Services</h4>
                  <Badge variant="secondary">High Demand</Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-2">
                  Children&apos;s services include safeguarding, fostering, and support for families. Demand for these services varies by area.
                </p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <AlertTriangle className="h-3 w-3" />
                  <span>Staff recruitment is an ongoing area of focus nationally</span>
                </div>
              </div>
            </>
          )}

          <div className="p-4 border rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold">Roads & Environment</h4>
              <Badge variant="default">Core Service</Badge>
            </div>
            <p className="text-sm text-muted-foreground mb-2">
              Councils maintain roads, street lighting, and public spaces. Many use technology to help plan maintenance work.
            </p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <CheckCircle className="h-3 w-3" />
              <span>Digital reporting tools are available in many areas</span>
            </div>
          </div>

          {(selectedCouncil.type === 'SD' || selectedCouncil.type === 'UA' || selectedCouncil.type === 'MD') && (
            <div className="p-4 border rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold">Planning</h4>
                <Badge variant="secondary">Core Service</Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-2">
                Planning departments process building applications and develop local plans. Processing times vary by council.
              </p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <TrendingUp className="h-3 w-3" />
                <span>Online application systems are now standard</span>
              </div>
            </div>
          )}

          {(selectedCouncil.type === 'SD' || selectedCouncil.type === 'UA' || selectedCouncil.type === 'MD') && (
            <div className="p-4 border rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold">Housing</h4>
                <Badge variant="secondary">Core Service</Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-2">
                Councils manage housing registers, prevent homelessness, and work with housing associations. Housing demand varies by area.
              </p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <AlertTriangle className="h-3 w-3" />
                <span>Housing is a statutory duty for councils</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Link to council website */}
      <Card className="border border-border/40 bg-muted/30 shadow-sm rounded-xl">
        <CardContent className="p-5 sm:p-6">
          <div className="flex items-start gap-3 text-muted-foreground">
            <Info className="h-5 w-5 shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium mb-1">Want to know more?</p>
              <p>
                Go to {selectedCouncil.name}&apos;s website to see their reports about how they are doing.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PerformanceMetrics;
