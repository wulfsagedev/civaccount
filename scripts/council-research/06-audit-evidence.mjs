#!/usr/bin/env node
/**
 * 06-audit-evidence.mjs — On-demand audit tooling.
 *
 * NOT part of the normal pipeline. Run manually when someone challenges
 * a value and wants to see visual proof of where it came from.
 *
 * For each rendered field that has a Tier 3 archived PDF source:
 *   - Render the relevant page to PNG using pdftoppm
 *   - Save to audit-evidence/<slug>/<field>-<doc>-p<N>.png
 *   - Optionally highlight the value on the page image
 *
 * For Tier 1/2 (CSV) fields:
 *   - Generate a zoomed screenshot of the relevant row+column
 *   - Save to audit-evidence/<slug>/<field>-<file>-row-<N>.png
 *
 * Output: audit-evidence/<slug>/ folder with one PNG per field, ready
 * to attach to a PR or challenge response.
 *
 * This is the "show your working" layer. The sha256-fingerprinted
 * source files are the canonical receipt; the PNGs are for humans.
 *
 * Spec: NORTH-STAR.md §19 (Definition of Done mentions audit evidence
 * as an on-demand capability, not a per-commit requirement)
 *
 * This file is currently a scaffold. Implementation lands in Phase B.
 */

// TODO: Phase B implementation
// 1. Read council's extracted-values.json for source references
// 2. For each Tier 3 field: pdftoppm -png -r 120 -f <page> -l <page> <pdf> <out>
// 3. For each Tier 1/2 field: synthesise a "row highlight" screenshot
//    (render the CSV line with the relevant cell boxed)
// 4. Emit an audit-evidence/<slug>/INDEX.md listing every screenshot
//    with its corresponding field + commit SHA

process.stderr.write(
  '06-audit-evidence: scaffold only — implementation pending (see NORTH-STAR §19)\n'
);
process.exit(2);
