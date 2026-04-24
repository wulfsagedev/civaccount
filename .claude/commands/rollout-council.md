---
description: Run the full Bradford-level North-Star rollout on a single council. Reads NORTH-STAR.md + COUNCIL-ROLLOUT-PLAYBOOK.md, works through all 14 phases (0, 1, 1b, 2, 3, 3.5, 3.6, 4, 5, 5b, 5c, 5d, 6, 7), ends with ZERO Tier-1 drift, ZERO broken Tier-4 URLs, ux-audit at 0/0 violations, live-site reality check at 3/3 verbatim, and 1:1 screenshot parity (≥1 page_image_url with excerpt verbatim in the archived source).
argument-hint: <council-name>
allowed-tools: Bash, Read, Write, Edit, Grep, Glob, WebFetch, WebSearch, TodoWrite, mcp__Claude_Preview__preview_start, mcp__Claude_Preview__preview_eval, mcp__Claude_Preview__preview_click, mcp__Claude_Preview__preview_screenshot, mcp__Claude_Preview__preview_stop
---

# /rollout-council $ARGUMENTS

You are running the full per-council rollout playbook on **$ARGUMENTS** — bringing it to the same North-Star standard Bradford meets.

**Ground rule (NORTH-STAR.md §2 principle #3):** Every rendered value must appear verbatim in a linkable public document from the council's own website or a GOV.UK / ONS / DEFRA / DfT / Ofsted / LGBCE publication. No peer averages, no year-on-year deltas, no per-capita comparators, no 5-year arithmetic. Strip anything else.

---

## Before you start

1. **Read these documents in full** (they supersede any prior conversation context):
   - [`/NORTH-STAR.md`](/NORTH-STAR.md) — the standard
   - [`/COUNCIL-ROLLOUT-PLAYBOOK.md`](/COUNCIL-ROLLOUT-PLAYBOOK.md) — the 9-phase process
   - [`/docs/PROGRESS.md`](/docs/PROGRESS.md) — what Bradford got stripped (apply the same strips here)

2. **Check current state of $ARGUMENTS:**
   ```bash
   cat scripts/council-research/status/$(slugify $ARGUMENTS).json 2>/dev/null || echo "no prior status — starting from Phase 0"
   ```

3. **Set up tracking.** Use TodoWrite to list all 9 phases as pending todos. Mark each in_progress as you start it and completed when it's done. One in_progress at a time.

4. **Create paired branches on both repos:**
   ```bash
   cd /Users/owenfisher/Projects/CivAccount/V3.0
   git checkout main && git pull
   git checkout -b rollout/$(slugify $ARGUMENTS)
   cd src/data/councils
   git checkout main && git pull
   git checkout -b rollout/$(slugify $ARGUMENTS)
   ```

---

## Execute the 9 phases

Work through each phase from the playbook without skipping. Each phase has its own acceptance criteria; don't move on until it's met.

### Phase 0 — Inventory
Probe the 11 URL patterns per playbook §Phase 0. Write `inventory.json` listing every candidate source. If $ARGUMENTS is on a Cloudflare-blocked site (like Camden), note Tier 4 candidates explicitly.

### Phase 1 — Archive
Run `node scripts/council-research/02-archive.mjs --council=$ARGUMENTS`. Handle Cloudflare blocks via Wayback. Every archived file needs sha256 + `_meta.json`.

### Phase 1b — Page-image PNGs
Create `scripts/council-research/specs/$(slugify $ARGUMENTS)-images.json` listing every Tier 3 PDF page that carries a rendered value. Run `node scripts/council-research/render-page-images.mjs --spec=<path>`.

### Phase 2 — Extract
For each archived document: `pdftotext -layout -f N -l N <file>`, quote the exact line in a `field_sources` entry's `excerpt`. For Tier 2 CSVs: parse and aggregate.

### Phase 3 — Strip (CRITICAL — this is where Bradford lost the most data)

Apply the **Bradford strip checklist** from `docs/PROGRESS.md#reference`:

**Must-strip data-level fields (unless page-level sourced):**
- `performance_kpis` (entire array)
- `service_outcomes.housing.*`
- `service_outcomes.population_served`
- `service_outcomes.libraries`
- `service_outcomes.adult_social_care.cqc_rating`
- `service_spending` (sub-category amounts)
- `chief_executive_total_remuneration` (unless directly published)
- Any collection rates / homes delivery % fields

**Don't re-introduce derivations:** peer averages, YoY deltas, per-capita comparators, multi-year changes. UI-level strips are already applied across all components; if you find yourself adding a `Calculated` or `Comparison` label, stop and strip instead.

### Phase 3.5 — Tier-1 drift check (MANDATORY, added 2026-04-23)

```bash
node /tmp/audit-tier1-drift.mjs   # or scripts/validate/audit-tier1-drift.mjs once promoted
```

Must report **zero drift** for $ARGUMENTS. Compares:
- `src/data/population.ts` entry → `parsed-population.csv` row
- `council_tax.band_d_2021..2025` → `parsed-area-band-d.csv` columns
- `budget.*` (education/transport/social_care/public_health/housing/cultural/environmental/planning/central_services) → `RA_Part1_LA_Data.csv` `*tot` columns
- `budget.total_service` must equal the sum of the 11 category fields
- `budget.net_current` → RA Part 1 `netcurrtot`

If drift found → update the TS values to match the CSV. No exceptions.

### Phase 3.6 — Tier-4 link check (MANDATORY, added 2026-04-23)

```bash
node /tmp/link-check-tier4.mjs   # or scripts/validate/link-check-tier4.mjs once promoted
```

Every Tier-4 URL in $ARGUMENTS's `field_sources` must return HTTP 200 (or a
documented 403 HEAD-bot block that works in-browser).

