'use client';

import { useState } from 'react';
import { Badge } from "@/components/ui/badge";
import {
  ExternalLink,
  FileText,
  Building2,
  Shield,
  CheckCircle2,
  Globe,
  ChevronDown
} from 'lucide-react';
import { useCouncil } from '@/context/CouncilContext';
import { getCouncilDisplayName, councilStats } from '@/data/councils';

export default function DataSourcesFooter() {
  const { selectedCouncil } = useCouncil();
  const [showAllSources, setShowAllSources] = useState(false);

  // If no council selected, show generic footer
  if (!selectedCouncil) {
    return (
      <footer className="bg-muted/20 border-t border-border/50 mt-12" aria-label="Data sources">
        <div className="container mx-auto px-4 py-10 sm:px-6 sm:py-14 max-w-7xl">
          <div className="space-y-8">
            <div className="text-center space-y-3">
              <h2 className="text-xl sm:text-2xl font-semibold">Data Sources</h2>
              <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
                Select a council to see where their data comes from.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-xl mx-auto">
              <div className="text-center p-4 rounded-xl bg-muted/40">
                <div className="text-2xl font-bold tabular-nums">{councilStats.totalCouncils}</div>
                <div className="text-xs text-muted-foreground mt-1">Councils</div>
              </div>
              <div className="text-center p-4 rounded-xl bg-muted/40">
                <div className="text-2xl font-bold tabular-nums">{councilStats.withCouncilTax}</div>
                <div className="text-xs text-muted-foreground mt-1">With Tax Data</div>
              </div>
              <div className="text-center p-4 rounded-xl bg-muted/40">
                <div className="text-2xl font-bold tabular-nums">{councilStats.withBudget}</div>
                <div className="text-xs text-muted-foreground mt-1">With Budgets</div>
              </div>
              <div className="text-center p-4 rounded-xl bg-muted/40">
                <div className="text-2xl font-bold tabular-nums">2025-26</div>
                <div className="text-xs text-muted-foreground mt-1">Data Year</div>
              </div>
            </div>

            <p className="text-center text-xs text-muted-foreground">
              All data from official UK government sources
            </p>
          </div>
        </div>
      </footer>
    );
  }

  const councilName = getCouncilDisplayName(selectedCouncil);
  const hasDetailedData = selectedCouncil.detailed && selectedCouncil.detailed.sources && selectedCouncil.detailed.sources.length > 0;
  const hasDocuments = selectedCouncil.detailed?.documents && selectedCouncil.detailed.documents.length > 0;

  // Simplified source list
  const primarySources = hasDetailedData
    ? selectedCouncil.detailed!.sources!.slice(0, 3)
    : [];

  const allSources = hasDetailedData
    ? selectedCouncil.detailed!.sources!
    : [];

  return (
    <footer className="bg-muted/20 border-t border-border/50 mt-12">
      <div className="container mx-auto px-4 py-10 sm:px-6 sm:py-14 max-w-7xl">
        <div className="space-y-10">

          {/* Header */}
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center gap-2">
              <h2 className="text-xl sm:text-2xl font-semibold">
                Data Sources
              </h2>
              {hasDetailedData && (
                <Badge variant="secondary" className="bg-navy-100 text-navy-600 border-0">
                  <CheckCircle2 className="h-3 w-3 mr-1" aria-hidden="true" />
                  Verified
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground max-w-xl mx-auto">
              {hasDetailedData
                ? `Data from ${councilName}'s official website`
                : "All data from official UK government websites"
              }
            </p>
          </div>

          {/* Official Documents - Primary Section for verified councils */}
          {hasDocuments && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                <h3 className="text-sm font-medium">Official Documents</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {selectedCouncil.detailed!.documents!.map((doc, index) => (
                  <a
                    key={index}
                    href={doc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center gap-3 p-3 rounded-lg border border-border/40 bg-card hover:border-border hover:bg-muted/30 transition-colors"
                  >
                    <div className="w-9 h-9 rounded-lg bg-muted/70 flex items-center justify-center shrink-0 group-hover:bg-muted transition-colors">
                      <FileText className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate group-hover:text-foreground transition-colors">
                        {doc.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {doc.year}{doc.size_kb ? ` · ${(doc.size_kb / 1024).toFixed(1)}MB` : ''}
                      </p>
                    </div>
                    <ExternalLink className="h-3.5 w-3.5 text-muted-foreground/50 group-hover:text-muted-foreground shrink-0" aria-hidden="true" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Source Links - Collapsible for verified councils */}
          {hasDetailedData && primarySources.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                  <h3 className="text-sm font-medium">Source Links</h3>
                </div>
                {allSources.length > 3 && (
                  <button
                    onClick={() => setShowAllSources(!showAllSources)}
                    className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    {showAllSources ? 'Show less' : `Show all ${allSources.length}`}
                    <ChevronDown className={`h-3 w-3 transition-transform ${showAllSources ? 'rotate-180' : ''}`} aria-hidden="true" />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {(showAllSources ? allSources : primarySources).map((source, index) => (
                  <a
                    key={index}
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <span className="text-sm group-hover:text-foreground transition-colors truncate pr-2">
                      {source.title}
                    </span>
                    <ExternalLink className="h-3 w-3 text-muted-foreground/50 group-hover:text-muted-foreground shrink-0" aria-hidden="true" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Non-verified councils: Show standard GOV.UK sources */}
          {!hasDetailedData && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <a
                href="https://www.gov.uk/government/statistics/council-tax-levels-set-by-local-authorities-in-england-2025-to-2026"
                target="_blank"
                rel="noopener noreferrer"
                className="group p-4 rounded-xl border border-border/40 bg-card hover:border-border transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <FileText className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                  <ExternalLink className="h-3 w-3 text-muted-foreground/50 group-hover:text-muted-foreground" aria-hidden="true" />
                </div>
                <p className="text-sm font-medium group-hover:text-foreground transition-colors">Council Tax 2025-26</p>
                <p className="text-xs text-muted-foreground mt-1">GOV.UK Statistics</p>
              </a>

              <a
                href="https://www.gov.uk/government/collections/local-authority-revenue-expenditure-and-financing"
                target="_blank"
                rel="noopener noreferrer"
                className="group p-4 rounded-xl border border-border/40 bg-card hover:border-border transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                  <ExternalLink className="h-3 w-3 text-muted-foreground/50 group-hover:text-muted-foreground" aria-hidden="true" />
                </div>
                <p className="text-sm font-medium group-hover:text-foreground transition-colors">Budget Data 2024-25</p>
                <p className="text-xs text-muted-foreground mt-1">Revenue Expenditure Returns</p>
              </a>

              <a
                href="https://geoportal.statistics.gov.uk/"
                target="_blank"
                rel="noopener noreferrer"
                className="group p-4 rounded-xl border border-border/40 bg-card hover:border-border transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <Globe className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                  <ExternalLink className="h-3 w-3 text-muted-foreground/50 group-hover:text-muted-foreground" aria-hidden="true" />
                </div>
                <p className="text-sm font-medium group-hover:text-foreground transition-colors">ONS Geography</p>
                <p className="text-xs text-muted-foreground mt-1">Council codes & boundaries</p>
              </a>
            </div>
          )}

        </div>
      </div>
    </footer>
  );
}
