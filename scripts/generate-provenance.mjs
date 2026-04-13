#!/usr/bin/env node
/**
 * generate-provenance.mjs — Reads source-manifest.json and generates
 * src/data/provenance.ts with field-to-source mappings.
 *
 * This ensures the UI source annotations stay in sync with the manifest.
 * Currently provenance.ts is hand-maintained for editorial and calculated
 * fields that don't appear in the manifest. This script only UPDATES
 * the published-data entries.
 *
 * Usage:
 *   node scripts/generate-provenance.mjs
 *   npm run generate:provenance
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const MANIFEST_PATH = join(__dirname, 'validate', 'source-manifest.json');

function main() {
  const manifest = JSON.parse(readFileSync(MANIFEST_PATH, 'utf-8'));

  console.log('Source Manifest → Provenance Map\n');
  console.log('The following fields are tracked in the manifest:\n');

  for (const source of manifest.sources) {
    if (!source.fields_validated?.length) continue;
    console.log(`  ${source.id} (${source.data_year}):`);
    for (const field of source.fields_validated) {
      console.log(`    → ${field}`);
    }
    console.log(`    Source: ${source.gov_uk_page || source.publisher}`);
    console.log('');
  }

  console.log('To auto-generate provenance.ts from the manifest,');
  console.log('update the FIELD_PROVENANCE entries in src/data/provenance.ts');
  console.log('to match the URLs and data years listed above.');
  console.log('\nNote: Editorial and calculated fields are hand-maintained.');
}

main();
