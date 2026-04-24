# Per-council rollout playbook

**Adopted 2026-04-22 after Bradford became the first fully North-Star-compliant reference council. Every council added to the verified set from here runs through these 9 phases without deviation.** If you're a future session picking this up cold, this is your manual.

Bradford is the template. Everything done to Bradford in April 2026 is codified below as the workflow. No step is optional.

Companion docs:
- [`NORTH-STAR.md`](NORTH-STAR.md) — the standards (what "done" means)
- [`ROADMAP.md`](ROADMAP.md) — the sequence (which councils, in what order)
- [`docs/PROGRESS.md`](docs/PROGRESS.md) — running state per council
- [`scripts/council-research/README.md`](scripts/council-research/README.md) — tooling
- [`scripts/council-research/ROLLOUT-LESSONS.md`](scripts/council-research/ROLLOUT-LESSONS.md) — **READ FIRST**: continuous self-learning log. Fetch-method table by site, reserves-scalar discipline, excerpt-authoring rules, deferred councils. Every batch appends.

---

## Quick-reference: the eleven phases

| Phase | Name | Typical time | Output |
| ----- | ---- | ------------ | ------ |
| 0 | Inventory | 15 min | `pdfs/council-pdfs/<slug>/inventory.json` |
| 1 | Archive | 20 min | Local PDFs + `_meta.json` + **Wayback URLs (ALL PDFs, not just blocked)** |
| 1b | Page-image generation | 10 min | PNGs under `images/` |
| 2 | Extract | 30 min | `extracted-values.json` per field |
| 3 | Cross-check + strip | 45 min | Stripped fields + `*-AUDIT.md` draft |
| **3.5** | **Tier-1 drift check** ← NEW | 5 min | **ZERO drift** against parsed GOV.UK/ONS CSVs |
| **3.6** | **Tier-4 link check** ← NEW | 5 min | Every live-page URL returns 200 (or documented 403 HEAD-bot block) |
| 4 | Populate | 20 min | Updated TypeScript data file |
| 5 | Validator suite | 5 min | All CI validators pass |
| **5b** | **Live browser UX sweep** | 30 min | `0` unwrapped numeric values |
| **5c** | **Live-site reality check** ← NEW | 10 min | 3/3 rendered values appear verbatim in archived PDFs |
| **5d** | **Screenshot parity (1:1 matched data)** ← NEW | 10 min | ≥1 `page_image_url`, PNG on disk, excerpt verbatim in archived source |
| 6 | Document | 30 min | Full `<COUNCIL>-AUDIT.md` + `manifests/<slug>.json` |
| 7 | Ship | 10 min | One PR each on public + data repos |

Total: ~4.5 hours per council for competent human-supervised run.

**CRITICAL**: Phases 3.5 + 3.6 + 5c were added 2026-04-23 after a Leeds spot-check surfaced
widespread drift that passed the earlier structural audits. Phase 5d was added 2026-04-24
after a live-site audit found only 3 of 22 councils had shipped screenshot evidence to
`main` (the other 19 popovers had no visual proof). See "Drift prevention" section below.
**Zero drift is the standard — any cell that can be cross-checked against a Tier-1 CSV
must match exactly, and every council must have at least one 1:1 screenshot of its data.**

---

## Phase 0 — Inventory

Find every document the council publishes that might contain a rendered field.

### URL patterns to probe

For each council, check every one of these (per NORTH-STAR §6 Phase 0):

- `<council>.gov.uk/finances-and-spending/` (or `/finance`, `/budgets`, `/financial-information`)
- `<council>.gov.uk/statement-of-accounts/`
- `<council>.gov.uk/pay-policy-statement/` or `/chief-officer-pay/`
- `<council>.gov.uk/councillors-allowances/` or `/members-allowances/`
- `<council>.gov.uk/mtfs/` or `/medium-term-financial-strategy/`
- `<council>.gov.uk/cabinet/` or `/portfolio-holders/`
- `democracy.<council>.gov.uk/documents/` (moderngov pattern)
- `opendata.<council>.gov.uk/` (Socrata/CKAN/ArcGIS)
- `datahub.<council>.gov.uk/` (some councils)
- `<council>.gov.uk/spending-over-500/` or `/invoices-over-250/`
- 360Giving registry (for grants)
- `data.gov.uk` — search for datasets published by the council

