# Secret Rotation Runbook

This is the operational checklist for rotating every secret that CivAccount
depends on. Use it in two situations:

1. **Vendor incident** — a vendor we hold secrets with announces an intrusion
   (Vercel, Supabase, Upstash, Stripe, GitHub, Formspree). Rotate anything
   that ever touched that vendor.
2. **Routine cadence** — every 90 days as a forcing function, even without an
   incident. Rotation keeps muscle memory fresh so the next real incident
   isn't the first time you've done it.

> **Current trigger:** Vercel April 2026 security incident
> ([bulletin](https://vercel.com/kb/bulletin/vercel-april-2026-security-incident)).
> Vercel advises customers to review environment variables, enable the
> Sensitive env-var feature, and contact them for rotation help.

## Rule 0 — before you touch anything

- Do the rotation in the order below. The `CIVACCOUNT_DATA_TOKEN` is the
  riskiest (it grants read on the private dataset), so rotate it first.
- Have the Vercel dashboard, the vendor dashboards, and this file open at
  the same time in separate tabs. Never copy a new secret through a shell
  history or a messaging app.
- After each rotation: redeploy, then verify the site still functions
  (homepage loads, one council page loads, the donate flow initialises).
- Record the rotation in the private `civaccount-data` repo's
  `SEC-ROTATIONS.md` (create it if it doesn't exist): date, secret name,
  reason. This is the only long-term record of "when did we last rotate X".

## Secret inventory

These are every secret this project currently touches. Keep this table
current — if you add or remove a secret, edit this file in the same PR.

| # | Secret                                | Where it lives           | Public / sensitive | Blast radius                                  |
|---|---------------------------------------|--------------------------|--------------------|-----------------------------------------------|
| 1 | `CIVACCOUNT_DATA_TOKEN`               | Vercel env (+ local dev) | Sensitive          | Read access to private `civaccount-data` repo |
| 2 | `STRIPE_SECRET_KEY` (live)            | Vercel env (+ local dev) | Sensitive          | Create charges, read past charges             |
| 3 | `UPSTASH_REDIS_REST_TOKEN`            | Vercel env (+ local dev) | Sensitive          | Read/write Upstash Redis for rate-limiting    |
| 4 | `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`  | Vercel env (+ local dev) | Public             | None — publishable by design                  |
| 5 | `NEXT_PUBLIC_SUPABASE_URL`            | Vercel env (+ local dev) | Public             | None — publishable                            |
| 6 | `NEXT_PUBLIC_SUPABASE_ANON_KEY`       | Vercel env (+ local dev) | Public             | Bounded by Supabase RLS policies              |
| 7 | `NEXT_PUBLIC_APP_URL`                 | Vercel env (+ local dev) | Public             | None — publishable                            |
| 8 | Supabase JWT signing secret           | Supabase project         | Sensitive          | Forge any JWT — rotation invalidates all tokens |
| 9 | Supabase service-role key (if used)   | Supabase project         | Sensitive          | Bypass RLS on the entire database             |

Anything public (rows 4–7) does not need rotation after a vendor incident.
Every sensitive row does.

## Rotate → CIVACCOUNT_DATA_TOKEN (GitHub fine-grained PAT)

Highest priority: this token grants read access to the compiled dataset.

1. In GitHub → Settings → Developer settings → Personal access tokens →
   Fine-grained tokens, find the `civaccount-data-readonly` token.
2. Click **Revoke** first. Do not wait until you've created the
   replacement — an attacker racing you cannot use a revoked token.
3. Generate a new fine-grained token with:
   - Resource owner: `wulfsagedev`
   - Repository access: only `wulfsagedev/civaccount-data`
   - Permission: Contents = Read-only (everything else = No access)
   - Expiration: 90 days
4. Copy the new token (it is shown once).
5. In Vercel → Project Settings → Environment Variables, edit
   `CIVACCOUNT_DATA_TOKEN`:
   - Paste the new value.
   - Ensure **Sensitive** is toggled ON (Vercel's April 2026 bulletin
     specifically recommends this feature; see section below).
   - Apply to Production, Preview, and Development.
6. Redeploy the latest production commit from the Vercel dashboard.
7. Tail the build log. Expect:
   `[civaccount] Fetching compiled dataset from wulfsagedev/civaccount-data...`
   followed by `Compiled dataset fetched successfully.` If you see a fall-back
   message ("Build will fall back to the committed 3-council fixture"), the
   token is wrong — stop, do not promote.
8. Once live, spot-check the site: a non-fixture council page (any of the 314
   councils that aren't Kent / Birmingham / Westminster) must render real data.
9. Delete any scratch copies of the new token from clipboard managers and
   note history. Do not commit it anywhere.

## Rotate → STRIPE_SECRET_KEY (live)

1. In Stripe → Developers → API keys, click **Roll key** on the live secret
   key. Stripe keeps the old key alive for 12 hours by default — leave that
   grace window in place while you cut over, then explicitly expire the old
   key via the dashboard.
2. Copy the new `sk_live_…` value.
3. Vercel → Project Settings → Environment Variables → edit
   `STRIPE_SECRET_KEY`:
   - Paste new value.
   - Ensure **Sensitive** is ON.
   - Apply to Production (and Preview, if you've ever tested live Stripe
     there — otherwise leave Preview on `sk_test_…`).
4. Redeploy.
5. Verify the donate flow initialises end-to-end: `/donate` → click donate →
   Stripe Checkout must load with the correct publishable key. Do not place
   a real charge; Stripe's test page is fine for verification if you keep a
   tiny `sk_test_…` key in Preview.
6. Return to Stripe → API keys and **expire** the old key so the grace window
   can't be used by anyone who captured the value before you rolled it.
7. Update `.env.local` on your development machine with a `sk_test_…` key,
   **never** the live key. The live key is production-only and lives only in
   Vercel.

## Rotate → UPSTASH_REDIS_REST_TOKEN

1. Upstash Console → select the `civaccount-ratelimit` database →
   Details tab → **REST API** section → **Regenerate token**.
2. Copy the new REST token.
3. Vercel → env vars → edit `UPSTASH_REDIS_REST_TOKEN`:
   - Paste new value.
   - Ensure **Sensitive** is ON.
   - Apply to all environments (rate-limiting must stay on in Preview so the
     abuse window is never open there either).
4. Redeploy. Hit `/api/v1/councils?search=kent` 3 times and confirm 200
   responses — a 500 here means the new token didn't take.
5. The old token is invalidated automatically by Upstash when you regenerate,
   so no manual expire step.

## Rotate → Supabase JWT signing secret (only on real incident)

Rotating the JWT signing secret invalidates every active session, so this is
a real last-resort and should be done only when you believe sessions have
been compromised (not as a routine 90-day rotation).

1. Supabase Dashboard → Project Settings → API → **JWT Secret** → Rotate.
2. All logged-in users are now logged out. Supabase will re-sign the
   `NEXT_PUBLIC_SUPABASE_ANON_KEY` automatically — it is still safe to
   commit / publish the new value in public.
3. Vercel → env vars → update `NEXT_PUBLIC_SUPABASE_ANON_KEY` to the new
   value shown in the Supabase API page.
4. Redeploy.
5. Verify `/auth/login` flow end-to-end.

## Rotate → Supabase service-role key (if introduced)

This project does **not** currently use a service-role key. If one is ever
added (e.g. for server-side admin actions), it must:

- Only be referenced from server code, never from `NEXT_PUBLIC_…`.
- Live in Vercel as **Sensitive**.
- Be rotated on every vendor incident and every 90 days.

## Vercel April 2026 incident — one-time checklist

The Vercel bulletin recommends reviewing every env var and using the
Sensitive feature. Walk the full Vercel project:

- [ ] **Rotate** every secret above that is currently in Vercel
      (`CIVACCOUNT_DATA_TOKEN`, `STRIPE_SECRET_KEY`, `UPSTASH_REDIS_REST_TOKEN`).
- [ ] Open each env var in Vercel → confirm it is marked **Sensitive** if
      it's on the "Sensitive" side of the inventory above. Sensitive variables
      are not decryptable through the Vercel dashboard after being saved;
      that reduces the blast radius of any future Vercel account compromise.
- [ ] Verify that the non-sensitive vars (`NEXT_PUBLIC_*`) do not contain
      anything you wouldn't put on the homepage. `NEXT_PUBLIC_SUPABASE_URL`
      and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are expected. Anything else there
      is probably a misconfiguration.
- [ ] Audit the Vercel team members list. Remove anyone who shouldn't have
      access. Require 2FA for every remaining member.
- [ ] Audit the Vercel Git integration. The project is wired to
      `wulfsagedev/civaccount` — confirm no unexpected repos have been added.
- [ ] Review recent deployments for any you did not initiate. If you see a
      deployment from an unknown source, treat that as the real incident.
- [ ] Confirm no Vercel serverless function has been added that you did not
      write — browse Functions tab.
- [ ] Confirm no custom domain has been added to the project.
- [ ] Review the Deploy Hooks. Revoke anything you no longer use.
- [ ] Review Integrations. Remove any that are dormant.
- [ ] Check the security advisory page weekly for the next month — Vercel
      committed to updating the bulletin as investigation progresses.
- [ ] Record this rotation run in `civaccount-data/SEC-ROTATIONS.md` with
      date, trigger ("Vercel April 2026 incident"), and what was rotated.

## After any rotation — verification

Every rotation, regardless of which secret, ends with the same verification:

```bash
# From a fresh shell (no env inheritance) against production:
curl -sSf https://www.civaccount.co.uk/api/v1/councils?search=kent | head -c 200
curl -sSf -o /dev/null -w "%{http_code}\n" https://www.civaccount.co.uk/
curl -sSf -o /dev/null -w "%{http_code}\n" https://www.civaccount.co.uk/council/kent
```

All three must return `200`. If any return 5xx, your rotation broke
something — revert to the previous value from the old vendor console
(Stripe's grace window, Upstash's history, or just the previous PAT
stored in your password manager) and debug cold.

## On-machine hygiene

The live `STRIPE_SECRET_KEY` does **not** belong on your development
machine. `.env.local` should hold `sk_test_…` only. If you ever find a
`sk_live_` in `.env.local`, treat it as a leak: rotate per the runbook,
then replace the local value with a test key.

`.env.local` is git-ignored (`.env*` in `.gitignore`). Verify periodically:

```bash
git check-ignore -v .env.local   # must print an ignore rule
git ls-files | grep -E "^\.env"  # must return nothing
```

If either of those fails, your `.gitignore` has drifted and you should stop
and rebuild it.
