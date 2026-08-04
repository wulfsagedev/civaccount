# Plan 002: Validate & bound API query params; stop leaking Supabase error messages

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat bc409c3..HEAD -- src/app/api/v1`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW
- **Depends on**: plans/001 (recommended — provides the test runner used here)
- **Category**: bug / security
- **Planned at**: commit `bc409c3`, 2026-07-07

## Why this matters

The public `/api/v1/*` routes parse `limit`/`offset` query params with bare `parseInt(...)`
and no NaN guard. A request like `?limit=abc` makes `parseInt` return `NaN`, which then
flows into Supabase's `.range(offset, offset + limit - 1)` on the proposals route —
producing a **500** whose body is the raw Supabase `error.message` (internal detail leaked
to any anonymous caller). On the `diffs` and `councils` routes the same NaN silently
corrupts pagination (`Math.min(NaN, 50)` is `NaN`; `slice(0, NaN)` yields an empty page and
returns `"limit": NaN` in the JSON). None of this is catastrophic, but it is trivially
triggerable, pollutes logs/alerts, and leaks backend internals on a site that otherwise
takes hardening seriously. The fix is a tiny shared parse helper plus not passing raw
Supabase errors to clients.

## Current state

Four routes, all reading `NextRequest` search params. The problem lines:

```ts
// src/app/api/v1/proposals/route.ts:19-20, 39-45
const limit = Math.min(parseInt(searchParams.get('limit') ?? '20'), 50);
const offset = parseInt(searchParams.get('offset') ?? '0');
// ...
query = query.range(offset, offset + limit - 1);
const { data, error } = await query;
if (error) {
  return NextResponse.json({ error: error.message }, { status: 500 }); // ← leaks internal detail
}
```

```ts
// src/app/api/v1/diffs/route.ts:18
const limit = Math.min(parseInt(searchParams.get('limit') ?? '20'), 50);
```

```ts
// src/app/api/v1/councils/route.ts:40
const limit = Math.min(parseInt(searchParams.get('limit') ?? '20'), 20);
```

`src/app/api/v1/councils/[slug]/route.ts` reads no numeric params (slug only) — leave it.

**Repo conventions**: routes are Next.js App Router `route.ts` handlers returning
`NextResponse.json(...)`. Rate limiting via `checkRateLimit`/`getClientIP` from
`@/lib/rate-limit` is already at the top of each handler — do not remove or reorder it.
Small shared primitives live in `src/lib/` (see `src/lib/security.ts` for the existing
"small primitives, not a framework" style — match it).

## Commands you will need

| Purpose   | Command                                | Expected on success |
|-----------|----------------------------------------|---------------------|
| Typecheck | `npx tsc --noEmit`                     | exit 0              |
| Tests     | `npm test`                             | all pass            |
| Lint      | `npm run lint`                         | exit 0              |

(If plan 001 has not landed, `npm test` will not exist — see STOP conditions.)

## Scope

**In scope** (the only files you should modify or create):
- `src/lib/api-params.ts` (create) — shared `parseIntParam` helper
- `src/lib/api-params.test.ts` (create) — unit tests for the helper
- `src/app/api/v1/proposals/route.ts`
- `src/app/api/v1/diffs/route.ts`
- `src/app/api/v1/councils/route.ts`

**Out of scope** (do NOT touch):
- `src/app/api/v1/councils/[slug]/route.ts` — no numeric params.
- Rate-limit keying — that is plan 003's job; do NOT change the `checkRateLimit(...)` calls
  here (you will otherwise collide with 003).
- The response *shape* of any route (field names, nesting) — clients depend on it. You are
  only changing how numbers are parsed and how DB errors are reported.
- The anti-enumeration guard in `councils/route.ts` (the "a filter is required" 400) — leave
  it exactly as-is; it is a deliberate product decision.

## Git workflow

- Branch: `advisor/002-api-param-validation`
- Commit style: conventional commits (e.g. `fix(api): bound + validate limit/offset query params`).
- Do NOT push or open a PR unless instructed.

## Steps

### Step 1: Add a shared param helper

Create `src/lib/api-params.ts`:

```ts
/**
 * Parse a query-string integer with a default and clamped bounds.
 * Non-numeric / NaN / negative / out-of-range inputs collapse to a safe value
 * so untrusted params can never reach a database range() or an array slice()
 * as NaN.
 */
