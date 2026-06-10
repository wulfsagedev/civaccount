#!/usr/bin/env node
/**
 * queue-mark.mjs — computed-done marker for ROLLOUT-QUEUE.json.
 *
 * "Shipped" is COMPUTED, never asserted: marking a council shipped
 * re-runs the gates and refuses unless they pass —
 *   1. npm run validate → exit 0 (whole suite, includes the
 *      source-licence gate and Tier-1 drift checks)
 *   2. zero source-licence findings for THIS council in the report
 *   3. this council passes screenshot-parity (it must have been added
 *      to the North-Star lists during Phase 7)
 *
 * Deferring requires a written reason — visible in the queue and the
 * run journal, never a silent skip.
 *
 * Usage:
 *   node scripts/council-research/queue-mark.mjs --council=X --shipped
 *   node scripts/council-research/queue-mark.mjs --council=X --deferred --reason="SoA unfetchable: WAF + no wayback copy"
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { startRun } from './lib/journal.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..', '..');
const QUEUE_PATH = join(__dirname, 'ROLLOUT-QUEUE.json');

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const m = a.match(/^--([^=]+)(?:=(.*))?$/);
    return m ? [m[1], m[2] ?? true] : [a, true];
  }),
);

if (!args.council || (!args.shipped && !args.deferred)) {
  console.error('Usage: queue-mark.mjs --council=<name> --shipped | --deferred --reason="…"');
  process.exit(2);
}
const councilName = String(args.council);
const run = startRun('queue-mark', councilName);

const queueDoc = JSON.parse(readFileSync(QUEUE_PATH, 'utf-8'));
const entry = queueDoc.queue.find((q) => q.name === councilName);
if (!entry) {
  console.error(`✗ ${councilName} is not in the queue.`);
  run.finish('failed', { reason: 'not in queue' });
  process.exit(2);
}

function save() {
  queueDoc.remaining = queueDoc.queue.filter((q) => q.status !== 'shipped').length;
  writeFileSync(QUEUE_PATH, JSON.stringify(queueDoc, null, 2) + '\n');
}

if (args.deferred) {
  const reason = String(args.reason ?? '');
  if (reason.length < 10) {
    console.error('✗ Deferral requires a written --reason (≥10 chars). No silent skips.');
    run.finish('failed', { reason: 'deferral without reason' });
    process.exit(1);
  }
  entry.status = 'deferred';
  entry.deferred_reason = reason;
  entry.attempts = (entry.attempts ?? 0) + 1;
  save();
  console.log(`◦ ${councilName} deferred: ${reason}`);
  run.finish('ok', { marked: 'deferred', reason });
  process.exit(0);
}

// ── --shipped: compute it ──────────────────────────────────────────────
console.log(`Verifying gates before marking ${councilName} shipped…`);

// Gate 1: full validation suite must be clean.
const v = spawnSync('npm', ['run', 'validate'], { cwd: REPO_ROOT, encoding: 'utf-8' });
if (v.status !== 0) {
  console.error('✗ validate exited non-zero — NOT shipped. Fix the errors first.');
  run.finish('failed', { gate: 'validate', exit: v.status });
  process.exit(1);
}

// Gate 2: zero source-licence findings for this council.
const report = JSON.parse(readFileSync(join(REPO_ROOT, 'scripts', 'validate', 'reports', 'validation-latest.json'), 'utf-8'));
const licence = (report.findings ?? []).filter(
  (f) => f.validator === 'forbidden-source-scan' && f.council === councilName,
);
if (licence.length > 0) {
  console.error(`✗ ${licence.length} source-licence finding(s) for ${councilName} — NOT shipped:`);
  for (const f of licence) console.error(`    ${f.message}`);
  run.finish('failed', { gate: 'source-licence', findings: licence.length });
  process.exit(1);
}

// Gate 3: screenshot-parity must pass for this council (proves it was
// added to the North-Star lists and carries verbatim-verified evidence).
const sp = spawnSync('node', [join(REPO_ROOT, 'scripts', 'validate', 'screenshot-parity.mjs')], { cwd: REPO_ROOT, encoding: 'utf-8' });
const spLine = (sp.stdout + sp.stderr).split('\n').find((l) => l.includes(` ${councilName}:`));
if (!spLine) {
  console.error(`✗ ${councilName} not in screenshot-parity output — was it added to NORTH_STAR_22 (screenshot-parity.mjs) and STRICT_COUNCILS (tier-classification.mjs) in Phase 7? NOT shipped.`);
  run.finish('failed', { gate: 'screenshot-parity', reason: 'council not in list' });
  process.exit(1);
}
if (!spLine.trimStart().startsWith('✓')) {
  console.error(`✗ screenshot-parity FAILS for ${councilName} — NOT shipped:`);
  console.error(`    ${spLine.trim()}`);
  run.finish('failed', { gate: 'screenshot-parity', line: spLine.trim() });
  process.exit(1);
}

entry.status = 'shipped';
entry.shipped_at = new Date().toISOString().slice(0, 10);
entry.attempts = (entry.attempts ?? 0) + 1;
delete entry.deferred_reason;
save();
console.log(`✓ ${councilName} SHIPPED (gates verified, not asserted). Remaining: ${queueDoc.remaining}`);
run.finish('ok', { marked: 'shipped', gates: ['validate', 'source-licence', 'screenshot-parity'] });
