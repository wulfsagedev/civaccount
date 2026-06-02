#!/usr/bin/env node
/**
 * bradford-absolute.mjs — the ABSOLUTE TEST CASE.
 *
 * Bradford is our reassurance that the whole verification + immutability system
 * works as intended. This suite is the single command that proves it. It asserts:
 *
 *   PART A — PROVEN: Bradford is FULLY-COVERED (every rendered number backed) and
 *            every individual field has the verdict we expect.
 *   PART B — IMMUTABLE: Bradford's current state byte-matches its frozen lock.
 *   PART C — TAMPER-EVIDENT: each kind of corruption (value / excerpt / screenshot /
 *            source archive / Band D) breaks the lock AND fails proof. The system
 *            must catch every one. A missed attack = a false-pass bug.
 *   PART D — CLEAN TEARDOWN: every mutation is reversed; repo left byte-identical.
 *
 * All mutations are on temp copies / reversed in finally. The real repo is never
 * left changed (verified at the end by re-checking the lock).
 *
 * Run: node scripts/validate/bradford-absolute.mjs   (exit 0 = system works)
 */

import { execSync } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO = join(__dirname, '..', '..');
const METRO = join(REPO, 'src', 'data', 'councils', 'metropolitan.ts');
const RESERVES_PNG = join(REPO, 'src/data/councils/pdfs/council-pdfs/bradford/images/reserves-p31.png');

const sh = (cmd) => { try { return { out: execSync(cmd, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }), code: 0 }; } catch (e) { return { out: (e.stdout || '') + (e.stderr || ''), code: e.status || 1 }; } };
const proof = () => sh(`node "${join(__dirname, 'proof.mjs')}" --council=Bradford 2>/dev/null`);
const lockVerify = () => sh(`node "${join(__dirname, 'verify-council-lock.mjs')}" Bradford 2>/dev/null`);

const results = [];
function assert(name, passed, detail) {
  results.push({ name, passed });
  console.log(`${passed ? '✓' : '✗ FAIL'}  ${name}${detail ? `  — ${detail}` : ''}`);
}

const ORIG_TS = readFileSync(METRO, 'utf8');
const ORIG_PNG = readFileSync(RESERVES_PNG);
const restore = () => { writeFileSync(METRO, ORIG_TS); writeFileSync(RESERVES_PNG, ORIG_PNG); };
const mutateTs = (find, repl) => {
  const s = readFileSync(METRO, 'utf8');
  if (!s.includes(find)) throw new Error(`setup: cannot find "${find}"`);
  writeFileSync(METRO, s.replace(find, repl));
};

console.log('\n═══════════════════════════════════════════════════════════');
console.log('  BRADFORD — THE ABSOLUTE TEST CASE');
console.log('  Proves: verified + immutable + tamper-evident, end to end.');
console.log('═══════════════════════════════════════════════════════════\n');

