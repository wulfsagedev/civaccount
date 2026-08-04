# Plan 001: Establish a test baseline (Vitest) for money math, rate-limit + stats helpers

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat bc409c3..HEAD -- package.json src/data/councils.ts src/lib/rate-limit.ts src/lib/insights-stats.ts`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: LOW
- **Depends on**: none
- **Category**: tests
- **Planned at**: commit `bc409c3`, 2026-07-07

## Why this matters

CivAccount ships financial figures (council-tax bills, budgets, CEO pay) to a public,
trust-sensitive audience, yet there is **no app-code test runner** — CI runs only
`tsc --noEmit`, ESLint, and *data* validators (`scripts/validate/`, which check the
dataset, not the code that formats and aggregates it). A one-character regression in
`formatCurrency`, `calculateBands`, or the rate limiter would ship silently. This plan
adds a fast unit-test runner (Vitest) and characterization tests for the riskiest pure
functions, so the other plans in this directory (which change API param handling, the
rate limiter, and the data-delivery architecture) have a safety net. It also fixes one
real bug found during the audit: the median helper is biased high on even-length inputs.

## Current state

- **No test infrastructure exists.** `package.json` has no `test` script and no test
  runner in `devDependencies`. There are zero `*.test.ts` / `*.spec.ts` files under `src/`.
- **`src/data/councils.ts`** — pure formatting/derivation helpers. Excerpts as they exist
  today (do not change their behaviour except where a step says so):

  ```ts
  // src/data/councils.ts:583
  export function calculateBands(bandD: number): Record<string, number> {
    return {
      A: bandD * (6/9), B: bandD * (7/9), C: bandD * (8/9), D: bandD,
      E: bandD * (11/9), F: bandD * (13/9), G: bandD * (15/9), H: bandD * 2,
    };
  }

  // src/data/councils.ts:631
  export function formatBudget(amountInThousands: number | null): string { /* 'N/A' on null; negatives; £X billion / £X million / £n,nnn */ }

  // src/data/councils.ts:662
  export function formatCurrency(amount: number | null, options?: { decimals?: number }): string {
    if (amount === null) return 'N/A';
    const decimals = options?.decimals ?? (amount % 1 === 0 ? 0 : 2);
    return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP',
      minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(amount);
  }
  ```

- **`src/lib/rate-limit.ts`** — exports `getClientIP(request: Request): string` (pure, header
  precedence: `x-vercel-forwarded-for` → `x-real-ip` → `x-forwarded-for` → `'unknown'`, all
  lowercased/trimmed) and `checkRateLimit(identifier, config)` (async; falls back to an
  in-memory limiter when Redis env vars are absent — which is the case under test).

- **`src/lib/insights-stats.ts`** — contains the median bug to fix:

  ```ts
  // src/lib/insights-stats.ts:111  (inside getNationalBillStats)
  median: sorted[Math.floor(sorted.length / 2)],
  // src/lib/insights-stats.ts:334  (inside getCeoPayStats)
  median: sorted[Math.floor(sorted.length / 2)],
  ```
  For an even-length sorted array `[10,20,30,40]` this returns `30` (upper-middle) instead
  of the true median `25`. Both call sites operate on the live `councils` array, so a unit
  test that imports them will pull real data — prefer to test a small **extracted** median
  helper (Step 3) rather than the whole aggregate.

- **Repo conventions**: TypeScript 5, ESM, path alias `@/` → `src/` (see `tsconfig.json`
  `compilerOptions.paths`). Money is stored in **thousands** and multiplied by 1000 for
  display — tests must encode this (e.g. `formatBudget(21300)` → `"£21.3 million"`). Node 20
  in CI. `describe/it/expect` style.

## Commands you will need

| Purpose   | Command                         | Expected on success |
|-----------|---------------------------------|---------------------|
| Install   | `npm install`                   | exit 0              |
| Typecheck | `npx tsc --noEmit`              | exit 0, no errors   |
| Tests     | `npm test`                      | all pass            |
| Lint      | `npm run lint`                  | exit 0              |

(The typecheck/lint commands are what CI already runs — see `.github/workflows/ci.yml`.)

## Suggested executor toolkit

- Vitest is the recommended runner (fast, ESM-native, Vite-based; the repo already uses
  Vite-family tooling via Next/Turbopack). Use `vitest` in `node` environment for the pure
  helpers — no jsdom needed for this plan.

## Scope

**In scope** (the only files you should modify or create):
- `package.json` — add `vitest` devDependency + `test` and `test:run` scripts
- `vitest.config.ts` (create) — minimal config with the `@/` alias
- `src/data/councils.test.ts` (create)
- `src/lib/rate-limit.test.ts` (create)
- `src/lib/insights-stats.ts` — **only** the two `median:` lines (Step 3), via a shared helper
- `src/lib/stats-helpers.test.ts` (create) — tests for the extracted median helper
- `.github/workflows/ci.yml` — add a test step (Step 5)

**Out of scope** (do NOT touch, even though they look related):
- Any dataset file under `src/data/councils/**` or `src/data/councils-fixtures/**` — tests
  must not depend on specific council values that could change with a data refresh.
- `scripts/validate/**` — that is the separate *data* validation suite; leave it alone.
- The behaviour of `formatCurrency` / `formatBudget` / `calculateBands` — characterize them
  as-is; do NOT "fix" rounding you personally dislike. If a test reveals surprising output,
  record the actual output as the expectation and note it in Maintenance notes.

## Git workflow

- Branch: `advisor/001-test-baseline`
- Commit style matches the repo's conventional-commits (`git log --oneline` shows
  `feat(...)`, `chore(...)`, `fix(...)`). Example commit: `test: add Vitest baseline for money + rate-limit helpers`.
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Add Vitest and scripts

Add to `package.json` `devDependencies`: `"vitest": "^3"`. Add to `scripts`:
`"test": "vitest run"` and `"test:watch": "vitest"`. Then install.

Create `vitest.config.ts` at the repo root:

```ts
import { defineConfig } from 'vitest/config';
import { resolve } from 'node:path';

export default defineConfig({
  test: { environment: 'node', include: ['src/**/*.test.ts'] },
  resolve: { alias: { '@': resolve(__dirname, 'src') } },
});
```

**Verify**: `npm install` → exit 0. `npx vitest run --reporter=dot` → runs (0 tests found is fine at this point).

### Step 2: Characterization tests for money helpers

Create `src/data/councils.test.ts`. Import `calculateBands`, `formatBudget`, `formatCurrency`
from `@/data/councils`. Cover at minimum:
- `calculateBands(1800)`: Band D === 1800, Band A === 1200 (2/3), Band H === 3600 (2×), and
  that `E/F/G` follow the 11/9, 13/9, 15/9 ratios.
- `formatCurrency(null)` === `'N/A'`; `formatCurrency(288.45, { decimals: 2 })` === `'£288.45'`;
  `formatCurrency(112)` (integer, default decimals) === `'£112'`.
- `formatBudget(null)` === `'N/A'`; `formatBudget(21300)` === `'£21.3 million'`;
  `formatBudget(-21300)` starts with `'-'`; `formatBudget(500)` === `'£500,000'` (thousands path).

Run each expectation once against the real function first if unsure of exact output, then
lock the observed string in as the expectation (this is characterization, not redesign).

**Verify**: `npm test` → this file's tests pass.

### Step 3: Extract and fix the median helper, then test it

In `src/lib/insights-stats.ts`, add a small exported pure helper near the top of the file
(after imports):

```ts
/** True median of a numeric array. Averages the two middle values on even length. */
export function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}
```

Replace the two buggy sites so they reuse it:
- Line ~111 (`getNationalBillStats`): `median: median(values),`
- Line ~334 (`getCeoPayStats`): `median: median(salaries),`

(Confirm the local variable names at each site — `values` and `salaries` in the current
code. Do NOT change any other field of those objects.)

Create `src/lib/stats-helpers.test.ts` importing `median` from `@/lib/insights-stats`:
- `median([10,20,30,40])` === `25` (the bug this fixes)
- `median([10,20,30])` === `20`
- `median([])` === `0`
- `median([5])` === `5`

**Verify**: `npm test` → median tests pass. `npx tsc --noEmit` → exit 0.

### Step 4: Tests for `getClientIP`

Create `src/lib/rate-limit.test.ts`. Import `getClientIP` from `@/lib/rate-limit`. Build
`Request` objects with headers and assert:
- `x-vercel-forwarded-for: '1.2.3.4, 5.6.7.8'` → `'1.2.3.4'` (first entry, wins over others).
- Only `x-real-ip: '9.9.9.9'` → `'9.9.9.9'`.
- Only `x-forwarded-for: '  AB:CD::1 , 2.2.2.2'` → `'ab:cd::1'` (leftmost, trimmed, lowercased).
- No IP headers → `'unknown'`.

Use `new Request('https://x', { headers: { ... } })` — no network. Do NOT test
`checkRateLimit` timing behaviour here (it's stateful/module-level); IP extraction is the
pure, high-value surface. If you want one `checkRateLimit` smoke test, assert that the first
call with a fresh identifier returns `{ success: true }` and that exceeding the limit within
the window returns `{ success: false }` using a tiny config like `{ limit: 2, windowSeconds: 60 }`
and a unique identifier per test to avoid cross-test state bleed.

**Verify**: `npm test` → all rate-limit tests pass.

### Step 5: Wire tests into CI

In `.github/workflows/ci.yml`, add a step in the `check` job **after** the `Lint` step and
before `Validate council data`:

```yaml
      - name: Unit tests
        run: npm test
