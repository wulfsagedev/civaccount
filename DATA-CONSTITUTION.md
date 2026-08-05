# The CivAccount Data Constitution

Nine rules governing every data point on this site. Each is enforced by code,
not by discipline — because this project has already proved that a rule living
only in prose gets broken. Wikipedia was banned in `CLAUDE.md` and cited anyway.
The fixture rule was written down and still broke a production deploy. A rule
without an enforcer is a wish.

**The mechanism is the ratchet.** Every rule below has a floor recorded in a
JSON file. CI fails the moment the live count moves the wrong way. Floors may
only be moved in the improving direction, and moving one the wrong way requires
a deliberate, reviewed edit to a tracked file. That is what makes this immutable
in practice: not that violations are impossible today, but that **the number of
them can never grow**.

---

## Rule 1 — Every value names its source

No figure enters the dataset without a `field_sources` entry saying which
document it came from. A number with no citation is indistinguishable from one
somebody typed in.

| | |
|---|---|
| **Enforcer** | `scripts/validate/validators/citation-required.mjs` |
| **Floor** | `citation-floor.json` → `max_uncited_values` |
| **Baseline** | 762 uncited of 1,595 per-council values (2026-08-05) |
| **Fails when** | the uncited count exceeds the floor |

Scope is the fields whose truth lives in a council's own publication
(`origin: council_pdf | council_html` in `renderable-fields.ts`). National
dataset fields are covered more strongly by Rule 4.

## Rule 2 — Every source is a government source

`.gov.uk` (sovereign — covers GOV.UK, ONS, legislation.gov.uk and every
council), a named OGL publisher carrying a **written justification**, or a
Wayback copy wrapping one of those. Nothing else. Wikipedia, news sites, blogs
and analysis sites are explicitly forbidden.

| | |
|---|---|
| **Rule** | `scripts/validate/lib/source-licence.mjs` — `classifySourceUrl()` |
| **Enforcers** | `forbidden-source-scan.mjs` (all URL surfaces) · `citation-required.mjs` (field citations) |
| **Floors** | `source-licence-floor.json` → 33 · `citation-floor.json` → `max_unlicensed_citations` = 0 |
| **Fails when** | either count rises |

Field citations reached **zero** off-government hosts on 2026-08-05: the last six
(Blaby, Colchester, Stockport, East Riding, Islington ×2) were re-sourced to the
councils' own `.gov.uk` URLs, each verified HTTP 200 with its stored verbatim
excerpt intact. Where a council publishes only via a commercial CDN — Azure blob
(Colchester), Contentful (Stockport) — the citation points at the council's own
`.gov.uk` landing page for the document rather than the CDN; the CDN was **not**
admitted to `OGL_PUBLISHERS`, because a generic file host is not the council's
publishing infrastructure. The 33 remaining `forbidden-source-scan` violations
are on other URL surfaces (documents, sources, open-data links), not citations.

The same rule is enforced at the pipeline gates (`01-inventory`, `05-populate`),
so a bad source cannot enter during a rollout either.

## Rule 3 — Every rendered number shows the reader where it came from

If a figure appears on a page, it is wrapped in a `SourceAnnotation` the reader
can click through to the document. No anonymous numbers.

| | |
|---|---|
| **Enforcer** | `scripts/council-research/ux-audit.mjs` (Phase 5b), batched by `ux-audit-batch.mjs` |
| **Current** | **317 / 317 councils at 0 violations** |
| **Fails when** | any council renders an unwrapped numeric value |

Captions, statutory thresholds, legislative references and entity names are
excluded by explicit markers in the markup (`data-provenance-caption`,
`data-entity-label`) — declared intent, never a text-matching guess.

## Rule 4 — National figures match the government file, byte for byte

Council tax, budgets and population come from checksummed national files, and
each rendered value is compared against the source cell at penny precision.

| | |
|---|---|
| **Enforcers** | `proof.mjs` (Tier‑1) · `compare-checksums.mjs` · `spot-check.mjs` · `source-truth.mjs` |
| **Current** | Band D **1,768 / 1,768 exact** · source files **15 / 15** match their hashes |
| **Fails when** | any cell drifts, any file hash changes, or **zero files get checked** |

That last clause matters: the verifier used to crash and still exit 0. A safety
check that reports success while doing nothing is worse than no check.

## Rule 5 — Values must be re-derivable from an archived copy

The strong bar: the source document is archived, hashed, and the figure
re-extracted from it — so the proof survives the council reorganising its site.

| | |
|---|---|
| **Enforcers** | `proof.mjs` (coverage) · `live-site-reality-check.mjs` (verbatim) · `screenshot-parity.mjs` |
| **Current** | **793 / 3,343** rendered figures backed (23.7%) · **60 / 60** verbatim where archives exist · **1 council** fully covered (Bradford) |
| **Floor** | `proof-floor.json` → `fully_covered_floor`, may only rise |

