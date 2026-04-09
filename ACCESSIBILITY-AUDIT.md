# WCAG AAA Accessibility Audit — CivAccount v3.0

**Date**: 9 April 2026 · **Scope**: Entire app (CSS, 48 components, all pages, context/utils) · **Standard**: WCAG 2.1 AAA (with AA mandatory)

---

## Executive Summary

| Severity | Count |
|----------|-------|
| **Critical** | 8 |
| **Major** | 33 |
| **Minor** | 38 |
| **Total** | 79 |

---

## Phase 1 — Critical (fix now)

### C1. No visible focus indicator for form inputs
- **WCAG**: 2.4.7 Focus Visible
- **Location**: `globals.css` lines 729–736
- **Issue**: `outline: none !important` removes focus rings from all inputs/textareas/selects, but no replacement border or box-shadow focus style is defined in the global CSS. Any raw input outside a shadcn wrapper has zero visible focus.
- **Fix**: Add fallback:
  ```css
  input:focus-visible, textarea:focus-visible, select:focus-visible {
    outline: none !important;
    border-color: var(--ring);
    box-shadow: 0 0 0 1px var(--ring);
  }
  ```
- [x] Done

### C2. Dark mode `--positive` text fails AA (4.1:1 on card)
- **WCAG**: 1.4.3 Contrast (Minimum)
- **Location**: `globals.css` line 191
- **Issue**: `oklch(0.70 0.14 160)` on `oklch(0.25)` card = 4.1:1, below AA 4.5:1. All "savings" and "decrease" indicators are unreadable in dark mode.
- **Fix**: Lighten to `oklch(0.78 0.14 160)`.
- [x] Done

### C3. Search overlay lacks focus trap & dialog role
- **WCAG**: 2.1.2 No Keyboard Trap / 4.1.2 Name, Role, Value
- **Location**: `SearchCommand.tsx` lines 278–350
- **Issue**: No `role="dialog"`, no `aria-modal`, no focus trap. Keyboard users tab behind the overlay.
- **Fix**: Add `role="dialog" aria-modal="true" aria-label="Search councils"`. Implement focus trap. Store trigger ref, restore focus on close.
- [x] Done

### C4. Feedback modal lacks focus trap & dialog role
- **WCAG**: 2.1.2 / 4.1.2
- **Location**: `FeatureRequestDialog.tsx` lines 79–176
- **Issue**: Custom `div` overlay with no dialog semantics, no focus trap, no focus management.
- **Fix**: Add `role="dialog" aria-modal="true" aria-labelledby`. Focus trap + auto-focus first input + restore focus on close.
- [x] Done

### C5. Donate modal lacks focus trap & dialog role
- **WCAG**: 2.1.2 / 4.1.2
- **Location**: `DonateButton.tsx` lines 86–196
- **Issue**: Portal modal with no dialog role, no focus trap, no Escape handler.
- **Fix**: Same pattern as C4.
- [x] Done

### C6. Share preview modal lacks focus trap & dialog role
- **WCAG**: 2.1.2 / 4.1.2
- **Location**: `proposals/ShareButton.tsx` lines 88–171
- **Issue**: Same — no dialog semantics or focus management.
- **Fix**: Same pattern as C4.
- [x] Done

### C7. AccountModal dropdown not a proper disclosure widget
- **WCAG**: 4.1.2 / 2.1.1 Keyboard
- **Location**: `AccountModal.tsx` lines 70–133
- **Issue**: No `role`, no `aria-haspopup`, focus not managed on open/close.
- **Fix**: Add `role="menu"` or `role="dialog"`, `aria-haspopup="true"` on trigger, focus into popover on open.
- [x] Done

### C8. No route announcer for SPA navigation
- **WCAG**: 4.1.3 Status Messages
- **Location**: `layout.tsx`
- **Issue**: No `aria-live` region announces page title changes. Screen reader users get no feedback when navigating between routes.
- **Fix**: Create a `RouteAnnouncer` component using `usePathname()` + `aria-live="assertive"` rendering `document.title`.
- [x] Done

---

## Phase 2 — Contrast fixes

### M1. `muted-foreground` on background fails AAA (5.5:1)
- **WCAG**: 1.4.6 Contrast (Enhanced)
- **Location**: `globals.css` line 109
- **Fix**: Darken to `oklch(0.38 0 0)` for ~7.5:1.
- [x] Done

### M2. `muted-foreground` on card fails AAA (5.7:1)
- **WCAG**: 1.4.6 Contrast (Enhanced)
- **Location**: `globals.css` lines 100, 109
- **Fix**: Same as M1 — darkening `muted-foreground` fixes both.
- [x] Done

