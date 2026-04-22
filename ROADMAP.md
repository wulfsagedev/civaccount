# CivAccount — Roadmap

**Companion document to [`NORTH-STAR.md`](NORTH-STAR.md).** Sequences the implementation of the methodology. Priorities subject to owner revision.

---

## Phase A — Foundation (current)

**Scope:** methodology + tooling scaffolding. No data changes.

- [x] Consolidated `NORTH-STAR.md` (supersedes 5 previous docs)
- [x] Move old planning docs to `docs/archive/`
- [ ] Scaffold `scripts/council-research/` with documented empty scripts
- [ ] Scaffold new validators in `scripts/validate/validators/` (empty with TODOs)
- [ ] `docs/PROGRESS.md` tracking file (per-council status)
- [ ] `docs/README.md` top-level pointer
- [ ] Commit + PR this foundation

**Owner sign-off required before Phase B.**

---

## Phase B — Build the research toolkit

**Scope:** flesh out the six council-research scripts to the point where they can process one council end-to-end.

- [ ] `01-inventory.mjs` — given a council name, probes the 11 URL patterns from NORTH-STAR §6 Phase 0. Outputs `inventory.json`
- [ ] `02-archive.mjs` — fetch + sha256 + `_meta.json` + SavePageNow. Handles Cloudflare gracefully (marks `archive_exempt`)
- [ ] `03-extract-pdf.mjs` — pdftotext wrapper with structured output
- [ ] `04-extract-csv.mjs` — CSV/XLSX extractor
- [ ] `05-populate.mjs` — extracted JSON → TypeScript data-file diff (proposes changes; human confirms)
- [ ] `06-audit-evidence.mjs` — on-demand pdftoppm → PNG for visual spot-checks
- [ ] `lib/*.mjs` — fetch, pdf, sha256, meta, wayback, prov helpers
- [ ] Content-addressed archive layout (`pdfs/by-hash/`)

End of Phase B: **Bradford re-verification can begin.** Toolkit is proven on one council; refinements captured in `NORTH-STAR.md`.

---

## Phase C — First North-Star council (Bradford)

**Scope:** Bradford through NORTH-STAR §6 Phases 0-7. One PR.

- [ ] Phase 0 Inventory — every Bradford publication catalogued
- [ ] Phase 1 Archive — all docs to content-addressed store
- [ ] Phase 2 Extract — all values extracted with method + excerpt
- [ ] Phase 3 Cross-check — Benford + YoY + sum + multi-source
- [ ] Phase 4 Populate — data file updated with full `field_sources` schema
- [ ] Phase 5 Verify — all 13 CI validators pass
- [ ] Phase 6 Document — `BRADFORD-AUDIT.md` with Datasheet for Datasets structure
- [ ] Phase 7 Ship — one PR across both repos

**Bradford is the template.** Every quirk found here becomes a documented pattern in NORTH-STAR.md before moving on.

---

## Phase D — Second and third reference councils (Camden + Kent)

**Scope:** apply the Bradford-proven workflow to Camden + Kent. Capture what's different.

Key differences expected:
- **Camden:** Cloudflare blocks most `camden.gov.uk` paths. Tier 4 / Wayback workflow will be heavily exercised. Per-council manual-download variant documented.
- **Kent:** bot-blocks on `democracy.kent.gov.uk` PDFs. Tier 4 variant. Cabinet listings change with reshuffles — need freshness strategy.

One PR per council. Each runs through §6 Phases 0-7 independently.

End of Phase D: **3 reference councils complete.** All at 0/5 north-star gaps. All at Benford-consistent. All reproducible. Toolkit is stable.

---

## Phase E — New validators land

**Scope:** build the five new CI validators listed in NORTH-STAR §16.

- [ ] `tier-classification.mjs` — every field declares tier + extraction_method
- [ ] `forbidden-source-scan.mjs` — blocks URLs from forbidden domains (Wikipedia, Glassdoor, TPA, etc.)
- [ ] `benford.mjs` — first-digit Chi-squared / z-score per council
- [ ] `yoy-outlier.mjs` — > 30% YoY change flagged for review
- [ ] `last-verified-freshness.mjs` — fail when any field's last_verified is > 180 days old
- [ ] `reproducibility.mjs` — `npm run reproduce --council=X` must exit 0
- [ ] `content-addressed-archive.mjs` — archived file hashes match their records

Each validator gets integration into `validate.mjs` + tests.

---

## Phase F — Assess readiness for bulk rollout

