#!/usr/bin/env node
/**
 * proof-ratchet.mjs — the CI ratchet. Verification can only climb, never silently rot.
 *
 * This is the gate that stops the original disease (the hand-typed "139 complete"
 * that quietly decayed to a real 1). It runs in CI on every PR/push and FAILS the
 * build if any of these regress:
 *
 *   1. The verifier itself is sound        → proof-selftest.mjs must pass (all attacks caught)
 *   2. The reference council stays locked   → bradford-absolute.mjs must pass (proven+immutable)
 *   3. The fully-covered count never drops  → proof count >= the committed floor
 *
 * FAIL-SAFE FOR THE SPLIT REPO: the private council data is a submodule absent on
 * most public-repo CI runners. Like validate.mjs, if the data isn't present we SKIP
 * (exit 0) — the ratchet only enforces where the real data exists (local, data-PRs,
 * Vercel). It never false-passes by running against missing data.
 *
 * The floor lives in scripts/validate/proof-floor.json and is itself ratcheted:
 * when the fully-covered count goes UP, run `node proof-ratchet.mjs --bump` to raise
 * the floor so it can never fall back. Lowering the floor requires a deliberate,
 * reviewed edit — that's the point.
 *
 * Run:  node scripts/validate/proof-ratchet.mjs          (CI gate)
 *       node scripts/validate/proof-ratchet.mjs --bump   (raise floor after real progress)
 * Exit: 0 = pass/skip · 1 = regression (build goes red)
 */

import { execSync } from 'child_process';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DC = join(__dirname, '..', '..', 'src', 'data', 'councils');
const FLOOR_PATH = join(__dirname, 'proof-floor.json');
const bump = process.argv.includes('--bump');

function run(cmd) {
  try { return { out: execSync(cmd, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }), code: 0 }; }
  catch (e) { return { out: (e.stdout || '') + (e.stderr || ''), code: e.status || 1 }; }
}

// ── Fail-safe: no private data on this runner → skip cleanly (mirrors validate.mjs) ──
if (!existsSync(join(DC, 'index.ts'))) {
  console.log('proof-ratchet: private council data not present on this runner — skipping (Vercel/local/data-PRs enforce it).');
  process.exit(0);
}

console.log('\n═══ PROOF RATCHET — verification may only climb ═══\n');
let failed = 0;

// ── Gate 1: the verifier is sound ──
console.log('1/3  Self-test (verifier soundness — every attack must be caught)…');
{
  const r = run(`node "${join(__dirname, 'proof-selftest.mjs')}"`);
  const ok = r.code === 0 && /No false-pass path detected/.test(r.out);
  console.log(ok ? '     ✓ self-test passed' : '     ✗ SELF-TEST FAILED — the verifier has a false-pass path');
  if (!ok) { failed++; console.log(r.out.split('\n').filter(l => /✗|FALSE-PASS/.test(l)).join('\n')); }
}

// ── Gate 2: the reference council stays proven + immutable ──
console.log('2/3  Bradford absolute suite (reference must stay proven + locked)…');
{
  const r = run(`node "${join(__dirname, 'bradford-absolute.mjs')}"`);
  const ok = r.code === 0 && /SYSTEM VALIDATED/.test(r.out);
  console.log(ok ? '     ✓ Bradford 19/19 — proven, immutable, tamper-evident' : '     ✗ BRADFORD SUITE FAILED');
  if (!ok) { failed++; console.log(r.out.split('\n').filter(l => /✗ FAIL|checks passed/.test(l)).join('\n')); }
}

// ── Gate 3: the fully-covered count never drops below the committed floor ──
console.log('3/3  Fully-covered count vs committed floor…');
const tmp = join(__dirname, `.ratchet-${process.pid}.json`);
let count = null;
{
  const r = run(`node "${join(__dirname, 'proof.mjs')}" --json-out="${tmp}" 2>/dev/null`);
  if (r.code !== 0 || !existsSync(tmp)) {
    console.log('     ✗ proof run failed — cannot read count');
    failed++;
  } else {
    const report = JSON.parse(readFileSync(tmp, 'utf8'));
    count = report.summary.fully_covered_councils;
    try { execSync(`rm -f "${tmp}"`); } catch { /* noop */ }
    const floor = existsSync(FLOOR_PATH) ? JSON.parse(readFileSync(FLOOR_PATH, 'utf8')).fully_covered_floor : 0;
    if (bump) {
      const newFloor = Math.max(floor, count);
      writeFileSync(FLOOR_PATH, JSON.stringify({ fully_covered_floor: newFloor, bumped: 'run date-stamped externally', note: 'Raise only via --bump after real verification progress. Lowering requires a reviewed manual edit.' }, null, 2) + '\n');
      console.log(`     ✓ floor bumped: ${floor} → ${newFloor}`);
    } else if (count < floor) {
      console.log(`     ✗ REGRESSION: fully-covered ${count} < floor ${floor} — a council lost its proof.`);
      failed++;
    } else {
      console.log(`     ✓ fully-covered ${count} ≥ floor ${floor}${count > floor ? `  (↑ run --bump to raise the floor to ${count})` : ''}`);
    }
  }
}

console.log('');
if (failed > 0) {
  console.log(`🔴 RATCHET FAILED — ${failed} regression(s). Build blocked.\n`);
  process.exit(1);
}
console.log('🟢 RATCHET PASSED — verification intact, nothing regressed.\n');
process.exit(0);
