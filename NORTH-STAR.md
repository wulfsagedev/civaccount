# CivAccount — North-Star methodology

**Version 1.0 — adopted 2026-04-22. This document is the canonical contract for how data lands on CivAccount. Older planning docs (`NORTH-STAR-STANDARD.md`, `DATA-PIPELINE.md`, `DATA-YEAR-POLICY.md`, `COUNCIL-AUDIT-PLAYBOOK.md`, `PROVENANCE-INTEGRITY-PLAN.md`) are superseded and moved to [`docs/archive/`](docs/archive/). Any conflict between this doc and older text — this doc wins.**

---

## 1. Mission

UK councils already publish how they spend public money. They publish it on their own websites. They publish it in inconsistent formats — PDFs, HTML tables, Socrata open-data portals, XLS spreadsheets, 360Giving CSVs, committee papers. A resident who wants to know "what does my council spend on bins / who does it pay / how high is my bill" has the information in theory but not in practice. They'd need to know which council, which URL, which format, and how to reconcile different pages to each other.

**CivAccount does exactly one thing: goes to the council's publications, presents the numbers clearly in one place, and puts a link next to every number so the reader can verify it themselves against the council's own document.**

We are a presentation layer. We are not a primary source. We do not compute. We do not estimate. We do not fill gaps with inference. If a council publishes a figure, we show it with a link. If a council doesn't publish a figure, we don't make one up — we leave the space empty and label it honestly.

This mission is the forcing function behind every decision below. If any decision seems to make CivAccount more comprehensive at the cost of verifiability, the decision is wrong.

---

## 2. Five non-negotiables

1. **Every rendered value must be independently verifiable by any member of the public.** No internal-only sources, no trust-us layer, no "we checked, trust us" values.

2. **Primary source = UK government publication.** GOV.UK, ONS, DEFRA, DfT, Ofsted, LGBCE, or a council's own `.gov.uk` domain. News, aggregators, Wikipedia, and third parties can only cross-reference — never supply the value itself.

3. **No computed values unless the computation is transparent and shown.** Per-capita spend (= spend ÷ population) is fine — both inputs are sourced, the formula is visible. "Savings target growth estimate" is not — it's not in a document, so it doesn't render.

4. **Date is structural, not decorative.** Every value has a year label visible to the reader within one interaction. Mixed vintages across a single card are expected and correct — we label each value with its own year rather than pretend they share one.

5. **If a value can't meet the bar above, it does not render.** The UI's `DataValidationNotice` / card-hiding pattern handles this gracefully. Stripping is always preferable to fabrication.

---

## 3. Data source tiers

Every rendered value is assigned a tier. Lower number = higher quality.

### Tier 1 — GOV.UK bulk dataset (automated verification possible)

- Format: CSV / ODS direct download
- Verification: `source-truth` validator compares our rendered value to the exact source cell on every CI run
- Fingerprint: `parsed_csv_sha256` in `scripts/validate/source-manifest.json`
- Examples: MHCLG RA Part 1/2, MHCLG Council Tax live tables, ONS population estimates, DEFRA ENV18, DfT RDC/RDL, Ofsted inspection data, LGBCE electoral data, MHCLG CoR capital expenditure

### Tier 2 — Council open-data portal (machine-readable, archived)

- Format: CSV / JSON / Socrata API / 360Giving
- Fingerprint: sha256 on the archived file in `pdfs/spending-csvs/<slug>/` or `pdfs/360giving/` with `_meta.json`
- Verification: aggregate derivations re-computed from the raw file on each run
- Examples: Camden Socrata (`opendata.camden.gov.uk`), 360Giving grant registers, Bradford DataHub

### Tier 3 — Council PDF, archived locally with sha256

- Format: PDF with extracted text (pdfplumber / pdftotext)
- Fingerprint: sha256 recorded in `_meta.json`, referenced in `field_sources[k].sha256_at_access`
- Verification: manual pdftotext extraction; excerpt quoted in data-file comment
- Examples: Bradford Pay Policy 2025-26 (page 11 deep-link), Bradford SoA, Bradford MTFS