**This is the project's real remaining gap** — see "What this does not yet
guarantee" below.

## Rule 6 — Nothing invented, nothing derived

Every figure appears verbatim in a published document. CivAccount does not
compute averages, deltas or comparators and present them as fact.

| | |
|---|---|
| **Enforcers** | `calculated-fields.mjs` · `ux-audit.mjs` derivation sweep |
| **Current** | **0 derived violations** across 317 councils |

Precedent: year-on-year callouts, five-year change figures, peer averages
("Average for districts: 937") and a hard-coded national count were all
**removed** rather than relabelled.

## Rule 7 — Corroborate where two official sources exist

Where government publishes the same statutory figure twice, the two must agree.

| | |
|---|---|
| **Enforcer** | `ctr-cross-check.mjs` — stored council tax requirement vs MHCLG CTR1 |
| **Current** | **317 / 317 agree** within 0.5% |

**Choose the comparator carefully.** The first version of this check compared
against the RA return's financing residual and confidently flagged seven correct
councils. When a check disagrees with the data, suspect the comparator first.

## Rule 8 — Data must be re-verified on a clock

| | |
|---|---|
| **Enforcers** | `last-verified-freshness.mjs` (120d warn / 180d error) · `freshness.mjs` (dataset cadence) · `field-staleness.mjs` (per-field) |
| **Fails when** | any council passes 180 days without re-verification |

## Rule 9 — Production never ships unverified data

The private dataset fetch soft-fails to a 3-council fixture so a dead token
can't hang a build. That resilience must not become a silent downgrade.

| | |
|---|---|
| **Enforcer** | `next.config.ts` — production build throws if resolving to fixtures |
| **Override** | `CIVACCOUNT_ALLOW_FIXTURE_PROD=1`, deliberate only |

---

## The process for admitting a new data point

Every figure follows this sequence. There is no path that skips it.

1. **Find it in a government publication.** `.gov.uk`, or an OGL publisher
   already justified in `source-licence.mjs`. If the document sits on
   non-`.gov.uk` infrastructure, find the council's own `.gov.uk` landing page
   for it — do not cite the CDN.
2. **Archive the document** to `src/data/councils/pdfs/council-pdfs/<slug>/`
   with a `_meta.json` sidecar carrying its `sha256`.
3. **Record the citation** in `detailed.field_sources.<field>`: `url`, `title`,
   `accessed`, `data_year`, `page`, and the **verbatim excerpt** containing the
   figure.
4. **Declare it renderable** in `src/data/renderable-fields.ts` and give it a
   `FIELD_PROVENANCE` entry — without one, `SourceAnnotation` silently renders
   its children bare and the number reaches the reader unsourced.
5. **Run the gates:** `npm run validate` · `npm run proof` ·
   `node scripts/council-research/live-site-reality-check.mjs` ·
   `node scripts/council-research/ux-audit.mjs --council=<Name>`
6. **Lower any floor you improved.** A gain that isn't locked into a floor file
   can silently regress.

For a whole council, this is `/rollout-council <Name>` — the full 14-phase
playbook, one council at a time. Never a shallow pass across many.

---

## What this does **not** yet guarantee

Stated plainly, because a constitution that oversells itself is worse than none.

- **76% of rendered figures are cited but not archived.** 2,550 of 3,343 have a
  source link a reader can click, but no hashed archive from which the number
  has been independently re-derived. "Sourced" and "proven" are different bars
  and only Bradford clears the second one.
- **762 per-council values have no citation at all.** Frozen by Rule 1's floor,
  so it cannot grow — but it is real debt: mostly `savings_target`,
  `total_allowances_cost`, `council_leader`, `chief_executive`.
- ~~**6 citations point at council documents on non-government hosts.**~~
  **Paid off 2026-08-05** — all six re-sourced to `.gov.uk`, floor lowered to 0.
  Two of them (Colchester, Stockport) now cite a landing page rather than a
  page-anchored PDF, because those councils publish only via a commercial CDN;
  the page number, excerpt and page image still pin the exact spot.
- **The verbatim check covers 20 councils** — the ones with archived PDFs. The
  other 297 have nothing archived to check against.
- **Currency is not fully mechanised.** A chief executive who left last month
  still passes every automated gate; only Rule 8's clock and human
  re-verification catch it. Sheffield is a live example.

The gap is closed one council at a time by the rollout playbook. The floors
exist so it can only ever narrow.

---

*Every claim in this document was measured on 2026-08-05, not asserted.
Reproduce with `npm run validate`, `npm run proof`, and
`node scripts/validate/audit-all.mjs`.*