### M3. `navy-300` text on white fails AA (2.2:1)
- **WCAG**: 1.4.3 Contrast (Minimum)
- **Location**: `globals.css` line 124
- **Fix**: Add comment `/* DECORATIVE ONLY — do not use as text on light backgrounds */` or darken significantly if used as text.
- [x] Done

### M4. `navy-400` text on white fails AAA (5.1:1)
- **WCAG**: 1.4.6 Contrast (Enhanced)
- **Location**: `globals.css` line 125
- **Fix**: Darken to `oklch(0.55 0.10 250)` for AAA text use.
- [x] Done

### M5. Dark `accent-foreground` on card borderline (4.2:1)
- **WCAG**: 1.4.3 Contrast (Minimum)
- **Location**: `globals.css` line 171
- **Fix**: Lighten to `oklch(0.80 0.12 250)`.
- [x] Done

### M6. Dark mode border at 14% opacity fails 3:1 non-text contrast
- **WCAG**: 1.4.11 Non-text Contrast
- **Location**: `globals.css` line 174
- **Fix**: Increase to `oklch(1 0 0 / 25%)`.
- [x] Done

### M7. `share-accent` on white fails AA as text (4.4:1)
- **WCAG**: 1.4.3 Contrast (Minimum)
- **Location**: `globals.css` line 137
- **Fix**: Darken to `#9a6520` or ensure only used as background, never as text.
- [x] Done

---

## Phase 3 — ARIA labels, roles & combobox patterns

### M19. Search input no `aria-label` (placeholder only)
- **WCAG**: 4.1.2 Name, Role, Value
- **Location**: `SearchCommand.tsx` line 287
- **Fix**: Add `aria-label="Search councils by name or postcode"`.
- [x] Done

### M20. CouncilSelector inputs no `aria-label` (×3)
- **WCAG**: 4.1.2
- **Location**: `CouncilSelector.tsx` lines 281, 339, 399
- **Fix**: Add `aria-label="Search councils by name or postcode"` to each.
- [x] Done

### M21. CouncilSwitcher input no `aria-label`
- **WCAG**: 4.1.2
- **Location**: `CouncilSwitcher.tsx` line 48
- **Fix**: Add `aria-label="Switch council"`.
- [x] Done

### M22. DisplayNamePrompt input no label
- **WCAG**: 1.3.1 Info and Relationships
- **Location**: `DisplayNamePrompt.tsx` line 56
- **Fix**: Add `aria-label="Display name"` or associate with `htmlFor`/`id`.
- [x] Done

### M23. DonateButton input label not associated
- **WCAG**: 1.3.1
- **Location**: `DonateButton.tsx` line 147
- **Fix**: Add `id="custom-donation-amount"` to input, `htmlFor="custom-donation-amount"` to label.
- [x] Done

### M24. Search/CouncilSelector results lack `role="listbox"`/`role="option"`
- **WCAG**: 4.1.2
- **Location**: `SearchCommand.tsx`, `CouncilSelector.tsx`
- **Fix**: Add `role="listbox"` on results container, `role="option"` + `aria-selected` on items, `aria-activedescendant` on input.
- [x] Done

### M25. TaxBandsCard band selector lacks `role="radiogroup"`
- **WCAG**: 4.1.2
- **Location**: `TaxBandsCard.tsx` line 58
- **Fix**: Add `role="radiogroup" aria-label="Select council tax band"` on container, `role="radio" aria-checked` on each button.
- [x] Done

### M26. Proposals filter `<select>` lacks label
- **WCAG**: 1.3.1 / 4.1.2
- **Location**: `proposals/page.tsx` line 279
- **Fix**: Add `aria-label="Filter by budget area"`.
- [x] Done

---

## Phase 4 — Font sizes & touch targets

### M8. `type-overline` at 11px
- **WCAG**: 1.4.4 Resize Text
- **Location**: `globals.css` line 458
- **Fix**: Increase to `0.75rem` (12px) minimum.
- [x] Done

### M9. `.tag-sm` at 12px
- **WCAG**: 1.4.4
- **Location**: `globals.css` line 639
- **Fix**: Increase to `0.8125rem` (13px) minimum.
- [x] Done

### M10. Table header shrunk to 13px
- **WCAG**: 1.4.4
- **Location**: `globals.css` line 601
- **Fix**: Keep at `0.875rem` (14px), same as table base.
- [x] Done

### M11. Touch target exceptions too broad
- **WCAG**: 2.5.5 Target Size (Enhanced)
- **Location**: `globals.css` lines 272–281
- **Fix**: Narrow exceptions to `p a, span a, li a, .badge, [data-slot="badge"]` only. Remove `.flex a`, `.flex button`, `.grid button`.
- [x] Done

### M12. ShareableStat share button 28px
- **WCAG**: 2.5.8 Target Size
- **Location**: `shareable-stat.tsx` line 90
- **Fix**: Increase to `w-11 h-11` (44px).
- [x] Done

