---
description: Run the full Bradford-level North-Star rollout on a single council. Reads NORTH-STAR.md + COUNCIL-ROLLOUT-PLAYBOOK.md, works through all 9 phases, ends with ux-audit Phase 5b at 0/0 violations.
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

**Live-site reality check** — open `<council>.gov.uk` in another tab and confirm 3 random rendered values appear verbatim on the council's own page (or in a document linked from it).

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

## Acceptance — don't mark complete unless

- [ ] All 9 phases done; status/<slug>.json shows each phase ✓
- [ ] `audit-north-star --council=$ARGUMENTS` → 0/5 gaps
- [ ] `ux-audit --council=$ARGUMENTS` → 0 / 0 violations
- [ ] `tier-classification` validator 0 errors (council added to STRICT_COUNCILS)
- [ ] 3-value live spot-check vs council website passes
- [ ] AUDIT.md + manifest shipped
- [ ] Both PRs merged to `main`

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
