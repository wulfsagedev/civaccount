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
  it). Worked around by hand. **Fixed 2026-06-10**: `esc()` now escapes
  every control character, and the post-apply round trip parses the
  entry (object-literal eval) instead of substring-scanning, so an
  unparseable entry can no longer pass. pipeline-selftest covers both.
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

### Batch-44-2 / Arun (2026-06-10) — committee attachments, MIRS combined column, part-year CE pay

- **democracy.\*.gov.uk attachments vs HTML**: the ModernGov HTML pages
  (mgMemberIndex, ieListDocuments) 403 bots, but `/documents/sNNNNN/…`
  and `/documents/gNNNN/…` PDF attachments are immutable per-document IDs
  (capture digests stable 2024→2025) and fetch cleanly via the ladder's
  wayback-snapshot step — the living-slot trap does NOT apply to them.
  Bonus pattern: the **printed minutes PDF** (`g<MId>`) grounds scheme
  approvals ("RESOLVED That the new scheme … be approved for final
  adoption", recorded vote) — archive it alongside the IRP/covering
  report so the rates aren't just "recommended".
- **MIRS "General Fund Balances" column can BE the combined figure**: in
  Arun's SoA 2024-25 the MIRS GF column (19,222) is GF + earmarked
  (5,000 + 14,223, Note 10) — there is no pure-GF MIRS column at all.
  The Narrative Report ("General Fund Revenue balance £5.0m") was the
  only pure-GF statement in the document. Check Note 10/earmarked
  arithmetic against the MIRS column before assuming it's the GF balance
  (extends §2 / Amber Valley both-directions trap).
- **Part-year CE remuneration is not a salary**: when the CE joined
  in-year (Dawn Hudd, appointed 9 May 2024, joined later in 2024), the
  SoA Note 31 row (£97k) is a part-year amount, and an HTML pay-policy
  "highest paid employee £182,564" incl. allowances + 17.5% employer
  pension is a package, not a base rate. If no full-year RATE is
  published anywhere archivable, **strip chief_executive_salary** with a
  watch item for the next SoA — don't ship a misleading verbatim number.
- **`cross_check_ref` nested objects fail field-source-years**: the
  validator requires data_year on every object under field_sources and
  chokes on the NORTH-STAR §4 `cross_check_ref` sub-object (no council
  ships one). Put Tier-4 corroboration in a `//` comment above the entry
  instead, and keep the citation flat.
- **SPN/CDX availability**: both were 429/503/unreachable for stretches;
  the availability API (`archive.org/wayback/available`) succeeded where
  CDX 503'd. If no API answers, record the Memento TimeGate form
  (`web.archive.org/web/2024/<url>`) in `_meta.json` with a note and let
  the monthly job resolve the exact timestamp.

### Batch-44-3 / Ashfield (2026-06-10) — image-scan SoA volumes, DOCX year misprints, scale-top salaries

- **Part-PDF SoAs can hide the MIRS from pdftotext**: Ashfield publishes
  the SoA 2023-24 as separate volumes, and the main volume + the MIRS
  tables in the core-statements volume are image-scans with NO text
  layer (the notes volume and AGS are text). When the MIRS GF column is
  unreachable, the **AGS "Significant Governance Issues" narrative** can
  carry the only text-extractable GF balance ("The Council's General
  Reserve at the 31st March 2024 was £9.999m") — and the AGS signature
  page grounds CE + Leader names. Check the AGS before declaring a GF
  figure unextractable. Same trap hit `salary_bands`: Note 26's banding
  tables are images → no verbatim excerpt → strip.
- **Reserves trap, third council in a row**: legacy TS again held the RA
  Part 2 usable reference (28,239k) as the GF balance. Assume every
  pre-pipeline `reserves:` value is wrong until reconciled (§2).
- **Annual allowances notices can misprint their own year**: Ashfield's
  "Members' allowances 2022 to 2023" DOCX says "in 2021/22" in its body
  text. The audited SoA's Note 25 comparative pinned it: notice TOTALS
  £486,739.08 = Note 25's stated 2022/23 figure to the pound. Pattern:
  **anchor a notice's year against the SoA members'-allowances note
  before trusting either label.** (Also: DOCX sources have no page form —
  manual_read, no PNG, parity skips them; keep ≥1 PDF-backed field for
  the verbatim-1:1 requirement.)
- **CE salary published as a scale**: when the pay policy gives a range
  (CEOP1-CEOP3 "£118,214 - £132,387"), look for the **pay-ratio section** —
  Ashfield's §8.1 states the top earner is £132,387, proving the scale
  top is actually paid. Range top + top-earner corroboration in the same
  statutory document = shippable single value; range alone would not be.
- **05-populate replace-path indentation bug**: replacing a legacy
  field_sources entry writes the new entry without its leading 8-space
  indent, so the round-trip check fails ("entry not found after write")
  even though content landed. Hand-fixed in districts.ts at the time.
  **Fixed 2026-06-10**: the replace path no longer strips the entry's
  own indent (the replaced range already swallows the old one);
  pipeline-selftest now round-trips replace-with-existing-entry against
  a legacy short-form fixture (url/title/accessed/data_year only), so
  this can't regress silently.
- **SPN fully down ≠ rollout blocked**: SavePageNow 520'd (×3, spread
  over ~40 min) and the availability API 429'd all session; s32550
  (budget/MTFS — would have grounded budget_gap) could not be archived
  by any ladder step. Because its dependent fields are strippable, the
  council still shipped — strip + watch item + monthly retry beats
  holding a finished council hostage to IA uptime. (Arun's monthly-job
  pattern, extended to a whole document.)

### Batch-44-4 / Ashford (2026-06-10) — SPN self-poisoning, restricted ModernGov docs, run the proof engine

- **Your own SavePageNow can poison the ladder's wayback-snapshot step**:
  Ashford's Constitution Part 6 scheme (s27021, a "LATESTVERSION"-named
  attachment) now redirects automated fetchers to `ieLogon.aspx`. The
  ladder's SPN step captured that redirect, so "latest capture" became
  the logon page and the snapshot step kept failing. Recovery: fetch the
  **exact pre-existing CDX timestamp** (`/web/<ts>if_/<url>`) — the
  2024-05-30 capture was the real 12-page PDF. Rule: when a ModernGov
  `/documents/` URL fails the ladder, query CDX history BEFORE letting
  SPN run; if SPN already captured a redirect, go straight to the older
  timestamp and record the situation in `_meta.json`.
