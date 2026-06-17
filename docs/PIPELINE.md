# CivAccount data pipeline — the rock-solid spec

**Status:** canonical. Adopted 2026-06-01. Companion to [`NORTH-STAR.md`](../NORTH-STAR.md)
(the standard) and [`COUNCIL-ROLLOUT-PLAYBOOK.md`](../COUNCIL-ROLLOUT-PLAYBOOK.md)
(the per-council operational steps). This document draws the **end-to-end data
pipeline** and the **alignment proof** that the number on the dashboard equals the
number the government published.

---

## The one idea

**The unit of trust is a single number on screen — not a council, not a field.**

Every rendered number must be provable on its own, by a verification path that does
**not** trust whoever entered it, and if any link in its chain of custody breaks, the
number **disappears rather than displays wrong**.

This is *fail-closed* design. The defining property of the whole pipeline:

> **There is no path to a wrong number on screen. Every failure routes to *absent*, not *wrong*.**

---

## The pipeline (7 stages + gates)

```
  STAGE                        WHAT HAPPENS                    GATE (must pass to advance)
 ┌──────────────────────────────────────────────────────────────────────────────────────┐
 │ 0. IDENTIFY        Declare which gov document is THE        G0: every field on the
 │    (inventory)     source for each field + its fiscal       renderable-fields manifest
 │    01-inventory    year + tier. Nothing is sourced          has a declared source OR is
 │                    ad-hoc.  out: inventory.json             marked "not published".  [PARTIAL]
 ├──────────────────────────────────────────────────────────────────────────────────────┤
 │ 1. ACQUIRE         Download → `file` type check (catch      G1: declared type, sane size,
 │    (archive)       WAF HTML-as-PDF) → sha256 → store        sha256 recorded, Wayback snapshot
 │    02-archive      under by-hash/ → Wayback snapshot →      exists. Unfetchable → council
 │    robust-fetch    _meta.json.                              deferred, never faked.    [LIVE]
 ├──────────────────────────────────────────────────────────────────────────────────────┤
 │ 2. EXTRACT         pdftotext -layout -f N -l N (PDF) /      G2: value appears VERBATIM in
 │    (interpret)     parse row+col (CSV). Capture exact       extractor output; locator +
 │    03/04-extract   excerpt + page/cell locator. NO          method recorded. LLM-only
 │                    free-typing.  out: extracted-values.json extraction forbidden.     [LIVE]
 ├──────────────────────────────────────────────────────────────────────────────────────┤
 │ 3. INTERPRET &     Unit-normalize (£000s→£), stamp          G3: SANITY BATTERY (4 checks on
 │    SORT            data_year from the doc's own period,     one number):
 │    ranges,         classify tier, slot into typed schema.   • cross-field sums (±£1k)
 │    cross-field,    Sort checks: categories→total,           • Tier-1 drift = exact CSV match
 │    benford, yoy    shares→band-D total.                     • Benford trip-wire (z>1.96)
 │                                                             • YoY outlier (>30%)       [LIVE]
 │                    ↑ kills the Camden £118.5m unit-error class
 ├──────────────────────────────────────────────────────────────────────────────────────┤
 │ 4. ENTER           Write value + field_sources[k]:          G4: provenance-strict — every
 │    (populate)      {url#page=N, title, accessed,            rendered field has a schema-
 │    05-populate,    data_year, tier, method,                 complete, resolvable citation.
 │    render-page-    sha256_at_access, page, excerpt,         Stripped fields ABSENT, not
 │    images          page_image_url}. Render the PNG.         faked.            [PARTIAL→hard]
 ├──────────────────────────────────────────────────────────────────────────────────────┤
 │ 5. RENDER          At display time look up the value's      G5: DEFAULT-DENY. Renders ⟺
 │    (fail-closed)   proof status. Show ONLY if proven.       proven. Unproven → omitted or
 │    render gate     Else omit — never a wrong number.        "not yet verified".       [BUILD]
 ├──────────────────────────────────────────────────────────────────────────────────────┤
 │ 6. VERIFY          `npm run proof` — trusts NOTHING above.  G6: this DEFINES "done".
 │    ALIGNMENT       Re-derives truth from archives:          No hand-typed flag. proof.json
 │    (independent    • re-hash archive == _meta sha256        is the single source of truth
 │    V&V)            • Tier-1 value == CSV cell byte-exact    for the scoreboard.       [BUILD]
 │                    • Tier-3 value verbatim in PDF @ page
 │                      + screenshot PNG 1:1
 │                    out: proof.json (per-number PASS/FAIL + COMPUTED done-count)
 ├──────────────────────────────────────────────────────────────────────────────────────┤
 │ 7. MONITOR         Scheduled: re-fetch live source, diff    G7: drift → value drops out of
 │    (drift +        sha256 vs archive. Changed → drift       "proven" (stops rendering) until
 │    ratchet)        ticket; value drops from proven.         re-verified. CI: proof-count may
 │    data-freshness  CI ratchet on merges.                    NEVER decrease.   [PARTIAL/BUILD]
 └──────────────────────────────────────────────────────────────────────────────────────┘
         feedback: a drift ticket re-opens Stage 1 for the affected source.
```

