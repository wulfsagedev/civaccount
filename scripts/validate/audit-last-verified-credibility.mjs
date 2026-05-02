#!/usr/bin/env node
/**
 * audit-last-verified-credibility.mjs — flag councils whose
 * `detailed.last_verified` looks fabricated.
 *
 * Background (2026-05-02 SEO audit): 153 councils share `last_verified =
 * "2026-04-13"`. That date came from a bulk validator-run, not a real
 * per-council data change. Google's SpamBrain cross-checks sitemap
 * `lastmod` against actual page diffs; if it sees identical content over
 * many crawls but sitemap dates that bump, the whole sitemap loses trust.
 *
 * This script flags councils whose `last_verified` is shared by ≥10
 * other councils (= bulk-run signature) AND has no matching
 * `field_sources[k].accessed >= last_verified` (= no real evidence of
 * recent verification).
 *
 * Output:
 *   - stdout: human-readable report
 *   - reports/last-verified-credibility.json: machine-readable list of
 *     councils to fix, with the suggested replacement date (the most
 *     recent `accessed` date across their `field_sources`, or null if
 *     no field_sources exist).
 *
 * Usage:
 *   node scripts/validate/audit-last-verified-credibility.mjs
 *   node scripts/validate/audit-last-verified-credibility.mjs --bulk-threshold=20
 *   node scripts/validate/audit-last-verified-credibility.mjs --council=Bradford
 */

import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { loadCouncils } from './load-councils.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const m = a.match(/^--([^=]+)(?:=(.*))?$/);
    return m ? [m[1], m[2] ?? true] : [a, true];
  }),
);

const BULK_THRESHOLD = parseInt(String(args['bulk-threshold'] ?? '10'), 10);

const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const GREEN = '\x1b[32m';
const DIM = '\x1b[2m';
const BOLD = '\x1b[1m';
const RESET = '\x1b[0m';

function main() {
  const councils = loadCouncils();

  // ── Build distribution of last_verified dates ────────────────────────
  const dateCounts = new Map();
  for (const c of councils) {
    const d = c.detailed?.last_verified ?? null;
    if (!d) continue;
    dateCounts.set(d, (dateCounts.get(d) ?? 0) + 1);
  }

  // Bulk-run signature: dates shared by ≥ BULK_THRESHOLD councils.
  const bulkDates = new Set(
    [...dateCounts.entries()]
      .filter(([, n]) => n >= BULK_THRESHOLD)
      .map(([d]) => d),
  );

  // ── Per-council credibility check ────────────────────────────────────
  const findings = [];
  for (const c of councils) {
    if (args.council && c.name.toLowerCase() !== String(args.council).toLowerCase()) continue;

    const lv = c.detailed?.last_verified ?? null;
    if (!lv) continue;

    const isBulk = bulkDates.has(lv);
    if (!isBulk) continue;

    // Look for any field_sources entry with accessed >= last_verified.
    // Any single such entry corroborates the date — this council really
    // did get a fresh verification on or after that date.
    const fs = c.detailed?.field_sources ?? {};
    let mostRecentAccess = null;
    for (const [, entry] of Object.entries(fs)) {
      if (!entry || typeof entry !== 'object') continue;
      const a = entry.accessed;
      if (!a) continue;
      if (!mostRecentAccess || a > mostRecentAccess) mostRecentAccess = a;
    }

    const corroborated = mostRecentAccess !== null && mostRecentAccess >= lv;
    if (corroborated) continue;

    // Suggested replacement: the most recent field_sources `accessed` date
    // (which is a real per-field timestamp). If none, null — caller has to
    // either delete `last_verified` or do a real Phase 4.
    findings.push({
      council: c.name,
      ons_code: c.ons_code,
      type: c.type,
      current_last_verified: lv,
      bulk_date_shared_by_count: dateCounts.get(lv),
      most_recent_field_access: mostRecentAccess,
      suggested_last_verified: mostRecentAccess,
      action:
        mostRecentAccess === null
          ? 'STRIP — no field_sources at all; do a real Phase 4 verification'
          : `REPLACE with ${mostRecentAccess} (most recent field_sources.accessed date)`,
    });
  }

  // ── Report ───────────────────────────────────────────────────────────
  console.log(BOLD + '═══ LAST-VERIFIED CREDIBILITY AUDIT ═══' + RESET);
  console.log('');
  console.log(`Bulk-run threshold: ≥ ${BULK_THRESHOLD} councils sharing the same date`);
  console.log('');
  console.log('Date distribution (top 10):');
  for (const [date, n] of [...dateCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)) {
    const flag = bulkDates.has(date) ? `${YELLOW}[bulk]${RESET}` : '';
    console.log(`  ${date}: ${n} councils ${flag}`);
  }
  console.log('');

  if (findings.length === 0) {
    console.log(`${GREEN}✓ All councils with bulk-run dates have field_sources evidence.${RESET}`);
    process.exit(0);
  }

  console.log(`${RED}${BOLD}${findings.length} council(s) flagged${RESET}`);
  console.log(
    `${DIM}(last_verified shares a bulk-run date AND no field_sources entry corroborates)${RESET}`,
  );
  console.log('');

  for (const f of findings.slice(0, 20)) {
    console.log(`  ${BOLD}${f.council}${RESET} (${f.type})`);
    console.log(
      `    last_verified: ${YELLOW}${f.current_last_verified}${RESET} (shared by ${f.bulk_date_shared_by_count} councils)`,
    );
    console.log(`    most_recent_field_access: ${f.most_recent_field_access ?? 'none'}`);
    console.log(`    action: ${f.action}`);
    console.log('');
  }
  if (findings.length > 20) {
    console.log(`  ${DIM}… and ${findings.length - 20} more (see JSON report)${RESET}`);
  }

  // Write machine-readable report.
  const reportsDir = join(__dirname, 'reports');
  mkdirSync(reportsDir, { recursive: true });
  const reportPath = join(reportsDir, 'last-verified-credibility.json');
  writeFileSync(
    reportPath,
    JSON.stringify(
      {
        audited_at: new Date().toISOString(),
        bulk_threshold: BULK_THRESHOLD,
        bulk_dates: [...bulkDates],
        date_counts: Object.fromEntries(dateCounts),
        flagged_count: findings.length,
        findings,
      },
      null,
      2,
    ),
  );
  console.log(`${DIM}Full report: ${reportPath}${RESET}`);

  // Exit nonzero if anything is flagged so CI can gate on this.
  process.exit(findings.length > 0 ? 1 : 0);
}

main();
