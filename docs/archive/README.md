# docs/archive/

**These documents are superseded by [`/NORTH-STAR.md`](../../NORTH-STAR.md) as of 2026-04-22.**

They are preserved for history — so that anyone tracing how the methodology evolved can see the earlier iterations — but they should not be used as the current standard. Any conflict between an archived doc and NORTH-STAR.md → NORTH-STAR.md wins.

## What was archived and why

| File | What it was | Why archived |
|------|-------------|--------------|
| `PROVENANCE-INTEGRITY-PLAN.md` | First-pass provenance architecture (Categories A-E, allowlist pattern) | Concepts merged into NORTH-STAR.md §3 (tiers) and §4 (schema) |
| `NORTH-STAR-STANDARD.md` | 5-criterion structural audit for the 3 reference councils | Concepts merged into NORTH-STAR.md §19 (Definition of Done) |
| `DATA-PIPELINE.md` | Draft pipeline for owner review (tier classification, verification gate) | Absorbed into NORTH-STAR.md wholesale |
| `DATA-YEAR-POLICY.md` | Year-strictness contract | Merged into NORTH-STAR.md §5 (Date discipline) |
| `COUNCIL-AUDIT-PLAYBOOK.md` | Per-council audit workflow | Superseded by NORTH-STAR.md §6 (Phases 0-7) |
| `VALUE-VERIFICATION-PLAN.md` | Cross-check plan | Superseded by NORTH-STAR.md §16 (validator stack) |
| `ISSUES-FOUND.md` | Running log of issues | Superseded by per-council `<COUNCIL>-AUDIT.md` in the data repo + `status/<slug>.json` |
| `BRADFORD-AUDIT.md` | First audit doc, written before Datasheet-for-Datasets pattern | Will be regenerated under NORTH-STAR.md §6 Phase 6 structure; this is the archival version |

## What the canonical docs are now

- **[`/NORTH-STAR.md`](../../NORTH-STAR.md)** — methodology contract (22 sections)
- **[`/ROADMAP.md`](../../ROADMAP.md)** — sequenced implementation plan
- **[`/docs/PROGRESS.md`](../PROGRESS.md)** — per-council pipeline state
- **[`/scripts/council-research/README.md`](../../scripts/council-research/README.md)** — toolkit docs
- **per-council `<COUNCIL>-AUDIT.md`** — in the data repo under `docs/`, one per council

## Do not edit archived files

They are frozen as of 2026-04-22. If you need to reference or update concepts they contain, do it in the canonical docs above.
