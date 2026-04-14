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

import { readFileSync, existsSync } from 'fs';
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

  try {
    const { mkdirSync } = await import('fs');
    // Reports dir should already exist from validate runs
    const reportsDir = join(__dirname, 'reports');
    if (!existsSync(reportsDir)) {
      const fs = await import('fs');
      fs.mkdirSync(reportsDir, { recursive: true });
    }
    const { writeFileSync } = await import('fs');
    writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n  Report: ${reportPath}`);
  } catch { /* ok if report write fails */ }

  if (results.changed.length > 0 || results.missing.length > 0) {
    process.exit(1);
  }
}

main();
