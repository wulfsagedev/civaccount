# North-star data standard

**Adopted 2026-04-22 per owner directive.** Before CivAccount rolls the
per-council audit out to any council beyond Bradford, Camden, and Kent,
those three must pass every criterion below — they set the bar, and no
council joins them until it meets the same bar.

---

## The five criteria

Every **rendered field** on a council page (numbers, dates, names,
documents, links) must satisfy all five criteria. A field is "rendered"
if any component in `src/components/dashboard/**` or `src/app/council/**`
emits it.

### 1. Source URL

Every value has a direct URL to the source document or dataset page.

- **National data** (budget categories, Band D, population, waste,
  road condition / length, Ofsted, LGBCE, capital programme): the URL
  lives in `citations.ts::NATIONAL_SOURCES` and resolves via
  `resolveCitation(fieldPath, council)`.
- **Per-council data** (CEO salary, allowances, cabinet, MTFS figures,
  salary bands, suppliers, grants): the URL lives on
  `Council.detailed.field_sources[fieldKey].url`.
- **No inferred sources.** If a value can't be traced to a live `.gov.uk`
  URL or an ONS / OPSS / Ofsted / LGBCE equivalent, it doesn't render.
  It either becomes an `UNDER-REVIEW` state behind `DataValidationNotice`
  or gets removed entirely.

### 2. Data year

Every value has an explicit fiscal / reporting year it represents.

- **Implicit-year fields** (e.g. `band_d_2025`) carry their year in the
  field name itself. Validator checks the numeric suffix matches the
  source CSV column.
- **Explicit-year fields** (CEO salary, supplier spend, grants, salary
  bands, MTFS, councillor allowances) carry `data_year` on
  `field_sources[fieldKey]`. Values: `"YYYY-YY"`, `"mid-YYYY"`,
  `"current"` for live pages (cabinet, CE/leader names).
- **Mixed vintages are expected and correct** — each field records its
  own source's publication cycle. Card headers and popovers surface the
  year. The hero paragraph **never makes a blanket year claim** that
  would misrepresent one of the numbers it contains.

### 3. Live URL

Every URL in the council's data must return HTTP 200 with actual
content — no silent 404s (200 → `/page-not-found/` redirects count as
broken), no Cloudflare-blocked pages that readers can open but crawlers
can't verify.

- The `link-check` validator runs against every URL in the council's
  `field_sources`, `documents`, `sources`, `transparency_links`, and
  `section_transparency.finances[].url`, including transitive checks for
  silent-404 redirect patterns.
- When a council's site blocks automated checks (Camden behind
  Cloudflare), we record Wayback Machine snapshots alongside the live
  URL and document the block in the council's AUDIT file.

### 4. Document fingerprint

Every document we pull a value from has a `sha256` checkpoint.

- **National CSVs** are hashed in `scripts/validate/source-manifest.json`
  under each dataset's `parsed_csv_sha256` — changes trigger explicit
  refresh workflow.
- **Per-council PDFs** are hashed in `src/data/councils/pdfs/council-pdfs/
  <slug>/<name>_meta.json` when we archive the document locally (gold
  standard: Bradford's 4 archived PDFs).
- **Per-council CSVs** (payments-over-£500, grants) hashed in
  `pdfs/spending-csvs/<slug>/_meta.json` and referenced in
  `suppliers-allowlist.ts` / `grants-allowlist.ts`.
- When archive isn't possible (bot-blocked council site, no document
  form to hash), we record the URL's last-verified date and rely on
  the `link-check` live-verification loop. Documented per council in
  its AUDIT file under "Known archive gaps."

### 5. Provenance page coverage

Every rendered field appears on `/council/[slug]/provenance`, grouped by
data year, with its source URL + last-verified date.

- The `audit-north-star.mjs` tool walks the renderable-fields manifest
  for the council and fails any field missing from the provenance page.
- Counter-test: a reader landing on `/council/bradford/provenance`
  without ever visiting `/council/bradford` can reconstruct every number
  shown on the dashboard by opening the documents listed.

---

## How this compares to the existing audit integrity score

`audit-council.mjs` gives a per-council integrity score (76-95 % on the
three audited councils today). The north-star standard is stricter: it
requires **100 % on every criterion**. A council at 95 % integrity is
not north-star if even one field is missing a data year or links to a
silent 404.

Think of integrity as "how close to PASS on the audit rubric" and
north-star as "no rendered field has a provenance gap of any kind."

---

## What this unlocks

Once all three reference councils pass:

1. **Rollout template.** Any new council audit becomes: run
   `audit-north-star.mjs --council=X`, fix every flagged gap, re-run
   until 0 gaps, commit.
2. **Reader trust.** The `/provenance` page is no longer aspirational —
   it literally mirrors every number shown on the dashboard, with live
   sources. Credibility claim becomes demonstrable.
3. **Freshness monitoring.** sha256 fingerprints mean a weekly cron can
   detect content drift on any of ~30 per-council documents + ~15
   national CSVs per council and file issues automatically.

---

## What this rules out

- Rendering any value without a traceable source — stripped, or hidden
  behind `DataValidationNotice`.
- "Looks approximately right" tolerances on exact-match fields (tax
  bands, council tax levels, LGBCE councillor counts).
- Claiming a council is "verified" when one of its five criteria is
  partial.
- Blanket-year hero paragraphs that gloss over mixed vintages.

---

## Workflow for adding a new council to the north-star set

1. `node scripts/validate/audit-north-star.mjs --council=<name>` →
   report of every gap.
2. For each gap:
   - Missing URL → source it, record in `field_sources` or
     `NATIONAL_SOURCES`.
   - Missing year → add to `field_sources[k].data_year` or verify the
     implicit year in the field name matches the source.
   - Dead URL → replace with current council URL, or remove the value
     until the council re-publishes.
   - Missing fingerprint → download document, record sha256 in
     `_meta.json`.
   - Missing on provenance page → extend `FIELD_LABEL` map if needed,
     re-run audit.
3. Re-run audit until "0 gaps".
4. Add council name to `NORTH_STAR_COUNCILS` set in `audit-north-star.mjs`.
5. CI gate: if any council in the set regresses to > 0 gaps, the build
   fails.

---

## Current state

| Council | Integrity | North-star gaps | Status |
| ------- | --------- | --------------- | ------ |
| Bradford | 93 % | **0 / 5** ✓ | Reference — PASS |
| Camden | 87 % | **0 / 5** ✓ | Reference — PASS (5 entries carry `archive_exempt: cloudflare_blocked`; Camden's Cloudflare WAF blocks automated fetches) |
| Kent | 87 % | **0 / 5** ✓ | Reference — PASS (5 entries carry `archive_exempt: live_page/no_document_form`; Phase 5 will upgrade Pay Policy / SoA / MTFS PDFs to full sha256 archive) |

**2026-04-22**: first run of the gate. All three reference councils at 0 gaps. The `north-star-gate` validator now fails CI if any of them regresses.

---

## Ownership

- **Audit tool** — `scripts/validate/audit-north-star.mjs`
- **CI gate** — hook into `validate.mjs` once all 3 reference councils
  hit 0 gaps
- **Per-council AUDIT.md** — each north-star council has one, documenting
  every criterion closed and any "known archive gap" exceptions
- **This document** — the standard. Update when the bar changes.
