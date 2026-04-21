# Provenance Integrity Plan — v3

**Status:** v3 approved 2026-04-21. Execution started. No data stripped.
**Owner:** Owen (hello@owenfisher.co — internal only, not for site).
**Policy (set by Owen, 2026-04-21):**

> Every single number on the app must trace back to a publicly-available `.gov.uk`, `.ons.gov.uk`, or open-government document. In a maximum of a few clicks from any number, the reader must see the document and identify the exact row, cell, or page the number was taken from.
>
> Zero hallucination. Zero estimation. Zero algorithmic gap-filling. Zero "reasonable guesses." If a number cannot satisfy the rule, it does not render.

This plan takes that rule seriously and walks the whole app against it.

---

## 1. What "traceable in a few clicks" means

A number on the site passes the rule only if:

1. **There is a specific source document** — a CSV row, PDF page, spreadsheet cell, or OCDS JSON record — that contains the exact value we render (subject to unit/format conversion that is itself documented).
2. **That document is on a `.gov.uk`, `ons.gov.uk`, or equivalent open-government host.** 360Giving CSVs published by councils qualify (publisher is a `.gov.uk` entity); GrantNav aggregations of unknown provenance do not. Contracts Finder qualifies as a host, but values are ceilings, not spend (see §5).
3. **We archive the raw document** at scrape time so a later source-site change can't invalidate the trail.
4. **The UI deep-links** to the document — ideally to the exact row (CSV fragment, PDF `#page=N`). A landing-page link doesn't pass.
5. **The rule is enforced at build time.** Any value without a compliant citation blocks the deploy.

Anything short of (1)–(5) is trust-breaking. We've already seen that readers notice and that "close enough" provenance isn't close enough.

---

## 2. Full app-wide field audit (every rendered number)

Scope: 317 councils × 47 numeric/rendered fields = **12,814 field × council pairs**. Plus a handful of editorial / derived surfaces (KPI RAG colours, hero paragraph, etc.).

Ratings used:

- **A.** National CSV/ODS exists with a row keyed on ONS code. Row-level citation achievable with known work.
- **B.** Per-council PDF scrape. Page-level citation achievable if raw file preserved and page numbers recorded.
- **C.** Aggregate/derived from multiple source rows. Needs row-list provenance.
- **D.** Algorithmic or editorial (thresholds, categorisations, LLM-generated text). **Fails the rule unless removed or re-sourced.**
- **E.** Unknown / suspected LLM-extracted. **Needs investigation before it can stay.**

### 2.1 Category A — national datasets with row-level citations achievable

Raw file present in `src/data/councils/pdfs/gov-uk-bulk-data/`. Row key is the ONS code unless noted.

| Field(s) | Source (manifest id) | Raw file | Row key |
|---|---|---|---|
| `council_tax.band_d_2025` (and 2021-24 historical) | `area-council-tax` | `parsed-area-band-d.csv`, `Band_D_2026-27.ods` | ONS |
| `budget.education`, `transport`, `childrens_social_care`, `adult_social_care`, `public_health`, `housing`, `cultural`, `environmental`, `planning`, `central_services`, `other`, `total_service` | `revenue-expenditure-part1` | `gov-uk-ra-data/RA_Part1_LA_Data.csv` | ONS + column |
| `budget.net_current`, `detailed.reserves` | `revenue-expenditure-part2` | `RA_Part2_LA_Data.csv`, `parsed-reserves.csv` | ONS |
| `population` | `ons-population-mid2024` | `parsed-population.csv` | ONS |
| `detailed.waste_destinations`, `service_outcomes.waste.recycling_rate_percent` | `defra-waste-2022-23` | `parsed-waste.csv`, `defra-waste-2022-23.ods` | Waste authority |
| `service_outcomes.roads.condition_good_percent` | `road-condition` | `parsed-road-condition.csv` | ONS |
| `service_outcomes.roads.maintained_miles` | `road-length` | `parsed-road-length.csv` | ONS |
| `service_outcomes.children_services.ofsted_rating` | `ofsted-childrens-services` | `parsed-ofsted.csv` | ONS |
| `service_outcomes.housing.homes_built` | *(not yet in manifest)* | needs to be added | ONS |
| `detailed.total_councillors` | `lgbce-councillors` | `parsed-lgbce-councillors.csv` | ONS |
| `detailed.capital_programme` | `capital-expenditure` | `parsed-capital-expenditure.csv` | ONS |
| `detailed.chief_executive_salary` | `ceo-salary` | `parsed-ceo-salary.csv` + individual Pay Policy PDFs | ONS (compiled) |