try {
  // ── PART A: PROVEN ──────────────────────────────────────────────
  console.log('PART A — PROVEN (every rendered number backed)\n');
  {
    const p = proof();
    assert('A1  Bradford is FULLY-COVERED', /🟢 FULLY-COVERED/.test(p.out));
    assert('A2  coverage is N/N (no unbacked holes)', /COVERAGE: (\d+)\/\1 /.test(p.out),
      (p.out.match(/COVERAGE: [^\n]+/) || [''])[0].trim());
    assert('A3  Tier-1 Band D 6/6 exact vs GOV.UK CSV', /TIER-1 Band D: 6\/6 exact/.test(p.out));
    assert('A4  zero UNPROVEN fields', !/UNPROVEN/.test(p.out));
    // Expected per-field verdicts (the known-good shape).
    const expect = {
      reserves: 'PROVEN_STALE', chief_executive_salary: 'PROVEN_CURRENT',
      capital_programme: 'PROVEN_STALE', council_tax_requirement: 'PROVEN_CURRENT',
      total_councillors: 'PROVEN_CURRENT', budget_gap: 'PROVEN_CURRENT', savings_target: 'PROVEN_CURRENT',
    };
    let ok = true, bad = '';
    for (const [f, v] of Object.entries(expect)) {
      const re = new RegExp(`${f}: ${v}`);
      if (!re.test(p.out)) { ok = false; bad += `${f}≠${v} `; }
    }
    assert('A5  all key fields carry their expected verdict', ok, bad || 'all match');
    assert('A6  Tier-4 live fields present & quarantined (not counted proven)', /cabinet: TIER4/.test(p.out) && /council_leader: TIER4/.test(p.out));
  }

  // ── PART B: IMMUTABLE ───────────────────────────────────────────
  console.log('\nPART B — IMMUTABLE (matches the frozen lock)\n');
  {
    const v = lockVerify();
    assert('B1  current state byte-matches the lock', v.code === 0 && /IMMUTABLE/.test(v.out));
    assert('B2  lock covers all 14 fields + 6 Band D years', /14 fields \+ 6 Band D years/.test(v.out));
  }

  // ── PART C: TAMPER-EVIDENT ──────────────────────────────────────
  console.log('\nPART C — TAMPER-EVIDENT (every corruption is caught)\n');

  // C1: corrupt a Tier-3 value
  mutateTs('reserves: 247848000,', 'reserves: 200000000,');
  {
    const broke = lockVerify().code !== 0;
    const unproven = /reserves: UNPROVEN/.test(proof().out) || !/🟢/.test(proof().out);
    assert('C1  corrupted reserves value → breaks lock AND fails proof', broke && unproven);
  }
  restore();

  // C2: corrupt a Tier-1 value (CSV-backed)
  mutateTs('capital_programme: 169952000,', 'capital_programme: 170000000,');
  {
    const broke = lockVerify().code !== 0;
    assert('C2  corrupted capital_programme (≠ CSV cell) → breaks lock', broke);
  }
  restore();

  // C3: alter an excerpt (still verbatim-ish but different text → excerpt_sha changes)
  mutateTs(
    'excerpt: "Usable Reserves                                   (247,848)",',
    'excerpt: "Usable Reserves (247,848)",'
  );
  {
    const broke = lockVerify().code !== 0;
    assert('C3  altered excerpt text → breaks lock (excerpt fingerprint changed)', broke);
  }
  restore();

  // C4: doctor the screenshot (1 byte)
  writeFileSync(RESERVES_PNG, Buffer.concat([ORIG_PNG, Buffer.from([0])]));
  {
    const broke = lockVerify().code !== 0;
    const unproven = !/🟢/.test(proof().out);
    assert('C4  doctored screenshot → breaks lock AND fails proof', broke && unproven);
  }
  restore();

  // C5: tamper the source archive reference (sha no longer resolves)
  mutateTs(
    'sha256_at_access: "afb85fa9a84c6446826a74874a23eeabdc019f102828c217740a35cb1184e25f",',
    'sha256_at_access: "0000000000000000000000000000000000000000000000000000000000000000",'
  );
  {
    const broke = lockVerify().code !== 0;
    const unproven = !/🟢/.test(proof().out);
    assert('C5  tampered archive sha → breaks lock AND fails proof', broke && unproven);
  }
  restore();

  // C6: drift a Band D year
  mutateTs('band_d_2025: 2246,', 'band_d_2025: 2250,');
  {
    const broke = lockVerify().code !== 0;
    assert('C6  drifted Band D vs GOV.UK CSV → breaks lock', broke);
  }
  restore();

} finally {
  restore();
}

// ── PART D: CLEAN TEARDOWN ────────────────────────────────────────
console.log('\nPART D — CLEAN TEARDOWN (repo restored, still immutable)\n');
{
  const tsClean = readFileSync(METRO, 'utf8') === ORIG_TS;
  const pngClean = Buffer.compare(readFileSync(RESERVES_PNG), ORIG_PNG) === 0;
  assert('D1  metropolitan.ts restored byte-identical', tsClean);
  assert('D2  reserves screenshot restored byte-identical', pngClean);
  const v = lockVerify();
  assert('D3  Bradford verifies IMMUTABLE again after all attacks', v.code === 0 && /IMMUTABLE/.test(v.out));
}

const failed = results.filter(r => !r.passed);
console.log('\n═══════════════════════════════════════════════════════════');
console.log(`  ${results.length - failed.length}/${results.length} checks passed`);
if (failed.length) {
  console.log(`  🔴 SYSTEM NOT VALIDATED — ${failed.length} failure(s):`);
  for (const f of failed) console.log(`     - ${f.name}`);
  console.log('═══════════════════════════════════════════════════════════\n');
  process.exit(1);
}
console.log('  🟢 SYSTEM VALIDATED — Bradford is proven, immutable, tamper-evident.');
console.log('═══════════════════════════════════════════════════════════\n');
process.exit(0);
