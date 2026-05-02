'use client';

import { type Council } from '@/data/councils';
import {
  getCouncilChangelog,
  getMostRecentFieldAccess,
  friendlyFieldName,
} from '@/lib/council-changelog';
import { Clock } from 'lucide-react';

/**
 * "What changed recently" card — surfaces the most recent personnel /
 * Tier-1 drift fixes for North-Star-compliant councils.
 *
 * SEO function: provides unique above-the-fold micro-content per council
 * (defeats thin-content classifiers); also gives Google a real freshness
 * signal that's harder to fake than the single `last_verified` field.
 *
 * UX function: gives users an instant-trust read on data hygiene
 * ("we noticed when the leader changed; here's the date and source").
 *
 * Renders nothing for un-audited councils — the card only appears
 * when there's something honest to say.
 */
export default function WhatChangedCard({ council }: { council: Council }) {
  const changes = getCouncilChangelog(council, 3);
  const mostRecent = getMostRecentFieldAccess(council);

  // Don't render anything if we have nothing concrete to show.
  if (changes.length === 0 && !mostRecent) return null;

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

  return (
    <section className="card-elevated p-5 sm:p-6">
      <div className="flex items-center gap-2 mb-1">
        <Clock className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
        <h2 className="type-title-2">What changed recently</h2>
      </div>
      <p className="type-body-sm text-muted-foreground mb-5">
        Every update is dated and sourced.
      </p>

      {changes.length > 0 && (
        <ul className="space-y-3 mb-5">
          {changes.map((c, i) => (
            <li key={i} className="flex gap-3">
              <time
                dateTime={c.date}
                className="type-caption text-muted-foreground tabular-nums shrink-0 pt-0.5 w-24"
              >
                {formatDate(c.date)}
              </time>
              <div className="min-w-0 flex-1">
                <p className="type-body-sm font-medium leading-snug">
                  {c.summary}
                </p>
                {c.source && (
                  <p className="type-caption text-muted-foreground mt-1">
                    Source: {c.source}
                  </p>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {mostRecent && (
        <p className="type-caption text-muted-foreground pt-4 border-t border-border/50">
          Most-recent verified data point:{' '}
          <span className="font-medium text-foreground">
            {formatDate(mostRecent.date)}
          </span>{' '}
          ({friendlyFieldName(mostRecent.field)}).
        </p>
      )}
    </section>
  );
}
