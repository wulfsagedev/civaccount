# Provenance Integrity Plan

**Status:** Draft — written 2026-04-21 after the Bradford silent-404 incident.
**Owner:** Owen (hello@owenfisher.co — internal only, not for site).
**Principle:** Every number on every page must link back to the exact source row it was scraped from. Zero exceptions.

---

## 1. Why this plan exists

Two incidents exposed that the current provenance system is a promise we can't keep:

**Incident A — silent-404 source links.** Clicking the "Bradford transparency data" link in the Turning Point supplier popover redirected to `bradford.gov.uk/page-not-found/`. The popover said "Council source" confidently; the page said "Page not found" confidently. A reader can't verify. Root cause: `provenance.ts` routed nationally-sourced data (Contracts Finder) to a council's own landing page.

**Incident B — wrong numbers with confident attribution.** Bradford's supplier table shows Turning Point at £234m/year. Turning Point's entire UK turnover is £150m. Ranks 2-4 are identically £169,105,566. Ranks 7-20 are identically £144,019,716 — fourteen suppliers with pound-identical values. Root cause: the parsing pipeline attributes each framework agreement's full ceiling value to every supplier on the framework, then double-counts across contract-notice revisions.

Both incidents share the same deeper defect: **provenance is recorded at the field level, not the value level.** We say "suppliers come from Contracts Finder" (true in a loose sense) but we can't point at the specific contract-notice row that produced the £234,056,691 figure. When the number is wrong or the link dies, there's no way to repair from first principles — we can only rebuild the whole field.

The remedy is per-value provenance: every leaf number in the dataset carries a `__source` object naming the raw file, the row, and the scrape date. The UI deep-links to that row. CI refuses to build if any number lacks it.

---

## 2. Current architecture and its gaps

### What exists today

- `src/data/provenance.ts` — field-path → `DataProvenance` map, with origin-based routing for ~30 fields. Fixed in 2026-04-21 (commit `f059484`).
- `src/data/councils/**/*.ts` — compiled dataset. Most councils carry a `field_sources: { field_name: { url, title, accessed } }` block for ~5-6 council-specific fields (CEO salary, cabinet, allowances, salary bands, MTFS).
- `scripts/validate/source-manifest.json` — canonical registry of 15 national GOV.UK source files with SHA-256 checksums, update cadence, and `fields_validated` lists.
- `scripts/validate/audit-provenance.mjs` (new) — simulates `getProvenance()` per field × council, GET-checks every resolved URL, detects silent 404s via final-URL path patterns and body markers.

### What's missing

| Gap | Consequence |
|---|---|
| Per-value `__source` metadata | Can't deep-link `£234,056,691` to the specific OCDS award row. |
| Raw-row citations for aggregates | "£234m from 12 payments" should list all 12 rows with dates. Currently we show only the sum. |
| Source-file preservation | If Contracts Finder changes its URL or removes a notice, we can't show the reader what we *saw* at scrape time. |
| CI gate on provenance | A new field can ship without any source URL — or with a silent-404 URL — and nothing blocks it. |
| Derivation audit trail | `per_capita_spend = budget / population` — which budget? Which population? No trace. |
| Extraction-time verification | When we scrape a PDF for CEO salary, no one re-reads the PDF to confirm the value. |

---

## 3. The integrity contract

Every value rendered on civaccount.co.uk must satisfy all five of these, or it must not render:

1. **Origin-named.** The national-dataset ID (e.g. `revenue-outturn-2024-25`) OR the council-page URL is recorded on the value itself.
2. **Row-located.** For tabular data, the row index / CSV filename / OCID is recorded. For PDFs, the page number.
3. **Fetched-at dated.** ISO date the raw file was downloaded.
4. **Verifiable from source.** A reader can follow the recorded URL and find the same number (modulo row-level deep-linking where possible).
5. **Accurate.** The number matches the source — i.e. no pipeline aggregation bug has inflated or duplicated it.

