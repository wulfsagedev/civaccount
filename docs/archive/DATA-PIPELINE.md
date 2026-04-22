# Data pipeline — sourcing, verification, presentation

**Status: DRAFT for owner review. No further data or code changes until this is signed off.**

---

## Why this document exists

Today's Camden audit found 4 fabricated values that had been rendering to readers for months:

- `budget_gap` £118.5m — actual £10m (11.8× overstatement)
- `savings_target` £106.7m — actual £27.7m (3.85× overstatement)
- `councillor_allowances_detail` — 10 of 55 councillors, with £13,284 basic (actual is £16,084)
- `salary_bands` distribution — not traceable to Camden's Statement of Accounts

Kent had similar: `budget_gap` £81m (actual £48.9m), `savings_target` £96m (actual £61.5m), plus `savings_achieved £42m` and `total_savings_since_2011 £1bn` with no source.

**The pattern:** structural provenance (URL + year + fingerprint) was in place. What wasn't in place: a check that the rendered *value* matched the *document it pointed at*. The earlier CivAccount iteration seeded numbers from LLM research; subsequent "fixes" only touched fields that automated validators flagged. Scalar per-council values slipped through because there's no automated equivalent of the source-truth CSV validator for values that live in PDFs.

**This document fixes that systemically before we ship anything else.**

---

## 1. Principles (non-negotiable)

1. **Every rendered value must be independently verifiable by a member of the public.** No internal-only sources. No trust-us layer.
2. **Primary source = UK government publication.** GOV.UK, ONS, DEFRA, DfT, Ofsted, LGBCE, or a council's own `.gov.uk` domain. No news sites, aggregators, Wikipedia, or third parties for the *value*. News/LGC/tertiary sources are only acceptable to *cross-reference* a value against its primary source.
3. **Open-data formats preferred.** CSV / JSON / ODS / XLSX > PDF > HTML > screenshot. The easier a reader can re-derive the number, the better.
4. **If a value can't meet the above bar, it does not render.** Better to show less than to show wrong. The UI already has a `DataValidationNotice` pattern; fields that don't meet the bar either hide or render that notice.
5. **Stripping is acceptable.** If an audit finds a field we can't verify, we remove it. The `feat/field-source-years` schema makes this trivial — field_sources is optional per field.
6. **Any new data added after this date is provenance-first.** Source + extraction method + verification date are captured *before* the value lands in the data file. No LLM-generated numbers, ever.

---

## 2. Source tier classification

Every rendered value is assigned a tier. Lower number = higher quality.

### Tier 1 — GOV.UK bulk datasets (automated cross-check possible)

Examples: MHCLG RA Part 1/2, MHCLG Council Tax live tables, ONS population estimates, DEFRA ENV18, DfT RDC/RDL, Ofsted inspection data, LGBCE electoral data, MHCLG CoR capital.

- Format: CSV / ODS direct download
- Checksum: `parsed_csv_sha256` in `source-manifest.json`
- Verification: `source-truth` validator cross-checks every rendered value against the source cell on every CI run
- Current coverage: 12 budget categories, Band D (6 years), reserves, population, waste, recycling, roads (2 fields), Ofsted, councillor count, capital programme — **~25 fields per council**

### Tier 2 — Council's own open-data portal (CSV/JSON, machine-readable)

Examples: Camden Socrata (`opendata.camden.gov.uk`), 360Giving grant registers, Bradford datahub.

- Format: CSV / JSON / Socrata API
- Checksum: sha256 on the archived file in `pdfs/spending-csvs/<slug>/` or `pdfs/360giving/`
- Verification: `audit-north-star` confirms presence; aggregate derivations re-computed from the raw file
- Current coverage: `top_suppliers` (Camden, Bradford), `grant_payments` (10 allowlisted councils)

### Tier 3 — Council-published PDF, archived locally with sha256

Examples: Bradford Pay Policy 2025-26 (page 11 deep link), Bradford Statement of Accounts, Bradford MTFS, Bradford Statement of Councillors Earnings.

- Format: PDF with extracted text (pdfplumber / pdftotext)
- Checksum: sha256 recorded in `_meta.json`, referenced in `field_sources[k].sha256_at_access`
- Verification: manual pdftotext extraction cross-checked against rendered value; verification date recorded
- Current coverage: Bradford's 4 PDFs → 8 field_sources entries