### Tier 4 — Council-published document, reader-accessible but not archived

- Format: URL that works in a human browser but cannot be fetched by our scripts (Cloudflare, bot-blocks) or HTML pages with no downloadable document form
- Fingerprint: unavailable — `archive_exempt: "cloudflare_blocked" | "bot_blocked" | "no_document_form" | "live_page"` flag recorded
- Verification: manual extraction at a recorded `accessed` date; ideally confirmed by a secondary source
- Examples: Camden CE salary page, Kent Cabinet live page

### Tier 5 — Primary value confirmed via secondary source (last-resort acceptance)

- Format: we point readers at the primary; the secondary (news / LGC / Wikipedia talk page / academic paper) is the confirmation source we used
- Fingerprint: the secondary source URL, date, and quoted figure go into `field_sources[k].cross_check_ref`
- Verification: we never rely on Tier 5 alone for the rendered value. We use the secondary to confirm what the bot-blocked primary says. If there's no primary, the field is stripped.
- Examples: Kent CE salary £223,979 (primary PDF Cloudflare-blocked; Kent Online confirmed the figure quoted from Kent's disclosure)

### Forbidden — never used for values

- LLM-generated / model-inferred figures
- Wikipedia as a primary source (tertiary only, as a pointer)
- Trade aggregators (TaxPayersAlliance, Glassdoor, TPA Rich List)
- News items that don't cite a primary UK-government source
- "Estimates based on size" / interpolation / model-derived values
- Prior CivAccount values that can't be back-traced to a primary document

---

## 4. Field provenance schema (what every value carries)

Every entry in `Council.detailed.field_sources[k]` must carry:

```ts
{
  url: string;              // Direct URL to primary source (preferred: direct PDF/CSV link)
  title: string;            // Human-readable document title + page/section quote
  accessed: string;         // ISO date we last verified the value (YYYY-MM-DD)
  data_year: string;        // Fiscal / reporting year — "YYYY-YY" | "mid-YYYY" | "current"
  tier: 1 | 2 | 3 | 4 | 5;  // Source quality tier per section 3
  extraction_method:        // How the value was obtained from the source
    | 'csv_row'             //   → which row, which column in source-manifest
    | 'pdf_page'            //   → which page, what quoted text
    | 'aggregate'           //   → which filter, which aggregation function
    | 'socrata_query'       //   → which dataset, which query
    | 'manual_read';        //   → for Tier 4/5, recorded with accessed date

  // Tier-specific extras:
  sha256_at_access?: string;     // Required for tier ≤ 3
  archive_exempt?:               // Required for tier 4
    | 'cloudflare_blocked'
    | 'bot_blocked'
    | 'no_document_form'
    | 'live_page';
  cross_check_ref?: {            // Required for tier 5
    url: string;
    title: string;
    quoted_figure: string;
    access_date: string;
  };
  wayback_url?: string;          // Auto-snapshot on ingest (Memento protocol, RFC 7089)
  page?: number;                 // For pdf_page extraction
  excerpt?: string;              // Verbatim quote of the line containing the value
  page_image_url?: string;       // Pre-generated PDF-page PNG (Tier 3 only) — see §6 Phase 1b + §8
  csv_row_excerpt?: {            // Pre-extracted CSV row (Tier 1/2 only) — see §8
    headers: string[];
    row: string[];
    highlight_column: string;
  };
}
```

Any field missing `tier` or `extraction_method` **fails the CI validator**. Any field that doesn't meet its tier's fingerprint requirement **fails the CI validator**.

---

## 5. Date discipline

Follows ISO 8601 + UK fiscal-year convention:

- `"2025-26"` → 1 April 2025 to 31 March 2026 (UK fiscal year)
- `"mid-2024"` → ONS mid-year estimate as of June 2024
- `"current"` → live page with no stable fiscal year (e.g. Cabinet listings)
- Anything else → validator error

### Date rules

1. **Source document's own stated period is authoritative.** Not access date, not current fiscal year, not publication date. Whatever the document's cover page / front matter states.
2. **Every displayed value carries its year within one interaction.** Popover / badge / inline label.
3. **Multiple numbers near each other each carry their own year** unless the surrounding prose explicitly states all numbers share a year.
4. **Historical series preferred where a council publishes one.** Band D already has 5-year history (`band_d_2021` through `band_d_2025`); extend the pattern to other fields where history is published: budgets, reserves, capital, councillor allowance scheme.
5. **2026-27 data is held back from UI until this verification pipeline is fully operational.** MHCLG published 2026-27 Band D in March 2026; we have the values (`band_d_2026`) but the UI does not surface them until sign-off.
6. **When a council doesn't publish historical data**, show current only with an explicit "history not available" note. Don't backfill from inference.

---

## 6. Date + value verification workflow (per council, per session)

The same numbered steps run on every council. They're idempotent, scripted where possible, manual where necessary.

### Phase 0 — Inventory

Find every document the council publishes that might contain relevant data.

Checklist of URL patterns to probe on every council site:

- `<council>.gov.uk/finances-and-spending/` (or variants: `/finance`, `/budgets`, `/financial-information`)
- `<council>.gov.uk/statement-of-accounts/`
- `<council>.gov.uk/pay-policy-statement/` or `/chief-officer-pay/`
- `<council>.gov.uk/councillors-allowances/` or `/members-allowances/`
- `<council>.gov.uk/mtfs/` or `/medium-term-financial-strategy/`
- `<council>.gov.uk/cabinet/` or `/portfolio-holders/`
- `democracy.<council>.gov.uk/documents/` (moderngov-style PDF archive)
- `opendata.<council>.gov.uk/` (Socrata / CKAN / ArcGIS)
- `datahub.<council>.gov.uk/` (some councils)
- `<council>.gov.uk/spending-over-500/` or `/invoices-over-250/`
- 360Giving registry for the council
- `data.gov.uk` datasets published by the council

Output: `src/data/councils/pdfs/council-pdfs/<slug>/inventory.json` listing every candidate URL with an initial tier guess.

### Phase 1 — Archive

For each inventory URL, download the file to `src/data/councils/pdfs/council-pdfs/<slug>/` with:

- Filename that reflects document + year (e.g. `pay-policy-2025-26.pdf`)
- `_meta.json` sibling file carrying: source_url, publisher, document_type, fiscal_year, fetched (ISO), sha256, licence

Where the URL is bot-blocked (Tier 4), skip archive and record `archive_exempt` — the URL itself is still recorded in inventory, just not fetched.

Every successfully-archived URL gets a Wayback Machine snapshot via SavePageNow API. The Wayback URL goes into the `_meta.json`.

### Phase 1b — Pre-generate visual evidence (random-spot-check enablement)

At archive time, generate lightweight visual evidence for each value so **any reader, on a phone, can verify any number without running scripts**.

For **Tier 3 archived PDFs**:
- At extraction time (Phase 2), we know which page each value came from.
- Render that page to PNG using `pdftoppm -png -r 150 -f <page> -l <page>`.
- Store the PNG as a public static asset in `src/data/councils/pdfs/council-pdfs/<slug>/images/` (served by Next at `/archive/<slug>/images/...`).
- Record the resulting URL in `field_sources[k].page_image_url`.
- One PNG per page-per-field (pages shared by multiple values get cached).

For **Tier 1 GOV.UK CSVs**:
- No PNG — screenshots of spreadsheets are unreadable.
- Instead, emit a structured `csv_row_excerpt` containing headers + the council's row + the column to highlight.
- UI renders this as an inline mini-table in the popover.

For **Tier 2 council open-data** (Socrata / 360Giving):
- Either inline mini-table (same as Tier 1), or link directly to the platform's filtered view if the platform renders well (Socrata's native UI shows the row).

