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

> **Gold Standard**: `src/components/dashboard/UnifiedDashboard.tsx`
> This is the reference implementation. All new components should match its quality.
> See "Reference Implementation: UnifiedDashboard" section below for details.

### Target Audience

**Primary users**: 70+ year olds on mobile devices (90% of traffic is mobile).

Design decisions must prioritize:
1. **Readability** - Large, clear text with high contrast
2. **Simplicity** - Plain English, short sentences, no jargon
3. **Accessibility** - WCAG 2.1 AA minimum, exceeding GOV.UK standards
4. **Touch-friendly** - 44px minimum tap targets

### Typography Scale (RIGID - use these classes)

Custom CSS classes defined in `globals.css`. Use `type-*` prefix to avoid Tailwind conflicts.

| Class | Size | Line Height | Usage |
|-------|------|-------------|-------|
| `type-display` | 40px (48px sm) | 1.1 | Hero numbers, main metrics |
| `type-metric` | 32px (40px sm) | 1.0 | Secondary metrics, large numbers |
| `type-title-1` | 28px (32px sm) | 1.15 | Page titles (h1) |
| `type-title-2` | 20px (24px sm) | 1.2 | Section titles (h2) |
| `type-title-3` | 18px | 1.25 | Card titles (h3) |
| `type-body-lg` | 18px | 1.6 | Important body text |
| `type-body` | 16px | 1.6 | Default body text |
| `type-body-sm` | 14px | 1.5 | Secondary text, descriptions |
| `type-caption` | 13px | 1.4 | Labels, metadata |
| `type-overline` | 11px | 1.4 | Eyebrow text, all-caps labels |

**Rules**:
- All numeric values use `tabular-nums` (built into display/metric classes)
- Never go below 14px for readable content (captions/overlines are decorative)
- Use `font-semibold` for headings, `font-medium` for emphasis
- **IMPORTANT**: Use `type-*` classes, NOT `text-*` (avoids Tailwind conflicts)

---

## Data Design System (UNBREAKABLE RULES)

This section defines how data is displayed. Every data card MUST follow these rules.

### 1. Data Hierarchy (ONE Primary Datum Per Card)

Every card answers ONE question. Identify the primary datum and suppress everything else.

| Level | Type Class | Weight | Usage | Example |
|-------|------------|--------|-------|---------|
| **L1** | `type-display` | — | The answer to the card's question. ONE per card maximum. | £288.45 (your bill) |
| **L2** | `type-metric` | — | Secondary totals, summaries. Use sparingly. | £2,344.65 (total bill) |
| **L3** | `type-body` | `font-semibold` | Row values in lists, table cells | £112 (per service) |
| **L4** | `type-body-sm` | `font-medium` | Labels, row names | "Environment & Streets" |
| **L5** | `type-caption` | — | Metadata, context, sources | "39%" or "Total budget: £21.3m" |

**RULE**: If two numbers in a card look equally important, the hierarchy is wrong. Fix it.

```
✅ CORRECT - Clear hierarchy:
┌────────────────────────────────────┐
│ You pay this council               │  ← L5 label
│ £288.45                            │  ← L1 (ONE primary datum)
│ Up 4.5% from last year             │  ← L5 context
└────────────────────────────────────┘

❌ WRONG - Competing emphasis:
┌────────────────────────────────────┐
│ £288.45        £2,344.65           │  ← Two L1s compete
│ This council   Total bill          │
└────────────────────────────────────┘
```

### 2. Number Formatting (Consistent, Predictable)

| Data Type | Decimals | Format | Example |
|-----------|----------|--------|---------|
| Currency (hero/primary) | 2 | `formatCurrency(x, { decimals: 2 })` | £288.45 |
| Currency (lists/rows) | 0 | `formatCurrency(x, { decimals: 0 })` | £112 |
| Currency (large budgets) | — | `formatBudget(x)` | £21.3m |
| Percentages | 0 | `{x.toFixed(0)}%` | 39% |
| Population | 0 | `x.toLocaleString('en-GB')` | 112,345 |