Also spot-check the current CE and council leader names via WebSearch.
If either is stale → update the TS scalar and the `field_source.excerpt`/`accessed`.

### Phase 4 — Populate
Every surviving value gets a full `field_sources[k]` entry per NORTH-STAR §4:
`{ url, title, accessed, data_year, tier, extraction_method, sha256_at_access | archive_exempt, page, excerpt, page_image_url }`.

PDF URLs must include `#page=N` for direct-to-page linking.

### Phase 5 — Structural validators
```bash
node scripts/validate/validate.mjs
node scripts/validate/audit-north-star.mjs --council=$ARGUMENTS
```
Both must report 0 errors / 0 gaps. Add $ARGUMENTS to `STRICT_COUNCILS` in `tier-classification.mjs` once it passes.

### Phase 5b — Live browser UX sweep (MANDATORY)

```bash
# Start dev server (or reuse if running)
# Then:
node scripts/council-research/ux-audit.mjs --council=$ARGUMENTS
```

Output must be:
```
✓ 0 violations — $ARGUMENTS passes Phase 5b
  (0 unwrapped numbers · 0 derived/comparator values)
```

If violations appear:
- **UNWRAPPED** numeric values → wrap in SourceAnnotation in the component, or strip the source data
- **DERIVED / COMPARATORS** → strip the rendering, don't re-label

Re-run until 0 / 0. No exceptions.

**Also visually spot-check** — load the council page in the live browser, click 3 random values, verify each popover's source URL opens a specific page of a real public document (not a landing page).

### Phase 5c — Live-site reality check (MANDATORY, added 2026-04-23)

```bash
node scripts/council-research/live-site-reality-check.mjs --council=$ARGUMENTS
```

Pick 3 rendered values for $ARGUMENTS; extract each archived PDF via `pdftotext
-layout`; run `grep -c -F <value>`. Pass criterion: **3/3 verbatim hits.**

If 0/3 or 1/3 or 2/3 — the rendered value is not verbatim in the cited source.
Either update the rendered value to match the PDF, or strip the field.

### Phase 5d — Screenshot parity (MANDATORY, added 2026-04-24)

```bash
node scripts/validate/screenshot-parity.mjs 2>&1 | grep -E "^[✓✗] $ARGUMENTS"
```

Every council must end the rollout with **≥1 page_image_url** declared in
`field_sources`, every referenced PNG present on disk, and every `excerpt`
appearing verbatim (after whitespace/unicode canonicalisation) in the
archived source. Pass criterion: **line starts with ✓**.