```

Do not change any other job or the `permissions` block.

**Verify**: `npm test` locally → exit 0. `git diff .github/workflows/ci.yml` shows only the
added step.

## Test plan

- New files: `src/data/councils.test.ts`, `src/lib/stats-helpers.test.ts`,
  `src/lib/rate-limit.test.ts` — covering money formatting, band derivation, the median
  even-length bug (regression), and client-IP extraction precedence.
- No existing test to model after (this is the first). Follow standard Vitest
  `describe`/`it`/`expect` structure.
- Verification: `npm test` → all pass, at least ~15 assertions across 3 files.

## Done criteria

Machine-checkable. ALL must hold:

- [ ] `npm test` exits 0 and reports the new test files passing
- [ ] `npx tsc --noEmit` exits 0
- [ ] `npm run lint` exits 0
- [ ] `grep -n "Math.floor(sorted.length / 2)" src/lib/insights-stats.ts` returns **no**
      matches inside `getNationalBillStats`/`getCeoPayStats` (they now call `median(...)`);
      the only remaining occurrence, if any, is inside the new `median` helper itself
- [ ] `grep -rn "vitest" package.json` shows the devDependency and `test` script
- [ ] `.github/workflows/ci.yml` contains a `npm test` step
- [ ] No files outside the in-scope list are modified (`git status`)
- [ ] `plans/README.md` status row for 001 updated

## STOP conditions

Stop and report back (do not improvise) if:

- The excerpts in "Current state" don't match the live code (drift since `bc409c3`).
- `formatBudget`/`formatCurrency` produce output that differs from the expectations above
  in a way that suggests a real behaviour change landed since this plan — record the actual
  output and STOP rather than "fixing" the function.
- Importing `@/lib/insights-stats` in a test pulls in the full council dataset and the test
  run becomes slow or fails to resolve `@council-data` — if so, keep the `median` helper in
  a new leaf file `src/lib/stats-helpers.ts` (no dataset imports), re-export it from
  `insights-stats.ts`, and test the leaf file instead. Report that you did this.
- Adding the CI test step would require changing the `permissions` block or another job.

## Maintenance notes

- These are **characterization** tests: they lock in current behaviour so future refactors
  (plans 002–004) are safe. If a deliberate behaviour change is made later, update the
  expectation in the same PR and call it out in review.
- When plan 004 moves the dataset behind a server boundary, `insights-stats.ts` may stop
  importing the dataset at module scope — the `median` leaf-file split (STOP condition
  above) makes that migration cleaner, so prefer it proactively.
- A reviewer should confirm no test asserts on a specific council's live figure (those
  change on data refresh and would make the suite flaky).
