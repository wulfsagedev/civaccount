import { councils, getCouncilSlug, getCouncilPopulation } from '@/data/councils';

/**
 * Generate popular comparison matchup slugs for static generation and sitemap.
 * Format: "council-a-vs-council-b" (alphabetical order for consistency).
 *
 * Returns ~52 matchups: C(10,2) = 45 pairwise comparisons of the 10 most-
 * populous councils + ~7 cheapest-vs-most-expensive-by-type. These render
 * on /compare as crawler-visible <Link> anchors and ship in the sitemap.
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

  // Top 10 councils by population — pairwise comparisons (45 pairs).
  // Population is keyed off the council *name* in `population.ts`, not the
  // `Council.population` field (which is null for almost every council in
  // the dataset). Using getCouncilPopulation() picks up the real ONS values.
  const withPop = councils
    .map((c) => ({ council: c, pop: getCouncilPopulation(c.name) ?? 0 }))
    .filter((x) => x.pop > 0)
    .sort((a, b) => b.pop - a.pop)
    .slice(0, 10)
    .map((x) => x.council);

  for (let i = 0; i < withPop.length; i++) {
    for (let j = i + 1; j < withPop.length; j++) {
      addPair(getCouncilSlug(withPop[i]), getCouncilSlug(withPop[j]));
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
