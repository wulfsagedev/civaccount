import { Info, ExternalLink } from 'lucide-react';

interface DataUnavailableProps {
  sectionTitle: string;
  reason?: string;
  councilUrl?: string;
}

/**
 * Placeholder for sections where data is not available.
 * Replaces the "silent hiding" pattern with an honest indicator
 * that tells users why a section is missing + links to the council's website.
 */
export default function DataUnavailable({
  sectionTitle,
  reason = "This council hasn't published this data yet",
  councilUrl,
}: DataUnavailableProps) {
  return (
    <section
      className="bg-muted/30 border border-border/30 rounded-xl p-5"
      aria-label={`${sectionTitle} — not available`}
    >
      <div className="flex gap-3">
        <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
          <Info className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <p className="type-body-sm font-medium text-muted-foreground">
            {sectionTitle}
          </p>
          <p className="type-caption text-muted-foreground mt-0.5">
            {reason}
          </p>
          {councilUrl && (
            <a
              href={councilUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 type-caption text-muted-foreground hover:text-foreground mt-1.5 transition-colors"
            >
              Check their website
              <ExternalLink className="h-3 w-3" aria-hidden="true" />
              <span className="sr-only"> (opens in new tab)</span>
            </a>
          )}
        </div>
      </div>
    </section>
  );
}