**~29 fields across 317 councils = ~9,200 values achievable.** The work: carry the ONS-code row reference + source manifest id on each value, add a CSV-deeplink resolver to the UI.

### 2.2 Category B — per-council PDFs (scrape-archive-cite)

| Field(s) | Typical source per council | Current coverage |
|---|---|---|
| `detailed.salary_bands` | Statement of Accounts PDF (Note on employee emoluments) | variable; many councils have it |
| `detailed.councillor_basic_allowance`, `total_allowances_cost`, `councillor_allowances_detail` | Members' Allowances Scheme PDF + Statement of Councillors Earnings PDF | variable |
| `detailed.cabinet`, `council_leader`, `chief_executive` | Moderngov `mgMemberIndex` or council portfolio-holders page | ~150 via moderngov script |
| `detailed.budget_gap`, `savings_target` | Medium Term Financial Strategy PDF | ~200 councils |
| `detailed.service_spending` (sub-categories like "Learning Disability Services £77.8m") | Council budget book / revenue estimate PDF | varies |

**~10 fields but each requires per-council PDF handling.** The work: for every extracted value, record `{pdf_url, page, extraction_method, extracted_at, raw_text_excerpt}`. Preserve the PDF in the private data repo so cite-links never rot. UI opens the PDF at `#page=N`.

The extraction method matters. If a value was read by a human from the PDF, it's auditable. If it was LLM-extracted or regex-extracted, we need a re-verification step (a second independent read — ideally human spot-check of a random sample per data release).

### 2.3 Category C — aggregates from payment ledgers

| Field(s) | Source | Current state |
|---|---|---|
| `detailed.top_suppliers.annual_spend` | Should be: council's own spending-over-£500 CSV. Currently: Contracts Finder OCDS with broken aggregation. | 317 councils have values; all structurally unsound. |
| `detailed.grant_payments` | Mix: 9 verified (360Giving + spending CSVs). 304 came from `/tmp/grants-batch-*.csv` files no longer in the repo. | 9 verified, 304 unverified. |

**These are aggregate values** (sum of N payments to the same supplier / recipient). For the rule to pass:

- We need the raw payment ledger (.csv from the council, hosted on `.gov.uk`) archived at scrape time.
- The aggregate's provenance must list every contributing row `{row_index, amount, date, description}`.
- The UI must let the reader open the aggregate and see all contributing rows → click any row to jump to the original source column.

Current coverage of council spending CSVs: **30 of 317**. Current coverage of 360Giving files: **4 files** (Birmingham, Camden, Trafford `birmingham-grants.xlsx`, `camden-grants.csv`, and two national aggregate files).

### 2.4 Category D — algorithmic / editorial (fail the rule as-is)

These surfaces exist today and do not trace to a source document:

| Surface | Why it fails |
|---|---|
| `performance_kpis` status (red/amber/green) | Thresholds invented by CivAccount (e.g. ≥50% recycling = green). No government source defines these cutoffs. Derived in [scripts/enrich-kpis-derived.py](V3.0/scripts/enrich-kpis-derived.py). |
| Supplier `description` text ("Summary written by CivAccount based on published contract details") | Self-labelled editorial. Currently tagged `label: 'editorial'` but still user-visible text without source-row backing. |
| Grant `purpose` / `description` text (some entries) | For 9 allowlisted councils this is the purpose column from the source CSV. For the other 304 it came from `/tmp/grants-batch-*.csv` which we can't trace. |
| Dashboard hero paragraph ("Bradford Council is a metropolitan district serving 546,200 residents. In 2025-26 …") | Template-generated from other fields. The *components* are sourced, but the generated prose is CivAccount. |
| Cabinet member `portfolio` summaries (e.g. "Leader of Council and corporate portfolio") | If extracted from moderngov pages verbatim, fine. If paraphrased/LLM-summarised, fails. Needs per-record extraction-method audit. |
| `tax_bands` (A-H rates computed from Band D × statutory ratios) | The ratios are statutory (VOA). Derivation is transparent. Passes if we link to the VOA ratios table AND to the source Band D value. |
| `per_capita_spend`, `per_capita_council_tax`, `vs_average`, `council_tax_shares`, `council_tax_increase_percent` | Transparent derivations from sourced components. Pass if the derivation and both inputs are cited. |

The RAG colours and the hero paragraph are the hardest calls. Two options for each:

- **Delete them.** KPIs become a plain list of metric + value + date, no colour. Hero paragraph becomes a data panel of sourced facts, not prose.
- **Replace with a statutory/published rating.** Ofsted already gives a rating; recycling rate has no government-set target at authority level, so we can't replace it with an official RAG and should just drop the colour.

Recommendation: **delete both.** They're opinionated framing that can't be substantiated from source, and the user asked for zero algorithmic judgment.

### 2.5 Category E — needs investigation before keeping

Flagged as suspect based on audit. Each blocks shipping any new work until resolved.

| Field | Concern | Action |
|---|---|---|
| `detailed.staff_fte` | `parsed-workforce.csv` exists with per-council FTE (e.g. Bradford 8168). QPSES / ONS Public Sector Personnel publishes at the regional level; no national per-council FTE file that I've traced. The parse script that produced this CSV isn't in the repo. Could be extracted from individual council statements of accounts, could be LLA, could be something else. | Trace the CSV's origin. If the per-council values were derived (regional share / ONS code weighting), that's algorithmic and fails. If they were scraped from each council's own Statement of Accounts (employee note), they're Category B and we wire page citations. |
| `detailed.top_suppliers.description` (editorial) | LLM/rule-generated from `tender_title`. The label warns it's editorial; it's still rendered text. | Remove the description field (or keep it on a verified per-council basis with the source `tender_title` row cited). |
| Cabinet `portfolio` strings (descriptive) | Are these verbatim from the moderngov page or LLM-summaries? | Sample 20 random councils; diff against current moderngov pages. Re-scrape if divergent. |
| Grant `purpose` strings for the 304 unverified councils | Unknown origin. | These go regardless when we strip to the allowlist. |

---

## 3. The architecture: per-value citations

### 3.1 `Citation` type (replaces `DataProvenance`)

```ts
export interface Citation {
  /** Stable ID from source-manifest.json. Identifies which dataset / scrape cycle this came from. */
  dataset_id: string;

  /** Document URL on .gov.uk / ons / opengov — the thing the reader opens. */
  source_url: string;

  /** Local archive path (private repo) — used when source_url goes 404 and as the ground-truth artefact. */
  archive_path?: string;

  /** Where inside the document. Choose one shape: */
  locator:
    | { kind: 'csv_row'; file: string; row: number; column: string }
    | { kind: 'csv_filter'; file: string; filter: Record<string, string>; column: string }
    | { kind: 'pdf_page'; page: number; excerpt?: string }
    | { kind: 'ocds_award'; ocid: string; award_id: string }
    | { kind: 'html_selector'; selector: string; text_excerpt: string };

  /** When the source was last fetched. ISO date. */
  fetched: string;

  /** For aggregates, how the final value was produced. */
  derivation?: {
    method: 'sum' | 'max' | 'count' | 'ratio' | 'statutory_multiplier';
    inputs: Citation[];
    notes?: string;       // e.g. "Sum of grant payments where Recipient = 'Anchor Project'"
  };

  /** Extraction method — how confident we are in the value match. */
  extraction: 'exact_cell' | 'pdf_text' | 'pdf_ocr' | 'human_review' | 'regex';

  /** When extraction involves ambiguity, the human-verified-at date. */
  verified_at?: string;
}
```

