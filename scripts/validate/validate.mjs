#!/usr/bin/env node
/**
 * validate.mjs — CivAccount Data Validation Tool
 *
 * Runs 9 categories of checks across all 317 councils:
 *   1. ranges       — Value bounds and sanity checks
 *   2. cross-field  — Inter-field logical consistency
 *   3. quality      — Placeholder text, duplicates, format violations
 *   4. completeness — Kent parity audit + regression detection
 *   5. spot-check   — Cross-reference against parsed gov.uk CSVs
 *   6. checksum     — SHA-256 integrity of parsed CSV files
 *   7. random-audit — Deep spot-check on 10 random councils
 *   8. source-truth — Exact-match band_d values against GOV.UK Area CT source
 *   9. freshness    — Flag sources overdue for update based on manifest cadence
 *
 * Usage:
 *   node scripts/validate/validate.mjs [--verbose]
 *   npm run validate
 */

import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

import { loadCouncils, loadPopulation } from './load-councils.mjs';
import { ReportBuilder } from './lib/report.mjs';

import { validate as validateRanges } from './validators/ranges.mjs';
import { validate as validateCrossField } from './validators/cross-field.mjs';
import { validate as validateQuality } from './validators/quality.mjs';
import { validate as validateCompleteness } from './validators/completeness.mjs';
import { validate as validateSpotCheck } from './validators/spot-check.mjs';
import { validate as validateChecksum } from './validators/checksum.mjs';
import { validate as validateRandomAudit } from './validators/random-audit.mjs';
import { validate as validateSourceTruth } from './validators/source-truth.mjs';
import { validate as validateFreshness } from './validators/freshness.mjs';
import { validate as validateFieldStaleness } from './validators/field-staleness.mjs';
import { validate as validateProvenanceStrict } from './validators/provenance-strict.mjs';
import { validate as validateCalculatedFields } from './validators/calculated-fields.mjs';