- **ModernGov attachments can become login-restricted in place**: a 403
  on HEAD is the normal UA bot-block (cite freely — works in-browser),
  but a **redirect to ieLogon** means the document itself is now
  restricted. Archive it from the old capture for corroboration, and do
  NOT cite it as any field's primary url — pick a sibling document whose
  live URL still serves (Ashford: the s28448 amounts notice carried the
  same £5,286.79 basic-allowance figure).
- **Reserves trap, FOURTH council in a row**: legacy TS held 35,321,000
  — again exactly the parsed-reserves.csv RA Part 2 reference. And the
  MIRS "General Fund Balance" column (36,515) is again the combined
  figure: SoA 2024-25 Note 13 splits "General fund general reserves"
  £3,265k from earmarked £33,251k, and 3,265 + 33,251 = 36,516 ≈ 36,515
  (£'000 rounding). When the SoA has a "General Fund Reserves" note with
  a pure-GF row, that row is the scalar; prove the MIRS column is
  combined by adding the note's two parts.
- **BOTH personnel scalars stale, grounded by one AGS page**: legacy CE
  "Elizabeth Chicken" matched no Ashford publication (real CE: Tracey
  Kerly, since 2016) and legacy leader "Cllr Gerry Clarkson" left in
  May 2023 (and has since died). The AGS 2024-25 signature page (p26,
  signed 27 June 2025) names both Leader and CE — one PNG grounds two
  fields. Extends the Ashfield rule: a FRESH signed AGS makes
  `council_leader` keepable (Ashfield's "reinstate from the next signed
  AGS" condition, satisfied here); a 2-year-old AGS does not.
- **salary_bands is keepable when the banding table has a text layer**
  (Bradford precedent): Ashford's SoA Note 9 "Other Employee
  Remuneration by Band" extracts cleanly (unlike Ashfield's
  image-embedded Note 26), and the legacy TS counts matched the 2024/25
  column exactly — keep, with page + excerpt + PNG. Check
  text-extractability before reflex-stripping bands.
- **Run `npm run proof` + `npm run generate:proven` at the end of every
  rollout**: the Stage-5 render gate (PROVEN_FIELDS) hides gated values
  (e.g. the reserves hero) until the proof engine has re-derived them.
  Batch-44-1/2/3 shipped without regenerating the artifact, so their
  reserves numbers were silently gate-hidden on the live page; this
  session's full proof run + regen surfaced them all (and Ashford's 7
  proven fields — the largest Batch-44 set). The ux-audit can't catch
  a value that doesn't render — re-run it AFTER the regen, not before.
- **Ashford fetch profile**: `www.ashford.gov.uk` does not bot-block at
  all (first such council in Batch-44) — every /media/ asset fetched
  directly. Pay Policy is HTML-only (no PDF form, no salary figure) —
  the audited SoA Note 9 is the CE-pay source; its "Pay & expenses"
  figure includes Returning Officer election fees per the pay-policy
  page, so title the citation "pay & expenses", not "salary scale" (the
  April 2025 structure chart carries the MG1 scale for context).

### Batch-44-5 / Babergh (2026-06-10) — shared-services scoping, the MIRS pure-GF counterexample, leadership rotations

- **Shared-services councils need a scoping line per citation**: Babergh
  shares its ENTIRE staff structure with Mid Suffolk (joint CE, joint
  SLT, since 2013) but publishes its own SoA/notice/budget. The rule
  that worked: a joint document may source a value ONLY at a line that
  states Babergh-specific scope. Babergh's SoA Note 24 hands these over
  explicitly — "applies to Babergh District Council employees only",
  bandings "exclude any officers who received more than £50,000 from
  Mid Suffolk" — and the joint AGS signature reads "Chief Executive of
  Babergh and Mid Suffolk District Councils" (the exact shared-officer
  line). The joint CE's FULL salary sits in Babergh's SoA because the
  CE is a Babergh employee (postholders stay employed by their
  pre-integration council; the partner's 50% reimbursement is disclosed
  separately, incl. employer NI — don't confuse the £232k reimbursement
  row with the £166,742 salary row). The CDX sweep surfaces the partner
  council's papers (MSDC budget reports) — prune them with a written
  reason; partner documents are out of scope even when they look useful.
- **Reserves trap, FIFTH council in a row — but the opposite MIRS
  shape**: legacy TS again held exactly the parsed-reserves.csv RA
  Part 2 reference (10,819,000) as the GF balance. Babergh's MIRS,
  unlike Arun's/Ashford's, has a PURE "General Fund Balance" column
  ((1,200) at 31 March 2025) with earmarked GF a separate column
  ((10,674)) — narrative p7 confirms ("working balance of £1.2m").
  So check the MIRS column headers FIRST: if "General Fund Balance"
  and "Earmarked General Fund Reserves" are separate columns, the GF
  column is directly usable; only when there's a single combined column
  do you need the Note-split arithmetic.
