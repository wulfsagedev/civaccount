# Plan 005: Stop calling `supabase.auth.getUser()` on anonymous / API / OG-image requests

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat bc409c3..HEAD -- src/middleware.ts`
> If `src/middleware.ts` changed since this plan was written, compare the
> "Current state" excerpt against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: perf
- **Planned at**: commit `bc409c3`, 2026-07-07

## Why this matters

`src/middleware.ts` runs on essentially every request (its matcher excludes only static
assets) and unconditionally `await`s `supabase.auth.getUser()` — a network round-trip to
Supabase — before doing anything else. On this site 90%+ of traffic is anonymous, and the
matcher also covers `/api/**` (rate-limit checks, feedback, the public v1 JSON API) and
`/api/share/**` (server-rendered OG images). Those requests gain nothing from an auth refresh
but pay its latency, and OG-image / API responses are exactly where added latency hurts
(social unfurls, crawlers, embeds). The middleware still needs to run for URL normalization
and the geo cookie, so this plan keeps that and only **skips the auth call when there is no
Supabase session cookie and on API/OG routes** — a targeted, low-risk trim.

## Current state

`src/middleware.ts` (relevant excerpt):

```ts
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  // URL normalization: lowercase + strip trailing slash (redirect 308) ...
  let supabaseResponse = NextResponse.next({ request });
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() {...}, setAll(cookiesToSet) {...} } },
  );
  // Refresh the auth session so it doesn't expire
  await supabase.auth.getUser();            // ← runs for EVERY matched request
  // geo check via x-vercel-ip-country, set `geo` cookie ...
  // block non-UK from /auth/login, /auth/callback, /proposals/new ...
  return supabaseResponse;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|icon|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
```

Key facts:
- `getUser()` is called to keep the session token fresh (the standard Supabase SSR pattern).
  It is only meaningful when the request carries a Supabase auth cookie. Anonymous requests
  have no such cookie, so the call is pure overhead for them.
- The geo cookie + URL normalization + non-UK participation blocks must keep working for all
  requests (they don't depend on `getUser()`).
- Supabase auth cookies are the `sb-*` cookies set by `@supabase/ssr` (names start with `sb-`
  and include `-auth-token`). Presence of any such cookie is a safe, cheap signal that a
  session *might* exist and should be refreshed.
- The matcher currently includes `/api/**` and `/api/share/**`.

**Repo conventions**: middleware uses `@supabase/ssr`'s `createServerClient` with the
`getAll`/`setAll` cookie adapter (do not change that adapter). Geo relies on Vercel's
`x-vercel-ip-country` header.

## Commands you will need

| Purpose        | Command                                | Expected on success |
|----------------|----------------------------------------|---------------------|
| Typecheck      | `npx tsc --noEmit`                     | exit 0              |
| Lint           | `npm run lint`                         | exit 0              |
| Build (fixture)| `CIVACCOUNT_FIXTURES=1 npm run build`  | exit 0              |
| Dev smoke      | `CIVACCOUNT_FIXTURES=1 npm run dev`    | see Step 3          |

## Scope

**In scope** (the only file you should modify):
- `src/middleware.ts`

**Out of scope** (do NOT touch):
- `src/lib/supabase/server.ts` / `client.ts` — the client factories are fine.
- Auth callback / login routes (`src/app/auth/**`) — behaviour unchanged.
- The geo-block logic itself (which paths are blocked) — keep it exactly as-is; only change
  *when the auth refresh runs*, not the participation rules.
- Rate-limit code — unrelated.

## Git workflow

- Branch: `advisor/005-slim-middleware`
- Commit style: conventional commits (e.g. `perf(middleware): skip auth refresh for anonymous + api/og requests`).
- Do NOT push or open a PR unless instructed.

## Steps

### Step 1: Skip the auth call on API and OG routes, and when no session cookie is present

Edit `src/middleware.ts` so the `await supabase.auth.getUser()` line only runs when both:
(a) the path is not an API/OG route, and (b) a Supabase auth cookie is present.

Add, before creating the Supabase client (or before the `getUser()` call), a guard:

```ts
const isApiOrOg = pathname.startsWith('/api');
const hasSupabaseSession = request.cookies
  .getAll()
  .some((c) => c.name.startsWith('sb-') && c.name.includes('auth-token'));

// Only refresh the session when it can matter: a real page request that
// actually carries a Supabase session cookie. Anonymous traffic (90%+) and
// API/OG routes skip the round-trip.
if (!isApiOrOg && hasSupabaseSession) {
  await supabase.auth.getUser();
}
```

Keep the Supabase client creation as-is (it also wires the `setAll` cookie refresh onto
`supabaseResponse`, which is harmless when `getUser()` isn't called). Everything after —
geo cookie, non-UK blocks, `return supabaseResponse` — stays unchanged and still runs for
every matched request.

**Do not** remove `/api` from the matcher: the matcher must keep matching so URL
normalization and the geo cookie still apply; the change is that the *auth call* is now
conditional.

**Verify**: `npx tsc --noEmit` → exit 0. `npm run lint` → exit 0.

### Step 2: Confirm the guard

**Verify**: `grep -n "getUser()" src/middleware.ts` → the call appears exactly once, inside
the `if (!isApiOrOg && hasSupabaseSession)` block.

### Step 3: Smoke-test auth + anonymous flows

Run `CIVACCOUNT_FIXTURES=1 npm run dev`, then:
- Anonymous: load `/` and `/council/kent` → pages work; a `geo` cookie is set (check devtools
  → Application → Cookies). `/api/v1/councils?search=kent` → returns JSON and is not
  redirected/blocked.
- URL normalization still works: request `/Council/Kent/` (mixed case, trailing slash) →
  308-redirects to `/council/kent`.
- Authenticated (if a Supabase test project + login is available): sign in, navigate between
  pages, confirm the session persists and does not get logged out (i.e. the refresh still
  happens for real sessions). If no auth environment is available, note that this path was
  verified by code inspection only.

**Verify**: all three behave as described; `CIVACCOUNT_FIXTURES=1 npm run build` exits 0.

## Test plan

- No unit test is added (middleware runs in the edge/runtime and depends on Vercel headers;
  it is not cheaply unit-testable in this repo). Verification is the Step 3 smoke test plus
  typecheck/lint/build.
- If plan 001's runner exists and you want a guard, a small pure helper
  `hasSupabaseSessionCookie(cookieNames: string[]): boolean` could be extracted and unit
  tested — optional, not required.

## Done criteria

Machine-checkable. ALL must hold:

- [ ] `grep -n "getUser()" src/middleware.ts` shows the call guarded by
      `if (!isApiOrOg && hasSupabaseSession)`
- [ ] The matcher in `src/middleware.ts` is unchanged (still matches `/api`)
- [ ] `npx tsc --noEmit` exits 0; `npm run lint` exits 0; `CIVACCOUNT_FIXTURES=1 npm run build` exits 0
- [ ] Anonymous page loads set the `geo` cookie; `/api/v1/councils?search=kent` returns JSON;
      `/Council/Kent/` 308-redirects to `/council/kent`
- [ ] No files outside `src/middleware.ts` are modified (`git status`)
- [ ] `plans/README.md` status row for 005 updated

## STOP conditions

Stop and report back (do not improvise) if:

- The middleware has been refactored since `bc409c3` such that `getUser()` is already
  conditional or moved — reconcile with the new shape and note it.
- The Supabase auth cookie names in this project do NOT start with `sb-` / contain
  `auth-token` (inspect the cookies on a logged-in session). If they differ, use the actual
  cookie-name pattern and report what it is; do not guess.
- After the change, a logged-in session gets unexpectedly signed out or the session stops
  refreshing — that means the refresh must run more broadly than this guard allows; revert
  and report.
- The geo cookie or the non-UK participation blocks stop working — revert and report (those
  must be unaffected).

## Maintenance notes

- The core reason `getUser()` was unconditional is the standard Supabase SSR "refresh on every
  request" recipe. Narrowing it to cookie-bearing, non-API requests is safe because a request
  with no session cookie has nothing to refresh, and API/OG responses don't render
  authenticated UI. If a future feature needs auth inside an `/api` route, that route should
  call `getUser()` itself (server-side) rather than relying on middleware.
- A reviewer should confirm the participation gating (non-UK users blocked from
  `/auth/login`, `/auth/callback`, `/proposals/new`) still fires — it lives after the guard
  and does not depend on `getUser()`, but verify it wasn't disturbed.
- If Supabase changes its cookie naming convention in a future `@supabase/ssr` major, revisit
  the `hasSupabaseSession` detection.
