# CivAccount — Per-council research progress

**Sessions:** open this file first. It tells you where every council sits
in the North-Star pipeline. For detail on a specific council, open that
council's `status/<slug>.json` or `<COUNCIL>-AUDIT.md` (in the data repo).

Pipeline phases are defined in [`/NORTH-STAR.md`](../NORTH-STAR.md) §6.

---

## Reference councils (gatekeepers)

All three must be North-Star complete (§19) before bulk rollout begins.

| Council | Type | Status | Phase | Last touched | Notes |
|---------|------|--------|-------|--------------|-------|
| Bradford | MD | 🟡 Rework pending | Phase 2 — new pipeline not yet applied | 2026-04-22 | Deep-audited before north-star standard. Needs re-ingest via new toolkit. Earlier `BRADFORD-AUDIT.md` still valid for provenance. |
| Camden | LB | 🟡 Rework pending | Phase 2 — partial | 2026-04-22 | Value-verification pass done. Suppliers + grants archived. CE salary / allowance / MTFS figures need full Phase 1 archival via Wayback where Cloudflare blocks. |
| Kent | SC | 🟡 Rework pending | Phase 2 — partial | 2026-04-22 | Budget Report PDF extracted manually. Full Phase 1 archival pending. |

All three are on [`fix/camden-kent-value-verification`](../.git/) state as of 2026-04-22 main.

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

- Councils in scope: 317
- Councils North-Star complete: 0
- Councils in progress: 3 (Bradford, Camden, Kent)
- Councils not yet started: 314

---

## Next action

Per [`/ROADMAP.md`](../ROADMAP.md):

1. **Phase B**: flesh out the research toolkit scripts so they actually work
2. **Phase C**: Bradford end-to-end through new pipeline → first North-Star council
3. **Phase D**: Camden + Kent through new pipeline
4. **Phase F**: assess readiness for bulk rollout across 314 others
