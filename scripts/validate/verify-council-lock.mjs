#!/usr/bin/env node
/**
 * verify-council-lock.mjs — prove a council's data still matches its frozen lock.
 *
 * This is the immutability gate. It rebuilds the council's fingerprint from the
 * CURRENT data + sources, and compares it field-by-field to the committed lock.
 * Anything that changed — a value, a source archive, an excerpt, a screenshot,
 * a verdict — is reported as drift, and the script exits non-zero.
 *
 * It re-derives via lock-council.mjs --print (same code path that wrote the lock),
 * so the comparison is apples-to-apples and the live proof engine must still pass.
 *
 * Usage: node scripts/validate/verify-council-lock.mjs Bradford
 * Exit:  0 = matches lock (immutable, still proven) · 1 = drift / not proven
 */

import { execSync } from 'child_process';
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const LOCKS = join(__dirname, 'locks');

const name = process.argv[2];
if (!name) { console.error('usage: node verify-council-lock.mjs <CouncilName>'); process.exit(1); }
const slug = name.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const lockPath = join(LOCKS, `${slug}.lock.json`);
if (!existsSync(lockPath)) { console.error(`✗ no lock for ${name} — run: node scripts/validate/lock-council.mjs ${name}`); process.exit(1); }
const locked = JSON.parse(readFileSync(lockPath, 'utf8'));

// Re-derive the CURRENT fingerprint with the same generator (this also re-runs the
// full proof engine internally; if the council is no longer fully-covered, it exits 1).
// Write to a temp FILE rather than capturing stdout — nested execSync stdout pipes
// truncate at 8KB, which silently corrupted the JSON. File I/O has no such limit.
let current;
const tmpOut = join(LOCKS, `.verify-${slug}-${process.pid}.tmp.json`);
try {
  execSync(`node "${join(__dirname, 'lock-council.mjs')}" "${name}" --out="${tmpOut}" 2>/dev/null`, { stdio: 'ignore' });
  current = JSON.parse(readFileSync(tmpOut, 'utf8'));
} catch {
  console.error(`✗ ${name}: cannot re-derive proof — council is no longer FULLY-COVERED (proof failed).`);
  try { if (existsSync(tmpOut)) execSync(`rm -f "${tmpOut}"`); } catch { /* noop */ }
  process.exit(1);
}
try { if (existsSync(tmpOut)) execSync(`rm -f "${tmpOut}"`); } catch { /* noop */ }

console.log(`\n🔍 Verifying ${name} against frozen lock ${locked.lock_sha256.slice(0, 16)}…\n`);

// Fast path: whole-lock hash match.
if (current.lock_sha256 === locked.lock_sha256) {
  console.log(`🔒 IMMUTABLE — every value, source, excerpt & screenshot byte-matches the lock.`);
  console.log(`   ${locked.fields.length} fields + ${Object.keys(locked.tier1_band_d).length} Band D years unchanged.`);
  console.log(`   lock_sha256 ${locked.lock_sha256}\n`);
  process.exit(0);
}

// Slow path: pinpoint exactly what drifted (so a real change is actionable).
console.log(`⚠️  LOCK MISMATCH — re-derived ${current.lock_sha256.slice(0, 16)}… ≠ frozen ${locked.lock_sha256.slice(0, 16)}…`);
console.log(`   Diffing field-by-field:\n`);
let drift = 0;

// Band D
for (const y of Object.keys({ ...locked.tier1_band_d, ...current.tier1_band_d })) {
  const a = locked.tier1_band_d[y], b = current.tier1_band_d[y];
  if (a !== b) { console.log(`   ✗ council_tax.${y}: locked ${a} → now ${b}`); drift++; }
}

const lockedByField = Object.fromEntries(locked.fields.map(f => [f.field, f]));
const currentByField = Object.fromEntries(current.fields.map(f => [f.field, f]));
const allFields = new Set([...Object.keys(lockedByField), ...Object.keys(currentByField)]);
const ATTRS = ['rendered_value', 'archive_sha256', 'excerpt_sha256', 'screenshot_sha256', 'page', 'data_year', 'verdict', 'source_url'];

for (const f of [...allFields].sort()) {
  const L = lockedByField[f], C = currentByField[f];
  if (!L) { console.log(`   ✗ ${f}: NEW field not in lock`); drift++; continue; }
  if (!C) { console.log(`   ✗ ${f}: field REMOVED since lock`); drift++; continue; }
  for (const a of ATTRS) {
    if (JSON.stringify(L[a]) !== JSON.stringify(C[a])) {
      const fmt = v => (typeof v === 'string' && v.length > 24) ? v.slice(0, 20) + '…' : JSON.stringify(v);
      console.log(`   ✗ ${f}.${a}: locked ${fmt(L[a])} → now ${fmt(C[a])}`);
      drift++;
    }
  }
}

console.log(`\n🔴 ${drift} change(s) from the frozen lock. If this change is INTENTIONAL & re-proven,`);
console.log(`   re-lock with: node scripts/validate/lock-council.mjs ${name}`);
console.log(`   Otherwise the data has drifted from its verified state — investigate.\n`);
process.exit(1);