### Output

`src/data/councils/pdfs/council-pdfs/<slug>/inventory.json` with one entry per candidate URL — status, likely document_type, initial tier guess.

---

## Phase 1 — Archive

### For each inventory URL:

1. **Download** to `pdfs/council-pdfs/<slug>/<doc-name>.pdf` (or .csv, .xlsx)
2. **Sha256** the bytes
3. **Write `_meta.json`** sibling with:
   ```json
   {
     "source_url": "...",
     "publisher": "...",
     "document_type": "pay-policy | statement-of-accounts | mtfs | ...",
     "fiscal_year": "2025-26",
     "fetched": "ISO datetime",
     "sha256": "hex64",
     "content_type": "application/pdf",
     "content_length": 0,
     "wayback_url": "https://web.archive.org/web/...",
     "licence": "Open Government Licence v3.0"
   }
   ```
4. **Trigger Wayback snapshot** via SavePageNow API. Record returned URL.

### If a URL is bot-blocked (Cloudflare / 403):

- Record `archive_exempt: "cloudflare_blocked"` in the meta
- Still attempt Wayback (IA often succeeds where we fail — different origin, different UA heuristics)
- Flag in the AUDIT file's "Known archive gaps" section

### Tool

```bash
node scripts/council-research/02-archive.mjs --council=<Name>
```

Idempotent — safe to re-run. Skips files whose sha256 matches the stored meta.

---

## Phase 1b — Pre-generate visual evidence

For each Tier 3 archived PDF, render the exact page the value lives on to a PNG.

### Spec file pattern

`scripts/council-research/specs/<slug>-images.json`:

```json
[
  {
    "council": "Bradford",
    "field": "chief_executive_salary",
    "pdf": "pay-policy-2025-26.pdf",
    "page": 11,
    "value": "£217,479",
    "note": "Senior Management Structure & Salary Ranges (Appendix B)"
  }
]
```

### Tool

```bash
node scripts/council-research/render-page-images.mjs --spec=scripts/council-research/specs/<slug>-images.json
```

Generates PNGs at 150 DPI (~300 KB each) into `pdfs/council-pdfs/<slug>/images/`.

### UI contract

Each `field_sources[k].page_image_url` points at `/archive/<slug>/images/<field>-p<page>.png`. The `/archive/` route handler serves from the archive folder with 1-year-immutable cache.

---

## Phase 2 — Extract

For each archived document type, run the matching extraction routine:

- **PDF** → `pdftotext -layout -f N -l N <file>` → regex match the line, record page + verbatim excerpt
- **CSV / XLSX** → parse, extract by council's row, record column header
- **Socrata JSON** → SoQL query with explicit aggregate, record the query
- **HTML** (accessible) → cheerio parse; (bot-blocked) → manual read + screenshot

### Output

`pdfs/council-pdfs/<slug>/extracted-values.json` — one entry per field with:
- source file sha256 (W3C PROV Entity)
- extraction_method
- page number + verbatim excerpt (PDF) or column + row index (CSV)
- extraction script version (commit SHA)

---

## Phase 3 — Cross-check + strip

### Cross-check each extracted value

1. **Tier 1 cross-check** — does the value appear in any Tier 1 CSV we have? If yes, must match exactly.
2. **Benford's Law** — once validator is live (ROADMAP Phase E). z > 1.96 = flag.
3. **YoY outlier** — > 30% change from last known year → human review.
4. **Sum consistency** — sub-totals match totals.

