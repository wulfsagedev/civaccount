'use client';

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { type Council } from '@/data/councils';
import {
  getInsightsForCouncil,
  FEATURED_ON_LIMIT,
} from '@/lib/council-insights-index';
import SourceAnnotation from '@/components/ui/source-annotation';
import { getProvenance } from '@/data/provenance';

/**
 * "Featured on" card — bottom of every council page.
 *
 * SEO function: closes the council → insights internal-linking gap that
 * the 2026-05-02 live audit flagged. Each card surfaces ≥3 outbound
 * links into the insights cluster (and usually 6).
 *
 * UX function: shows the user where their council ranks nationally
 * — turns a single-council view into a launching pad to the wider
 * dataset.
 *
 * Data: pulled from `getInsightsForCouncil(council)` which uses the
 * same compute functions as the leaderboards themselves, so this
 * card can never drift from what `/insights/<slug>` actually displays.
 */
export default function FeaturedOnCard({ council }: { council: Council }) {
  const all = getInsightsForCouncil(council);
  if (all.length === 0) return null;

  // Prioritise ranked appearances (more newsworthy) before the
  // always-applicable "every council appears" entries.
  const ranked = all.filter((a) => a.rank !== null);
  const unranked = all.filter((a) => a.rank === null);
  const featured = [...ranked, ...unranked].slice(0, FEATURED_ON_LIMIT);

  return (
    <section className="card-elevated p-5 sm:p-6">
      <h2 className="type-title-2 mb-1">{council.name} on the national lists</h2>
      <p className="type-body-sm text-muted-foreground mb-5">
        Where {council.name} appears across England&rsquo;s 317 councils.
      </p>

      <ul className="space-y-1">
        {featured.map((entry) => (
          <li key={entry.slug}>
            <Link
              href={`/insights/${entry.slug}`}
              className="flex items-center justify-between gap-3 py-3 -mx-2 px-2 rounded-lg hover:bg-muted/50 transition-colors group cursor-pointer min-h-11"
            >
              <div className="flex-1 min-w-0">
                <p className="type-body-sm font-semibold leading-tight group-hover:text-primary transition-colors">
                  {entry.label}
                </p>
                <p className="type-caption text-muted-foreground tabular-nums leading-tight mt-1">
                  {entry.rank !== null ? (
                    <>
                      Ranked #{entry.rank}
                      {entry.outOf > 0 ? ` of ${entry.outOf}` : ''}
                      {entry.figure ? (
                        <>
                          {' '}·{' '}
                          <SourceAnnotation provenance={getProvenance('council_tax.band_d_2025', council)}>
                            {entry.figure}
                          </SourceAnnotation>
                        </>
                      ) : ''}
                    </>
                  ) : entry.figure ? (
                    <>
                      {council.name}:{' '}
                      <SourceAnnotation provenance={getProvenance('council_tax.band_d_2025', council)}>
                        {entry.figure}
                      </SourceAnnotation>
                    </>
                  ) : (
                    <>See where {council.name} sits on the national table</>
                  )}
                </p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 group-hover:text-primary transition-colors" aria-hidden="true" />
            </Link>
          </li>
        ))}
      </ul>

      <p className="type-caption text-muted-foreground mt-5 pt-4 border-t border-border/50">
        Every list is built from the same .gov.uk data shown on this page.
        Click through to see how every English council compares.
      </p>
    </section>
  );
}