**RULES**:
- Hero numbers: 2 decimal places (precision matters for bills)
- List/row numbers: 0 decimal places (scanability > precision)
- Never mix formats in the same list
- Always use `tabular-nums` for number alignment

### 3. Label-Value Relationships (Spacing is Meaning)

Labels and values have a fixed spatial relationship:

```
PATTERN A: Stacked (label above value)
┌─────────────────────┐
│ You pay this council│  ← type-caption or type-body-sm, text-muted-foreground
│ mb-1                │  ← 4px gap (tight coupling)
│ £288.45             │  ← type-display (L1) or type-metric (L2)
└─────────────────────┘

PATTERN B: Inline (label left, value right)
┌─────────────────────────────────────────┐
│ Environment & Streets              £112 │  ← Same baseline, justify-between
│ type-body-sm font-medium    type-body-sm font-semibold tabular-nums │
└─────────────────────────────────────────┘

PATTERN C: Bar chart row
┌─────────────────────────────────────────┐
│ Environment & Streets              £112 │  ← Label row (mb-1.5)
│ ████████████████████░░░░░░░░░░░░░░░░░░ │  ← Bar (h-2, rounded-full)
└─────────────────────────────────────────┘
```

**Spacing rules**:
- Label to value (stacked): `mb-1` (4px)
- Label row to bar: `mb-1.5` (6px)
- Between list items: `py-3` (12px each side) or `space-y-4` (16px)
- Section to section: `mt-6 pt-4 border-t` (24px margin + 16px padding + divider)

### 4. Bar Chart Pattern (Standard Implementation)

Horizontal bar charts follow this exact structure:

```tsx
{/* Horizontal bar chart - industry standard */}
<div className="space-y-4">
  {items.map((item) => (
    <div key={item.key}>
      {/* Label row: name left, value right */}
      <div className="flex items-baseline justify-between mb-1.5">
        <span className="type-body-sm font-medium">{item.name}</span>
        <span className="type-body-sm font-semibold tabular-nums">
          {formatCurrency(item.value, { decimals: 0 })}
        </span>
      </div>
      {/* Bar */}
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full bg-foreground"
          style={{ width: `${item.percentage}%` }}
        />
      </div>
    </div>
  ))}
</div>
```

**Bar rules**:
- Height: `h-2` (8px) - visible but not dominant
- Background: `bg-muted` (empty portion)
- Fill: `bg-foreground` (single color, no gradients)
- Radius: `rounded-full` (pill shape)
- Width: True percentage (not relative to max)

### 5. Card Anatomy (Required Structure)

Every data card follows this structure:

```tsx
<section className="card-elevated p-5 sm:p-6">
  {/* 1. Header: title + subtitle */}
  <h2 className="type-title-2 mb-1">{title}</h2>
  <p className="type-body-sm text-muted-foreground mb-6">{subtitle}</p>

  {/* 2. Primary content: the data */}
  {/* ... L1/L2/L3 data display ... */}

  {/* 3. Footer (optional): context, sources */}
  {totalBudget && (
    <p className="type-caption text-muted-foreground mt-6 pt-4 border-t border-border/50">
      {contextText}
    </p>
  )}
</section>
```

**Structure rules**:
- Title: `type-title-2 mb-1`
- Subtitle: `type-body-sm text-muted-foreground mb-6`
- Footer: `type-caption text-muted-foreground mt-6 pt-4 border-t border-border/50`
- No icons in data rows (labels are sufficient)
- No descriptions under list items (keep scannable)

### 6. Violations Checklist (Review Before Committing)

Before committing any data display code, verify:

