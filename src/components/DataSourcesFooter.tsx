'use client';

import { useState } from 'react';
import { ExternalLink, ChevronDown, Calendar, Shield } from 'lucide-react';
import { useCouncil } from '@/context/CouncilContext';
import { getCouncilDisplayName, councilStats } from '@/data/councils';

function formatCheckedDate(isoDate: string): string {
  const date = new Date(isoDate);
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default function DataSourcesFooter() {
  const { selectedCouncil } = useCouncil();
  const [expanded, setExpanded] = useState(false);

  // No council selected — generic footer
  if (!selectedCouncil) {
    return (
      <footer className="border-t border-border/50 mt-12" aria-label="Data sources">
        <div className="container mx-auto px-4 py-8 sm:px-6 max-w-3xl text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Shield className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            <p className="type-body-sm font-semibold">Official UK government data</p>
          </div>
          <p className="type-caption text-muted-foreground">
            {councilStats.totalCouncils} councils with council tax and budget data for 2025-26
          </p>
        </div>
      </footer>
    );
  }

  const councilName = getCouncilDisplayName(selectedCouncil);
  const detailed = selectedCouncil.detailed;
  const lastChecked = detailed?.last_verified;

  // Collect the 3 most important links to show by default
  const keyLinks: Array<{ title: string; url: string; meta?: string }> = [];

  // 1. Budget document (most relevant)
  if (detailed?.budget_url) {
    keyLinks.push({ title: `${selectedCouncil.name} budget`, url: detailed.budget_url });
  }
  // 2. Council tax page
  if (detailed?.council_tax_url) {
    keyLinks.push({ title: 'Council tax rates', url: detailed.council_tax_url });
  }
  // 3. First official document (usually Statement of Accounts)
  if (detailed?.documents?.[0]) {
    const doc = detailed.documents[0];
    keyLinks.push({ title: doc.title, url: doc.url, meta: doc.year });
  }

  // Collect ALL remaining links for the expanded view
  const allLinks: Array<{ title: string; url: string; meta?: string; group?: string }> = [];

  // Official documents (skip first if already shown above)
  if (detailed?.documents) {
    const startIdx = keyLinks.some(k => k.url === detailed.documents![0]?.url) ? 1 : 0;
    detailed.documents.slice(startIdx).forEach(doc => {
      allLinks.push({ title: doc.title, url: doc.url, meta: doc.year, group: 'Documents' });
    });
  }

  // Sources
  if (detailed?.sources) {
    detailed.sources.forEach(s => {
      allLinks.push({ title: s.title, url: s.url, group: 'Sources' });
    });
  }

  // Open data links
  if (detailed?.open_data_links) {
    detailed.open_data_links.forEach(group => {
      group.links.forEach(link => {
        allLinks.push({ title: link.label, url: link.url, group: group.theme });
      });
    });
  }

  // National sources (always shown in expanded)
  const nationalSources = [
    { title: 'Council Tax 2025-26', url: 'https://www.gov.uk/government/statistics/council-tax-levels-set-by-local-authorities-in-england-2025-to-2026', meta: 'GOV.UK' },
    { title: 'Revenue Expenditure 2024-25', url: 'https://www.gov.uk/government/collections/local-authority-revenue-expenditure-and-financing', meta: 'GOV.UK' },
    { title: 'Population Estimates', url: 'https://www.ons.gov.uk/peoplepopulationandcommunity/populationandmigration/populationestimates', meta: 'ONS Mid-2024' },
  ];

  const totalLinkCount = keyLinks.length + allLinks.length + nationalSources.length;

  return (
    <footer className="border-t border-border/50 mt-12" aria-label="Data sources">
      <div className="container mx-auto px-4 py-8 sm:px-6 max-w-3xl">
        {/* Trust line */}
        <div className="flex items-center justify-center gap-2 mb-5">
          <Shield className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          <p className="type-body-sm font-semibold">Data from official UK government sources</p>
        </div>

        {/* Key links — always visible (max 3) */}
        {keyLinks.length > 0 && (
          <div className="flex flex-wrap justify-center gap-x-5 gap-y-2 mb-4">
            {keyLinks.map((link, i) => (
              <a
                key={i}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 type-caption text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                {link.title}
                {link.meta && <span className="opacity-50">{link.meta}</span>}
                <ExternalLink className="h-2.5 w-2.5 opacity-40" aria-hidden="true" />
                <span className="sr-only"> (opens in new tab)</span>
              </a>
            ))}
          </div>
        )}

        {/* Expand toggle */}
        {allLinks.length > 0 && (
          <div className="text-center">
            <button
              onClick={() => setExpanded(!expanded)}
              className="inline-flex items-center gap-1.5 type-caption text-muted-foreground hover:text-foreground transition-colors cursor-pointer py-2 min-h-[44px]"
            >
              {expanded ? 'Hide sources' : `View all ${totalLinkCount} sources`}
              <ChevronDown className={`h-3 w-3 transition-transform ${expanded ? 'rotate-180' : ''}`} aria-hidden="true" />
            </button>
          </div>
        )}

        {/* Expanded: all sources grouped */}
        {expanded && (
          <div className="mt-4 pt-4 border-t border-border/30 space-y-4 animate-in fade-in slide-in-from-top-1 duration-180 ease-out-snap motion-reduce:animate-none">
            {/* Group allLinks by group */}
            {(() => {
              const groups = new Map<string, typeof allLinks>();
              allLinks.forEach(link => {
                const g = link.group || 'Other';
                if (!groups.has(g)) groups.set(g, []);
                groups.get(g)!.push(link);
              });
              return [...groups.entries()].map(([groupName, links]) => (
                <div key={groupName}>
                  <p className="type-caption font-semibold text-muted-foreground mb-1.5">{groupName}</p>
                  <div className="space-y-1 pl-3">
                    {links.map((link, i) => (
                      <a
                        key={i}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 py-0.5 type-caption text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                      >
                        {link.title}
                        {link.meta && <span className="opacity-50">{link.meta}</span>}
                        <ExternalLink className="h-2.5 w-2.5 opacity-40 shrink-0" aria-hidden="true" />
                        <span className="sr-only"> (opens in new tab)</span>
                      </a>
                    ))}
                  </div>
                </div>
              ));
            })()}

            {/* National sources */}
            <div>
              <p className="type-caption font-semibold text-muted-foreground mb-1.5">National Data</p>
              <div className="space-y-1 pl-3">
                {nationalSources.map((link, i) => (
                  <a
                    key={i}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 py-0.5 type-caption text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                  >
                    {link.title}
                    <span className="opacity-50">{link.meta}</span>
                    <ExternalLink className="h-2.5 w-2.5 opacity-40 shrink-0" aria-hidden="true" />
                    <span className="sr-only"> (opens in new tab)</span>
                  </a>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Last checked */}
        {lastChecked && (
          <div className="flex items-center justify-center gap-2 mt-5 pt-4 border-t border-border/30">
            <Calendar className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
            <p className="type-caption text-muted-foreground">
              Data last checked {formatCheckedDate(lastChecked)}
            </p>
          </div>
        )}
      </div>
    </footer>
  );
}