- **Annual leadership rotations make signed AGS evidence stale within
  weeks**: Babergh's coalition rotates the leadership EVERY May. The
  AGS (Amended) signed 24/02/2026 names John Ward as Leader; the 12 May
  2026 Annual Council Meeting elected Deborah Saw. For rotating-
  leadership councils, check the council's news for the latest Annual
  Council Meeting BEFORE trusting any signed document's leader name —
  the council's own news page (Tier-4 live_page + Wayback snapshot) is
  the only current primary until the next signed document. The CE
  scalar is unaffected (officers don't rotate).
- **budget_gap is shippable when the budget report IS the MTFS
  carrier**: Babergh's "2026/27 GF Budget & Medium-Term Financial
  Position" report (Full Council, 24 Feb 2026) contains a statutory
  Section 25 (S151) statement with a verbatim cumulative figure ("The
  cumulative budget gap over the MTFP totals £9.656m") — first Batch-44
  council to ship budget_gap. Pattern: look for the Section 25 /
  robustness-of-estimates appendix in the budget report; it speaks in
  single quotable sentences, unlike the MTFP tables (whose "Remaining
  Budget Gap" rows split across years and column headers). Ignore
  newer news-page figures (£7.7m) that don't match an archived
  approved document.
- **Liferay `/documents/d/` stores serve PDFs without extensions**:
  babergh.gov.uk document URLs carry no `.pdf` but return
  `application/pdf` directly with no WAF. Give 02-archive explicit
  `filename:` fields in inventory.json so `expectsPdf` kicks in and
  files land with proper names.
- **`06-audit-evidence` wayback step can report ✓ without persisting**:
  the four "✓ wayback" lines did not write `wayback_url` into the
  `_meta.json` files. After 06, grep the metas for `"wayback_url": null`
  and run `ensureSnapshot` directly to backfill (worked first try here —
  SPN healthy today, unlike 44-3's full outage).
- **Python strip scripts: 6-space `'      },'` is a substring of the
  8-space inner closer** — `block.index('      },', start)` matches an
  inner nested object's `        },` two chars in, leaving a stray
  closing brace behind (tsc caught it). Anchor structural searches to
  `'\n      },'` (newline-prefixed) or use the populate-logic helpers.

### Batch-45-1 / Basildon (2026-06-16) — the brief can be wrong; verify the CEO live anyway

- **Reserves trap, SIXTH council in a row** — legacy TS held 40,424,000,
  *exactly* the parsed-reserves.csv RA Part 2 total-usable reference, as
  the GF balance. By now: assume EVERY pre-pipeline `reserves:` is the
  usable reference until proven otherwise. Basildon's MIRS is the *pure-GF*
  shape (Babergh variant): "Balance at 31 March 2025 carried forward / Of
  which: Earmarked Reserves 38,658 / General Reserves 6,307" — the General
  Reserves row is directly usable (no note arithmetic), and it matches the
  Balance Sheet "General Fund Balance" line (6,307) exactly. Corrected to
  £6.307m.
- **The brief stated the CEO transition backwards — the live-site check is
  what caught it.** Prompt said "Gary Jones → Scott Logan"; the SoA shows
  the reverse: **Scott Logan "To"** (previous CE, in the 2023/24 comparative
  table) and **Gary Jones "From 20.1.2025"** (incoming, part-year). The SoA
  CEO-introduction signature (p3) is "Gary Jones / Chief Executive", and
  the live basildon.gov.uk site confirms Gary Jones current as of April 2026
  (Returning Officer on the 10-Apr-2026 nomination statements + council news
  "approves appointment of Gary Jones as new Chief Executive"). Lesson:
  treat the brief's personnel direction as a hint, not fact — the live-site
  gate exists precisely because anyone (including the task author) can have
  it stale/reversed. Ground the CE in the SoA's own signed introduction, not
  the Note-17 remuneration row (which shows part-year names without making
  clear who is current).
- **Wide-table reserves excerpt fails screenshot-parity as a single chunk.**
  "General Reserves" (label row) and "6,307" (value, 18 lines down the same
  column block) are non-adjacent in `pdftotext -layout`. The excerpt
  `"General Reserves 6,307"` (single spaces) is treated as ONE chunk and
  isn't a contiguous substring → 0/1, fails. Fix: author the excerpt with a
  multi-space run between label and value (`"General Reserves       6,307"`)
  so the matcher's `\s{2,}` splitter makes them TWO chunks, both verbatim
  substrings of the canonicalised page → 2/2 pass. Faithful to §3 (preserve
  column spacing). Confirmed by mini-testing the matcher before committing.
- **budget_gap/savings_target shippable from a DRAFT MTFS** — Basildon's
  "Draft General Fund MTFS & HRA Business Plan 2025/26-2028/29" (Cabinet
  23 Jan 2025) carries verbatim single-sentence figures ("gap … of £1.7m in
  2025/26"; "already includes £4.7m of savings for 2025/26"). The Babergh
  precedent (Section-25 statement) extends to any archived MTFS with a
  quotable sentence; draft status is fine if the document is the council's
  own published committee paper. NB these render via FinancialHealthCard,
  which wires their provenance onto the `savings_achieved`/`mtfs_deficit`
  display fields — if those siblings are absent the popover-anchored value
  doesn't surface, which is harmless (ux-audit 0/0 — a non-rendered value
  can't be unwrapped) and matches Ashford/Babergh.
- **`/council/[slug]` 404s under the Claude_Preview launcher (Next 16) but
  serves 200 under a plain `npm run dev`** — ALL councils (incl. Bradford)
  404'd via the preview tool, and `preview_eval` is CSP-blocked
  (`unsafe-eval`), so popover inspection through it is unreliable. Run
  `ux-audit.mjs` against a Bash-launched `npm run dev` (it drives its own
  headless browser) — that's the authoritative 5b. Don't be fooled by a
  preview-tool 404 into thinking the council page is broken; cross-check a
  known-good council on the same server first.
- **Allowances with only a catalogue-URL citation → strip.** Legacy
  `councillor_basic_allowance £7,221` / `leader_allowance £21,663` cited a
  basildonmeetings.info `ieListDocuments`/`ecCatDisplay` *catalogue* URL
  (a document list), not a specific archived scheme PDF, and the figures
  appeared in neither the archived budgets nor the SoA. A catalogue URL is
  not a fingerprintable source — strip + watch item (archive the actual
  Members' Allowances Scheme PDF and reinstate with page/excerpt/PNG).

### Batch-45-2 / Basingstoke & Deane (2026-06-16) — open-doclib fetch, deputy-CE trap, post-election leader strip, the completeness mid-session gotcha

- **First Batch-45 council whose origin is fully open**: `www.basingstoke.gov.uk`
  has TCP :443 open AND its `/content/doclib/<id>.pdf` store serves
  `application/pdf` directly to a Chrome UA (HTTP 200, no WAF). The CDX sweep
  found nothing (origin not in IA's recent index), but document discovery was
  trivial off the live `/finance` + `/accounts` pages (each doclib `<a>` carries
  its title in adjacent text — parse `href + visible text` to map IDs). Give
  02-archive explicit `filename:` fields in inventory.json. The ModernGov portal
  (`democracy.*`) 403s bots but is irrelevant — every finance doc is mirrored in
  the council's own doclib store.
- **Reserves trap, SEVENTH council in a row — combined-MIRS-column variant.**
  Legacy `reserves 45,233,000` was a stale usable/combined figure. The MIRS
  "General Fund Reserves" column is £48.5M (= £1.5M working balance + ~£47.0M
  earmarked); "Total Usable Reserves" £100.4M. The pure GF working balance is
  £1.5M — proven THREE ways in the SoA: Note 8 ("General Fund Balance Reserve …
  the council's working balance"), the reserves note's "General Fund Balance
  (Unearmarked) (1.5)" split, and the narrative p70 ("a General Fund Balance of
  £1.5M and risk reserves of £15.4M"). Use the p70 narrative sentence as the
  excerpt (single line, contains "£1.5M General Fund balance").
- **Legacy CE scalar was the DEPUTY CE.** TS said "Rebecca Emmett"; the
  council's live `/slt` page lists her as **Deputy** Chief Executive and
  **Russell O'Keefe** as Chief Executive / head of paid service (SoA Note 23
  p60 corroborates with his £157,581 salary row). Always confirm the CE against
  the council's OWN senior-leadership page — the legacy scalar can be the wrong
  person on the same page, not just a stale name. (Internal record contradiction
  was the tell: the CE-salary comment already said "Russell O'Keefe".)
- **Post-election No-Overall-Control → strip council_leader + cabinet.** B&D
  went to NOC at the 7 May 2026 election (~6 weeks pre-rollout); the new Leader
  was unconfirmed by any reachable primary (ModernGov 403s; no live leader page;
  no recent Wayback of the member index). This is the Babergh rotating-leadership
  rule taken to its conclusion: when the election is recent AND the leader is
  unreachable, strip both fields with a watch item rather than ship a stale name.
  The CE is unaffected (officers don't rotate). Legacy "Cllr Phil North" was
  wrong anyway (he leads Test Valley BC — a copy-paste artefact).
- **budget_gap: beware the COUNTY's gap in a district MTFS.** B&D's MTFS p9
  prominently quotes "Hampshire HCC has identified a budget gap of £102M …
  £180M" — that's the upper-tier county, NOT the district. B&D's own figure is
  on p15 §2.7: "indicative budget gap of £1.93M in the final year … 2029/30".
  In two-tier areas, grep for the district's OWN name / "the council" near the
  gap sentence; the highest number on the page is often the county's.
- **completeness.mjs regression gotcha — declare strips BEFORE a baseline run,
  or after.** The completeness validator compares against the *previous* run's
  `validation-latest.json`. Fields stripped BEFORE your first validate are
  absorbed silently; fields stripped AFTER a validate run (here top_suppliers +
  grant_payments, stripped mid-session to clear a ux-audit false-positive) read
  as `regression_field_lost` ERRORS until declared in `INTENTIONAL_REMOVALS`.
  Add the council's strip block there (Batch-44/45 blocks already exist) — then
  validate returns 0 errors. The SuppliersGrantsCard helper text contains
  "spending-over-£500", whose "500" trips the ux-audit `\d{3,}` sweep; that's
  why every recent district strips top_suppliers (Contracts Finder OCDS values
  are annualised CEILINGS, not actual spend — fails §2 anyway).
- **salary_bands keepable here** (Ashford precedent): SoA Note 21 banding table
  has a clean text layer and the 2024/25 column matched the legacy counts
  exactly — kept with page + excerpt + PNG. B&D ended richer than the Batch-44/45
  districts: it KEEPS chief_executive_salary, total_allowances_cost, AND
  salary_bands (full SoA Note 23 + Note 20 + Note 21), where Basildon/Arun had to
  strip the pay fields for lack of a full-year named rate.

### Batch-45-3 / Bolsover (2026-06-16) — reserves can live in the MTFP not the SoA; full SoA un-archivable; joint-officer scoping; the "balanced MTFP" gap honesty

- **Reserves trap, EIGHTH council in a row — and the GF figure was in the MTFP,
  not the SoA.** Legacy `reserves 25,015,000` was *exactly* the parsed-reserves.csv
  RA Part 2 total-usable reference. The full Statement of Accounts 2024-25 (the
  usual reserves source) is circulated as "Appendix 1" on the ModernGov portal and
  has NO Wayback capture (the s30075 gap), and the origin WAF-blocks automated
  clients — so the SoA MIRS was unreachable. The fix: the **MTFP / budget-setting
  report** carries the same pure-GF figure in narrative form — Bolsover's MTFP p8
  "Financial Reserves – General Fund / … General Fund Working Balance of £2.001m",
  explicitly distinct from earmarked (Transformation £0.682m, NNDR Growth
  Protection £14.211m). Rule: when the full SoA is unreachable, the council's MTFP/
  budget report almost always states the GF working balance in a quotable sentence
  — check it before declaring reserves unsourceable. (03-extract's auto-candidate
  was the wrong £0.049m NNDR transfer — read the excerpt, never trust the top hit.)
- **Joint Officer Team scoping (like Babergh/Mid-Suffolk).** Bolsover shares its CE
  (Karen Hanson) + officer team with North East Derbyshire DC. The rule that worked:
  the CE salary comes from **Bolsover's OWN Pay Policy** (§4.1.2 "a single point
  salary of £137,078" — Bolsover's establishment), not a joint document or an NED
  figure. Pruned NED documents from the CDX sweep with a written reason.
- **CE name had no archived PDF — used a council-news Tier-4 live_page.** No archived
  finance PDF named the CE (the Pay Policy says "Chief Executive Officer Post"; the
  SoA covering report names only the S151 Officer). The council news page
  ("Council Chief Executive, Karen Hanson said…") is a clean .gov.uk primary — saved
  the Wayback id_ capture locally + fingerprinted, cited chief_executive as Tier-4
  live_page (Bradford CE precedent). screenshot-parity is satisfied by the 4 Tier-3
  PDF fields, so the Tier-4 name needs no PNG. Confirmed CURRENT via theOrg/LinkedIn
  (CEO since Aug 2021); she is NOT a deputy (Basingstoke deputy-CE trap didn't apply).
- **The "balanced MTFP" budget_gap honesty — strip, don't force-fit.** Unlike
  Basildon/Babergh (which had a quotable single-sentence gap), Bolsover's MTFP runs
  a BALANCED budget through 2027/28 (funded by NNDR-reserve transfers); the only
  shortfall is £953k in 2028/29 — a multi-column Table-1 cell, year-4 projection, no
  quotable headline. The legacy budget_gap £17.6m / savings_target £15.9m were
  fabricated "derived from RA" values (absurd for a £16m-net-cost district). Both
  STRIPPED (no force-fit; the £953k table cell would fail screenshot-parity and
  isn't a current gap). When an MTFP is balanced-via-reserves, there often is no
  shippable budget_gap — that's a valid conclusion, not a gap to paper over.
- **01-inventory auto-discovery surfaced only ancient docs (2014-2019).** For a
  small district on a TCP-blocked ModernGov portal, the auto-probe + landing-page
  harvest found nothing current. Document discovery was a manual **Wayback CDX sweep
  of `committees.<council>.gov.uk/documents`** (4,554 captures) — grep for
  statement-of-accounts / pay-policy / MTFP / members-allowances by filename. The
  s-attachment IDs (`/documents/sNNNNN/…`) fetch cleanly via the ladder's
  wayback-snapshot step. Note the CDX `collapse=urlkey&limit=N` truncates
  alphabetically (b-IDs before s/g-IDs) — fetch the full list to a temp file and
  grep offline rather than relying on a limited query.
- **Bolsover ended mid-rich**: KEEPS chief_executive (Tier-4), chief_executive_salary,
  councillor_basic_allowance, total_allowances_cost (4 Tier-3 + 1 Tier-4); STRIPS
  salary_bands (full SoA un-archivable), budget_gap/savings_target (balanced MTFP),
  council_leader + cabinet (TCP-blocked portal + 2026 elections + Derbyshire LGR).

### Batch-45-4 / Boston (2026-06-16) — forbidden-source cleanup, the brief was RIGHT about the trap, a leader who never existed, joint-CE full salary in the SoA

- **The brief's KNOWN-ISSUE warning was accurate and worth front-loading.** Boston cited
  `mybostonuk.com` (a non-.gov.uk/OGL site) on 4 fields. Two (`chief_executive_salary`,
  `councillor_basic_allowance`) had a correct VALUE behind a forbidden SOURCE → re-source to
  the archived SoA/notice, value unchanged. Two (`cabinet`, `budget_gap`) were both
  forbidden-sourced AND wrong/un-fingerprintable → strip. The populate script REPLACES a
  field_sources entry by key (so re-sourcing chief_executive_salary + councillor_basic_allowance
  was automatic once `chosen` pointed at the new SoA candidates), but the two STRIPPED fields'
  field_sources entries had to be hand-removed (the brief flagged this exactly). After: grep the
  block for the domain — it survived only in my explanatory comments, which I then reworded to
  "non-.gov.uk third-party source" so a future grep for the literal domain is clean. Lower
  source-licence-floor.json by the count removed (43 → 39) + note it in the commit.
- **Reserves trap, NINTH council in a row** — legacy `reserves 15,030,000` was *exactly* the
  parsed-reserves.csv RA Part 2 reference. Boston's MIRS is the PURE-GF shape (Babergh/Basildon
  variant): the by-reserve table p12 lists "General Fund ... 2,000" as a standalone row and the
  MIRS GF column p17 reads 2,000 both years. Corrected to £2.0m. By now this is not a surprise —
  assume EVERY pre-pipeline reserves value is the usable reference until the MIRS proves otherwise.
- **`council_leader` was a name that exists nowhere** ("Cllr Anne Sherring"). The real history:
  Anne Dorrian led May 2023 → removed in a July 2025 NO-CONFIDENCE vote after ~14 of her 17-strong
  group defected; Dale Broughton (Progressive Independents) has led since. This is the B&D/Babergh
  rotating-leadership trap at full tilt, BUT unlike B&D the new leader IS reachable: the council's
  own ModernGov member record (`mgUserInfo.aspx?UID=<id>`, "Title: Leader") is a clean Tier-4
  .gov.uk primary → UPDATE the scalar rather than strip. Strip the `cabinet` array though (a
  9-member cross-party coalition formed in the revolt, not fingerprintable to one doc, and it was
  the stale ousted line-up). Lesson: a wrong leader name + a stale cabinet can have DIFFERENT
  resolutions — update the one with a reachable primary, strip the one without.
- **Joint-CE FULL salary lives in the district's own SoA (Babergh precedent, confirmed again).**
  Boston shares CE Rob Barlow with East Lindsey + South Holland (S&ELCP). SoA Note 30a shows
  "Chief Executive Officer ... 157,200" (full salary/fees/allowances) with BBC's recharged
  share (£44,742) in a SEPARATE column. The £157,200 is the shippable full-year figure (NOT a
  part-year amount like Arun) — don't confuse it with the recharge share. The CE NAME isn't in
  the remuneration table (role only); ground it in the council's CE page (Tier-4, Wayback-captured).
  Pay Policy corroborates with a range ("£155,250 to £170,775") but has no single figure.
- **budget_gap: the only archived budget paper was a PARISH-level special-expenses budget.** Boston's
  "budget-setting 2025-26" auto-discovered doc is the BTAC (Boston Town Area Committee) budget — a
  ~£769k special-expenses budget with "efficiency savings required" of £35,031, NOT the council's GF
  MTFS. Legacy budget_gap £13.26m / savings_target £11.93m were fabricated 'derived from RA' values
  (absurd for a £15.4m-service district) AND budget_gap cited mybostonuk. Strip both (Bolsover
  balanced-MTFP no-force-fit precedent). When the only budget doc you can archive is a town/parish
  committee budget, there is no shippable council-wide gap — that's a valid strip, not a gap to fill.
- **completeness regressions cleared by INTENTIONAL_REMOVALS (B&D lesson, applied cleanly).** The 9
  Boston strips read as `regression_field_lost` ERRORS on the first validate after stripping; adding
  a `...['Boston'].flatMap(...)` block to INTENTIONAL_REMOVALS in completeness.mjs returned 0
  regressions. Because all strips happened BEFORE my first baseline validate this session, the timing
  was forgiving, but declare them regardless so CI stays green when the baseline shifts.
- **Boston ended RICH**: KEEPS chief_executive (Tier-4 CE page), council_leader (Tier-4 ModernGov),
  chief_executive_salary, reserves, total_allowances_cost, councillor_basic_allowance, salary_bands
  (5 Tier-3 SoA/notice). STRIPS cabinet, budget_gap/savings_target, councillor_allowances_detail,
  leader_allowance + the Bradford strip-list. Richer than Bolsover (keeps council_leader + salary_bands).

### Batch-45-5 / Breckland (2026-06-16) — the brief's "shared management" premise was wrong; reserves trap #10; un-archivable allowances scheme; WAF origin IA also can't reach

- **The brief said Breckland "shares a management team with South Holland" — the primary
  says otherwise.** Breckland's SoA 2024-25 (p7) describes its OWN dedicated CMT ("a Chief
  Executive, a Deputy Chief Executive and two Executive Directors, supported by seven
  Assistant Directors") and Note 20 (p68) shows the CE's FULL 100% remuneration as
  Breckland's Head of Paid Service — not a recharged/joint figure. The shared partnership
  Breckland is actually in is the **Anglia Revenues Partnership** (5-partner revenues/
  benefits service), NOT a shared CMT with South Holland. Same lesson as Basildon (the brief
  can be wrong): the joint-officer scoping discipline (Babergh/Bolsover/Boston) didn't apply
  here — verify the premise against the SoA's "Our People" section + Note 20's "full 100%
  costs" line before reaching for it. Every value was Breckland's own by construction.
- **Reserves trap, TENTH council in a row** — legacy `reserves 20,069,000` was *exactly* the
  parsed-reserves.csv RA Part 2 reference (≈ prior-year Total Usable 20,530). Breckland's MIRS
  is the PURE-GF shape (Babergh/Basildon/Boston variant): "Balance as at 31 March 2025 ...
  General Fund Balance 3,562" is a standalone first column; Earmarked GF (19,303) is separate;
  GF+earmarked = 22,865 (the "Closing General Fund & Earmarked Reserves Balance" line the
  03-extract matcher surfaces — DON'T pick it); Total Usable = 29,531. Corrected to £3.562m.
  03-extract's auto top-candidate was the wrong £164k page-locator narrative — read the excerpt,
  never trust the top hit. By now: assume EVERY pre-pipeline reserves value is wrong until the
  MIRS pure-GF column proves the scope.
- **CE-salary range top is shippable when the SoA proves it's PAID (Ashfield/Ashford, extended).**
  Pay Policy 2025-26 gave only a Grade 1 range "£121,782 to £143,925" and the pay-ratio section
  had no top-earner figure (so the range alone wouldn't qualify). But the SoA Note 20 actual CE
  salary incl fees & allowances (£146,704) EXCEEDS the £143,925 scale top — that's even stronger
  corroboration than a same-document pay-ratio line. Range top + actual-pay-from-the-SoA = shippable.
- **A WAF-blocked origin is often un-reachable by Internet Archive too — strip the dependent
  field, don't hang.** Breckland's 2023-2027 Members' Allowances Scheme (the £6,410 basic /
  £24,290 leader 2025-26 rates) is WAF-blocked AND has NO Wayback snapshot; SavePageNow accepted
  the save (302) but no capture ever landed (IA can't fetch from a TCP-blocked origin — the
  Norfolk/Amber Valley pattern). The media slot's only captures are the SUPERSEDED 2021-2023
  scheme (£5,780/£23,119 — living-slot GUID reuse, the Amber Valley trap). Stripped both scalars
  with a watch item. total_allowances_cost was re-sourced to the AUDITED SoA Note 19 (£520k) —
  when a standalone allowances publication is un-archivable, the SoA Members'-Allowances note is
  the clean fallback (Boston Note 29 precedent).
- **02-archive can hang ~15+ min in a SavePageNow poll loop on a WAF origin IA can't reach.**
  The script kept retrying wayback-save-poll on the un-fetchable allowance docs. The 4 core PDFs
  had already landed; I killed the process (it journals on exit), recovered the one needed
  WAF-blocked doc (Pay Policy 2025-26) via a manual Wayback `id_` fetch + gunzip (the snapshot
  served gzip-compressed — `file` says "gzip compressed data"; `mv x x.gz && gunzip` fixes it),
  and stripped the un-archivable allowance docs. Don't let the rollout hang on IA uptime
  (Batch-44 "SPN fully down != blocked").
- **MTFS with a balanced budget + multi-year savings grid = strip budget_gap/savings_target
  (Bolsover/Boston no-force-fit, again).** Breckland's MTFS aims "to set a balanced budget with
  no long term dependency on general balances"; the Evolve programme savings are a 4-column
  (2025-26..2028-29) × 4-row grid with no quotable single-sentence headline gap. Legacy
  £23.69m/£21.32m were fabricated 'derived from RA' (absurd for £25m net service). Stripped.
- **Breckland ended mid-rich**: KEEPS chief_executive (Tier-4 .gov.uk news, O'Mahony — verified
  Apr 2026 DRO), council_leader (Tier-3 SoA p5, Chapman-Allen — verified Feb 2026 Full Council),
  chief_executive_salary (£143,925 PP 2025-26 + SoA Note 20 corroboration), total_allowances_cost
  (£520k SoA Note 19). STRIPS councillor_basic_allowance/leader_allowance (un-archivable scheme),
  budget_gap/savings_target (balanced MTFS), salary_bands (image-only), + Bradford strip-list.

### Batch-46-2 / Bromsgrove (2026-06-16) — the reserves trap's NASTIEST variant: the CORRECT GF figure exceeds the stale reference → strip, don't correct

- **Reserves trap, TWELFTH council in a row — and the first where the right answer is to STRIP,
  not re-point.** Legacy `reserves 9,970,000` was *exactly* the parsed-reserves.csv RA Part 2
  reference. Bromsgrove's MIRS (p16) is the clean pure-GF shape: "Balance as at 31 March 2025 —
  General Fund Balance 13,381 / Earmarked General Fund Reserves 11,266 / Total GF Balance 24,647
  / … Total Usable 25,191", confirmed by the Balance Sheet (p28), the narrative (p60: "a General
  Fund Balance of £13.381m") AND the MTFS §3.25 (Jan 2026: "General Fund Balances of £13.38m").
  So the correct GF balance is unambiguously **£13.381m**. BUT — unlike Babergh/Basildon/Boston/
  Broadland where the correct GF figure was *smaller* than the usable reference — here the correct
  GF (£13.381m) **EXCEEDS** the stale RA reference (£9.97m) by >10%, which trips spot-check
  `reserves_exceeds_total` (a NON-suppressible error: `reserves <= refPounds*1.1 = 10,967,000`,
  no allowlist in spot-check.mjs). Shipping £13.381m works around the gate (forbidden);
  shipping £9.97m re-asserts the wrong-scope reference. **No third option passes honestly → STRIP**
  (the Wakefield/Doncaster `INTENTIONAL_REMOVALS|reserves` precedent: "SoA GF exceeds RA usable
  reference, semantics ambiguous"). Rule: when the correct GF figure exceeds the stale RA Part 2
  reference, reserves is unshippable under the current validator — strip + watch item, don't
  force-fit either number. (03-extract's auto top-candidate was the wrong £13,520k EFA
  funding-basis closing balance — the accounting-basis MIRS figure 13,381 ≠ the funding-basis EFA
  figure 13,520; read the excerpt.)
- **The brief's CE name was stale and the live check caught it (Basildon lesson again).** Brief +
  legacy TS said "Kevin Dicks (Shared with Redditch)"; the real CE is **John Leach** (appointed
  22 Jan 2025). The SoA does NOT name the CE in text (certification signed by the Deputy CE/S151;
  AGS signature lines blank), so ground the CE in the council's **single-management structure
  chart** (`/media/…/rbc-bdc-single-management-april-2025.pdf` p1: "Chief Executive (Head of Paid
  Service) — John Leach"). Verified current 3 ways (April + Dec 2025 charts + "J Leach Chief
  Executive" signing the 2024-25 allowances notice). NOT a deputy (Deputy CE/S151 is a separate
  box). For shared-management districts whose SoA omits CE names, the joint single-management
  chart is the cleanest Tier-3 CE source.
- **Shared 50/50 CE: the published SCALE is the salary, the 50% is the cost-share — don't confuse
  them (the inverse of Broadland).** Bromsgrove's Pay Policy p4 table: "Chief Executive 100%
  145,807 153,750 3 50%" with a column literally headed "Cost to Bromsgrove District Council 50%".
  The CE earns the full £153,750 (scale top); the 50% is how the *bill* is split with Redditch,
  not a different salary. `chief_executive_salary` = the full £153,750 (proven paid: SoA Note B10
  shows actual 2024/25 £179,456 incl. election fees > scale top — Breckland/Ashford precedent).
  Contrast Broadland, where the joint MD's FULL salary sat in BDC's own SoA because the postholder
  was a BDC employee. Both shapes ship the FULL salary; the difference is just where it's published.
- **total_allowances_cost: prefer the SoA Note published TOTAL over a per-member component-sum.**
  Legacy 265,249 was the sum of the per-member Notice columns (169,682.88 + 93,990.99 + 1,575.21 =
  265,249.08) — a derived value that appears NOWHERE verbatim (fails §3 + screenshot-parity). The
  SoA Note B7 publishes a single "Total 268 223" (£000) → ship £268,000. When a per-member notice
  and the SoA both exist, the SoA's single published total is the §3-clean figure.
- **budget_gap/savings_target: correct fabrications to the MTFS verbatim figures (Basildon
  precedent).** Legacy £13.601m/£12.2409m were fabricated 'derived from RA' (~10x too big). The
  archived MTFS 2026/27-2028/29 (Cabinet 7 Jan 2026) carries both verbatim: "A deficit balance of
  £1.03m in 2026/27 budget as a start-point position" (p6) and "The total savings target for the
  year is £1.213m" (p8). These are provenance-anchor keys for mtfs_deficit/savings_achieved display
  siblings (absent → don't render → ux-audit 0/0), but correcting them to true archived figures
  beats stripping when the MTFS has quotable sentences.
- **Bromsgrove fetch profile**: `www.bromsgrove.gov.uk/media/` fully open (Chrome UA, 200,
  application/pdf). MTFS on `moderngovwebpublic.bromsgrove.gov.uk/documents/sNNNNN/` 403s direct
  bots but fetched via the ladder's wayback-snapshot step (immutable sNNNNN attachment — Arun/
  Bolsover pattern, not the living-slot trap). Budget block arrived at ZERO Tier-1 drift (no
  re-sync needed — first Batch-44/45/46 district that didn't need a budget re-sync). population.ts
  corrected 100,400 → 101,685.
- **Bromsgrove ended rich**: KEEPS chief_executive (Tier-3 mgmt chart, John Leach), council_leader
  (Tier-4 news, Karen May), chief_executive_salary (£153,750 Pay Policy), councillor_basic_allowance
  (£5,826) + leader_allowance (£17,478) (Members' Scheme 2025-26), total_allowances_cost (£268k SoA
  Note B7), budget_gap (£1.03m) + savings_target (£1.213m) (MTFS). STRIPS reserves (correct GF
  exceeds stale reference → no-force-fit), salary_bands (joint pool), + Bradford strip-list.

### Batch-46-3 / Broxbourne (2026-06-16) — both personnel scalars wrong (1 fabricated, 1 stale); the AGS grounds both; XLSX-only allowance must STRIP (gate-hidden), not ship

- **Reserves trap, THIRTEENTH council in a row — clean smaller-than-reference variant.** Legacy
  `reserves 28,763,000` was *exactly* the parsed-reserves.csv RA Part 2 total-usable reference. The
  SoA Note 6 (p25) states the pure GF figure in ONE quotable line: "the Council also has a General
  Fund Reserve of £6,572k … which results in total usable revenue reserves of £48,387k" (Narrative
  p6: "general fund balance is £6.6 million"). £6.572m << £28.763m ref → passes spot-check cleanly
  (Babergh/Basildon/Boston/Broadland shape — NOT the Bromsgrove exceeds-reference strip). 03-extract's
  auto top-candidate was the wrong £16,133k "Contribution to General Fund Reserve" movement line, and
  it MIS-PARSED the £6,572k as "572000" (dropped the leading 6 across the column gap) — read the
  excerpt, hand-author the value + excerpt when the parser splits a figure.
- **Both personnel scalars were wrong, in two different ways, and the SoA does NOT name the CE.**
  Legacy CE "Amanda Maybury" matched NO Broxbourne publication (fabricated/legacy); legacy Leader
  "Cllr Lewis Sherwin (Interim)" was stale AND contradicted the legacy cabinet[0] (which already said
  Corina Gander). The SoA is certified by the **Deputy** Chief Executive (S151) and never names the CE
  in text (deputy-CE trap live) — so BOTH names come from the **AGS signature page** (p8: "J T Stack /
  Chief Executive" + "Cllr C Gander / Leader of the Council"). One PNG grounds two fields. CE Jeff
  Stack verified current (CE since 2013, LinkedIn + Companies House + e-claim directive); NOT a deputy
  (org chart "Chief Exec" box distinct from "Deputy CE", and the chart has NO names — structure only).
  Leader Corina Gander verified RETAINED after the 7 May 2026 election (Conservatives kept control) —
  the inverse of the B&D/Basingstoke post-election NOC-strip: control retained → keep, don't strip.
  Lesson reinforced (Basildon/Bromsgrove): treat EVERY legacy personnel scalar as suspect; the AGS
  signature page is the most reliable district CE+Leader source when the SoA omits the CE.
- **XLSX-only councillor_basic_allowance → STRIP (it would be gate-hidden), don't ship.** The current
  rate (£6,638.47) is published ONLY in the Allowances-Paid-2025-26 **XLSX** — no PDF/HTML page form.
  The proof engine's `resolveArchive` only resolves `.pdf/.html/.htm/.csv` (NOT `.xlsx`), so a field
  cited to the XLSX (even with a matching sha256 in `_meta.json`) reports UNPROVEN → it is NOT added to
  PROVEN_FIELDS → default-deny hides it → the number never renders. Shipping it = a permanently
  gate-hidden value (pointless). The SoA Note 26 publishes only the allowances TOTAL, not the
  per-member rate. So STRIP with a watch item (reinstate from an archivable Members' Allowances SCHEME
  PDF). This extends the Basildon "catalogue-URL → strip" rule: a fingerprinted-but-unrenderable
  spreadsheet source is also a strip, for the proof-gate reason. (NB: stripping it bumped Broxbourne
  from 🟡-with-1-unproven to fully EVIDENCE-CLEAN — the proof engine rewards removing unverifiable
  claims.) — Possible future fix: teach `resolveArchive` + `render-csv-evidence` to render a row PNG
  from an XLSX (xlsx→csv→PNG) so spreadsheet rates become Tier-3-renderable; out of scope this session.
- **chief_executive_salary: audited SoA Note 27 "Salary" beats the Tier-4 transparency-page figure.**
  The council's live transparency page states "Chief Executive £117,689" (a pay-multiple basis, no
  year, Tier-4 HTML, no fingerprint/PNG); the SoA Note 27 (p43) shows the audited Salary column
  £136,508 (2024/25), with Expenses/Fees £109 and pension £25,940 in SEPARATE columns (so the £136,508
  is salary, not a fee-inflated package). Ship the Tier-3 fingerprintable audited figure over the
  Tier-4 unfingerprintable HTML scrape, titled "Note 27 Officers' Remuneration … Salary". Watch: the
  two bases disagree (£117,689 vs £136,508) — reconcile if a single authoritative scale is published.
- **total_allowances_cost: SoA Note 26 "Balance at 31 March" is the clean published total.** Legacy
  £289,000 was the 2023/24 balance (stale by one year); the 2024/25 "Balance at 31 March" is £325k
  (allowances incl NI £323k + expenses £2k). Prefer the SoA Note published total (Bromsgrove rule).
- **salary_bands were stale by exactly one year — the legacy column WAS the SoA's prior-year column.**
  Legacy 11/4/5/2/1/1 (total 24) matched the SoA Note 27 **2023/24** column exactly; the current
  **2024/25** column is 16/4/4/2/2 (total 28). Always check which column the legacy counts came from.
- **budget_gap/savings_target STRIP (balanced budget, no quotable gap).** Legacy £14.678m/£13.210m were
  fabricated 'derived from RA' (absurd for a £17.16m-service district). The archived 2026/27 GF
  Budget-setting report (ModernGov s9691; 403 to bots → SavePageNow + Wayback ladder, immutable
  attachment) presents a BALANCED budget — cost increases (+£2.1m services, £605k pay, £1.2m BEST
  uplift) funded by council tax + fees + reserves; no headline gap. The full MTFS 2026/27-2030/31 is a
  separate doc. No-force-fit (Bolsover/Boston/Breckland). NB: it also flags Hertfordshire LGR — the
  council is expected to be abolished in 2028 (re-home the dataset to the successor unitary then).
- **Broxbourne fetch profile**: `www.broxbourne.gov.uk/downloads/file/<id>/` serves PDFs + XLSX
  directly to a Chrome UA (HTTP 200, no WAF); ModernGov portal 403s bots (irrelevant — every finance
  doc is in the council's own download store). CDX sweep found nothing (origin not in IA recent index);
  document discovery was trivial off the live finance / transparency / members-allowances landing pages
  (the transparency-information/7 HTML page is the CE-pay disclosure, links the org-chart + SoA PDFs).
- **Broxbourne ended rich**: KEEPS chief_executive (Tier-3 AGS p8, Jeff Stack), council_leader (Tier-3
  AGS p8, Cllr Corina Gander), chief_executive_salary (£136,508 SoA Note 27), reserves (£6.572m SoA
  Note 6), total_allowances_cost (£325k SoA Note 26), salary_bands (2024/25 SoA Note 27), documents.
  STRIPS councillor_basic_allowance (XLSX-only → gate-hidden), budget_gap/savings_target (balanced
  budget), cabinet, councillor_allowances_detail, + Bradford strip-list. 6 Tier-3 PROVEN, evidence-clean.