For **Tier 4** (bot-blocked):
- Pre-generation not possible. Rely on Wayback snapshot URL + live-URL-works-in-browser caveat.

For **Tier 5** (secondary-confirmed):
- Not applicable — no primary file to screenshot.

**Storage budget**: ~200 KB per PNG × ~10 fields per council × 317 councils ≈ **~600 MB at full rollout.** Acceptable. Deduplication via content-hashed filenames possible later if it becomes large.

**Why this is worth the storage**: the single biggest blocker to non-technical spot-checks is "I'd have to open a 6 MB PDF and find the right page." Pre-generated page PNGs reduce that to "tap the value, see the page." Immediately usable by anyone, not just developers.

### Phase 2 — Extract

Per document type:

- **PDF** → `pdftotext -layout`, sometimes with page-range. Key figures located by regex / text search. Quote the line containing the value in the data-file comment.
- **CSV / XLSX** → parse, navigate to the council's row, extract the named column. Record which row index + column header.
- **Socrata JSON** → API query, aggregate if needed. Record the query.
- **HTML table** → where accessible, parse with cheerio or equivalent. For bot-blocked: manual read.

Output: `src/data/councils/pdfs/council-pdfs/<slug>/extracted-values.json` with every value tagged by source file + location + extraction method.

### Phase 3 — Cross-check