| Check | Violation | Fix |
|-------|-----------|-----|
| ☐ | Two elements use `type-display` in same card | Demote one to `type-metric` or lower |
| ☐ | Numbers in a list have different decimal places | Standardize to 0 decimals for lists |
| ☐ | Label uses `type-body` (same as value) | Demote label to `type-body-sm` |
| ☐ | Bar chart uses multiple colors | Use single `bg-foreground` for all bars |
| ☐ | Icons appear next to every list item | Remove icons, names are sufficient |
| ☐ | Description text under each list row | Remove, keep list scannable |
| ☐ | Percentage AND absolute value shown | Pick one (prefer absolute for money) |
| ☐ | `text-2xl`, `text-xl` used instead of `type-*` | Replace with correct `type-*` class |
| ☐ | Numbers without `tabular-nums` | Add `tabular-nums` class |
| ☐ | Footer/context competes with primary data | Demote to `type-caption`, add border-t |

### 7. Data Display Decision Tree

Use this to choose the right pattern:

```
Q: What is the user's question?
│
├─ "What is the single key number?"
│   → Hero pattern: L1 display + L5 label above
│
├─ "How is X broken down into parts?"
│   → Bar chart pattern: L4 labels + L3 values + bars
│
├─ "What are the details of X?"
│   → Key-value list: L4 labels left + L3 values right
│
└─ "How does X compare to Y?"
    → Comparison: Two L2 metrics side by side with L5 labels
```

---

### Copywriting Rules (LOW READING AGE)

Write for a 10-year-old reading level:
- **Short sentences** - Max 15-20 words per sentence
- **Simple words** - "use" not "utilise", "help" not "assist", "money" not "revenue"
- **Active voice** - "The council collects" not "Is collected by the council"
- **No jargon** - Explain technical terms in plain English
- **Direct language** - "You pay" not "Your contribution amounts to"

Examples:
- ❌ "Revenue streams contributing to the annual budget"
- ✅ "Where the money comes from"
- ❌ "vs last year"
- ✅ "from last year"
- ❌ "Fiscal allocation for environmental services"
- ✅ "Money spent on bins and recycling"

### Colour System (RIGID - use only these colours)

The design uses a **navy blue accent** (hue 250) as the primary accent colour, with emerald and amber reserved for semantic status indicators only.

**Design Principles**:
- Navy blue is calming, professional, and trustworthy
- Lower saturation for neurodivergent-friendliness
- All colours meet WCAG 2.1 AA contrast ratios

#### Core Tokens (use for most UI)

| Token | Usage |
|-------|-------|
| `text-foreground` | Primary text |
| `text-muted-foreground` | Secondary/helper text |
| `bg-background` | Page background |
| `bg-card` | Card backgrounds |
| `bg-muted` | Subtle backgrounds, hover states |
| `bg-muted/30` | Very subtle backgrounds |
| `border-border` | Default borders |
| `border-border/50` | Subtle dividers |

#### Navy Accent Tokens (primary accent colour)

| Token | Usage |
|-------|-------|
| `text-navy-600` | Navy accent text |
| `text-accent-foreground` | Navy accent text (alternative) |
| `bg-navy-50` | Very light navy background |
| `bg-navy-100` | Light navy background |
| `border-navy-200` | Navy border |
| `bg-accent` | Accent background (subtle navy tint) |

**Use navy for**:
- "Verified", "Current", or feature badges
- Highlighted elements
- Focus rings
- Primary interactive elements

#### Semantic Status Colours (use sparingly)

| Token | Usage | When to Use |
|-------|-------|-------------|
| `text-positive` | Emerald text | Decreases, savings, positive changes |
| `text-negative` | Amber text | Increases, costs, warnings |
| `text-destructive` | Red text | Errors only |

**Rules**:
- ONLY use `text-positive`/`text-negative` for data changes (up/down arrows, percentage changes)
- NEVER use arbitrary Tailwind colors (`text-green-500`, `text-amber-600`, etc.)
- Use `status-success`, `status-warning` classes for coloured backgrounds with semantic meaning

#### Badge Styling