### M13. StatusPanel dismiss button ~24px
- **WCAG**: 2.5.8
- **Location**: `status-panel.tsx` line 59
- **Fix**: Add `min-h-[44px] min-w-[44px]`.
- [x] Done

### M14. VoteButton 36–40px
- **WCAG**: 2.5.8
- **Location**: `VoteButton.tsx` line 112
- **Fix**: Increase to `w-11 h-11`.
- [x] Done

### M15. Comment action buttons ~13px tall
- **WCAG**: 2.5.8
- **Location**: `CommentThread.tsx` line 184
- **Fix**: Add `py-2 px-2` padding or `min-h-[44px]`.
- [x] Done

### M16. ShareButton icon variant 32px
- **WCAG**: 2.5.8
- **Location**: `ShareButton.tsx` line 301
- **Fix**: Increase to `h-11`.
- [x] Done

### M17. Footer links ~20px tall
- **WCAG**: 2.5.8
- **Location**: `Footer.tsx` lines 27–48
- **Fix**: Add `min-h-[44px] inline-flex items-center`.
- [x] Done

### M18. DataSourcesFooter button ~30px
- **WCAG**: 2.5.8
- **Location**: `DataSourcesFooter.tsx` line 123
- **Fix**: Add `min-h-[44px]`.
- [x] Done

---

## Phase 5 — Pages & structure

### M27. `lang="en"` should be `lang="en-GB"`
- **WCAG**: 3.1.1 Language of Page
- **Location**: `layout.tsx` line 48, `global-error.tsx` line 17
- **Fix**: Change to `lang="en-GB"`.
- [x] Done

### M28. 11 SEO pages lack Header/Footer
- **WCAG**: 3.2.3 Consistent Navigation / 2.4.1 Bypass Blocks
- **Location**: `data/page.tsx`, `compare/[matchup]/page.tsx`, 4 insights subpages, `leaderboards/page.tsx`, 4 guide pages
- **Fix**: Add `<Header />` and `<Footer />` imports, or create a shared layout.
- [x] Done

### M29. About page skips h2 → h4
- **WCAG**: 1.3.1 Info and Relationships
- **Location**: `about/page.tsx` lines 87, 96, 105, 114
- **Fix**: Change `<h4>` to `<h3>`.
- [x] Done

### M30. Login/donate pages missing unique `<title>`
- **WCAG**: 2.4.2 Page Titled
- **Location**: `auth/login/page.tsx`, `donate/thank-you/page.tsx`
- **Fix**: Add layout.tsx with metadata or dynamic `document.title`.
- [x] Done

### M31. Loading states not announced to screen readers
- **WCAG**: 4.1.3 Status Messages
- **Location**: `loading.tsx` (root), `council/[slug]/loading.tsx`, `proposals/loading.tsx`
- **Fix**: Add `role="status"` and `<div class="sr-only">Loading...</div>`.
- [x] Done

### M32. Error states lack `role="alert"`
- **WCAG**: 4.1.3 Status Messages
- **Location**: `council/[slug]/error.tsx`, `proposals/error.tsx`
- **Fix**: Add `role="alert"` to error content container.
- [x] Done

### M33. Color sole indicator of "winner" in comparison
- **WCAG**: 1.4.1 Use of Color
- **Location**: `compare/[matchup]/page.tsx` line 221
- **Fix**: Add checkmark icon or textual label alongside color.
- [x] Done

---

## Phase 6 — Minor issues (backlog)

### Decorative icons missing `aria-hidden` (10)
- [ ] Header logo `<Landmark>` icon — `Header.tsx:92`
- [ ] Mobile hamburger icons (small breakpoint) — `Header.tsx:168`
- [ ] LeadershipCard `<User>` icons — `LeadershipCard.tsx:39,51,82`
- [ ] ContributeBanner `<Heart>` icon — `ContributeBanner.tsx:12`
- [ ] DonateButton `<Heart>` icons — `DonateButton.tsx:100,179,185`
- [ ] Search icon in overlay — `SearchCommand.tsx:286`
- [ ] CouncilSelector search icons — `CouncilSelector.tsx:280,338,393`
- [ ] Sonner toast icons — `sonner.tsx:20–25`
- [ ] About page section icons — `about/page.tsx:36,73,84,125`
- [ ] CheckCircle list bullet icons — About, Accessibility, Updates, Methodology pages

### External links missing `sr-only` "(opens in new tab)" (4)
- [ ] About page data source links — `about/page.tsx:134–169`
- [ ] Privacy page external links — `privacy/page.tsx:59,107,149,163`
- [ ] License page GitHub link — `license/page.tsx:200`
- [ ] Methodology page source links — `methodology/page.tsx:185–236`

