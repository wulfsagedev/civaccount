---
description: Run the full seven-gate audit on an already-North-Star council. Confirms it still meets the zero-drift bar. Use after any change, quarterly as continuous-drift-prevention, or as a user-requested spot-check.
argument-hint: <council-name>
allowed-tools: Bash, Read, WebFetch, WebSearch, mcp__Claude_Preview__preview_start, mcp__Claude_Preview__preview_eval, mcp__Claude_Preview__preview_screenshot, mcp__Claude_Preview__preview_stop
---

# /audit-council $ARGUMENTS

Read-only verification that **$ARGUMENTS** still meets the North-Star bar. No data changes. Just checks.

Seven gates must all pass. **Added 2026-04-23: Gates 2, 3, 6 codified the Leeds drift lesson (187 cells + 12 URLs + 2 stale CE names). Added 2026-04-24: Gate 7 codifies the Bradford screenshot-regression lesson — only 3 of 22 councils had screenshot evidence on main at that point.**

## Gate 1: structural audit (every field has provenance)

```bash
node scripts/validate/audit-north-star.mjs --council=$ARGUMENTS --verbose
```
Pass: **0/5 gaps**.

## Gate 2: Tier-1 drift check (ZERO drift, NEW 2026-04-23)

```bash
node /tmp/audit-tier1-drift.mjs   # or scripts/validate/audit-tier1-drift.mjs once promoted
```
Compares TS values against parsed GOV.UK/ONS CSVs. Pass: **0 cells drifted** for $ARGUMENTS.

## Gate 3: Tier-4 link check (NEW 2026-04-23)

```bash
node /tmp/link-check-tier4.mjs   # or scripts/validate/link-check-tier4.mjs once promoted
```
HEAD-checks every Tier-4 URL in $ARGUMENTS's `field_sources`. Pass: **0 broken URLs** (HEAD-403 bot-blocks that work in-browser are documented + acceptable).

Also spot-check via WebSearch:
- Is the rendered `chief_executive` the current CE? (search `<council> chief executive site:<domain>.gov.uk`)
- Is the rendered `council_leader` the current Leader?

If stale: flag + stop (do not fix here — `/rollout-council` handles value changes).

## Gate 4: validator suite

```bash
node scripts/validate/validate.mjs 2>&1 | grep -E "Errors|Warnings|$ARGUMENTS"
```
Pass: **0 errors** total (warnings OK), and **0 errors** flagged for $ARGUMENTS.

## Gate 5: live browser UX sweep

```bash
# Requires dev server on :3000
node scripts/council-research/ux-audit.mjs --council=$ARGUMENTS
```
Pass: **0/0 violations** (0 unwrapped numeric + 0 derived/comparator).

## Gate 6: live-site reality check (NEW 2026-04-23)

```bash
node scripts/council-research/live-site-reality-check.mjs --council=$ARGUMENTS
```
Automated: picks 3 rendered values; greps each archived PDF for the verbatim value. Pass: **3/3 verbatim**.

Additionally using mcp__Claude_Preview tools (human judgement):
1. Start dev server, load `/council/$(slugify $ARGUMENTS)`
2. Pick 3 popovers (not the same 3 as the automated check)
3. For each: click → dialog opens → verify source URL opens a specific public document with `#page=N` where applicable
4. Confirm each value's `page_image_url` PNG loads (Tier-3 only)

## Gate 7: screenshot parity (1:1 matched data, NEW 2026-04-24)

```bash
node scripts/validate/screenshot-parity.mjs 2>&1 | grep -E "^[✓✗] $ARGUMENTS"
```

For $ARGUMENTS:
1. At least one `page_image_url` is declared (screenshot evidence exists).
2. Every `page_image_url` PNG exists on disk under `src/data/councils/pdfs/council-pdfs/<slug>/images/`.
3. The `excerpt` claimed in each `field_sources.<key>` entry matches the
   archived PDF/HTML content 1:1 after whitespace/unicode canonicalisation.
   The matcher passes whole-substring hits and falls back to "≥60% of
   distinctive phrases appear in source".

Pass: **1 screenshot minimum, 0 missing PNGs, 0 mismatched excerpts**.

If Gate 7 fails, the live-site popover for that council shows evidence that
doesn't 1:1 match the rendered value — the exact failure mode caught for
Newcastle's Pam Smith before the 2026-04-24 fix.

## Report

For each of the 7 gates: pass / fail + any findings.

**Pass condition:** all seven gates green. Report the full list of sources verified.

**Fail condition:** any one gate red.
- If the failure is drift (Gate 2/3): mark $ARGUMENTS `north_star_complete: false` in `status/<slug>.json`, remove from `STRICT_COUNCILS`, and recommend `/rollout-council $ARGUMENTS` to fix.
- If the failure is structural (Gate 1/4/5): same — demotion + recommend rollout.
- If the failure is reality-check (Gate 6): value doesn't match PDF — critical. Same demotion.
- If the failure is screenshot parity (Gate 7): excerpt/PNG drift — same demotion.

Don't silently wave through.

## What this command does NOT do

- Does not modify data
- Does not run `render-page-images.mjs` (use `/rollout-council` for that)
- Does not open PRs

If changes are needed, flag them and stop. The owner decides whether to run `/rollout-council $ARGUMENTS` to fix.
