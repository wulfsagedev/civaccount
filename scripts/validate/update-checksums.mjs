#!/usr/bin/env node
/**
 * update-checksums.mjs — Recompute SHA-256 hashes for all parsed CSVs
 * and update source-manifest.json.
 *
 * Run this AFTER intentionally updating source data files:
 *   node scripts/validate/update-checksums.mjs
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
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
  if (!existsSync(MANIFEST_PATH)) {
    console.error('source-manifest.json not found');
    process.exit(1);
  }

  const manifest = JSON.parse(readFileSync(MANIFEST_PATH, 'utf-8'));
  let updated = 0;

  for (const source of manifest.sources) {
    if (!source.parsed_csv) continue;

    let csvPath;
    if (source.parsed_csv.includes('/')) {
      csvPath = join(BULK_DIR, '..', source.parsed_csv);
    } else {
      csvPath = join(BULK_DIR, source.parsed_csv);
    }

    if (!existsSync(csvPath)) {
      console.warn(`  SKIP  ${source.parsed_csv} — file not found`);
      continue;
    }

    const newHash = sha256(csvPath);
    const oldHash = source.parsed_csv_sha256;

    if (oldHash !== newHash) {
      source.parsed_csv_sha256 = newHash;
      console.log(`  UPDATE  ${source.id}: ${oldHash?.slice(0, 12) || '(none)'}... → ${newHash.slice(0, 12)}...`);
      updated++;
    } else {
      console.log(`  OK      ${source.id}: ${newHash.slice(0, 12)}...`);
    }
  }

  manifest.last_full_check = new Date().toISOString().split('T')[0];
  writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2) + '\n');

  console.log(`\nDone. ${updated} hash(es) updated in source-manifest.json`);
}

main();
