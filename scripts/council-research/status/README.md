# Council research status files

One JSON per council, tracking position in the pipeline. Any session
picks up from here without context.

## File name

`<slug>.json` — slug = lowercased council name, non-alphanumeric chars
replaced with `-`, e.g. `bradford.json`, `kent.json`, `city-of-london.json`.

## Schema

```json
{
  "council": "Bradford",
  "slug": "bradford",
  "phases": {
    "phase_0_inventory": { "done": true, "at": "2026-04-22T12:34:56Z" },
    "phase_1_archive":   { "done": true, "at": "2026-04-22T12:45:00Z" },
    "phase_2_extract":   { "done": true, "at": "2026-04-22T13:00:00Z" },
    "phase_3_crosscheck":{ "done": true, "at": "2026-04-22T13:15:00Z" },
    "phase_4_populate":  { "done": true, "at": "2026-04-22T13:30:00Z" },
    "phase_5_verify":    { "done": true, "at": "2026-04-22T13:45:00Z" },
    "phase_6_document":  { "done": true, "at": "2026-04-22T14:00:00Z" },
    "phase_7_ship":      { "done": true, "at": "2026-04-22T14:15:00Z", "pr_url": "..." }
  },
  "north_star_gaps": 0,
  "integrity_score": 100,
  "benford_z": 1.24,
  "notes": [
    "Cloudflare block on /document/foo — used Wayback snapshot instead"
  ],
  "last_verified": "2026-04-22",
  "last_session": "2026-04-22"
}
```

## Resuming a session

Any new session reads `docs/PROGRESS.md` for the global picture, then
opens the relevant `status/<slug>.json` for detail. The phase markers
tell it exactly where to restart.

## Invariants

- Phase N+1 cannot be marked done if Phase N is incomplete.
- `north_star_gaps` must be 0 before `phase_7_ship` can be marked done.
- `integrity_score` must be 100 before `phase_7_ship` can be marked done.
- `benford_z` > 1.96 requires a note explaining why (could be small sample).

## What this replaces

The old `DATA-AUDIT-LOG.md` free-form log. Status files are
machine-readable + inspectable by CI.
