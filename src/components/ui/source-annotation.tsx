'use client';

import { ExternalLink, Flag } from 'lucide-react';
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

const GITHUB_REPO = 'wulfsagedev/civaccount';

function buildReportUrl(ctx: { council: string; field: string; value: string | number }, prov?: DataProvenance): string {
  const title = `Data correction: ${ctx.council} — ${ctx.field}`;
  const body = `**Council**: ${ctx.council}
**Field**: ${ctx.field}
**Current value**: ${ctx.value}
${prov?.source_title ? `**Listed source**: ${prov.source_title}` : ''}
${prov?.source_url ? `**Source URL**: ${prov.source_url}` : ''}
${prov?.data_year ? `**Data year**: ${prov.data_year}` : ''}

**What's wrong?**
<!-- Describe the issue with this data -->

**Correct value (with source)**
<!-- Provide the correct value and a link to the source document -->

---
*Reported via CivAccount in-app feedback*`;

  const params = new URLSearchParams({
    title,
    body,
    labels: 'data-correction,user-reported',
  });
  return `https://github.com/${GITHUB_REPO}/issues/new?${params.toString()}`;
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
  const reportUrl = reportContext ? buildReportUrl(reportContext, provenance) : null;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="inline cursor-pointer decoration-muted-foreground/40 decoration-dotted underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm"
          aria-label={`Source: ${provenance.source_title || config.text}`}
        >
          {children}
        </button>
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
            <p className="type-caption text-muted-foreground">
              Data year: {provenance.data_year}
            </p>
          )}

          {provenance.methodology && (
            <p className="type-caption text-muted-foreground">
              {provenance.methodology}
            </p>
          )}

          {reportUrl && (
            <div className="pt-2 mt-1 border-t border-border/50">
              <a
                href={reportUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="type-caption text-muted-foreground hover:text-foreground inline-flex items-center gap-1 transition-colors"
              >
                <Flag className="h-3 w-3 shrink-0" aria-hidden="true" />
                Report incorrect data
                <span className="sr-only"> (opens new tab)</span>
              </a>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
