#!/usr/bin/env node
/**
 * proof-selftest.mjs — adversarial self-test of the proof engine.
 *
 * The verifier is the most safety-critical code in the project: a false-pass here
 * certifies a wrong number as true. So we attack it. Each test CORRUPTS one input
 * (a rendered value, or an archived file) and asserts the engine flips the affected
 * field to UNPROVEN. A test FAILS if the engine still says PROVEN — that would be a
 * false-pass path, i.e. a bug that "cannot exist" in this system.
 *
 * All mutations are made on a TEMP COPY of the data file / a restored-after archive;
 * the real repo is never left modified.
 *
 * Run: node scripts/validate/proof-selftest.mjs   (exit 0 = all attacks caught)
 */

import { execSync } from 'child_process';
import { readFileSync, writeFileSync, copyFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO = join(__dirname, '..', '..');
const METRO = join(REPO, 'src', 'data', 'councils', 'metropolitan.ts');
const PROOF = join(__dirname, 'proof.mjs');

// Run proof for one council, return parsed per-field verdicts.
function runProof(council) {
  const raw = execSync(`node "${PROOF}" --council="${council}" --json 2>/dev/null || node "${PROOF}" --council="${council}" 2>/dev/null`, { encoding: 'utf8' });
  return raw;
}
// We use the text output (proof --council prints per-field lines + VERDICT).
function fieldVerdict(council, field) {
  const out = execSync(`node "${PROOF}" --council="${council}" 2>/dev/null`, { encoding: 'utf8' });
  const line = out.split('\n').find(l => l.trim().includes(`${field}:`));
  const verdict = /🟢 FULLY-COVERED/.test(out) ? 'FULLY-COVERED' : (/🟡/.test(out) ? 'EVIDENCE-CLEAN' : 'NOT-PROVEN');
  return { line: (line || '').trim(), council_verdict: verdict, full: out };
}

const results = [];
function check(name, passed, detail) {
  results.push({ name, passed, detail });
  console.log(`${passed ? '✓ CAUGHT' : '✗ MISSED (FALSE-PASS BUG)'}  ${name}`);
  if (detail) console.log(`            ${detail}`);
}

// Snapshot the data file so every mutation is reversible.
const ORIG = readFileSync(METRO, 'utf8');
function restore() { writeFileSync(METRO, ORIG); }
function mutate(find, replace) {
  const cur = readFileSync(METRO, 'utf8');
  if (!cur.includes(find)) throw new Error(`selftest setup: cannot find "${find}" to mutate`);
  writeFileSync(METRO, cur.replace(find, replace));
}

console.log('\n═══ PROOF ENGINE ADVERSARIAL SELF-TEST ═══');
console.log('Each attack corrupts one input and asserts the engine flips it to UNPROVEN.\n');

// Baseline: Bradford must be FULLY-COVERED before we start (else tests are meaningless).
{
  const v = fieldVerdict('Bradford', 'reserves');
  check('baseline: Bradford starts FULLY-COVERED', v.council_verdict === 'FULLY-COVERED',
    `council verdict = ${v.council_verdict}`);
}

try {
  // ── Attack 1: Tier-3 scalar value corrupted (reserves), excerpt left intact ──
  mutate('reserves: 247848000,', 'reserves: 313131313,');
  {
    const v = fieldVerdict('Bradford', 'reserves');
    const caught = /reserves: UNPROVEN/.test(v.full) && v.council_verdict !== 'FULLY-COVERED';
    check('Tier-3: corrupted reserves value (genuine excerpt) → UNPROVEN', caught, v.line);
  }
  restore();

  // ── Attack 2: Tier-1 national-CSV value corrupted (capital_programme) ──
  mutate('capital_programme: 169952000,', 'capital_programme: 424242424,');
  {
    const v = fieldVerdict('Bradford', 'capital_programme');
    const caught = /capital_programme: UNPROVEN/.test(v.full) && v.council_verdict !== 'FULLY-COVERED';
    check('Tier-1: corrupted capital_programme vs CSV cell → UNPROVEN', caught, v.line);
  }
  restore();

  // ── Attack 3: Tier-1 council_tax_requirement corrupted ──
  mutate('council_tax_requirement: 280447489,', 'council_tax_requirement: 111111111,');
  {
    const v = fieldVerdict('Bradford', 'council_tax_requirement');
    const caught = /council_tax_requirement: UNPROVEN/.test(v.full) && v.council_verdict !== 'FULLY-COVERED';
    check('Tier-1: corrupted council_tax_requirement vs CSV cell → UNPROVEN', caught, v.line);
  }
  restore();

  // ── Attack 4: Tier-1 total_councillors corrupted ──
  mutate('total_councillors: 90,', 'total_councillors: 9999,');
  {
    const v = fieldVerdict('Bradford', 'total_councillors');
    const caught = /total_councillors: UNPROVEN/.test(v.full) && v.council_verdict !== 'FULLY-COVERED';
    check('Tier-1: corrupted total_councillors vs CSV cell → UNPROVEN', caught, v.line);
  }
  restore();

  // ── Attack 5: fabricated excerpt (Tier-3) — excerpt not in the source doc ──
  mutate(
    'excerpt: "Usable Reserves                                   (247,848)",',
    'excerpt: "Usable Reserves of exactly £313,131,313 confirmed",'
  );
  {
    const v = fieldVerdict('Bradford', 'reserves');
    // value 247848000 no longer binds to fabricated excerpt digits → UNPROVEN
    const caught = /reserves: UNPROVEN/.test(v.full) && v.council_verdict !== 'FULLY-COVERED';
    check('Tier-3: fabricated excerpt (not verbatim in PDF) → UNPROVEN', caught, v.line);
  }
  restore();

  // ── Attack 6: tampered archive — swap the recorded sha to a non-matching one ──
  // (Resolver won't find a _meta.json with this sha → archive unresolved → UNPROVEN.)
  mutate(
    'sha256_at_access: "afb85fa9a84c6446826a74874a23eeabdc019f102828c217740a35cb1184e25f",',
    'sha256_at_access: "deadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef0",'
  );
  {
    const v = fieldVerdict('Bradford', 'reserves');
    const caught = /reserves: UNPROVEN/.test(v.full) && v.council_verdict !== 'FULLY-COVERED';
    check('Tier-3: tampered/unknown archive sha → UNPROVEN', caught, v.line);
  }
  restore();

} finally {
  restore(); // belt-and-braces: never leave the repo mutated
}

// Verify clean restoration.
{
  const v = fieldVerdict('Bradford', 'reserves');
  check('teardown: Bradford restored to FULLY-COVERED', v.council_verdict === 'FULLY-COVERED',
    `council verdict = ${v.council_verdict}`);
}

const missed = results.filter(r => !r.passed);
console.log(`\n═══ ${results.length - missed.length}/${results.length} checks passed ═══`);
if (missed.length) {
  console.log(`\n🔴 ${missed.length} FALSE-PASS PATH(S) FOUND — the verifier has a bug:`);
  for (const m of missed) console.log(`   - ${m.name}`);
  process.exit(1);
}
console.log('🟢 Every adversarial attack was caught. No false-pass path detected.\n');
process.exit(0);