---

## The alignment spine — chain of custody

The question "is the dashboard number the same as the original government number?" is
answered by a chain held together by **5 invariants**. A number is trustworthy only if
**all five hold**; each is independently checkable.

```
   LIVE .GOV.UK SOURCE
        │   ① sha256(source at fetch) == sha256 today ........ freshness   (Stage 7)
        ▼
   IMMUTABLE ARCHIVE  (filename = its own sha256)
        │   ② sha256(file today) == sha256 in _meta ......... tamper-evidence (Stage 6)
        ▼
   EXTRACTED VALUE + locator (page / cell / verbatim excerpt)
        │   ③ rendered value == CSV cell (Tier1, byte-exact)
        │      OR verbatim-present in PDF @ cited page (Tier3)  ← THE ALIGNMENT PROOF
        ▼
   DASHBOARD VALUE  (the number in the data file)
        │   ④ renders ⟺ ①②③ all hold ..................... default-deny (Stage 5)
        ▼
   NUMBER ON SCREEN  ──⑤──► popover shows screenshot of that exact page;
                             any reader re-checks ③ with their own eyes
```

**Invariant ③ is the heart.** It is not "we checked once and trust ourselves." It is a
program that re-opens the archived government document on every run and refuses to
confirm the number unless it physically finds it there. **Invariant ⑤** means the public
is the final auditor — potentially millions of independent checks.

---

## FMEA — every failure mode has a named guard

| How it can break | Stage | Guard | Result |
|---|---|---|---|
| Wrong document picked (prior year, "Total" vs "General Fund" reserves) | 0 | manifest declares expected doc+year; sum/drift checks | flagged at G3 |
| WAF serves HTML bot-block as a `.pdf` | 1 | `file` type + size + sha256 | won't archive |
| Source 404 / Cloudflare | 1 | Wayback fallback; else deferred | not faked |
| LLM hallucination / OCR typo / transcription error | 2 | value must be verbatim in extractor output | can't enter |
| Unit error (£000s vs £ — Camden £118.5m) | 3 | cross-field sums + Tier-1 exact + Benford + YoY | blocked at G3 |
| Value entered with no source / stale year | 4 | provenance-strict + field-source-years | blocked at G4 |
| **Unproven number shown to a user** | 5 | **default-deny render** | hidden, never wrong |
| **Council marked "done" by hand without evidence** | 6 | **proof.mjs computes done from files** | impossible to fake |
| Archive secretly swapped/edited | 6 | sha256 re-hash mismatch | value fails |
| Gov source updates, our value goes stale | 7 | sha256 drift watch → drops from proven | stops rendering |
| Verified count silently rots (139→5) | 7 | CI ratchet: count only climbs | merge blocked |

---

## NASA principles → where they live

| Principle | Implementation |
|---|---|
| **Fail-closed** | Stage 5 default-deny — failure ⇒ absent, never wrong |
| **Independent V&V** | Stage 6 proof engine re-derives from archives; trusts nothing upstream |
| **Provenance traceability** | renderable-fields manifest = requirements matrix; field_sources = per-value lineage (W3C PROV) |
| **Immutability / tamper-evidence** | content-addressed archive (by-hash/), sha256 at every link |
| **Redundancy / cross-checks** | one number checked 4 ways at G3 + re-verified at G6 + public eyes at ⑤ |
| **Reproducibility** | `npm run proof` / `npm run reproduce` — anyone re-derives the same answer |
| **Telemetry / monitoring** | Stage 7 drift watch + CI ratchet; system reports its own health |
| **No human in the trust path** | humans extract; machines verify; "done" is computed, never asserted |

---

## Status today (2026-06-01)

- **LIVE & solid:** Stage 1 archive+sha256, Stage 2 extract, Stage 3 sanity battery,
  Stage 6 Tier-1 exact-match (`source-truth`, in CI) + screenshot 1:1
  (`screenshot-parity`, loophole fixed 2026-05-31).
- **PARTIAL:** Stage 0 inventory (per-council, not enforced globally);
  Stage 4 `provenance-strict` runs as *warning* not blocker (gated behind
  `STRICT_PROVENANCE=1`); Stage 7 monthly `compare-checksums` runs but does not auto-ticket.
- **TO BUILD (closes the holes that produced the fake "139 complete"):**
  1. **Stage 5 default-deny render** — today the site shows unverified data with a notice
     instead of hiding it.
  2. **Stage 6 `npm run proof`** — unified computed scoreboard replacing hand-typed counters
     and `north_star_complete: true` flags.
  3. **Stage 7 CI ratchet** — proof-count may never decrease on a merge.

Build order: **proof.mjs first** (it makes the true state visible and computable without
changing anything user-facing), then the default-deny render gate, then the CI ratchet.
Then resume the one-by-one rollout on a foundation that cannot lie.