### 3.2 Where citations live

- **Category A (national CSVs):** citations computed at build time from source-manifest.json. Every value carries the manifest id + ONS code + column name. UI resolves to a CSV-download link with an anchor-highlight for the row.
- **Category B (PDFs):** citations hand-written per council per field. Stored on the council record, shape `citation: Citation`. The PDF is archived alongside the record. UI opens `source_url#page=N`.
- **Category C (aggregates):** citation's `derivation.inputs` lists each row citation. UI expands the aggregate to show all contributing rows, each with its own deep link.

### 3.3 UI surfaces

- Popover (existing) → shows dataset title, year, extraction method. Adds "Open source document" (existing) and "See the exact row/page" (new).
- Aggregate click → inline expansion listing every source row. Deep-links per row.
- Source-archive fallback: if a `source_url` fails (silent 404 detection already shipped), UI shows "Original page moved — see archived copy from [fetched]" pointing to Wayback Machine capture.

### 3.4 Build-time enforcement

`npm run validate` adds a `provenance-strict` validator:

1. For every rendered field (as defined by a new `src/data/renderable-fields.ts` manifest), every council that has that field must have a compliant `citation`.
2. Citation URLs must resolve — reuses `audit-provenance.mjs` logic (including silent-404 detection).
3. If a citation has `derivation`, every input citation must itself be valid.
4. `extraction: 'pdf_ocr'` or `'regex'` requires `verified_at` within the last N months.
5. Missing, broken, or stale citation = validation error → deploy blocked.

Pre-deploy: `npm run validate && npm run build`. Any failure blocks Vercel.

---

## 4. Edge cases

Exhaustive pass. One-liner per case unless it needs detail.

### 4.1 Source document lifecycle
1. **Source URL goes 404.** → Fallback to archived copy. Surface "source removed" badge. Show Wayback link.
2. **Source URL returns 200 but content is a generic 404 page** (silent 404). → Treat as 404. Same fallback. (Detector already shipped in `link-check.mjs`.)
3. **Source URL redirects chain.** → Cite the final URL, not the original. Store both.
4. **Source document updated with a correction** (e.g. MHCLG issues an amended RA release). → New dataset version in `source-manifest.json`. Existing values stay attributed to their original version; rebuild when new data enrichment runs.
5. **Council removes a PDF from its public site.** → Use archive. Open-data licence (OGL) permits re-hosting; private repo already stores.
6. **Council site blocks crawlers** (403 moderngov / Cloudflare). → The URL still works in a reader's browser; our checker flags but marks "reader-accessible, bot-blocked" separately so we don't show "broken" incorrectly.

### 4.2 Identity and naming
7. **Council name changes / reorganisation** (North Yorkshire UA replacing NY county + 7 districts 2023). → ONS codes are the stable key. Every citation joins on ONS code, never council name.
8. **Aliased supplier/buyer names in OCDS** (e.g. "City of Bradford Metropolitan District Council" vs "Bradford Council"). → Normalise at scrape time with the existing alias table; record both raw and normalised in the archive.
9. **Recipient-name variation across grants CSVs** (e.g. "St John's Ambulance" vs "St John Ambulance"). → Don't consolidate variants unless the council's own publication did so. The aggregate's `derivation.notes` explains any de-duplication applied.

### 4.3 Numeric / format conversions
10. **Thousands vs units** (budget figures stored as thousands but displayed as millions). → Conversion is transparent; citation cites the source cell's unit; UI formats from that.
11. **Currency rounding** (source is £1,234,567.89; we render £1.2m). → Explicit formatter rules. Raw value always queryable.
12. **Percentages** computed from two cells (e.g. council tax share = their band_d / total). → Derivation citation lists both inputs.
13. **Negative values** (e.g. parking services -£3.3m net revenue). → Display signed; tooltip explains "income exceeds expenditure."
14. **Redacted rows in spending CSVs** (e.g. "REDACTED" in supplier name). → Excluded from aggregation; aggregate's derivation includes `redacted_rows_excluded: N` and links to the raw file so the reader can reconcile.

