# Plan 004: SSG the council pages and look up council data on the server

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat bc409c3..HEAD -- src/app/council/[slug] src/components/CouncilDashboard.tsx src/data/councils.ts`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: L
- **Risk**: MED
- **Depends on**: plans/001 (characterization tests must exist so a regression in rendered
  figures is caught)
- **Category**: perf
- **Planned at**: commit `bc409c3`, 2026-07-07

## Why this matters

The per-council dashboard is the core product (317 pages), and it is the single most
important surface for both the 70+/mobile audience (90% of traffic) and the SEO/AI-citation
strategy. Today `src/app/council/[slug]/page.tsx` is a **`'use client'`** page with **no
`generateStaticParams`**: every council URL renders on-demand per request (no static
prerender / no ISR), and the whole council dataset (~5.15 MB of source across
`src/data/councils/*.ts`) is pulled into the client bundle because the page and its
`CouncilDashboard` import data helpers from `@/data/councils` at the client boundary. The
code's own comments say SSR-with-real-content is "load-bearing for SEO," yet the current
shape leaves rendering dynamic and the payload huge.

This plan does the **contained, high-value first step**: convert the council page to a
**server component** that (a) statically generates all council slugs via the existing but
unused `getAllCouncilSlugs()` helper, (b) resolves the single council **on the server**, and
(c) passes that one plain council object as a prop into the (still-client) dashboard. That
alone turns 317 dynamic renders into static pages, removes the dataset import from the page's
own client boundary, and improves crawler reliability and mobile TTFB — without the much
riskier full rewrite of the search/context/selector data flow (explicitly deferred below).

## Current state

`src/app/council/[slug]/page.tsx` in full (this is what you are replacing):

```tsx
'use client';
import { useEffect, Suspense, useMemo } from 'react';
import { useParams, notFound } from 'next/navigation';
import { useCouncil } from '@/context/CouncilContext';
import { getCouncilBySlug } from '@/data/councils';
import CouncilDashboard from '@/components/CouncilDashboard';

function LoadingSkeleton() { /* ...unchanged skeleton markup... */ }

