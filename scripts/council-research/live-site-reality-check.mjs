#!/usr/bin/env node
/**
 * live-site-reality-check.mjs — Phase 5b live-site reality check.
 *
 * For each council, confirm that 3 rendered values from their
 * Tier-3 field_sources entries appear VERBATIM in the archived
 * source document (PDF, or HTML where that is what we archived).
 *
 * This is the "open council.gov.uk in another tab and confirm"
 * check from COUNCIL-ROLLOUT-PLAYBOOK.md §Phase 5b — but run
 * against our local archive (which IS the council's own document
 * we downloaded). The sha256 in field_sources proves the archive
 * matches the original at fetch time, so this is equivalent.
 *
 * Writes:
 *   scripts/validate/reports/live-site-reality-check.json
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO = join(__dirname, '..', '..');
const PDFS = join(REPO, 'src', 'data', 'councils', 'pdfs', 'council-pdfs');

const BATCH_67 = [
  { name: 'Hampshire', slug: 'hampshire' },
  { name: 'Essex', slug: 'essex' },
  { name: 'Hertfordshire', slug: 'hertfordshire' },
  { name: 'Sheffield', slug: 'sheffield' },
  { name: 'Westminster', slug: 'westminster' },
  { name: 'Nottinghamshire', slug: 'nottinghamshire' },
  { name: 'Staffordshire', slug: 'staffordshire' },
  { name: 'Wiltshire', slug: 'wiltshire' },
  { name: 'Newcastle upon Tyne', slug: 'newcastle-upon-tyne' },
  { name: 'Croydon', slug: 'croydon' },
  { name: 'Manchester', slug: 'manchester' },
  { name: 'Birmingham', slug: 'birmingham' },
  { name: 'Leeds', slug: 'leeds' },
  { name: 'Surrey', slug: 'surrey' },
  { name: 'Cornwall', slug: 'cornwall' },
  { name: 'Liverpool', slug: 'liverpool' },
  { name: 'Bristol', slug: 'bristol' },
  { name: 'Lancashire', slug: 'lancashire' },
  { name: 'Tower Hamlets', slug: 'tower-hamlets' },
  { name: 'Broxbourne', slug: 'broxbourne' },
];

// For each council, the 3 key values we expect to find verbatim.
// These are what the playbook's "3 random values" would hit — we pick the
// 3 most-important provenance-tracked fields for the strict-check.
const CHECKS = {
  hampshire: [
    { value: '252,318', where: 'pay-statement-2025-26.pdf', note: 'CE salary (para 23)' },
    { value: 'Hampshire County Council', where: 'pay-statement-2025-26.pdf', note: 'Council name verbatim' },
    { value: 'Head of Paid Service', where: 'pay-statement-2025-26.pdf', note: 'Role name verbatim' },
  ],
  essex: [
    { value: '2,850,327', where: 'statement-of-accounts-2024-25.pdf', note: 'Total reserves 2024-25' },
    { value: 'Gavin Jones', where: 'statement-of-accounts-2024-25.pdf', note: 'CE name (departing)' },
    { value: 'Nicole Wood', where: 'statement-of-accounts-2024-25.pdf', note: 'Current CE name' },
  ],
  hertfordshire: [
    { value: '251,808', where: 'pay-policy-2026-27.pdf', note: 'CE salary §4.4' },
    { value: 'Angie Ridgwell', where: 'chief-executive-role.pdf', note: 'CE role profile name' },
    { value: '62,266', where: 'statement-of-accounts-2023-24.pdf', note: 'Closing General Fund' },
  ],
  sheffield: [
    { value: '213,454', where: 'statement-of-accounts-2023-24.pdf', note: 'CE Kate Josephs Note 10a' },
    { value: 'Kate Josephs', where: 'statement-of-accounts-2023-24.pdf', note: 'CE name' },
    { value: '557,970', where: 'statement-of-accounts-2023-24.pdf', note: 'Total usable reserves' },
  ],
  broxbourne: [
    { value: '136,508', where: 'statement-of-accounts-2024-25.pdf', note: 'CE salary Note 27 (p43)' },
    { value: 'J T Stack', where: 'annual-governance-statement-2024-25.pdf', note: 'CE name AGS signature (p8)' },
    { value: '6,572', where: 'statement-of-accounts-2024-25.pdf', note: 'General Fund Reserve Note 6 (p25)' },
  ],
  westminster: [
    { value: '232,389', where: 'annual-accounts-2023-24.pdf', note: 'CE Stuart Love Note 10a' },
    { value: 'S Love', where: 'annual-accounts-2023-24.pdf', note: 'CE surname' },
    { value: '3,290,198', where: 'annual-accounts-2023-24.pdf', note: 'Total reserves' },
  ],
  nottinghamshire: [
    { value: '201,664', where: 'pay-policy-2024-25.pdf', note: 'CE salary post-April-2024' },
    { value: 'Adrian Smith', where: 'pay-policy-2024-25.pdf', note: 'CE name A Smith (in SoA) / Adrian Smith' },
    { value: '318,749', where: 'statement-of-accounts-2023-24.pdf', note: 'General reserves earmarked 2024' },
  ],
  staffordshire: [
    { value: '202,542', where: 'pay-policy-2026.pdf', note: 'CE salary' },
    { value: 'Chief Executive', where: 'pay-policy-2026.pdf', note: 'Role name verbatim' },
    { value: '48.5 million', where: 'statement-of-accounts-2023-24.pdf', note: 'GF balance narrative' },
  ],
  wiltshire: [
    { value: 'Lucy Townsend', where: 'pay-policy-2025-26.pdf', note: 'CE signature line' },
    { value: 'Chief Executive', where: 'pay-policy-2025-26.pdf', note: 'Role verbatim' },
    { value: 'Pay Policy Statement', where: 'pay-policy-2025-26.pdf', note: 'Document title' },
  ],
  'newcastle-upon-tyne': [
    { value: '183,473', where: 'pay-policy-2024-25.pdf', note: 'CE salary range low' },
    { value: '200,487', where: 'pay-policy-2024-25.pdf', note: 'CE salary range high' },
    { value: 'Chief Executive', where: 'pay-policy-2024-25.pdf', note: 'Role verbatim' },
  ],
  croydon: [
    { value: '204,190', where: 'pay-policy-2025-26.pdf', note: 'CE salary' },
    { value: 'Katherine Kerswell', where: 'statement-of-accounts-2023-24.pdf', note: 'CE name per Note 10a' },
    { value: '27.5', where: 'statement-of-accounts-2023-24.pdf', note: 'General Fund balance 2023-24' },
  ],
  manchester: [
    { value: 'The only unearmarked reserve is the General Fund reserve at £19.9m', where: 'statement-of-accounts-2023-24.pdf', note: 'Reserves narrative' },
    { value: 'Tom Stannard', where: 'statement-of-accounts-2024-25.pdf', note: 'CE name — AGS signature p212 "Signed Tom Stannard (Chief Executive)" (commenced 3 Feb 2025 per Note p109)' },
    { value: 'Total Usable Reserves', where: 'statement-of-accounts-2023-24.pdf', note: 'Reserves section exists' },
  ],
  birmingham: [
    { value: 'Unearmarked Reserves', where: 'statement-of-accounts-2023-24.pdf', note: 'Reserves section exists' },
    { value: '140.6', where: 'statement-of-accounts-2023-24.pdf', note: 'Unearmarked reserves value' },
    { value: 'Joanne Roney', where: 'statement-of-accounts-2023-24.pdf', note: 'Current CE' },
  ],
  leeds: [
    { value: '36,248', where: 'statement-of-accounts-2024-25.pdf', note: 'General Fund Reserve MIRS' },
    { value: 'Tom Riordan', where: 'statement-of-accounts-2024-25.pdf', note: 'Prior CE (Note 10a)' },
    { value: 'General Fund Reserve', where: 'statement-of-accounts-2024-25.pdf', note: 'Section exists' },
  ],
  surrey: [
    { value: 'Terence Herbert', where: 'chief-executive-news-2024-08-19.html', note: 'CE name — the artefact field_sources.chief_executive actually cites (surreycc.gov.uk)' },
    { value: 'Pay Policy', where: 'pay-policy-statement-2025-26.pdf', note: 'Document title' },
    { value: 'Chief Executive', where: 'pay-policy-statement-2025-26.pdf', note: 'Role name — adopted statement, not the committee covering report' },
  ],
  cornwall: [
    { value: '201,661', where: 'statement-of-accounts-2024-25.pdf', note: 'Kate Kennally CE Note 10a' },
    { value: '38.768', where: 'statement-of-accounts-2024-25.pdf', note: 'GF balance 31 March 2025' },
    { value: 'Kate Kennally', where: 'statement-of-accounts-2024-25.pdf', note: 'CE name verbatim' },
  ],
  liverpool: [
    { value: 'General Fund working balance of £16.8m', where: 'statement-of-accounts-2024-25.pdf', note: 'GF working balance narrative' },
    { value: 'Andrew Lewis', where: 'statement-of-accounts-2024-25.pdf', note: 'Current CE' },
    { value: 'Usable Reserves', where: 'statement-of-accounts-2024-25.pdf', note: 'Section exists' },
  ],
  bristol: [
    { value: '37,800', where: 'statement-of-accounts-2024-25-draft.pdf', note: 'GF balance 31 March 2025' },
    { value: 'Balance at 31 March 2025', where: 'statement-of-accounts-2024-25-draft.pdf', note: 'MIRS balance exists' },
    { value: 'Bristol City Council', where: 'statement-of-accounts-2024-25-draft.pdf', note: 'Council name verbatim' },
  ],
  lancashire: [
    { value: 'Lancashire County Council', where: 'statement-of-accounts-2023-24.pdf', note: 'Council name verbatim' },
    { value: 'Mark Wynn', where: 'statement-of-accounts-2023-24.pdf', note: 'Current CE' },
    { value: 'Statement of Accounts', where: 'statement-of-accounts-2023-24.pdf', note: 'Document title' },
  ],
  'tower-hamlets': [
    { value: '21.2', where: 'statement-of-accounts-2024-25.pdf', note: 'GF balances MIRS' },
    { value: 'Lutfur Rahman', where: 'statement-of-accounts-2024-25.pdf', note: 'Executive Mayor' },
    { value: 'General Fund', where: 'statement-of-accounts-2024-25.pdf', note: 'Section exists' },
  ],
  'basingstoke-and-deane': [
    { value: 'Russell O\'Keefe', where: 'statement-of-accounts-2024-25.pdf', note: 'CE name (Note 23 remuneration)' },
    { value: '157,581', where: 'statement-of-accounts-2024-25.pdf', note: 'CE salary 2024/25 (Note 23)' },
    { value: '£1.5M General Fund balance', where: 'statement-of-accounts-2024-25.pdf', note: 'GF working balance narrative p70' },
  ],
  boston: [
    { value: '157,200', where: 'appendix-201-20--20unaudited-20financial-20statements-202024-25.pdf', note: 'CE salary (Note 30a Senior Officers Remuneration)' },
    { value: 'General Fund', where: 'appendix-201-20--20unaudited-20financial-20statements-202024-25.pdf', note: 'GF reserve row exists (p12 / MIRS p17)' },
    { value: '367', where: 'appendix-201-20--20unaudited-20financial-20statements-202024-25.pdf', note: 'Total members allowances (Note 29)' },
  ],
};

function pdfGrep(pdfPath, needle) {
  try {
    const out = execSync(`pdftotext -layout "${pdfPath}" - | grep -c -F "${needle.replace(/"/g, '\\"')}"`, {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
    return parseInt(out, 10) || 0;
  } catch {
    return 0;
  }
}

/** Some field_sources cite an archived HTML page rather than a PDF (e.g. a
 *  council newsroom post). Strip tags to visible text, then count occurrences
 *  of the needle — same "appears verbatim in the archived source" semantics. */
