---
description: Work through the rollout queue — take the next N queued councils (default 1), run the FULL North-Star rollout on each via a fresh worker agent (sequential, never parallel), verify gates with queue-mark, update ROLLOUT-QUEUE.json, push both repos per council, and end with a plain-English batch report.
argument-hint: [count]
allowed-tools: Bash, Read, Write, Edit, Grep, Glob, Agent, TaskCreate, TaskUpdate, WebFetch, WebSearch
---

# /rollout-next $ARGUMENTS

You are the rollout DRIVER. Work through the next **$ARGUMENTS** (default 1)
queued councils in `scripts/council-research/ROLLOUT-QUEUE.json` — strictly
one at a time, full Bradford depth each, no shortcuts (⛔ DEPTH OVER BREADTH).

## Driver loop (repeat per council)

1. Read the queue; take the FIRST entry with `status: "queued"`. If none
   remain, report and stop.
2. `git pull --rebase` both repos first (public branch + data submodule
   branch) — other sessions push to them.
3. Spawn ONE fresh `general-purpose` worker agent for that council with a
   self-contained prompt (template below). Wait for it to finish before
   anything else — NEVER run two workers at once (shared branches + the
   STRICT_COUNCILS / screenshot-parity lists collide).
4. When the worker reports SHIPPED, independently verify:
   `node scripts/council-research/queue-mark.mjs --council="<Name>" --shipped`
   — this re-runs the gates (validate 0 errors, zero licence findings,
   screenshot-parity ✓). queue-mark refusing = NOT shipped: either fix
   what it names or revert + defer. Never edit the queue by hand to say
   shipped.
5. When blocked, the worker (or you) must revert partial data-file edits,
   then: `queue-mark.mjs --council="<Name>" --deferred --reason="…"` —
   written reason mandatory. Archives/status artifacts may stay committed.
6. Confirm both repos are pushed, then proceed to the next council.

## Worker prompt template (fill <COUNCIL>)

> Run the complete North-Star rollout for **<COUNCIL>** in
> /Users/owenfisher/Projects/CivAccount/V3.0. Read IN FULL first:
> NORTH-STAR.md, COUNCIL-ROLLOUT-PLAYBOOK.md,
> .claude/commands/rollout-council.md (your phase checklist),
> scripts/council-research/README.md and ROLLOUT-LESSONS.md (§0 pipeline,
> §1 fetch ladder, §2 reserves trap).
>
> Then: `git pull --rebase origin feat/proof-engine` and, in
> src/data/councils, `git pull --rebase origin proof/bradford-full-coverage`.
>
> Drive the pipeline (01-inventory → 02-archive → 03-extract-pdf +
> 04-extract-csv → REVIEW → 06-audit-evidence → 05-populate --apply →
> render-csv-evidence) and complete EVERY checklist box including Phase 5b
> ux-audit, 5c live-site-reality-check, 5d screenshot-parity, Phase 6
> AUDIT.md + manifests/<slug>.json, Phase 7 (add the council to
> STRICT_COUNCILS in scripts/validate/validators/tier-classification.mjs
> AND the list in scripts/validate/screenshot-parity.mjs, regenerate the
> image manifest, commit BOTH repos with conventional messages ending in
> "Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>", push both).
>
> JUDGMENT RULES — these are the point, do not rush them: read every
> candidate excerpt before choosing; reserves = General Fund, never Total
> Usable (cross-check the tier-1 table); verify CEO/leader against the
> live council site (the SoA may predate a leadership change); apply the
> Bradford strip-list (no derived/editorial fields); sources must be
> ONS/GOV.UK/named-OGL only — the gates hard-fail anything else, do not
> try to work around them.
>
> Finish with `node scripts/council-research/queue-mark.mjs
> --council="<COUNCIL>" --shipped`. If it refuses, fix what it names or
> revert your data-file edits (git checkout) and mark
> `--deferred --reason="…"` instead. Deferring with a precise reason is
> SUCCESS, not failure — never ship partial depth.
>
> Report back (≤30 lines): SHIPPED or DEFERRED+reason · fields populated
> with values · evidence images rendered · gate results · commit SHAs on
> both repos.

## End of batch

Report to the user in plain English: shipped (with field counts),
deferred (with reasons), overall progress (N of 317 North-Star complete),
gates status, and links/SHAs. Update memory if anything systemic was
learned (append to ROLLOUT-LESSONS.md, not just the report).
