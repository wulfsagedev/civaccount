/**
 * tier-classification.mjs — validator scaffold.
 *
 * Enforces NORTH-STAR.md §4: every field_sources entry must carry
 * `tier` (1-5) and `extraction_method`, with tier-specific requirements:
 *   - tier ≤ 3: sha256_at_access required
 *   - tier === 4: archive_exempt required
 *   - tier === 5: cross_check_ref required
 *
 * Spec: NORTH-STAR.md §16 (CI validator stack)
 *
 * Status: SCAFFOLD — lands in roadmap Phase E
 */

// TODO: Phase E implementation
// 1. Walk every council's detailed.field_sources
// 2. For each entry:
//    - missing `tier` → error
//    - missing `extraction_method` → error
//    - tier ≤ 3 + missing sha256_at_access → error
//    - tier === 4 + missing archive_exempt → error
//    - tier === 5 + missing cross_check_ref → error
//    - extraction_method in {csv_row, pdf_page, aggregate, socrata_query, manual_read}
//      else error

export function validate(councils, _population, report) {
  // No-op until Phase E — allows existing field_sources to pass while
  // we migrate to the new schema in a single large PR.
  report.tick();
}
