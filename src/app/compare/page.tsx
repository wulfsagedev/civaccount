import { getCouncilBySlug, getCouncilDisplayName } from '@/data/councils';
import { buildBreadcrumbSchema } from '@/lib/structured-data';
import { getPopularComparisons } from '@/lib/comparisons';
import CompareClient from './CompareClient';
import { serializeJsonLd } from '@/lib/safe-json-ld';

export interface PopularMatchup {
  slug: string;
  aName: string;
  bName: string;
}

/**
 * Build the popular-matchup list at build-time so it ships in the
 * server-rendered HTML. Same source-of-truth as the sitemap, so
 * Google's crawler can navigate from /compare → every matchup it
 * already indexes via the sitemap. Closes the "0 council links on
 * /compare" gap flagged by the 2026-05-02 SEO audit.
 */
function buildPopularMatchups(): PopularMatchup[] {
  const out: PopularMatchup[] = [];
  for (const matchup of getPopularComparisons()) {
    // Format: "{slug-a}-vs-{slug-b}". Split on the last "-vs-" so
    // hyphenated council slugs survive (e.g. "kensington-and-chelsea-vs-...").
    const idx = matchup.lastIndexOf('-vs-');
    if (idx < 0) continue;
    const slugA = matchup.slice(0, idx);
    const slugB = matchup.slice(idx + 4);
    const a = getCouncilBySlug(slugA);
    const b = getCouncilBySlug(slugB);
    if (!a || !b) continue;
    out.push({ slug: matchup, aName: getCouncilDisplayName(a), bName: getCouncilDisplayName(b) });
  }
  return out;
}

export default function ComparePage() {
  const popularMatchups = buildPopularMatchups();

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      buildBreadcrumbSchema(
        [{ name: 'Home', url: '/' }, { name: 'Compare Councils' }],
        '/compare'
      ),
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
      />
      <CompareClient popularMatchups={popularMatchups} />
    </>
  );
}
