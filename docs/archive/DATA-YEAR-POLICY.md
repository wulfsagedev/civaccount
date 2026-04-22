# Data year policy

**Added to the plan 2026-04-21 per owner instruction.**

Years in the data must reflect what the **source document** covers, not what is the current fiscal year. Different fields come from different datasets with different release cadences — **mixed vintages are expected and correct**. The contract is that every rendered value is visibly labelled with its own data year, and our stored value matches the source for that stated year.

---

## The rule

1. Every rendered value has a **data year** determined by the source it was extracted from.
2. That data year is **displayed next to the value** in the UI (SourceAnnotation popover already does this via `DataProvenance.data_year`).
3. When a newer release of a source drops, our stored value stays on the old year until we've downloaded, checksummed, parsed, and refreshed — no guessing / interpolating.
4. **A single "site year" does not exist.** It is wrong to claim "our data is 2025-26" because different fields come from different sources with different release cycles.

---

## Current data-year state (as of 2026-04-21)

Canonical per-field data year per the renderable-fields manifest + `source-manifest.json`.

| Field family | Current year | Source | Typical release month | Next release expected |
|---|---|---|---|---|
| `council_tax.band_d_2025` | 2025-26 | MHCLG live tables on council tax (Band D area) | March each year | 2026-27: **already released March 2026 — we may be stale** |
| `budget.*` (RA Part 1) | 2024-25 | MHCLG Revenue Account Part 1 | November each year | 2025-26 outturn: ~November 2026 |
| `budget.net_current` (RA Part 2) | 2024-25 | MHCLG Revenue Account Part 2 | November | ~November 2026 |
| `population` | mid-2024 | ONS mid-year population estimates | June annually | mid-2025: ~June 2026 |
| `detailed.waste_destinations` + recycling | 2022-23 | DEFRA ENV18 | December (for prior-prior year) | ENV18 2023-24: ~December 2025 (check if already published) |
| `service_outcomes.roads.*` | 2023 | DfT RDC / RDL | March | 2024 data: ~March 2025 (check) |
| `detailed.capital_programme` | 2024-25 | MHCLG CoR A1 | November | ~November 2026 |
| `service_outcomes.children_services.ofsted_rating` | continuous | Ofsted inspection data | rolling | per-council re-inspection dates |
| `detailed.total_councillors` | 2025 | LGBCE electoral data | as-needed | only on boundary changes |
| `detailed.staff_fte` | — | retired (no citable source) | — | stays removed until a source exists |
| `detailed.chief_executive_salary` | 2025-26 | council Pay Policy Statement (per council) | March-May | 2026-27: ~March-May 2026 (check) |
| `detailed.salary_bands` | 2024-25 | council Statement of Accounts | late Sept-Nov | SoA 2025-26: ~Sept-Nov 2026 |
| `detailed.budget_gap` + `savings_target` | 2025-26 MTFS | council MTFS PDF | Nov-Feb per council | MTFS 2026-27 to 2030-31: ~Nov 2025-Feb 2026 per council (check) |
| `detailed.councillor_allowances_detail` + total | 2024-25 | council Statement of Councillors Earnings | autumn | 2025-26: ~autumn 2026 |
| `detailed.top_suppliers` | 2024-25 | council payments-over-£500 CSVs | quarterly per council | 2025-26 quarters ongoing |
| `detailed.grant_payments` | per register date | council grants register | annual per council | varies |

---

## Things that may already be stale (2026-04-21 today)

Checklist — each of these should be investigated **before** rolling the audit out to more councils, because refreshing them is a one-time dataset update that propagates to every council:

- [ ] **Council Tax Band D 2026-27** — MHCLG publishes in March. April 2026 means the 2026-27 levels are probably available. Action: check `https://www.gov.uk/government/statistical-data-sets/live-tables-on-council-tax` for a 2026-27 table; if present, download, regenerate `parsed-area-band-d.csv`, update `source-manifest.json`, refresh all 317 councils' `council_tax.band_d_2026` field (adding the year), update the source-truth validator to include the new year.
- [ ] **ONS mid-2025 population** — June 2026 release. Check ONS. If out, refresh `parsed-population.csv`.
- [ ] **DfT RDC 2024 roads data** — March 2025 release. Should already be in hand; confirm `parsed-road-condition.csv` is on 2024 not 2023.
- [ ] **DEFRA ENV18 2023-24 waste data** — December 2025 release. Check if out. If so, refresh.
- [ ] **Pay Policy Statements 2026-27** per council — March-May 2026 releases. For any council we've audited, check for a newer PDF and re-archive.

All other datasets are on a cadence that makes April 2026 pre-release.

---

## Roll-forward workflow (when a new release drops)

When any dataset ships a new annual release, the process is:

1. **Check source URL for the new file.** E.g. MHCLG's council tax live-tables page lists every year. Identify the new file URL.

2. **Download the new raw file** into `src/data/councils/pdfs/gov-uk-bulk-data/` (or council-specific folder for per-council PDFs).

3. **Update `scripts/validate/source-manifest.json`** — new `raw_file`, `parsed_csv_sha256`, `last_downloaded`, `next_expected_update`, and crucially the `data_year` field.

4. **Regenerate the parsed CSV** by running the dataset's parser script (e.g. `python3 scripts/parse-area-band-d.py`). Parsers live in the private data repo's `scripts/` folder.

5. **Checksum update** — `npm run validate` will flag that the parsed CSV has changed. This is expected when a new release drops.

6. **Run `source-truth` validator.** Every rendered value for that dataset now compares against the NEW year. Expect a lot of FAIL results — that's the point: the data has moved on and we're catching the drift.

