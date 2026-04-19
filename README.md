<div align="center">

# CivAccount

**See exactly where your council tax goes — for all 317 English councils.**

[**civaccount.co.uk**](https://www.civaccount.co.uk) · Free · Independent · [.gov.uk](https://www.gov.uk) data only

[![Live](https://img.shields.io/website?url=https%3A%2F%2Fwww.civaccount.co.uk&style=flat-square&label=live&color=22c55e)](https://www.civaccount.co.uk) &nbsp; [![License: MIT](https://img.shields.io/badge/code-MIT-blue.svg?style=flat-square)](LICENSE) &nbsp; [![Data licence](https://img.shields.io/badge/data-CivAccount%20Data%20License-orange?style=flat-square)](DATA-LICENSE) &nbsp; [![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)](https://nextjs.org/) &nbsp; [![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

</div>

---

## What it does

CivAccount turns 15,000+ scattered data points across 317 English councils' budget documents into one clean, accessible website. Look up your council, see your tax bill, see where every pound goes, compare against neighbours. Every figure links back to its `.gov.uk` source.

Built for UK residents who pay council tax and want to know what happens to their money.

## Highlights

- **317 council dashboards** — budget breakdown, tax bands, CEO salary, suppliers, financial health
- **[Head-to-head compare](https://www.civaccount.co.uk/compare)** — any two councils, side by side
- **[National insights](https://www.civaccount.co.uk/insights)** — rankings, league tables, postcode lottery data
- **[4 plain-English guides](https://www.civaccount.co.uk/guide/council-tax)** — how council tax works, how spending is structured, who runs your council, how to influence decisions
- **[Town Hall](https://www.civaccount.co.uk/townhall)** — residents propose and vote on how their council should spend money
- **[Developer API](https://www.civaccount.co.uk/developers)** — free JSON per-council endpoints + embeddable iframe widgets, no key, 100 req/min
- **[Data provenance](https://www.civaccount.co.uk/council/kent/provenance)** — per-field source URLs for every council (317 pages)
- **WCAG 2.1 AA accessible**, designed for 44px tap targets + plain English

## Tech stack

Next.js 16 (App Router, Turbopack) · React 19 · TypeScript 5 · Tailwind CSS 4 · shadcn/ui · Supabase (auth + Town Hall) · Vercel

## Architecture

The compiled dataset lives in a private repository that's fetched at build time using a token. This public repo contains the application code, a small fixture of 3 councils for local development, and automation scripts.

```
civaccount/                      # ← this repo (public, MIT code)
├── src/
│   ├── app/                     # Next.js App Router
│   ├── components/              # UI + dashboard cards
│   ├── data/
│   │   ├── councils-fixtures/   # 3-council fixture for local dev
│   │   └── councils/            # Private submodule (.gitignored)
│   └── lib/
├── scripts/                     # Build + validation scripts
└── public/                      # Static assets, llms.txt, robots.txt
```

## Running locally

```bash
git clone https://github.com/wulfsagedev/civaccount.git
cd civaccount
npm install
npm run dev
```

By default you'll see the site running against the 3-council fixture (Kent, Birmingham, Westminster). All pages work; non-fixture councils show 404 in dev.

Open [http://localhost:3000](http://localhost:3000).

## Data sources

Everything comes from UK government sources — no third-party aggregators:

- [Council Tax 2025-26](https://www.gov.uk/government/statistics/council-tax-levels-set-by-local-authorities-in-england-2025-to-2026) (GOV.UK / MHCLG)
- [Revenue Expenditure](https://www.gov.uk/government/collections/local-authority-revenue-expenditure-and-financing) (GOV.UK / MHCLG)
- [ONS Population Estimates](https://www.ons.gov.uk/peoplepopulationandcommunity/populationandmigration/populationestimates) (Mid-2024)
- Individual council `.gov.uk` websites (Pay Policy Statements, Members' Allowances schemes, budget documents)
- [DEFRA Local Authority Waste Statistics](https://www.gov.uk/government/statistical-data-sets/env18-local-authority-collected-waste-annual-results-tables)
- [Local Government Boundary Commission for England](https://www.lgbce.org.uk/)

Full methodology: [civaccount.co.uk/methodology](https://www.civaccount.co.uk/methodology)

## API

Free, public, no key required.

```
GET /api/v1/councils/[slug]        # Full record for one council
GET /api/v1/councils?search=kent   # Filtered search (slim records, max 20)
GET /api/v1/diffs?since=2026-04-01 # Data-change feed
```

Full docs + embed snippets: [civaccount.co.uk/developers](https://www.civaccount.co.uk/developers)

## Licence

Dual licence:

- **Code** — [MIT](LICENSE). Use, modify, distribute.
- **Compiled dataset** — [CivAccount Data Licence](DATA-LICENSE). View and cite individual figures with attribution. No bulk copying, redistribution, or competing products.

The underlying raw government data is Crown Copyright under the [Open Government Licence v3.0](https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/) and freely available from GOV.UK.

## Contributing

Bug reports and fixes to the application code are welcome — open an issue or pull request. For the data layer (adding councils, refreshing figures, enrichment), see [CONTRIBUTING.md](CONTRIBUTING.md).

## Not affiliated

CivAccount is an independent civic-tech project. Not affiliated with any UK council, government body, political party, or commercial data aggregator.

---

<div align="center">

Made by [wulfsage](https://wulfsage.com) · [civaccount.co.uk](https://www.civaccount.co.uk)

</div>
