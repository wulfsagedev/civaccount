# CivAccount

Making UK council budget data accessible and easy to understand for everyone.

## What is CivAccount?

CivAccount is a free, open-source tool that helps UK residents understand how their local council spends money. It displays budget breakdowns, council tax information, and performance metrics for 324+ councils across England.

**Not affiliated with UK government** - This is an independent project using publicly available data.

## Features

- Council tax breakdowns by band (A-H)
- Budget allocation by service area
- Year-on-year comparisons
- National insights and comparisons
- Fair groupings by council type
- WCAG 2.1 AA accessible
- Dark mode support

## Tech Stack

- **Framework**: Next.js 16 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **UI**: shadcn/ui + Radix UI
- **Deployment**: Vercel

## Getting Started

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

## Data Sources

All data comes from official UK government sources:

- [Council Tax Levels 2025-26](https://www.gov.uk/government/statistics/council-tax-levels-set-by-local-authorities-in-england-2025-to-2026)
- [Revenue Expenditure & Financing](https://www.gov.uk/government/collections/local-authority-revenue-expenditure-and-financing)
- [ONS Population Estimates](https://www.ons.gov.uk/peoplepopulationandcommunity/populationandmigration/populationestimates)

## License

MIT License - see [LICENSE](LICENSE) for details.

## Author

Made by [Owen Fisher](https://owenfisher.co)
