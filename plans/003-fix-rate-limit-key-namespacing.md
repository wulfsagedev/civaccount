# Plan 003: Fix rate-limit key namespacing across `/api/v1/*`; align public rate-limit docs

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat bc409c3..HEAD -- src/app/api/v1 src/lib/rate-limit.ts README.md src/app/developers`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW
- **Depends on**: plans/001 (recommended — provides the test runner)
- **Category**: security
- **Planned at**: commit `bc409c3`, 2026-07-07

## Why this matters

The four public `/api/v1/*` routes call `checkRateLimit(ip, ...)` with a **bare IP** as the
identifier, while every other rate-limited route uses a route-scoped key
(`checkout:${ip}`, `share-stat:${ip}`, `csp-report:${ip}`, `feedback:${ip}`). The Upstash
limiter builds its Redis key as `${prefix}:${identifier}` with a single hardcoded
`prefix: 'civaccount'`, so all four v1 routes collide on **one shared bucket per IP** —
even though they declare different limits (the councils *list* route wants 60/min; slug,
diffs, and proposals want 100/min). A caller hammering `/api/v1/councils/[slug]` therefore
also burns the budget that should protect `/api/v1/councils?search=` — and the stricter
60/min anti-enumeration limit on the list route is undermined by requests to sibling
endpoints. Rate limiting is a load-bearing part of the deliberate anti-scraping posture, so
"the limiter doesn't bucket the way the code claims" is worth fixing. This plan also aligns
the public docs, which advertise "100 req/min" while the list endpoint enforces 60 (the
exact drift `../DATA-ACCESS-POLICY.md` Phase 3 flagged as unfixed).

## Current state

Rate-limit call sites (verified at `bc409c3`):

```ts
// src/app/api/v1/councils/route.ts:28
const { success: allowed, remaining } = await checkRateLimit(ip, { limit: 60, windowSeconds: 60 });
// src/app/api/v1/councils/[slug]/route.ts:11
const { success: allowed, remaining } = await checkRateLimit(ip, { limit: 100, windowSeconds: 60 });
// src/app/api/v1/proposals/route.ts:7
const { success: allowed, remaining } = await checkRateLimit(ip, { limit: 100, windowSeconds: 60 });
// src/app/api/v1/diffs/route.ts:7
const { success: allowed, remaining } = await checkRateLimit(ip, { limit: 100, windowSeconds: 60 });

// Contrast — every other route already scopes the key:
// src/app/api/checkout/route.ts:27   checkRateLimit(`checkout:${clientIP}`, ...)
// src/app/api/share/stat/route.tsx:29 checkRateLimit(`share-stat:${ip}`, ...)
```

The limiter (do NOT change this file's logic — it is correct given a well-formed key):

```ts
// src/lib/rate-limit.ts:26-38  — one shared prefix; the identifier is the ONLY thing that separates buckets
rl = new Ratelimit({ redis: getRedis()!, limiter: Ratelimit.slidingWindow(config.limit, `${config.windowSeconds} s`), prefix: 'civaccount' });
```

Public docs stating the limit:

```
README.md:28                     "... no key, 100 req/min"
src/app/developers/page.tsx:114  <p ...>100</p>            (stat card)
src/app/developers/page.tsx:169  "No key. 100 requests per minute per IP. ..."
src/app/developers/page.tsx:286  "Rate limit: 100 req/min/IP. ..."
```

**Repo convention**: the route-scoped key format is `"<scope>:<ip>"` (colon-separated,
lowercase scope). Match it exactly.

## Commands you will need

| Purpose   | Command                                    | Expected on success |
|-----------|--------------------------------------------|---------------------|
| Typecheck | `npx tsc --noEmit`                         | exit 0              |
| Tests     | `npm test`                                 | all pass            |
| Lint      | `npm run lint`                             | exit 0              |
| Grep keys | `grep -rn "checkRateLimit(" src/app/api`   | see Step 4          |

## Scope

**In scope** (the only files you should modify):
- `src/app/api/v1/councils/route.ts`
- `src/app/api/v1/councils/[slug]/route.ts`
- `src/app/api/v1/diffs/route.ts`
- `src/app/api/v1/proposals/route.ts`
- `README.md` (one line)
- `src/app/developers/page.tsx` (the three doc strings above)

**Out of scope** (do NOT touch):
- `src/lib/rate-limit.ts` — the limiter is correct; the bug is in the *keys the callers
  pass*, not the limiter. Do not add a per-route prefix parameter to `checkRateLimit`; scope
  the identifier at the call site instead (consistent with all existing routes).
- The numeric limits themselves — keep 60 for the list route and 100 for slug/diffs/
  proposals. This plan changes *keys and docs*, not policy. (If the product owner wants a
  single uniform limit, that is a separate decision — do not make it here.)
- Query-param parsing — that is plan 002. If 002 has landed, its changes coexist fine; just
  don't revert them.

## Git workflow

- Branch: `advisor/003-ratelimit-keys`
- Commit style: conventional commits (e.g. `fix(api): scope rate-limit keys per v1 endpoint; align docs`).
- Do NOT push or open a PR unless instructed.

## Steps

### Step 1: Scope each v1 rate-limit key

Give each route a distinct identifier so buckets no longer collide. Keep the limits as-is.

- `councils/route.ts:28` → `checkRateLimit(\`v1-councils-list:${ip}\`, { limit: 60, windowSeconds: 60 })`
- `councils/[slug]/route.ts:11` → `checkRateLimit(\`v1-council:${ip}\`, { limit: 100, windowSeconds: 60 })`
- `diffs/route.ts:7` → `checkRateLimit(\`v1-diffs:${ip}\`, { limit: 100, windowSeconds: 60 })`
- `proposals/route.ts:7` → `checkRateLimit(\`v1-proposals:${ip}\`, { limit: 100, windowSeconds: 60 })`

Use backtick template strings; keep the destructured `{ success: allowed, remaining }` and
everything else on those lines unchanged.

**Verify**: `npx tsc --noEmit` → exit 0.

### Step 2: Align the README

`README.md:28` currently reads `... no key, 100 req/min`. Change to reflect that the list
search endpoint is stricter:

> free JSON per-council endpoints + embeddable iframe widgets, no key, 100 req/min (60/min on councils search)

Keep the surrounding sentence intact; only adjust the rate-limit clause.

### Step 3: Align the developers page

In `src/app/developers/page.tsx`, update the three sites so they no longer assert a flat 100:
- Line ~114 stat card + line ~169 prose: change to convey "100 requests per minute per IP
  (60/min on the councils search endpoint)". Keep the JSX structure; only edit the text /
  the number rendered. If the stat card renders a single bare number (`100`) that cannot
  hold a qualifier, leave the `100` but ensure the adjacent descriptive line names the 60/min
  search exception.
- Line ~286: change `Rate limit: 100 req/min/IP.` → `Rate limit: 100 req/min/IP (60/min on councils search).`

Do not restyle or restructure the page — text-only edits (respect the design-system
`type-*` classes already present).

**Verify**: `npm run lint` → exit 0. `npx tsc --noEmit` → exit 0.

### Step 4: Confirm every rate-limit key is now scoped

**Verify**: `grep -rn "checkRateLimit(ip" src/app/api/v1` → returns **no** matches
(every v1 call now passes a `"<scope>:${ip}"` template, not a bare `ip`).

Optional stronger check: `grep -rn "checkRateLimit(" src/app/api` → every line shows a
colon-scoped identifier.

## Test plan

- No new unit test is strictly required (the change is a string key), but if plan 001's
  runner exists, add one assertion to `src/lib/rate-limit.test.ts`: two different identifiers
  (`a:1.1.1.1` and `b:1.1.1.1`) with `{ limit: 1, windowSeconds: 60 }` do **not** share a
  bucket — the first call on each returns `success: true` (proving identifier scoping
  separates buckets in the in-memory limiter).
- Verification: `npm test` → passes (including the new assertion if added).

## Done criteria

Machine-checkable. ALL must hold:

- [ ] `grep -rn "checkRateLimit(ip" src/app/api/v1` returns no matches
- [ ] Each of the four v1 routes uses a distinct `"<scope>:${ip}"` key
- [ ] `grep -rn "100 req/min\|100 requests per minute" README.md src/app/developers/page.tsx`
      — every remaining hit is accompanied by the 60/min councils-search qualifier
- [ ] `npx tsc --noEmit` exits 0; `npm run lint` exits 0; `npm test` exits 0 (if 001 landed)
- [ ] No files outside the in-scope list are modified (`git status`)
- [ ] `plans/README.md` status row for 003 updated

## STOP conditions

Stop and report back (do not improvise) if:

- `src/lib/rate-limit.ts` has been refactored so `checkRateLimit` already takes a route
  scope — adapt to the new signature and note it, rather than double-scoping.
- The developers page has been restructured and the three doc strings are gone or moved —
  find and update the current rate-limit claim(s), or STOP if you cannot locate an
  equivalent.
- You discover a v1 route intentionally shares a bucket with another (there is no evidence
  of this, but if a comment says so, STOP and report the contradiction).

## Maintenance notes

- The real defence against enumeration is the "a filter is required" 400 in
  `councils/route.ts` plus the 60/min ceiling; this plan makes that ceiling actually apply
  to the list endpoint in isolation. Keep both.
- If a shared per-user (not per-IP) limit is ever wanted, that is a bigger change to the
  identifier scheme — revisit `getClientIP` usage then.
- Reviewer should confirm the docs and the enforced limits stay in sync in any future PR
  that changes a limit (this drift has recurred once already — see `../DATA-ACCESS-POLICY.md`
  Phase 3).
