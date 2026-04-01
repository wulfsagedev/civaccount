# CivAccount Design System v1.4

This document defines the visual language, component patterns, and content guidelines for CivAccount. All new features and pages should follow these standards.

---

## Core Principles

1. **Clarity over cleverness** - Every element should be immediately understandable
2. **Accessible to all** - WCAG 2.1 AA compliant, readable by ages 10-70, no jargon
3. **Muted professionalism** - Earthy, subdued tones that feel trustworthy
4. **Purposeful colour** - Colour used sparingly and meaningfully
5. **Mobile-first** - All layouts must work on small screens

---

## Accessibility Standards (WCAG 2.1 AA)

CivAccount meets or exceeds GOV.UK accessibility standards. Every component must be:

### Contrast Requirements

| Element | Minimum Ratio | Our Target |
|---------|---------------|------------|
| Normal text (< 18px) | 4.5:1 | 4.6:1+ |
| Large text (≥ 18px bold) | 3:1 | 4:1+ |
| UI components | 3:1 | 3.5:1+ |
| Focus indicators | 3:1 | 4:1+ |

Our colour tokens are pre-tested:
- `--foreground` on `--background`: **13:1** (light), **11:1** (dark)
- `--muted-foreground` on `--background`: **4.6:1** (light), **4.5:1** (dark)

### Keyboard Navigation

All interactive elements must be:
- Focusable with Tab key
- Activatable with Enter/Space
- Visible focus state (3px blue outline)

```tsx
// Focus states are automatic via globals.css
// For custom elements, ensure:
<button
  tabIndex={0}
  onKeyDown={(e) => e.key === 'Enter' && handleClick()}
  role="button"
>
```

### Skip Links

Every page includes a skip link (handled in layout.tsx):

```tsx
<a href="#main-content" className="skip-link">
  Skip to main content
</a>

<main id="main-content">
  {/* Page content */}
</main>
```

### Screen Reader Support

Always include:
- `aria-label` for icon-only buttons
- `aria-describedby` for complex widgets
- Semantic HTML (`<main>`, `<nav>`, `<article>`)
- Descriptive link text (never "click here")

```tsx
// Good
<Button aria-label="Switch to dark mode">
  <Moon className="h-4 w-4" />
</Button>

// Bad
<Button>
  <Moon className="h-4 w-4" />
</Button>
```

### Motion & Animation

Respect user preferences:

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

### Touch Targets

Minimum 44x44px for all interactive elements:

```tsx
// Buttons already have min-height: 44px in globals.css
// For custom elements:
<button className="min-h-[44px] min-w-[44px] p-3">
```

---

## Dark Mode (Linear-style)

Our dark mode uses **layered elevation** for depth, inspired by Linear and Stripe.

### Surface Hierarchy

```
Level 0: --background     oklch(0.13)  Deep charcoal base
Level 1: --card           oklch(0.17)  Card surfaces
Level 2: --popover        oklch(0.20)  Modals, dropdowns
Level 3: --accent         oklch(0.28)  Hover states
```

Each level uses subtle blue undertones (`hue: 285`) for richness.

### Card Elevation in Dark Mode

```css
.dark .card-elevated {
  /* Gradient for subtle lift */
  background: linear-gradient(
    180deg,
    oklch(0.18 0.006 285) 0%,
    oklch(0.16 0.006 285) 100%
  );

  /* Inner glow + shadows for depth */
  box-shadow:
    0 0 0 1px oklch(1 0 0 / 5%) inset,  /* subtle inner highlight */
    0 1px 2px oklch(0 0 0 / 30%),
    0 4px 16px oklch(0 0 0 / 25%);
}
```

### Dark Mode Best Practices

1. **Never use pure black** - Use `--background` (oklch 0.13)
2. **Never use pure white** - Use `--foreground` (oklch 0.93)
3. **Borders are subtle** - 10% white opacity
4. **Shadows are deeper** - 25-30% black vs 3-6% in light mode
5. **Status colours are softer** - Reduced saturation, higher lightness