If missing:
1. Pick a renderable TS field whose value appears verbatim in an archived
   document (SoA, pay-policy, or council news/Wayback HTML).
2. Render the PNG via `node scripts/council-research/render-page-images.mjs`
   (PDF source) or `puppeteer.goto()` (HTML/live source).
3. Add `page_image_url`, `page`, `excerpt` to the relevant `field_sources`
   entry. If the current URL is Tier-4 live-page, upgrade to Tier-3 by
   pointing `url` at the archived file (with `#page=N` for PDFs).

Re-run until ✓. No exceptions. **This phase was added after the 2026-04-24
audit found only Bradford, Kent, and Camden had screenshot evidence shipped
to `main` — 19 other councils rendered popovers with no visual proof.**

### Phase 6 — Document
Write `src/data/councils/docs/$(slugify $ARGUMENTS | uppercase)-AUDIT.md` using the Bradford template:
- Datasheet for Datasets (13 sections per Gebru 2021)
- Per-field register (Tier × field × sha256 × source URL)
- `manifests/$(slugify $ARGUMENTS).json` reproducibility manifest

### Phase 7 — Ship
Two paired PRs:

**Data repo (`civaccount-data`):**
- Updated TypeScript record
- Archived PDFs + `_meta.json` + `images/*.png`
- `docs/<COUNCIL>-AUDIT.md` + `manifests/<slug>.json`

**Public repo (`civaccount`):**
- Any UI changes discovered during Phase 5b
- Updated `status/$(slugify $ARGUMENTS).json` with `phase_7_ship: true`
- Updated `docs/PROGRESS.md` moving council from 🟡 → 🟢

Use `gh pr create` with a body that lists:
- Which Tier 1-3 sources were verified
- Which Tier 4 sources were accepted (with archive_exempt rationale)
- **Which fields were stripped + why** (this is the most important section)
- Live browser sweep result: `0 / 0`
- North-star audit result: `0 / 5 gaps`

---

## Acceptance — don't mark complete unless ALL of these pass

- [ ] All 14 phases done (0, 1, 1b, 2, 3, **3.5**, **3.6**, 4, 5, 5b, **5c**, **5d**, 6, 7); status/<slug>.json shows each phase ✓
- [ ] `audit-north-star --council=$ARGUMENTS` → **0/5 gaps**
- [ ] `audit-tier1-drift --council=$ARGUMENTS` → **0 cells drifted** (Phase 3.5 — added 2026-04-23)
- [ ] `link-check-tier4 --council=$ARGUMENTS` → **0 broken URLs** (Phase 3.6 — added 2026-04-23)
- [ ] `ux-audit --council=$ARGUMENTS` → **0 / 0 violations** (Phase 5b)
- [ ] `live-site-reality-check --council=$ARGUMENTS` → **3/3 verbatim** (Phase 5c — added 2026-04-23)
- [ ] `screenshot-parity --council=$ARGUMENTS` → **✓ line** (Phase 5d — added 2026-04-24)
- [ ] `tier-classification` validator 0 errors (council added to STRICT_COUNCILS)
- [ ] CE + Leader names verified current via WebSearch cross-check (Phase 3.6)
- [ ] AUDIT.md (Datasheet for Datasets, 13 sections per Gebru 2021) + `manifests/<slug>.json` shipped
- [ ] Both PRs merged to `main`

**If any of Phase 3.5, 3.6, 5c, or 5d fails — the council is NOT North-Star
complete, even if the structural validators pass. Zero drift, 1:1 screenshot
proof. Added after the Leeds drift spot-check of 2026-04-23 (187 cells +
12 URLs + 2 stale CE names) and the 2026-04-24 Bradford-only screenshot
regression (19 of 22 councils rendered popovers with no visual proof).**

If any one of these fails, the council is **not** North-Star complete.

---

## Progress update

At the end of the rollout, reply to the user with:
1. Phase-by-phase summary (what was done)
2. **Exact list of what got stripped + why** (this builds trust — show your working)
3. List of anything you couldn't do + why (if any)
4. Link to the merged PRs
5. Updated `docs/PROGRESS.md` row for $ARGUMENTS

**Never mark a council complete without passing Phase 5b with 0 / 0.** That is the hard floor.