export default function CouncilPage() {
  const params = useParams();
  const slug = params.slug as string;
  const { setSelectedCouncil } = useCouncil();
  const council = useMemo(() => getCouncilBySlug(slug), [slug]);
  useEffect(() => { if (council) setSelectedCouncil(council); }, [council, setSelectedCouncil]);
  if (!council) notFound();
  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <CouncilDashboard initialCouncil={council} />
    </Suspense>
  );
}
```

Key facts:
- `CouncilDashboard` (`src/components/CouncilDashboard.tsx`) is a `'use client'` component
  that **already accepts `initialCouncil?: Council`** (lines 17–28) and renders it via
  `const selectedCouncil = contextCouncil ?? initialCouncil ?? null;`. So passing a single
  server-resolved council as a prop is already supported.
- The page's `useEffect` only exists to sync the chosen council into `CouncilContext` (so the
  header selector reflects it). That sync must be relocated to a client boundary (a server
  component can't call hooks).
- The dataset helpers exist and are pure:
  - `getCouncilBySlug(slug): Council | undefined` — `src/data/councils.ts:707`
  - `getAllCouncilSlugs(): string[]` — `src/data/councils.ts:711-714`, currently **unused**,
    literally commented "for static generation": `return councils.map(c => generateSlug(c.name));`
- Data resolution is via the `@council-data` alias (`next.config.ts`): the real 317-council
  submodule when present, else the committed 3-council fixture. In **fixture mode**
  `getAllCouncilSlugs()` returns only 3 slugs (Kent, Birmingham, Westminster) — the page must
  still 404 cleanly for other slugs (README documents "non-fixture councils show 404 in dev").
- Council objects are plain JSON-serializable data (no functions/classes), so they can cross
  the server→client prop boundary safely.

**Repo conventions**: App Router server components are the default (no `'use client'`); async
page components `await params` in Next 16. `notFound()` from `next/navigation` works in server
components. Metadata for these pages is handled elsewhere (there is a sibling `generateMetadata`
/ opengraph route under `card/`) — do NOT add or move metadata in this plan.

## Commands you will need

| Purpose        | Command                                            | Expected on success |
|----------------|----------------------------------------------------|---------------------|
| Typecheck      | `npx tsc --noEmit`                                 | exit 0              |
| Tests          | `npm test`                                         | all pass            |
| Lint           | `npm run lint`                                     | exit 0              |
| Build (fixture)| `CIVACCOUNT_FIXTURES=1 npm run build`              | exit 0; council pages prerender |
| Dev smoke      | `CIVACCOUNT_FIXTURES=1 npm run dev` then load `/council/kent` and `/council/does-not-exist` | Kent renders full content; unknown 404s |

Note: `npm run build` runs a `prebuild` that fetches private data; use the
`CIVACCOUNT_FIXTURES=1` variant for a local, no-token build. If the full dataset submodule is
checked out (`src/data/councils/index.ts` exists), a plain `npm run build` will prerender all
317 — that is the production behaviour to confirm if data is present.

## Suggested executor toolkit

- If a `vercel-react-best-practices` or Next.js App Router skill is available, consult it for
  the current `generateStaticParams` + `dynamicParams` semantics in Next 16 before Step 1.

## Scope

**In scope** (the only files you should modify or create):
- `src/app/council/[slug]/page.tsx` — convert to a server component with `generateStaticParams`
- `src/app/council/[slug]/SelectedCouncilSync.tsx` (create) — tiny client component that syncs
  the resolved council into `CouncilContext`
- (Optional, only if needed) `src/components/CouncilDashboard.tsx` — **only** to relocate the
  context sync if you choose to do it there instead of the new sync component

**Out of scope** (do NOT touch — this is the deferred, riskier work):
- `src/context/CouncilContext.tsx`, `src/components/SearchCommand.tsx`,
  `src/components/CouncilSelector.tsx`, `src/app/insights/InsightsClient.tsx` — these also
  import the dataset into client bundles. Trimming them is a separate follow-up (see
  Maintenance notes). Changing them here explodes the blast radius and risks the search UX.
- Any dashboard *card* component under `src/components/dashboard/**` — the rendered output must
  not change.
- Metadata / OpenGraph / `card/` routes.
- The `LoadingSkeleton` markup (you may drop it if the `Suspense` wrapper is no longer needed,
  but do not restyle it).

## Git workflow

- Branch: `advisor/004-ssg-council-pages`
- Commit style: conventional commits (e.g. `perf(council): statically generate council pages, resolve data server-side`).
- Do NOT push or open a PR unless instructed.

## Steps

### Step 1: Create the client sync component

Create `src/app/council/[slug]/SelectedCouncilSync.tsx`:

```tsx
'use client';
import { useEffect } from 'react';
import { useCouncil } from '@/context/CouncilContext';
import type { Council } from '@/data/councils';

/** Syncs the server-resolved council into CouncilContext so the header
 *  selector reflects the page you're on. Renders nothing. */
export default function SelectedCouncilSync({ council }: { council: Council }) {
  const { setSelectedCouncil } = useCouncil();
  useEffect(() => { setSelectedCouncil(council); }, [council, setSelectedCouncil]);
  return null;
}
```

**Verify**: `npx tsc --noEmit` → exit 0.

### Step 2: Convert the page to a server component with static params

Replace `src/app/council/[slug]/page.tsx` entirely with:

```tsx
import { notFound } from 'next/navigation';
import { getCouncilBySlug, getAllCouncilSlugs } from '@/data/councils';
import CouncilDashboard from '@/components/CouncilDashboard';
import SelectedCouncilSync from './SelectedCouncilSync';

export function generateStaticParams() {
  return getAllCouncilSlugs().map((slug) => ({ slug }));
}