### Testing Dark Mode

- [ ] Cards have visible distinction from background
- [ ] Text is comfortable to read (not too bright)
- [ ] Interactive elements have clear hover states
- [ ] Focus rings are visible (blue, 3px)
- [ ] No colour-only information

---

## Colour System

### Base Palette

We use a muted, earthy colour palette based on stone/slate/zinc greys. Pure black is reserved for key typography only.

```
Primary Background:    var(--background)        # Clean white/dark
Muted Background:      bg-muted/30, bg-muted/50 # Subtle grey tints
Card Background:       card-elevated class      # White with subtle shadow
Foreground:            var(--foreground)        # Near-black text
Muted Foreground:      var(--muted-foreground)  # Grey text (4.5:1 contrast)
```

### Accent Colours (Use Sparingly)

Accent colours are reserved for meaningful status indicators only:

| Purpose | Light Mode | Dark Mode | Usage |
|---------|------------|-----------|-------|
| Verified/Success | `bg-emerald-50 text-emerald-700 border-emerald-200` | `bg-emerald-950/30 text-emerald-400 border-emerald-800` | Verified badges, confirmed data |
| Current/Active | `bg-amber-50 text-amber-700 border-amber-200` | `bg-amber-950/30 text-amber-400 border-amber-800` | Current year, active states |
| Selected/Highlight | `bg-sky-50 text-sky-700 border-sky-200` | `bg-sky-950/30 text-sky-400 border-sky-800` | User selections, "Your council" |

### Chart/Bar Colours

```css
Selected/Primary bar:  bg-foreground              /* Dark emphasis */
Unselected bars:       bg-stone-400 dark:bg-stone-500
High stability:        bg-foreground
Medium stability:      bg-stone-400 dark:bg-stone-500
Low stability:         bg-stone-300 dark:bg-stone-600
```

### What NOT to do

- Never use pure `#000000` except for `.text-foreground` on key metrics
- Never use bright/saturated colours (no red, blue, green at full saturation)
- Never use colour as the only way to convey meaning (always pair with icons/text)

---

## Typography

### Hierarchy

| Element | Class | Usage |
|---------|-------|-------|
| Hero Metrics | `text-metric` | Large financial figures (£127.4 million) |
| Section Headings | `text-xl font-semibold` | Card/section titles |
| Subheadings | `text-sm font-semibold` | List headings, subsection titles |
| Body | `text-sm text-muted-foreground` | Explanatory text |
| Overline/Label | `text-overline` | Small labels above metrics |
| Tabular Data | `tabular-nums` | All numbers, especially financial |

### Capitalisation Rules

**Sentence case everywhere.** Never use ALL CAPS or Title Case for headings.

```
✅ "Where the money goes"
✅ "How council tax works"
✅ "Band D rate history"

❌ "Where The Money Goes"
❌ "HOW COUNCIL TAX WORKS"
❌ "BAND D RATE HISTORY"
```

### Number Formatting

All numbers must use the provided formatting utilities:

```tsx
// Large budgets (millions/billions)
formatBudget(amountInThousands)  // "£127.4 million"

// Currency amounts
formatCurrency(amount, { decimals: 2 })  // "£1,847.23"
formatCurrency(amount, { decimals: 0 })  // "£1,847"

// Always add tabular-nums class for alignment
<span className="tabular-nums">{formatCurrency(amount)}</span>
```

---

## Component Patterns

### Cards

Use the `.card-elevated` class for all content cards:

```tsx
<div className="card-elevated p-8">
  {/* Card content */}
</div>
```

Card padding:
- Standard: `p-8`
- Compact: `p-6`
- Hero sections: `p-8` with `lg:col-span-2` for emphasis

### Hero Sections

Each tab should have a hero section with the primary metric:

```tsx
<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
  {/* Primary Metric - Takes 2 columns */}
  <div className="lg:col-span-2">
    <div className="card-elevated p-8">
      <div className="flex items-start justify-between mb-6">
        <div>
          <p className="text-overline mb-2">Label here</p>
          <p className="text-metric text-foreground">
            {formatBudget(amount)}
          </p>
        </div>
        <Badge variant="outline" className="text-xs font-medium">
          2025-26
        </Badge>
      </div>
      <p className="text-sm text-muted-foreground leading-relaxed max-w-lg">
        Explanatory text here.
      </p>
    </div>
  </div>

  {/* Secondary Content */}
  <div className="card-elevated p-6">
    {/* Quick stats or selectors */}
  </div>
</div>
```

### Bar Charts

Horizontal bar charts are the primary visualisation:

```tsx
<div className="space-y-4">
  {items.map((item) => (
    <div key={item.id} className="group">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
            <Icon className="h-4 w-4 text-muted-foreground" />
          </div>
          <span className="font-medium text-sm">{item.name}</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground tabular-nums">
            {item.percentage.toFixed(1)}%
          </span>
          <span className="font-semibold text-sm tabular-nums min-w-[70px] text-right">
            {formatBudget(item.amount)}
          </span>
        </div>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ease-out ${
            isSelected ? 'bg-foreground' : 'bg-stone-400 dark:bg-stone-500'
          }`}
          style={{ width: `${barWidth}%` }}
        />
      </div>
    </div>
  ))}
</div>
```

### Badges

```tsx
// Standard outline badge
<Badge variant="outline" className="text-xs">2025-26</Badge>

// Verified/Success badge
<Badge variant="outline" className="text-xs font-medium bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800">
  Verified
</Badge>

// Current/Active badge
<Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800">
  Current
</Badge>

// Selected/Highlight badge
<Badge variant="outline" className="text-xs bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/30 dark:text-sky-400 dark:border-sky-800">
  Selected
</Badge>
```

### Interactive Elements

Selectors and clickable items should use muted backgrounds:

```tsx
<button
  onClick={() => handleSelect(item)}
  className={`p-3 rounded-lg text-left transition-all cursor-pointer border ${
    isSelected
      ? 'bg-muted border-border shadow-sm text-foreground'
      : 'bg-muted/30 border-transparent hover:bg-muted/50 text-foreground'
  }`}
>
  {/* Button content */}
</button>
```

### Callout Boxes

For important information or context:

```tsx
<div className="p-6 rounded-xl bg-muted/50 border border-border/50">
  <div className="flex gap-4">
    <div className="shrink-0">
      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
        <Info className="h-5 w-5 text-muted-foreground" />
      </div>
    </div>
    <div>
      <h4 className="font-semibold text-foreground mb-2">
        Heading here
      </h4>
      <p className="text-sm text-muted-foreground leading-relaxed">
        Explanatory text here.
      </p>
    </div>
  </div>
</div>
```

### Lists with Checkmarks

```tsx
<ul className="space-y-3">
  {items.map((item, i) => (
    <li key={i} className="flex items-start gap-3 text-sm">
      <CheckCircle className="h-4 w-4 mt-0.5 shrink-0 text-stone-400" />
      <span>{item}</span>
    </li>
  ))}
</ul>
```

---

## Content Guidelines

### Tone of Voice

- **Casual but informative** - Write like you're explaining to a friend
- **UK English** - Use British spellings and terminology
- **No jargon** - If a 10-year-old wouldn't understand, simplify it
- **Factual, not opinionated** - Present data without political commentary

### Examples

```
✅ "This pays for care homes, people who visit your home to help, and support
    for people with disabilities or mental health needs."

❌ "This funds domiciliary care services, residential care placements, and
    support packages for individuals with SEND or MH conditions."
```

```
✅ "The council fixes roads, fills potholes, and keeps street lights working."

