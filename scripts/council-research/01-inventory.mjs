#!/usr/bin/env node
/**
 * 01-inventory.mjs — Phase 0 of the per-council research pipeline.
 *
 * Given a council name, probes a standard set of URL patterns on the
 * council's own website(s) and on common council-data platforms. Emits
 * an inventory JSON file of every candidate source URL, ready for
 * Phase 1 (archive) to download.
 *
 * Spec: NORTH-STAR.md §6 Phase 0
 *
 * URL patterns probed (non-exhaustive — see NORTH-STAR for full list):
 *   {council}.gov.uk/finances-and-spending/
 *   {council}.gov.uk/statement-of-accounts/
 *   {council}.gov.uk/pay-policy-statement/
 *   {council}.gov.uk/councillors-allowances/
 *   {council}.gov.uk/mtfs/
 *   {council}.gov.uk/cabinet/
 *   democracy.{council}.gov.uk/documents/
 *   opendata.{council}.gov.uk/
 *   data.gov.uk datasets published by {council}
 *   360Giving registry for {council}
 *
 * For each URL that returns 200, records:
 *   - URL, HTTP status, content-type, content-length
 *   - Whether the URL is bot-blocked (Cloudflare / 403)
 *   - Initial tier guess based on content-type + domain
 *   - Plain-English document type guess from the URL path
 *
 * Output: src/data/councils/pdfs/council-pdfs/<slug>/inventory.json
 * Status: scripts/council-research/status/<slug>.json updated with Phase 0 ✓
 *
 * This file is currently a scaffold. Implementation lands in Phase B
 * of the roadmap.
 */

// TODO: Phase B implementation
// 1. Parse --council CLI arg → resolve to slug
// 2. Load Council record to get the council's .gov.uk domain
// 3. For each URL pattern, HTTP HEAD with permissive UA + timeout
// 4. On 200: follow redirects, record final URL + content-type
// 5. On 403 / Cloudflare page: record as archive_exempt candidate
// 6. On 404: skip silently
// 7. Additional probes:
//    - 360Giving registry JSON API lookup by council name
//    - data.gov.uk search by publisher
//    - Socrata / CKAN / ArcGIS common subdomain patterns
// 8. Heuristic tier guess per URL (content-type PDF → Tier 3 candidate;
//    application/json from opendata.* → Tier 2; HTML page → Tier 4)
// 9. Emit inventory.json with canonical schema
// 10. Update status/<slug>.json with { phase_0_done: true, phase_0_at: ISO }

process.stderr.write(
  '01-inventory: scaffold only — implementation pending (see NORTH-STAR §6 Phase 0)\n'
);
process.exit(2);
