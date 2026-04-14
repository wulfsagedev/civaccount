'use client';

import { ExternalLink, Flag, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '@/components/ui/popover';
import type { DataProvenance } from '@/data/councils';

interface SourceAnnotationProps {
  provenance?: DataProvenance;
  children: React.ReactNode;
  /** Optional council name + field path for "Report incorrect data" link */
  reportContext?: {
    council: string;
    field: string;
    value: string | number;
  };
}

/**
 * Open the in-app feedback modal with a pre-filled message describing the
 * data point being reported. Uses the same `open-feedback` CustomEvent that
 * the header/footer "Feedback" buttons use, so the user stays in-app and
 * doesn't need a GitHub account.
 */
function openReportFeedback(ctx: { council: string; field: string; value: string | number }, prov?: DataProvenance) {
  const lines = [
    `Council: ${ctx.council}`,
    `Field: ${ctx.field}`,
    `Current value shown: ${ctx.value}`,
  ];
  if (prov?.source_title) lines.push(`Listed source: ${prov.source_title}`);
  if (prov?.source_url) lines.push(`Source URL: ${prov.source_url}`);
  if (prov?.data_year) lines.push(`Data year: ${prov.data_year}`);
  lines.push('', "What's the correct value? (please include a link to the source where you saw it)");
  lines.push('');

  const detail = {
    title: 'Report incorrect data',
    subtitle: `${ctx.council} — ${ctx.field}`,
    prefillMessage: lines.join('\n'),
  };

  document.dispatchEvent(new CustomEvent('open-feedback', { detail }));
}

/**
 * Compute staleness from a data_year string.
 * Returns months elapsed since the END of the data year, or null if unparseable.
 *
 * Handles formats: "2025-26", "2024", "mid-2024", "2022-23", "2023-24"
 */
function computeStaleness(dataYear: string | undefined): { months: number; isStale: boolean; isCritical: boolean } | null {
  if (!dataYear) return null;

  let endYear: number | null = null;

  // "2025-26" or "2022-23" → end year is the second part
  const fyMatch = dataYear.match(/^(\d{4})-(\d{2})$/);
  if (fyMatch) {
    const startYear = parseInt(fyMatch[1], 10);
    endYear = startYear + 1; // FY ends April of next year
  } else {
    // "2024", "mid-2024", "2023" → just the year
    const yearMatch = dataYear.match(/(\d{4})/);
    if (yearMatch) {
      endYear = parseInt(yearMatch[1], 10);
    }
  }

  if (!endYear) return null;

  // Treat data as fresh until ~12 months after the end year/FY
  const now = new Date();
  const dataDate = new Date(endYear, 3, 1); // Apr 1 of end year (UK FY end)
  const monthsElapsed = Math.floor((now.getTime() - dataDate.getTime()) / (1000 * 60 * 60 * 24 * 30.44));

  return {
    months: monthsElapsed,
    isStale: monthsElapsed > 18,        // >18 months = stale
    isCritical: monthsElapsed > 30,      // >30 months = critically stale
  };
}

const LABEL_CONFIG: Record<string, { text: string; className: string }> = {
  published: {
    text: 'Published data',
    className: 'bg-navy-50 text-navy-600 border-navy-200',
  },
  calculated: {
    text: 'Calculated',
    className: 'bg-muted text-muted-foreground border-border',
  },
  comparison: {
    text: 'Comparison',
    className: 'bg-muted text-muted-foreground border-border',
  },
  official: {
    text: 'Council source',
    className: 'bg-navy-50 text-navy-600 border-navy-200',
  },
  editorial: {
    text: 'Editorial summary',
    className: 'bg-muted text-muted-foreground border-border',
  },
};

/**
 * Wraps a data value with an optional source annotation popover.
 *
 * When provenance is provided, the value becomes tappable — a subtle
 * dotted underline appears on hover, and clicking opens a popover
 * showing the data label, source, and year.
 *
 * When no provenance is provided, renders children as-is (no-op wrapper).
 */
export default function SourceAnnotation({
  provenance,
  children,
  reportContext,
}: SourceAnnotationProps) {
  if (!provenance) return <>{children}</>;

  const config = LABEL_CONFIG[provenance.label] || LABEL_CONFIG.published;
  const staleness = computeStaleness(provenance.data_year);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <span
          role="button"
          tabIndex={0}
          className="inline cursor-pointer decoration-muted-foreground/40 decoration-dotted underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm"
          aria-label={`Source: ${provenance.source_title || config.text}`}
          onClick={(e) => {
            // Stop propagation so it doesn't trigger parent buttons (drill-downs, links)
            e.stopPropagation();
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              e.stopPropagation();
              (e.currentTarget as HTMLElement).click();
            }
          }}
        >
          {children}
        </span>
      </PopoverTrigger>
      <PopoverContent
        className="w-64 p-3"
        side="top"
        align="center"
        sideOffset={6}
      >
        <div className="space-y-2">
          <Badge
            variant="outline"
            className={`text-xs font-medium ${config.className}`}
          >
            {config.text}
          </Badge>

          {provenance.source_title && (
            <p className="type-caption font-medium text-foreground">
              {provenance.source_url ? (
                <a
                  href={provenance.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline inline-flex items-center gap-1"
                >
                  {provenance.source_title}
                  <ExternalLink className="h-3 w-3 shrink-0" aria-hidden="true" />
                  <span className="sr-only"> (opens in new tab)</span>
                </a>
              ) : (
                provenance.source_title
              )}
            </p>
          )}

          {provenance.data_year && (
            <div className="flex items-center gap-2 flex-wrap">
              <p className="type-caption text-muted-foreground">
                Data year: {provenance.data_year}
              </p>
              {staleness?.isStale && (
                <Badge
                  variant="outline"
                  className={`text-[10px] font-medium gap-1 ${
                    staleness.isCritical
                      ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800'
                      : 'bg-muted text-muted-foreground border-border'
                  }`}
                >
                  <Clock className="h-2.5 w-2.5" aria-hidden="true" />
                  {staleness.isCritical ? 'Critically stale' : 'Stale'}
                </Badge>
              )}
            </div>
          )}

          {provenance.methodology && (
            <p className="type-caption text-muted-foreground">
              {provenance.methodology}
            </p>
          )}

          {reportContext && (
            <div className="pt-2 mt-1 border-t border-border/50">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  openReportFeedback(reportContext, provenance);
                }}
                className="type-caption text-muted-foreground hover:text-foreground inline-flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Flag className="h-3 w-3 shrink-0" aria-hidden="true" />
                Report incorrect data
              </button>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
