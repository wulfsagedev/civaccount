'use client';

import { ExternalLink } from 'lucide-react';
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
}: SourceAnnotationProps) {
  if (!provenance) return <>{children}</>;

  const config = LABEL_CONFIG[provenance.label] || LABEL_CONFIG.published;

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
        align="start"
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
        </div>
      </PopoverContent>
    </Popover>
  );
}
