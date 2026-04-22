#!/usr/bin/env node
/**
 * 02-archive.mjs — Phase 1 of the per-council research pipeline.
 *
 * Reads inventory.json (produced by 01-inventory.mjs) and downloads
 * each accessible document into the content-addressed archive. Records
 * sha256 + Wayback snapshot + `_meta.json` per document.
 *
 * Spec: NORTH-STAR.md §6 Phase 1, §12 (content-addressed archive),
 *       §13 (Memento/Wayback integration)
 *
 * Storage layout (content-addressed):
 *   src/data/councils/pdfs/by-hash/XX/YY/<sha256>.pdf
 *
 * Human-readable pointers:
 *   src/data/councils/pdfs/council-pdfs/<slug>/<doc-name>.pdf
 *   src/data/councils/pdfs/council-pdfs/<slug>/<doc-name>_meta.json
 *
 * `_meta.json` schema:
 *   {
 *     "source_url": "...",
 *     "publisher": "...",
 *     "document_type": "pay-policy | statement-of-accounts | mtfs | ...",
 *     "fiscal_year": "2025-26",
 *     "fetched": "2026-04-22T12:34:56Z",
 *     "sha256": "...",
 *     "wayback_url": "https://web.archive.org/web/20260422.../...",
 *     "licence": "Open Government Licence v3.0",
 *     "content_type": "application/pdf",
 *     "content_length": 462928
 *   }
 *
 * For URLs that are bot-blocked (Cloudflare 403, etc.):
 *   - Skip fetch
 *   - Emit `_meta.json` with `archive_exempt: "cloudflare_blocked"` etc.
 *   - Attempt Wayback-only snapshot (the Internet Archive can often
 *     fetch what we can't — different UA, different network origin)
 *
 * For URLs that succeed:
 *   - Download bytes
 *   - Compute sha256
 *   - Save under by-hash/ with symlink from council-pdfs/
 *   - Trigger SavePageNow at archive.org
 *   - Write _meta.json
 *
 * Output: every inventory URL either archived or flagged archive_exempt
 * Status: status/<slug>.json phase_1_done marker
 *
 * This file is currently a scaffold. Implementation lands in Phase B.
 */

// TODO: Phase B implementation
// 1. Read inventory.json for the council
// 2. For each URL:
//    a. HTTP GET with realistic browser UA + timeout
//    b. If 200: stream to temp file, compute sha256, move to by-hash/
//    c. If 403 / Cloudflare: record archive_exempt reason
//    d. If 404: record as broken link (flag for inventory re-run)
// 3. For every URL (success or fail), trigger:
//    POST https://web.archive.org/save/<url>
// 4. Parse Wayback response header (Content-Location) for the snapshot URL
// 5. Write _meta.json sibling; create by-hash/ symlink from council-pdfs/
// 6. Update status/<slug>.json

process.stderr.write(
  '02-archive: scaffold only — implementation pending (see NORTH-STAR §6 Phase 1 + §12 + §13)\n'
);
process.exit(2);