### `prefers-contrast: more` needs expansion
- [ ] Expand to cover `--positive`, `--negative`, `--accent-foreground`, `--destructive`, `--chart-*` in both light and dark — `globals.css:756–766`

### No forced-colors focus indicator
- [ ] Add `@media (forced-colors: active) { :focus-visible { outline: 3px solid Highlight; } }` — `globals.css:769`

### `type-caption` at 13px (below project 14px rule)
- [ ] Consider bumping to 14px — `globals.css:450`

### Card hover `translateY(-1px)` not suppressed in reduced-motion
- [ ] Add `@media (prefers-reduced-motion: reduce) { .card-elevated-interactive:hover { transform: none; } }` — `globals.css:317`

### Dark mode input barely distinguishable from card
- [ ] Increase to `oklch(0.30 0.006 250)` — `globals.css:506`

### No in-app motion toggle
- [ ] Consider adding `.reduce-motion` class toggle — systemic

### Hover effects not gated behind `@media (hover: hover)`
- [ ] Gate hover utilities for touch devices — systemic

### Mobile menu buttons missing `aria-expanded`
- [ ] Add `aria-expanded={mobileMenuOpen}` — `Header.tsx:146,160`

### Floating nav focusable when hidden
- [ ] Add `inert` or `visibility: hidden` when `!isScrolled` — `Header.tsx:226`

### Sticky nav buttons 36px
- [ ] Increase to `h-11 w-11` — `Header.tsx:340`

### MilestoneBar lacks `role="progressbar"`
- [ ] Add `role="progressbar" aria-valuenow aria-valuemin aria-valuemax` — `MilestoneBar.tsx:18`

### ProposalForm tags lack `aria-pressed`
- [ ] Add `aria-pressed={labels.includes(l.value)}` — `ProposalForm.tsx:325`

### Breadcrumb missing `aria-current="page"`
- [ ] Add to last item — `Breadcrumb.tsx:33`

### CommentForm textarea lacks label
- [ ] Add `aria-label="Write a comment"` — `CommentForm.tsx:125`

### Postcode error/loading not in `aria-live` region
- [ ] Add `aria-live="polite"` to results containers — `CouncilSelector.tsx`, `SearchCommand.tsx`

### Login error not announced
- [ ] Add `role="alert"` — `auth/login/page.tsx:105`

### Heading inconsistencies (Privacy, Terms, Methodology)
- [ ] Promote subsection h3s to h2 where appropriate

### Session expiry has no warning
- [ ] Add `aria-live` announcement when signed out — `AuthContext.tsx`

### Embed pages lack landmarks
- [ ] Add `<main>` wrapper — `embed/council/`, `embed/[id]/`

### Table `<th>` elements lack `scope="col"`
- [ ] Leaderboards — `leaderboards/page.tsx:97`
- [ ] Compare — `CompareClient.tsx:306`

### Color-only indicators (additional)
- [ ] Service quality ratings — `ServiceOutcomesCard.tsx:157`
- [ ] KPI status dots — `ServiceOutcomesCard.tsx:270`
- [ ] YourBillCard precept bar — `YourBillCard.tsx:94`

### BillHistoryCard SVG chart inaccessible
- [ ] Add `role="img" aria-label` or `aria-hidden="true"` — `BillHistoryCard.tsx:57`

### CardTitle/CardDescription use `<div>` not semantic elements
- [ ] Consider `<h3>` default for CardTitle, `<p>` for CardDescription — `card.tsx:31,41`

### Redundant `tabIndex={0}` on input
- [ ] Remove from natively focusable input — `SearchCommand.tsx:300`

### Sort buttons lack group label
- [ ] Add `role="group" aria-label="Sort proposals"` + `aria-pressed` — `proposals/page.tsx:259`

### Proposals loading/empty states not announced
- [ ] Add `aria-live="polite"` to proposals list container — `townhall/page.tsx:123`, `proposals/page.tsx:292`

### Sonner error toasts should use `aria-live="assertive"`
- [ ] Configure Sonner `toastOptions` for error assertiveness

---

## Positive Findings (no action needed)

- External link `sr-only` text used consistently across dashboard cards, Footer, DataSourcesFooter
- `aria-expanded` + `aria-controls` on SpendingCard, SuppliersGrantsCard, PayAllowancesCard
- AlertDialog (Radix) provides proper focus trapping and keyboard handling
- ThemeToggle has dynamic `aria-label` based on current state
- ProposalForm uses `aria-describedby`, `aria-invalid`, `aria-live="polite"` for validation
- `prefers-reduced-motion` media query disables all animations globally
- `prefers-contrast: more` exists (needs expansion)
- `forced-colors: active` partial support exists
- Skip link present in root layout
- All pages have `<main id="main-content">`
