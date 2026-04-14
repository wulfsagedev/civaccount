/**
 * checksum.mjs — Verify parsed CSV files match their expected SHA-256 hashes.
 *
 * Reads source-manifest.json and computes SHA-256 of each local parsed CSV.
 * Reports errors if any hash doesn't match — catches accidental edits to source
 * files without updating the manifest. No network access needed (runs in CI).
 */

import { readFileSync, existsSync } from 'fs';
import { createHash } from 'crypto';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const MANIFEST_PATH = join(__dirname, '..', 'source-manifest.json');
const BULK_DIR = join(__dirname, '..', '..', '..', 'src', 'data', 'councils', 'pdfs', 'gov-uk-bulk-data');

function sha256(filePath) {
  const data = readFileSync(filePath);
  return createHash('sha256').update(data).digest('hex');
}

export function validate(councils, population, report) {
  if (!existsSync(MANIFEST_PATH)) {
    report.finding(
      { name: '[system]', ons_code: '' },
      'checksum', 'manifest_missing', 'error',
      'source-manifest.json not found — cannot verify data integrity'
    );
    return;
  }

  const manifest = JSON.parse(readFileSync(MANIFEST_PATH, 'utf-8'));

  for (const source of manifest.sources) {
    report.tick();

    // Skip sources without a parsed CSV or without a recorded hash
    if (!source.parsed_csv || !source.parsed_csv_sha256) continue;

    // Resolve the CSV path — some are in subdirectories (e.g., gov-uk-ra-data/)
    let csvPath;
    if (source.parsed_csv.includes('/')) {
      // Relative to the pdfs directory
      csvPath = join(BULK_DIR, '..', source.parsed_csv);
    } else {
      csvPath = join(BULK_DIR, source.parsed_csv);
    }

    if (!existsSync(csvPath)) {
      report.finding(
        { name: '[system]', ons_code: '' },
        'checksum', 'csv_missing', 'error',
        `Parsed CSV not found: ${source.parsed_csv} (source: ${source.id})`,
        source.parsed_csv
      );
      continue;
    }

    const actualHash = sha256(csvPath);
    if (actualHash !== source.parsed_csv_sha256) {
      report.finding(
        { name: '[system]', ons_code: '' },
        'checksum', 'hash_mismatch', 'error',
        `${source.parsed_csv} hash mismatch — file was modified without updating manifest. Expected: ${source.parsed_csv_sha256.slice(0, 12)}... Got: ${actualHash.slice(0, 12)}...`,
        source.parsed_csv, actualHash, source.parsed_csv_sha256
      );
    }
  }
}