❌ "Highways maintenance encompasses carriageway resurfacing, pothole remediation,
    and street lighting infrastructure management."
```

### Service Descriptions

Keep service descriptions simple and relatable:

| Service | Good | Avoid |
|---------|------|-------|
| Adult Social Care | "Helping older people and people with disabilities" | "Provision of adult social services" |
| Children's Services | "Keeping children safe and helping families" | "Safeguarding and family support services" |
| Transport | "Fixing roads and keeping traffic moving" | "Highways maintenance and traffic management" |
| Environmental | "Collecting bins and keeping streets clean" | "Waste collection and street cleansing" |

---

## Layout & Spacing

### Responsive Grid

```tsx
// Standard card grid
<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

// Hero + sidebar layout
<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
  <div className="lg:col-span-2">{/* Main content */}</div>
  <div>{/* Sidebar */}</div>
</div>

// Three-column cards
<div className="grid grid-cols-1 md:grid-cols-3 gap-6">

// Two-column content
<div className="grid grid-cols-1 md:grid-cols-2 gap-8">
```

### Spacing Scale

```
Section spacing:       space-y-8
Card internal:         p-8 (standard), p-6 (compact)
Content sections:      mb-6 or mb-8
List item spacing:     space-y-3 or space-y-4
Inline element gaps:   gap-2, gap-3, gap-4
```

### Mobile Considerations

- All grids collapse to single column on mobile
- Touch targets minimum 44x44px (use `py-4` on buttons)
- Hide tertiary information on mobile with `hidden sm:block`
- Use dropdown selector instead of tabs on mobile

---

## Icons

Use Lucide React icons throughout. Common icons:

| Purpose | Icon |
|---------|------|
| Adult Social Care | `Shield` |
| Children's Services | `Users` |
| Education | `GraduationCap` |
| Transport | `Car` |
| Public Health | `Heart` |
| Housing | `Home` |
| Culture & Leisure | `BookOpen` |
| Environment | `Trash2` |
| Planning | `MapPin` |
| Corporate Services | `Building` |
| Information | `Info` |
| Success/Verified | `CheckCircle` |
| Warning | `AlertTriangle` |
| Trend Up | `TrendingUp` |
| Trend Down | `TrendingDown` |

Icons should always be `text-muted-foreground` unless selected/active.

---

## Component Checklist

When building a new component, verify:

### Visual
- [ ] Uses `card-elevated` class for cards
- [ ] Hero section with primary metric using `text-metric`
- [ ] All headings in sentence case
- [ ] Numbers use `formatCurrency` or `formatBudget`
- [ ] Numbers have `tabular-nums` class
- [ ] Badges use correct variant (outline with accent colours for status)
- [ ] Icons are `text-muted-foreground` by default
- [ ] Interactive states use `bg-muted` not pure black

### Accessibility
- [ ] All interactive elements have focus states
- [ ] Colour contrast meets 4.5:1 for text
- [ ] Touch targets are minimum 44x44px
- [ ] Icon-only buttons have `aria-label`
- [ ] No information conveyed by colour alone
- [ ] Animations respect `prefers-reduced-motion`

### Responsive
- [ ] Mobile responsive with appropriate breakpoints
- [ ] Touch-friendly on mobile devices
- [ ] Dark mode tested and working

### Content
- [ ] Copy is simple enough for all ages
- [ ] UK English spellings used
- [ ] No jargon or acronyms without explanation

---

## File References

Key styling files:
- `/src/app/globals.css` - Custom CSS classes, accessibility utilities, and design tokens
- `/src/app/layout.tsx` - Skip link and page structure
- `/src/components/ui/badge.tsx` - Badge component
- `/src/components/ui/card.tsx` - Card component
- `/src/components/ui/button.tsx` - Button with focus states
- `/src/lib/utils.ts` - Utility functions and constants
- `/src/data/councils.ts` - Number formatting utilities

---

*Last updated: January 2025 - Version 1.4*
