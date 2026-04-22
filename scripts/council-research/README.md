# scripts/council-research

Toolkit for the per-council research pipeline defined in
[`/NORTH-STAR.md`](../../NORTH-STAR.md) §6.

Scripts are numbered because they're meant to be run in sequence, but
each is idempotent — safe to re-run without duplicating work.

## Pipeline overview

```
Phase 0 ── 01-inventory ──▶ inventory.json         (candidate URLs per council)
Phase 1 ── 02-archive  ──▶ pdfs/council-pdfs/...   (local copies + _meta.json)
Phase 2 ── 03-extract-pdf + 04-extract-csv
                       ──▶ extracted-values.json   (values with source + method)
Phase 3 ── (validators run cross-checks)
Phase 4 ── 05-populate ──▶ data-file diff          (proposed changes)
Phase 5 ── (CI validators run)
Phase 6 ── (human writes AUDIT.md)
Phase 7 ── (human ships PR)

Audit evidence (on-demand):
          06-audit-evidence  ──▶ PNG screenshots of PDF pages
```

## Per-council usage

```bash
# Phase 0: discover publications
node scripts/council-research/01-inventory.mjs --council=Bradford

# Phase 1: archive them
node scripts/council-research/02-archive.mjs --council=Bradford

# Phase 2: extract values
node scripts/council-research/03-extract-pdf.mjs --council=Bradford
node scripts/council-research/04-extract-csv.mjs --council=Bradford

# Phase 4: propose data-file changes (dry-run by default)
node scripts/council-research/05-populate.mjs --council=Bradford

# On-demand spot check:
node scripts/council-research/06-audit-evidence.mjs --council=Bradford
```

## Session continuity

Status for each council lives in `status/<slug>.json`. Any future session
reads this file and knows exactly what's done, what's next, what's blocked.

## Helpers

`lib/` carries shared utilities:

- `fetch.mjs` — fetch with UA / retry / Wayback fallback / archive.org SavePageNow
- `pdf.mjs` — pdftotext + pdftoppm wrappers
- `sha256.mjs` — content fingerprinting
- `meta.mjs` — `_meta.json` schema + reader/writer
- `wayback.mjs` — Internet Archive Memento protocol integration
- `prov.mjs` — W3C PROV-compatible lineage emission
