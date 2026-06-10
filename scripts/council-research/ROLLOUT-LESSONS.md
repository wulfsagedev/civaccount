# Rollout lessons — continuous self-learning log

**Living document. Every batch appends here.** When a new rollout hits a
surprise — a fetch that fails, a reserves figure that validates wrong, a
spec mistake — write it down so the next batch doesn't repeat it.

Read this BEFORE starting a new batch.

---

## 0. The pipeline is code now (2026-06-10)

The six numbered scripts in this folder are implemented and e2e-tested
(Basildon — a 100% WAF-blocked district). **Run them instead of
hand-rolling** — see README.md for the sequence. What got encoded:

- The §1 fetch-method decision tree below IS `lib/robust-fetch.mjs`, and
  `02-archive` climbs it automatically (with the §1 "HTML pretending to
  be a PDF" smoke check). *Bug fixed on the way: `isPdfFile()` used
  `require()` inside an ESM module, so it returned false for every file
  and the ladder always reported failure.*
- Document discovery (`01-inventory`) reads WAF'd sites via the Wayback
  copy of their landing pages, and sweeps the Wayback CDX index for
  finance PDFs by domain — including non-.gov.uk ModernGov portals like
  basildonmeetings.info. A fully bot-blocked council no longer needs a
  manual document hunt.
- The §2 reserves trap is surfaced in `03-extract-pdf` output: General
  Fund candidates are labelled, Total-Usable candidates carry a ⚠, and
  "Balance at 31 March" rows are flagged as page locators (the GF figure
  usually sits in a column the line-based matcher can't attribute).
- `04-extract-csv` is the per-council Tier-1 cross-check (the old
  audit-tier1-drift.mjs is hardcoded to the original 22 list); populate
  is blocked while any drift is unresolved.

The judgment calls have NOT moved: candidates are reviewed by reading
excerpts, `chosen` is set by hand, `05-populate` is dry-run by default.

**Hardened same day (no-silent-failure pass):** every run journals to
`status/runs.jsonl` (append-only, crash-safe); `pipeline-selftest.mjs`
(49 fixture checks, real document lines) runs in CI on every push;
`03` exits 1 if any PDF fails text extraction (explicit
`--allow-parse-failures` records the gap instead); `04` refuses to run
a weakened cross-check when reference CSVs are missing; `05 --apply`
re-reads the file from disk and round-trip-verifies its own write.
Monitor with `npm run pipeline:status` (or `--failures`).

**Visual evidence for tier-1 stats (added same day):** spreadsheet-sourced
stats (band D, budgets, population) have no "page" to photograph, so they
had zero visual evidence. `render-csv-evidence.mjs --council=X` renders
the council's actual row from each archived GOV.UK file as a captioned
PNG (file name + official sha256 + highlighted cell), fingerprints it
into image-manifest.json, and updates `src/data/evidence-images.json` so
the popover shows it automatically. Run it as part of Phase 1b on every
rollout. Bradford was the first: 10 photo-backed stats → 31.

---

## 1. Fetch-method decision tree

The `Statement of Accounts 2023-24` PDF is the single most important
artifact per council. Getting it saved with sha256 is gate 1. Council
websites are WAFfed, session-scoped, 403-to-bots, or DNS-less in very
different ways. Decide the fetch strategy from this table, in order:

| Pattern / hostname | Strategy | Examples |
|---|---|---|
| Static CDN path (`/media/`, `/asset-library/`, `/sites/default/files/`) | `curl -A "Mozilla/5.0 … Chrome/120"` direct HTTPS | Gloucestershire, Worcestershire (direct), West Sussex, Cambridgeshire, North Yorkshire, Suffolk |
| Site blocks curl UA but NOT real browsers | `node scripts/fetch-pdf-puppeteer.mjs <url> <out>` | Leicestershire (`www.leicestershire.gov.uk/sites/default/files/…`), Newcastle (all `www.newcastle.gov.uk` paths) |
| `democracy.*.gov.uk` ASP.NET session URLs — PDFs embed session token, puppeteer PDF navigation fails with `net::ERR_ABORTED` | Deferred. Needs a session-warmed fetch-within-page that primes cookies on a non-PDF URL first | Devon (`democracy.devon.gov.uk`), Oxfordshire (`mycouncil.oxfordshire.gov.uk`) |
| Host does not resolve (DNS) | Try `api.*.gov.uk`, `moderngov.*.gov.uk`, or Wayback | Warwickshire (`democracy.warwickshire.gov.uk` NXDOMAIN) |
| Origin 403s every method (WAF) | Route via `http://web.archive.org/web/<timestamp>if_/<url>` | Norfolk (`www.norfolk.gov.uk` 403s all automated clients) |
| Document is public but SoA not yet directly linked | Skip that council for now; track in this file's "Deferred" list | Somerset (audit cycle unresolved for 2023-24) |

### Reusable helper

`scripts/fetch-pdf-puppeteer.mjs` — generic puppeteer PDF downloader that
warms the origin, then does `fetch()` from inside the page context. Works
for Leicestershire-class blocks. Doesn't work for democracy.*/mycouncil.*
subdomains (PDF navigation hits a hard abort in headless Chromium).

### First-download smoke check

Always run `file <downloaded.pdf>` before hashing. If it says `HTML
document text`, the WAF served a bot-block page — the response has a
`.pdf` extension but is 500–2000 bytes of HTML. **Don't write meta.json
against that sha256.** Retry with puppeteer or skip.

---

## 2. Reserves scalar discipline — the biggest drift trap

Every single council in Batch-8/9/10 had a pre-existing `reserves:` value
in the TS that did NOT match its 2023-24 SoA narrative. Three distinct
problems show up:

### 2a. "Total Usable Reserves" vs "General Fund Reserve"

The TS `detailed.reserves` field is **General Fund Reserve** (the
council's reserve-of-last-resort balance), not Total Usable Reserves
(which includes earmarked reserves + capital grants unapplied + schools +
HRA + pensions).

**Mis-picking the wrong figure is the #1 validator-fail.** The spot-check
validator has a `reserves_exceeds_total` rule comparing `detailed.reserves`
against a Tier-1 reference from GOV.UK RA. If the chosen narrative
number is too big (e.g. Total Usable Reserves ~5x larger than the
General Fund), the validator errors.

**Rule of thumb when reading an SoA:**
- ✓ Use narrative like "General Fund Reserve was £Xm at 31 March 2024"
- ✓ Use MIRS/Balance Sheet line labelled "General Fund Balance" or
  "General Working Balance" (North Yorkshire's terminology)
- ✓ Use a council's own narrative phrasing (e.g. Cambs: "target general
  reserve balance was £28.9m and … stood at £29.4m")
- ✗ NOT "Total Usable Reserves" — that includes earmarked
- ✗ NOT "Total Reserves" — that includes unusable (revaluation, pensions)

### 2b. Stale values

Many existing TS values are 3+ years old. Don't trust them — always
re-extract from the current SoA and align.

### 2c. The validator-reference trap

The spot-check validator's "reference" for reserves comes from GOV.UK RA
`gfbaltot` (General Fund balance total, £000s). Your TS scalar must be
`≤` that reference. Pick a value from the SoA that matches that
reference's *scope* (GF only, not total usable).

---

## 3. Excerpt authoring — pass the 1:1 audit first time

`screenshot-parity.mjs` canonicalises whitespace + unicode + apostrophes
but cannot fix fabricated or paraphrased excerpts. Every excerpt must
be a substring of `pdftotext -layout -f N -l N <pdf>` output for the
exact page claimed.

### Rules

- **Copy verbatim from `pdftotext -layout` output, including the odd
  multi-space table-column alignment.** If the extracted text shows
  `"General Fund Reserve                 14.3          1.8          16.1"`,
  use that exact string — don't collapse the spaces. The matcher
  canonicalises on the audit side; preserving format here lets the
  excerpt also serve as a documentation anchor.
- **No ellipsis `…`** in excerpts. Pick a shorter complete phrase
  instead.
- **No invented role labels.** "Mark Wynn" alone is sufficient — don't
  write "Mark Wynn — Chief Executive" unless the PDF literally says
  that on the same page.
- **No synthetic concatenations** ("Name | Basic | SRA | …" — Bradford's
  pre-existing bad excerpt for `councillor_allowances_detail`).
- **Include the number in the excerpt.** The excerpt is the audit
  anchor — if the rendered TS scalar is £32.384m, the excerpt should
  contain `32.384`. Otherwise a future drift won't trip the audit.

### If the excerpt won't match

- Check `file <pdf>` again — maybe you saved an HTML bot-block.
- Re-extract with the exact page range: `pdftotext -layout -f N -l N …`
- If the value only appears with different column spacing or on a
  different page, update `page:` in the TS + re-render the PNG.

---

## 4. Path discipline — don't trip over your own `cd`

When the prior shell command ran `cd src/data/councils`, subsequent
`curl -o src/data/councils/pdfs/…` writes to
`src/data/councils/src/data/councils/pdfs/…` — a nested ghost tree.

**Rule**: every fetch / render / cat command uses a **path rooted at
`/Users/owenfisher/Projects/CivAccount/V3.0/…`** OR a path rooted at the
repo root relative to the ambient cwd you just verified with `pwd`.

When in doubt, `pwd && ls src/data/councils/pdfs/council-pdfs/<slug>/`
to confirm the downloaded PDF is where you think it is.

---

## 5. NORTH_STAR list maintenance

When adding councils to `screenshot-parity.mjs` NORTH_STAR_22 list,
keep them in the batch-ordered grouping (Batch-8, Batch-9, Batch-10…)
with a comment noting deferrals. The identifier stays
`NORTH_STAR_22` for historical continuity — don't rename as the list
grows. The number-in-the-name is decorative now.

---

## 6. Deferred councils (need a workaround)

Track every council that couldn't be fully rolled out. Clear each line
when the council ships.

| Council | Since batch | Blocker | Possible workaround |
|---|---|---|---|
| Devon | Batch-9 (2026-04-24) | `democracy.devon.gov.uk` WAF blocks puppeteer PDF navigation | Session-warmed fetch-within-page (prime cookies on non-PDF URL, then `page.evaluate(fetch)`) |
| Oxfordshire | Batch-9 (2026-04-24) | `mycouncil.oxfordshire.gov.uk` ASP.NET session tokens in URL | Same as Devon — session warming |
| Warwickshire | Batch-10 (2026-04-24) | `democracy.warwickshire.gov.uk` NXDOMAIN; `api.warwickshire.gov.uk` blocks puppeteer | Try `warwickshire.gov.uk/…` direct asset path from search |
| Somerset | Batch-10 (2026-04-24) | 2023-24 SoA PDF not directly linked from landing page; new unitary formed 2023-04-01 with unresolved audit cycle | Check `somerset.moderngov.co.uk/documents/s…` quarterly; maybe only 2024-25 SoA will ship first |

---

## 7. Git hygiene after each batch

- Always `git checkout main && git pull` before creating the next batch
  branch. A PR merged via squash leaves your local branch orphaned but
  with all your commits — if you don't re-branch from main, you'll
  re-commit already-merged changes.
- When the button-fix PR merged mid-batch, `git rebase main` cleanly
  dropped the already-squashed commit. That's expected.

---

## 8. Batch-by-batch log

### Batch-8 (Norfolk + West Sussex + Derbyshire + Lincolnshire)
- **Shipped**: 4/5.
- **Deferred**: Devon.
- **Lesson captured**: fetch-method table entries for Norfolk (Wayback),
  Leicestershire (puppeteer), others (direct).

### Batch-9 (Suffolk + Leicestershire + Cambridgeshire + Devon + Oxfordshire)
- **Shipped**: 3/5.
- **Deferred**: Devon, Oxfordshire (both `democracy.*` block puppeteer
  PDF nav).
- **Lesson captured**: `NORTH_STAR_22` list conventions; "Total Usable
  vs General Fund" reserves drift on Cambridgeshire (147M → 29.4M
  correction).

### Batch-10 (Gloucestershire + Worcestershire + North Yorkshire + Warwickshire + Somerset)
- **Shipped**: 3/5.
- **Deferred**: Warwickshire (DNS + puppeteer block), Somerset (2023-24
  SoA not directly linked).
- **Lesson captured**: the `reserves_exceeds_total` validator rule. I
  initially picked "Total Usable Reserves" for Worcs (£105.1m) and
  NYorks (£679.2m) — both failed validator because those exceed the
  GOV.UK RA reference. Corrected to General Fund Reserve £16.1m /
  General Working Balance £55.9m respectively. **This is now rule 2a
  above — read before wiring any reserves field.**

### Batch-10 depth-over-breadth enforcement (2026-04-24) — the hardest rule

After Batch-8/9/10, the user caught me running **truncated rollouts**:
1 reserves screenshot per council, no Phase 0 inventory, no pay-policy
archive, no UX audit, no AUDIT.md, councils never added to
`STRICT_COUNCILS`. 10 councils touched, zero of them at Bradford-level.

The user's correction was blunt and repeated across the session:
"depth and accuracy and evidence … one by one in full or nothing at all".

### The rule, now memorialised at the top of the playbook

Every council rollout runs ALL 14 phases before the NEXT one starts.
No 1-PNG screenshot-parity passes. No "I'll come back for depth later."

### How to recognise the slip in the moment

These are the thoughts to catch yourself on:
- "Let me just get this council on the screenshot watchlist first." → Stop.
- "I'll do breadth-first across 5 councils then deepen." → Stop.
- "Phase 5b / 5c / 6 / adding to STRICT_COUNCILS — I'll do those in a
  follow-up commit." → Stop. It never happens. Do it now.
- "The pay-policy PDF is blocked, I'll skip Phase 1 for it." → No —
  either solve the fetch (puppeteer, Wayback, session warming) or mark
  the whole council deferred and don't partial-ship it.

### What "full" actually means (checklist to run every time)

Before opening the paired PRs, confirm the council has:
- [ ] `pdfs/council-pdfs/<slug>/inventory.json` — Phase 0
- [ ] All Tier-3 PDFs archived with sha256 + `_meta.json` — Phase 1
- [ ] Wayback URL for every archived PDF — Phase 1
- [ ] `images/*.png` for EVERY renderable Tier-3 field — Phase 1b
- [ ] `extracted-values.json` or equivalent verbatim extraction — Phase 2
- [ ] All derived / YoY / comparator fields stripped — Phase 3
- [ ] `audit-tier1-drift.mjs --council=<name>` → 0 drift — Phase 3.5
- [ ] `link-check-tier4.mjs` for this council's URLs → 0 broken — Phase 3.6
- [ ] EVERY `detailed.*` field the UI renders has a `field_sources[k]`
      entry with url + sha256 + page + excerpt + page_image_url — Phase 4
- [ ] `validate.mjs` → 0 errors — Phase 5
- [ ] `ux-audit.mjs --council=<name>` → 0 / 0 — Phase 5b
- [ ] `live-site-reality-check.mjs --council=<name>` → 3/3 verbatim — Phase 5c
- [ ] `screenshot-parity.mjs` → ✓ for this council, multi-screenshot not
      just 1 — Phase 5d
- [ ] `docs/<COUNCIL>-AUDIT.md` + `manifests/<slug>.json` — Phase 6
- [ ] Council added to `STRICT_COUNCILS` in tier-classification.mjs — Phase 7
- [ ] Both paired PRs opened AND merged — Phase 7

**If any box is unchecked, the council is NOT done.** Don't open the PR.
Don't move to the next council.

### Remediation for Batch-8/9/10 (10 councils not at Bradford-level)

These 10 councils have 1 reserves screenshot each but are otherwise
not Bradford-level:
- Batch-8: Norfolk, West Sussex, Derbyshire, Lincolnshire
- Batch-9: Suffolk, Leicestershire, Cambridgeshire
- Batch-10: Gloucestershire, Worcestershire, North Yorkshire

**Remediation plan**: re-run all 14 phases on each of these 10 councils,
one at a time, starting with Norfolk. Before starting Batch-11 or
anything else. The reserves screenshots we've already shipped are still
good — don't re-do them; extend from there to the other fields.

### Batch-44 / Amber Valley (2026-06-10) — living-slot GUIDs, SPN retries, two new traps

- **Fetch**: `ambervalley.gov.uk` + `info.ambervalley.gov.uk` (141.0.55.x)
  drop TCP entirely from this network (not a UA-WAF — `nc` to :443 fails).
  Document discovery worked via Wayback copies of the landing pages;
  documents via the ladder. Add to the §1 table: *origin TCP-blocked →
  read landing pages from Wayback, fetch docs from existing captures,
  SavePageNow for the rest.*
- **Living-slot document GUIDs (new trap)**: Amber Valley's
  `docarc/docviewer.aspx?docguid=…` store reuses ONE GUID for "current"
  documents (pay policy, allowances scheme) and replaces the content in
  place. The ladder's wayback-snapshot step serves the **latest existing
  capture**, which for these slots was 2016/2021 vintage — archiving it
  would have shipped a five-year-old pay policy as current. Rule: for any
  URL whose content is replaced in place, check capture dates BEFORE
  letting the ladder run; if stale, trigger SavePageNow first so "latest"
  = today, then archive, then **verify the document's own stated period**
  (ours read "PAY POLICY STATEMENT MARCH 2025" / "approved 20 Nov 2024").
  Year-stamped documents (SoA 2023-24, allowances-paid 2022-23) are safe
  from existing captures.
- **SavePageNow returns 520 under load — retry**: first SPN round failed
  (520 ×3); the second round ~9 min later returned 302 and all three
  captures landed. Don't conclude "origin down for IA" from one 520.
- **`esc()` newline bug in populate-logic**: hand-added multi-line
  excerpts (real `\n` in extracted-values.json) are written into the TS
  as raw line breaks inside a double-quoted string — a syntax error the
  round-trip check does NOT catch (substring search, not a parse). House
  style is the literal two-char `\n` (screenshot-parity canonicalises
  it). Worked around by hand; fix + selftest fixture flagged as a
  background task.
- **Dataset-stamp false positive in ux-audit**: the DataSourcesFooter
  dataset-version commit SHA ("a8e6133") tripped the unwrapped-numbers
  sweep on EVERY council (confirmed on Ipswich). Filter now excludes
  hex-only tokens containing ≥1 a-f letter — rendered data numbers always
  carry £/commas, so no collision.
- **Reserves trap, both directions**: prior TS held 21,200,000 — exactly
  the parsed-reserves.csv (RA Part 2, usable+earmarked) reference
  presented as GF balance. The SoA ALSO offers a wrong-scope figure the
  other way: the EFA's "Closing General Fund Balance 23,650" is GF +
  earmarked (9,079 + 14,571). The MIRS GF column (p20) is the only
  correct scope. Check the arithmetic (GF + earmarked = EFA figure) when
  two "General Fund Balance" labels disagree inside one SoA.
- **CE identity**: legacy TS said "Sylvia Delahaye" — she was the CFO who
  retired Nov 2023 (SoA AGS p148). Simon Gladwin became CE 13 Dec 2023
  (new post). Always ground CE names in the AGS "Statutory Roles" section
  — the remuneration table often doesn't carry names for districts.