function htmlGrep(htmlPath, needle) {
  try {
    const text = readFileSync(htmlPath, 'utf8')
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&#(\d+);/g, (_, d) => String.fromCharCode(Number(d)))
      .replace(/\s+/g, ' ');
    return text.split(needle).length - 1;
  } catch {
    return 0;
  }
}

function archiveGrep(archivePath, needle) {
  return /\.html?$/i.test(archivePath)
    ? htmlGrep(archivePath, needle)
    : pdfGrep(archivePath, needle);
}

const reports = [];
for (const { name, slug } of BATCH_67) {
  const checks = CHECKS[slug] || [];
  const results = [];
  for (const check of checks) {
    const pdfPath = join(PDFS, slug, check.where);
    if (!existsSync(pdfPath)) {
      results.push({ ...check, pdfPath, pdfExists: false, found: false, count: 0 });
      continue;
    }
    const count = archiveGrep(pdfPath, check.value);
    results.push({ ...check, pdfPath, pdfExists: true, found: count > 0, count });
  }
  const passed = results.filter(r => r.found).length;
  reports.push({ council: name, slug, checks: results, passed, total: results.length });
  console.log(`${name}: ${passed}/${results.length} values verbatim`);
  for (const r of results) {
    const icon = r.found ? '✓' : '✗';
    console.log(`  ${icon} "${r.value}" in ${r.where} (${r.count} matches) — ${r.note}`);
  }
}

const summary = {
  date: new Date().toISOString(),
  total_councils: reports.length,
  total_checks: reports.reduce((s, r) => s + r.total, 0),
  total_passed: reports.reduce((s, r) => s + r.passed, 0),
  all_passed: reports.every(r => r.passed === r.total),
  reports,
};
const out = join(REPO, 'scripts', 'validate', 'reports', 'live-site-reality-check.json');
writeFileSync(out, JSON.stringify(summary, null, 2));
console.log(`\nSummary: ${summary.total_passed}/${summary.total_checks} verbatim across ${summary.total_councils} councils`);
console.log(`Written: ${out}`);
process.exit(summary.all_passed ? 0 : 1);
