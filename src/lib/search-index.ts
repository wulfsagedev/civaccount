/**
 * Pre-computed search index for lightning-fast council searches
 * This creates an optimized index at module load time, avoiding
 * repeated string operations during search.
 */

import { councils, Council, getCouncilDisplayName } from '@/data/councils';

// Pre-computed search data for each council
interface SearchableCouncil {
  council: Council;
  searchTerms: string; // Pre-joined, lowercase searchable string
  displayName: string;
  nameLength: number; // For prefix matching priority
}

// Build index once at module load
const searchIndex: SearchableCouncil[] = councils.map(council => {
  const displayName = getCouncilDisplayName(council);
  return {
    council,
    displayName,
    nameLength: council.name.length,
    // Pre-compute all searchable terms as a single lowercase string
    searchTerms: [
      council.name,
      council.type_name,
      displayName,
      council.ons_code,
    ].join(' ').toLowerCase(),
  };
});

// Pre-sorted by name for consistent default ordering
const sortedByName = [...searchIndex].sort((a, b) =>
  a.council.name.localeCompare(b.council.name)
);

/**
 * Ultra-fast search using pre-computed index
 * Returns results with prefix matches prioritized
 */
export function searchCouncilsFast(query: string, limit: number = 10): Council[] {
  if (!query || !query.trim()) {
    // Return first N councils (pre-sorted)
    return sortedByName.slice(0, limit).map(s => s.council);
  }

  const normalizedQuery = query.toLowerCase().trim();

  // Two-pass search: exact prefix matches first, then contains matches
  const prefixMatches: SearchableCouncil[] = [];
  const containsMatches: SearchableCouncil[] = [];

  for (const item of searchIndex) {
    // Check if name starts with query (highest priority)
    if (item.council.name.toLowerCase().startsWith(normalizedQuery)) {
      prefixMatches.push(item);
    } else if (item.searchTerms.includes(normalizedQuery)) {
      containsMatches.push(item);
    }

    // Early exit if we have enough prefix matches
    if (prefixMatches.length >= limit) break;
  }

  // Sort prefix matches by name length (shorter = more relevant)
  prefixMatches.sort((a, b) => a.nameLength - b.nameLength);

  // Combine results, prefix matches first
  const results = [...prefixMatches, ...containsMatches].slice(0, limit);

  return results.map(s => s.council);
}

/**
 * Get autocomplete suggestion for input
 * Returns the completion string if there's a clear match
 */
export function getAutocompleteSuggestion(query: string): string {
  if (!query || query.length < 2) return '';

  const normalizedQuery = query.toLowerCase();

  for (const item of searchIndex) {
    const name = item.council.name.toLowerCase();
    if (name.startsWith(normalizedQuery)) {
      // Return the original casing completion
      return query + item.council.name.slice(query.length);
    }

    const displayName = item.displayName.toLowerCase();
    if (displayName.startsWith(normalizedQuery)) {
      return query + item.displayName.slice(query.length);
    }
  }

  return '';
}

/**
 * Get total council count (cached)
 */
export const totalCouncilCount = councils.length;

/**
 * Get default councils list (for initial render)
 */
export function getDefaultCouncils(limit: number = 50): Council[] {
  return sortedByName.slice(0, limit).map(s => s.council);
}
