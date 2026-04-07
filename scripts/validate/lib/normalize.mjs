/**
 * normalize.mjs — Council name normalization for matching between our data and gov.uk CSVs.
 * Ported from scripts/data-scripts/parse-all-datasets.mjs
 */

const SUFFIXES_TO_REMOVE = [
  / UA$/i,
  / Council$/i,
  / Borough Council$/i,
  / District Council$/i,
  / County Council$/i,
  / City Council$/i,
  / Metropolitan Borough Council$/i,
  / Metropolitan District Council$/i,
  / Metropolitan District$/i,
  / Metropolitan Borough$/i,
  / London Borough$/i,
  / Royal Borough$/i,
  /^City of /i,
  /^Royal Borough of /i,
  /^London Borough of /i,
  / LB$/i,
  / MBC$/i,
  / BC$/i,
  / DC$/i,
  / CC$/i,
  / MB$/i,
  / MD$/i,
  / City$/i,
];

export function normalizeCouncilName(name) {
  if (!name || typeof name !== 'string') return '';

  let n = name.trim();

  for (const suffix of SUFFIXES_TO_REMOVE) {
    n = n.replace(suffix, '');
  }

  // Normalize "and" / "&"
  n = n.replace(/\band\b/gi, '&');
  // Normalize multiple spaces
  n = n.replace(/\s+/g, ' ');
  // Lowercase for comparison
  n = n.toLowerCase().trim();
  // Remove punctuation except &
  n = n.replace(/[,.']/g, '');

  return n;
}

/**
 * Build a lookup map from a CSV's name column to our council objects.
 * Returns Map<normalizedCsvName, council>
 */
export function buildNameIndex(councils) {
  const index = new Map();
  for (const c of councils) {
    index.set(normalizeCouncilName(c.name), c);
  }
  return index;
}
