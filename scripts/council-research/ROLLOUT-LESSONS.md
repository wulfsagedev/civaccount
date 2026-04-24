# Rollout lessons — continuous self-learning log

**Living document. Every batch appends here.** When a new rollout hits a
surprise — a fetch that fails, a reserves figure that validates wrong, a
spec mistake — write it down so the next batch doesn't repeat it.

Read this BEFORE starting a new batch.

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
