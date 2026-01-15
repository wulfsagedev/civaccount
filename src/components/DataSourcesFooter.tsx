'use client';

import { ExternalLink } from 'lucide-react';
import { useCouncil } from '@/context/CouncilContext';
import { getCouncilDisplayName, councilStats } from '@/data/councils';

export default function DataSourcesFooter() {
  const { selectedCouncil } = useCouncil();

  // If no council selected, show simple footer
  if (!selectedCouncil) {
    return (
      <footer className="bg-muted/30 border-t mt-12">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="text-center space-y-4">
            <h2 className="text-lg font-semibold">Data Sources</h2>
            <p className="text-sm text-muted-foreground">
              Data for {councilStats.totalCouncils} councils from official UK government sources (2025-26).
            </p>
            <div className="flex justify-center gap-4 text-xs text-muted-foreground">
              <a href="https://www.gov.uk/government/statistics/council-tax-levels-set-by-local-authorities-in-england-2025-to-2026" target="_blank" rel="noopener noreferrer" className="hover:text-foreground flex items-center gap-1">
                Council Tax Data <ExternalLink className="h-3 w-3" />
              </a>
              <a href="https://www.gov.uk/government/collections/local-authority-revenue-expenditure-and-financing" target="_blank" rel="noopener noreferrer" className="hover:text-foreground flex items-center gap-1">
                Budget Data <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        </div>
      </footer>
    );
  }

  const councilName = getCouncilDisplayName(selectedCouncil);

  return (
    <footer className="bg-muted/30 border-t mt-12">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="space-y-6">
          {/* Header */}
          <div className="text-center">
            <h2 className="text-lg font-semibold mb-2">Where {councilName}&apos;s Data Comes From</h2>
            <p className="text-sm text-muted-foreground">
              All figures from official UK government sources. Click to verify.
            </p>
          </div>

          {/* Quick stats row */}
          <div className="flex justify-center gap-6 text-sm">
            <span><strong>ONS Code:</strong> {selectedCouncil.ons_code}</span>
            <span><strong>Type:</strong> {selectedCouncil.type_name}</span>
            <span><strong>Data Year:</strong> 2025-26</span>
          </div>

          {/* Source links */}
          <div className="flex flex-wrap justify-center gap-4 text-sm">
            <a
              href="https://www.gov.uk/government/statistics/council-tax-levels-set-by-local-authorities-in-england-2025-to-2026"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-primary hover:underline"
            >
              Council Tax Data (April 2025) <ExternalLink className="h-3 w-3" />
            </a>
            <a
              href="https://www.gov.uk/government/collections/local-authority-revenue-expenditure-and-financing"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-primary hover:underline"
            >
              Budget Data (2024-25) <ExternalLink className="h-3 w-3" />
            </a>
          </div>

          {/* Notes */}
          <div className="text-center text-xs text-muted-foreground border-t pt-4 space-y-2">
            <p>
              Band D is the baseline. Other bands use official ratios (A = 6/9, H = 18/9 of D).
              {selectedCouncil.council_tax && ` ${councilName} Band D: £${selectedCouncil.council_tax.band_d_2025.toFixed(2)} (council portion only).`}
            </p>
            <p>
              This is an independent tool. We are not connected to any council.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