### The strip rule (TIGHTENED 2026-04-22 — zero tolerance for derived values)

**If a value can't be traced to a primary `.gov.uk` publication (Tier 1-4) OR confirmed via secondary (Tier 5), it does not render.**

**AND** (new): Even when inputs are individually sourced, if the **rendered value itself** doesn't appear verbatim in a single council's publication — strip. This catches CivAccount-derived peer averages, year-on-year deltas, and per-capita ratios.

Strip means: remove the value from the council's data entry. The UI either omits the card entirely or shows a `DataValidationNotice`.

**Don't keep values "for completeness" — keep the standard.**

### Strip checklist — every new council's data record (before populate)

Walk the council's existing `Council.detailed` record and **remove** each of the following if present. Bradford's final state is the reference — your council should end with the same shape.

#### Data-level strips (per-council record)

| Field path | Reason to strip | When to keep |
| ---------- | --------------- | ------------ |
| `performance_kpis` (entire array) | Items labelled with RAG colours, thresholds set by CivAccount, values often duplicate Tier 1 data and sometimes contradict it (Bradford: 96% rd condition vs Tier 1 93%) | **Never keep** — roll out as removed field for all councils under the current schema |
| `service_outcomes.housing.homes_built / homes_target / delivery_percent` | Not in any Tier 1 dataset we track (MHCLG Live Tables on Housing Supply not yet archived) | Only keep if you've archived the specific MHCLG publication that council appears in |
| `service_outcomes.population_served` | Duplicates top-level `population` (which is already Tier 1 from ONS) | **Never keep** — always a dupe |
| `service_outcomes.libraries` | Typically LLM-researched, no Tier 1 source in our manifest | Only if council publishes a specific libraries stats page that can be archived |
| `service_outcomes.adult_social_care.cqc_rating` | CQC data isn't in our Tier 1 manifest yet | Strip until we add CQC dataset to source-manifest.json |
| `service_spending` (per-category sub-amounts) | Usually landing-page only (Tier 4), not deep-linkable to a specific document page showing the exact sub-amount | Keep only if the council's MTFS / Budget Book PDF has been archived and you can point at the exact page |
| `chief_executive_total_remuneration` | Only Bradford had this field — total package vs base is rarely published atomically | Only if council publishes the specific total package figure |
| `council_tax_collection_rate` / `business_rates_collection_rate` | Not in our Tier 1 sources | Strip |
| `homes_delivery_vs_target` | Not in our Tier 1 sources | Strip |
| Any field that duplicates a Tier 1 value with a different year / derivation | Contradictions erode trust | Strip dupe, keep Tier-1-sourced canonical |

#### UI-level strips (ALREADY DONE — universal across all councils)

These were stripped from the React components as part of the Bradford audit and now affect every council rendered on the site. No per-council action needed:

- YearHistory 5-year change (`+£X (+Y%)` callout) — `BillHistoryCard`
- YoY change callout (`Up X% from last year (+£Y)`) — `YourBillCard`
- Peer-average comparator (`Compared to average ...: -£X`) — `YourBillCard`
- Typical CE salary comparator — `LeadershipCard`
- Avg councillor allowance comparator — `PayAllowancesCard`
- Per-capita comparator (`+£X per resident`) — `SpendingCard`
- FAQ blocks "Is this council expensive?" + "How much has my bill gone up?" — `UnifiedDashboard`

If a future UI change re-introduces any of these, Phase 5b will catch it (see below).

### Tier 1 cross-check (on what remains)

For each extracted value that survives the strip:

1. **Tier 1 cross-check** — does the value appear in any Tier 1 CSV we have? If yes, must match exactly.
2. **Benford's Law** — once validator is live (ROADMAP Phase E). z > 1.96 = flag.
3. **YoY outlier** — > 30% change from last known year → human review.
4. **Sum consistency** — sub-totals match totals (budget categories sum to `total_service`, allowances sum to `total_allowances_cost`, band values follow statutory ratios).

