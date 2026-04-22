#!/usr/bin/env node
/**
 * backfill-field-source-years.mjs — one-shot migration.
 *
 * Adds `data_year:` to every existing `field_sources` entry across every
 * council data file. Defaults come from DATA-YEAR-POLICY.md:
 *
 *   chief_executive_salary       → 2025-26  (council Pay Policy Statement)
 *   councillor_basic_allowance   → 2024-25  (annual allowances scheme)
 *   cabinet                      → current  (live page, no fiscal year)
 *   budget_gap                   → 2025-26  (MTFS 2025-26 → 2029-30)
 *   salary_bands                 → 2024-25  (Statement of Accounts 2024-25)
 *   total_allowances_cost        → 2024-25  (same SoA + councillor earnings)
 *   councillor_allowances_detail → 2024-25
 *   council_leader               → current  (live page)
 *   chief_executive              → current  (live page — name, not salary)
 *   savings_target               → 2025-26  (MTFS)
 *   service_spending             → 2025-26  (Budget Book)
 *
 * Per-council overrides should be made by hand after this migration
 * lands — this is a lower-bound defaults pass so the interface contract
 * (data_year required) becomes enforceable immediately.
 *
 * Usage:
 *   node scripts/validate/backfill-field-source-years.mjs [--check]
 *
 * `--check` prints what would change without writing.
 */

import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..', '..');
const DATA_DIR = join(REPO_ROOT, 'src', 'data', 'councils');

const FILES = [
  'metropolitan.ts',
  'london-boroughs.ts',
  'unitary.ts',
  'county-councils.ts',
  'districts.ts',
];

const DEFAULTS = {
  chief_executive_salary: '2025-26',
  councillor_basic_allowance: '2024-25',
  cabinet: 'current',
  budget_gap: '2025-26',
  salary_bands: '2024-25',
  total_allowances_cost: '2024-25',
  councillor_allowances_detail: '2024-25',
  council_leader: 'current',
  chief_executive: 'current',
  savings_target: '2025-26',
  service_spending: '2025-26',
};

const checkOnly = process.argv.includes('--check');
let totalAdded = 0;
let filesChanged = 0;

for (const name of FILES) {
  const path = join(DATA_DIR, name);
  const src = readFileSync(path, 'utf8');

  // Each field_sources entry is a block like:
  //   chief_executive_salary: {
  //     url: "...",
  //     title: "...",
  //     accessed: "2026-04-13",
  //   },
  //
  // If the block already contains `data_year:`, we skip it.
  //
  // We locate the block by its key (one of DEFAULTS) and insert the
  // `data_year` line before the closing `}`.

  const keyRe = Object.keys(DEFAULTS).join('|');
  const blockRe = new RegExp(
    `(^(\\s+)(${keyRe}):\\s*\\{)([\\s\\S]*?)(\\n\\2\\},)`,
    'gm'
  );

  let added = 0;
  const next = src.replace(blockRe, (match, open, indent, key, body, close) => {
    if (/\bdata_year\s*:/.test(body)) return match; // already present
    const year = DEFAULTS[key];
    // Preserve existing trailing-newline style; insert before closing brace.
    // `body` ends with whatever the last property's newline-and-indent is.
    const endsWithComma = /,\s*$/.test(body);
    const insertion = `${endsWithComma ? '' : ','}\n${indent}  data_year: "${year}",`;
    added += 1;
    return open + body + insertion + close;
  });

  if (added > 0) {
    filesChanged += 1;
    totalAdded += added;
    if (!checkOnly) writeFileSync(path, next);
    console.log(`${checkOnly ? '[DRY]' : '[OK] '} ${name}: +${added} data_year lines`);
  }
}

console.log(
  `\n${checkOnly ? 'Would add' : 'Added'} ${totalAdded} data_year entries across ${filesChanged} files.`
);
