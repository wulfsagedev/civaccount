# Issues Found — 2026-04-21 overnight audit

Running log of every discrepancy, question, or blocker found while executing
the v3 provenance plan autonomously. Read this in the morning; each item
has an action suggestion.

**Baseline validator output:** 0 errors, 129 warnings, 9 info across 317
councils, 34,774 checks. 100% overall parity score. Exact-match
`source-truth` on council-tax Band D (all 5 years × 317 councils) passes
cleanly — that's the cleanest field family.

## 🔴 Blocking — decisions needed before I can continue

### B1. Spending CSV scrape for 287 councils is out of scope for this runway
Phase 5 of the plan requires scraping each council's own
spending-over-£500 publication to rebuild `top_suppliers` with real
payment data. Currently 30 / 317 councils have a scraped CSV. The
remaining 287 need bespoke per-CMS discovery + scrape. That's weeks of
work, not hours. **Interim state (landed):** validation notice on all
supplier sections. **Ask:** confirm Phase 5 stays out of this runway —
you already approved the v3 plan but calling it out explicitly.

### B2. `staff_fte` build path trace — dead end without you
`src/data/councils/pdfs/gov-uk-bulk-data/parsed-workforce.csv` exists
with per-council FTE (e.g. Bradford: 8168). **There is no parse script
in the repo that produces this CSV.** The raw ONS PSE dataset publishes
regional totals, not per-council. The validation notice next to
`staff_fte` is visible on the site as of b19c5c3. **Ask:** do you
remember where these came from? Two candidates: (a) compiled from each
council's Statement of Accounts employee note, or (b) LGA QPSES
published a per-council extract at some point that we pulled into this
CSV. Spot-check warnings say our values often differ from LGA reference
by ±50% because of schools staff inclusion differences — that's
consistent with option (a). If (a), we're probably OK and just need to
wire the PDF citations. If (b), we need to find the LGA source.

### B3. Cabinet portfolio verbatim vs paraphrased — AUDITED; decision needed

**Audit tool:** `scripts/validate/audit-portfolio-verbatim.mjs` (new,
landed this session). Fetches each council's `councillors_url`, strips
HTML, and checks each cabinet member's `portfolio` string for verbatim
substring match.

**Sample run (random 20 councils):**
- 10 / 20 fetched successfully (others: 403 moderngov, 404, 502)
- 66 members audited
- **1 verbatim (1.5%)**
- **65 paraphrased (98.5%)**