For each extracted value:

1. If the value also appears in a Tier 1 CSV (e.g. CE salary appears in a council PDF *and* we happen to have it from an MHCLG aggregated dataset) — cross-check they agree.
2. For large financial figures, run **Benford's Law first-digit test** on the aggregate distribution of all values per council. Flag any council whose Benford conformance is > 1.96σ from expected for human spot-check.
3. **Year-on-year outlier**: compare to prior-year value if available. > 30% movement is flagged for human confirmation (might be real, usually worth a second look).
4. **Sum consistency**: budget category sum = total_service; allowances detail sum ≈ total_allowances_cost ± 5%; precept shares sum = total Band D.

### Phase 4 — Populate

Only values that survived Phases 1-3 land in the council's data file. Each one carries the full `field_sources[k]` schema from section 4.

Values that failed:
- **Not published by council** → field is absent. UI handles via card-hiding or "not published" label.
- **Published but extraction ambiguous** → flag in `<COUNCIL>-AUDIT.md` under "Known gaps"; field absent until resolved.
- **Published but fails cross-check (Benford outlier / sum inconsistency / YoY outlier)** → field absent; investigate separately.

### Phase 5 — Verify

Run the validator suite:
- `source-truth` (Tier 1 values match source cell)
- `audit-north-star` (structural completeness)
- `field-source-years` (data_year present + well-formed)
- `tier-classification` (tier declared + extraction_method declared)  
- `benford` (first-digit distribution)
- `sum-consistency` (cross-field sums)
- `yoy-outlier` (year-on-year sanity)
- `link-check` (no silent 404s)

All must pass. Any failure → field stripped or fix re-attempted; not waved through.

### Phase 6 — Document

Write `<COUNCIL>-AUDIT.md` in the data repo, including a **Datasheet for Datasets**-style section (Gebru et al., ACM 2021 standard):

