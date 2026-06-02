#!/usr/bin/env node
/**
 * compare-checksums.mjs — Compare freshly-downloaded source files against
 * the source manifest to detect upstream data changes.
 *
 * Usage:
 *   node scripts/validate/compare-checksums.mjs [temp-download-dir]
 *
 * If no directory is provided, compares the existing local files.
 * Used by refresh-sources.sh and data-freshness.yml to detect when
 * GOV.UK publishes updated data.
 *
 * Exit codes:
 *   0 — all files match
 *   1 — at least one file changed or is missing
 */

import { readFileSync, existsSync, mkdirSync, writeFileSync } from 'fs';
import { createHash } from 'crypto';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const MANIFEST_PATH = join(__dirname, 'source-manifest.json');
const BULK_DIR = join(__dirname, '..', '..', 'src', 'data', 'councils', 'pdfs', 'gov-uk-bulk-data');

function sha256(filePath) {
  const data = readFileSync(filePath);
  return createHash('sha256').update(data).digest('hex');
}

function main() {
  const manifest = JSON.parse(readFileSync(MANIFEST_PATH, 'utf-8'));
  const results = { matched: [], changed: [], missing: [] };

  console.log('\nSource File Integrity Check');
  console.log('='.repeat(50));

  for (const source of manifest.sources) {
    if (!source.parsed_csv || !source.parsed_csv_sha256) continue;

    let csvPath;
    if (source.parsed_csv.includes('/')) {
      csvPath = join(BULK_DIR, '..', source.parsed_csv);
    } else {
      csvPath = join(BULK_DIR, source.parsed_csv);
    }

    if (!existsSync(csvPath)) {
      console.log(`  MISSING  ${source.id} — ${source.parsed_csv}`);
      results.missing.push(source);
      continue;
    }

    const actualHash = sha256(csvPath);
    if (actualHash === source.parsed_csv_sha256) {
      console.log(`  MATCH    ${source.id}`);
      results.matched.push(source);
    } else {
      console.log(`  CHANGED  ${source.id} — hash differs from manifest`);
      console.log(`           Expected: ${source.parsed_csv_sha256.slice(0, 16)}...`);
      console.log(`           Got:      ${actualHash.slice(0, 16)}...`);
      results.changed.push({ ...source, actual_hash: actualHash });
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log(`  Matched: ${results.matched.length}`);
  console.log(`  Changed: ${results.changed.length}`);
  console.log(`  Missing: ${results.missing.length}`);

  // Write results to a JSON file for the GitHub Actions workflow to read
  const reportPath = join(__dirname, 'reports', 'freshness-check.json');
  const report = {
    timestamp: new Date().toISOString(),
    ...results,
    has_drift: results.changed.length > 0 || results.missing.length > 0,
  };

  const reportsDir = join(__dirname, 'reports');
  if (!existsSync(reportsDir)) mkdirSync(reportsDir, { recursive: true });
  writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\n  Report: ${reportPath}`);

  // G8 fix: a trust-root check must also confirm it actually CHECKED something.
  // If zero CSVs were verified, the manifest/paths are wrong — that is a failure,
  // not a silent pass. (Previously this script could no-op and exit 0.)
  const totalChecked = results.matched.length + results.changed.length;
  if (totalChecked === 0) {
    console.error('\n  ✗ FAIL: 0 parsed CSVs were checked — manifest has no parsed_csv_sha256 entries, or paths are wrong.');
    process.exit(1);
  }

  if (results.changed.length > 0 || results.missing.length > 0) {
    console.error(`\n  ✗ FAIL: ${results.changed.length} changed, ${results.missing.length} missing vs manifest.`);
    process.exit(1);
  }
  console.log('\n  ✓ All parsed CSVs match the manifest (trust root intact).');
}

// G8 fix: never let this safety check die silently. Any uncaught error must exit
// NON-ZERO so CI goes red — a broken trust-root verifier that "passes" is the worst case.
try {
  main();
} catch (err) {
  console.error(`\n  ✗ FATAL: compare-checksums crashed — ${err && err.message ? err.message : err}`);
  process.exit(1);
}