```tsx
// Standard navy accent badge (for "Verified", "Current", etc.)
<Badge variant="outline" className="text-xs font-medium bg-navy-50 text-navy-600 border-navy-200">
  Verified
</Badge>

// Never use emerald/amber badges unless showing status
```

#### Navigation Hover States (GRAYSCALE ONLY)

**CRITICAL RULE**: Navigation items (links, buttons) must use grayscale hover states only.

```tsx
// ✅ CORRECT - Grayscale hover
'text-muted-foreground hover:text-foreground hover:bg-muted'

// ❌ WRONG - Blue accent hover
'text-muted-foreground hover:text-foreground hover:bg-accent'
```

**Why**: The navy accent (`bg-accent`) should be reserved for badges, focus rings, and highlighted elements - NOT for interactive hover states. This keeps the UI calm and accessible.

**Navigation item pattern**:
```tsx
const navItemBase = 'inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 cursor-pointer';

// Desktop nav link/button
const navLinkClass = cn(
  navItemBase,
  'h-9 px-4 py-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted'
);

// Mobile nav link/button
const mobileNavLinkClass = cn(
  navItemBase,
  'h-11 px-4 py-2 justify-start rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted w-full'
);
```

#### Colour Violations Checklist

Before committing, verify:
| Check | Violation | Fix |
|-------|-----------|-----|
| ☐ | Using `text-emerald-*` or `text-amber-*` | Replace with `text-positive` or `text-negative` |
| ☐ | Using `bg-emerald-*` for badges | Replace with `bg-navy-50` |
| ☐ | Using arbitrary Tailwind colours | Use design system tokens |
| ☐ | Using colour for decoration | Remove - use for meaning only |
| ☐ | Using `bg-accent` for navigation hovers | Replace with `bg-muted` (grayscale only) |

### Spacing Scale (8pt system)

| Class | Size | Usage |
|-------|------|-------|
| `gap-1`, `p-1` | 4px | Icon-to-text gaps |
| `gap-2`, `p-2` | 8px | Tight element spacing |
| `gap-3`, `p-3` | 12px | Compact groups |
| `gap-4`, `p-4` | 16px | Standard spacing |
| `gap-5`, `p-5` | 20px | Comfortable padding |
| `gap-6`, `p-6` | 24px | Card padding, section gaps |
| `gap-8`, `p-8` | 32px | Major section breaks |

**Margins**: Use `mb-` for vertical rhythm:
- `mb-1` (4px) - Tight label spacing
- `mb-2` (8px) - Related elements
- `mb-4` (16px) - Paragraph spacing
- `mb-6` (24px) - Section spacing
- `mb-8` (32px) - Major breaks

### Border Radius (Nested Proportions)

**Rule**: Inner elements use smaller radius than their container.

| Class | Size | Usage |
|-------|------|-------|
| `rounded-md` | 6px | Buttons, badges, small elements |
| `rounded-lg` | 8px | Inner cards, nested elements |
| `rounded-xl` | 12px | **Standard cards** (primary container) |
| `rounded-2xl` | 16px | Hero sections only |
| `rounded-full` | 50% | Icons, avatars, dots |

**Nesting example**:
```
Card (rounded-xl) > Inner panel (rounded-lg) > Button (rounded-md)
```

### Responsive Breakpoints

| Breakpoint | Width | Usage |
|------------|-------|-------|
| Default | <640px | Mobile (90% of users) |
| `sm:` | 640px+ | Tablet/small desktop |
| `lg:` | 1024px+ | Desktop |

**Mobile-first**: Always design for mobile first, then enhance for larger screens.

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

## Data Sources (CRITICAL RULE)

**ONLY use .gov.uk websites for all data.** This is an unbreakable rule:

- ✅ Council Tax: GOV.UK Council Tax 2025-26
- ✅ Budgets: GOV.UK Revenue Expenditure (RO returns)
- ✅ Population: ONS Mid-2024 Population Estimates
- ✅ Individual council .gov.uk websites (e.g., folkestone-hythe.gov.uk)
- ❌ NEVER use third-party sources (news sites, blogs, analysis sites)
- ❌ NEVER use non-.gov.uk domains for council financial data