### Tier 4 — Council-published document we can point at but haven't archived

Examples: Camden Pay Policy Statement (Cloudflare blocks automated fetch), Kent Budget Book 2025-26 PDF (bot-blocked via democracy.kent.gov.uk), live web pages (Cabinet listings).

- Format: URL that works in a human browser but not automated fetch
- Checksum: **not available**
- Verification: value extraction done manually at a point in time, recorded in `accessed` + `archive_exempt` flag (`cloudflare_blocked` / `bot_blocked` / `no_document_form` / `live_page`)
- Tolerated because: reader can still verify via browser, and the URL is a primary source
- Current coverage: Camden CE salary, allowance, MTFS figures; Kent Pay Policy, SoA, Budget Book

### Tier 5 — Primary value confirmed by secondary source (news, LGC, etc.)

Examples: Kent CE salary £223,979 confirmed by Kent Online (which quoted Kent's own disclosure); Camden 2025/26 salary £232,074 confirmed by LGC (which quoted Camden Pay Policy).

- Format: secondary source quotes the primary
- Checksum: not available
- Verification: cross-reference only — the *primary* source is still the one we point readers at. We never *rely* on the secondary for the value; we use it to confirm the primary's exact figure when direct extraction is blocked.
- Current coverage: Kent + Camden MTFS figures where the primary PDF is Cloudflare-blocked

### FORBIDDEN — never used for values

- LLM research / model-generated figures (the source of today's Camden £118.5m fabrication)
- Wikipedia as a primary source (tertiary only, as a pointer)
- Trade aggregators (TaxPayersAlliance, Glassdoor, TPA Rich List)
- Any news source that doesn't cite a primary UK-government source
- "Estimates based on size" / interpolation / model-derived values

---

## 3. Verification gate (every field, every commit)

Before any value lands on `main`, it must carry:

1. **`source_url`** — direct link to the primary publication
2. **`data_year`** — the fiscal / reporting year the source covers
3. **`tier`** — 1 through 5 per section 2
4. **`sha256_at_access`** — where Tier ≤ 3
5. **`archive_exempt`** reason — where Tier 4
6. **`extraction_method`** — how the value was obtained from the source (NEW field to add)
   - `csv_row` (which row, which column)
   - `pdf_page` (which page, what text)
   - `aggregate` (which filter, which sum)
   - `socrata_query` (which dataset, which query)
   - `manual_read` (for Tier 4/5, with accessed date)
7. **`cross_check_ref`** — optional secondary source confirming the value (Tier 5 requires this)
8. **`last_verified`** — ISO date the value was last confirmed against its source

If any of the above is missing → **the field does not render**. The UI shows `DataValidationNotice` or omits the card.

---

## 4. Presentation rules

### What the reader sees on every value

- Click the value → popover showing:
  - Source URL (clickable)
  - Source document title
  - Data year
  - **Tier badge** ("GOV.UK bulk", "Council open-data", "Archived PDF sha256:…", "Council PDF (bot-blocked but reader-accessible)", "Secondary-confirmed")
  - Extraction method in plain English ("Row for Camden in MHCLG RA 2025-26 Part 1, column TOTAL EDUCATION SERVICES")
  - Last verified date
  - sha256 prefix where applicable

- Tier 4/5 fields also display a small caveat icon inline: "Source reader-accessible but not archived locally" — clicking explains why (Cloudflare block, etc.)

### `/council/[slug]/provenance` page

- Every rendered field listed, grouped by tier
- Columns: field name, value, source URL, data year, tier badge, sha256 prefix, last-verified date
- A "trust summary" at the top: "X% of Camden's data is at Tier 1-3 (independently fingerprinted). Y% is at Tier 4 (reader-accessible but not archived). No Tier 5 or ungraded data is rendered."

### Hero paragraphs + AI summaries

- CivAccount summaries already carry a badge separating editorial from data (applied in prior PR)
- Hero paragraphs now allowed **only to narrate Tier 1-3 values** — never to extrapolate or make multi-year claims without each number carrying its own year

---

## 5. Stripping rules

Applied to every council systematically on first audit:

1. **Value is Tier 1-3** → ship with full provenance.
2. **Value is Tier 4** → ship with `archive_exempt` flag + caveat icon.
3. **Value is Tier 5** → ship only if secondary source is itself reputable and explicitly quotes a primary figure. Prefer upgrade to Tier 4 (find the primary URL) before accepting Tier 5.
4. **Value can't reach Tier 5** → **STRIP**. Field removed from data. AUDIT.md records what was removed and why.
5. **Value is an aggregate / derived figure** (supplier totals, grant sums) → only rendered if we have the raw Tier 2 file and can re-derive the aggregate. Otherwise `DataValidationNotice`.

### What this means today

If we apply this strictly to every council, the expected outcome is:

- **National fields (Tier 1, ~25 per council × 317 councils = 7,925 values):** keep. Already at standard.
- **Per-council fields** (~12-15 per council × 317 = 4-5k values):
  - Bradford: already at Tier 3 for most — keep
  - Camden + Kent: most at Tier 4 (reader-accessible but not archived) — keep with caveat
  - Other 314 councils: **many will need to be stripped** until we audit them at Tier 3 or Tier 4. Expect the per-council numeric cards (CE salary, allowances, MTFS) to disappear on unaudited councils, replaced by `DataValidationNotice`.
- **Editorial / CivAccount summaries:** keep, clearly labelled (already done)

---

## 6. Automation & CI gates

Additions needed to enforce this pipeline:

### Validators (fail CI if violated)

| Validator | What it checks | Status |
|-----------|----------------|--------|
| `source-truth` | Tier 1 values match source CSV cell | ✅ exists |
| `field-source-years` | Every field_sources entry has data_year | ✅ exists |
| `north-star-gate` | Bradford/Camden/Kent pass 5 structural criteria | ✅ exists |
| **`tier-classification`** | Every value declares a tier | 🔴 NEW |
| **`extraction-method-required`** | Every value declares how it was extracted | 🔴 NEW |
| **`forbidden-source-scan`** | No field_sources URL points at a forbidden domain (Wikipedia, Glassdoor, TPA, etc.) | 🔴 NEW |
| **`last-verified-freshness`** | No value's `last_verified` is older than N days | 🔴 NEW |

### Release watcher (cron)

- Daily: fetch every Tier 1 parsed CSV, compare sha256 to `source-manifest.json`. If changed, file GH issue.
- Weekly: fetch every Tier 3 archived PDF URL, compare content hash to `sha256_at_access`. If changed, flag for re-verification.
- Monthly: HTTP-check every Tier 4/5 URL for liveness; silent-404 detection.

### Value-correctness job

- New: `scripts/validate/value-regression-check.mjs` — for every value with a `cross_check_ref`, re-fetch and confirm the secondary still reports the same figure. Flags drift.

---

## 7. Workflow for auditing any council (new standard)

Replaces COUNCIL-AUDIT-PLAYBOOK.md phases 0-5 with tier-driven process:

### Phase A — Tier 1 coverage
Run `audit-council --council=X`. Every Tier 1 field (national CSVs) must PASS source-truth. Fix any drift.

### Phase B — Tier 2/3 discovery
For each per-council field: can we find a Tier 2 (open-data CSV/JSON) or Tier 3 (downloadable PDF)?
- If yes → archive, sha256, wire to `field_sources[k].sha256_at_access`.
- If no → continue to Phase C.

### Phase C — Tier 4 negotiation
For fields where only Tier 4 is possible (bot-blocked council site):
- Confirm the URL works in a human browser.
- Record `archive_exempt: "cloudflare_blocked" | "no_document_form"`.
- Manually extract the value; record extraction method; record `last_verified` date.

### Phase D — Tier 5 triage
If only a secondary source is available:
- Is the primary reachable? If so, **upgrade to Tier 4** (record the primary URL, manually verify, archive_exempt).
- If primary is permanently unavailable or doesn't exist → **STRIP the field**.

### Phase E — Stripping
Every field that didn't make Tier 1-5 → removed from data. Logged in the council's AUDIT.md.

### Phase F — Publish
- Run `audit-north-star --council=X` — must be 0/5 gaps
- Run `value-regression-check --council=X` — must be 0 drifts
- Update AUDIT.md
- Commit

---

## 8. What this means for Bradford / Camden / Kent today

| Council | Tier 1-3 coverage | Tier 4 coverage | Needs stripping? |
|---------|------------------|-----------------|------------------|
| Bradford | ~85% (4 PDFs archived + all national CSVs) | ~15% (Statement of Accounts salary_bands — SoA archived, but band extraction needs re-derivation) | None |
| Camden | ~65% (national CSVs + Socrata suppliers + 360Giving grants) | ~35% (CE salary, Cabinet, MTFS figures, allowance) | salary_bands (done), councillor_allowances_detail (done), total_allowances_cost (done) |
| Kent | ~70% (national CSVs + Feb 2025 Budget Report extracted via pdftotext) | ~30% (Cabinet live page, allowance scheme) | savings_achieved (done), total_savings_since_2011 (done) |

Bradford is the template. Camden and Kent as of 2026-04-22 are compliant with this pipeline after today's fixes.

### Other 314 councils — what happens when this pipeline applies

- All retain their Tier 1 fields (national CSVs) — same quality as today
- Per-council field_sources: most currently pass structural provenance but haven't had value-verification.
- Under this pipeline: those 314 councils would run Phase A first (likely fine), then on Phase B/C/D would find many fields that can't be placed at Tier 3/4/5. Those fields would be stripped.
- Expected outcome: CE salary, councillor allowance, MTFS, salary_bands, cabinet detail drop off most unaudited councils until their pay policy / MTFS / allowance scheme are archived locally.
- The `DataValidationNotice` pattern makes this a clear "we're working on it" message, not a fake gap.

---

## 9. The explicit ask

Before I touch any code:

1. **Do you agree with the 5-tier classification** (section 2)?
2. **Do you agree with the 8-field verification gate** (section 3) — including adding `tier` and `extraction_method` as required fields?
3. **Do you agree with the stripping rules** (section 5) — specifically, that applying this pipeline to the 314 unaudited councils will likely strip many per-council fields until each gets a full audit?
4. **What's your tolerance for Tier 4** (reader-accessible but not archived)? Some councils will never archive — Cloudflare blocks are permanent. Option: accept Tier 4 indefinitely with caveat icon. Option: require everything to eventually reach Tier 3. Option: hard gate, Tier 4 is shown for X months then stripped unless upgraded.
5. **Do you agree with the order of next steps below**?

### If signed off, next actions (in this order)

1. Add `tier` + `extraction_method` fields to the `field_sources` interface. Migrate existing entries (national CSVs → Tier 1, Socrata → Tier 2, Bradford PDFs → Tier 3, everything else on the 3 reference councils → Tier 4/5 as verified today). Adds ~2 hours of work.
2. Build the 4 new validators listed in section 6. ~3 hours.
3. Stripping pass on remaining 314 councils: run Phase A-E, commit mass-strip where needed. Expected to remove a large amount of data but leaves only verifiable fields on `main`. Could be 1-2 days of work depending on what passes Phase D.
4. Release-watcher cron + value-regression-check. ~1 day.
5. Public provenance page update showing tier badges per field.

Total: ~1 week of structured work. End state: every value on CivAccount has a verifiable primary source, a tier, an extraction method, and a last-verified date. Anything less has been stripped. The reader can audit any number on the site back to a `.gov.uk` publication.

### If you want changes to this pipeline before sign-off

Reply with specifics. I'll revise this doc and wait for agreement before doing anything else.

---

## Appendix — audit of today's failures against this pipeline

The fabrications I found today would all have been caught by the `forbidden-source-scan` validator and the tier-classification requirement:

- Camden `budget_gap £118.5m` and `savings_target £106.7m` had no `tier` (would fail validator) and no verifiable `source_url` pointing at a primary document with that figure (would fail `value-regression-check`).
- Camden `councillor_allowances_detail` (10 rows of 55) would have failed an aggregate sanity check: `total_allowances_cost ÷ basic_allowance ≈ 84 councillors` vs rendered 10 entries.
- Kent `savings_achieved £42m` and `total_savings_since_2011 £1bn` had no `source_url` at all.

None of these would survive under the new pipeline. The infrastructure to catch them is the point of this document.