Portfolio strings as rendered (e.g. Bradford "Leader of Council and
corporate portfolio", Birmingham "Health, public health and place-based
wellbeing") do not appear verbatim on the councils' pages at
`councillors_url`.

**Two possible reasons — need to disambiguate before action:**

1. **Wrong page:** `councillors_url` for most councils points at a
   find-your-councillor page, which typically doesn't list portfolios.
   The portfolio text lives on a separate "cabinet" or "executive" page.
   If that's the case, the fix is: add a `cabinet_url` field per council
   and re-audit against *that* page.

2. **Genuine paraphrase:** the portfolios are LLM-summarised or
   otherwise rewritten and are not present verbatim on any council page.
   In that case, per the integrity rule, portfolios must be either
   re-sourced verbatim or removed.

**Proposed action:**
- Add `cabinet_url` field (where applicable) to the Council type.
- For 20 random councils, manually identify the cabinet page URL and
  fill in `cabinet_url`.
- Re-run audit restricted to those 20 councils against `cabinet_url`.
- If verbatim rate jumps to >80%: reason (1) — scale fix to all 317.
- If it stays low: reason (2) — plan removal / rewrite per v3 §5.4.

Report: `scripts/validate/reports/portfolio-audit-latest.json`

---

## 🟠 Data-accuracy warnings (from existing validators)

### A1. Councillor allowance register has more rows than councillor seats (92 councils)
- Example: Essex — allowances_detail has 93 entries, total_councillors is 75.
- **Explanation (probable):** allowance registers include outgoing/resigned councillors from the financial year, not just sitting members. So 75 seats + 18 former members = 93.
- **Action:** not a data error. Update the validator rule (or the UI copy) to acknowledge this. Alternatively, split the register visually into "current" and "former" members using `total_councillors` as the cut-off.
- **Files:** `scripts/validate/validators/cross-field.mjs`

### A2. `budget.total_service` drift vs RA 2025-26 reference (12 councils, >20% delta)
12 councils have budget figures that differ from the 2025-26 MHCLG
Revenue Account reference by more than 20%. Most likely cause: our
values are 2024-25 estimates; the reference was just updated to 2025-26.

- Dover: -62.6% (10577k vs 28274k) — **suspicious**, 62% is large
- East Cambridgeshire: -28.0%
- Gloucester: +53.8% — **suspicious**
- Guildford: +30.5%
- Lichfield: -24.0%
- Mid Suffolk: -25.2%
- South Cambridgeshire: -22.2%
- Surrey Heath: -28.2%
- West Lancashire: -40.9% — **suspicious**
- Woking: -28.0%
- City of London: -20.4%
- Havering: -21.0%

**Action:** re-pull RA Part 1 2025-26 CSV, refresh these 12 councils.
Gloucester, Dover, West Lancashire warrant a hand-check — those deltas
are too large to be year-over-year drift.

### A3. `ceo_salary` mismatch vs reference (8 councils)
Our values are 190-225k; reference is 86-117k. Our values are likely
current (from recent Pay Policy Statements); reference is stale (likely
pre-2020 compile). **Not an error in our data** — reference is out of
date. Action: replace or update the reference CSV, then re-run
validator.

- East Sussex, Kent, Brentwood, Bradford, Kirklees, Cheshire East, Portsmouth, Southend-on-Sea.

### A4. `total_councillors` disagrees with LGBCE (6 councils)
- Devon: 60 vs 61 (we're 1 short)
- Gloucestershire: 55 vs 53 (we're 2 over)
- Hertfordshire: 78 vs 80 (we're 2 short)
- Oxfordshire: 69 vs 49 (**we're 20 over — likely wrong, suspicious**)
- Staffordshire: 62 vs 69 (we're 7 short)
- Buckinghamshire: 97 vs 147 (**we're 50 short — likely unitary merger not reflected in LGBCE**)

**Action:** manual reconcile for Oxfordshire + Buckinghamshire. The ±2
councils are probably boundary review timing. Flag as info, not error.

### A5. `non_gov_url` on `councillors_url` for 4 councils
- Mid Sussex, Broadland, Broxbourne, Basildon — all point to moderngov.co.uk / basildonmeetings.info

**Explanation:** moderngov.co.uk is a third-party CMS where councils
host their democracy portal. Not `.gov.uk` domain, but the PUBLISHER is
the council. **Per your rule:** this is a grey area. The PAGE is
council data; the DOMAIN isn't .gov.uk. Recommendation: treat as
acceptable but flag in UI ("hosted on council's democracy portal").
Can also chase the council for a .gov.uk-rendered alternative.

### A6. `staff_fte` ±50% drift vs LGA reference (3 councils)
Hertfordshire, Lincolnshire, West Sussex — ours is 50% lower than LGA
QPSES reference. Validator notes this is probably schools-staff
inclusion difference.

**Related:** see B2 (staff_fte build path trace).

### A7. Supplier `annual_spend` exceeds £500m cap (2 Bolton suppliers)
- Bolton: 668,154,877 and 524,306,418 — both way too high for a single-council supplier
- These are the framework-agreement aggregation bug surfacing. Already covered by the validation notice shipped in 3728d91.
- **Action:** none for now; belongs in Phase 5 supplier rebuild.

### A8. `total_allowances_cost` ≠ sum of `councillor_allowances_detail` for 2 councils
- Nottinghamshire: sum £1.1m vs recorded £1.9m (42% delta)
- Bassetlaw: sum £345k vs recorded £691k (50% delta)

**Probable cause:** the recorded total is from a summary figure in the
council's publication; the detail list is the names we scraped — if
some councillors are missing from the detail, the sum undershoots.

**Action:** for these 2, prefer the summary figure and flag the detail
as incomplete.

### A9. `per_capita_spend` outliers
- Dover: £90/person — way too low. Paired with the budget.total_service
  issue (A2); likely the budget value is wrong.
- City of London: £18,919/person — correct-ish because City has ~9k
  residents but operates services for a huge daytime pop. Not an error
  but worth a footnote in the UI explaining the City is atypical.

### A10. Forest of Dean `staff_fte` = 9
Outside the 10-50000 expected range. Either the value is wrong, or FoD
really does have <10 FTE (extremely unlikely — they have hundreds of
staff). **Action:** verify + correct.

### A11. City of London `councillor_basic_allowance` = 0
City of London councillors (Common Councilmen) are unpaid by statute.
**Not an error** — value is correct. The validator rule needs an
exception for City of London.

### A12. Haringey Ofsted rating "Outstanding" vs reference "Good"
Reference inspected 2023-04-11. Our data says Outstanding. Either our
data is a more recent inspection (2024+) OR we've got it wrong.
**Action:** verify against current Ofsted publication.

### A13. ONS PSE workforce reference is critically stale
Last downloaded 2025-09-20, expected update 2025-12-20, 122 days
overdue. Re-download from the ONS URL we landed in the workforce fix.
**Action:** re-run the workforce scrape.

---

## 🟡 Questions for you

### Q1. Councillor allowance register scope
Do you want us to display the full allowance register (current + former
councillors, 92 councils affected) or just current councillors (matches
total_councillors)?

### Q2. moderngov.co.uk links
Accept as a legitimate hosting surface for council democracy data, or
chase .gov.uk alternatives?

### Q3. Budget data year
Our current budget values are a mix of 2024-25 and 2025-26. Do you
want us to standardise on 2024-25 actuals (RA settlement) or 2025-26
plans (RA estimates)? This affects provenance (different RA file).

### Q4. "Verified" bar for hero citations
The hero paragraph wraps population, Band D and total budget in
`SourceAnnotation`. These fields currently resolve through
`getProvenance()` to national CSVs. Do you want us to render a
"Verified" badge (shield icon) next to fields with full row-level
citations, to make the difference between "has source page" and "has
row-level citation" visible to the reader?

---

## 🔵 Value-verification cross-check (new VP1+VP2 run)

Source-truth validator now cross-checks every Category A field against
its national CSV source. Report:
`scripts/validate/reports/value-verification-latest.json`.

Final numbers after BCP fix:

- **Total checks:** 6,927 (field × council pairs with both rendered and source value)
- **Pass:** 5,251 (77.1%)
- **Fail:** 1,556
- **Skip:** 120 (no reference row; expected for SC councils on Band D)
- **Hard errors:** 0

### 🟢 Fields with exact or near-exact agreement (≥95% pass)

| Field | Pass rate | Notes |
|---|---|---|
| `council_tax.band_d_2025` | 100% (294/294) | Exact match, zero drift |
| `council_tax.band_d_2024` | 100% (294/294) | Exact |
| `council_tax.band_d_2023` | 100% (294/294) | Exact |
| `council_tax.band_d_2022` | 100% (290/290) | Exact |
| `council_tax.band_d_2021` | 100% (289/290) | Exact (1 fixed this run — see D1) |
| `detailed.total_councillors` | 98% (307/313) | 6 LGBCE disagreements; Oxfordshire and Buckinghamshire suspicious, already flagged in A4 |
| `service_outcomes.roads.condition_poor_percent` | 97% (139/143) | DfT RDC ±0.5pp |
| `detailed.capital_programme` | 95% (297/313) | CoR A1 ±5% |

### 🟡 Fields with moderate drift (60-92%)

| Field | Pass rate | Most likely cause |
|---|---|---|
| `service_outcomes.roads.maintained_miles` | 92% | DfT RDL ±0.5% |
| `budget.public_health` | 87% | RA ±10%; year-over-year variance |
| `population` | 85% | ONS revisions between preliminary and final publish |
| `budget.education` | 82% | Year-drift + tolerance |
| `service_outcomes.children_services.ofsted_rating` | 80% | 30 mismatches — reference CSV was last refreshed 2026-01-15, Ofsted re-inspects rolling; mostly stale reference (e.g. Haringey A12) |
| `budget.adult_social_care` | 79% | Year-drift |
| `service_outcomes.waste.recycling_rate_percent` | 77% | DEFRA 2022-23 ±2pp; recycling figures rounded differently between source and rendered |
| `budget.childrens_social_care` | 76% | Year-drift |
| `budget.total_service` | 76% | Year-drift |
| `budget.environmental` | 64% | |
| `budget.cultural` | 60% | |

### 🟠 Fields with significant drift (<60%) — triage required

All below are budget categories. Most likely year-drift (RA 2024-25 vs
our stored 2025-26) but some are probably definitional mismatches worth
hand-checking:

| Field | Pass rate | Likely cause |
|---|---|---|
| `budget.central_services` | 58% | Large councils allocate "central" broadly |
| `budget.other` | 56% | RA-catch-all; variance expected |
| `budget.transport` | 47% | County vs district split; shared-service arrangements |
| `budget.planning` | 36% | Small absolute values mean small £ differences register as large % |
| `budget.housing` | 33% | **Definitional:** HRA vs GFRA split. We may store the full housing budget; RA column is GFRA-only. Needs review. |

### 🔵 Calculated-fields validator warnings

307 `per_capita_spend_extreme` info-level findings (values outside
£50–£25,000/person window). Nearly all are small councils where the
budget is low and the denominator small; City of London is the
classic outlier (£18,919/person). Not errors — information only.

---

### D1. BCP Band D year-shift — CORRECTED this run

Bournemouth, Christchurch & Poole had Band D values shifted by one year:
- Our `band_d_2025` was 2157 (the actual 2024 figure); source says 2265.
- Every historical year was similarly shifted down by one.

**Fixed in-place** in `src/data/councils/unitary.ts`. `total_band_d`
updated to 2265, `council_tax_increase_percent` recomputed to 5.0%.

**Still outstanding:** BCP precept values (1639.55 + 283.41 + 83.04 =
2006.00) sum to £259 less than the corrected Band D (£2,265). The
precepts were scraped against an earlier year. Needs re-scrape from
BCP's 2025-26 council tax leaflet and `council_tax_shares` percentages
recomputed. Flagged in the data file.

---

## 🟢 Confirmed — no action needed

- `council_tax.band_d_*` (5 years × 317 councils) — all match
  `parsed-area-band-d.csv` exactly (source-truth validator 0 errors).
- Checksum validator — all 15 parsed CSVs match their recorded SHA-256.
- Field-staleness — all field `accessed` dates within cadence.
- Completeness — 100% on all council types (SC, SD, MD, UA, LB).

---

## Pipeline state as of this audit

- Public repo HEAD: `9f38451` (docs: source-archive repo README template)
- Private data repo HEAD: `708578b` (Bradford URL fix)
- Branch: `theme-toggle-system-option` (not pushed)
- Last validator run: baseline above
- Last provenance audit: 11,177/12,814 OK (as of pre-phase-2)