export function parseIntParam(
  raw: string | null,
  { fallback, min, max }: { fallback: number; min: number; max: number },
): number {
  const n = raw == null ? fallback : Number.parseInt(raw, 10);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(Math.max(Math.trunc(n), min), max);
}
```

**Verify**: `npx tsc --noEmit` → exit 0.

### Step 2: Test the helper

Create `src/lib/api-params.test.ts` (Vitest, matching plan 001's style). Cover:
- `parseIntParam('abc', { fallback: 20, min: 0, max: 50 })` === `20`
- `parseIntParam(null, { fallback: 20, min: 0, max: 50 })` === `20`
- `parseIntParam('999', { fallback: 20, min: 0, max: 50 })` === `50` (clamped high)
- `parseIntParam('-5', { fallback: 0, min: 0, max: 50 })` === `0` (clamped low)
- `parseIntParam('30', { fallback: 20, min: 0, max: 50 })` === `30`

**Verify**: `npm test` → these pass.

### Step 3: Apply to the proposals route + stop the error leak

In `src/app/api/v1/proposals/route.ts`:
- Import `parseIntParam` from `@/lib/api-params`.
- Replace the `limit`/`offset` parsing with:
  ```ts
  const limit = parseIntParam(searchParams.get('limit'), { fallback: 20, min: 1, max: 50 });
  const offset = parseIntParam(searchParams.get('offset'), { fallback: 0, min: 0, max: 100000 });
  ```
- Change the error branch so the internal message is logged, not returned:
  ```ts
  if (error) {
    console.error('[api/v1/proposals] supabase error:', error.message);
    return NextResponse.json({ error: 'Could not fetch proposals' }, { status: 500 });
  }
  ```
  (Keep the 500 status; only the body changes.)

**Verify**: `npx tsc --noEmit` → exit 0.

### Step 4: Apply to diffs and councils routes

- `src/app/api/v1/diffs/route.ts`: replace line 18 with
  `const limit = parseIntParam(searchParams.get('limit'), { fallback: 20, min: 1, max: 50 });`
- `src/app/api/v1/councils/route.ts`: replace line 40 with
  `const limit = parseIntParam(searchParams.get('limit'), { fallback: 20, min: 1, max: 20 });`
  (Preserve the existing max of 20 for the list endpoint.)

**Verify**: `npx tsc --noEmit` → exit 0. `npm run lint` → exit 0.

### Step 5: Grep-confirm no bare parseInt remains on these params

**Verify**: `grep -rn "parseInt(searchParams" src/app/api/v1` → returns **no** matches.

## Test plan

- New: `src/lib/api-params.test.ts` — happy path, NaN fallback, null fallback, clamp-high,
  clamp-low. (Route handlers themselves are integration-tested informally; unit-testing the
  helper covers the actual bug surface.)
- Model after the Vitest files created in plan 001.
- Verification: `npm test` → all pass including the 5 new assertions.

## Done criteria

Machine-checkable. ALL must hold:

- [ ] `npx tsc --noEmit` exits 0
- [ ] `npm test` exits 0; `src/lib/api-params.test.ts` exists and passes
- [ ] `grep -rn "parseInt(searchParams" src/app/api/v1` returns no matches
- [ ] `grep -rn "error.message" src/app/api/v1/proposals/route.ts` returns no match in a
      client-facing `NextResponse.json(...)` (it may appear only inside `console.error`)
- [ ] `npm run lint` exits 0
- [ ] No files outside the in-scope list are modified (`git status`)
- [ ] `plans/README.md` status row for 002 updated

## STOP conditions

Stop and report back (do not improvise) if:

- Plan 001 has not landed and there is no `npm test` script — either land 001 first, or
  create only `src/lib/api-params.ts` + its test and add a minimal `vitest` setup yourself
  ONLY if the operator confirms; otherwise STOP.
- The proposals route no longer returns `error.message` (someone already fixed the leak) —
  keep the param-validation changes, skip the error-branch change, and note it.
- Any of the four routes has changed its response shape since `bc409c3`.

## Maintenance notes

- If a new `/api/v1/*` route with numeric params is added later, it must use
  `parseIntParam` — consider an ESLint note or reviewer checklist item.
- The proposals route's `offset` max is set generously (100000); if the proposals table
  ever grows past that, revisit. It exists only to stop absurd offsets, not to paginate.
- A reviewer should confirm no other `/api/*` handler (outside v1) passes untrusted numbers
  into a DB range or array slice.
