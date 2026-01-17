'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, FileText, Building2, TrendingUp, Shield, Info, CheckCircle2, Globe } from 'lucide-react';
import { useCouncil } from '@/context/CouncilContext';
import { getCouncilDisplayName, councilStats } from '@/data/councils';

export default function DataSourcesFooter() {
  const { selectedCouncil } = useCouncil();

  // If no council selected, show generic footer
  if (!selectedCouncil) {
    return (
      <footer className="bg-muted/20 border-t border-border/50 mt-12">
        <div className="container mx-auto px-4 py-8 sm:px-6 sm:py-12 max-w-7xl">
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-lg sm:text-2xl font-semibold">Data Sources</h2>
              <p className="text-sm sm:text-base text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                Select a council to see where their data comes from.
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto">
              <div className="text-center p-4 bg-muted/50 rounded-xl">
                <div className="text-xl sm:text-2xl font-bold text-primary">{councilStats.totalCouncils}</div>
                <div className="text-sm text-muted-foreground mt-1">Councils Available</div>
              </div>
              <div className="text-center p-4 bg-muted/50 rounded-xl">
                <div className="text-xl sm:text-2xl font-bold text-primary">{councilStats.withCouncilTax}</div>
                <div className="text-sm text-muted-foreground mt-1">With Tax Data</div>
              </div>
              <div className="text-center p-4 bg-muted/50 rounded-xl">
                <div className="text-xl sm:text-2xl font-bold text-primary">{councilStats.withBudget}</div>
                <div className="text-sm text-muted-foreground mt-1">With Budget Data</div>
              </div>
              <div className="text-center p-4 bg-muted/50 rounded-xl">
                <div className="text-xl sm:text-2xl font-bold text-primary">2025-26</div>
                <div className="text-sm text-muted-foreground mt-1">Data Year</div>
              </div>
            </div>

            <div className="text-center text-sm text-muted-foreground border-t border-border/50 pt-4">
              <p>All data comes from official UK government sources</p>
            </div>
          </div>
        </div>
      </footer>
    );
  }

  const councilName = getCouncilDisplayName(selectedCouncil);
  const hasDetailedData = selectedCouncil.detailed && selectedCouncil.detailed.sources && selectedCouncil.detailed.sources.length > 0;

  // Council-specific data sources - prioritize council's own website if detailed data available
  const councilDataSources = hasDetailedData ? [
    {
      category: "Official Council Sources",
      icon: <Globe className="h-4 w-4" />,
      description: `Data directly from ${councilName}'s website`,
      isVerified: true,
      sources: selectedCouncil.detailed!.sources!.map(source => ({
        title: source.title,
        description: source.description || '',
        url: source.url,
        lastUpdated: selectedCouncil.detailed?.last_verified || '2025',
        dataType: "Council Website"
      }))
    },
    {
      category: "Government Data",
      icon: <FileText className="h-4 w-4" />,
      description: "Supplementary data from GOV.UK",
      isVerified: false,
      sources: [
        {
          title: "Council Tax Levels 2025-26",
          description: "National council tax statistics",
          url: "https://www.gov.uk/government/statistics/council-tax-levels-set-by-local-authorities-in-england-2025-to-2026",
          lastUpdated: "April 2025",
          dataType: "ODS Spreadsheet"
        }
      ]
    },
    {
      category: "Council Information",
      icon: <Building2 className="h-4 w-4" />,
      description: `Official records for ${councilName}`,
      isVerified: false,
      sources: [
        {
          title: "ONS Council Code",
          description: `${councilName} is registered as ${selectedCouncil.ons_code}`,
          url: "https://geoportal.statistics.gov.uk/",
          lastUpdated: "2024",
          dataType: "Geographic Data"
        }
      ]
    }
  ] : [
    {
      category: "Council Tax Data",
      icon: <FileText className="h-4 w-4" />,
      description: `Where we got ${councilName}'s council tax figures`,
      isVerified: false,
      sources: [
        {
          title: "Council Tax Levels 2025-26",
          description: `Band D for ${councilName}: £${selectedCouncil.council_tax?.band_d_2025.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || 'N/A'} (council portion only)`,
          url: "https://www.gov.uk/government/statistics/council-tax-levels-set-by-local-authorities-in-england-2025-to-2026",
          lastUpdated: "April 2025",
          dataType: "ODS Spreadsheet"
        },
        {
          title: "Council Tax Levels 2024-25",
          description: "Previous year comparison data",
          url: "https://www.gov.uk/government/statistics/council-tax-levels-set-by-local-authorities-in-england-2024-to-2025",
          lastUpdated: "March 2024",
          dataType: "ODS Spreadsheet"
        }
      ]
    },
    {
      category: "Budget & Spending Data",
      icon: <TrendingUp className="h-4 w-4" />,
      description: `Where we got ${councilName}'s budget breakdown`,
      isVerified: false,
      sources: selectedCouncil.budget ? [
        {
          title: "Revenue Expenditure & Financing 2024-25",
          description: `Total service budget for ${councilName}: £${((selectedCouncil.budget.total_service ?? 0) / 1000).toLocaleString('en-GB', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}m`,
          url: "https://www.gov.uk/government/collections/local-authority-revenue-expenditure-and-financing",
          lastUpdated: "2024-25",
          dataType: "ODS Spreadsheet"
        },
        {
          title: "Revenue Outturn Summary (RO)",
          description: "Detailed breakdown by service area",
          url: "https://www.gov.uk/government/statistical-data-sets/live-tables-on-local-government-finance",
          lastUpdated: "Quarterly",
          dataType: "Excel Tables"
        }
      ] : [
        {
          title: "Revenue Expenditure & Financing",
          description: "Budget data not available for this council type",
          url: "https://www.gov.uk/government/collections/local-authority-revenue-expenditure-and-financing",
          lastUpdated: "2024-25",
          dataType: "ODS Spreadsheet"
        }
      ]
    },
    {
      category: "Council Information",
      icon: <Building2 className="h-4 w-4" />,
      description: `Official records for ${councilName}`,
      isVerified: false,
      sources: [
        {
          title: "ONS Council Code",
          description: `${councilName} is registered as ${selectedCouncil.ons_code}`,
          url: "https://geoportal.statistics.gov.uk/",
          lastUpdated: "2024",
          dataType: "Geographic Data"
        },
        {
          title: "Council Type Classification",
          description: `${selectedCouncil.type_name} (${selectedCouncil.type})`,
          url: "https://www.data.gov.uk/dataset/cbaf0333-3548-4e42-8a8f-6dc5376bc360/local-authority-districts-december-2024-names-and-codes-in-the-uk",
          lastUpdated: "December 2024",
          dataType: "CSV Dataset"
        }
      ]
    }
  ];

  // Data methodology specific to this council
  const methodology = [
    {
      title: "Council Tax Bands",
      description: `Band D is shown as the baseline. Other bands are calculated using the official ratios (Band A = 6/9 of Band D, Band H = 18/9 of Band D, etc.).`
    },
    {
      title: "Budget Estimates",
      description: selectedCouncil.budget
        ? `Budget figures are from official government data for 2024-25. ${councilName}'s total service budget is £${((selectedCouncil.budget.total_service ?? 0) / 1000).toLocaleString('en-GB', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} million.`
        : `Budget breakdown not available for ${selectedCouncil.type_name}s in the source data.`
    },
    {
      title: "Revenue Estimates",
      description: `Revenue sources are estimated based on typical patterns for ${selectedCouncil.type_name}s. For exact figures, see ${councilName}'s published accounts.`
    }
  ];

  return (
    <footer className="bg-muted/20 border-t border-border/50 mt-12">
      <div className="container mx-auto px-4 py-8 sm:px-6 sm:py-12 max-w-7xl">
        <div className="space-y-8">

          {/* Header - Council Specific */}
          <div className="text-center space-y-3">
            <div className="flex items-center justify-center gap-3">
              <h2 className="text-lg sm:text-2xl font-semibold">
                Where {councilName}&apos;s Data Comes From
              </h2>
              {hasDetailedData && (
                <Badge variant="secondary" className="text-sm bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Verified
                </Badge>
              )}
            </div>
            <p className="text-sm sm:text-base text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              {hasDetailedData
                ? `Data sourced directly from ${councilName}'s official website and verified for accuracy.`
                : "All the numbers you see come from official government websites. You can click the links below to see the original documents yourself."
              }
            </p>
          </div>

          {/* Council-specific quick stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto">
            <div className="text-center p-4 bg-muted/50 rounded-xl">
              <div className="text-base sm:text-lg font-bold text-primary">{selectedCouncil.ons_code}</div>
              <div className="text-sm text-muted-foreground mt-1">ONS Code</div>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-xl">
              <div className="text-base sm:text-lg font-bold text-primary">{selectedCouncil.type}</div>
              <div className="text-sm text-muted-foreground mt-1">Council Type</div>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-xl">
              <div className="text-base sm:text-lg font-bold text-primary">
                {selectedCouncil.council_tax ? '✓' : '—'}
              </div>
              <div className="text-sm text-muted-foreground mt-1">Tax Data</div>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-xl">
              <div className="text-base sm:text-lg font-bold text-primary">
                {selectedCouncil.budget ? '✓' : '—'}
              </div>
              <div className="text-sm text-muted-foreground mt-1">Budget Data</div>
            </div>
          </div>

          {/* Data Sources Grid */}
          <div className="grid gap-4 sm:gap-6 md:grid-cols-3">
            {councilDataSources.map((category, index) => (
              <Card key={index} className={`h-full border shadow-sm rounded-xl ${category.isVerified ? 'border-green-300 dark:border-green-700 bg-green-50/30 dark:bg-green-950/20' : 'border-border/40 bg-card'}`}>
                <CardHeader className="p-5 pb-3">
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle className="flex items-center gap-2 text-sm sm:text-base font-semibold">
                      <span className={category.isVerified ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}>{category.icon}</span>
                      {category.category}
                    </CardTitle>
                    {category.isVerified && (
                      <Badge variant="secondary" className="text-sm bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 shrink-0">
                        Direct Source
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{category.description}</p>
                </CardHeader>
                <CardContent className="px-5 pb-5">
                  <div className="space-y-4">
                    {category.sources.map((source, sourceIndex) => (
                      <div key={sourceIndex} className="space-y-2">
                        <div>
                          <a
                            href={source.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm font-medium text-primary hover:underline inline-flex items-start gap-1.5 cursor-pointer"
                          >
                            {source.title}
                            <ExternalLink className="h-3 w-3 mt-0.5 flex-shrink-0 opacity-70" />
                          </a>
                          <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                            {source.description}
                          </p>
                          <div className="flex flex-wrap gap-2 mt-2">
                            <Badge variant="outline" className="text-sm border-muted-foreground/30">
                              {source.lastUpdated}
                            </Badge>
                            <Badge variant="secondary" className="text-sm">
                              {source.dataType}
                            </Badge>
                          </div>
                        </div>
                        {sourceIndex < category.sources.length - 1 && (
                          <hr className="border-border/30" />
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* How We Used The Data */}
          <Card className="border border-border/40 bg-card shadow-sm rounded-xl">
            <CardHeader className="p-5 sm:p-6 pb-4">
              <CardTitle className="flex items-center gap-3 text-base sm:text-lg font-semibold">
                <Shield className="h-5 w-5 text-muted-foreground" />
                How We Used the Data for {councilName}
              </CardTitle>
            </CardHeader>
            <CardContent className="px-5 pb-5 sm:px-6 sm:pb-6">
              <div className="grid gap-6 md:grid-cols-3">
                {methodology.map((item, index) => (
                  <div key={index} className="space-y-2">
                    <h4 className="text-sm font-medium">{item.title}</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Helpful tip */}
          <Card className="border border-border/40 bg-muted/30 shadow-sm rounded-xl">
            <CardContent className="p-5">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 shrink-0 mt-0.5 text-primary" />
                <div className="text-sm">
                  <p className="font-medium mb-1">Want to check our numbers?</p>
                  <p className="text-muted-foreground leading-relaxed">
                    Click any link above to see the exact spreadsheet we used.
                    Look for &quot;{selectedCouncil.name}&quot; or code &quot;{selectedCouncil.ons_code}&quot; in the data.
                    If you spot any mistakes, please let us know!
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Footer */}
          <div className="border-t border-border/50 pt-6 space-y-6">
            <div className="grid gap-6 md:grid-cols-2 text-sm text-muted-foreground">
              <div className="space-y-2">
                <h4 className="font-medium text-foreground">About This Dashboard</h4>
                <p className="leading-relaxed">
                  This is an independent tool to help you understand council finances.
                  We are not connected to any council. We just make government data easier to read.
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium text-foreground">Using This Data</h4>
                <p className="leading-relaxed">
                  All data is from UK government websites and is free to use.
                  If you need the data for something official, please check the original source links above.
                </p>
              </div>
            </div>

            <div className="text-center text-sm text-muted-foreground border-t border-border/50 pt-6">
              <p>
                Data last updated: January 2025 · Made for UK residents
              </p>
            </div>
          </div>

        </div>
      </div>
    </footer>
  );
}
