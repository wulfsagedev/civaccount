# Changelog

## April 2026 — Moat infrastructure

Ships every technical piece from [MOAT.md](MOAT.md) — four new public routes designed to turn first-mover advantage into a compounding moat through distribution, data-change signalling and coverage expansion.

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