### 4.4 Data freshness
15. **Data year rolls over** (2024-25 RA dropped, 2025-26 published). → Re-scrape on the manifest's cadence. Stale values get a "Data from [year], refreshed [date]" indicator.
16. **Historical series** (council tax back to 2021-22). → Each year is its own citation. Never one blanket "historical data" citation.
17. **Mid-year data** (ONS population mid-2024 represents June 2024). → Citation's data_year field preserves this.
18. **Cabinet reshuffles / CEO changes** between scrapes. → `verified_at` + max staleness policy. Flagged when overdue.

### 4.5 Derivation / computation
19. **Statutory-multiplier derivations** (Band A = Band D × 6/9 etc.). → Derivation cites the VOA table as a secondary source; primary citation is the Band D value.
20. **Per-capita ratios.** → Derivation lists both inputs; both must themselves be cited.
21. **Summed aggregates.** → Every input row cited. Sum is transparent.
22. **Max / largest-of aggregates.** → Cited the same as sums, with `method: 'max'`.
23. **Count aggregates** (e.g. "12 payments"). → Just count; cite the filter used.
24. **"Compared to average"** comparisons. → Cite both the council's value and the computed average, including the source rows feeding the average.
25. **Year-over-year change** ("up 9.3% from last year"). → Cite both year's values. Derivation is ratio.

### 4.6 Extraction method risk
26. **Human-read PDFs.** → Trust: high. `extraction: 'human_review'`.
27. **Plain-text PDF parse** (`pdftotext`). → Trust: high for native PDFs. `extraction: 'pdf_text'`.
28. **OCR'd PDFs** (image-only scans). → Trust: medium. `extraction: 'pdf_ocr'` + `verified_at` required.
29. **LLM-extracted values.** → **Not permitted as a sole source.** Allowed only as a first-pass that a human then verifies; recorded as `extraction: 'human_review'` with the LLM as a tool note.
30. **Regex-extracted from HTML.** → `extraction: 'regex'` + `verified_at`. Re-scrape validates the selector still matches.

### 4.7 Disagreeing sources
31. **Two sources with different values** (e.g. CEO salary: Pay Policy PDF £190k vs a newspaper reporting £205k). → Cite the primary (Pay Policy). Do not average. Do not publish the contested figure in the app; readers can check the primary themselves.
32. **Council corrects its own publication after scrape.** → On next scrape, re-verify against the new version; note the change in a changelog.

### 4.8 Missing data
33. **Field unavailable for a council.** → Do not impute, do not fall back to averages, do not substitute similar councils' values. Render "Not published by this council" with a link to the council's transparency page so the reader can verify absence.
34. **Partial data** (e.g. some budget categories filled, others not). → Show filled categories only. Don't show a total that includes assumed zeros.

### 4.9 User corrections
35. **Reader reports a wrong number.** → Already wired via the `open-feedback` event. Every report includes the current citation; triage decides whether the source is wrong, our extraction is wrong, or the reader is wrong.
36. **Council publishes an erratum.** → Treat as source update (case 4).

