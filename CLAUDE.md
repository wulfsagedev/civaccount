# CLAUDE.md - CivAccount Project Guide

## Project Overview

CivAccount is a UK council budget transparency application that helps citizens understand how their local council spends money. It displays budget breakdowns, council tax information, and performance metrics for 324+ UK councils.

## Tech Stack

- **Framework**: Next.js 16.1.2 with App Router
- **React**: 19.1.0
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 4 with CSS variables (oklch color space)
- **UI Components**: shadcn/ui (New York style) with Radix UI primitives
- **Icons**: lucide-react

## Commands

```bash
npm run dev      # Start development server (Turbopack, port 3000)
npm run build    # Production build
npm start        # Start production server
npm run lint     # Run ESLint
```

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── page.tsx           # Main dashboard / homepage
│   ├── layout.tsx         # Root layout with providers
│   ├── globals.css        # Tailwind config, CSS variables, theme
│   ├── icon.tsx           # Dynamic favicon
│   ├── api/               # API routes
│   ├── about/             # About page
│   ├── accessibility/     # Accessibility standards page
│   ├── insights/          # National insights page
│   ├── license/           # Open source license page
│   ├── privacy/           # Privacy policy page
│   ├── roadmap/           # Product roadmap page
│   ├── terms/             # Terms of use page
│   └── updates/           # Version history / changelog
├── components/            # React components
│   ├── dashboard/         # Dashboard tab components
│   └── ui/                # shadcn/ui primitives + shared components
├── context/               # React Context (CouncilContext)
├── lib/                   # Utilities (cn helper, constants)
└── data/                  # Static data (councils.ts, population.ts)
```

## Design System

### Color Tokens (use these, don't add new colors)

| Token | Usage |
|-------|-------|
| `text-foreground` | Primary text |
| `text-muted-foreground` | Secondary/helper text |
| `bg-background` | Page background |
| `bg-card` | Card backgrounds |
| `bg-muted` | Subtle backgrounds, hover states |
| `bg-accent` | Interactive hover states |
| `bg-primary` | Primary actions, highlights |
| `text-primary` | Primary colored text |
| `border-border` | Default borders |
| `border-border/40` | Subtle card borders |

### Spacing Scale (8pt system)

| Class | Size | Usage |
|-------|------|-------|
| `gap-1`, `p-1` | 4px | Micro adjustments |
| `gap-2`, `p-2` | 8px | Tight spacing |
| `gap-3`, `p-3` | 12px | Compact |
| `gap-4`, `p-4` | 16px | Standard |
| `gap-5`, `p-5` | 20px | Comfortable |
| `gap-6`, `p-6` | 24px | Generous |
| `gap-8`, `p-8` | 32px | Section gaps |

### Border Radius

| Class | Size | Usage |
|-------|------|-------|
| `rounded-md` | 8px | Buttons, inputs |
| `rounded-lg` | 12px | Small cards |
| `rounded-xl` | 12px | **Standard cards and inputs** (use this) |
| `rounded-2xl` | 16px | Featured elements only |

### Typography

| Element | Classes |
|---------|---------|
| Page title | `text-2xl sm:text-3xl font-bold` |
| Section title | `text-lg sm:text-xl font-semibold` |
| Card title | `text-base sm:text-lg font-semibold` |
| Body text | `text-sm sm:text-base` |
| Helper text | `text-sm text-muted-foreground` |
| Small labels | `text-sm` |

### Responsive Breakpoints

| Breakpoint | Width | Usage |
|------------|-------|-------|
| Default | <640px | Mobile |
| `sm:` | 640px+ | Tablet/small desktop |
| `lg:` | 1024px+ | Desktop |

### Card Styling (MUST use consistently)

```typescript
// Import from lib/utils
import { CARD_STYLES, CARD_PADDING, CARD_HEADER_PADDING } from '@/lib/utils';

// Standard card
<Card className={CARD_STYLES}>
  <CardContent className={CARD_PADDING}>
    ...
  </CardContent>
</Card>

// Card with header
<Card className={CARD_STYLES}>
  <CardHeader className={CARD_HEADER_PADDING}>
    ...
  </CardHeader>
  <CardContent className="px-5 pb-5 sm:px-6 sm:pb-6">
    ...
  </CardContent>
</Card>
```

**CARD_STYLES** = `"border border-border/40 bg-card shadow-sm rounded-xl"`
**CARD_PADDING** = `"p-5 sm:p-6"`
**CARD_HEADER_PADDING** = `"p-5 sm:p-6 pb-4"`

### Shared Components (MUST use instead of duplicating)

#### PulsingDot
For "live" or "new" indicators:
```typescript
import { PulsingDot } from '@/components/ui/pulsing-dot';

<PulsingDot />           // Small green dot (default)
<PulsingDot size="md" /> // Medium green dot
```

#### CouncilResultItem
For council search/selection results:
```typescript
import { CouncilResultItem } from '@/components/ui/council-result-item';

<CouncilResultItem
  council={council}
  isHighlighted={index === highlightedIndex}
  onSelect={handleSelect}
  variant="search"   // or "homepage" or "dashboard"
  showBadge={true}   // show Band D badge
