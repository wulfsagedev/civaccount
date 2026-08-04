import { councils, getCouncilSlug, getAreaBandD } from '@/data/councils';

/**
 * Generate popular comparison matchup slugs for static generation and sitemap.
 * Format: "council-a-vs-council-b" (alphabetical order for consistency)
 */
export function getPopularComparisons(): string[] {
  const matchups: string[] = [];
  const seen = new Set<string>();

  const addPair = (slugA: string, slugB: string) => {
    // Alphabetical order for consistency
    const [first, second] = [slugA, slugB].sort();
    const key = `${first}-vs-${second}`;
    if (!seen.has(key) && first !== second) {
      seen.add(key);
      matchups.push(key);
    }
  };

  // Top 20 councils by population — pairwise comparisons of top 10
  const byPopulation = councils
    .filter((c) => c.population && c.population > 0)
    .sort((a, b) => (b.population || 0) - (a.population || 0))
    .slice(0, 10);

  for (let i = 0; i < byPopulation.length; i++) {
    for (let j = i + 1; j < byPopulation.length; j++) {
      addPair(getCouncilSlug(byPopulation[i]), getCouncilSlug(byPopulation[j]));
    }
  }

  // Cheapest vs most expensive per type, by the most recent verified area
  // Band D. Councils of the same type share a year (2026-27 for billing
  // authorities, 2025-26 for county councils), so each pair is same-year.
  const types = ['UA', 'MD', 'LB', 'OLB', 'ILB', 'SD', 'SC'];
  for (const type of types) {
    const typeCouncils = councils
      .map((c) => ({ council: c, bandD: getAreaBandD(c)?.value }))
      .filter((x): x is { council: (typeof councils)[number]; bandD: number } =>
        x.council.type === type && x.bandD != null)
      .sort((a, b) => a.bandD - b.bandD);

    if (typeCouncils.length >= 2) {
      addPair(
        getCouncilSlug(typeCouncils[0].council),
        getCouncilSlug(typeCouncils[typeCouncils.length - 1].council)
      );
    }
  }

  return matchups;
}