1. Motivation (why does this council's dataset exist — link to mission)
2. Composition (what fields are populated, what are absent, why)
3. Collection process (sources, dates, methods)
4. Preprocessing (extraction scripts used, any cleaning)
5. Uses (who is this for)
6. Distribution (OGL v3, how readers access)
7. Maintenance (when re-verified, by whom)

Plus a per-field register mapping field → source document → page → sha256 → last-verified → tier → extraction method.

### Phase 7 — Ship

One PR per council: data file + archived files + `_meta.json` + extracted-values.json + `<COUNCIL>-AUDIT.md`. CI runs all validators. Human reviews. Merge.

---

## 7. W3C PROV lineage

Every `field_sources` entry is compatible with the W3C PROV data model (PROV-DM / PROV-O, 2013 standard used by research data infrastructure worldwide):

- **Entity**: the source document (PDF, CSV, HTML page) identified by URL + sha256
- **Activity**: the extraction step (`pdf_page` / `csv_row` / etc.) identified by extraction_method + accessed date
- **Agent**: the human + script that performed extraction (commit author + script path + script version)
- **Relationships**:
  - rendered value `wasDerivedFrom` source document
  - extraction activity `wasAssociatedWith` agent
  - rendered value `wasGeneratedBy` extraction activity

This gives us a machine-readable lineage graph. Research groups ingesting our dataset can use existing PROV-aware tooling without transforming it.

At render time, the SourceAnnotation popover can render a plain-English lineage sentence: *"The Bradford 2025-26 Chief Executive salary £217,479 was extracted from page 11 of Bradford's Pay Policy Statement 2025-26 (sha256 545774…) by Claude under commit 4130b06 on 2026-04-21, verified against published .gov.uk URL."*

---

## 8. Presentation — random spot-check UX

The one UI rule: **any reader, on any device, must be able to verify any rendered value with at most two taps.**

### The popover (tap any number)

A `SourceAnnotation` popover opens, showing:

1. Plain-English lineage sentence (§7)
2. **Tier badge** — "GOV.UK bulk" / "Council open-data" / "Archived PDF" / "Council PDF (bot-blocked)" / "Secondary-confirmed"
3. **Data year badge** — e.g. "2025-26"
4. **Visual evidence appropriate to the tier:**
   - **Tier 1 / 2**: inline mini-table with the CSV row + column highlighted
   - **Tier 3**: thumbnail of the pre-generated page PNG — tap to expand full-screen
   - **Tier 4**: "Open source" link → live council URL + "Open archived copy" link → Wayback snapshot
   - **Tier 5**: primary URL + secondary confirmation URL side by side with quoted figure
5. **sha256 fingerprint** prefix (first 12 chars) — proof the archived file is tamper-evident
6. **"Open source"** button — opens the primary `.gov.uk` document in a new tab
7. **"Open local archive"** button (Tier ≤ 3) — opens our immutable archived copy
8. **Last-verified date** (ISO, human-readable)
9. **"Report incorrect data"** footer link → pre-filled feedback form

The non-dev spot-check path is: **tap value → see page image + source URL**. One tap. No terminal. No scripts. No PDF download on mobile data.

### The provenance page (`/council/[slug]/provenance`)

Aggregate view of every rendered field for a council:
- Table sorted by tier (best evidence first)
- Each row has the same evidence as the popover: mini-table / page PNG thumbnail / source link
- FAIR self-assessment JSON-LD block (§9)
- Datasheet-for-Datasets summary (§6 Phase 6)
- "Download all archives as ZIP" for researchers

### The corrections page (`/corrections`)

Every correction ever made, visible to the public (§14).

### Inline data-year labels

- Card headers carry year: "Who the council pays — 2024-25"
- Mixed-vintage cards: each number carries its own year inline
- Hero paragraphs that combine multiple numbers must either (a) share a year across all numbers or (b) each number gets its own year inline

---

## 9. Statistical sanity — Benford's Law

Following the methodology in Mark Nigrini's *Journal of Accountancy* 2022 paper and his 2012 *Benford's Law: Applications for Forensic Accounting, Auditing, and Fraud Detection*:

Benford's Law says the first digit of naturally-occurring financial values follows:

| First digit | Expected % |
|-------------|-----------|
| 1 | 30.1% |
| 2 | 17.6% |
| 3 | 12.5% |
| 4 | 9.7% |
| 5 | 7.9% |
| 6 | 6.7% |
| 7 | 5.8% |
| 8 | 5.1% |
| 9 | 4.6% |

Fabricated / manipulated financial data tends to deviate — fabricators distribute digits more uniformly than reality does.

**Application**: new validator `scripts/validate/validators/benford.mjs` runs the first-digit test across every numeric value we render per council (minimum N=30 values — below which the test is unreliable per Nigrini). Per-council z-score logged; councils with z > 1.96 flagged for human spot-check.

This wouldn't be a gate — Benford false-positives are real, especially with small samples. It's a trip-wire: "this council's numbers look statistically unusual; audit them." Today's Camden figures likely would have tripped this.

---

## 10. FAIR compliance

Per Wilkinson et al., *Scientific Data* (2016), the most-cited modern data-quality standard:

- **Findable**: every council has a persistent URI (`civaccount.co.uk/data/council/<slug>/`) + rich JSON-LD metadata + listed in the `sitemap.xml`.
- **Accessible**: all data publicly served over HTTPS, no auth required; archive files available at stable content-addressed URLs.
- **Interoperable**: JSON-LD schema.org Dataset markup; CSV export endpoint per council; PROV-compatible provenance.
- **Reusable**: Open Government Licence v3.0 (matches the councils' own licence — we inherit); clear citation guidance.

A FAIR self-assessment JSON-LD block lives on every council's `/provenance` page.

---

## 11. Schema.org & 5-Star Open Data

### Schema.org JSON-LD on every council page

Every rendered council page embeds:
- `schema:WebPage` (existing)
- `schema:Dataset` (the council's derived data)
- `schema:Organization` (the council itself, linked to GOV.UK URI)
- `schema:hasPart` relationships linking dataset to source documents

### 5-Star Open Data (Berners-Lee)

Target: ★★★★★ for the derived dataset.

- ★ on the web — **done** (civaccount.co.uk is live)
- ★★ structured data — **done** (TypeScript data files, JSON API)
- ★★★ non-proprietary — **done** (JSON, CSV export)
- ★★★★ URIs identify things — **to add** (each field has a persistent URI)
- ★★★★★ linked data — **to add** (link council URI to MHCLG URI, ONS URI, LGBCE URI)

---

## 12. Reproducibility (Turing Way alignment)

Following the Alan Turing Institute's *Turing Way* handbook for reproducible research:

Per council, a `manifests/<slug>.json` reproducibility manifest lists:
- Every source URL + sha256 at fetch time + fetch date
- Every extraction script version (commit SHA)
- Every validator that ran + version + outcome
- The final rendered values

Anyone can run `npm run reproduce -- --council=Bradford` which:
1. Re-fetches each source URL via Wayback if primary is down
2. Compares fetched sha256 to stored sha256
3. Re-runs extraction scripts
4. Compares extracted values to current data file
5. Exits 0 if identical; exits 1 with a diff if not

This is the scientific-reproducibility floor: anyone in the world should be able to reproduce our numbers.

---

## 13. Immutable archive (content-addressed storage)

Downloaded source files are stored **content-addressed** — the filename on disk is the sha256 hash:

```
src/data/councils/pdfs/by-hash/
  ├── 54/57/54577433...e8b4.pdf
  ├── 2a/72/2a72b676...981f.pdf
  ...
```

Human-readable pointers live alongside:

```
src/data/councils/pdfs/council-pdfs/<slug>/
  ├── pay-policy-2025-26.pdf → symlink / pointer to by-hash/54/57/...
  ├── pay-policy-2025-26_meta.json
  ├── statement-of-accounts-2024-25.pdf → symlink / pointer to by-hash/af/b8/...
  ...
```

Benefit: if `pay-policy-2025-26.pdf` is ever replaced (accidentally or maliciously) the pointer breaks and CI fails. The original file (under its hash) is always preserved. Git-LFS or plain git depending on file sizes.

---

## 14. Memento / Wayback integration (RFC 7089)

Every source URL on ingest is auto-snapshotted to Internet Archive via the SavePageNow API. The Wayback URL is stored in `field_sources[k].wayback_url` alongside the live URL.

On the `/provenance` page, readers see both:
- "Source (live): council.gov.uk/pay-policy/"
- "Source (archived 2026-04-22): web.archive.org/web/20260422…/…"

Means readers can always verify the value even if the council has since edited or deleted the document.

---

## 15. Corrections & change transparency

Visible on the site at `/corrections`:

- Every correction that changed a published value
- Date of correction
- Old value → new value
- Why (e.g. "source-truth validator found year-drift against MHCLG RA 2025-26")
- Verifying source link
- Commit SHA

Today's Camden £118.5m → £10m correction is correction #001. Bradford's CE name fix is earlier. Publishing these visibly is a trust-through-fallibility signal — Poynter / IFCN journalism standard.

---

## 16. Data dependency declaration (Sculley-style)

Per Sculley et al., *Hidden Technical Debt in Machine Learning Systems* (Google, NeurIPS 2015), silent data dependencies are the single biggest source of data-pipeline rot.

`data-dependencies.json` (machine-readable) declares:

```json
{
  "sources": {
    "area-council-tax": {
      "downstream_fields": ["council_tax.band_d_2025", ...],
      "last_updated": "2026-04-21",
      "consumers": ["source-truth validator", "UnifiedDashboard hero"]
    },
    ...
  }
}
```

Change a source → validator knows exactly which fields depend → CI fails until consumers are reviewed. Prevents the "oh we forgot to update X" class of error.

---

## 17. Schema enforcement (CI validator stack)

These run on every commit. Any failure blocks merge.

| Validator | Checks | Status |
|-----------|--------|--------|
| `source-truth` | Tier 1 values exact-match source CSV cells | ✅ existing |
| `field-source-years` | Every field_sources entry has well-formed data_year | ✅ existing |
| `audit-north-star` | 5-criterion structural gate on reference councils | ✅ existing |
| `north-star-gate` | Regression gate — reference councils must stay at 0/5 | ✅ existing |
| `tier-classification` | Every value declares tier + extraction_method | 🔴 NEW |
| `forbidden-source-scan` | No URL points at a forbidden domain list | 🔴 NEW |
| `benford` | Per-council first-digit distribution within 1.96σ | 🔴 NEW |
| `sum-consistency` | Cross-field sum checks | ✅ partial — extend |
| `yoy-outlier` | Year-on-year change within plausible bounds | 🔴 NEW |
| `last-verified-freshness` | No value's last_verified older than 180 days | 🔴 NEW |
| `link-check` | HTTP 200 on every field_sources URL, no silent 404s | ✅ existing |
| `reproducibility` | `npm run reproduce` exits 0 per council | 🔴 NEW |
| `content-addressed-archive` | Every archived file matches its recorded sha256 | 🔴 NEW |

Five new validators to build. Three existing validators to extend.

---

## 18. Session continuity (working across weeks)

I (Claude) have no persistent memory across sessions. The methodology must be resumable from scratch by reading:

1. **This document** — `NORTH-STAR.md`
2. **Per-council status** — `scripts/council-research/status/<slug>.json` (per-council progress: Phase 0 ✓ / Phase 1 ✓ / Phase 2 ⏳ …)
3. **Per-council audit** — `docs/<COUNCIL>-AUDIT.md` (what's been verified, open gaps)
4. **Global progress** — `docs/PROGRESS.md` (which councils done, which in progress, which blocked)

Any future session reads these four sources and knows exactly where to pick up. No oral history, no assumed context, no "ask the previous agent."

---

## 19. Tooling inventory

Already installed / in repo:
- `pdftotext` (poppler) — PDF text extraction ✓
- `pdftoppm` (poppler) — PDF page → PNG rendering ✓
- `sha256sum` — fingerprinting ✓
- Node.js + repo scripts ✓

To build (as part of foundation scaffolding):
- `scripts/council-research/01-inventory.mjs` — URL pattern probing
- `scripts/council-research/02-archive.mjs` — fetch + sha256 + _meta + Wayback snapshot
- `scripts/council-research/03-extract-pdf.mjs` — pdftotext wrapper + structured JSON
- `scripts/council-research/04-extract-csv.mjs` — csv/xlsx extractor
- `scripts/council-research/05-populate.mjs` — extracted JSON → data-file diff
- `scripts/council-research/06-audit-evidence.mjs` — on-demand PDF → PNG for spot-checks
- `scripts/council-research/lib/{fetch,pdf,sha256,meta,wayback,prov}.mjs` — helpers
- `scripts/validate/validators/{tier-classification,forbidden-source-scan,benford,yoy-outlier,last-verified-freshness,reproducibility,content-addressed-archive}.mjs` — new validators

---

## 20. Definition of "Done" per council

A council is **North-Star done** when:

1. ✓ All archivable documents fetched to `pdfs/council-pdfs/<slug>/` with sha256 + `_meta.json` + Wayback URL
2. ✓ Every rendered field has a `field_sources` entry meeting section 4 schema
3. ✓ All 13 CI validators pass (0 errors, warnings reviewed)
4. ✓ `<COUNCIL>-AUDIT.md` written with Datasheet for Datasets structure (section 6 Phase 6)
5. ✓ `manifests/<slug>.json` reproducibility manifest committed
6. ✓ `npm run reproduce -- --council=<slug>` exits 0
7. ✓ `status/<slug>.json` marked `"done": true`
8. ✓ Any fields that can't meet the bar are absent (stripped), not approximated

Three reference councils (Bradford, Camden, Kent) must be North-Star done before we scale to any other council. After that, new councils are added one at a time, each passing the same bar.

---

## 21. What this methodology rules out

- LLM-invented numbers (the root cause of Camden's £118.5m fabrication — will be forbidden by `forbidden-source-scan` validator)
- Uniform schema that forces every council to have every field (optional schema; stripping is fine)
- "Looks approximately right" tolerances on values known to be exact in source
- Rendering a blanket-year claim across mixed-vintage data
- Back-filling missing history via interpolation
- Trust-us claims without a verifiable click-through to a primary source

---

## 22. Reading list (for any future maintainer)

Essential (cited throughout this doc):

1. Wilkinson et al. (2016), *Scientific Data* — **The FAIR Guiding Principles for scientific data management and stewardship** — https://www.nature.com/articles/sdata201618
2. W3C (2013) — **PROV-DM: The PROV Data Model** — https://www.w3.org/TR/prov-dm/
3. Gebru et al. (2021), *Communications of the ACM* — **Datasheets for Datasets** — https://dl.acm.org/doi/10.1145/3458723
4. Nigrini (2012), Wiley — **Benford's Law: Applications for Forensic Accounting, Auditing, and Fraud Detection**
5. Berners-Lee (2006, updated 2010) — **5-Star Open Data** — https://5stardata.info/
6. Sculley et al. (2015), NeurIPS — **Hidden Technical Debt in Machine Learning Systems** — https://papers.nips.cc/paper/2015/hash/86df7dcfd896fcaf2674f757a2463eba-Abstract.html
7. The Alan Turing Institute — **The Turing Way** — https://the-turing-way.netlify.app/
8. Van de Sompel et al. (2013), RFC 7089 — **Memento — Time-Based Access to Resource States** — https://datatracker.ietf.org/doc/html/rfc7089

UK-specific:
9. Open Data Institute — **Open Data Certificate** (ODI bronze/silver/gold/platinum levels) — https://certificates.theodi.org/
10. mySociety (2023) — **Unlocking the Value of Fragmented Public Data** — https://www.mysociety.org/2023/02/21/unlocking-the-value-of-fragmented-public-data/
11. Centre for Public Data — publications on local-government data fragmentation — https://www.centreforpublicdata.org/publications
12. Institute for Fiscal Studies — local-government finance methodology notes — https://ifs.org.uk/topics/local-government-finance

These are the floor. Anyone picking up this project should skim all of them before making methodology decisions.

---

## 23. Owner sign-off

This document was adopted 2026-04-22. Any change to its principles (section 2) requires explicit sign-off from the project owner. Changes to process/tooling (sections 3-20) can be made by commit with clear commit message; reverted at owner's request.
