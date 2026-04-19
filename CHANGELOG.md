# Changelog

## 2026-04-19 — Security hardening (Vercel April 2026 incident response)

Full-stack SecOps pass in response to the [Vercel April 2026 security
bulletin](https://vercel.com/kb/bulletin/vercel-april-2026-security-incident).
Vercel disclosed unauthorised access to internal systems and advised
customers to review environment variables, enable the Sensitive env-var
feature, and rotate secrets. This changelog entry records the code-side
work; the vendor-side rotation checklist lives in
[`ROTATION-RUNBOOK.md`](./ROTATION-RUNBOOK.md) and needs to be worked
through in the Vercel dashboard.

### Documentation
- **New:** [`SECURITY.md`](./SECURITY.md) — vulnerability disclosure policy,
  reporting channels, scope, and safe-harbour language.
- **New:** [`ROTATION-RUNBOOK.md`](./ROTATION-RUNBOOK.md) — per-secret
  step-by-step for `CIVACCOUNT_DATA_TOKEN`, `STRIPE_SECRET_KEY`,
  `UPSTASH_REDIS_REST_TOKEN`, Supabase JWT secret, and the Vercel-incident
  one-time checklist.

### HTTP security headers ([`next.config.ts`](./next.config.ts))
- **CSP hardened:** added `object-src 'none'`, `manifest-src`, `worker-src`,
  explicit `frame-src` for Stripe Checkout, `upgrade-insecure-requests`,
  Supabase realtime WebSocket + Vitals to `connect-src`. Form-action
  allow-list now includes `https://checkout.stripe.com`.
- **New headers:** `Cross-Origin-Opener-Policy: same-origin`,
  `X-Permitted-Cross-Domain-Policies: none`, hugely expanded
  `Permissions-Policy` denying every unused capability (accelerometer,
  autoplay, fullscreen, gyroscope, HID, idle-detection, interest-cohort,
  keyboard-map, magnetometer, midi, otp-credentials, picture-in-picture,
  screen-wake-lock, serial, storage-access, sync-xhr, usb, web-share,
  window-management, xr-spatial-tracking — the full set).
- **Embed pages:** removed invalid `X-Frame-Options: ALLOWALL` (silently
  ignored by browsers); framing policy is now expressed via
  `frame-ancestors *` in CSP only.
- **OG share endpoints:** added `Cross-Origin-Resource-Policy: cross-origin`
  so third-party embeds load without triggering COEP rejections.
- `poweredByHeader: false` — removes the `X-Powered-By: Next.js`
  framework fingerprint.

### CSRF / origin validation
- **New:** [`src/lib/security.ts`](./src/lib/security.ts) — `checkOrigin()`
  and `clamp()` helpers.
- **`POST /api/checkout`:** validates Origin/Referer against an explicit
  allow-list (prod + canonical + localhost + Vercel preview regex) before
  touching Stripe. Stripe success/cancel URLs are now pinned to
  `PRODUCTION_ORIGIN` in prod — an attacker-crafted Origin header can no
  longer steer the post-payment redirect. Error logging redacted so Stripe
  request bodies aren't echoed to stdout.
- **`POST /api/feature-request`:** same Origin guard before rate-limit
  budget is spent.

### OG / share endpoints
- **`GET /api/share/stat`** and **`GET /api/share/[slug]/[type]`:** added
  IP rate-limits (30 / 60 rpm), length clamps on every query param (label,
  value, council, type, context, slug, type-path), format allow-list, and
  early rejection of oversized slugs. Defends against cheap Satori-render
  DoS via the public OG surface.

### XSS defence-in-depth — safe JSON-LD
- **New:** [`src/lib/safe-json-ld.ts`](./src/lib/safe-json-ld.ts) —
  `serializeJsonLd()` escapes `<`, `>`, `&`, U+2028 and U+2029 so a
  `</script>` substring anywhere in JSON-LD data cannot close the script
  tag early.
- Wired into **44 page/layout files** (every `<script type="application/ld+json">`
  site-wide) via a one-off migration.

### Rate limiter
- [`src/lib/rate-limit.ts`](./src/lib/rate-limit.ts): IP extraction now
  prefers `x-vercel-forwarded-for` (unspoofable on Vercel) over
  `x-forwarded-for`, with `x-real-ip` fallback and IPv6 normalisation.

### Build-time token security
- [`scripts/fetch-private-data.mjs`](./scripts/fetch-private-data.mjs):
  replaced `execSync` string concat with `spawnSync` argv (no shell
  expansion). Token is shape-validated (`ghp_` / `github_pat_`) before
  use — a malformed token is treated as "no token" without being echoed.
  Token is redacted from any git stderr/stdout before logging. Sets
  `GIT_TERMINAL_PROMPT=0` + `GIT_ASKPASS=/bin/true` so a revoked token
  can never hang a Vercel build on an interactive credential prompt.

### Supabase hardening ([`supabase/migrations/003_security_april_2026.sql`](./supabase/migrations/003_security_april_2026.sql))
- **Email leak fixed:** the previous `"Public can see basic user info"`
  RLS policy with `USING (true)` was a GDPR leak — anonymous clients could
  `SELECT email` directly from `public.users`. New policy model: RLS
  restricts by row (self only), column-level `GRANT` restricts by column
  (no email for anon). `public.user_profiles` view runs with
  `security_invoker = true` and is the only anon-readable surface.
- **`search_path` pinned** on every `SECURITY DEFINER` function
  (`update_proposal_score`, `update_comment_count`, `flag_comment`,
  `check_vote_rate_limit`, `check_proposal_rate_limit`,
  `check_comment_rate_limit`) to defeat public-schema function hijacks.
- **Display-name constraint** now rejects zero-width joiners, RTL
  overrides, and BOMs to defeat homograph username attacks.
- **Realtime publication:** `public.users` removed (if present) so email
  changes aren't broadcast on the realtime websocket.

### Secret scanning
- [`.githooks/pre-commit`](./.githooks/pre-commit): broader pattern set —
  Stripe (`sk_live_`, `sk_test_`, `rk_live_`, `rk_test_`, `whsec_`,
  `pk_live_`), GitHub (`ghp_`, `github_pat_`, `gh[souru]_`), AWS
  (`AKIA`, `ASIA`), Slack (`xoxb-`, `xoxp-`, `xoxa-`, `xoxo-`), SendGrid,
  Google (`AIza`), every common PEM private-key header. Allow-list for
  docs/runbooks/example files. Tested against a synthetic secret + an
  allow-listed doc example.
- **New:** Gitleaks CI job ([`.github/workflows/ci.yml`](./.github/workflows/ci.yml#L52-L71)) +
  allow-list at [`.github/gitleaks.toml`](./.github/gitleaks.toml). Runs
  on every push and PR, so nothing that sneaks past a local hook survives
  a PR.

### CI hardening
- [`.github/workflows/ci.yml`](./.github/workflows/ci.yml): `permissions:
  contents: read` at the workflow root (minimum GITHUB_TOKEN surface),
  every `uses:` pinned to a full commit SHA, new `secret-scan` and
  `npm-audit` jobs.
- **New:** [`.github/dependabot.yml`](./.github/dependabot.yml) — weekly
  npm + GitHub-Actions grouped PRs, security advisories always open
  their own PR immediately.

### Dependency upgrades
- `npm audit fix` applied. Closed 8 of 9 advisories including:
  - Next.js upgraded from 16.1.2 → 16.2.4 (fixes HTTP request smuggling
    in rewrites, Server Actions null-origin CSRF bypass, unbounded PPR
    resume buffer DoS, Server Component DoS, unbounded image-cache
    growth — all High severity).
  - picomatch, minimatch, qs, tar, flatted, brace-expansion, ajv —
    transitive vulns closed.
- Remaining: `xlsx` (SheetJS) prototype-pollution + ReDoS. No upstream
  fix; `xlsx` is only used from private enrichment scripts under
  `scripts/data-scripts/` (git-ignored) that never run on Vercel or in
  CI. Accepted risk, scoped to the maintainer's local machine.

### Verification
- `npx tsc --noEmit`: clean.
- `npm run lint`: clean (pre-existing warnings only).
- `npm run build` with real data: 122 routes generated, no errors.
- `scripts/fetch-private-data.mjs`: tested no-token path, malformed-token
  path (redacted prefix + length logged, no leak).
- Pre-commit hook: tested blocks synthetic `sk_live_…` and allows an
  allow-listed example in `SECURITY.md`.
- `.env.local` confirmed git-ignored, zero secret hits in history.

### Action required from the maintainer (in Vercel)
See [`ROTATION-RUNBOOK.md`](./ROTATION-RUNBOOK.md) for full steps. High
priority:
1. Rotate `CIVACCOUNT_DATA_TOKEN`, `STRIPE_SECRET_KEY`,
   `UPSTASH_REDIS_REST_TOKEN`.
2. Mark all three as **Sensitive** in Vercel env-var settings.
3. Audit Vercel team membership, deploy hooks, integrations, recent
   deployments.
4. Run the new Supabase migration (003) in the Supabase SQL Editor.

---

## April 2026 — Moat infrastructure

Ships the technical infrastructure for distribution, data-change signalling, and coverage expansion — four new public routes designed to turn first-mover advantage into durable reach.

### New pages
- **[/developers](https://www.civaccount.co.uk/developers)** — public API docs + one-line iframe embed snippets. Copy-paste code blocks for any of 317 councils, full or single-card variants. Positions CivAccount as infrastructure estate agents, local papers and mortgage tools can integrate free forever.
- **[/changelog](https://www.civaccount.co.uk/changelog)** — live data change log, server-rendered. Every year-over-year council tax move linked to its council page. Gives AI crawlers + journalists a reason to recrawl regularly.
- **[/foi](https://www.civaccount.co.uk/foi)** — archive for Freedom of Information responses. Ships with a 6-item backlog (HSF recipients, pension contributions, SEND transport per provider, councillor journey claims, agency spend, thin-supplier-list fill).
- **[/parish](https://www.civaccount.co.uk/parish)** + `/parish/[slug]` — scaffold for England's ~10,000 parish/town councils. Empty data array, pilot county to follow.

### Supporting
- `llms.txt` expanded with new sections for developers + stable API endpoints.
- Footer nav includes Developers / Change log / FOI archive.
- Sitemap covers all new routes.

### Data quality
- Parity reached **100.0%** overall by adding grant_payments for Hinckley & Bosworth, Elmbridge, Redcar & Cleveland and North East Lincolnshire (all sourced from each council's own open data).
- 4 councils remain blocked at the network layer (Amber Valley firewall, Lancaster UK-geo-fence, South Hams Cloudflare, Stockton WAF) — documented in the FOI queue.
- Honest gap notices shipped for every silent-hide path (Bill history, Leadership, Pay & allowances, Service outcomes) with `{Council}` placeholder substitution for natural copy.
- Validator warnings 165 → 127 via salary_bands sort/dedupe, population refresh to ONS Mid-2024, post-2025-election councillor counts corrected.

---

## V3.0 — April 2026

The biggest release yet. CivAccount goes from transparency tool to civic participation platform. Residents can now propose how their council should spend money, vote on ideas, and discuss with neighbours. Plus, every English council now has detailed leadership, salary, and spending data.

### Community proposals (new)
- Create proposals for any budget category — suggest how your council should spend money
- Vote on proposals from other residents (upvote/downvote with real-time scores)
- Nested comment threads with reply support (up to 3 levels deep)
- Community moderation — flag inappropriate content, auto-hidden at 3+ flags
- Draft auto-save — come back to finish your proposal within 24 hours
- Embeddable proposal widgets — share proposals on external websites via iframe
- Dynamic social media previews when sharing proposal links
- Display name system — choose how you appear to other residents

### Data coverage
- Cabinet members and leadership for all 317 councils (100% coverage)
- Chief executive salary for 316 of 317 councils (99.7%)
- Councillor basic allowance for 306 councils (96.5%)
- Top suppliers for 301 councils (95%)
- Waste and recycling destinations for all disposal authorities (100%)
- Performance data (roads, waste, housing) for every council
- Council comparison tool — compare any two councils side by side
- Budget, transparency, and councillor URLs for 93-97% of councils

---

## Week of 2026-03-13 — Phase 3 Mass Enrichment

### Overview

57 commits across a single intensive session brought data parity from **87.8% to 90.6%** across all 317 English councils. The largest single enrichment effort in the project's history, covering financial data, governance structures, and transparency URLs.

### Data Coverage (Before → After)

| Field | Before | After | Change |
|-------|--------|-------|--------|
| **Chief Executive Salary** | 17 (5%) | **316 (99.7%)** | +299 |
| **Basic Allowance** | 11 (3%) | **306 (96.5%)** | +295 |
| **Leader Allowance** | 12 (4%) | **184 (58%)** | +172 |
| **Cabinet Members** | 114 (36%) | **299 (94%)** | +185 |
| **budget_url** | 220 (69%) | **302 (95%)** | +82 |
| **councillors_url** | 260 (82%) | **294 (93%)** | +34 |
| **transparency_url** | 293 (92%) | **306 (97%)** | +13 |
| **Grant Payments** | 79 (25%) | **85 (27%)** | +6 |
| **Overall Kent Parity** | **87.8%** | **90.6%** | **+2.8%** |

### By Council Type (Current State)

| Type | Councils | Basic | CE Salary | Cabinet | budget_url |
|------|----------|-------|-----------|---------|------------|
| County | 21 | 100% | 100% | 100% | 100% |
| Districts | 164 | 100% | 100% | 89% | 95% |
| Unitary | 63 | 100% | 100% | 100% | 98% |
| Metropolitan | 36 | 100% | 100% | 100% | 86% |
| London | 33 | 100% | 100% | 100% | 97% |

### Key Achievements

#### Phase 3: Financial Data (CE Salary + Allowances)
- **CE salary coverage: 5% → 99.7%** — The breakthrough was discovering the TaxPayers' Alliance Town Hall Rich List 2025 Excel dataset, which provided 30+ CE salaries from a single download. Combined with 50+ targeted research agents scraping .gov.uk Pay Policy Statements.
- **Basic allowance: 3% → 96.5%** — Required per-council research across Members' Allowances Schemes. Used a combination of web search agents, PDF downloads, Wayback Machine cached pages, and the browse tool with headless Chromium.
- **11 councils annotated as unavailable** — Remaining gaps (East Staffordshire, Fylde, Sevenoaks, etc.) have inline code comments explaining the specific technical blocker (Cloudflare, ModernGov 403s, SSL cert issues, JS-rendered sites).

#### Cabinet/Executive Members
- **185 cabinet lists added** in a single session across all council types
- Covers Leader/Mayor, Deputy Leader, and 4-5 key portfolio holders per council
- Handles diverse governance models: traditional cabinets, elected mayors, committee systems, co-leader arrangements, executive boards
- Notable: West Northamptonshire identified as Reform UK-controlled; several councils documented as having switched from cabinet to committee systems (Bristol, Stroud, Swale, etc.)

#### URLs and Transparency Links
- **budget_url**: 69% → 95% (+82 URLs)
- **councillors_url**: 82% → 93% (+34 URLs)
- **transparency_url**: 92% → 97% (+13 URLs)

#### Grant Payments
- 8 councils added with verified itemised grant data (Bath & NE Somerset, Blackpool, Brighton & Hove, Cheshire West & Chester, Cornwall, Durham, Manchester, Barnsley)
- Grant data sourced from council transparency pages, community fund announcements, and VCSE grant CSVs

### Technical Approach

1. **Parallel agent architecture** — Up to 6 research agents running simultaneously, each covering 10-20 councils
2. **TPA Town Hall Rich List** — Single Excel dataset solved 30 CE salary gaps in one shot
3. **PDF download + local read** — Downloaded PDFs from council domains and used Claude's PDF reader to extract data locally
4. **Wayback Machine** — Used cached versions of council pages blocked by Cloudflare
5. **Browse tool** — Headless Chromium for councils blocking plain HTTP requests (limited success due to Cloudflare Enterprise)
6. **Deduplication scripts** — Automated detection and removal of duplicate property entries caused by batch insertions

### Remaining Gaps (Path to 100%)

| Field | Missing | Effort Required |
|-------|---------|-----------------|
| councillor_allowances_detail | 245 (77%) | Per-councillor payment PDFs — highest effort |
| total_allowances_cost | 244 (76%) | Statement of Accounts PDFs |
| grant_payments | 232 (73%) | Transparency data downloads (CSV/XLSX) |
| salary_bands | 215 (67%) | Statement of Accounts officer remuneration notes |
| cabinet | 18 (5%) | 18 remaining districts (final agent in progress) |
| councillors_url | 23 (7%) | Quick URL lookups |
| top_suppliers | 16 (5%) | Transparency spending data |

### Bug Fixes
- Fixed Worthing basic allowance (was £5,175 = Wyre's figure, corrected to £5,845)
- Removed ~40 duplicate property entries (budget_url, cabinet, grant_payments) caused by batch insertion scripts
- All changes verified with `npx tsc --noEmit` before each push

### Data Sources
- **TaxPayers' Alliance Town Hall Rich List 2025** — CE salaries (2023-24 Statement of Accounts data)
- **Council .gov.uk websites** — Pay Policy Statements, Members' Allowances Schemes, Constitutions
- **ModernGov democracy portals** — Cabinet membership, allowances data (blocked by Cloudflare for ~30% of councils)
- **Wayback Machine** — Cached versions of blocked council pages
- **data.gov.uk** — Some grant payment datasets
- **360Giving** — Birmingham grant data reference