### 4.10 Edge cases in the data itself
37. **Framework agreements.** → Contract ceilings, not spend. Use only for discovery; don't render as annual spend. (The Bradford bug in detail.)
38. **Multi-authority precepts** (e.g. West Yorkshire Combined Authority precept inside Bradford's Band D). → Cite each precept separately with its issuing authority.
39. **Parish precepts** (district councils collect on behalf of town councils). → Separate citation per parish; aggregated to district totals with full provenance.
40. **Shared services** (e.g. Adur & Worthing run one council). → Cited on both councils' pages with a note explaining the shared-service arrangement.
41. **Services provided by upper-tier authority** (districts don't collect waste disposal; county does). → Don't attribute to the district.

### 4.11 Licensing / redistribution
42. **OGL licensing.** → All listed `.gov.uk` sources are OGL-compatible; we can re-host archives. Confirm per-source in a registry entry.
43. **Third-party publishers** (e.g. moderngov.co.uk hosts council democracy portals). → Hosting platform isn't `.gov.uk` but the publisher is. Treat as compliant if the publishing council is on `.gov.uk`.
44. **GrantNav / 360Giving federated.** → Only accept data where the publisher is a council. Reject aggregator-only records with no council-side publication.

### 4.12 Performance / operational
45. **Scrape-time snapshots are large.** → Private data repo already holds these; keep a rolling 3-year window; older snapshots live in Wayback Machine only.
46. **Scrape reliability** (site down during nightly scrape). → Retry; flag stale after N failures.
47. **Crawl politeness.** → Respect robots.txt, rate-limit, include contact in User-Agent. Already applied in link-check.

---

## 5. Applying the rule today — the v3 approach: keep data, show validation status

**Decision (Owen, 2026-04-21):** Nothing gets stripped. Instead, every field that fails the traceability rule today carries a visible "Data validation in progress" notice next to it. The number stays visible (so SEO / GEO content isn't gutted and the reader still gets directional signal) but the notice makes the verification state legible and points at the source document so the reader can spot-check themselves.

### 5.1 `DataValidationNotice` component (shared primitive)

One component, consistent wording, wired wherever an unverified field renders.

```tsx
<DataValidationNotice
  variant="in-progress"            // 'in-progress' | 'suspended' | 'editorial'
  title="Data validation in progress"
  body="Supplier values currently come from Contracts Finder, a .gov.uk register of contract awards (ceilings, not payments). We're rebuilding from each council's spending-over-£500 publication — the number below is the Contracts Finder figure and you can open the source to verify it there."
  sourceUrl={…}                    // optional, per context
  policyHref="/data-validation"    // always
/>
```

Appears on:
- Suppliers card (all 317 councils — entire `top_suppliers` section).
- Grants card, above the list, for the 304 councils without an allowlisted raw file. The 9 allowlisted councils get either no notice or a quieter "Sourced from 360Giving (council-published)" affirmation.
- `staff_fte` KPI — until its build path is traced (§2.5).
- Any `extraction: 'pdf_ocr' | 'regex'` value that hasn't been human-verified in the last N months (when Phase 4 ships).

### 5.2 Removed now (editorial that can't be sourced)

- `performance_kpis` RAG colour (the red/amber/green dot). Keep the metric, value, date. Replace the colour with a sourced comparator where one exists (e.g. "31% recycled — national average 43%").

### 5.3 Hero paragraph — keep, cite every number, label honestly

The hero paragraph carries SEO + GEO weight (2026 baseline). It stays. Treatment:
- Every number inside the paragraph becomes a `SourceAnnotation` click-through.
- Label the paragraph "Generated summary of the sourced facts below" so readers know the prose was template-assembled from the cited components.

### 5.4 Descriptive fields — keep verbatim + tooltip explainer

Cabinet `portfolio` strings, grant `purpose` strings, supplier categories, waste destination type labels, etc. Keep **only when verbatim** from the source page. Each one gets a tooltip:

> "Copied verbatim from [source name]. CivAccount does not summarise."

Where a field is paraphrased or LLM-summarised, rewrite to use the source's exact text or remove the field. Per-field audit required before Phase 4 closes.

### 5.5 Public source archive — `civaccount-source-archive`

New public repo that mirrors the private `civaccount-data/pdfs/` tree as an append-only archive of raw scraped documents. Readers can verify any citation without needing the private dataset. Every archive entry links back to its live source URL and records the `fetched` date.

README of that repo acknowledges automation: "These files were retrieved by automated scrapers. CivAccount samples and manually verifies values; any discrepancy between this archive and the live source should be reported."

### 5.6 `/data-validation` page

New route on the main app. Explains:
- The rule (reproduced from this plan).
- The process (scrape → archive → extract → human sample → render with citation).
- The source-archive repo link.
- A live status table: per field, what's verified, what's in progress, what's editorial.
- Link to `audit-provenance.mjs` output so the technical reader can run the audit themselves.

Linked from the site footer and from every `DataValidationNotice`.

---

## 6. Rollout (every step blocks on approval)

No phase starts until you say so. Each phase ends at a commit and an audit report; the next phase doesn't start until the audit is green.

**Phase 0 — v3 plan approved 2026-04-21.** Decisions locked.

**Phase 1 (this session) — Validation notices + editorial cleanups. No data stripped.**
- Build shared `DataValidationNotice` component.
- Wire into suppliers card (all 317 councils).
- Wire into grants card (visibly different tone for 304 unverified vs 9 verified).
- Wire into staff_fte display.
- Drop RAG colours from `performance_kpis`; keep number + period + sourced comparator.
- Hero paragraph: cite every number; label "Generated summary of the sourced facts below".
- Verbatim-tooltip on cabinet portfolios, grant purposes, waste labels.
- Build `/data-validation` page.
- Set up public `civaccount-source-archive` repo scaffold.
- Commit per milestone; verify in preview each time.

**Phase 2 — Type system + build gate.**
- Add `Citation` type.
- Add `renderable-fields.ts` manifest.
- Add `provenance-strict` validator (opt-in at first, via env flag).
- Output: scope report — for every (field × council), does a compliant citation exist today? What's missing?

**Phase 3 — Wire Category A citations (row-level CSV).**
- For each of the ~29 national-CSV-backed fields, add `Citation` with ONS code + column.
- Build a CSV-row resolver UI ("See row for [ONS code] in this CSV").
- Turn on `provenance-strict` for Category A fields.

**Phase 4 — Wire Category B citations (per-council PDFs).**
- Archive every already-scraped PDF to the public source-archive repo.
- Per field per council, record page number + extraction method + verified_at.
- Sample human-verify at least 5% of PDFs per release.
- Turn on `provenance-strict` for Category B fields.

**Phase 5 — Rebuild Category C (aggregates from payment ledgers).**
- Investigate `staff_fte` provenance (§2.5); either keep with real citations or remove.
- Scale the spending-CSV scrape from 30 councils to all 317. Bespoke per CMS; longest phase.
- Rebuild `top_suppliers` and `grant_payments` from the scraped ledgers.
- Each aggregate carries its full input-row list as derivation inputs.
- Turn on `provenance-strict` for Category C fields.
- At that point `DataValidationNotice` can be retired from the verified fields.

**Phase 6 — Continuous integrity.**
- Nightly audit (existing `audit-provenance.mjs` runs on schedule).
- Staleness indicators on rendered values.
- User-report flow feeds triage.
- Freshness promise in docs: "We re-verify every value on its source's publication cadence. We show a staleness badge when we're overdue."

---

## 7. Decisions locked 2026-04-21 (Owen)

1. **`top_suppliers`:** keep visible; show `DataValidationNotice` on the whole section.
2. **`grant_payments` for 304 unverified councils:** keep visible; show `DataValidationNotice`. The 9 verified get a quieter affirmation.
3. **`performance_kpis` RAG colours:** **drop** the coloured dot. Keep metric + value + date + sourced comparator (e.g. national average).
4. **Hero paragraph:** **keep** (SEO/GEO weight). Cite every number; label paragraph "Generated summary of the sourced facts below".
5. **`staff_fte`:** keep visible; show `DataValidationNotice` until the build path is traced.
6. **Descriptive fields:** keep verbatim; add tooltip "Copied verbatim from [source name]. CivAccount does not summarise." Per-field audit still required to confirm verbatim.
7. **Public archive repo (`civaccount-source-archive`):** yes, set up in Phase 1. Readme acknowledges automation and invites discrepancy reports.

---

## 8. Execution log

- `f059484` (2026-04-21) — Phase 0.5 one-shot: origin-based routing + silent-404 detection + one-off supplier review notice. Shipped before v3 decisions landed.
- `708578b` (private data) — Bradford silent-404 URL fix.
- `701201a` — v1 plan docs.
- **In progress:** Phase 1 milestones (this session).
