# Proof-engine hardening backlog — gaps found by adversarial audit 2026-06-02

Goal: make per-council verification + immutability NASA-proof. Each gap below was
found empirically (tested against real code/data), ranked by severity. "Severity"
= can it let a WRONG number pass as proven, or break the system at scale.

Legend: 🔴 critical (false-pass or system-down) · 🟠 high · 🟡 medium · ⚪ low/by-design

---

## 🔴 G8 — Trust-root checksum verifier is BROKEN (and exits 0)

`scripts/validate/compare-checksums.mjs` throws `SyntaxError: Unexpected reserved
word` (top-level `await import()` outside async at line 81) — yet **exits 0**, so
CI's `data-freshness` job thinks it passed. This is the check that re-hashes the
parsed CSVs against `source-manifest.json` (the root of all Tier-1 trust). It has
been silently dead. **A dead safety check that reports success is worse than none.**
Fix: wrap in async/IIFE, make it exit non-zero on mismatch AND on its own error.

## 🔴 G2 — Nothing re-verifies the parsed CSV against the original GOV.UK file

`proof.mjs` checks `value == parsed-csv cell`, and trusts the cell because its sha
is in the manifest. But nothing in the proof run re-confirms `parsed-csv ==
manifest.parsed_csv_sha256`, nor that the parse from the original `.ods/.xlsx` was
correct. If the `.ods→.csv` parse is wrong (column shift, encoding, rounding), proof
confirms a wrong number with full confidence + green badge. Chain has a missing link:
GOV.UK .ods → (UNVERIFIED parse) → parsed.csv → (verified) → rendered value.
Fix: (a) proof re-hashes each parsed CSV vs manifest before trusting it (depends G8);
(b) a periodic re-parse-and-diff from the original .ods, or pin a row-count + spot
cells per dataset.

## 🔴 G1 — Screenshot re-render assumes byte-identical poppler everywhere

Invariant ⑥ + the lock store `screenshot_sha256` and re-render with `pdftoppm`.
Local poppler = 26.04.0. If CI / another machine runs a different poppler (or
freetype/fontconfig) version, the re-render is byte-different → EVERY screenshot
fails → mass false-UNPROVEN, or (if locks regenerated there) locks that don't
verify locally. pdftoppm output is deterministic *per toolchain version*, not
absolutely. Fix: pin poppler version in CI (Docker/exact apt pin) AND record the
poppler version inside the lock; on mismatch, fall back to perceptual/visible-text
check instead of byte-equality, or re-render in the pinned container only.

## 🟠 G5 — Value-binding can false-match on shared leading digits

The 2-significant-digit floor means value `24,000,000` (digits "24") binds to an
excerpt containing "2024" or "24.7%". A corrupted value that happens to share 2-3
leading digits with *any* number/year on the page passes. Confirmed in test.
Fix: require the value's digit-run to match a *contiguous numeric token* in the
excerpt (not a substring of concatenated digits), respecting thousands separators;
prefer exact token match, allow only documented £000↔£ scaling.

## 🟠 G4 — Excerpt match is fuzzy (60% chunk threshold)

`excerptInSource` passes at ≥60% of chunks present. A 3-chunk excerpt with 2
generic chunks ("Council", "2025") that appear on many pages passes at 67% even if
the distinctive chunk (the figure/label) is absent. Page-scoping limits blast radius,
but the 32 no-page Tier-3 fields (see G3) match against the WHOLE doc. Fix: require
the most-distinctive chunk (longest / contains the digits) to be mandatory, not just
60% of all chunks; raise threshold for no-page matches.

## 🟠 G3 — 32 Tier-3 fields have an excerpt but NO page number

These match the excerpt against the ENTIRE pdf (any page), defeating the point of
page-pinned evidence and widening G4's surface. Mostly council_leader/cabinet on
counties. Fix: require `page` for every tier-3 excerpt; no-page → UNPROVEN.

## 🟠 G7 — Self-test / lock-verify mutate the REAL data file

`proof-selftest.mjs` + `bradford-absolute.mjs` write to the real `metropolitan.ts`
and restore in `finally`. Two overlapping runs (local + CI, or two CI jobs) →
one run's restore clobbers the other's mutation, or a crash mid-run leaves the repo
corrupted. Fix: operate on a temp COPY of the data dir (or git-worktree), never the
live file; or take a file lock; never mutate tracked files in a test.

## 🟡 G9 — "Verified 0 / negative" is indistinguishable from "missing"

750 budget fields are exactly 0; 197 are negative (legit net-of-income, e.g. Adur
transport -202). Proof treats a value the same whether 0 means "council genuinely
spent £0" or "we have no data". And it never sanity-bounds negatives. Fix: require
0/negative values to carry an explicit `confirmed_zero`/sign rationale in the
field_source; add a Benford/range sanity tripwire (already specced in NORTH-STAR §9,
not built).

## 🟡 G6 — 5 HTML/Wayback screenshots can't be byte-re-rendered

5 Tier-3 fields source from HTML/Wayback; ⑥ falls back to existence-only (honest,
but weaker — a swapped PNG there isn't caught). Fix: for HTML, re-render via headless
browser at pinned viewport, OR downgrade these to a "screenshot: existence-only"
verdict that does NOT count toward FULLY-COVERED.

## ⚪ G10 — Name/ONS collisions: checked, NONE found ✓

No duplicate names, ONS codes, or normalized-name collisions across 316 councils.
Not a current risk; re-check when new councils/mergers are added (LGR 2026+ creates
new unitaries — high relevance).

---

## Cross-cutting structural gaps (beyond the 10)

- **No multi-year model** (already known): every detailed field is single-slot →
  2026 overwrites 2025. Breaks immutability across time. (Being fixed next.)
- **Proof not in CI**: it's a manual gate. No automated ratchet preventing the
  proven-count from dropping on merge.
- **Locks aren't signed**: tamper-evident (hash) but not tamper-PROOF (no key). A
  bad actor with repo write can re-run `lock-council` to re-bless altered data.
  True immutability needs either signed locks or an external append-only log
  (e.g. git tag signing, or publishing lock hashes to a transparency log).
- **Single extraction agent = single point of failure**: one process (me) both
  extracts and the excerpt it writes is what's checked. A systematic
  misunderstanding (the "Usable vs General Fund reserves" semantic gap) passes all
  crypto checks. Mitigation: independent second-pass / llm-council cross-check on
  semantics (separate from the mechanical proof).
