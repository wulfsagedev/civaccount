#!/usr/bin/env node
/**
 * 04-extract-csv.mjs — Phase 2 of the per-council research pipeline (CSV/XLSX half).
 *
 * Complementary to 03-extract-pdf.mjs. Handles:
 *   - Socrata datasets (JSON API or CSV export)
 *   - 360Giving grant registers (CSV)
 *   - Council spending-over-£500 publications (monthly / quarterly CSVs)
 *   - Council-published XLSX open-data files
 *
 * Spec: NORTH-STAR.md §6 Phase 2, §7 (PROV lineage)
 *
 * Per-source extraction routines:
 *   - spending-over-500 → aggregate by supplier_name, sum net amount
 *   - grants register → top 15 by amount; keep all for drill-down
 *   - Socrata datasets → resolve to canonical 4x4 ID + query params
 *
 * Each aggregate records:
 *   - source file sha256
 *   - extraction_method: "csv_row" or "aggregate" or "socrata_query"
 *   - filter expression used (machine-readable)
 *   - row count pre-filter, post-filter
 *   - column name for the extracted value
 *   - extraction script version
 *
 * Adds to extracted-values.json (merged with PDF extractions).
 *
 * Deterministic: same input CSV → same aggregate output. Seeds recorded
 * where any nondeterminism is possible (tiebreaks on equal spend totals).
 *
 * This file is currently a scaffold. Implementation lands in Phase B.
 */

// TODO: Phase B implementation
// 1. Read council's inventory.json for CSV/XLSX/JSON sources
// 2. For spending-over-500:
//    a. Load all months/quarters, concat
//    b. Aggregate by supplier_name (case-insensitive, whitespace-normalised)
//    c. Sum `net_amount` column (exact column name per council varies)
//    d. Top 20 suppliers by sum
// 3. For 360Giving grant register:
//    a. Load CSV
//    b. Top 15 grants by Amount Awarded
//    c. Keep recipient_name, amount, purpose/title
// 4. For Socrata datasets:
//    a. Use SoQL to query with explicit aggregate
//    b. Record the exact SoQL query
// 5. Append to extracted-values.json with full PROV lineage

process.stderr.write(
  '04-extract-csv: scaffold only — implementation pending (see NORTH-STAR §6 Phase 2)\n'
);
process.exit(2);
