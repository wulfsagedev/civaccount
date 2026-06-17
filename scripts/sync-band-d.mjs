#!/usr/bin/env node
/**
 * sync-band-d.mjs — Sync band_d values from parsed-area-band-d.csv into TS data files.
 *
 * Pipeline:
 *   1. python3 scripts/parse-area-band-d.py  (ODS → CSV, uses odfpy)
 *   2. node scripts/sync-band-d.mjs          (CSV → TS files, this script)
 *   3. npm run validate                       (exact-match verification)
 *
 * The CSV is the single derived artifact from the GOV.UK ODS source file.
 * This script reads that CSV and writes exact values into the TS data files.
 *
 * Run: npm run sync:band-d
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { loadCsv as loadCsvRows } from './validate/load-councils.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = join(__dirname, '..');
const COUNCILS_DIR = join(PROJECT_ROOT, 'src', 'data', 'councils');

const CSV_FILE = 'parsed-area-band-d.csv';
const FIELDS = ['band_d_2021', 'band_d_2022', 'band_d_2023', 'band_d_2024', 'band_d_2025', 'band_d_2026'];

// ── Load CSV ─────────────────────────────────────────────────────────

function loadCsv() {
  // Shared quote-aware loader — a naive split(',') shifts every year column
  // by one on rows whose name contains a comma (e.g. "Bournemouth,
  // Christchurch & Poole"), silently writing year-shifted values into TS.
  const rows = loadCsvRows(CSV_FILE);
  if (rows.length === 0) {
    console.error(`ERROR: ${CSV_FILE} not found or empty. Run: python3 scripts/parse-area-band-d.py`);
    process.exit(1);
  }

  const authorities = new Map();
  for (const row of rows) {
    const ons = row.ons_code;
    if (!ons || !ons.startsWith('E')) continue;

    const years = {};
    for (const field of FIELDS) {
      const val = row[field];
      if (val && val !== '') {
        const num = parseFloat(val);
        if (!isNaN(num)) years[field] = num;
      }
    }

    if (Object.keys(years).length > 0) {
      authorities.set(ons, { name: row.name, cls: row.class, years });
    }
  }

  return authorities;
}

// ── Update TS file ───────────────────────────────────────────────────

function updateTsFile(filepath, authorities) {
  let content = readFileSync(filepath, 'utf-8');
  const original = content;
  let changes = 0;

  const onsPattern = /ons_code:\s*"(E\d+)"/g;
  const entries = [];
  let match;
  while ((match = onsPattern.exec(content)) !== null) {
    entries.push({ ons: match[1], pos: match.index });
  }

  for (let i = entries.length - 1; i >= 0; i--) {
    const { ons, pos } = entries[i];
    if (!authorities.has(ons)) continue;

    const data = authorities.get(ons);
    const endPos = i < entries.length - 1 ? entries[i + 1].pos : content.length;
    let section = content.substring(pos, endPos);

    for (const [field, value] of Object.entries(data.years)) {
      const fieldRe = new RegExp(`(${field}:\\s*)[\\d]+(?:\\.\\d+)?`);
      const fieldMatch = fieldRe.exec(section);
      if (fieldMatch) {
        const oldVal = parseFloat(fieldMatch[0].split(':')[1].trim());
        const newValStr = Number.isInteger(value) ? String(value) : value.toFixed(2);
        if (Math.abs(oldVal - value) > 0.001) {
          section = section.replace(fieldRe, `$1${newValStr}`);
          changes++;
        }
      }
    }

    // Update total_band_d to match band_d_2025
    if (data.years.band_d_2025 != null) {
      const tdRe = /total_band_d:\s*[\d]+(?:\.[\d]+)?/;
      const tdMatch = tdRe.exec(section);
      if (tdMatch) {
        const oldTd = parseFloat(tdMatch[0].split(':')[1].trim());
        const newTd = data.years.band_d_2025;
        const newTdStr = Number.isInteger(newTd) ? String(newTd) : newTd.toFixed(2);
        if (Math.abs(oldTd - newTd) > 0.001) {
          section = section.replace(tdRe, `total_band_d: ${newTdStr}`);
          changes++;
        }
      }
    }

    content = content.substring(0, pos) + section + content.substring(endPos);
  }

  if (content !== original) {
    writeFileSync(filepath, content);
  }
  return changes;
}

// ── Main ─────────────────────────────────────────────────────────────

console.log(`Loading ${CSV_FILE}...`);
const authorities = loadCsv();
console.log(`${authorities.size} authorities loaded\n`);

// Verify Bradford
const bradford = authorities.get('E08000032');
if (bradford) {
  console.log(`Verification — Bradford: ${JSON.stringify(bradford.years)}\n`);
}

const files = [
  ['metropolitan.ts', 'Metropolitan Districts'],
  ['unitary.ts', 'Unitary Authorities'],
  ['districts.ts', 'District Councils'],
  ['county-councils.ts', 'County Councils'],
  ['london-boroughs.ts', 'London Boroughs'],
];

let totalChanges = 0;
for (const [filename, label] of files) {
  const filepath = join(COUNCILS_DIR, filename);
  if (!existsSync(filepath)) continue;
  const n = updateTsFile(filepath, authorities);
  totalChanges += n;
  console.log(`  ${label}: ${n > 0 ? n + ' values updated' : 'in sync ✓'}`);
}

console.log(`\nTotal: ${totalChanges} values updated`);
if (totalChanges === 0) {
  console.log('All band_d values match the GOV.UK source exactly.');
}