All data enrichment and research must come exclusively from:
1. GOV.UK national statistics and datasets
2. Individual council .gov.uk official websites
3. ONS (ons.gov.uk) for population/demographic data

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

---

## Reference Implementation: UnifiedDashboard

**`src/components/dashboard/UnifiedDashboard.tsx` is the gold standard.**

This component represents the pinnacle of our design system. All pages, cards, and sections should aim to match its quality. When building new features or refactoring existing ones, refer to UnifiedDashboard for:

### What Makes It Exemplary

1. **Perfect Typography Hierarchy**
   - Hero numbers use `type-display` with `/year` suffix in `type-caption`
   - Section headers: `type-title-2 mb-1` + `type-body-sm text-muted-foreground mb-5`
   - Data rows: `type-body font-semibold` for values, `type-caption` for labels
   - Context footers: `type-caption` in `bg-muted/30` boxes

2. **Consistent Card Structure**
   - All cards: `card-elevated p-5 sm:p-6`
   - Section comments clearly delineate each card's purpose
   - Logical flow: Hero → Bands → History → Spending → Finances → Leadership → FAQ → Sources

3. **Monzo/Apple Bar Chart Pattern**
   - Row 1: Label + Amount (both `type-body font-semibold`, justified)
   - Row 2: Description + Percentage (both `type-caption text-muted-foreground`, justified)
   - Row 3: Bar (`h-2 rounded-full bg-foreground`)
   - Gaps: `mb-1` between row 1-2, `mb-2` between row 2-bar, `space-y-4` between items

4. **Semantic Colour Usage**
   - `text-positive` / `text-negative` ONLY for up/down indicators
   - Navy badges (`bg-navy-50 text-navy-600 border-navy-200`) for "Verified", "Current"
   - No arbitrary colours anywhere

5. **Context Footers Pattern**
   - `mt-5 p-3 rounded-lg bg-muted/30`
   - Label in `type-caption text-muted-foreground`
   - Value in `font-semibold text-foreground` or semantic colour

6. **Accessibility Excellence**
   - All external links have `sr-only` "(opens in new tab)" labels
   - Icons use `aria-hidden="true"`
   - Clickable elements have `cursor-pointer`
   - Keyboard-accessible band selector

### Before Building Any New Component

1. Open `UnifiedDashboard.tsx` and find a similar pattern
2. Copy the exact classes and structure
3. Verify your component looks as polished as the reference

---

## Component Patterns (Fintech-Inspired)

These patterns are inspired by Stripe, Monzo, Apple Pay, Revolut, and Starling. They prioritize clarity, trust, and accessibility for 70+ users.

### Icon Container Pattern (RIGID)

All icons in data rows use this exact pattern:

```tsx
{/* Standard icon container */}
<div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
  <Icon className="h-4 w-4 text-muted-foreground" />
</div>

{/* Highlighted variant (for "this council" or active items) */}
<div className="w-8 h-8 rounded-lg bg-foreground/10 flex items-center justify-center shrink-0">
  <Icon className="h-4 w-4 text-foreground" />
</div>
```

**Rules**:
- Container: `w-8 h-8 rounded-lg bg-muted`
- Icon: `h-4 w-4 text-muted-foreground`
- Gap to text: `gap-3` (12px)
- Always use `shrink-0` on container

### Person Name + Role Pattern (TIGHT)

For leadership, contacts, and similar name/subtitle pairs:

```tsx
<div className="flex items-center gap-3 min-w-0">
  <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
    <User className="h-4 w-4 text-muted-foreground" />
  </div>
  <div className="min-w-0 space-y-2">
    <p className="text-sm leading-none font-semibold truncate">{name}</p>
    <p className="text-[13px] leading-none text-muted-foreground">{role}</p>
  </div>
</div>
```

