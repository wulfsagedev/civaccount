# Security TODO — items requiring Owen's login

Everything in this file needs a logged-in browser session somewhere I
(Claude) can't reach. None of it is urgent; tackle it over a weekend.

Grouped by where you need to be logged in.

## GitHub (github.com/wulfsagedev/civaccount)

### Enable branch protection on `main`
Repo → **Settings** → **Branches** → **Add branch protection rule** (or
accept the yellow banner on the repo front page).

Rule for `main` with these boxes ticked:
- [x] Require a pull request before merging (reviews not required if you
      work alone, but "Require approvals: 0" still enables the flow)
- [x] Require status checks to pass before merging
  - Add `check`, `Secret scan`, `Dependency review (PRs only)` to the
    required checks list (they only appear after they've run at least once)
- [x] Require branches to be up to date before merging
- [x] Do not allow bypassing the above settings (even for admins)
- [x] Restrict force-pushes (tick this so even you can't force-push main)
- [x] Restrict deletions

What this buys you: nobody with a stolen GitHub PAT can push straight to
prod, force-push over history, or delete the branch. Every change has to
go through a PR that CI has green-lit.

### Enable CodeQL static analysis
Repo → **Settings** → **Code security** → **Code scanning** → **Set up**
→ **Default** (or "Advanced" which picks up the workflow I already
committed at `.github/workflows/codeql.yml`).

Zero cost, zero config. Runs on every push + weekly. Anything high-severity
lands in the repo's Security tab.

### Enable Dependabot security updates
Repo → **Settings** → **Code security** → **Dependabot** → toggle these on:
- [x] Dependabot alerts
- [x] Dependabot security updates
- [x] Dependabot version updates (the `.github/dependabot.yml` file is
      already in place)
- [x] Grouped security updates

### Require 2FA on the `wulfsagedev` org
If civaccount is under an org (looks like yes, based on the URL):
**Organisation settings** → **Authentication security** → **Require two-factor
authentication for everyone in this organisation**. One tick, immediate.

## Vercel (vercel.com/dashboard)

### Enable 2FA on your Vercel account
**Account Settings** → **Security** → **Two-factor authentication** →
Enable. Use an authenticator app, not SMS.

### Review connected integrations
**Team Settings** → **Integrations**. Remove any you don't actively use.
The Vercel April 2026 incident came in via a third-party OAuth
(Context.ai) — fewer integrations = smaller surface.

### (Optional) Deployment Protection on preview builds
**Project Settings** → **Deployment Protection**. Gates preview URLs behind
a login wall. Useful if you ever have WIP you don't want indexed by
search engines or scraped. Free tier allows at least "Vercel Authentication".

## Stripe (dashboard.stripe.com)

### Enable 2FA
**Profile** → **Two-step authentication**. Authenticator app only.

### Review team members
**Settings** → **Team and security** → **Team**. Remove anyone who
shouldn't have access. Set roles to the minimum (you probably want
Administrator for yourself, nothing else).

### Review Radar rules
**Radar** → **Rules**. If you haven't set any, the defaults are fine for
CivAccount's donation flow. If the donation button ever starts seeing
card-testing traffic, this is the lever to pull.

## Supabase (app.supabase.com)

### Enable 2FA
**Account** → **Preferences** → **Two-factor authentication**.

### Check daily backups are on
Project → **Database** → **Backups**. On the free tier this should be
automatic; confirm the most recent backup is < 25 hours old.

### Enable "Enforce SSL" on the database
Project → **Database** → **Settings** → **SSL Configuration** → **Enforce
SSL**. Should already be on; confirm.

## Upstash (console.upstash.com)

### Enable 2FA
**Account** → **Security**. Same drill.

## Domain registrar (wherever civaccount.co.uk is registered)

### Enable 2FA on the registrar account
A stolen registrar account is the worst-case scenario — an attacker can
point DNS wherever and intercept everything. Two-factor here is
non-negotiable.

### Enable registrar lock / transfer lock
Prevents the domain being transferred to another registrar without a
multi-step confirmation.

---

## When you're done

Nothing in this file needs a code change. When every box is ticked, you
can delete this file — the rest of the security posture is defined in
`SECURITY.md` and `ROTATION-RUNBOOK.md`, which are the long-lived docs.
