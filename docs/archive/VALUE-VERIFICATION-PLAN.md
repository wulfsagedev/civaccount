# Value Verification Plan

**Purpose:** Systematically re-check every rendered value on civaccount.co.uk
against the raw government source file it was extracted from, and generate
a per-council per-field discrepancy report.

**Status:** Plan approved 2026-04-21. Execution in progress.

---

## The gap this plan fills

Provenance work (Phases 1-3) answered *"what source does this number cite?"*.
It did not answer *"does the rendered number actually match that source?"*.

We have a partial answer for one field family: `source-truth.mjs` exact-
matches all 5 Band D years × 317 councils against `parsed-area-band-d.csv`
(1,585 values — zero drift, confirmed). Every other field either relies on
spot-check (tolerance bands + sampling) or has no value check at all.

What the user expects (2026-04-21):
> "every single data point ... 100% traceable to the document you gathered it from ... even i can do spot checks and see evidence in a few clicks."

Citation metadata (Phase 3) lets a human do the spot-check. This plan
automates the same spot-check across the entire dataset on every release.

---

## Scope

Every `RenderableField` in `src/data/renderable-fields.ts` Category A and
calculated Category D gets a value-verification entry:

| Category | Fields | Verification method |
|---|---|---|
| A (national CSV) | 27 fields × 317 councils = ~8,500 values | Exact or tolerance-bounded CSV lookup keyed by ONS code |
| D (calculated) | 5 fields × 317 councils = ~1,500 values | Re-compute the derivation; match against rendered value |
| Total phase-1 coverage | ~10,000 values | Automated; runs on `npm run validate` |

Categories B (PDF), C (aggregate), E (under review) are out of scope here
— those are Phase 4/5 work because the source isn't a structured file we
can cell-lookup against. Their validation notice on the site is the
interim control.

---

## Verification rules per field

### Exact (zero tolerance)

Any field whose source is a structured row-keyed national CSV and whose
value is meant to be literally the cell:

- `council_tax.band_d_2021` … `band_d_2025` — already in `source-truth.mjs`.
- `detailed.total_councillors` — LGBCE integer, exact match.
- `service_outcomes.children_services.ofsted_rating` — string match.

### Tolerant within reason (document why)

Where rounding, unit conversion, or publisher revision cycles make exact
match unrealistic, use a documented tolerance:

- `population` — ±100 absolute (ONS estimates revised between preliminary/
  final publication; we store rounded to nearest hundred).
- `service_outcomes.roads.condition_good_percent` — ±0.5pp (DfT publishes
  to one decimal; we may round to integer).
- `service_outcomes.roads.maintained_miles` — ±0.5% (unit rounding).
- `service_outcomes.waste.recycling_rate_percent` — ±0.5pp.
- `budget.education`, `.transport`, etc. — ±0.10 relative (RA CSV stores
  in £thousands; we sometimes drop trailing decimals).
- `detailed.capital_programme` — ±0.05 relative.
- `detailed.reserves` — one-sided check (see below).

### Semantic checks (not value match)

- `detailed.reserves` vs `parsed-reserves.csv`: our value is
  general/unallocated reserves (from Statement of Accounts); the CSV is
  total usable reserves (RA Part 2). General is always ≤ total, so the
  check is `ours ≤ ref * 1.1`. Breach = impossible = error. Underflow <1%
  = likely unit error = warning.
- `detailed.chief_executive_salary`: already spot-check'd vs
  `parsed-ceo-salary.csv` in `spot-check.mjs`; our values come from
  current Pay Policy Statements and routinely differ from reference by
  60-100% (reference is stale). Keep as INFO, not error.

### Calculated fields

Recompute the derivation from sourced inputs, compare:

- `tax_bands` — Band D × statutory ratio (VOA multipliers 6/9 to 18/9).
- `per_capita_spend` — `budget.total_service * 1000 / population` (budget is £thousands).
- `per_capita_council_tax` — `council_tax_requirement / council_tax_base` (Band D equivalent dwellings).
- `vs_average` — `band_d_2025 - avg_band_d(type)`. Cross-check by recomputing from the same 317-council dataset.
- `council_tax_increase_percent` — `(band_d_2025 / band_d_2024 - 1) * 100`.

Tolerance for calc re-check: floating-point only (1e-6). Any drift
larger = rendered value has been overridden, which is a bug.

---

## Output

Running `npm run validate` produces:

1. Existing high-level summary (errors/warnings/info totals).
2. **New:** `scripts/validate/reports/value-verification-latest.json`
   — per (field, council) row with:
   ```json
   {
     "council": "Bradford",
     "ons_code": "E08000032",
     "field": "budget.education",
     "rendered_value": 376562.0,
     "source_value": 375840.0,
     "source_file": "gov-uk-ra-data/RA_Part1_LA_Data.csv",
     "tolerance": { "kind": "relative", "max": 0.10 },
     "delta_pct": 0.19,
     "status": "pass"
   }
   ```
   Every non-pass is surfaced as a validator finding and logged to
   ISSUES-FOUND.md.

---

## Execution phases

### VP1 — extend source-truth (this push)
- Add every Category A field to source-truth.mjs with its tolerance rule.
- Run; log all discrepancies to ISSUES-FOUND.md §D (new section).
- Fix any that are clearly one-off data errors (wrong ONS code mapping,
  obvious typo).
- Document those that need a decision (budget year-drift, CEO stale ref,
  etc.) in the open-questions section.

### VP2 — calculated-field verifier (this push)
- New `scripts/validate/validators/calculated-fields.mjs`.
- For each calculated field, recompute from inputs and compare.
- Add to validator pipeline.

### VP3 — per-value citation cross-link (future session)
- Wire every pass/fail result to the rendered Citation so the /data-validation
  page can show per-field status counts ("Budget.education: 315/317 match
  source; 2 flagged for review").

### VP4 — nightly automation (future)
- Schedule the full validator on a nightly cron.
- Any new discrepancy → GitHub issue with ISSUES-FOUND.md entry.
- Freshness: when a source file's `last_downloaded` is past its
  `next_expected_update`, re-scrape before the verifier runs.

---

## Non-goals

- Verifying PDF-extracted values without the raw PDF text. That's Phase 4.
- Verifying aggregates (suppliers/grants) without the payment ledger.
  That's Phase 5.
- Auto-correcting drift. Discrepancies get surfaced, not silently fixed;
  a human decides whether the source or our value is right.

---

## Edge cases

- **Dataset revision between scrape + publish.** MHCLG / ONS occasionally
  reissue a table. We compare against the version whose sha256 is recorded
  in `source-manifest.json`. If the live file has changed, checksum
  validator flags it first, then the verifier uses the cached/archived
  version.
- **Missing reference row** (council abolished, renamed, or the source
  file omits it for some reason). Verifier emits `info` not `warning`.
- **Stale reference** (CEO salary, Ofsted when the reference CSV is older
  than our enrichment). Explicit case in the tolerance rule; emits `info`.
- **Unit conversions** (budget £k → £m for display; population / 100).
  Rules record the conversion as part of the tolerance.
- **Ons-code drift** (District → UA reorganisations). Use the latest
  ONS-code mapping; archived source files keep their historical codes;
  verifier joins on effective-date.

---

## What "every single data point confirmed" means at the end of VP1+VP2

- ~8,500 Category A values cross-checked against source CSVs with
  published tolerance rules.
- ~1,500 calculated values re-derived from inputs.
- All ~3,000 Category B/C/E values carry `DataValidationNotice` on the
  live site (already shipped) so the reader knows which values are
  not yet in the automated cross-check.

Total: 100% of rendered values have *either* an automated pass result
*or* a visible "validation in progress" notice. No value on the site
is silently unverified.
