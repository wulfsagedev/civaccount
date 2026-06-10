#!/usr/bin/env node
/**
 * 05-populate.mjs — Phase 4 of the per-council research pipeline.
 *
 * Reads extracted-values.json and writes the chosen values into the
 * council's TypeScript data file — scalar + full field_sources entry
 * (url with #page anchor, title, accessed, data_year, tier,
 * extraction_method, sha256_at_access, page, excerpt, page_image_url
 * when the PNG exists).
 *
 * DRY-RUN BY DEFAULT. Prints exactly what would change; nothing is
 * written without --apply. Refuses to act on fields whose candidate
 * wasn't explicitly chosen — extraction proposes, a human/agent
 * decides, this script merely transcribes.
 *
 * FAIL-LOUD CONTRACT:
 *   - refuses to run while extracted-values.json records unresolved
 *     Tier-1 drift (re-run 04-extract-csv after fixing);
 *   - after --apply it RE-READS the file from disk and verifies the
 *     scalar and a complete field_sources entry are actually present
 *     (round-trip check) — a surgery bug exits 1 and tells you to
 *     inspect `git diff`, it can never pass silently;
 *   - every run (dry or applied) is recorded in status/runs.jsonl.
 *
 * Surgery logic lives in lib/populate-logic.mjs (pure, self-tested by
 * pipeline-selftest.mjs).
 *
 * Choosing: edit extracted-values.json
 *   "chosen": {
 *     "chief_executive_salary": 0,            // index into candidates[field]
 *     "reserves": { "index": 2, "value": 8123000 }   // index + value override
 *   }
 *
 * Usage:
 *   node scripts/council-research/05-populate.mjs --council=Basildon           # dry-run
 *   node scripts/council-research/05-populate.mjs --council=Basildon --apply   # write
 *
 * After applying: npm run validate && node scripts/validate/screenshot-parity.mjs
 *
 * Spec: NORTH-STAR.md §6 Phase 4, §4 (field provenance schema)
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import {
  FIELD_KIND,
  esc,
  buildFieldSourceEntry,
  upsertScalar,
  upsertFieldSources,
  verifyBlockContains,
} from './lib/populate-logic.mjs';
import { startRun } from './lib/journal.mjs';
import { classifySourceUrl } from '../validate/lib/source-licence.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..', '..');
const DATA_DIR = join(REPO_ROOT, 'src', 'data', 'councils');

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const m = a.match(/^--([^=]+)(?:=(.*))?$/);
    return m ? [m[1], m[2] ?? true] : [a, true];
  }),
);

if (!args.council) {
  console.error('Usage: node 05-populate.mjs --council=<name> [--apply]');
  process.exit(2);
}

const councilName = String(args.council);
const APPLY = !!args.apply;

function slugify(n) {
  return n.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}
const slug = slugify(councilName);
const councilDir = join(DATA_DIR, 'pdfs', 'council-pdfs', slug);
const run = startRun('05-populate', councilName);

const today = new Date().toISOString().slice(0, 10);

function locateCouncil() {
  const TS_FILES = ['county-councils.ts', 'districts.ts', 'metropolitan.ts', 'unitary.ts', 'london-boroughs.ts'];
  for (const f of TS_FILES) {
    const path = join(DATA_DIR, f);
    if (!existsSync(path)) continue;
    const s = readFileSync(path, 'utf8');
    const nameIdx = s.indexOf(`\n    name: "${councilName}",`);
    if (nameIdx === -1) continue;
    const nextIdx = s.indexOf('\n  },\n  {\n    ons_code:', nameIdx);
    return {
      tsFile: path,
      src: s,
      blockStart: nameIdx,
      blockEnd: nextIdx === -1 ? s.length : nextIdx,
    };
  }
  return null;
}

function main() {
  const evPath = join(councilDir, 'extracted-values.json');
  if (!existsSync(evPath)) {
    console.error(`✗ ${evPath} not found — run 03-extract-pdf first.`);
    run.finish('blocked', { reason: 'no extracted-values.json' });
    process.exit(2);
  }
  const ev = JSON.parse(readFileSync(evPath, 'utf8'));
  const chosen = ev.chosen || {};
  const fields = Object.keys(chosen).filter((f) => FIELD_KIND[f]);

  if (fields.length === 0) {
    console.error('✗ Nothing chosen. Review candidates in extracted-values.json, set `chosen`, re-run.');
    console.error('  (salary_bands has no scalar — populate it by hand if the table is worth shipping.)');
    run.finish('blocked', { reason: 'nothing chosen' });
    process.exit(1);
  }
  if (ev.tier1_drift_count > 0) {
    console.error(`✗ extracted-values.json records ${ev.tier1_drift_count} unresolved Tier-1 drift(s) — run 04-extract-csv and resolve first.`);
    run.finish('blocked', { reason: 'tier1 drift unresolved', drift: ev.tier1_drift_count });
    process.exit(1);
  }

  const loc = locateCouncil();
  if (!loc) {
    console.error(`✗ Council "${councilName}" not found in any data file.`);
    run.finish('failed', { reason: 'council not found in TS' });
    process.exit(2);
  }
  const { tsFile, src, blockStart, blockEnd } = loc;
  let block = src.slice(blockStart, blockEnd);

  const changes = [];
  const skipped = [];
  const applied = []; // [{field, valueText}] for round-trip verification

  if (block.indexOf('detailed: {') === -1) {
    console.error('✗ Council block has no `detailed: {` — populate by hand (unexpected shape).');
    run.finish('failed', { reason: 'no detailed block' });
    process.exit(2);
  }

  for (const field of fields) {
    const choice = chosen[field];
    const index = typeof choice === 'object' ? choice.index : choice;
    const cands = (ev.candidates || {})[field] || [];
    const cand = cands[index];
    if (!cand) {
      skipped.push(`${field}: chosen index ${index} has no candidate`);
      continue;
    }
    const value = typeof choice === 'object' && 'value' in choice ? choice.value : cand.value;
    if (value == null) {
      skipped.push(`${field}: candidate has no scalar value (page-location only)`);
      continue;
    }

    // SOURCE-LICENCE GATE (zero tolerance): refuse to write a citation
    // whose source is not ONS / GOV.UK / a named OGL publisher. This is
    // the last line before the data file — it must hard-fail, not skip.
    const licence = classifySourceUrl(cand.source_url);
    if (!licence.allowed) {
      console.error(`✗ ${field}: SOURCE-LICENCE VIOLATION — refusing to write.`);
      console.error(`    ${cand.source_url}`);
      console.error(`    ${licence.reason}`);
      run.finish('failed', { reason: 'source licence violation', field, url: cand.source_url });
      process.exit(1);
    }

    const kind = FIELD_KIND[field];
    const valueText = kind === 'string' ? `"${esc(value)}"` : String(value);

    // 1. Scalar upsert.
    const s = upsertScalar(block, field, valueText);
    block = s.block;
    changes.push(s.change);

    // 2. field_sources upsert.
    const pngName = `${field}-p${cand.page}.png`;
    const pngOnDisk = existsSync(join(councilDir, 'images', pngName));
    const entry = buildFieldSourceEntry(field, cand, { councilName, slug, pngOnDisk, today });
    if (!pngOnDisk) {
      skipped.push(`${field}: no page-image PNG at images/${pngName} — run 06-audit-evidence first for screenshot evidence (entry written without page_image_url)`);
    }
    if (!APPLY) {
      console.log(`  ── proposed field_sources entry for ${field}: ──`);
      console.log(entry.text.split('\n').map((l) => `  │ ${l}`).join('\n'));
    }
    const fsr = upsertFieldSources(block, field, entry.text);
    block = fsr.block;
    changes.push(fsr.change);

    applied.push({ field, valueText });
  }

  // 3. last_verified bump.
  if (/\n {6}last_verified: "[^"]*",/.test(block)) {
    block = block.replace(/\n {6}last_verified: "[^"]*",/, `\n      last_verified: "${today}",`);
    changes.push(`last_verified → ${today}`);
  }

  // Report
  console.log(`Populate: ${councilName} → ${tsFile.split('/').pop()} ${APPLY ? '(APPLY)' : '(dry-run)'}`);
  console.log('');
  for (const c of changes) console.log(`  ✎ ${c}`);
  for (const s of skipped) console.log(`  ⚠ ${s}`);
  console.log('');

  if (!APPLY) {
    console.log('Dry-run only — nothing written. Re-run with --apply to write, then:');
    console.log('  npm run validate');
    run.finish('ok', { mode: 'dry-run', fields: applied.map((a) => a.field), skipped });
    return;
  }

  writeFileSync(tsFile, src.slice(0, blockStart) + block + src.slice(blockEnd));

  // ── ROUND-TRIP VERIFICATION ─────────────────────────────────────────
  // Re-read the file FROM DISK and prove every applied field is present
  // with the expected value and a complete field_sources entry. A
  // surgery bug must fail here, loudly — never downstream, never silently.
  const reread = readFileSync(tsFile, 'utf8');
  const rNameIdx = reread.indexOf(`\n    name: "${councilName}",`);
  const rNextIdx = reread.indexOf('\n  },\n  {\n    ons_code:', rNameIdx);
  const rBlock = reread.slice(rNameIdx, rNextIdx === -1 ? reread.length : rNextIdx);
  const verifyFailures = [];
  for (const { field, valueText } of applied) {
    const v = verifyBlockContains(rBlock, field, valueText);
    if (!v.ok) verifyFailures.push(`${field}: ${v.reason}`);
  }
  if (verifyFailures.length > 0) {
    console.error('✗ ROUND-TRIP VERIFICATION FAILED — the write did not produce the expected result:');
    for (const f of verifyFailures) console.error(`    ${f}`);
    console.error(`  Inspect with: git -C src/data/councils diff ${tsFile.split('/').pop()}`);
    run.finish('failed', { mode: 'apply', verify_failures: verifyFailures });
    process.exit(1);
  }
  console.log(`✓ Round-trip verified: ${applied.length} field(s) present on re-read with full citations.`);

  // Status + journal
  const statusDir = join(REPO_ROOT, 'scripts', 'council-research', 'status');
  mkdirSync(statusDir, { recursive: true });
  const statusPath = join(statusDir, `${slug}.json`);
  let current = {};
  if (existsSync(statusPath)) { try { current = JSON.parse(readFileSync(statusPath, 'utf8')); } catch {} }
  writeFileSync(statusPath, JSON.stringify({
    council: councilName, slug, ...current,
    phases: { ...(current.phases || {}), phase_4_populate: { done: true, at: new Date().toISOString(), fields: applied.map((a) => a.field) } },
    last_session: new Date().toISOString(),
  }, null, 2) + '\n');

  console.log(`✓ Written. Now run: npm run validate && node scripts/validate/screenshot-parity.mjs`);
  run.finish('ok', { mode: 'apply', fields: applied.map((a) => a.field), skipped, round_trip: 'verified' });
}

main();
