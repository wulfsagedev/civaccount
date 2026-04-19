# Security Policy

## Supported Versions

CivAccount is delivered as a single live web application at
[civaccount.co.uk](https://www.civaccount.co.uk). There is no concept of a
"supported version" — the deployed `main` branch is the only version that
receives security fixes.

## Reporting a Vulnerability

If you believe you've found a security issue — in the application code, the
infrastructure, the data pipeline, or the OG / embed surfaces — please report
it privately first.

- **GitHub Security Advisories:** open a private advisory at
  <https://github.com/wulfsagedev/civaccount/security/advisories/new>
- **Encrypted fallback:** if GitHub is unavailable to you, message the
  maintainer via the public engagement contact listed at
  <https://www.civaccount.co.uk/press> and request an encrypted channel.

Do **not** open a public GitHub issue for anything that could plausibly be
exploited in the live service. A public issue is a disclosure, and it starts
the clock for every attacker who is subscribed to the repository.

### What to include

Useful reports give us enough to reproduce the issue safely:

- A short summary of the impact ("X can read Y", "X can cause Y to crash").
- The minimal steps to reproduce, with any URLs, payloads, request bodies,
  and the exact commit hash or time window of your test.
- Any affected endpoints, routes, or user flows.
- Whether you believe any real user data was exposed during testing. If yes,
  please say so clearly — we will treat that as a data incident regardless of
  who triggered it.

### What we will do

- Acknowledge the report within 2 working days (UK).
- Confirm or dispute the finding within 7 working days, with a proposed
  remediation path.
- For anything rated High or Critical, ship a fix or a mitigation within 14
  working days of confirmation, and coordinate disclosure with the reporter.
- Credit the reporter in the public changelog on request, unless they prefer
  to remain anonymous.

### Safe-harbour

We will not pursue legal action against researchers who:

- Act in good faith and avoid privacy violations, service disruption, and
  destruction of data.
- Only test against their own account(s) and the public surface of the live
  site — **do not** attempt to access data belonging to other users, exfiltrate
  the compiled dataset, or attack the CI/CD pipeline or supporting vendors.
- Stop testing and report immediately if you encounter any real user data.
- Give us a reasonable window to remediate before public disclosure.

Automated scanning that produces high volumes of traffic is not in scope for
safe-harbour — contact us first so we can make sure your testing does not look
like a real attack to our rate-limiter or Vercel's WAF.

## Scope

### In scope

- <https://www.civaccount.co.uk> and its subdomains.
- The public APIs at `/api/v1/*`, the OG card endpoints at `/api/share/*`,
  the checkout endpoint at `/api/checkout`, and the feedback endpoint at
  `/api/feature-request`.
- The compiled dataset served through those APIs (injection, enumeration,
  and integrity issues).
- The open-source code in [wulfsagedev/civaccount](https://github.com/wulfsagedev/civaccount)
  and its release pipeline.

### Out of scope

- Reports that require physical access to the maintainer's devices.
- Reports depending on users installing malicious browser extensions.
- Missing security headers that do not demonstrably enable an attack (please
  do explain the attack, not just the missing header).
- Denial of service via volumetric traffic against the public site or APIs.
- Social engineering of the maintainer or third-party vendors (GitHub,
  Vercel, Supabase, Stripe, Upstash, Formspree).
- Vulnerabilities in upstream dependencies that have no direct impact on
  CivAccount (please report those upstream; we follow CVEs via Dependabot).

## Our posture

CivAccount is a small civic-tech project and does not carry user profiles,
payment details, or sensitive personal data in its primary data product.
It does, however:

- Host an authenticated civic-participation layer (proposals, votes, comments)
  backed by Supabase with Row Level Security.
- Process donations through Stripe Checkout (we never touch card data).
- Store a private, compiled dataset in a separate repository, gated behind a
  narrow GitHub fine-grained PAT.

We treat the private dataset, the GitHub PAT, the Stripe live secret, and the
Supabase service-role key (if/when introduced) as the four most sensitive
secrets in the project.

## Upstream incidents

When a relied-upon vendor discloses an incident, we assume the worst until
proven otherwise and follow `ROTATION-RUNBOOK.md` in this repository to rotate
every secret that ever touched that vendor. The runbook includes the
step-by-step for the April 2026 Vercel disclosure.
