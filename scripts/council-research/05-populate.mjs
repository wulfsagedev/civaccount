#!/usr/bin/env node
/**
 * 05-populate.mjs — Phase 4 of the per-council research pipeline.
 *
 * Reads extracted-values.json and proposes a diff to the council's
 * TypeScript data file. Dry-run by default — human confirms before
 * changes are written.
 *
 * Spec: NORTH-STAR.md §6 Phase 4, §4 (field provenance schema)
 *
 * For each extracted value:
 *   1. Map to the corresponding field on Council.detailed.*
 *   2. Build the full field_sources[k] entry per §4 schema
 *   3. Update the top-level value (e.g. detailed.chief_executive_salary)
 *   4. Show diff against current data file
 *   5. With --apply: write changes
 *
 * Where extraction failed / value couldn't be traced to a primary source:
 *   → propose stripping the field (--strip-unverified option)
 *   → propose moving it to an UNDER-REVIEW pending list
 *
 * Prints a human-readable diff to stdout showing:
 *   - which fields are being updated (old → new)
 *   - which fields are being stripped (and why)
 *   - which fields are new (added from publication we just audited)
 *   - which fields stay the same (pass cross-check unchanged)
 *
 * This file is currently a scaffold. Implementation lands in Phase B.
 */

// TODO: Phase B implementation
// 1. Load extracted-values.json
// 2. Load the council's current TypeScript record (best-effort TS parsing,
//    or re-use load-councils.mjs helper)
// 3. For each extracted value:
//    a. Build full field_sources[k] entry per NORTH-STAR §4
//    b. Generate diff
// 4. Print diff in colour; prompt for confirmation
// 5. On --apply: write changes to TS file (with formatter)
// 6. Update status/<slug>.json phase_4_done marker

process.stderr.write(
  '05-populate: scaffold only — implementation pending (see NORTH-STAR §6 Phase 4)\n'
);
process.exit(2);