/>
```

### Constants (use instead of magic numbers)

```typescript
import { SEARCH_RESULT_LIMIT, SELECTOR_RESULT_LIMIT, formatNumber, formatPercent } from '@/lib/utils';

SEARCH_RESULT_LIMIT  // 10 - for search overlays
SELECTOR_RESULT_LIMIT // 50 - for council selector lists

formatNumber(1234.56, { decimals: 2 })  // "1,234.56"
formatPercent(45.5)                      // "45.5%"
```

## Key Patterns

### State Management
- **CouncilContext** (`src/context/CouncilContext.tsx`): Global state for selected council
- **useCouncil()** hook: Access selected council anywhere
- **localStorage**: Persists council selection across sessions

### Component Conventions
- All interactive components use `'use client'` directive
- Components use shadcn/ui primitives from `@/components/ui`
- Dashboard components are in `src/components/dashboard/`
- Import paths use `@/` alias (configured in tsconfig.json)
- Use `useCallback` for event handlers passed to children
- Use `useMemo` for expensive calculations, NOT for side effects (use `useEffect` instead)

### Data Layer
- All council data is static in `src/data/councils.ts`
- Budget amounts stored in thousands (multiply by 1000 for display)
- Population data in `src/data/population.ts`
- Helper functions: `formatBudget()`, `formatCurrency()`, `calculateBands()`

### Event Patterns
- Feedback modal uses custom event: `document.dispatchEvent(new CustomEvent('open-feedback'))`
- Keyboard shortcuts: `F` key opens search overlay

## Council Types

| Code | Name | Services |
|------|------|----------|
| SC | County Council | Education, social care, roads (two-tier upper) |
| SD | District Council | Bins, planning, housing (two-tier lower) |
| UA | Unitary Authority | All services |
| MD | Metropolitan District | All services |
| LB | London Borough | All services |

### Comparable Groups (for fair comparisons)
When comparing council tax rates, group by service scope:

1. **All-in-one** (UA, MD, LB): Provide all services - directly comparable
2. **District councils** (SD): Only compare to other districts - residents also pay county tax
3. **County councils** (SC): Only compare to other counties - residents also pay district tax

This grouping is used in the Insights page to avoid misleading comparisons.

## Data Sources

- Council Tax: GOV.UK Council Tax 2025-26
- Budgets: Revenue Expenditure 2024-25
- Population: ONS Mid-2024 Population Estimates

## Adding New Features

### New Dashboard Tab
1. Create component in `src/components/dashboard/`
2. Import and add to tabs in `src/app/page.tsx`
3. Use `useCouncil()` to access selected council
4. Use `CARD_STYLES` for card containers

### New UI Component
```bash
npx shadcn@latest add [component-name]
```
Components are added to `src/components/ui/`

### New Page
Create `src/app/[route]/page.tsx` - automatically routed

## Accessibility Requirements (WCAG 2.1 AA)

CivAccount aims to exceed GOV.UK accessibility standards. Key requirements:

### Visual
- Minimum 4.5:1 contrast ratio for text (enforced via oklch colors)
- Minimum 44px tap targets on mobile (enforced in globals.css)
- Focus states use 3px solid ring with 2px offset (excludes inputs)
- No blue focus outline on form inputs (custom border-based focus)
- Input focus uses border color change only (no shape/radius change)

### Navigation
- Skip link to main content (`#main-content`) on all pages
- All pages have `id="main-content"` on main element
- Keyboard shortcuts: `F` key opens search, `Esc` closes overlays
- Logical tab order throughout

### Motion & Preferences
- `prefers-reduced-motion`: Disables animations
- `prefers-contrast: more`: Enhanced borders and stronger text
- Dark mode uses Linear-style layered elevation surfaces

### Semantic HTML
- Use proper heading hierarchy (h1 → h2 → h3)
- Include aria-labels on icon-only buttons
- Use semantic landmarks (main, nav, footer)

## Common Tasks

### Format currency
```typescript
import { formatCurrency } from '@/data/councils';
formatCurrency(1234.56, { decimals: 2 }); // "£1,234.56"
```

### Format budget (from thousands)
```typescript
import { formatBudget } from '@/data/councils';
formatBudget(1500); // "£1.5m"
```

### Format numbers consistently
```typescript
import { formatNumber, formatPercent } from '@/lib/utils';
formatNumber(1234.56, { decimals: 2 }); // "1,234.56"
formatPercent(45.678, 1);               // "45.7%"
```

### Get council population
```typescript
import { getCouncilPopulation } from '@/data/councils';
const pop = getCouncilPopulation("Kent"); // number or null
```

### Calculate all tax bands from Band D
```typescript
import { calculateBands } from '@/data/councils';
const bands = calculateBands(2000); // { A: 1333.33, B: 1555.56, ... H: 4000 }
```

## Do NOT

- Add new color tokens - use existing design system colors
- Create inline styles - use Tailwind classes
- Duplicate card styling - use `CARD_STYLES` constant
- Use `useMemo` for side effects - use `useEffect`
- Hardcode result limits - use `SEARCH_RESULT_LIMIT` or `SELECTOR_RESULT_LIMIT`
- Duplicate pulsing dot animation - use `<PulsingDot />`
- Duplicate council result rendering - use `<CouncilResultItem />`
- Add sidebar components (project doesn't use sidebars)