**Rules**:
- Name: `text-sm leading-none font-semibold truncate`
- Role: `text-[13px] leading-none text-muted-foreground`
- Gap between name and role: `space-y-2` (8px)
- Both use `leading-none` to eliminate line-height padding

### Footer CTA Pattern (STANDARD)

For clickable footers that link to external resources:

```tsx
<a
  href={url}
  target="_blank"
  rel="noopener noreferrer"
  className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted transition-colors group cursor-pointer"
>
  <div className="leading-tight">
    <p className="type-body-sm font-semibold group-hover:text-primary transition-colors">
      {title}
      <span className="sr-only"> (opens in new tab)</span>
    </p>
    <p className="type-caption text-muted-foreground">{subtitle}</p>
  </div>
  <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary shrink-0" />
</a>
```

**Rules**:
- Container: `p-3 rounded-lg bg-muted/30 hover:bg-muted`
- Title: `type-body-sm font-semibold`
- Subtitle: `type-caption text-muted-foreground`
- Text container: `leading-tight`
- Always include `cursor-pointer` on clickable elements

### Document Link Pattern

For lists of downloadable/viewable documents:

```tsx
<a
  href={doc.url}
  target="_blank"
  rel="noopener noreferrer"
  className="flex items-center justify-between py-2.5 rounded-lg hover:bg-muted/50 transition-colors group cursor-pointer"
>
  <div className="flex items-center gap-3">
    <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
      <FileText className="h-4 w-4 text-muted-foreground" />
    </div>
    <span className="type-body-sm font-medium group-hover:text-primary transition-colors">
      {doc.title}
    </span>
  </div>
  <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary shrink-0" />
</a>
```

### Info Box Pattern

For contextual notes and data explanations:

```tsx
<section className="p-5 rounded-lg bg-muted/30 border border-border/50">
  <div className="flex gap-3">
    <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
      <Info className="h-4 w-4 text-muted-foreground" />
    </div>
    <div>
      <p className="type-body-sm font-semibold text-foreground mb-1">{title}</p>
      <p className="type-body-sm text-muted-foreground mb-3">{description}</p>
      <p className="type-caption text-muted-foreground">{sources}</p>
    </div>
  </div>
</section>
```

### Bar Chart Pattern (Monzo/Apple Style) - RIGID

For all data breakdowns with percentage bars. This is the ONLY bar chart pattern to use:

```tsx
{/* Data breakdown - Monzo/Apple style */}
<div className="space-y-5">
  {items.map((item) => (
    <div key={item.key}>
      {/* Row 1: Label + Amount (both bold, justified) */}
      <div className="flex items-baseline justify-between mb-1">
        <span className="type-body font-semibold">{item.name}</span>
        <span className="type-body font-semibold tabular-nums">
          {formatCurrency(item.value, { decimals: 0 })}
        </span>
      </div>
      {/* Row 2: Description + Percentage (both muted, justified) */}
      <div className="flex items-baseline justify-between mb-2">
        <p className="type-caption text-muted-foreground">
          {item.description}
        </p>
        <span className="type-caption text-muted-foreground tabular-nums">
          {item.percentage.toFixed(0)}%
        </span>
      </div>
      {/* Row 3: Bar - visual reinforcement */}
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full bg-foreground"
          style={{ width: `${item.percentage}%` }}
        />
      </div>
    </div>
  ))}
</div>
```

**Rules**:
- Container: `space-y-5` (20px between items)
- Row 1: `type-body font-semibold` for both label and value
- Row 2: `type-caption text-muted-foreground` for both description and percentage
- Row 1→2 gap: `mb-1` (4px)
- Row 2→bar gap: `mb-2` (8px)
- Bar: `h-2 rounded-full bg-muted overflow-hidden`
- Bar fill: `bg-foreground` (single color, no gradients)
- For historical data, use `bg-muted-foreground/40` for past years
- Always use `tabular-nums` on numeric values
- Use `items-baseline` not `items-center` for text alignment

