# Council audit playbook

**Status:** authored 2026-04-21 after the Bradford deep-verify pass (commit `4130b06` private data / `dd8a996` public).
**Purpose:** self-contained runbook. In a later session, pick any council, work through the phases below, land at the same integrity state as Bradford.
**Goal definition:** every numeric or named field rendered on a council's page either (a) passes an automated cross-check against a source row or cell, (b) has a page-level citation to an archived PDF, (c) is re-derived from cited inputs, or (d) is explicitly removed with a `_meta.json` recording why. Nothing renders without being in one of those four states.

---

## The rule (copy, non-negotiable)

> Every single number and named value on the app must trace back to a publicly-available `.gov.uk`, `ons.gov.uk`, or open-government document. In a maximum of a few clicks from any value, the reader must be able to open the document and identify the row, cell, or page the value came from.
>
> Zero hallucination. Zero estimation. Zero algorithmic gap-filling. Zero "reasonable guesses." If a value cannot satisfy the rule, it does not render.

Source: owner instruction 2026-04-21. Enforced at build time via `scripts/validate/validate.mjs`. Documented in [PROVENANCE-INTEGRITY-PLAN.md](PROVENANCE-INTEGRITY-PLAN.md) §1.

---

## Prerequisites (once per environment)

1. Checkout public repo `github.com/wulfsagedev/civaccount` branch `theme-toggle-system-option` (or successor).
2. Private data submodule `github.com/wulfsagedev/civaccount-data` at `src/data/councils/`.
3. `npm install` (Node 20+).
4. Python 3.9+ with `pypdf` and `pdfplumber`: `pip3 install --user pypdf pdfplumber`.
5. Working dev server: `npm run dev` (port 3000).
6. Dev preview (mcp__Claude_Preview or browser).
7. `git` authenticated for both repos.

---

## Data-year strictness (read before Phase 0)

Mixed data years across fields are expected and correct — council tax 2025-26, waste 2022-23, budget 2024-25, etc. — because each source has its own release cycle.

**What matters:** every rendered value carries its source's data year visibly, and our stored value matches the source for that stated year.

Before auditing a council, confirm no blanket year is being claimed on the page. The Bradford hero paragraph says "In 2025-26 … total service budget of £1.1 billion" — the budget is actually 2024-25 data. Flag that as a rendering bug, not a per-council bug.

