---
description: Run the full UX + structural audit on an already-North-Star council. Confirms it still meets the bar. Use after any change, or as a spot-check.
argument-hint: <council-name>
allowed-tools: Bash, Read, mcp__Claude_Preview__preview_start, mcp__Claude_Preview__preview_eval, mcp__Claude_Preview__preview_screenshot, mcp__Claude_Preview__preview_stop
---

# /audit-council $ARGUMENTS

Read-only verification that **$ARGUMENTS** still meets the North-Star bar. No data changes. Just checks.

## Run all four gates

```bash
cd /Users/owenfisher/Projects/CivAccount/V3.0

# Gate 1: structural — every field has provenance
node scripts/validate/audit-north-star.mjs --council=$ARGUMENTS --verbose

# Gate 2: validator suite — tier-classification, source-truth, etc.
node scripts/validate/validate.mjs 2>&1 | grep -E "Errors|Warnings|$ARGUMENTS"

# Gate 3: live browser UX sweep (unwrapped numbers + derived/comparator labels)
#   Requires dev server on :3000
node scripts/council-research/ux-audit.mjs --council=$ARGUMENTS
```

## Gate 4: live-site reality check (human judgement)

Using mcp__Claude_Preview tools:
1. Start dev server, load `/council/$(slugify $ARGUMENTS)`
2. Pick 3 random numeric values
3. For each: click → popover → verify source URL opens a specific public document (not a landing page)
4. Open `<council>.gov.uk` in a real browser tab and confirm each of the 3 values appears there (or in a document linked from there)

## Report

For each gate: pass / fail + any findings.

**Pass condition:** all four gates green. Report the full list of sources verified.

**Fail condition:** any one gate red. Report specifics + remediation per COUNCIL-ROLLOUT-PLAYBOOK.md. Don't silently wave through.

## What this command does NOT do

- Does not modify data
- Does not run `render-page-images.mjs` (use `/rollout-council` for that)
- Does not open PRs

If changes are needed, flag them and stop. The owner decides whether to run `/rollout-council` to fix.
