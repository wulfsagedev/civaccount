# CivAccount

See exactly where your council tax goes — for all 317 English councils.

**[civaccount.co.uk](https://www.civaccount.co.uk)**

## What is CivAccount?

CivAccount is a free tool that makes council budget data accessible and easy to understand. It shows how much you pay, where the money goes, who runs your council, and how they compare to others — all sourced from official .gov.uk data.

Not affiliated with any UK council or government body. This is an independent project using publicly available data.

## V3 — What's new (April 2026)

- **Head-to-head comparisons** — Compare any two councils side by side on tax, budget, spending, and leadership
- **Insight rankings** — Cheapest and most expensive council tax, biggest increases, CEO salary league table
- **Open data downloads** — Full dataset for all 317 councils in CSV and JSON
- **4 plain-English guides** — Council tax, spending, leadership, and local democracy
- **Town Hall** — Vote on how your council should spend money, propose ideas, reach milestones
- **Embeddable widgets** — Council tax cards for external sites
- **SEO infrastructure** — FAQPage, Article, Dataset, and BreadcrumbList schema across all pages

## Features

- Council tax by band (A-H) with 5-year history
- Budget breakdown by 10 service categories
- CEO salary, councillor allowances, and salary bands
- Top 20 suppliers per council
- Financial health (reserves, savings, budget gaps)
- Performance KPIs and service outcomes
- Cabinet members and leadership
- National insights and comparisons
- Related councils with compare links
- Dark mode
- WCAG 2.1 AA accessible
- Designed for 70+ year olds on mobile (44px tap targets, plain English)

## Tech Stack

- **Framework**: Next.js 16 (App Router, Turbopack)
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **UI**: shadcn/ui + Radix UI
- **Database**: Supabase (auth + civic participation)
- **Deployment**: Vercel
- **Charts**: Pure CSS (no charting library)

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project Structure

```
src/
├── app/                        # Next.js App Router
│   ├── council/[slug]/         # 317 council dashboards
│   ├── insights/               # National insights + sub-pages
│   ├── compare/                # Multi-council + head-to-head comparisons
│   ├── guide/                  # Pillar guide pages
│   ├── data/                   # Open data downloads
│   ├── townhall/               # Civic participation hub
│   ├── embed/[slug]/           # Embeddable widgets
│   └── api/v1/                 # REST API
├── components/
│   ├── dashboard/              # 10 dashboard card components
│   ├── proposals/              # Town Hall components
│   └── ui/                     # shadcn/ui primitives
├── data/councils/              # Static data for 317 councils
├── lib/                        # Utilities, structured data, comparisons
└── context/                    # React Context (council, auth)
```

## Data

317 councils. 47 field groups each. 100% from .gov.uk sources.

- [Council Tax 2025-26](https://www.gov.uk/government/statistics/council-tax-levels-set-by-local-authorities-in-england-2025-to-2026)
- [Revenue Expenditure](https://www.gov.uk/government/collections/local-authority-revenue-expenditure-and-financing)
- [ONS Population Estimates](https://www.ons.gov.uk/peoplepopulationandcommunity/populationandmigration/populationestimates)
- Individual council .gov.uk websites

Download the full dataset: [civaccount.co.uk/data](https://www.civaccount.co.uk/data)

## API

```
GET /api/v1/councils              # List all councils
GET /api/v1/councils/kent         # Single council
GET /api/v1/download?format=csv   # Full dataset (CSV)
GET /api/v1/download?format=json  # Full dataset (JSON)
```

Rate limited: 100 req/min (list), 10 req/min (downloads).

## License

**Dual license:**

- **Application code** — MIT License (use, modify, distribute freely)
- **Compiled dataset** (`src/data/councils/`) — CivAccount Data License (view and reference with attribution; no bulk copying, redistribution, or competing products)

See [LICENSE](LICENSE) and [DATA-LICENSE](DATA-LICENSE) for full terms.

The underlying raw government data is Crown Copyright under the [Open Government Licence v3.0](https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/).

## Author

Made by [Owen Fisher](https://owenfisher.co)
