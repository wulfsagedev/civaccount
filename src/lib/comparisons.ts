import { councils, getCouncilSlug } from '@/data/councils';

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

  // Cheapest vs most expensive per type
  const types = ['UA', 'MD', 'LB', 'OLB', 'ILB', 'SD', 'SC'];
  for (const type of types) {
    const typeCouncils = councils
      .filter((c) => c.type === type && c.council_tax?.band_d_2025)
      .sort((a, b) => a.council_tax!.band_d_2025 - b.council_tax!.band_d_2025);

    if (typeCouncils.length >= 2) {
      addPair(
        getCouncilSlug(typeCouncils[0]),
        getCouncilSlug(typeCouncils[typeCouncils.length - 1])
      );
    }
  }

  return matchups;
}