---

## Phase 4 — Populate

For every extracted value that survived Phase 3:

### Full `field_sources` entry per NORTH-STAR §4

```typescript
chief_executive_salary: {
  url: "https://.../pay-policy-2025-26.pdf#page=11",
  title: "Pay Policy Statement 2025-26 — Senior Management Structure & Salary Ranges (Appendix B)",
  accessed: "2026-04-22",
  data_year: "2025-26",
  tier: 3,
  extraction_method: "pdf_page",
  sha256_at_access: "545774...c8b4",
  page: 11,
  excerpt: "Chief Executive  CEX  £217,479",
  page_image_url: "/archive/bradford/images/chief_executive_salary-p11.png",
}
```

### PDF URL rule — always include `#page=N`

Readers tapping "Open source" should land on the exact page, never on a cover-page hunt. Tested to work across Chrome, Firefox, Safari, and moderngov.

### Tier 4 entries (live pages / bot-blocked)

```typescript
chief_executive: {
  url: "https://bradford.gov.uk/.../chief-executive-...",
  title: "Corporate Management Team — Chief Executive",
  accessed: "2026-04-22",
  data_year: "current",
  tier: 4,
  extraction_method: "manual_read",
  archive_exempt: "live_page",
  excerpt: "Chief Executive — Lorraine O'Donnell — ceo.admin@bradford.gov.uk",
}
```

---

## Phase 3.5 — Tier-1 drift check ← NEW, MANDATORY

**Added 2026-04-23 after a spot-check of Leeds (which had been declared
"North-Star complete") surfaced 187 drifted cells across 22 councils.**
Every TS value that mirrors a national CSV must match that CSV exactly.

Drift sources:
- **`src/data/population.ts`** — must match `parsed-population.csv` (ONS Mid-YYYY)
- **`council_tax.band_d_YYYY`** — must match `parsed-area-band-d.csv` columns
- **`budget.*` (education, transport, social_care, etc.)** — must match `RA_Part1_LA_Data.csv` `*tot` columns
- **`budget.total_service`** — must equal sum of the 11 budget category fields
- **`budget.net_current`** — must match RA Part 1 `netcurrtot`

### How to check

```bash
node /tmp/audit-tier1-drift.mjs   # see `/tmp/fix-tier1-drift.mjs` + `/tmp/fix-budget-totals.mjs`
```

Pass criterion: **0 cells drifted.**

If any cell differs from the CSV reference by more than the float tolerance,
either (a) update the TS value to match the CSV, or (b) if the council's
SoA has an authoritative alternative, update both the TS value AND the
corresponding `field_sources` `excerpt`/`sha256`/`page`.

No third option. "Our value comes from an older snapshot" is not acceptable
going forward. Zero drift.

---

## Phase 3.6 — Tier-4 link check ← NEW, MANDATORY

**Added 2026-04-23 after the Leeds spot-check found 12/25 Tier-4 URLs
returning 404 (link rot) and two councils showing stale CE names.**

Every Tier-4 URL in `field_sources` across every North-Star council must
return HTTP 200 (or a documented 403 HEAD-bot block that works in-browser).

```bash
node /tmp/link-check-tier4.mjs
```

