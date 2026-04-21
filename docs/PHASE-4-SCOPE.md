# Phase 4 scope — per-council PDF citations

Following PROVENANCE-INTEGRITY-PLAN.md. Category B fields from the
renderable-fields manifest need page-level citations sourced from the
council's own PDFs. This document scopes that work.

## Fields needing page citations

Per `src/data/renderable-fields.ts` Category B entries:

| Field path | Typical source document | Notes |
|---|---|---|
| `detailed.chief_executive_salary` | Council Pay Policy Statement | `parsed-ceo-salary.csv` is the compiled side; per-council PDFs need archiving |
| `detailed.chief_executive_total_remuneration` | Pay Policy Statement (same PDF, different row) | As above |
| `detailed.councillor_basic_allowance` | Members' Allowances Scheme | Usually a short standalone PDF |
| `detailed.total_allowances_cost` | Statement of Councillors Earnings | Separate annual return; per council |
| `detailed.councillor_allowances_detail` | Statement of Councillors Earnings | Row-level — each councillor = one row |
| `detailed.salary_bands` | Statement of Accounts (Note 30 or similar) | Page varies by year + council |
| `detailed.budget_gap` | Medium Term Financial Strategy | Page reference critical — often in the exec summary table |
| `detailed.savings_target` | Medium Term Financial Strategy | Usually on same page as budget_gap |
| `detailed.service_spending` | Council budget book / revenue estimates | Sub-category breakdowns; multi-page |

`detailed.cabinet`, `detailed.council_leader`, `detailed.chief_executive`
(Category B HTML) get `html_selector` locators rather than PDF pages.

## Archive status

Raw files for these fields are not currently preserved with a fixed
fetch date + sha256. Some PDFs live in the private data repo under
`src/data/councils/pdfs/council-pdfs/` (but not all 317 councils have
coverage).

## Work required

1. **Inventory pass.** For each council, identify the authoritative
   source document per field. Record in a new
   `src/data/councils/pdfs/PDF-INDEX.json` with `{council_ons, field,
   url, filename, fetched, page, sha256}`.

2. **Archive fetch.** Download each PDF to the private data repo (and
   when `civaccount-source-archive` goes public, mirror there).

3. **Page-reference capture.** For each (council, field) pair, record
   the page number inside the PDF where the value appears. Options:
   - Manual human tagging — slow but gold-standard, required for
     Pay Policy + MTFS where values are critical and contextual.
   - Automated regex/OCR search — faster, suitable for Statement of
     Accounts salary-band tables and Statement of Councillors Earnings
     rows that follow a stable format.

4. **Citation wiring.** Extend `src/data/citations.ts` with a
   `resolvePdfCitation(fieldPath, council)` that returns a
   `pdf_page` locator when the PDF-INDEX has an entry, else undefined.
   `getProvenance()` attaches it alongside Category A citations.

5. **UI.** `SourceAnnotation` already renders `pdf_page` locators via
   `describeLocator()` — no component change needed. The `source_url`
   opens the PDF at `#page=N` (browser PDF viewers respect this).

## Estimated effort

- Inventory pass: 317 councils × 5 Category-B-PDF fields = 1,585
  lookups. At 2 minutes each (identify PDF + page), ~53 hours of
  human-in-the-loop work. Batchable with scripts that narrow candidate
  URLs.
- Automated archive fetch: 1-2 hours (parallelised downloads, retry
  logic, sha256 recording).
- Wiring + UI: half a day.
- Validation re-run: minutes.

## Decision points

- **Single-source per field vs multi-source?** A Pay Policy Statement
  has one value for CEO salary — single source. A Statement of
  Councillors Earnings has N rows for N members — the citation is a
  row-filter. Both supported by the `Citation.locator` variants.
- **Annual re-scrape cadence.** Pay Policy + Allowances publish annually
  (March-May window). Statement of Accounts publishes late autumn.
  Wire a scheduled re-scrape with `fetched` updated per run.
- **Redacted values** (rare but present — e.g. CEO salary "not
  published" where statute permits). Do not substitute. Render a gap
  notice with a link to the council's published pay policy.

## Next action (this session if runway permits, else next)

Start the inventory pass against the 317 councils the existing
`field_sources[]` entries. Where `field_sources` already points at a
PDF URL, confirm the URL resolves; record the fetched date and
sha256; add a placeholder `page: null` waiting for human tagging.
