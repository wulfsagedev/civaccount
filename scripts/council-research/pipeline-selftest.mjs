#!/usr/bin/env node
/**
 * pipeline-selftest.mjs — deliberate-input tests for every pure module
 * the pipeline depends on. The counterpart to scripts/validate/
 * proof-selftest.mjs, for the research pipeline.
 *
 * The fixtures are REAL lines from real council documents already in
 * the dataset (Ipswich SoA, Adur SoA, Basildon SoA remuneration table)
 * plus the failure modes that have actually happened (WAF HTML
 * pretending to be a PDF, percent-encoded fiscal years, names with
 * table-column suffixes, the General-Fund-vs-usable reserves trap).
 *
 * If you change a detector regex, a discovery pattern, or the TS
 * surgery, this must still pass. It runs in CI on every push — no
 * network, no poppler, no private data needed.
 *
 * Exit: 0 all pass · 1 any failure (with a list of exactly what broke).
 */

import { writeFileSync, readFileSync, mkdtempSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { parseAmounts, DETECTORS } from './lib/detectors.mjs';
import { classifyDoc, guessFiscalYear, isCurrentEnough, harvestLinks } from './lib/discovery.mjs';
import { isPdfFile } from './lib/robust-fetch.mjs';
import {
  buildFieldSourceEntry,
  upsertScalar,
  upsertFieldSources,
  verifyBlockContains,
} from './lib/populate-logic.mjs';

let passed = 0;
const failures = [];
function check(name, cond, detail = '') {
  if (cond) { passed++; return; }
  failures.push(`${name}${detail ? ` — ${detail}` : ''}`);
}

// ════ 1. Amount parsing ═══════════════════════════════════════════════
{
  const a = parseAmounts('Chief Executive | 141,324');
  check('parseAmounts: "141,324" → 141324', a.length === 1 && a[0].value === 141_324, JSON.stringify(a));
  check('parseAmounts: "£1.2m" → 1,200,000', parseAmounts('gap of £1.2m by 2027')[0]?.value === 1_200_000);
  check('parseAmounts: "£950k" → 950,000', parseAmounts('savings of £950k')[0]?.value === 950_000);
  check('parseAmounts: multiple amounts in a table row', parseAmounts('31,968 - 789 - - 6,841 39,598').length === 3);
  check('parseAmounts: no amounts → []', parseAmounts('the council provides services').length === 0);
}

// ════ 2. Detectors — real lines from real documents ═══════════════════
{
  const soa = { docType: 'statement-of-accounts' };

  // Ipswich SoA p47 (shipped citation)
  const sal = DETECTORS.chief_executive_salary('Chief Executive | 141,324', soa);
  check('salary: Ipswich line detected at conf 0.85', sal.length === 1 && sal[0].value === 141_324 && sal[0].confidence === 0.85, JSON.stringify(sal));
  check('salary: amount outside 80k-350k range rejected', DETECTORS.chief_executive_salary('Chief Executive expenses 3,500', soa).length === 0);
  check('salary: no "chief executive" on line → []', DETECTORS.chief_executive_salary('Director of Finance | 141,324', soa).length === 0);

  // Adur SoA p93 (shipped citation)
  const adur = DETECTORS.chief_executive('Dr Catherine Howe, Chief Executive');
  check('CEO name: "Dr Catherine Howe, Chief Executive"', adur.length === 1 && adur[0].value === 'Dr Catherine Howe', JSON.stringify(adur));

  // Basildon SoA p64 remuneration table (e2e test discovery) — the
  // column word "From"/"To" must be stripped from the captured name.
  const gj = DETECTORS.chief_executive('Chief Executive: Gary Jones From 1 31,968 - 789 - - 6,841 39,598');
  check('CEO name: table suffix "From" stripped', gj.length === 1 && gj[0].value === 'Gary Jones', JSON.stringify(gj));
  const sl = DETECTORS.chief_executive('Chief Executive: Scott Logan To');
  check('CEO name: table suffix "To" stripped', sl.length === 1 && sl[0].value === 'Scott Logan', JSON.stringify(sl));
  check('CEO name: role words filtered out', DETECTORS.chief_executive('Chief Executive Officer Remuneration Statement').length === 0);

  // Reserves — the §2 trap must stay labelled exactly as designed.
  const gf = DETECTORS.reserves('General Fund Balance carried forward 8,123', soa);
  check('reserves: General Fund candidate labelled correct', gf.length === 1 && gf[0].matched.includes('GENERAL FUND') && gf[0].confidence === 0.75, JSON.stringify(gf));
  const usable = DETECTORS.reserves('Total Usable Reserves 45,123', soa);
  check('reserves: usable-reserves trap carries ⚠ + conf 0.2', usable.length === 1 && usable[0].matched.includes('NOT the field') && usable[0].confidence === 0.2, JSON.stringify(usable));
  const bal = DETECTORS.reserves('Balance at 31 March 2025 carried forward', soa);
  check('reserves: balance-at-31-March row → page locator (value null)', bal.length === 1 && bal[0].value === null, JSON.stringify(bal));

  // Allowances
  const basic = DETECTORS.councillor_basic_allowance('Basic Allowance (per annum) 5,903', { docType: 'councillor-allowances' });
  check('basic allowance: Adur-style line at conf 0.85', basic.length === 1 && basic[0].value === 5_903 && basic[0].confidence === 0.85, JSON.stringify(basic));
}

// ════ 3. Discovery — classification + fiscal years + harvesting ═══════
{
  check('classify: pay policy URL', classifyDoc('https://x.gov.uk/media/11558/Basildon-Council-Pay-Policy-2025-2026/pdf/x.pdf') === 'pay-policy');
  check('classify: percent-encoded SoA URL', classifyDoc('https://x.moderngov.co.uk/documents/s14361/Draft%20BDC%20Statement%20of%20Accounts%202024-25.pdf') === 'statement-of-accounts');
  check('classify: annual accounts variant', classifyDoc('Public Notice Conclusion of Audit annual accounts') === 'statement-of-accounts');
  check('classify: unrelated → null', classifyDoc('https://x.gov.uk/bin-collection-days') === null);

  check('fiscal year: "2024-25"', guessFiscalYear('Statement-of-Accounts-2024-25.pdf') === '2024-25');
  check('fiscal year: percent-encoded "202223"', guessFiscalYear('Draft%20service%20budget%20202223%20and%20Capital') === '2022-23');
  check('fiscal year: compact "202526"', guessFiscalYear('Draft budget report 202526.pdf') === '2025-26');
  check('fiscal year: old doc "2006-07"', guessFiscalYear('Statement-of-Accounts-2006-07') === '2006-07');
  check('currency filter: 2006-07 is stale', isCurrentEnough('2006-07') === false);
  check('currency filter: 2024-25 is current', isCurrentEnough('2024-25') === true);
  check('currency filter: unknown passes to reviewer', isCurrentEnough('unknown') === true);

  const html = `
    <a href="/media/123/Statement-of-Accounts-2024-25.pdf">Statement of Accounts 2024/25</a>
    <a href="https://web.archive.org/web/20250101000000/https://x.gov.uk/docs/pay-policy-2025.pdf">Pay Policy</a>
    <a href="https://web.archive.org/web/20250101000000/https://x.gov.uk/help">Wayback chrome link</a>
    <a href="/leisure-centres.pdf">Leisure centres opening times</a>
    <a href="https://meetings.example.info/documents/s14361/Members%20Allowances%202024.pdf">Allowances</a>`;
  const links = harvestLinks(html, 'https://x.gov.uk/finance');
  check('harvest: finds the SoA via relative href', links.some((l) => l.url === 'https://x.gov.uk/media/123/Statement-of-Accounts-2024-25.pdf' && l.document_type === 'statement-of-accounts'), JSON.stringify(links));
  check('harvest: unwraps wayback-rewritten href to the live URL', links.some((l) => l.url === 'https://x.gov.uk/docs/pay-policy-2025.pdf' && l.document_type === 'pay-policy'));
  check('harvest: ignores wayback chrome + non-finance PDFs', !links.some((l) => l.url.includes('web.archive.org') || l.url.includes('leisure')));
  check('harvest: catches ModernGov documents/sNNN links', links.some((l) => l.document_type === 'councillor-allowances'));
}

// ════ 4. PDF magic-byte check (the WAF bot-page trap) ═════════════════
{
  const dir = mkdtempSync(join(tmpdir(), 'civaccount-selftest-'));
  const realPdf = join(dir, 'real.pdf');
  const fakePdf = join(dir, 'fake.pdf');
  writeFileSync(realPdf, '%PDF-1.7\n' + 'x'.repeat(2000));
  writeFileSync(fakePdf, '<!DOCTYPE html><html>Just a moment…</html>' + ' '.repeat(2000));
  check('isPdfFile: real %PDF- header accepted', isPdfFile(realPdf) === true);
  check('isPdfFile: WAF HTML with .pdf name rejected', isPdfFile(fakePdf) === false);
  writeFileSync(fakePdf, '%PDF');
  check('isPdfFile: sub-1KB stub rejected', isPdfFile(fakePdf) === false);
  rmSync(dir, { recursive: true, force: true });
}

// ════ 5. TS surgery — fixture round trip ══════════════════════════════
{
  const FIXTURE_BLOCK = `
    name: "Testshire",
    type: "SD",
    detailed: {
      precepts: [
        { authority: "Testshire District Council", band_d: 200.0 },
      ],
      reserves: 1000000,
      total_councillors: 40,
      field_sources: {
        reserves: {
          url: "https://old.example.gov.uk/soa.pdf#page=10",
          title: "Old Entry",
          accessed: "2025-01-01",
          data_year: "2023-24",
          tier: 3,
          extraction_method: "pdf_page",
          sha256_at_access: "oldsha",
          page: 10,
        },
      },
      last_verified: "2025-01-01",
    },
  },`;

  const cand = {
    value: 141_324,
    page: 47,
    excerpt: 'Chief Executive | 141,324',
    pdf: 'statement-of-accounts-2024-25.pdf',
    sha256: 'abc123def456abc123def456abc123def456abc123def456abc123def456abcd',
    source_url: 'https://www.example.gov.uk/soa-2024-25.pdf',
    document_type: 'statement-of-accounts',
    fiscal_year: '2024-25',
  };
  const opts = { councilName: 'Testshire', slug: 'testshire', pngOnDisk: true, today: '2026-06-10' };
  const entry = buildFieldSourceEntry('chief_executive_salary', cand, opts);
  check('entry: #page anchor appended', entry.text.includes('soa-2024-25.pdf#page=47'), entry.text);
  check('entry: title from document type', entry.text.includes('"Testshire Statement of Accounts 2024-25"'));
  check('entry: page_image_url present when PNG exists', entry.text.includes('/archive/testshire/images/chief_executive_salary-p47.png'));
  check('entry: sha256 + excerpt + tier 3 present', entry.text.includes(cand.sha256) && entry.text.includes('Chief Executive | 141,324') && entry.text.includes('tier: 3,'));
  const entryNoPng = buildFieldSourceEntry('chief_executive_salary', cand, { ...opts, pngOnDisk: false });
  check('entry: no page_image_url claimed when PNG missing', !entryNoPng.text.includes('page_image_url'));
  const entryUnknown = buildFieldSourceEntry('reserves', { ...cand, document_type: 'unknown', source_url: 'https://www.example.gov.uk/media/9/Annual_Financial_Report_2024_25_v3.pdf' }, opts);
  check('entry: unknown doc type falls back to filename-derived title', entryUnknown.text.includes('Annual Financial Report 2024 25'), entryUnknown.text);

  // Scalar upsert: new + existing
  let r = upsertScalar(FIXTURE_BLOCK, 'chief_executive_salary', '141324');
  check('scalar: new field inserted into detailed', /\n {6}chief_executive_salary: 141324,/.test(r.block), r.change);
  r = upsertScalar(r.block, 'reserves', '2000000');
  check('scalar: existing field value replaced', /\n {6}reserves: 2000000,/.test(r.block) && !/reserves: 1000000,/.test(r.block), r.change);

  // field_sources upsert: insert new key + replace existing key
  let f = upsertFieldSources(r.block, 'chief_executive_salary', entry.text);
  check('fs: new entry inserted into existing map', f.block.includes('chief_executive_salary: {') && f.block.includes('#page=47'), f.change);
  const replacement = buildFieldSourceEntry('reserves', cand, opts);
  f = upsertFieldSources(f.block, 'reserves', replacement.text);
  check('fs: existing entry replaced (old sha gone)', !f.block.includes('oldsha') && f.block.includes(cand.sha256), f.change);

  // No-map case: create map before last_verified
  const noMap = FIXTURE_BLOCK.replace(/ {6}field_sources: \{[\s\S]*?\n {6}\},\n/, '');
  const created = upsertFieldSources(noMap, 'chief_executive_salary', entry.text);
  check('fs: map created when absent', created.block.includes('field_sources: {') && created.block.indexOf('field_sources: {') < created.block.indexOf('last_verified:'), created.change);

  // Round-trip verification (what 05 runs after --apply)
  const v = verifyBlockContains(f.block, 'chief_executive_salary', '141324');
  check('round-trip: applied block verifies', v.ok === true, v.reason);
  const vBad = verifyBlockContains(FIXTURE_BLOCK, 'chief_executive_salary', '141324');
  check('round-trip: unapplied block FAILS verification', vBad.ok === false);
  const vMangled = verifyBlockContains(f.block.replace('sha256_at_access', 'sha256_at_acce55'), 'chief_executive_salary', '141324');
  check('round-trip: mangled entry FAILS verification', vMangled.ok === false, vMangled.reason);
}

// ════ 6. Run journal ══════════════════════════════════════════════════
{
  const dir = mkdtempSync(join(tmpdir(), 'civaccount-journal-'));
  const journalPath = join(dir, 'runs.jsonl');
  // Spawn a child so the env override + exit hooks are exercised for real.
  const { execSync } = await import('node:child_process');
  const script = `
    import { startRun } from '${join(process.cwd(), 'scripts', 'council-research', 'lib', 'journal.mjs').replace(/\\/g, '/')}';
    const run = startRun('selftest-script', 'Testshire');
    run.finish('ok', { proof: 42 });
  `;
  const tmpScript = join(dir, 'probe.mjs');
  writeFileSync(tmpScript, script);
  execSync(`node ${tmpScript}`, { env: { ...process.env, CIVACCOUNT_JOURNAL_PATH: journalPath } });
  const lines = existsSync(journalPath) ? readFileSync(journalPath, 'utf8').trim().split('\n') : [];
  const rec = lines.length ? JSON.parse(lines[lines.length - 1]) : null;
  check('journal: run recorded with script/council/status', rec?.script === 'selftest-script' && rec?.council === 'Testshire' && rec?.status === 'ok' && rec?.proof === 42, JSON.stringify(rec));
  rmSync(dir, { recursive: true, force: true });
}

// ════ Summary ═════════════════════════════════════════════════════════
console.log('');
if (failures.length === 0) {
  console.log(`✅ pipeline-selftest: ${passed}/${passed} checks passed`);
  process.exit(0);
}
console.error(`❌ pipeline-selftest: ${failures.length} FAILED (${passed} passed)`);
for (const f of failures) console.error(`   ✗ ${f}`);
process.exit(1);
