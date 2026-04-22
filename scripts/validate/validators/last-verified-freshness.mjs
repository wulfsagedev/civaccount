/**
 * last-verified-freshness.mjs — validator scaffold.
 *
 * Fails CI when any field's `accessed` date is > N days old (default
 * 180 days). Forces periodic re-verification so data doesn't silently
 * rot.
 *
 * Spec: NORTH-STAR.md §16 (CI validator stack)
 *
 * Status: SCAFFOLD — lands in roadmap Phase E
 */

const FRESHNESS_DAYS = 180;

// TODO: Phase E implementation
// 1. For each field_sources entry: parse `accessed` ISO date
// 2. If (today - accessed) > FRESHNESS_DAYS → warning
// 3. Exception: archive_exempt entries get 365-day window (longer
//    because they're explicitly noted as not-easily-reverifiable)
// 4. Exception: Tier 1 entries with automated source-truth get no
//    warning (cross-checked on every CI run anyway)

export function validate(councils, _population, report) {
  // No-op until Phase E
  report.tick();
  void councils; void FRESHNESS_DAYS;
}
