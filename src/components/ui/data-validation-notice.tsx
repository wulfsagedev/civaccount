'use client';

import { ShieldAlert, ShieldCheck, ExternalLink } from 'lucide-react';
import Link from 'next/link';

/**
 * Visible notice shown above data blocks whose values are live on the page
 * but have not yet passed the full citation-traceability bar defined in
 * /PROVENANCE-INTEGRITY-PLAN.md §5.
 *
 * Reason this exists: the policy is that every number on the site must trace
 * back to a specific row in a .gov.uk / ONS / opengov document. Some fields
 * aren't there yet — they come from a .gov.uk source (or an archived file
 * from one) but the row-level citation, or the aggregation method, or the
 * extraction verification isn't wired. Rather than hide the data, we keep
 * it visible and make the verification state legible.
 *
 * Three variants:
 *   - in-progress: we have a source but haven't wired row-level citation yet
 *   - suspended:   source path is unknown and we're investigating
 *   - editorial:   the field is CivAccount-authored (e.g. generated prose)
 */

export type DataValidationVariant = 'in-progress' | 'suspended' | 'editorial';

interface DataValidationNoticeProps {
  variant?: DataValidationVariant;
  /** Headline. Defaults to a sensible phrase per variant. */
  title?: string;
  /** 1-2 sentence explanation of what's validated, what isn't, and what we're doing about it. */
  body: string;
  /** Optional link to the source document the reader can spot-check against. */
  sourceUrl?: string;
  sourceLabel?: string;
  /** Where the "learn more" link points. Defaults to /data-validation. */
  policyHref?: string;
  /** Optional extra CSS for layout integration inside different cards. */
  className?: string;
}

const DEFAULT_TITLES: Record<DataValidationVariant, string> = {
  'in-progress': 'Data validation in progress',
  suspended: 'Under review — source not yet verified',
  editorial: 'Generated summary',
};

export function DataValidationNotice({
  variant = 'in-progress',
  title,
  body,
  sourceUrl,
  sourceLabel,
  policyHref = '/data-validation',
  className,
}: DataValidationNoticeProps) {
  const Icon = variant === 'editorial' ? ShieldCheck : ShieldAlert;
  const headline = title ?? DEFAULT_TITLES[variant];

  return (
    <div
      role="status"
      className={
        'p-3 rounded-lg border border-border bg-muted/30 flex gap-3 ' +
        (className ?? '')
      }
    >
      <Icon
        className="h-4 w-4 shrink-0 mt-0.5 text-muted-foreground"
        aria-hidden="true"
      />
      <div className="min-w-0">
        <p className="type-body-sm font-semibold text-foreground">{headline}</p>
        <p className="type-body-sm text-muted-foreground mt-1">{body}</p>
        {(sourceUrl || policyHref) && (
          <p className="type-caption text-muted-foreground mt-2 flex flex-wrap gap-x-3 gap-y-1">
            {sourceUrl && (
              <a
                href={sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-foreground inline-flex items-center gap-1"
              >
                {sourceLabel ?? 'Open source document'}
                <ExternalLink className="h-3 w-3" aria-hidden="true" />
                <span className="sr-only"> (opens in new tab)</span>
              </a>
            )}
            {policyHref && (
              <Link
                href={policyHref}
                className="underline hover:text-foreground"
              >
                How we verify data
              </Link>
            )}
          </p>
        )}
      </div>
    </div>
  );
}

export default DataValidationNotice;