Dataset-level year issues (a new national release has dropped, we haven't refreshed) are handled by the **roll-forward workflow** in [DATA-YEAR-POLICY.md](DATA-YEAR-POLICY.md). Run that workflow first when it applies; **don't audit individual councils against stale national data.**

Release cadences to watch:
- MHCLG council tax levels: March annually → **2026-27 levels likely already out; check before rollout**
- MHCLG RA Part 1 / 2 + CoR A1: November annually
- ONS mid-year population: June annually
- DEFRA ENV18 waste: December, two years lagged
- DfT RDC / RDL roads: March annually
- Per-council Pay Policy Statements: March-May
- Per-council Statement of Accounts: late autumn
- Per-council MTFS: November-February

Full table and the roll-forward workflow in [DATA-YEAR-POLICY.md](DATA-YEAR-POLICY.md).

---

## Phase 0 — pick a council, read the baseline

```
COUNCIL=<name>                 # e.g. "Bradford", "Kent", "Camden"
npm run validate               # full validator suite, including source-truth + provenance-strict
node scripts/validate/audit-council.mjs --council=$COUNCIL --verbose
```

Expected output per the Bradford reference run:
- A per-(field × council) table grouped by `PASS / FAIL / VERIFIED-SOURCE / CALCULATED / IN-PROGRESS / UNDER-REVIEW / MISSING / REMOVED`
- An integrity score (0-100%)
- A JSON report at `scripts/validate/reports/audit-<slug>.json`

**Definition of Phase 0 done:** you have a printed baseline for this council showing exact counts per status + the specific field names in each non-PASS bucket.

---

## Phase 0.5 — confirm the year labels match the source

For each rendered value on the council's page:
- Open its SourceAnnotation popover (tap the value).
- Confirm the `Data year:` shown matches what `scripts/validate/source-manifest.json` records for that field's dataset.

If the hero paragraph (`CouncilDashboard.tsx`) displays a blanket year ("In 2025-26 …") that covers numbers from multiple vintages, that's a **UI bug, not a council-level bug** — log in ISSUES-FOUND.md §Year-strictness and fix via the hero-template update before continuing the per-council audit.

If the source-manifest year is BEHIND the upstream publisher's latest release (e.g. our manifest says `data_year: "2025-26"` but MHCLG has shipped 2026-27), **stop Phase 0.5 and run the roll-forward workflow** in [DATA-YEAR-POLICY.md](DATA-YEAR-POLICY.md) first. Auditing councils against stale national data just produces churn — one dataset refresh propagates to all 317.

**Definition of Phase 0.5 done:** every year label on the council's page is either (a) exactly matches the latest publisher release we've archived, or (b) a known gap tracked in ISSUES-FOUND.md with a roll-forward ticket.

---

## Phase 1 — fix every FAIL (automated cross-check disagreements)

Every FAIL means the rendered value disagrees with its source CSV row outside the documented tolerance band.

Decision per FAIL:
- **Source value correct, our value wrong:** edit the TS data file to exact source value. Always. Zero tolerance for "close enough."
- **Both look correct but from different years:** pick the year the rest of that council's data is on, refresh to match. Record the year in a comment above the value.
- **Source has an obvious error** (redacted, "—", ONS-code mismatch): do not render our value from that source. Leave the field empty. Log in ISSUES-FOUND.md §D under council name.

**Bradford worked example (commit `4130b06`):**
- 12 budget categories were year-drifted against RA 2024-25. All 12 refreshed to exact source values.
- Recycling rate was 31% against DEFRA's 38.9%. Corrected.

Tools:
- `grep -i $COUNCIL src/data/councils/pdfs/gov-uk-bulk-data/parsed-*.csv` to find the source row per national-dataset field.
- `scripts/validate/reports/value-verification-latest.json` carries every (field, council, rendered, source, delta) triple.

**Phase 1 done when:** `node scripts/validate/audit-council.mjs --council=$COUNCIL` shows zero FAIL.

---

## Phase 2 — live-check every URL this council carries

```
# The live URL checker is general but currently councils are named
# in the script. If the council isn't Bradford, edit audit-bradford-sources.mjs
# (or parameterise — see Known Gaps §1 at the bottom).
node scripts/validate/audit-bradford-sources.mjs   # for Bradford
# For other councils: copy the script, rename, update the council-name lookup.
```

Extracts every URL the council carries in the dataset (top-level `*_url` fields, `field_sources`, `documents`, `open_data_links`, `governance_transparency`, `section_transparency`), GETs each one, flags hard 404s and silent-404s (200 that redirects to `/page-not-found/`).

Decision per broken URL:
- **Hard 404 / silent 404:** find the new canonical path on the council's site. If none exists, remove the URL from the dataset. Do not leave a broken link with a silent 404 — that was the original Bradford bug.
- **moderngov.co.uk 403 bot-block:** accepts real-browser traffic. If the page works in-browser, record the URL as "moderngov democracy portal — reader-accessible, crawler-blocked" in a comment. Do not flag as broken.
- **Redirect chain ending in a real page:** the target URL is the new canonical. Update to the final URL.

**Bradford worked example:** 3 broken URLs replaced (councillors_url → portfolio-holders page; 2021 census → Understanding Bradford District; schools → doubled-slug path).

**Phase 2 done when:** re-running the URL check shows 0 broken / 0 silent-404.

---

## Phase 3 — suppliers rebuild (Category C aggregates)

**The Contracts Finder data is structurally unsuitable** for annual supplier spend (contract ceilings, not payments). Every council's `top_suppliers` must be rebuilt from that council's own spending-over-£500 publication.

Steps:

1. **Find the council's payments-over-£500 page.** Usually at:
   - `<council>.gov.uk/your-council/council-budgets-and-spending/...`
   - `datahub.<council>.gov.uk/datasets/finance/...`
   - `opendata.<council>.gov.uk/...`

   If none published, mark `top_suppliers` as IMPOSSIBLE (see Phase 6).

2. **Download the quarterly/monthly CSVs** for the target fiscal year (4 files for a full year). Save to `src/data/councils/pdfs/spending-csvs/<council-slug>/Data_*.csv`.

3. **Write a `_meta.json` per file** with:
   ```json
   {
     "source_url": "<direct URL to the CSV>",
     "publisher": "<council name>",
     "fetched": "<YYYY-MM-DD>",
     "filename": "<filename>",
     "sha256": "<run `shasum -a 256 file | awk '{print $1}'`>",
     "licence": "Open Government Licence v3.0"
   }
   ```

4. **Adapt the parse script** — start from `src/data/councils/scripts/parse-bradford-payments.mjs`. What varies per council:
   - CSV column names (SupplierName, Net Amount, Expenditure Category — vary by CMS)
   - Date format
   - Redaction markers (some councils use "REDACTED", some "*", some blank)
   - Categorisation logic (Bradford used expenditure-category text + service-label fallback)

5. **Run the parser.** Review the top-20 by net spend output.
   - Net-negative suppliers (refund-only): drop.
   - Redacted / blank names: drop.
   - **Internal transfers** (council → own trust, e.g. Bradford Children's Trust, Birmingham Schools Finance): keep, but add a `description` flagging "wholly-owned entity / internal transfer."
   - **Statutory levies** (Combined Authority, Fire & Rescue): keep, add `description` flagging "statutory payment, not discretionary."

6. **Paste the generated TS block** into the council's `detailed.top_suppliers` array in `metropolitan.ts` / `unitary.ts` / etc.

7. **Add the council to** `src/data/suppliers-allowlist.ts`:
   ```ts
   <CouncilName>: {
     council: '<CouncilName>',
     sourceTitle: '<Council> payments-over-£500 (<N> quarterly CSVs, <YEAR>)',
     sourceUrl: '<datahub URL>',
     period: '<YEAR>',
   },
   ```

   The UI automatically switches from "Data validation in progress" notice to "Sourced from..." ShieldCheck affirmation once the council is on this list.

8. **Aggregation roundtrip check:** re-run the parse script, confirm top-20 net spend reproduces the TS entries exactly. If the TS has been hand-edited between run and commit, the roundtrip fails — regenerate.

**Bradford worked example:** 20-row supplier rebuild from 4 quarterly CSVs (28MB total). Turning Point corrected from Contracts Finder's £234m ceiling to actual £11.6m net spend — a 20× over-attribution caught.

**Phase 3 done when:** `top_suppliers` renders with the "Sourced from..." affirmation, top 20 match the re-run aggregation within £1, and raw CSVs + sha256 are archived.

---

## Phase 4 — grants rebuild (Category C aggregates, part 2)

Same pattern as suppliers but simpler: grants are usually published as a single annual register.

Steps:

1. **Find the grants register.** Usually at `datahub.<council>.gov.uk/datasets/finance/<council>-grants/` or `<council>.gov.uk/.../grants/`. For 360Giving publishers, also check GrantNav, but prefer the council's own page for provenance.

2. **Download the latest annual file.** Save to `src/data/councils/pdfs/grants-csvs/<council-slug>/`.

3. **Write `_meta.json`** (same shape as Phase 3 step 3).

4. **Adapt the parse script** — start from `src/data/councils/scripts/parse-bradford-grants.mjs`. Common column variants:
   - Recipient / Supplier / Grantee
   - Amount / Value / Estimated Annual Value
   - Total Contract Value + Grant Length (for multi-year grants — divide to annualise)
   - Purpose / Description

5. **Aggregate by recipient** (case-insensitive, whitespace-normalised). Take top 15 by annualised amount.

6. **Filter out:** zero-value rows, blank recipients, CIL grants (not discretionary), internal council-to-council transfers if obvious (flag with `description` if kept).

7. **Paste** the generated `grant_payments: [ ... ]` block into the council's `detailed` section.

8. **Add to** `src/data/grants-allowlist.ts`:
   ```ts
   <CouncilName>: {
     council: '<CouncilName>',
     sourceTitle: '<Council> Grants Register (<Year>)',
     sourceType: 'council-xlsx' | '360giving-csv' | '360giving-xlsx' | 'spending-csv',
     sourceUrl: '<direct URL>',
   },
   ```

**Bradford worked example:** 846 rows parsed from the Feb 2025 Grants Register, top 15 recipients replaced. Canal & River Trust £2.1m / Bradford Culture Company £2.3m rose from being absent entirely to being the top 2.

**Phase 4 done when:** grants renders with affirmation and top 15 match re-run aggregation.

---

## Phase 5 — per-council PDF fields (Category B)

Fields that live in council-published PDFs:
- `chief_executive_salary` + `chief_executive_total_remuneration` → **Pay Policy Statement** (annual)
- `councillor_basic_allowance` + `total_allowances_cost` + `councillor_allowances_detail` → **Statement of Councillors Earnings** (annual)
- `salary_bands` → **Statement of Accounts** (annual; Note 30 or similar)
- `budget_gap` + `savings_target` → **Medium Term Financial Strategy** (MTFS; usually Executive meeting doc)
- `reserves` → **Statement of Accounts** (Note 24 or similar) — national RA Part 2 also has a version; prefer SoA for accuracy
- `capital_programme` → council budget book + national CoR A1 (already cross-checked)

Steps for each PDF:

1. **Find the PDF URL.** Council's transparency / budgets page, or a moderngov democracy portal document.

2. **Download.** If direct fetch gets 403 (moderngov), fall back to Wayback Machine:
   ```
   curl -sSL "https://web.archive.org/web/<YEAR>/<PDF_URL>" -A "Mozilla/5.0" -o <file>.pdf
   ```
   Wayback's crawl policies generally allow our fetch.

3. **Archive** to `src/data/councils/pdfs/council-pdfs/<council-slug>/<document-name>.pdf`.

4. **Write `_meta.json`** with sha256, landing page URL, source URL, licence (OGL), and `fields_verified` / `fields_not_verified` keys documenting which field each page/section verifies.

5. **Extract the value** using `pypdf` (simple text) or `pdfplumber` (tables):
   ```python
   from pypdf import PdfReader      # simple text extraction
   import pdfplumber                # when the value is in a formatted table
   ```

6. **Compare to rendered value.** If mismatch, update the TS data to match the PDF exactly, record the page reference in a comment above the value.

7. **Wire the field_sources entry** to deep-link to the PDF `#page=N`:
   ```ts
   field_sources: {
     chief_executive_salary: {
       url: "https://<council>.gov.uk/media/<id>/pay-policy-2025-26.pdf#page=11",
       title: "Pay Policy Statement 2025-26 (page 11: CEO salary £217,479)",
       accessed: "YYYY-MM-DD",
     },
     ...
   }
   ```

**Bradford worked example (commit `4130b06`):**
- Pay Policy PDF archived (sha256 `545774…`); CEO salary £190k → £217,479 corrected (pdf page 11)
- MTFS PDF archived via Wayback (sha256 `2498627…`); budget_gap £124.9m → £120m, savings_target £112.4m → £40m
- Statement of Accounts archived (sha256 `afb85fa9…`); salary_bands total 271 → 876 corrected
- Councillors Earnings PDF archived (sha256 `2a72b676…`); 107 rows verified, total £2.126m → £1.767m corrected

**Phase 5 done when:** every Category B field has (a) a URL in `field_sources` that resolves, (b) an archived PDF with sha256, (c) a `_meta.json` naming the page that carries the value, and (d) the stored value matches the PDF within £1 / one person / one day.

---

## Phase 6 — explicitly mark the impossible

Not every field is verifiable. The rule is strict: if a value can't be traced to a public `.gov.uk`/ONS/opengov document, **it must not render with a plausible-looking source link**.

Typical impossible cases seen at Bradford:
- **`staff_fte`** — Bradford doesn't publish a total FTE on any page. SoA salary-band note covers £50k+ only; GPG report omits total headcount. → **Field removed entirely.** A `_meta.json` at `pdfs/council-pdfs/<council>/statement-of-accounts-<year>_meta.json` carries a `fields_not_verified.staff_fte` note recording why.
- **Supplier descriptions** — CivAccount-authored summaries, not from any council publication. → **Kept but visibly labelled** "CivAccount summary — not from council publication" in the expanded view.
- **Some cabinet portfolios** if paraphrased vs verbatim on the live page — run `audit-portfolio-verbatim.mjs` sample per council; if paraphrased, rewrite to verbatim or remove.

Decision matrix per impossible field:
- **Remove entirely** if the value carries no information the reader could verify (e.g. `staff_fte` 8,168 with no source).
- **Keep + label** if the value has reader value and the label makes the CivAccount-authored nature explicit (e.g. descriptions, summaries).
- **Keep + visible "under review" notice** only as a temporary state while actively working on a real source; set a deadline in `ISSUES-FOUND.md` §🔴 to avoid permanent drift.

**Phase 6 done when:** every field still rendering on the council page is either sourced, calculated, or visibly labelled as CivAccount-authored. Nothing has a pretending-to-be-sourced state.

---

## Phase 7 — re-run the audit, commit, push

```
# Full validator sweep
npm run validate

# Per-council audit
node scripts/validate/audit-council.mjs --council=$COUNCIL --verbose

# URL liveness
node scripts/validate/audit-bradford-sources.mjs   # or council-parameterised version

# Preview verification — open http://localhost:3000/council/<slug>, spot-check 3-5 values' popovers
npm run dev
```

Commit the private data repo first, then the public repo (if any UI tweaks were needed).

Standard commit message structure:
```
fix(<council>): deep-verify <N> fields against source PDFs

Errors caught and fixed:
  <field>: <old> → <new>  (source: <PDF page> / <CSV row>)
  ...

PDFs archived with sha256: <filename>.pdf (<sha256-prefix>)

Integrity: <before>% → <after>%.
```

**Phase 7 done when:** the per-council audit shows only PASS / VERIFIED-SOURCE / CALCULATED / REMOVED statuses. No IN-PROGRESS. UNDER-REVIEW is permissible only for CivAccount-authored surfaces that are visibly labelled.

---

## Field-by-field source catalogue

Quick reference. Every rendered field and where its source comes from.

### Category A — national CSVs (auto cross-checked by source-truth.mjs)

| Field | Source dataset | Row key |
|---|---|---|
| `council_tax.band_d_2021..2025` | MHCLG live tables on council tax | ONS |
| `budget.education..total_service` (12 fields) | MHCLG RA Part 1 2024-25 | ONS + column |
| `budget.net_current` | MHCLG RA Part 2 | ONS |
| `population` | ONS mid-2024 | ONS |
| `detailed.reserves` | MHCLG RA Part 2 (parsed-reserves) | ONS |
| `detailed.capital_programme` | MHCLG CoR A1 | ONS |
| `detailed.total_councillors` | LGBCE electoral data | ONS |
| `service_outcomes.waste.recycling_rate_percent` | DEFRA ENV18 2022-23 | name |
| `detailed.waste_destinations` | DEFRA ENV18 | name |
| `service_outcomes.roads.condition_good/poor_percent` | DfT RDC | name |
| `service_outcomes.roads.maintained_miles` | DfT RDL | name |
| `service_outcomes.children_services.ofsted_rating` | Ofsted inspection data | name |
| `service_outcomes.housing.homes_built` | MHCLG housing supply | ONS |

**Action:** none per-council — source-truth.mjs validates on every run.

### Category B — per-council PDFs (Phase 5)

| Field | Source document | How to extract |
|---|---|---|
| `detailed.chief_executive_salary` | Pay Policy Statement | pypdf text search for "Chief Executive" + £ |
| `detailed.chief_executive_total_remuneration` | Pay Policy Statement | Same PDF, often in a total-remuneration note |
| `detailed.chief_executive` (name) | Corporate Management Team page OR SoA senior employees note (p61-ish) | pypdf + name extraction |
| `detailed.council_leader` (name) | Portfolio-holders / cabinet page | HTML scrape |
| `detailed.cabinet` (array) | Portfolio-holders / cabinet page | HTML scrape with name + portfolio pairs |
| `detailed.salary_bands` (array) | Statement of Accounts "Officers' Remuneration (continued)" note | **pdfplumber** (table extract, handles interleaved rows) |
| `detailed.councillor_basic_allowance` | Members' Allowances Scheme OR Statement of Councillors Earnings (modal basic value) | pdfplumber |
| `detailed.total_allowances_cost` | Statement of Councillors Earnings (sum of Total column) | pdfplumber → sum |
| `detailed.councillor_allowances_detail` | Statement of Councillors Earnings (all rows) | pdfplumber → rows |
| `detailed.budget_gap` | Medium Term Financial Strategy | pypdf text search |
| `detailed.savings_target` | Medium Term Financial Strategy | Same PDF |
| `detailed.service_spending` (sub-categories) | Council budget book / revenue estimates | pdfplumber table extract |

### Category C — aggregates from ledgers (Phases 3 + 4)

| Field | Source | How |
|---|---|---|
| `detailed.top_suppliers` | Council's spending-over-£500 CSVs | Aggregate by SupplierName, sum net_amount, top 20 |
| `detailed.grant_payments` | Council's grants register | Aggregate by recipient, annualise, top 15 |

### Category D — calculated (no source needed, re-derived on every run)

| Field | Derivation | Validator |
|---|---|---|
| `tax_bands` (A-H) | Band D × statutory ratio (6/9, 7/9, 8/9, 1, 11/9, 13/9, 15/9, 18/9) | calculated-fields.mjs |
| `per_capita_spend` | `budget.total_service * 1000 / population` | calculated-fields.mjs |
| `per_capita_council_tax` | `council_tax_requirement / council_tax_base` | calculated-fields.mjs |
| `vs_average` | Council Band D − mean(Band D by type) | automatic |
| `council_tax_increase_percent` | `(band_d_2025 / band_d_2024 − 1) × 100` | calculated-fields.mjs |

### Category E — editorial / unverifiable (Phase 6)

| Field | Treatment |
|---|---|
| `top_suppliers.description` | Visibly labelled "CivAccount summary" |
| `grant_payments.purpose` | Keep if verbatim from source; delete if paraphrased |
| `cabinet.portfolio` | Keep if verbatim from live page; else rewrite to verbatim |
| `performance_kpis.status` (RAG colours) | **Removed entirely** (thresholds were CivAccount-invented with no statutory basis) |
| `staff_fte` | Remove if no citable source; keep only if a specific PDF page can be cited |

---

## Decision tree when stuck

1. **Is the value rendered on the site?** Check `renderable-fields.ts` manifest. If the path isn't there, add it — otherwise it can't be audited.

2. **Does a national CSV contain this value for this council?** (Check `scripts/validate/source-manifest.json`.) If yes → Category A → no extra work.

3. **Does the council publish the value on its own .gov.uk site?** If yes → is it in HTML or PDF?
   - HTML: direct scrape, add to `field_sources` with the URL.
   - PDF: archive with sha256, extract value, compare, update if wrong, add `#page=N` to field_sources.

4. **Is the value an aggregate over many source rows?** → Category C → spending-CSV or grants-register rebuild.

5. **Is the value calculated from other sourced values?** → Category D → just verify the derivation matches what calculated-fields.mjs re-computes.

6. **Is the value text written by CivAccount?** → Category E → either delete or make the authorship visible.

7. **Can none of the above apply?** → Remove the field. Record in `_meta.json` + `ISSUES-FOUND.md` why. Update `renderable-fields.ts` to reflect the removal.

---

## Known gaps in the current tooling (to fix before serious rollout)

Flagging so the next session doesn't rediscover them:

1. **`audit-bradford-sources.mjs` is hardcoded to Bradford.** Parameterise to `audit-council-sources.mjs --council=<name>` before running against other councils. Trivial change; just the council-name extraction regex needs to match by the `COUNCIL` arg.

2. **Parse scripts are Bradford-specific.** `parse-bradford-payments.mjs` and `parse-bradford-grants.mjs` hardcode file paths, CSV column names, and category heuristics. For reuse, generalise to take a council-slug arg and a config file per council (`configs/<slug>/spending-csv.json`, `configs/<slug>/grants-csv.json`) describing column names + redaction markers + categorisation rules.

3. **URL routing in `provenance.ts`** currently prefers `field_sources` > Contracts-Finder-override-for-suppliers > URL_ROUTING > global FIELD_PROVENANCE. When you add `field_sources` entries per council, the UI picks them up automatically. **No UI change needed per council.**

4. **Wayback Machine fallback** for moderngov PDFs is a manual step today. Automate with a retry: `if curl 403 → try https://web.archive.org/web/2025/<URL>`. Helper wrapper welcome.

5. **Pay Policy / MTFS / SoA URLs vary per council.** No central registry yet. Next session should build `src/data/council-source-registry.json` with `{ <ons_code>: { pay_policy_url, mtfs_url, soa_url, councillors_earnings_url, grants_register_url, spending_ledger_url_template } }`. That registry then drives all the parsers.

6. **`audit-council.mjs` regex for grants-allowlist** was fixed to match TS object-shorthand keys (`Bradford: {` as well as `'Bradford': {`). Similar fix is there for suppliers-allowlist. Keep both up to date as entries are added.

7. **`DataValidationNotice` currently shows for any council not on the allowlists.** As you add councils to `suppliers-allowlist.ts` / `grants-allowlist.ts`, the UI switches to "Sourced from..." automatically. No code change needed.

8. **`ISSUES-FOUND.md`** is a single flat document. Consider splitting per-council once you have >10 councils in-progress.

---

## Definition of "council audit complete"

A council's page is DONE when all of the following hold:

- [ ] `audit-council.mjs --council=<name>` reports zero FAIL.
- [ ] URL check reports zero broken / zero silent-404.
- [ ] Every `VERIFIED-SOURCE` field has an archived PDF with sha256 (or is a stable HTML page).
- [ ] Every archived PDF has a `_meta.json` recording fetched-date, source URL, licence, and which fields it verifies.
- [ ] `top_suppliers` is rebuilt from the council's own spending CSV + council is on `suppliers-allowlist.ts`, OR marked impossible with a reason.
- [ ] `grant_payments` is rebuilt from the council's own grants register + council is on `grants-allowlist.ts`, OR marked impossible.
- [ ] `staff_fte` either has a cited page or is removed.
- [ ] Every editorial surface (descriptions, generated prose, RAG colours) is visibly labelled as CivAccount-authored or removed.
- [ ] Preview verification: open 3-5 values' popovers at random; each must open a document where the value is visible within ~2 clicks.
- [ ] Commit + push.
- [ ] Update the per-council audit in an `AUDIT-<NAME>.md` at repo root (follow the `BRADFORD-AUDIT.md` template).

---

## Estimated effort per council

Based on Bradford (a 90-councillor metropolitan district with complex PDFs):
- Phase 0-2 (baseline, FAILs, URLs): 30-45 min if the data is roughly aligned to source years
- Phase 3-4 (suppliers + grants rebuild): 1-2 hours if the council publishes spending/grants CSVs; longer if you have to chase PDF sources
- Phase 5 (PDFs): 1-2 hours per council for the standard set (Pay Policy, SoA, MTFS, Councillors Earnings)
- Phase 6 (impossible decisions): 15-30 min
- Phase 7 (re-audit + commit + write-up): 30 min

**Total: ~4-6 hours per well-documented council, ~8-10 hours for a council with incomplete or buried source docs.**

317 councils × 6 hours average = ~1,900 hours of work. Not something for one session. Scale this by starting with councils that have rich open-data portals (metropolitan districts, London boroughs, major unitaries) and accept that district councils with weaker publishing will take longer.

---

## Companion documents

Read these alongside this playbook:

- [PROVENANCE-INTEGRITY-PLAN.md](PROVENANCE-INTEGRITY-PLAN.md) — the rule, architecture, edge cases.
- [VALUE-VERIFICATION-PLAN.md](VALUE-VERIFICATION-PLAN.md) — how source-truth.mjs cross-checks work.
- [DATA-YEAR-POLICY.md](DATA-YEAR-POLICY.md) — data-year rule, current state per dataset, roll-forward workflow when new releases drop.
- [BRADFORD-AUDIT.md](BRADFORD-AUDIT.md) — worked example of the finished state for one council.
- [ISSUES-FOUND.md](ISSUES-FOUND.md) — running log of data-accuracy questions across the dataset.
- [docs/PHASE-4-SCOPE.md](docs/PHASE-4-SCOPE.md) + [docs/PHASE-5-KICKOFF.md](docs/PHASE-5-KICKOFF.md) — original per-phase specs (slightly superseded by this playbook).
- [docs/SOURCE-ARCHIVE-REPO.md](docs/SOURCE-ARCHIVE-REPO.md) — the planned public source-archive repo.
- [CLAUDE.md](CLAUDE.md) — project-wide design system + data rules.
- [CLAUDE-SKILLS.md](CLAUDE-SKILLS.md) — Karpathy-style behavioural guidelines for working on this code.

---

## Inventory of tools built this session

Scripts available under `scripts/validate/`:

| Script | Purpose |
|---|---|
| `validate.mjs` | Full validator pipeline (ranges, cross-field, quality, completeness, spot-check, checksum, random-audit, source-truth, freshness, field-staleness, provenance-strict, calculated-fields). Run with `npm run validate`. |
| `audit-council.mjs --council=<name>` | Per-council field-by-field audit with integrity score. |
| `audit-provenance.mjs` | System-wide provenance audit. Every (field × council) → citation URL → live check. |
| `audit-bradford-sources.mjs` | Per-council URL liveness + silent-404 detector. (Parameterise before reusing.) |
| `audit-portfolio-verbatim.mjs` | Compare cabinet portfolio strings to live council page. |
| `validators/source-truth.mjs` | Cross-check every Category A value against source CSV row. Writes `reports/value-verification-latest.json`. |
| `validators/calculated-fields.mjs` | Re-derive every calculated field and assert match. |
| `validators/provenance-strict.mjs` | Enforce that every rendered value has a compliant citation. Writes coverage metric. |
| `validators/link-check.mjs` | Live-check every URL with silent-404 detection. Opt-in via `--link-check`. |

Scripts in the private data repo at `src/data/councils/scripts/`:

| Script | Purpose |
|---|---|
| `parse-bradford-payments.mjs` | Template for Phase 3 (suppliers rebuild). Copy per council. |
| `parse-bradford-grants.mjs` | Template for Phase 4 (grants rebuild). Copy per council. |

Components + registries:

| File | Purpose |
|---|---|
| `src/components/ui/data-validation-notice.tsx` | Shared "validation in progress" notice used by suppliers, grants, any unverified field. |
| `src/components/ui/source-annotation.tsx` | The popover that shows citation detail when a user taps a number. |
| `src/data/citations.ts` | Row-level citation resolver for Category A fields. |
| `src/data/provenance.ts` | Field → source URL routing. |
| `src/data/renderable-fields.ts` | Authoritative list of every field that renders. |
| `src/data/suppliers-allowlist.ts` | Councils with verified payment-ledger-sourced suppliers. |
| `src/data/grants-allowlist.ts` | Councils with verified grants-register-sourced grant_payments. |
| `src/app/data-validation/page.tsx` | Public-facing `/data-validation` explainer. |

---

## Final promise

If this playbook is followed in full for a council, the outcome is that a journalist, councillor, or resident opening that council's page can click any number, see its source, and independently verify it against a government publication within two clicks. Anything that can't stand up to that test doesn't render.

That's the integrity contract. Everything in this playbook is machinery to enforce it.
