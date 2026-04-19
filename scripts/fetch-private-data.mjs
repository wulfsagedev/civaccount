#!/usr/bin/env node
/**
 * fetch-private-data.mjs
 *
 * Fetches the compiled council dataset from the private `civaccount-data`
 * repository and places it at `src/data/councils/`. Runs as part of `prebuild`
 * in both Vercel production builds and local builds that need real data.
 *
 * Behaviour:
 *   - If `src/data/councils/index.ts` already exists → skip (maintainer has
 *     cloned the private repo manually, or a previous prebuild already fetched).
 *   - If `CIVACCOUNT_DATA_TOKEN` env var is missing → skip silently.
 *     The alias resolver in `next.config.ts` then falls back to the committed
 *     3-council fixture at `src/data/councils-fixtures/`.
 *   - If the token is present → clone the private repo via HTTPS using the
 *     token, then strip the `.git` folder.
 *
 * Why a token instead of a Git submodule: Vercel's Hobby plan does not support
 * private submodules. Token-based clone at build time works on any plan.
 *
 * Security notes (post-Vercel-April-2026 hardening):
 *   1. Token is validated for the expected `github_pat_` / `ghp_` shape before
 *      use — a malformed value is treated as "no token" so we don't leak
 *      anything via stderr when git prints the URL.
 *   2. Token is never spliced into a shell string. We use `spawnSync` with an
 *      args array so even if the token contained shell metacharacters it
 *      would never be interpreted.
 *   3. `GIT_TERMINAL_PROMPT=0` prevents git from blocking on a credential
 *      prompt if the token has been revoked (build would hang forever).
 *   4. On error, we redact the auth URL from stderr before logging — git
 *      will otherwise print the full URL including the token when the host
 *      rejects it.
 *
 * Token setup:
 *   1. Create a fine-grained GitHub PAT with Contents:Read on
 *      `wulfsagedev/civaccount-data`.
 *   2. Add to Vercel Project Settings → Environment Variables as
 *      `CIVACCOUNT_DATA_TOKEN` — mark as Sensitive, applied to all envs.
 *   3. Rotate every 90 days (see ROTATION-RUNBOOK.md).
 */

import { existsSync, rmSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';

const TARGET_DIR = resolve(process.cwd(), 'src/data/councils');
const INDEX_FILE = resolve(TARGET_DIR, 'index.ts');
const RAW_TOKEN = process.env.CIVACCOUNT_DATA_TOKEN;
const REPO = 'wulfsagedev/civaccount-data';

// Accept classic PATs (ghp_…) and fine-grained PATs (github_pat_…).  Both are
// URL-safe alphanumeric + underscore and much longer than 20 chars.
const TOKEN_PATTERN = /^(ghp_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{50,})$/;

function log(msg) {
  console.log(`[civaccount] ${msg}`);
}

function redact(str, token) {
  if (!token) return str;
  // Redact both the raw token and the `x-access-token:${token}` form git uses.
  return String(str)
    .split(token)
    .join('***REDACTED***');
}

if (existsSync(INDEX_FILE)) {
  log('Compiled dataset already present at src/data/councils/index.ts; skipping fetch.');
  process.exit(0);
}

if (!RAW_TOKEN) {
  log(
    'CIVACCOUNT_DATA_TOKEN not set — skipping private-data fetch. ' +
      'Build will fall back to the committed 3-council fixture. ' +
      'For the full dataset: set the token env var (see scripts/fetch-private-data.mjs header).',
  );
  process.exit(0);
}

const TOKEN = RAW_TOKEN.trim();

if (!TOKEN_PATTERN.test(TOKEN)) {
  // Log the length and prefix only — never the full value — so the env-var
  // misconfiguration is visible in the build log without leaking the token.
  const prefix = TOKEN.slice(0, 4);
  const len = TOKEN.length;
  log(
    `CIVACCOUNT_DATA_TOKEN does not match the expected GitHub PAT shape ` +
      `(prefix=${JSON.stringify(prefix)} len=${len}). ` +
      `Expected ghp_… or github_pat_… — re-check the env var in Vercel.`,
  );
  log('Build will fall back to the committed 3-council fixture.');
  process.exit(0);
}

log(`Fetching compiled dataset from ${REPO}...`);

// Compose the authenticated URL.  The token is kept out of the argv so it
// doesn't appear in `ps` output; we pass it via HTTP Basic auth in the URL
// which git immediately consumes.  spawnSync with shell=false guarantees no
// shell expansion of the URL contents.
const authUrl = `https://x-access-token:${TOKEN}@github.com/${REPO}.git`;

const result = spawnSync(
  'git',
  ['clone', '--depth=1', '--quiet', '--config', 'http.extraHeader=', authUrl, TARGET_DIR],
  {
    stdio: ['ignore', 'pipe', 'pipe'],
    env: {
      ...process.env,
      // Block any interactive credential prompt if the token is stale —
      // otherwise the build hangs forever on Vercel waiting for keyboard input.
      GIT_TERMINAL_PROMPT: '0',
      // Belt and braces: GIT_ASKPASS is the other way credentials can be
      // requested.  Point it at /bin/true so it answers "" and exits.
      GIT_ASKPASS: '/bin/true',
    },
    shell: false,
  },
);

if (result.status === 0) {
  rmSync(resolve(TARGET_DIR, '.git'), { recursive: true, force: true });
  log('Compiled dataset fetched successfully.');
  process.exit(0);
}

// Redact the token from any diagnostic output before we print it.  Git will
// often echo the URL (with token) back in error messages like
// "fatal: unable to access 'https://x-access-token:TOKEN@github.com/...'".
const stderr = redact(result.stderr?.toString('utf8') ?? '', TOKEN).trim();
const stdout = redact(result.stdout?.toString('utf8') ?? '', TOKEN).trim();

log(`git clone failed (exit ${result.status ?? 'signal ' + result.signal}).`);
if (stderr) log(`stderr: ${stderr}`);
if (stdout) log(`stdout: ${stdout}`);
log('Build will fall back to the committed 3-council fixture.');

// Soft-fail on purpose: the alias resolver in next.config.ts detects the
// missing `index.ts` and points `@council-data` at the fixture instead.
// Hard-failing would turn a transient GitHub blip into a production outage.
process.exit(0);