7. **For each FAIL council × field:**
   - If the TS file should stay on the old year (e.g. we want to keep showing 2024-25 until late in the fiscal year for familiarity): update `data_year` annotation next to the value AND update `renderable-fields.ts` / UI headers to match.
   - If the TS file should move to the new year: refresh the stored value to the new CSV row.
   - Record the decision in `ISSUES-FOUND.md` under the relevant dataset section.

8. **Update the FIELD_PROVENANCE map in `src/data/provenance.ts`** — `data_year` strings.

9. **Update `renderable-fields.ts`** data_year_source per field (once that field is added — see §Machinery below).

10. **Run `audit-council.mjs`** against 2-3 representative councils to spot-check the new state.

11. **Commit with clear title:** `refresh(<dataset>): <year> → <year>`. Private data commits land together with the refreshed TS values; public commits cover UI year-label changes if any.

---

## UI requirements

- Every numeric value rendered must have its data year visible within one interaction (the SourceAnnotation popover already achieves this via `data_year`).
- The hero paragraph must not claim a blanket year ("In 2025-26 …") for numbers that come from different years. Current Bradford hero: "In 2025-26, Band D council tax is £X. … total service budget of £1.1 billion" — the budget is 2024-25 data, not 2025-26. **This is a rendering bug to fix before rollout.** Either:
  - **(a)** Inline the budget year: "a total service budget of £1.1 billion (2024-25)", OR
  - **(b)** Move the hero to a single-year pivot (council tax only) and demote the budget line to a section below, OR
  - **(c)** Cross-field-year-lint the hero: only render a claim if all the numbers in it share a year.
- Recommendation: (a). Small copy change, keeps SEO, ends the misleading claim.
- Card headers ("Who the council pays — 2024-25", "Grants — 2022-23") already work this way. Keep them. They model the correct pattern.

---

## Machinery to add (next code session)

Not in this doc-only change, but queued for the next implementation pass:

1. **`renderable-fields.ts` — add `data_year_source` per Category A field.** Machine-readable canonical year per field.

2. **`source-truth` validator — check the UI's displayed year matches the source.** When a TS entry has `council_tax_increase_percent: 9.9` with an implicit 2024→2025 comparison but the UI header says "2023-24", that's a mismatch the validator should catch.

3. **Hero paragraph year-lint** — if multiple numbers appear in the hero, each must carry its own year OR the prose must avoid a blanket year claim.

4. **A release-watcher cron** — weekly poll of source URLs, compare last-modified / file size / checksum against `source-manifest.json`, notify when a dataset has a new release. Cheapest win for keeping the data fresh.

---

## Integration with COUNCIL-AUDIT-PLAYBOOK.md

Add a **Phase 0.5 — year-check** to the playbook, run before Phase 1:

> **0.5 — confirm data-year labels match source**
>
> For each rendered value on the council's page:
> - Open the SourceAnnotation popover (tap the value).
> - Confirm the `Data year:` shown matches what `source-manifest.json` records for the dataset.
> - If the hero paragraph displays a blanket year but mixes vintages, flag as a UI bug and log in ISSUES-FOUND.md §Year-strictness.
>
> Any mismatch found at Phase 0.5 is a **dataset-level** problem (affects all councils), not a per-council one. Fix via the roll-forward workflow above, then re-run Phase 0 for the council in question.

Then in Phase 5 (per-council PDFs), always record `fiscal_year` or `period` in the PDF's `_meta.json`, matching what the PDF cover page states. Never assume a different year.

---

## Expected state after the 2026-27 roll-forward

When MHCLG / ONS / DEFRA / DfT / CoR / Ofsted have all published 2026-27 (or their next cycle), and every council has published its 2026-27 Pay Policy / MTFS / SoA (expected by ~Nov 2026):

- `council_tax.band_d_2026` field added to the schema. The 5-year Band D series becomes 2022→2026.
- Budget, reserves, capital programme refresh to RA/CoR 2025-26 outturn (or 2026-27 estimates, depending on which MHCLG publishes).
- Population refreshes to mid-2025.
- Per-council PDFs re-scraped: each council's Pay Policy / MTFS / SoA moves up a year, each old PDF's `_meta.json` gains a `superseded_by` field pointing at the new archive path.
- Bradford's (and all audited councils') AUDIT-<NAME>.md is regenerated against the new data. Integrity scores reset; we expect most of the PASS bucket to remain PASS after refresh since our stored values match source CSV rows by construction.

---

## Non-goals

- **We do not try to render "this year's estimate" when the source only publishes actuals-for-prior-year.** The reader sees 2024-25 actuals because that's what MHCLG publishes. Guessing the current-year outturn would violate the integrity rule.
- **We do not force a single year across the dashboard.** Mixed vintages are honest.
- **We do not project / extrapolate / interpolate values to bridge gaps.** If DEFRA hasn't released 2024-25 waste data, we show 2023-24 with an explicit year label. We never model what the 2024-25 figure "probably is."

---

## Ownership

- **Dataset release monitoring** — automated watcher (to be built).
- **Parsed-CSV regeneration** — in the private data repo; each parser script is reusable across release years.
- **UI year-label maintenance** — when a new data_year lands in source-manifest.json, any hardcoded year strings in components (rare but present — e.g. `SuppliersGrantsCard` has "2024-25" in a header) must be updated too. Validator will help surface these in the next implementation pass.

---

## Summary for the next session

Two concrete actions before rolling out to new councils:

1. **Check whether 2026-27 council tax levels are already published by MHCLG.** If yes, trigger the roll-forward workflow. One dataset update = 317 councils refreshed = every council's Band D card becomes accurate-for-current-year.

2. **Fix Bradford's hero paragraph** (and apply to all councils via the shared template) to stop implying the budget total is 2025-26 data when it's 2024-25. Inline the year per number. Small wording change, significant trust improvement.

Then proceed with the playbook.
