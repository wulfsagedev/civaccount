# CivAccount — Per-council research progress

**Sessions:** open this file first. It tells you where every council sits
in the North-Star pipeline. For detail on a specific council, open that
council's `status/<slug>.json` or `<COUNCIL>-AUDIT.md` (in the data repo).

Pipeline phases are defined in [`/NORTH-STAR.md`](../NORTH-STAR.md) §6.
**Step-by-step operational guide: [`/COUNCIL-ROLLOUT-PLAYBOOK.md`](../COUNCIL-ROLLOUT-PLAYBOOK.md).**

---

## Reference councils (gatekeepers)

All three must be North-Star complete (§19) before bulk rollout begins.

| Council | Type | Status | Phase | Last touched | Notes |
|---------|------|--------|-------|--------------|-------|
| **Bradford** | MD | 🟢 **North-Star complete (v1.1 strict)** | All phases 0-7 ✓ **+ Phase 5b ✓ + derivation-strip ✓** | 2026-04-22 | First fully-compliant reference council. 4 PDFs archived + sha256'd + 7 page-image PNGs + full Datasheet-for-Datasets audit + manifests/bradford.json. 0/5 north-star gaps. 0 tier-classification errors. **0 UX-audit violations + 0 derived/comparator values** — every single rendered number appears verbatim in a linkable public document. Stripped data: performance_kpis, service_outcomes.housing, service_outcomes.population_served, service_spending (sub-category amounts). Stripped UI: vs-average comparators, YoY change deltas, 5-year change, per-capita comparator, 2 FAQ blocks. Fixed: stale population (546,200 → 563,605). Tax bands A-H kept as statutory calc per Council Tax Act 1992 s.5. |
| **Kent** | SC | 🟢 **North-Star complete (v1.1 strict)** | All phases 0-7 ✓ **+ Phase 5b ✓ + derivation-strip ✓** | 2026-04-22 | Second fully-compliant reference council and the first where archival had to route entirely through Internet Archive Wayback (every kent.gov.uk + democracy.kent.gov.uk URL returns 403 on direct fetch). 5 Tier-3 PDFs archived via Wayback (Feb 2025 Draft Revenue Budget + MTFP, audited SoA 2023-24, draft SoA, Pay Policy 2025-26, Members' Allowances 2025-26) + 7 page-image PNGs + full Datasheet-for-Datasets audit + manifests/kent.json. **0/5 north-star gaps. 0 UX-audit violations (0 unwrapped + 0 derived).** Stripped: chief_executive_salary (no archived Kent source), staff_fte, total_allowances_cost, councillor_allowances_detail (2024-25 PDF IA-blocked), council_tax_shares (duplicate w/ derived %), service_spending (Budget Book IA-blocked), top_suppliers (invoices CSVs IA-blocked), salary_bands, grant_payments, performance_kpis, waste_destinations, service_outcomes.*, cabinet[] reduced to Leader-only (reshuffle drift; live link surfaces full). Fixed: revenue_budget 2,274m→1,530.9m (wrong source), council_tax_requirement 994,287,655→994,287,650 (PDF Table 6.2), reserves 85m→43m (PDF §1.12), population 1,589,100→1,639,029 (Tier 1 drift). |
| **Camden** | LB | 🟢 **North-Star complete (v1.1 strict)** | All phases 0-7 ✓ **+ Phase 5b ✓ + derivation-strip ✓** | 2026-04-22 | Third fully-compliant reference council and the first London Borough. 4 Tier-3 PDFs archived via Wayback (camden.moderngov.co.uk is IA-crawlable even though www.camden.gov.uk blocks). 5 page-image PNGs + full Datasheet-for-Datasets audit + manifests/camden.json. **0/5 north-star gaps. 0 UX-audit violations.** Stripped: chief_executive_salary (was Jenny Rowlands 2024-25, not current CE Jon Rowney), staff_fte, total_allowances_cost, councillor_allowances_detail, council_tax_shares, service_spending, top_suppliers, grant_payments (Socrata query snapshots not yet archived), salary_bands, performance_kpis, waste_destinations, service_outcomes.*. Fixed: reserves 125.7m→17m (General Fund per §2.73), population 218,400→216,943 (Tier 1 drift). |

## All other councils (314)

**Status: not yet attempted under North-Star methodology.**

Values currently rendered are a mixture:
- Tier 1 (national CSVs) — valid and automatically cross-checked
- Per-council values — legacy, mostly unaudited, likely some fabrication (see Camden + Kent corrections)

**Policy until audited:** current values remain but validators mark them for review. The `DataValidationNotice` pattern appears on cards where provenance gaps exist.

---

## What "Phase X" means for this table

| Phase | State |
|-------|-------|
| Phase 0 | Inventory of publications built |
| Phase 1 | All documents archived with sha256 + Wayback |
| Phase 2 | Values extracted from archived documents |
| Phase 3 | Cross-checked (Benford / YoY / sum / multi-source) |
| Phase 4 | Data file populated |
| Phase 5 | All CI validators pass |
| Phase 6 | `<COUNCIL>-AUDIT.md` (with Datasheet) written |
| Phase 7 | PR merged |

A council is **North-Star complete** when all 7 phases = ✓ AND `status/<slug>.json.north_star_gaps == 0` AND `integrity_score == 100`.

---

## Global counters
<!-- counters as of 2026-04-26 after batches 24-27 -->

- Councils in scope: 317
- **Councils North-Star complete: 139**
  - Reference (3): Bradford, Kent, Camden
  - Batch-4-7 (19): Manchester, Birmingham, Leeds, Surrey, Cornwall, Liverpool, Bristol, Lancashire, Tower Hamlets, Hampshire, Essex, Hertfordshire, Sheffield, Westminster, Nottinghamshire, Staffordshire, Wiltshire, Newcastle upon Tyne, Croydon
  - Batch-8-10 (16): Norfolk, West Sussex, Derbyshire, Lincolnshire, Suffolk, Leicestershire, Cambridgeshire, Gloucestershire, Worcestershire, North Yorkshire, Devon, East Sussex, Oxfordshire, Wakefield, Doncaster, Coventry
  - Batch-9b (12 MDs): Bolton, Salford, Wirral, Sandwell, Sefton, Stockport, Wolverhampton, Barnsley, Solihull, St Helens, Dudley, Oldham
  - Batch-11 (4 UAs): York, Plymouth, Portsmouth, Luton
  - Batch-12 (4 LBs): Hillingdon, Bromley, Bexley, Greenwich
  - Batch-13 (4 LBs): Lambeth, Wandsworth, Newham, Hounslow
  - Batch-14 (4 UAs): Brighton & Hove, Reading, Stoke-on-Trent, Telford & Wrekin
  - Batch-15 (4 LBs): Southwark, Barnet, Haringey, Merton
  - Batch-16 (4 UAs): Cheshire East, Cheshire West & Chester, Buckinghamshire, Bedford
  - Batch-17 (4 LBs): Kingston upon Thames, Kensington & Chelsea, Redbridge, Waltham Forest
  - Batch-18 (4 UAs): Bath & North East Somerset, Halton, Bracknell Forest, Wokingham
  - Batch-19 (3 LBs): Barking & Dagenham, Brent, Ealing
  - Batch-20 (4 UAs): Cumberland, Hartlepool, Middlesbrough, Redcar & Cleveland
  - Batch-21 (4 UAs): Westmorland and Furness, North Lincolnshire, North East Lincolnshire, East Riding of Yorkshire
  - Batch-22 (3 UAs): Medway Towns, Milton Keynes, Swindon
  - Batch-23 (2 UAs): Darlington, Thurrock
  - Batch-24 (3 UAs): Derby, Leicester, Nottingham
  - Batch-25 (3 UAs): North Somerset, West Berkshire, Shropshire
  - Batch-26 (1 UA): Torbay
  - Batch-27 (7 mixed) — **Cloudflare-bypass via Wayback /save/**: Bournemouth Christchurch & Poole, Lewisham, Islington, Havering, Isle of Wight, Central Bedfordshire, Windsor & Maidenhead
  - Batch-28 (7 MDs) — **direct + Wayback bypass**: Bury, Kirklees, North Tyneside, Rochdale, Wigan, Rotherham, Walsall
  - Batch-29 (6 mixed) — direct fetch: Durham (UA), Northumberland (UA), Harrow (LB), Knowsley (MD), Sutton (LB), Richmond upon Thames (LB)
  - Batch-30 (7 mixed) — first districts: Blackpool (UA), East Hampshire (SD), St Albans (SD), West Lindsey (SD), Pendle (SD), Blaby (SD), Erewash (SD)
  - Batch-31 (7 SDs): Broxtowe, Stroud, Runnymede, West Oxfordshire, South Kesteven, South Oxfordshire, Epping Forest
- Councils in progress: 0
- Councils not yet started: 178

**Batch-27 (2026-04-26) — Cloudflare-bypass via Wayback /save/:**
- The Wayback Machine `/save/` endpoint forces a fresh archive on demand. Because the Internet Archive's crawler IPs are allowlisted by most CDNs (Cloudflare, Azure WAF, etc.), the resulting redirect serves the snapshot directly — bypassing the WAF block that defeats `curl` from a regular IP.
- Built `scripts/council-research/lib/robust-fetch.mjs` — multi-strategy fallback: direct curl → wayback existing snapshot → wayback /save/ → wayback /save/ with availability-API polling (for slow archives).
- Worked first try on 7/14 attempted: BCP, Lewisham, Islington, Havering, Isle of Wight, Central Bedfordshire, Windsor & Maidenhead.
- 7 councils still pending Wayback indexing (Peterborough, Stockton-on-Tees, South Gloucestershire, Warrington, Slough, Somerset, West Northamptonshire) — saves triggered but availability API hasn't returned a snapshot yet. Will retry next batch.
- Council-name corrections caught: Central Bedfordshire (Marcel Sherwood → Marcel Coiffait — verbatim), Windsor & Maidenhead (Elizabeth Frehiwot → Stephen Evans — verbatim), BCP CE name updated to verbatim "G Farrant" (was "Graham Farrant" — same person, abbreviated form per SoA Note 26).
- Salary corrections: Lewisham £231k → £198,288 (verbatim), Havering £196,755 → £201,672 (verbatim), Islington £185k → £190,032 (verbatim), Central Beds £185,725 → £201,010 (verbatim), W&M £204,117 → £198,000 (verbatim, in £000s), IoW (CE name stripped — only "Chief Executive" labelled in SoA) salary £148,484 (verbatim).
- Common strips: same Bradford strip-list applied via `scripts/council-research/batch-27-strip.mjs` (10 block fields × 7 councils + scalars).

---

## Next action

Per [`/ROADMAP.md`](../ROADMAP.md):

1. **Phase B**: flesh out the research toolkit scripts so they actually work
2. **Phase C**: Bradford end-to-end through new pipeline → first North-Star council
3. **Phase D**: Camden + Kent through new pipeline (apply the Bradford strip-list below)
4. **Phase F**: assess readiness for bulk rollout across 314 others

---

## Reference: what got stripped from Bradford (expected for every council)

Future councils are expected to need the **same strips**. Before marking a council as "North-Star complete", verify these fields are either absent from the council's data record OR the UI component has the rendering disabled. Cross-check against [`/COUNCIL-ROLLOUT-PLAYBOOK.md`](../COUNCIL-ROLLOUT-PLAYBOOK.md) Phase 3.

### Data-level strips (per-council `Council.detailed`)

These fields should be **absent** on a North-Star-compliant council unless the council publishes the specific values in a document we've archived with page-level provenance:

| Path | Why stripped on Bradford | What to do for new council |
| ---- | ------------------------ | -------------------------- |
| `performance_kpis` | Mix of duplicates + unsourced (CQC, collection rate, housing delivery) + one direct contradiction with Tier 1 (96% rd vs 93%) | Strip the whole array. Individual values it held already appear in other cards with proper provenance. |
| `service_outcomes.housing.homes_built / homes_target / delivery_percent` | No Tier 1 dataset for these in our source-manifest | Strip until MHCLG housing supply dataset is added (ROADMAP Phase E) |
| `service_outcomes.population_served` | Dupes top-level `population` + holds a different year's value | **Always strip** — always a dupe |
| `service_outcomes.libraries` (if present) | LLM-researched, no Tier 1 | Strip |
| `service_outcomes.adult_social_care.cqc_rating` (if present) | CQC not in our Tier 1 manifest | Strip until CQC dataset added |
| `service_spending` (whole array of category sub-breakdowns) | Landing page only (Tier 4), not page-level deep-linkable | Strip until MTFS page 12-14 (or equivalent) is archived with page-image evidence |
| `chief_executive_total_remuneration` | Bradford-only field, rarely published atomically | Usually absent; strip if present without source |

### UI-level strips (component-level, universal across all councils)

Already applied in the public repo as of 2026-04-22; no per-council action:

- Year-on-year bill change callout (`Up X% from last year (+£Y)`) — `YourBillCard`
- 5-year bill change callout (`+£X over 5 years (+Y%)`) — `BillHistoryCard`
- Peer-average comparator (`Compared to average metropolitan district: -£X`) — `YourBillCard`, `SpendingCard`, `PayAllowancesCard`, `LeadershipCard`
- Per-capita comparator (`+£X per resident`) — `SpendingCard` footer
- Typical CE salary comparator — `LeadershipCard`
- Typical councillor allowance comparator — `PayAllowancesCard`
- "Is this council expensive?" + "How much has my bill gone up?" FAQ blocks — `UnifiedDashboard`

If any of these ever re-appear, Phase 5b (`ux-audit.mjs`) catches them via the derivation sweep.

### Permitted statutory calculation (only one)

- **Tax bands A-H** — Council Tax Act 1992 s.5 mandates the ratios (6/9, 7/9, 8/9, 11/9, 13/9, 15/9, 18/9 of Band D). Every billing authority publishes all 8 band values verbatim. Provenance label is `published`, not `calculated`, with `source_url` pointing at `legislation.gov.uk/ukpga/1992/14/section/5`.

If future UI work proposes adding any other "calculated" or "comparison" rendering, the default answer is **no** — even if the inputs are Tier 1. Bradford's audit proved this needs to be a hard line.