Decision point: is the 3-council evidence sufficient to script bulk rollout across the remaining 314?

Evaluate:
- Time-per-council in Phase C + D
- % of councils where scripted tooling worked without human intervention
- % of councils where Cloudflare / bot-blocks required manual workarounds
- Accuracy of `inventory.json` URL-pattern probing
- Any fields consistently unavailable → should they drop from the schema?

Depending on the outcome:

**Option F1 (most likely):** incremental rollout — batch of 20 councils at a time, human-reviewed, one PR per batch. ~15 weeks to cover 314.

**Option F2:** mass-strip-first. For all 314 unaudited councils, strip every per-council field until it passes the new validators. Accept that most councils show reduced data for some weeks. Re-populate as each is audited. Makes accuracy claims immediately true; worse UX for unaudited councils.

**Option F3:** hybrid. Top 30 councils by population (covering ~60% of UK population) get full audits first; the remaining 287 are mass-stripped until they roll in.

Owner decides at this point.

---

## Phase G — Corrections page + public provenance

**Scope:** consumer-facing transparency UI.

- [ ] `/corrections` page — visible list of every value correction ever made
- [ ] Per-field PROV lineage sentence in popover ("The Bradford 2025-26 CE salary £217,479 was extracted from…")
- [ ] Tier badges visible in popover + provenance page
- [ ] Wayback archive URLs surfaced in provenance page
- [ ] FAIR self-assessment JSON-LD on each council page
- [ ] 5-star Open Data badge on the site footer

---

## Phase H — Release-watcher cron (freshness automation)

**Scope:** automate detection of new source releases.

- [ ] Daily cron: fetch each Tier 1 source URL, compare sha256. File issue if changed.
- [ ] Weekly cron: fetch each Tier 3 archived URL, compare sha256. Flag drift.
- [ ] Monthly cron: HTTP-check every Tier 4/5 URL for liveness.
- [ ] Auto-issue creation on drift with suggested refresh action.

---

## Phase I — Upgrade Tier 4 → Tier 3 where possible

**Scope:** reduce the Tier 4 set. Some councils have bot-blocks because of permissive Cloudflare defaults; some may be negotiable.

- [ ] Reach out to Camden + Kent IT teams — explain our accreditation goal, ask for our User-Agent to be allowlisted (or for a `data.camden.gov.uk` mirror without WAF)
- [ ] Where that doesn't work, use Wayback snapshots as the canonical source (still Tier 4 but with a stable immutable snapshot)
- [ ] Document in each council's AUDIT.md

---

## Phase J — External validation

**Scope:** sanity-check methodology with domain experts.

- [ ] Share `NORTH-STAR.md` with mySociety research team for methodology review
- [ ] Share with Centre for Public Data
- [ ] Share with Institute for Fiscal Studies local-government team
- [ ] Share with Open Data Institute for Open Data Certificate assessment
- [ ] Share with one local-government-finance academic (LSE, Warwick LG unit, or similar)

Goal: 3-5 written sanity-check responses. Fold material findings into NORTH-STAR v2.

---

## Phase K — Long-tail polish (after ~100 councils done)

Future work, sequenced opportunistically:

- [ ] DOI / DataCite registration for the dataset
- [ ] Open Data Institute Gold Certificate submission
- [ ] Academic paper: "Civic data aggregation at scale — a reproducibility-first methodology"
- [ ] Integration with WhatDoTheyKnow for FOI fallback on un-published figures
- [ ] Per-field Wikipedia-style edit history surfaced in UI
- [ ] API endpoint exposing the archived sources (read-only, sha256-keyed)
- [ ] Schema.org `DataCatalog` at site root

---

## Non-goals (current Version 1 scope)

These are deliberately out of scope; revisit when foundation is proven:

- AI-generated commentary or summary of council finances
- Predictive models (budget forecasting, insolvency risk)
- Per-council benchmarking / ranking tables (adds analytical claims on top of raw data)
- Mobile apps (PWA only for now)
- Public user accounts / personalisation
- Paid tier / premium data

---

## Success criteria

Version 1 of the methodology is "shipped" when:

1. ~30 councils through North-Star pipeline (covers ~50% of UK population)
2. Zero value-correctness regressions caught by external reviewers
3. At least one independent party (mySociety / IFS / ODI / academic) signed off on the methodology
4. Public `/corrections` page shows the correction history transparently
5. ODI Open Data Certificate awarded (bronze minimum)
6. Anyone can `npm run reproduce -- --council=X` and get exit 0 for any audited council
