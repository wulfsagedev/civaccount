#!/usr/bin/env node
/**
 * 03-extract-pdf.mjs — Phase 2 of the per-council research pipeline (PDF half).
 *
 * For every archived PDF in a council's folder, run pdftotext and
 * extract the structured values we care about: CE salary, councillor
 * basic allowance, total allowances cost, budget gap, savings target,
 * salary bands, cabinet listing, per-service spending sub-categories.
 *
 * Spec: NORTH-STAR.md §6 Phase 2, §7 (PROV lineage)
 *
 * Per-document extraction routines (one per document_type):
 *   - "pay-policy" → CE salary (with page number)
 *   - "statement-of-accounts" → salary bands distribution, total
 *     allowances, employee remuneration notes
 *   - "mtfs" → budget gap, savings target, cumulative MTFS savings
 *   - "councillors-earnings" → per-councillor basic + SRA + travel
 *     + total; sum for aggregate total_allowances_cost
 *   - "budget-book" → service spending sub-categories per department
 *
 * Each extraction records:
 *   - source document sha256 (W3C PROV Entity)
 *   - extraction_method: "pdf_page"
 *   - page number
 *   - verbatim excerpt containing the value
 *   - extraction script version (this file's commit SHA)
 *   - extraction timestamp
 *
 * Output: src/data/councils/pdfs/council-pdfs/<slug>/extracted-values.json
 *
 * Spec: each value in extracted-values.json is a complete PROV triple
 * — source Entity + extraction Activity + rendered Entity.
 *
 * This file is currently a scaffold. Implementation lands in Phase B.
 */

// TODO: Phase B implementation
// 1. Read _meta.json for every archived PDF in this council's folder
// 2. For each document_type, run the matching extraction routine:
//    pdftotext -layout -f <page> -l <page> <file> | regex match
// 3. Validate extraction with a cross-check (e.g. the pay-policy PDF
//    also shows a pay multiple — derive CE-salary ÷ median and check
//    it matches the policy's stated multiple)
// 4. Emit extracted-values.json with full PROV lineage per value
// 5. Log every extraction to a human-readable .extraction.log next to
//    the PDF, so an auditor can see exactly what text was matched

process.stderr.write(
  '03-extract-pdf: scaffold only — implementation pending (see NORTH-STAR §6 Phase 2)\n'
);
process.exit(2);
