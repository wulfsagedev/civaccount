/**
 * forbidden-source-scan.mjs — validator scaffold.
 *
 * Blocks URLs from forbidden domains per NORTH-STAR.md §3 (Forbidden
 * sources). Would have caught if someone tried to cite Wikipedia /
 * Glassdoor / TPA Rich List / an LLM-invented URL as a primary source.
 *
 * Spec: NORTH-STAR.md §16 (CI validator stack)
 *
 * Status: SCAFFOLD — lands in roadmap Phase E
 */

const FORBIDDEN_DOMAINS = [
  'en.wikipedia.org',
  'wikipedia.org',
  'glassdoor.com',
  'glassdoor.co.uk',
  'taxpayersalliance.com',
  'news.example-aggregator.com',
  // Add as discovered. LLM-generated URLs typically have telltale signs
  // (e.g. plausible-looking but nonexistent path segments) — these
  // should be caught by link-check (404) rather than this static list.
];

// TODO: Phase E implementation
// 1. Walk every council's detailed.field_sources
// 2. For each entry's url: parse hostname, check against FORBIDDEN_DOMAINS
// 3. Also flag: any URL that doesn't end in .gov.uk AND doesn't match
//    an allowlist of accepted open-data platforms:
//    - opendata.<council>.gov.uk (via *.gov.uk match anyway)
//    - 360giving.org
//    - web.archive.org (Wayback snapshots accepted)
//    - data.gov.uk
//    - ons.gov.uk
// 4. Non-.gov.uk URL + not on allowlist → error

export function validate(councils, _population, report) {
  // No-op until Phase E
  report.tick();
  void councils; void FORBIDDEN_DOMAINS;
}
