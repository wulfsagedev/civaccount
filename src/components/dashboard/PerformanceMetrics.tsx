'use client';

import { Badge } from "@/components/ui/badge";
import { TrendingUp, Calendar, PoundSterling, Building, CheckCircle, AlertTriangle, Info, Search, ClipboardList, Percent, Users } from 'lucide-react';
import { useCouncil } from '@/context/CouncilContext';
import { calculateEfficiencyMetrics, getCouncilPopulation, formatCurrency } from '@/data/councils';

const PerformanceMetrics = () => {
  const { selectedCouncil } = useCouncil();

  if (!selectedCouncil) {
    return (
      <div className="card-elevated p-8 text-center">
        <p className="text-muted-foreground">Please select a council to view performance information.</p>
      </div>
    );
  }

  // Get efficiency metrics (after null check)
  const efficiencyMetrics = calculateEfficiencyMetrics(selectedCouncil);
  const population = getCouncilPopulation(selectedCouncil.name);

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="card-elevated p-6 sm:p-8">
            <div className="flex items-start justify-between mb-6">
              <div>
                <p className="type-overline mb-2">Performance Overview</p>
                <h2 className="text-2xl sm:text-3xl font-bold text-foreground leading-tight">
                  How is {selectedCouncil.name} doing?
                </h2>
              </div>
              <Badge variant="outline" className="text-xs font-medium">
                2024-25
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-lg">
              What we know about how this council is performing based on available data and typical metrics for {selectedCouncil.type_name}s.
            </p>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="card-elevated p-6">
          <p className="type-overline mb-4">Data Status</p>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">Budget data</span>
              <Badge variant={selectedCouncil.budget ? "outline" : "secondary"} className="text-xs">
                {selectedCouncil.budget ? 'Available' : 'Limited'}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Tax data</span>
              <Badge variant={selectedCouncil.council_tax ? "outline" : "secondary"} className="text-xs">
                {selectedCouncil.council_tax ? 'Available' : 'Limited'}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Detailed data</span>
              <Badge variant={selectedCouncil.detailed ? "outline" : "secondary"} className="text-xs">
                {selectedCouncil.detailed ? 'Verified' : 'Basic'}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <div className="card-elevated p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
              <Building className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Council Type</p>
              <p className="font-semibold">{selectedCouncil.type_name}</p>
            </div>
          </div>
        </div>

        <div className="card-elevated p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
              <Calendar className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Data Year</p>
              <p className="font-semibold">2024-25</p>
            </div>
          </div>
        </div>

        {population && (
          <div className="card-elevated p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                <Users className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Population</p>
                <p className="font-semibold tabular-nums">{population.toLocaleString('en-GB')}</p>
              </div>
            </div>
          </div>
        )}

        {efficiencyMetrics?.perCapitaSpending && (
          <div className="card-elevated p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                <PoundSterling className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Per Person</p>
                <p className="font-semibold tabular-nums">{formatCurrency(efficiencyMetrics.perCapitaSpending, { decimals: 0 })}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Efficiency Metrics */}
      {efficiencyMetrics && (
        <div className="card-elevated p-6 sm:p-8">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-lg sm:text-xl font-semibold mb-1">Efficiency metrics</h2>
              <p className="text-sm text-muted-foreground">
                How {selectedCouncil.name} compares on key efficiency measures
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {efficiencyMetrics.perCapitaSpending && (
              <div className="p-5 bg-muted/30 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <PoundSterling className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Spending Per Person</span>
                </div>
                <p className="text-2xl font-bold mb-1 tabular-nums">
                  {formatCurrency(efficiencyMetrics.perCapitaSpending, { decimals: 0 })}
                </p>
                <p className="text-sm text-muted-foreground">
                  Total budget divided by population
                </p>
              </div>
            )}

            {efficiencyMetrics.adminOverheadPercent !== null && efficiencyMetrics.adminOverheadPercent !== undefined && (
              <div className="p-5 bg-muted/30 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <Percent className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Admin Overhead</span>
                </div>
                <p className="text-2xl font-bold mb-1 tabular-nums">
                  {efficiencyMetrics.adminOverheadPercent.toFixed(1)}%
                </p>
                <p className="text-sm text-muted-foreground">
                  Central services as percentage of budget
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Where to Find More Information */}
      <div className="card-elevated p-6 sm:p-8">
        <div className="flex items-center gap-3 mb-6">
          <Info className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-lg sm:text-xl font-semibold">Where to find more information</h2>
        </div>

        <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
          Want to know if your council is doing a good job? Each council publishes reports about how well they are doing.
          You can also check government websites that rate councils.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="p-5 bg-muted/30 rounded-xl">
            <div className="flex items-center gap-2 mb-3">
              <Search className="h-4 w-4 text-muted-foreground" />
              <h4 className="font-semibold text-sm">Where to Look</h4>
            </div>
            <ul className="text-sm text-muted-foreground space-y-2">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-stone-400" />
                Your council&apos;s website
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-stone-400" />
                Ofsted (checks children&apos;s services)
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-stone-400" />
                CQC (checks care services)
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-stone-400" />
                LGA (compares councils)
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-stone-400" />
                Government websites
              </li>
            </ul>
          </div>

          <div className="p-5 bg-muted/30 rounded-xl">
            <div className="flex items-center gap-2 mb-3">
              <ClipboardList className="h-4 w-4 text-muted-foreground" />
              <h4 className="font-semibold text-sm">What They Measure</h4>
            </div>
            <ul className="text-sm text-muted-foreground space-y-2">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-stone-400" />
                How happy residents are
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-stone-400" />
                How quickly they answer questions
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-stone-400" />
                How fast they process building plans
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-stone-400" />
                How much gets recycled
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-stone-400" />
                How quickly they help people who need care
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Service Performance Context */}
      <div className="card-elevated p-6 sm:p-8">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-3">
            <TrendingUp className="h-5 w-5 text-muted-foreground" />
            <div>
              <h2 className="text-lg sm:text-xl font-semibold">What&apos;s happening across UK councils</h2>
              <p className="text-sm text-muted-foreground">
                Challenges that many councils like {selectedCouncil.name} are dealing with
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {(selectedCouncil.type === 'SC' || selectedCouncil.type === 'UA' || selectedCouncil.type === 'MD' || selectedCouncil.type === 'LB') && (
            <>
              <div className="p-5 border border-border/50 rounded-xl">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold">Adult Social Care</h4>
                  <Badge variant="secondary" className="text-xs">High Demand</Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-3 leading-relaxed">
                  The number of people needing adult social care is increasing across the UK as the population ages.
                </p>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <AlertTriangle className="h-3.5 w-3.5 text-stone-400" />
                  <span>This is one of the largest areas of council spending</span>
                </div>
              </div>

              <div className="p-5 border border-border/50 rounded-xl">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold">Children&apos;s Services</h4>
                  <Badge variant="secondary" className="text-xs">High Demand</Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-3 leading-relaxed">
                  Children&apos;s services include safeguarding, fostering, and support for families. Demand for these services varies by area.
                </p>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <AlertTriangle className="h-3.5 w-3.5 text-stone-400" />
                  <span>Staff recruitment is an ongoing area of focus nationally</span>
                </div>
              </div>
            </>
          )}

          <div className="p-5 border border-border/50 rounded-xl">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold">Roads & Environment</h4>
              <Badge variant="outline" className="text-xs">Core Service</Badge>
            </div>
            <p className="text-sm text-muted-foreground mb-3 leading-relaxed">
              Councils maintain roads, street lighting, and public spaces. Many use technology to help plan maintenance work.
            </p>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle className="h-3.5 w-3.5 text-stone-400" />
              <span>Digital reporting tools are available in many areas</span>
            </div>
          </div>

          {(selectedCouncil.type === 'SD' || selectedCouncil.type === 'UA' || selectedCouncil.type === 'MD' || selectedCouncil.type === 'LB') && (
            <>
              <div className="p-5 border border-border/50 rounded-xl">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold">Planning</h4>
                  <Badge variant="outline" className="text-xs">Core Service</Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-3 leading-relaxed">
                  Planning departments process building applications and develop local plans. Processing times vary by council.
                </p>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <TrendingUp className="h-3.5 w-3.5 text-stone-400" />
                  <span>Online application systems are now standard</span>
                </div>
              </div>

              <div className="p-5 border border-border/50 rounded-xl">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold">Housing</h4>
                  <Badge variant="outline" className="text-xs">Core Service</Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-3 leading-relaxed">
                  Councils manage housing registers, prevent homelessness, and work with housing associations. Housing demand varies by area.
                </p>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <AlertTriangle className="h-3.5 w-3.5 text-stone-400" />
                  <span>Housing is a statutory duty for councils</span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Note about council website */}
      <div className="card-elevated p-6 bg-muted/30">
        <div className="flex items-start gap-3 text-muted-foreground">
          <Info className="h-5 w-5 shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-foreground mb-1">Want to know more?</p>
            <p className="leading-relaxed">
              Go to {selectedCouncil.name}&apos;s website to see their reports about how they are doing,
              including annual reports, inspection results, and performance data.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PerformanceMetrics;