Personnel drift check: for `chief_executive` + `council_leader` scalar
values, confirm the rendered name is current (via `gh search news` or
a direct fetch of the council's leadership page).

If link broken → find replacement URL via WebSearch + WebFetch, update TS.
If name stale → update both the scalar (`chief_executive: "..."`) and the
`field_source.excerpt`/`accessed`.

Pass criterion: **0 broken URLs, 0 stale names.**

---

## Phase 5 — Validator suite

```bash
node scripts/validate/validate.mjs
node scripts/validate/audit-north-star.mjs --council=<Name>
```

Must show:
- `source-truth`: 0 errors (every Tier 1 value matches source CSV)
- `field-source-years`: 0 errors (every entry has `data_year`)
- `tier-classification`: 0 errors (every entry has `tier` + `extraction_method`)
- `audit-north-star`: **0/5 gaps**
- `link-check`: no silent 404s on field_sources URLs

If any fail — fix or strip the offending value.

---

## Phase 5b — Live browser UX sweep ← NEW, MANDATORY

**Derived from Bradford UX-audit lessons. Do not skip. Structural validators are necessary but not sufficient — values can be rendered without SourceAnnotation wrapping, which silently bypasses all provenance.**

### Steps

1. Start dev server
   ```bash
   # from .claude/launch.json "dev" config
   npm run dev  # or use mcp__Claude_Preview__preview_start
   ```

2. Navigate to `http://localhost:3000/council/<slug>`

3. Run the **unwrapped-numbers sweep** (copy-paste into browser console or preview_eval):
   ```javascript
   (() => {
     const main = document.querySelector('main') || document.body;
     const walker = document.createTreeWalker(main, NodeFilter.SHOW_TEXT, null);
     const numberRegex = /(£[\d,]+(?:\.\d+)?(?:\s*(?:million|billion|bn|m))?|\d{1,3}(?:,\d{3})+(?:\.\d+)?|\d+\.\d+%|\d{3,}\b)/;
     const results = [];
     let node;
     while ((node = walker.nextNode())) {
       const text = node.textContent.trim();
       if (!text) continue;
       const m = text.match(numberRegex);
       if (!m) continue;
       let el = node.parentElement;
       let wrapped = false;
       let depth = 0;
       while (el && depth < 15) {
         if (el.getAttribute?.('role') === 'button' &&
             el.getAttribute('aria-label')?.startsWith('Source:')) {
           wrapped = true; break;
         }
         if (el.getAttribute?.('role') === 'dialog') { wrapped = 'in-dialog'; break; }
         el = el.parentElement; depth++;
       }
       if (wrapped !== true && wrapped !== 'in-dialog') {
         results.push({ text: text.slice(0, 80) });
       }
     }
     return results.filter(r =>
       !/^20\d\d$/.test(r.text) &&
       !/^\d{4}-\d{2}$/.test(r.text) &&
       !/^£\d+k/.test(r.text) &&
       !/^\d+ [A-Z][a-z]+ \d{4}$/.test(r.text)
     );
   })()
   ```

4. **Every result is a violation.** For each:
   - **Is it a real data point?** → wrap it in `<SourceAnnotation>` with the correct `getProvenance(...)` call in the component
   - **Is it decorative / label / narrative where the value is already wrapped elsewhere?** → leave, but document
   - **Is it unsourceable?** → strip the underlying data field + update the component to render nothing (or a `DataValidationNotice`)

5. Re-run the sweep. Iterate until **0 results**.

### Derivation sweep (also required — added 2026-04-22)

A second browser sweep for banned derivation patterns:

```javascript
(() => {
  const btns = Array.from(document.querySelectorAll('[role="button"][aria-label^="Source:"]'));
  return btns
    .filter(b => /Calculated|Comparison|Average|derived|year-on-year/i.test(b.getAttribute('aria-label')))
    .map(b => ({
      label: b.getAttribute('aria-label'),
      text: b.textContent.trim().slice(0, 60),
      section: b.closest('section')?.querySelector('h2')?.textContent?.trim(),
    }));
})()
```

**Every result is a violation** unless it's the single permitted statutory calculation: tax bands A-H under `provenance = 'tax_bands'` which is labelled `published` (not `calculated`) with source linking to Council Tax Act 1992.

Any `Calculated` or `Comparison` label other than the statutory tax_bands exception → strip the rendering in the component; don't just re-label.

### Ancillary visual checks (required before ship)

- **Tap the first numeric value in the hero.** Popover opens. Source URL points to a specific resource (not a landing page). Tier badge visible.
- **Tap a value with a page_image_url.** Lightbox opens, popover closes, PNG renders the expected page.
- **Tap "Open source" on a Tier 3 PDF value.** Browser opens PDF directly at the right page.
- **Click a supplier drill-down.** Verify helper copy names the specific supplier/recipient the reader should search for.
- **Spot-check against the council's live website.** Pick 3 random rendered values. Visit `<council>.gov.uk` (in a browser, as a real user). Confirm each value appears on the council's own page either verbatim or in a document linked from that page. This is the "would a journalist find anything wrong" check.

### Automated version

`scripts/council-research/ux-audit.mjs --council=<Name>` — wraps the sweep above, starts a dev server, navigates, reports violations. Produces JSON report under `scripts/validate/reports/ux-audit-<slug>.json`. **Built + mandatory as of 2026-04-22.**

---

## Phase 5c — Live-site reality check ← NEW, MANDATORY

**Added 2026-04-23 after the Leeds spot-check revealed that rendered values can
pass Phase 5b structurally (every number has a SourceAnnotation) while still
being wrong (rendered value does not appear verbatim in the cited archived
document).**

For each council, pick 3 rendered values and confirm each appears **verbatim**
(string match) in the PDF that `field_sources` cites.

```bash
node scripts/council-research/live-site-reality-check.mjs --council=<Name>
```

The script extracts the PDF via `pdftotext -layout` and runs `grep -c -F` for
the rendered value. Produces `scripts/validate/reports/live-site-reality-check.json`.

Pass criterion: **3/3 verbatim** per council.

If any rendered value is not verbatim in the archived PDF, either:
- Update the rendered value to match the PDF (most common fix), OR
- Strip the rendered field if no PDF has a matching figure.

---

## Phase 5d — Screenshot parity (1:1 matched data) ← NEW, MANDATORY

**Added 2026-04-24 after a live-site regression: only Bradford, Kent, and
Camden had shipped `page_image_url` evidence to `main`; the other 19 councils
rendered `SourceAnnotation` popovers with no visual proof of the value. The
popover read "view source" but no screenshot was there to compare against
what the document said.**

Every council must end the rollout with at least one `page_image_url` declared
in `field_sources`, every referenced PNG present on disk, and every `excerpt`
appearing verbatim (after whitespace/unicode canonicalisation) in the
archived source file.

```bash
node scripts/validate/screenshot-parity.mjs 2>&1 | grep -E "^[✓✗] <Name>"
```

Pass criterion: **line starts with ✓ and reports 0 mismatched, 0 missing PNG**.

The canonicalisation handles the usual pdftotext/HTML variations:
- Whitespace collapsed to single spaces (newlines + multi-space → " ").
- Unicode dashes (em/en-dash, minus) → ASCII hyphen.
- Unicode smart quotes → ASCII single/double quote.
- Literal `\n` in TS-string excerpts treated as real newlines.

The matcher first tries a whole-substring hit; if that misses, it splits
the excerpt into distinctive chunks (≥3 chars, separated by `—`, `:`, `|`,
multi-space, newline) and passes when ≥60% of chunks appear in the source.
This tolerates column-width drift from pdftotext extraction but catches
fabricated or paraphrased excerpts that lose verbatim fidelity.

If missing screenshot coverage:
1. Pick a renderable TS field whose value appears verbatim in an archived
   document (SoA, pay-policy, or council news/Wayback HTML).
2. Render the PNG via `node scripts/council-research/render-page-images.mjs`
   (PDF source) or `puppeteer.goto()` (HTML/live source) and save to
   `src/data/councils/pdfs/council-pdfs/<slug>/images/<field>-<page>.png`.
3. Add `page_image_url`, `page` (for PDFs), `excerpt` to the relevant
   `field_sources.<key>` entry. If the current URL is Tier-4 live-page,
   upgrade to Tier-3 by pointing `url` at the archived file (with `#page=N`
   for PDFs) and adding `sha256_at_access`.

Re-run until ✓. No exceptions.

---

## Phase 6 — Document (Datasheet for Datasets)

Write `docs/<COUNCIL>-AUDIT.md` in the data repo following Gebru et al. *Communications of the ACM* 2021:

1. Motivation
2. Composition
3. Collection process (source table — Tier × field × sha256)
4. Preprocessing
5. Uses
6. Distribution (OGL v3)
7. Maintenance

Plus a per-field register and a change log.

### Reproducibility manifest

`manifests/<slug>.json` listing every archived file + sha256 + source URL + fiscal_year + every page image + verified value. Anyone cloning the repo should be able to re-derive all rendered values by running `npm run reproduce -- --council=<Name>` (once built).

---

## Phase 7 — Ship

One PR per repo, paired:

### Data repo (`civaccount-data`)
- Updated council data entry (TypeScript file under `src/data/councils/`)
- Archived PDFs + `_meta.json` + `images/*.png`
- `docs/<COUNCIL>-AUDIT.md`
- `manifests/<slug>.json`

### Public repo (`civaccount`)
- Any component changes discovered during Phase 5b browser audit
- Any new `field_sources` schema uses
- Updated `scripts/council-research/specs/<slug>-images.json`
- Updated `scripts/council-research/status/<slug>.json` (mark `phase_7_ship: true, pr_url: "..."`)
- `docs/PROGRESS.md` moved from 🟡 → 🟢 complete

### PR must call out

- Which Tier 1-3 sources were verified
- Which Tier 4-5 sources were accepted (with archive_exempt rationale)
- Which fields were stripped + why (this is the most important section — Bradford stripped 3 fields)
- Live browser sweep → 0 unwrapped numbers
- North-star audit → 0/5 gaps

---

## What Bradford taught us (codified into the phases above)

1. **Structural provenance isn't sufficient** — Bradford had North-Star-compliant `field_sources` AND every rendered number wrapped correctly, BUT we only found the latter by live-browser audit. (Phase 5b is new because of this.)
2. **Some cards use drill-down branches** that bypass provenance wrapping — check both branches in the same component.
3. **Partial-year / change-in-seat artifacts** cause councillor-count confusion (LGBCE says 90, publication lists 107 rows). Always use `total_councillors` for display count.
4. **Duplicate fields contradict each other** — Bradford's `performance_kpis` said road condition 96%, `service_outcomes.roads` said 93%. Strip the duplicate even if both "look right."
5. **`src/data/population.ts` can drift from the Tier 1 CSV.** Spot-check every council's population against `parsed-population.csv` on Phase 5.
6. **FAQ narrative text embeds numbers too** — the "Common questions" card paraphrases hero values into sentences. Each number embedded in prose still needs wrapping.
7. **PDF URLs must include `#page=N`** — users landing at page 1 of a 170-page Statement of Accounts is a trust violation. If we know the page (and we always should, post-Phase 2), the URL includes it.
8. **Tier 2 aggregates need helper copy** — Bradford's datahub doesn't support URL filters, so when the user taps "Open source ledger", we tell them the exact supplier / recipient name to Ctrl-F for. Without that copy, the user lands unprepared.
9. **Popover + lightbox must not layer** — close the popover before opening the lightbox or readers see them stacked.
10. **A "verified" council on the structural audit can still have 33 unwrapped numbers.** Don't mark a council complete until the browser sweep is 0.

---

## Order of operations (commit cadence)

One logical change per commit. Don't batch. Bradford's full rollout produced these PRs, in order — same cadence applies to every council:

1. Phase 0-1 archival: one PR to the data repo with PDFs + meta
2. Phase 1b page images: one PR to the data repo with `images/` + spec file
3. Phase 4 populate: one PR to the data repo with the updated TS record
4. Phase 5b component wrapping fixes: one PR to the public repo
5. Phase 6 documentation: committed alongside (3) — `<COUNCIL>-AUDIT.md` + `manifests/<slug>.json`

Or — for velocity — phases 0-6 can land in two paired PRs (public + data). Bradford's rollout shipped in 8 PRs over 3 days; future councils should need fewer because the template is fixed.

---

## Progression guard

**Do not begin Phase 0 for a new council until:**
- The previous council is through Phase 7 (merged)
- That council's `status/<slug>.json` has `phase_7_ship: true`
- `audit-north-star` still reports 0/5 for all STRICT_COUNCILS
- `tier-classification` validator reports 0 errors for all STRICT_COUNCILS

This prevents regression — each new council can only inherit from a green baseline.

---

## If you're a future session

1. Read `/NORTH-STAR.md` §1–6 first. Everything else is downstream.
2. Then read this playbook.
3. Then check `docs/PROGRESS.md` to see which council to pick up.
4. Open the target council's `status/<slug>.json` to see exactly which phase to resume from.
5. Do not skip Phase 3.5, 3.6, 5b, or 5c. Do not ship without all four.

---

## Drift prevention — why 3.5 / 3.6 / 5c exist

**Standard: ZERO drift across the entire North-Star-complete set.**

### What went wrong (April 2026)

Between 2026-04-21 (first Bradford rollout) and 2026-04-23 we brought 22 councils
to "North-Star complete" state. On 2026-04-23 a user-requested spot-check of
**Leeds** — declared complete days earlier — surfaced **all of these**:

1. **187 Tier-1 cells drifted** across the 22 councils:
   - Populations (TS files held ONS Mid-2022 or Mid-2023 figures; parsed CSVs had Mid-2024)
   - Band_d years off by one (TS `band_d_2025` held the value that was actually 2024's)
   - Budget categories (TS held 2024-25 RA values; current CSVs have 2025-26)
2. **12/25 Tier-4 URLs returned 404** (link rot on council websites)
3. **2/22 CE names stale** (Manchester still said "Eamonn Boylan (Interim)" months after Tom Stannard took over; Leeds still said "Mariana Pexton" months after Ed Whiting OBE)
4. **Tier-3 `field_sources`** had full sha256 + title + accessed but were missing `page` + `excerpt` + `#page=N` + `page_image_url` for most councils (Bradford/Kent/Camden had them; the Batch-4/5/6/7 rollouts had taken shortcuts)

None of these were caught by the existing structural validators (`audit-north-star`, `tier-classification`, `source-truth`, `ux-audit.mjs`) because those validators check **form**, not **correctness-against-reference**.

### What we added

- **Phase 3.5 (Tier-1 drift check)**: explicit reference comparison. `audit-tier1-drift.mjs` compares every TS value against its parsed CSV and flags mismatches. Zero tolerance.
- **Phase 3.6 (Tier-4 link check)**: HEAD every Tier-4 URL. Personnel drift handled via periodic WebSearch for current CE/leader names.
- **Phase 5c (Live-site reality check)**: verify 3 rendered values appear verbatim in the archived PDFs. Catches the case where `field_sources` cite a document but the rendered value isn't actually in that document.
- **Phase 5d (Screenshot parity)** ← added 2026-04-24: every council ships at least one `page_image_url` whose PNG exists on disk and whose `excerpt` is present verbatim in the archived source. `screenshot-parity.mjs` enforces this. Closes the gap exposed when 19 of 22 councils' popovers had no visual evidence.
- **Quarterly refresh requirement**: Phases 3.5, 3.6, 5c, and 5d must re-run on every council at least quarterly. `/audit-council` can be scheduled for this.

### The rule

If Phase 3.5 / 3.6 / 5c / 5d reports any drift on a council currently in the
`STRICT_COUNCILS` set, **that council is no longer North-Star complete**
until the drift is resolved. Update `status/<slug>.json.north_star_complete: false`
and open a fix PR immediately.