The current dataset fails **(1)** partially, **(2)** everywhere, **(3)** partially, **(4)** for ~10% of (field × council) pairs (the audit's broken-link count), and **(5)** for supplier rows and almost-certainly some subset of others we haven't yet verified.

---

## 4. Architecture: per-value `__source`

### Type shape

Extend the `Council` model so every leaf value is wrapped with provenance metadata:

```ts
// Lives alongside the value, not replaces it.
// Fields that are leaf numbers keep a parallel `__source` entry with the
// same dotted key path. This keeps the render path unchanged — it just
// reads `supplier.annual_spend` — and lets SourceAnnotation look up
// `supplier.__source.annual_spend` to find the row-level citation.
interface ValueSource {
  // Which dataset did this come from?
  dataset_id: string;          // e.g. 'revenue-outturn-2024-25' | 'bradford-spending-2024-q3'
  // URL a reader can open to start verifying
  source_url: string;          // Direct link; deep-linked to row where possible
  // Where in the source file
  source_file?: string;        // Local path in the repo, if the raw file is archived
  row?: string | number;       // Row index, OCID, ONS code — whatever identifies the row
  column?: string;             // Column name when it disambiguates
  page?: number;               // PDF page
  // When
  fetched: string;             // ISO date of original scrape
  // Derivation (for computed / aggregated values)
  derivation?: 'direct' | 'sum' | 'max' | 'ratio' | 'difference' | 'filter';
  derivation_notes?: string;   // e.g. 'Sum of 12 payments with supplier="Turning Point"'
  source_rows?: Array<{        // For aggregates — the raw contributing rows
    row: string | number;
    amount?: number;
    date?: string;
  }>;
}
```

### How it surfaces in the UI

- Hover / tap a number → popover shows the source title and data year (unchanged from today).
- "See the source" button → opens the deep URL and, for aggregates, expands an inline list of the contributing rows with dates and amounts.
- For PDF sources → the link opens the PDF at the correct page via `#page=N` fragment.

### How it's enforced

- `src/data/councils.ts` `Council` interface gets a `__source` parallel tree (compile-time required for every known-leaf key).
- `npm run validate` (`scripts/validate/validate.mjs`) gains a `provenance-coverage` validator: for every rendered field, assert `__source` exists and passes audit-provenance.mjs. Missing or broken URL = build error.
- Deployment: Vercel build calls `npm run validate && npm run build`. Validation failure blocks the deploy.

---

## 5. The supplier data problem (specific fix)

### What's wrong

Contracts Finder OCDS is a **contract-award register**, not a payment ledger. Its `value.amount` is the contract ceiling — the maximum the council might spend over the full term, across all suppliers if it's a framework. That's structurally unsuitable for "who the council pays, annually."

The current pipeline (`scripts/parse-contracts-finder.py`) makes three compounding mistakes:

1. It treats the framework ceiling as the annual value per supplier (splits by term years only, not by supplier count).
2. It double-counts across revisions: the same framework's notice is re-published every few months with a new OCID; the parser sums all revisions instead of deduplicating by `related_process_id` or contract-period.
3. It runs the same logic for 2024 and 2025 Contracts Finder dumps and sums — so revisions that span both years count twice.

Together, a £180m five-year framework shared by 14 providers shows as £144m per supplier, per year.

### Fix

**Stop using Contracts Finder for "annual spend."** Use it only for discovery (which suppliers hold live contracts), not for magnitude. For actual spend amounts, use the council's own spending-over-£500 transparency publication.

Status of spending-CSV coverage as of 2026-04-21:
- 30 / 317 councils have a scraped spending CSV in `src/data/councils/pdfs/spending-csvs/`.
- The remaining 287 need their spending-over-£500 URL identified and scraped.

Two-stage rollout:
- **Phase 2a:** For the 30 covered councils, re-run supplier aggregation off the spending CSV (same source grants already use). Replace `top_suppliers` in those councils.
- **Phase 2b:** For the other 287, hide the "Who the council pays" section entirely. Replace with a DataGapNotice linking to that council's spending-over-£500 page (discovered via `scripts/discover-spending-csvs.py`). Do **not** show Contracts Finder-derived numbers.

Between Phase 2a and Phase 2b, the "Supplier values under review" notice that landed in `f059484` stays up as the honest interim state.

---

## 6. Per-field integrity status (current)

Quick triage of every rendered field. "Trust" = confidence the rendered value matches the source row.

| Field | Source | Trust | Issue |
|---|---|---|---|
| `council_tax.band_d_*` | MHCLG live-tables-on-council-tax | High | Source-truth validator compares each row exactly. |
| `budget.*` | GOV.UK RA Part 1 (2024-25) | High | Spot-check tolerance 0.10; spot-check validator runs in CI. |
| `budget.net_current`, `reserves` | GOV.UK RA Part 2 | High | Same. |
| `population` | ONS mid-2024 estimates | High | Exact-match CSV. |
| `detailed.reserves`, `detailed.capital_programme`, `detailed.salary_bands` | Council Statement of Accounts PDF | **Medium** | Scraped from PDFs; no per-row proof of the number on the page. |
| `detailed.chief_executive_salary`, `total_remuneration` | Council Pay Policy Statement PDF | **Medium** | Same — PDF scrape, no on-page verification artefact. |
| `detailed.cabinet`, `council_leader` | Council portfolio-holders page | **Medium** | Names go stale between election cycles; no re-check cadence below per-year. |
| `detailed.councillor_basic_allowance`, `councillor_allowances_detail`, `total_allowances_cost` | Members' Allowances Scheme (council) | **Medium** | PDF scrape. |
| `detailed.budget_gap`, `savings_target` | Medium Term Financial Strategy (council) | **Medium** | Bespoke PDF extraction per council. |
| `detailed.waste_destinations`, `service_outcomes.waste.recycling_rate_percent` | DEFRA ENV18 | High | Exact-match. |
| `service_outcomes.roads.*` | DfT RDC / RDL | High | Exact-match. |
| `service_outcomes.children_services.ofsted_rating` | Ofsted inspection data | High | Exact-match. |
| `service_outcomes.housing.homes_built` | MHCLG housing supply | High | Exact-match. |
| `detailed.total_councillors` | LGBCE electoral data | High | Exact-match. |
| `detailed.staff_fte` | ONS PSE reference (fixed 2026-04-21) | **Medium** | The ONS table is regional, not per-council — current per-council FTE may be a derivation we need to audit. |
| `detailed.top_suppliers.*` | Contracts Finder OCDS | **BROKEN** | See §5. Pipeline bug. |
| `detailed.grant_payments` | 360Giving + spending CSVs | **Medium** | Correct-ish for the ~30 councils with grant data scraped; aggregation matches source rows but no row-level citation. |
| `detailed.service_spending` | GOV.UK RA Part 1 (categorised) | **Medium** | Categories are derived aggregations of finer-grain rows. |
| Computed (tax bands, per-capita, vs-average) | Derived | High (logic) | Derivation notes missing from provenance. |

---

## 7. Rollout phases

Each phase ends at a commit + the audit run confirms coverage moved forward.

### Phase 1 — Silent-404 + routing hygiene (**done 2026-04-21**)
- Origin-based routing in `provenance.ts`.
- Silent-404 detection in link-check and audit-provenance.
- Bradford URLs unstuck; workforce national URL moved to ONS.
- Supplier values flagged in UI.
- Commits: `f059484` (public), `708578b` (data repo).

### Phase 2 — Kill the broken supplier pipeline
- Delete `top_suppliers` from the 287 uncovered councils. (This *removes numbers from the site*. Non-reversible without re-scraping — worth the trust gain.)
- For the 30 covered councils, re-derive `top_suppliers` from the scraped spending CSV.
- Replace `enrich-top-suppliers.py` with a spending-CSV-backed variant in the private repo. The old script gets a deprecation banner and is deleted after Phase 2a.
- UI: the interim "Supplier values under review" notice becomes a "Not yet published for this council" DataGapNotice for the 287.
- Exit criterion: `audit-provenance.mjs --fields=detailed.top_suppliers.annual_spend` shows 30 resolved, 287 not-present (no `_has.top_suppliers` flag).

### Phase 3 — Per-value `__source` for all numeric fields
- Extend the `Council` type with a parallel `__source` tree.
- Migrate one category at a time, in this order (cheapest first):
  1. Council tax (single CSV, per-ONS-code row index — trivial).
  2. Budget (RA_Part1 / RA_Part2 — row = ONS code, column = category).
  3. Service outcomes (DEFRA, DfT, Ofsted, LGBCE — same shape).
  4. Reserves, capital, salary bands (accounts PDF — add `page`).
  5. CEO salary, allowances (pay policy PDF).
  6. Cabinet (page URL + name-string location on page).
  7. Service spending and grants (aggregates — need `source_rows`).
  8. Suppliers (aggregates — Phase 2 output).
- Each migration ships behind a `CIVACCOUNT_ENFORCE_SOURCE=<field>` env flag that, when set, blocks render of values lacking `__source`. Rollout flag by flag.
- CI gains `validators/provenance-coverage.mjs` that tracks the % of rendered values with compliant `__source` and blocks PRs that drop the number.

### Phase 4 — Row-level UI
- `SourceAnnotation` gains an expanded state showing `source_rows` when an aggregate is clicked.
- For PDF sources, open at `#page=N`.
- "Copy permalink" action that includes the `__source` in the URL so anyone can verify without reconstructing the chain.
- If the source URL is broken (by the time of click), fall back to a Wayback Machine snapshot captured at `fetched`.

### Phase 5 — Continuous integrity
- Nightly cron: `audit-provenance.mjs` runs against live URLs; any new silent-404 → GitHub issue.
- Freshness: any source whose `fetched` is past its `next_expected_update` gets a "stale" badge on the relevant dashboard tile.
- User-facing "Report incorrect data" feedback is already wired (via the `open-feedback` CustomEvent in `source-annotation.tsx`). Route submissions to a triage queue tagged with the `__source` so corrections are actionable.

---

## 8. Edge cases to get right

| Edge case | Handling |
|---|---|
| **Framework agreements** (the Bradford bug) | Don't derive per-supplier spend from contract ceilings. Use payment ledgers. If a framework is referenced in a payment row, attribute to the actual payee, not to all framework members. |
| **Multi-source fields** (e.g. CEO salary: pay policy PDF vs LGA workforce return) | Pick one canonical per field; record it in `source-manifest.json`. Secondary sources annotate the primary, they don't compete. |
| **Retired source URLs** | On 404/silent-404 detection, the `__source.source_url` gets a Wayback Machine fallback URL generated from `fetched` date. UI link becomes "Archived copy (source page removed)." |
| **Bot-blocked sources** (moderngov 403s) | Those aren't broken for real users — they just reject our user-agent. Track separately as "verified by human, not by crawler." Don't show "broken" badge. |
| **Computed values** (per-capita, vs-average) | `derivation: 'ratio'` with `derivation_notes: 'budget.total_service / population'`. The popover explains the calculation and links to both component values' sources. |
| **Redacted data** (personal info in spending CSVs, e.g. "REDACTED") | Those rows are dropped at scrape time, not displayed. The aggregate's `source_rows` count excludes them; add `redacted_rows_excluded: N` so the number is reconcilable with the raw file. |
| **Council name mismatches** across sources | Single normalisation layer (`scripts/validate/lib/normalize.mjs`) keyed on ONS code, not name. Every source file gets an ONS-code column added at scrape time. |
| **Historical values** (2021-22 council tax) | Each historical series has its own `__source` entry per year, not one blanket "historical data" label. |
| **Per-row corrections from users** | Received via the feedback flow → human triage → either a `field_sources` override (if our data is wrong) or a source-truth annotation (if the council's own publication is what's wrong). |
| **PDF tables that re-flow** between years | Annual scrape validates structure before extracting; if columns moved, the run fails and flags for human review rather than guessing. |
| **Data that simply doesn't exist for a council** | Don't substitute a "reasonable" value — render a DataGapNotice with the council's transparency URL so the user can verify absence themselves. |

---

## 9. Non-goals

- **Real-time sourcing.** Council pages don't have stable APIs; we scrape on a cadence. The `fetched` date is the contract, not "live."
- **Reproducing entire PDFs in-browser.** Source links open the council's PDF; we don't re-host PDFs unless the source site takes one down (then the archived copy serves).
- **Resolving disagreements between official sources.** If MHCLG RA and the council's own accounts disagree on a number, we publish both and cite both. We don't arbitrate.

---

## 10. Open questions

- Do we deep-link to Wayback Machine by default, or only on source 404? (Current: only on failure — default to live so readers get current context.)
- Do we show the raw-source row count on every aggregate, or only on click? (Current proposal: only on click, to avoid clutter for Owen's primary 70+ mobile audience.)
- How long do we keep archived raw files in the private repo? (Proposal: rolling 3-year window; older snapshots live in Wayback only.)
- Who can submit corrections that auto-apply vs that sit in the triage queue? (Proposal: all submissions go through triage; there's no auto-apply path.)

---

## 11. Immediate next actions

Ordered. Top item is most concrete.

1. **Replace `top_suppliers` for the 287 uncovered councils with a DataGapNotice.** (No numbers is better than wrong numbers. Covered by Phase 2b.)
2. **Audit `detailed.staff_fte` values against the ONS PSE table** to confirm the per-council FTE is a defensible derivation, not a guess.
3. **Write `scripts/validate/validators/provenance-coverage.mjs`** that computes the percentage of rendered values with compliant `__source` and wires it into `npm run validate`.
4. **Spec the `ValueSource` type in `src/data/councils.ts`** and migrate `council_tax.band_d_*` as the proving-ground migration (trivial source — CSV row by ONS code).
5. **Extend `SourceAnnotation` to render `source_rows` for aggregates** when present. Initial implementation targeted at grants (aggregates are simple list of payments).