---

## Fintech Design Principles

Learned from Stripe, Monzo, Apple Pay, Revolut, and Starling:

### 1. One Hero Number Per View
Every card answers ONE question with ONE prominent figure. Secondary data is visually demoted.

### 2. Progressive Disclosure
Show summary first, details on interaction. Reduces cognitive load for older users.

### 3. Warm Typography
Avoid cold, clinical fonts. Generous letter spacing, clear letterforms for older eyes.

### 4. Trust Through Consistency
Same patterns everywhere. Users learn once, recognize always.

### 5. Micro-Confirmations
Subtle feedback on interactions (hover states, checkmarks). Never jarring animations.

### 6. Color + Shape
Don't rely on color alone. Combine with icons for accessibility (colorblind users).

### 7. Plain English Always
"You pay" not "Your contribution". "Bins & recycling" not "Environmental services".

---

## Header & Sticky Navigation

### Morphing Header Pattern

The header uses a **scroll-driven morphing animation** that transforms from a full-width static header into a compact floating pill as the user scrolls. This creates a seamless, beautiful transition.

**Key Features**:
- Single unified header (not two separate components)
- Smooth interpolation using `requestAnimationFrame`
- Cubic easing for natural feel
- CSS custom properties drive the animation
- Text labels fade out, leaving icon-only buttons
- Border radius morphs from 0 to pill shape
- Width contracts from full to 845px (10% wider than dashboard cards)
- Backdrop blur and shadow fade in

**Scroll Progress Calculation**:
```tsx
const handleScroll = useCallback(() => {
  rafRef.current = requestAnimationFrame(() => {
    const scrollY = window.scrollY;
    const progress = Math.min(1, Math.max(0, scrollY / 100));

    // Cubic easing for smooth feel
    const eased = progress < 0.5
      ? 4 * progress * progress * progress
      : 1 - Math.pow(-2 * progress + 2, 3) / 2;

    setScrollProgress(eased);
  });
}, []);
```

**Interpolation Helper**:
```tsx
const lerp = (start: number, end: number) => start + (end - start) * scrollProgress;
```

**Dynamic CSS Variables**:
```tsx
const headerStyles = {
  '--header-max-width': `${lerp(1280, 845)}px`,
  '--header-border-radius': `${lerp(0, 9999)}px`,
  '--header-margin-top': `${lerp(0, 12)}px`,
  '--header-bg-opacity': lerp(1, 0.95),
  '--header-blur': `${lerp(0, 20)}px`,
};
```

**Nav Link Text Collapse**:
```tsx
<span
  style={{
    opacity: 1 - scrollProgress,
    maxWidth: isCompact ? 0 : '100px',
  }}
>
  Insights
</span>
```

**CSS Requirements** (in globals.css):
```css
:root {
  --background-rgb: 253 253 253;
  --border-rgb: 0 0 0;
}
.dark {
  --background-rgb: 30 30 35;
  --border-rgb: 255 255 255;
}
```

---

## Do NOT

- Add new color tokens - use existing design system colors
- Create inline styles - use Tailwind classes
- Duplicate card styling - use `CARD_STYLES` constant
- Use `useMemo` for side effects - use `useEffect`
- Hardcode result limits - use `SEARCH_RESULT_LIMIT` or `SELECTOR_RESULT_LIMIT`
- Duplicate pulsing dot animation - use `<PulsingDot />`
- Duplicate council result rendering - use `<CouncilResultItem />`
- Add sidebar components (project doesn't use sidebars)
- Use collapsible/accordion UI patterns - keep content flat and scannable
- Add dropdowns for progressive disclosure - use tabs or separate sections instead
- Use `bg-accent` for navigation hover states - use `bg-muted` (grayscale only)
- Make sticky nav narrower than 845px (10% wider than dashboard cards)