export default async function CouncilPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const council = getCouncilBySlug(slug);
  if (!council) notFound();
  return (
    <>
      <SelectedCouncilSync council={council} />
      <CouncilDashboard initialCouncil={council} />
    </>
  );
}
```

Notes:
- No `'use client'` at the top — this is now a server component.
- `generateStaticParams` uses the existing helper; in fixture mode it yields 3 slugs, in
  production 317.
- Leave `dynamicParams` at its default (`true`) so unknown slugs render on-demand and hit
  `notFound()` — matching today's 404 behaviour for non-fixture councils in dev. Only set
  `export const dynamicParams = false` if the product owner wants unknown slugs to 404 without
  an on-demand render; do NOT decide that yourself — default `true` is the safe match.

**Verify**: `npx tsc --noEmit` → exit 0. `npm run lint` → exit 0.

### Step 3: Confirm the page no longer imports the dataset at a client boundary

The page is now server-only, so its `@/data/councils` import stays on the server.

**Verify**: `grep -n "use client" src/app/council/[slug]/page.tsx` → **no** match.
`grep -n "getCouncilBySlug\|getAllCouncilSlugs" src/app/council/[slug]/page.tsx` → both present.

### Step 4: Build in fixture mode and smoke-test

Run `CIVACCOUNT_FIXTURES=1 npm run build`. In the build output, confirm the council route is
prerendered as static for the fixture slugs (Next prints a route table; `/council/[slug]`
should show as `● (SSG)` / prerendered with the generated params, not `ƒ (Dynamic)`).

Then `CIVACCOUNT_FIXTURES=1 npm run dev` and:
- Load `/council/kent` → full dashboard content renders (H1 = "Kent County Council", band
  figures, spending narrative). View source / initial HTML contains the council name and the
  headline figures (SEO requirement preserved).
- Load `/council/some-unknown-slug` → 404 page.
- Confirm the header council selector reflects "Kent" after load (the sync component works).

**Verify**: build exits 0; both URLs behave as described.

### Step 5: Confirm rendered figures are unchanged

Because plan 001's characterization tests cover the money/stats helpers, run them plus a
visual diff of one council page against the pre-change output.

**Verify**: `npm test` → all pass. Manually compare `/council/kent` hero + spending numbers
to a screenshot/notes taken before the change — they must be identical.

## Test plan

- No new unit test file is required (this is a rendering/architecture change), but the plan
  **depends on** plan 001's tests to guard the underlying helpers.
- Manual verification is the gate here: the fixture build must prerender the council route,
  and `/council/kent` must render identical content to before, server-side, in the initial
  HTML.
- Verification commands: the Step 4 build + dev smoke test, and `npm test` (001's suite).

## Done criteria

Machine-checkable. ALL must hold:

- [ ] `grep -n "use client" src/app/council/[slug]/page.tsx` returns no match (page is a
      server component)
- [ ] `src/app/council/[slug]/page.tsx` exports `generateStaticParams`
- [ ] `SelectedCouncilSync.tsx` exists and is the only `'use client'` addition
- [ ] `npx tsc --noEmit` exits 0; `npm run lint` exits 0; `npm test` exits 0
- [ ] `CIVACCOUNT_FIXTURES=1 npm run build` exits 0 and the build route table shows the
      council route prerendered (SSG), not dynamic
- [ ] `/council/kent` renders full content in initial HTML; an unknown slug 404s; the header
      selector syncs to the current council
- [ ] Rendered figures on `/council/kent` are byte-identical to pre-change
- [ ] No files outside the in-scope list are modified (`git status`)
- [ ] `plans/README.md` status row for 004 updated

## STOP conditions

Stop and report back (do not improvise) if:

- `getAllCouncilSlugs()` does not exist or returns something other than an array of slug
  strings (drift since `bc409c3`) — do not invent a replacement; STOP.
- The fixture build fails to prerender the council route, or Next reports the route as
  dynamic despite `generateStaticParams` — this usually means a child (`CouncilDashboard` or
  one of its cards) opts the tree into dynamic rendering (e.g. reads cookies/headers or uses a
  dynamic API). Report which component forces dynamic; do NOT start rewriting cards.
- Making the page a server component breaks because `CouncilDashboard` or a child throws when
  rendered without a live `CouncilContext` on the server — report the exact error; the fix may
  need a context default, which is out of this plan's scope.
- The rendered figures on `/council/kent` change at all — STOP; a data-flow assumption is
  wrong.
- You are tempted to also strip the dataset out of `CouncilContext`/`SearchCommand` to "finish
  the job" — DON'T. That is the deferred follow-up; keep this PR contained.

## Maintenance notes

- **Deferred follow-up (separate plan):** the dataset still ships to the client via
  `CouncilContext` (wraps the whole app), `SearchCommand`/`CouncilSelector` (client-side
  filtering over the full array), and `InsightsClient`. Removing it there is the second, larger
  phase: replace client-side full-array imports with (a) a prebuilt slim search index
  (`src/lib/search-index.ts` already precomputes one — have the client import only that, not
  the raw `councils` array), (b) a server action or `/api/search` for lookups, and (c) passing
  precomputed insights stats as props from a server component. Do that only with its own plan
  and its own measurement of the client bundle before/after.
- After this lands, measure the JS transferred for `/council/kent` (Chrome devtools → Network,
  or the Next build's per-route First Load JS) to quantify the remaining dataset weight and
  justify the follow-up.
- A reviewer should scrutinize: the build route table (SSG vs dynamic), that initial HTML
  still contains the H1 + headline figures (the SEO invariant the original comment protects),
  and that no dashboard card silently changed output.
- If ISR is wanted later (data refreshes without a redeploy), add `export const revalidate`
  to this page — but the dataset is static in-repo, so a redeploy already refreshes it; ISR is
  not needed today.
