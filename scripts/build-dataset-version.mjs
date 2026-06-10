#!/usr/bin/env node
/**
 * build-dataset-version.mjs — stamp the exact dataset + app version into
 * src/data/dataset-version.json so the site can tell readers precisely
 * which dataset snapshot they are looking at.
 *
 * Why: "is this number right?" is only half the trust question — the other
 * half is "right as of WHEN, from WHICH snapshot?". The provenance pages and
 * the data-sources footer surface this stamp, so a reader (or a journalist
 * citing us) can pin any figure to an immutable data-repo commit.
 *
 * Behaviour:
 *  - Reads the private data submodule's HEAD (src/data/councils) and the app
 *    repo's HEAD via git.
 *  - NEVER fails the build. If git is unavailable (e.g. Vercel builds where
 *    the data arrives via fetch-private-data.mjs, or fixture-mode checkouts),
 *    the previously committed stamp is left untouched — it was generated
 *    where the data repo's git history exists and travels with the commit.
 *
 * Wired into `prebuild` after fetch-private-data.mjs. Also safe to run
 * standalone: node scripts/build-dataset-version.mjs
 */

import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const OUT = join(ROOT, 'src', 'data', 'dataset-version.json');
const DATA_DIR = join(ROOT, 'src', 'data', 'councils');

function git(args, cwd) {
  try {
    return execSync(`git ${args}`, { cwd, stdio: ['ignore', 'pipe', 'ignore'] })
      .toString()
      .trim() || null;
  } catch {
    return null;
  }
}

const dataCommit = git('rev-parse --short HEAD', DATA_DIR);
const dataCommitDate = git('log -1 --format=%cs', DATA_DIR);
const appCommit = git('rev-parse --short HEAD', ROOT);

if (!dataCommit) {
  if (existsSync(OUT)) {
    let existing = 'unknown';
    try {
      existing = JSON.parse(readFileSync(OUT, 'utf-8')).data_commit ?? 'unknown';
    } catch { /* unreadable stamp — keep going, we only log it */ }
    console.log(`dataset-version: data repo git history unavailable — keeping committed stamp (data@${existing})`);
  } else {
    writeFileSync(OUT, JSON.stringify({
      data_commit: null,
      data_commit_date: null,
      app_commit: appCommit,
      generated_at: new Date().toISOString(),
      source: 'fixtures',
    }, null, 2) + '\n');
    console.log('dataset-version: no data repo found — wrote fixture stamp');
  }
  process.exit(0);
}

writeFileSync(OUT, JSON.stringify({
  data_commit: dataCommit,
  data_commit_date: dataCommitDate,
  app_commit: appCommit,
  generated_at: new Date().toISOString(),
  source: 'git',
}, null, 2) + '\n');

console.log(`dataset-version: data@${dataCommit} (${dataCommitDate}) app@${appCommit}`);
