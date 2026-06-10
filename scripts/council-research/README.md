# scripts/council-research

Toolkit for the per-council research pipeline defined in
[`/NORTH-STAR.md`](../../NORTH-STAR.md) §6.

**All six numbered scripts are implemented and tested** (2026-06-10,
e2e-tested on Basildon — a fully WAF-blocked district). They automate the
*mechanical* phases; every judgment call stays with the reviewer. The
pipeline proposes, a human/agent decides, the scripts transcribe.

Scripts are numbered because they're meant to be run in sequence, but
each is idempotent — safe to re-run without duplicating work.

## Pipeline overview

```
Phase 0   ── 01-inventory ──▶ inventory.json          discovery: known record URLs
                                                       + pattern probes + landing-page
                                                       harvest + Wayback CDX domain sweep
                                                       (works even when the council WAFs
                                                       every direct request)
Phase 1   ── 02-archive   ──▶ pdfs/council-pdfs/...   sha256 + _meta.json + wayback;
                                                       fetch ladder: direct → wayback
                                                       snapshot → wayback save → poll
                                                       (+ %PDF magic-byte smoke check)
Phase 2   ── 03-extract-pdf ─▶ extracted-values.json  CANDIDATES per field with page +
                                                       verbatim excerpt — never decides
          ── 04-extract-csv ─▶ tier1_references       Tier-1 cross-check table (Phase
                                                       3.5); exits 1 on any drift and
                                                       blocks populate until resolved
REVIEW    ── you read the excerpts, set `chosen` in extracted-values.json
Phase 1b  ── 06-audit-evidence ─▶ images/*.png        renders chosen pages, regenerates
                                                       image-manifest.json fingerprints,
                                                       triggers wayback snapshots
Phase 4   ── 05-populate  ──▶ TS data-file            dry-run diff by default; --apply
                                                       writes scalar + full field_sources
                                                       entry (#page anchor, sha256,
                                                       excerpt, page_image_url)
Phase 5+  ── npm run validate · screenshot-parity · ux-audit · live-site-reality-check
```

## Per-council usage

```bash
# Phase 0: discover publications (probes + wayback harvest + CDX sweep)
node scripts/council-research/01-inventory.mjs --council=Basildon
#   → review inventory.json, prune to the docs worth archiving

# Phase 1: archive them (fetch ladder handles WAF'd sites)
node scripts/council-research/02-archive.mjs --council=Basildon

# Phase 2: locate candidate values + tier-1 cross-check
node scripts/council-research/03-extract-pdf.mjs --council=Basildon
node scripts/council-research/04-extract-csv.mjs --council=Basildon

# REVIEW: read candidates' excerpts in extracted-values.json, set `chosen`.
# This is the judgment step — General Fund vs usable reserves, CEO
# transitions, current-year columns. Do not skip the read.

# Phase 1b: render evidence PNGs for the chosen values + fingerprint them
node scripts/council-research/06-audit-evidence.mjs --council=Basildon

# Phase 1b (tier-1): visual evidence for spreadsheet-sourced stats —
# renders the council's actual row from each archived GOV.UK file
# (band D, budgets, population, councillors, capital) as a captioned,
# fingerprinted PNG. The popover picks these up automatically.
node scripts/council-research/render-csv-evidence.mjs --council=Basildon

# Phase 4: write the TS (dry-run first, always)
node scripts/council-research/05-populate.mjs --council=Basildon
node scripts/council-research/05-populate.mjs --council=Basildon --apply

# Phase 5: gates
npm run validate
node scripts/validate/screenshot-parity.mjs
```

## Failure visibility — no silent working failures

Three mechanisms make every run traceable and every failure loud:

1. **Run journal** — every script appends every run (ok / failed /
   blocked / crashed, with counts and reasons) to
   `status/runs.jsonl`. Append-only, committed. A crash before the
   script finishes still leaves a journal line (exit hooks).
2. **Self-test in CI** — `npm run pipeline:selftest` exercises every
   pure module (detectors, discovery parsing, TS surgery, PDF
   magic-byte check, journal) against real-document fixtures. Runs on
   every push; a regex or surgery regression cannot land silently.
3. **Status dashboard** — `npm run pipeline:status` shows every
   council's phase state and recent failures in one table;
   `--council=<Name>` gives one council's full run history;
   `--failures` lists every non-ok run ever recorded.

## Guard rails the scripts enforce

- `04-extract-csv` exits 1 on Tier-1 drift, and `05-populate` refuses to
  run while `tier1_drift_count > 0` — zero-drift is a precondition, not
  an afterthought.
- `05-populate` only writes fields explicitly listed in `chosen`; an
  unreviewed candidate cannot reach the data file.
- `02-archive` never hashes a WAF bot-page: responses claiming to be a
  PDF must start with `%PDF-` or the fetch ladder takes over.
- `06-audit-evidence` re-fingerprints every screenshot into
  `image-manifest.json` — CI fails if an evidence PNG changes later.

## Session continuity

Status for each council lives in `status/<slug>.json`. Any future session
reads this file and knows exactly what's done, what's next, what's blocked.

## Helpers

`lib/` carries shared utilities:

- `fetch.mjs` — fetch with realistic UA / retry / Cloudflare detection
- `robust-fetch.mjs` — the ROLLOUT-LESSONS §1 fetch ladder as code
  (direct → wayback snapshot → wayback save → save+poll)
- `pdf.mjs` — pdftotext + pdftoppm wrappers
- `sha256.mjs` — content fingerprinting
- `meta.mjs` — `_meta.json` schema + reader/writer
- `wayback.mjs` — Internet Archive Memento protocol integration
- `prov.mjs` — W3C PROV lineage (scaffold; nothing consumes it yet)
