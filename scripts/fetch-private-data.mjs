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
 *   - If the token is present → clone the private repo via HTTPS using the token
 *     as the auth mechanism, then strip the `.git` folder.
 *
 * Why a token instead of a Git submodule: Vercel's Hobby plan does not support
 * private submodules. Token-based clone at build time works on any plan.
 *
 * Token setup:
 *   1. Create a fine-grained GitHub PAT with Contents:Read on
 *      `wulfsagedev/civaccount-data`.
 *   2. Add to Vercel Project Settings → Environment Variables as
 *      `CIVACCOUNT_DATA_TOKEN`, applied to all environments.
 *   3. Rotate annually.
 */

import { existsSync, rmSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { resolve } from 'node:path';

const TARGET_DIR = resolve(process.cwd(), 'src/data/councils');
const INDEX_FILE = resolve(TARGET_DIR, 'index.ts');
const TOKEN = process.env.CIVACCOUNT_DATA_TOKEN;
const REPO = 'wulfsagedev/civaccount-data';

function log(msg) {
  console.log(`[civaccount] ${msg}`);
}

if (existsSync(INDEX_FILE)) {
  log('Compiled dataset already present at src/data/councils/index.ts; skipping fetch.');
  process.exit(0);
}

if (!TOKEN) {
  log(
    'CIVACCOUNT_DATA_TOKEN not set — skipping private-data fetch. ' +
      'Build will fall back to the committed 3-council fixture. ' +
      'For the full dataset: set the token env var (see scripts/fetch-private-data.mjs header).',
  );
  process.exit(0);
}

log(`Fetching compiled dataset from ${REPO}...`);

// Build the authenticated URL. The token is passed as the username with a
// fixed `x-access-token` placeholder, which is how GitHub expects fine-grained
// PATs to be used over HTTPS.
const authUrl = `https://x-access-token:${TOKEN}@github.com/${REPO}.git`;

try {
  execSync(
    `git clone --depth=1 --quiet "${authUrl}" "${TARGET_DIR}"`,
    { stdio: ['ignore', 'inherit', 'inherit'] },
  );
  // Drop the .git folder — we don't want the build output to ship it, and the
  // next fetch will re-clone cleanly.
  rmSync(resolve(TARGET_DIR, '.git'), { recursive: true, force: true });
  log('Compiled dataset fetched successfully.');
} catch (err) {
  // Do not fail the build on fetch errors — let the alias fallback kick in.
  log(`Fetch failed: ${err instanceof Error ? err.message : String(err)}`);
  log('Build will fall back to the committed 3-council fixture.');
  process.exit(0);
}
