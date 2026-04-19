"use client";

import { ExternalLink, Info, AlertCircle } from "lucide-react";
import type { Council } from "@/data/councils";
import { GAP_EXPLANATIONS, type GapExplanation } from "@/data/data-gaps";

/**
 * Honest "we don't have this" notice shown inside dashboard cards — or
 * wrapping a whole card when a major section is absent.
 *
 * Two forms:
 *   - Absent: field has no data at all (e.g. grants register not published)
 *   - Thin:  field has some data but less than the reference depth
 *
 * Reason strings may contain a `{Council}` placeholder; we substitute
 * the council name at render time so copy stays in one place.
 *
 * Prefer this over silently hiding a section — the user should know the
 * information is missing, why, and where to go next.
 */

interface DataGapNoticeProps {
  /** Dotted key into GAP_EXPLANATIONS, e.g. "grant_payments.absent" */
  gapKey: keyof typeof GAP_EXPLANATIONS | string;
  council: Council;
  /** Optional override label (defaults to GAP_EXPLANATIONS[key].label) */
  label?: string;
  /** Optional extra context appended to the reason line. */
  extra?: string;
  /** Visual density — default compact fits inside a card body. */
  className?: string;
}

export function DataGapNotice({
  gapKey,
  council,
  label,
  extra,
  className,
}: DataGapNoticeProps) {
  const ex = GAP_EXPLANATIONS[gapKey as keyof typeof GAP_EXPLANATIONS] as
    | GapExplanation
    | undefined;

  // Unknown gap key — render a generic neutral notice rather than nothing.
  if (!ex) {
    return (
      <div
        className={
          "p-4 rounded-lg bg-muted/30 border border-border/40 " + (className ?? "")
        }
      >
        <p className="type-body-sm font-semibold mb-1">Not published yet</p>
        <p className="type-body-sm text-muted-foreground">
          {council.name} hasn&apos;t published this in a format we can display.
          New data usually appears with quarterly transparency updates.
        </p>
      </div>
    );
  }

  const ctaUrl = ex.nextStepKey
    ? (council.detailed as Record<string, unknown> | undefined)?.[ex.nextStepKey]
    : undefined;

  const Icon = ex.severity === "warning" ? AlertCircle : Info;

  // Substitute {Council} placeholder with the actual council name so copy
  // lives in one registry but reads naturally per page.
  const reason = ex.reason.replace(/\{Council\}/g, council.name);

  return (
    <div
      className={
        "p-4 rounded-lg bg-muted/30 border border-border/40 " + (className ?? "")
      }
    >
      <div className="flex items-start gap-2 mb-1">
        <Icon
          className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0"
          aria-hidden="true"
        />
        <p className="type-body-sm font-semibold">{label ?? ex.label}</p>
      </div>
      <p className="type-body-sm text-muted-foreground mb-3 pl-6">
        {reason}
        {extra ? ` ${extra}` : ""}
      </p>
      {ex.nextStepLabel && typeof ctaUrl === "string" && ctaUrl && (
        <a
          href={ctaUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="type-body-sm underline hover:text-foreground transition-colors inline-flex items-center gap-1 pl-6"
        >
          {ex.nextStepLabel}
          <ExternalLink
            className="h-3 w-3 text-muted-foreground"
            aria-hidden="true"
          />
          <span className="sr-only"> (opens in new tab)</span>
        </a>
      )}
    </div>
  );
}

export default DataGapNotice;