// Link-check is async and opt-in (requires network)
let validateLinkCheck;
if (process.argv.includes('--link-check')) {
  validateLinkCheck = (await import('./validators/link-check.mjs')).validate;
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const REPORTS_DIR = join(__dirname, 'reports');
const COUNCILS_DIR = join(__dirname, '..', '..', 'src', 'data', 'councils');

// Private-data guard: validation runs against the real 317-council dataset,
// which lives in the private civaccount-data repo and is only present when
// CIVACCOUNT_DATA_TOKEN is set at prebuild time. On a fresh CI checkout
// without that token, the data simply isn't there — skip with exit 0 so
// the workflow stays green. The nightly data-freshness job (which *does*
// have the token) is where real validation happens.
if (!existsSync(join(COUNCILS_DIR, 'index.ts'))) {
  console.log('validate: private council data not present (no CIVACCOUNT_DATA_TOKEN). Skipping.');
  process.exit(0);
}

// ANSI colors
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const GREEN = '\x1b[32m';
const CYAN = '\x1b[36m';
const DIM = '\x1b[2m';
const BOLD = '\x1b[1m';
const RESET = '\x1b[0m';

const verbose = process.argv.includes('--verbose');
const linkCheck = process.argv.includes('--link-check');

async function main() {
  console.log(`\n${BOLD}CivAccount Data Validation Tool${RESET}`);
  console.log(`${'='.repeat(60)}\n`);

  // Load data
  const t0 = Date.now();
  console.log(`${DIM}Loading council data...${RESET}`);
  const councils = loadCouncils();
  const population = loadPopulation();
  console.log(`${DIM}Loaded ${councils.length} councils + ${Object.keys(population).length} population entries (${Date.now() - t0}ms)${RESET}\n`);

  // Build report
  const report = new ReportBuilder();

  // Run validators
  const validators = [
    ['ranges', validateRanges],
    ['cross-field', validateCrossField],
    ['quality', validateQuality],
    ['completeness', validateCompleteness],
    ['spot-check', validateSpotCheck],
    ['checksum', validateChecksum],
    ['random-audit', validateRandomAudit],
    ['source-truth', validateSourceTruth],
    ['freshness', validateFreshness],
    ['field-staleness', validateFieldStaleness],
    ['provenance-strict', validateProvenanceStrict],
    ['calculated-fields', validateCalculatedFields],
  ];

  // Link-check is opt-in (requires network access, slow)
  if (linkCheck && validateLinkCheck) {
    validators.push(['link-check', validateLinkCheck]);
  }

  for (const [name, fn] of validators) {
    const t1 = Date.now();
    process.stdout.write(`  Running ${name}... `);
    try {
      await fn(councils, population, report);
      const elapsed = Date.now() - t1;
      const count = report.findings.filter(f => f.validator === name).length;
      const color = count > 0 ? YELLOW : GREEN;
      console.log(`${color}${count} findings${RESET} ${DIM}(${elapsed}ms)${RESET}`);
    } catch (err) {
      console.log(`${RED}FAILED${RESET}`);
      console.error(`    ${err.message}`);
      if (verbose) console.error(err.stack);
    }
  }

  // Build final report
  const result = report.build();

  // Write reports
  if (!existsSync(REPORTS_DIR)) mkdirSync(REPORTS_DIR, { recursive: true });

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const timestampedPath = join(REPORTS_DIR, `validation-${timestamp}.json`);
  const latestPath = join(REPORTS_DIR, 'validation-latest.json');

  writeFileSync(timestampedPath, JSON.stringify(result, null, 2));
  writeFileSync(latestPath, JSON.stringify(result, null, 2));

  // Console summary
  console.log(`\n${'='.repeat(60)}`);
  console.log(`${BOLD}VALIDATION SUMMARY${RESET}`);
  console.log(`${'='.repeat(60)}\n`);

  const s = result.summary;
  console.log(`  Councils checked:  ${BOLD}${s.total_councils}${RESET}`);
  console.log(`  Total checks run:  ${BOLD}${s.total_checks.toLocaleString()}${RESET}`);
  console.log(`  Errors:            ${s.errors > 0 ? RED + BOLD : GREEN}${s.errors}${RESET}`);
  console.log(`  Warnings:          ${s.warnings > 0 ? YELLOW : GREEN}${s.warnings}${RESET}`);
  console.log(`  Info:              ${DIM}${s.info}${RESET}`);
  console.log(`  Regressions:       ${s.regressions > 0 ? RED + BOLD : GREEN}${s.regressions}${RESET}`);

  // Parity scores
  console.log(`\n${BOLD}PARITY SCORES${RESET}\n`);
  console.log(`  Overall average:   ${BOLD}${s.parity.average}%${RESET}`);
  if (Object.keys(s.parity.by_type).length > 0) {
    for (const [type, avg] of Object.entries(s.parity.by_type)) {
      console.log(`  ${type.padEnd(20)} ${avg}%`);
    }
  }

  // Top issues by validator
  if (s.errors + s.warnings > 0) {
    console.log(`\n${BOLD}FINDINGS BY VALIDATOR${RESET}\n`);
    const byValidator = {};
    for (const f of result.findings) {
      if (!byValidator[f.validator]) byValidator[f.validator] = { error: 0, warning: 0, info: 0 };
      byValidator[f.validator][f.severity]++;
    }
    for (const [name, counts] of Object.entries(byValidator)) {
      const parts = [];
      if (counts.error > 0) parts.push(`${RED}${counts.error} errors${RESET}`);
      if (counts.warning > 0) parts.push(`${YELLOW}${counts.warning} warnings${RESET}`);
      if (counts.info > 0) parts.push(`${DIM}${counts.info} info${RESET}`);
      console.log(`  ${name.padEnd(15)} ${parts.join(', ')}`);
    }
  }

  // Most common finding types
  if (result.findings.length > 0) {
    console.log(`\n${BOLD}TOP FINDING TYPES${RESET}\n`);
    const byCheck = {};
    for (const f of result.findings) {
      const key = `${f.check} (${f.severity})`;
      byCheck[key] = (byCheck[key] || 0) + 1;
    }
    const sorted = Object.entries(byCheck).sort((a, b) => b[1] - a[1]).slice(0, 10);
    for (const [check, count] of sorted) {
      const color = check.includes('error') ? RED : check.includes('warning') ? YELLOW : DIM;
      console.log(`  ${color}${count.toString().padStart(4)}${RESET}  ${check}`);
    }
  }

  // Completeness — most commonly missing fields
  if (result.completeness.by_field) {
    console.log(`\n${BOLD}MOST COMMONLY MISSING FIELDS${RESET}\n`);
    const missingFields = Object.entries(result.completeness.by_field)
      .filter(([, v]) => v.total > 0 && v.present < v.total)
      .map(([field, v]) => ({ field, missing: v.total - v.present, total: v.total }))
      .sort((a, b) => b.missing - a.missing);

    for (const { field, missing, total } of missingFields) {
      const pct = ((total - missing) / total * 100).toFixed(0);
      console.log(`  ${field.padEnd(35)} ${missing}/${total} missing (${pct}% coverage)`);
    }
  }

  // Regressions
  const regressions = result.findings.filter(f => f.check === 'regression_field_lost');
  if (regressions.length > 0) {
    console.log(`\n${RED}${BOLD}REGRESSIONS DETECTED${RESET}\n`);
    for (const r of regressions) {
      console.log(`  ${RED}${r.council}${RESET}: lost field "${r.field}"`);
    }
  }

  // Verbose: print all findings
  if (verbose && result.findings.length > 0) {
    console.log(`\n${BOLD}ALL FINDINGS${RESET}\n`);
    for (const f of result.findings) {
      const color = f.severity === 'error' ? RED : f.severity === 'warning' ? YELLOW : DIM;
      console.log(`  ${color}[${f.severity.toUpperCase()}]${RESET} ${f.council} — ${f.message}`);
    }
  }

  // File output
  console.log(`\n${DIM}Reports written to:${RESET}`);
  console.log(`  ${timestampedPath}`);
  console.log(`  ${latestPath}`);

  // Bottom 5 councils
  if (result.completeness.by_council) {
    const bottom5 = Object.entries(result.completeness.by_council)
      .sort((a, b) => a[1].score - b[1].score)
      .slice(0, 5);
    if (bottom5.length > 0) {
      console.log(`\n${BOLD}BOTTOM 5 COUNCILS (lowest parity)${RESET}\n`);
      for (const [name, data] of bottom5) {
        console.log(`  ${data.score.toString().padStart(5)}%  ${name} (${data.type})`);
        if (data.missing.length > 0) {
          console.log(`  ${DIM}       Missing: ${data.missing.slice(0, 5).join(', ')}${data.missing.length > 5 ? ` (+${data.missing.length - 5} more)` : ''}${RESET}`);
        }
      }
    }
  }

  console.log('');

  // Exit code: 0=clean, 1=errors found, 2=regressions, 3=crash (caught above)
  if (s.regressions > 0) process.exit(2);
  if (s.errors > 0) process.exit(1);
  process.exit(0);
}

main();
