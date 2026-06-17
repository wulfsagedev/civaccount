#!/usr/bin/env node
/**
 * 06-audit-evidence.mjs — Phase 1b/5d evidence glue, one command.
 *
 * From the CHOSEN entries in extracted-values.json:
 *   1. Writes/merges the render spec at specs/<slug>-images.json
 *   2. Runs render-page-images.mjs (PNG per field at images/<field>-p<N>.png)
 *   3. Regenerates image-manifest.json (tamper-evidence fingerprints —
 *      screenshot-parity.mjs re-hashes every PNG against it in CI)
 *   4. Triggers Wayback snapshots for the cited source URLs (best-effort)
 *
 * Run AFTER choosing candidates (03 → review → 06 → 05), so 05-populate
 * finds the PNGs on disk and writes page_image_url into field_sources.
 *
 * Usage:
 *   node scripts/council-research/06-audit-evidence.mjs --council=Basildon
 *   node scripts/council-research/06-audit-evidence.mjs --council=Basildon --skip-wayback
 *
 * Spec: NORTH-STAR.md §6 Phase 1b + §8; COUNCIL-ROLLOUT-PLAYBOOK Phase 5d
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { ensureSnapshot } from './lib/wayback.mjs';
import { startRun } from './lib/journal.mjs';

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
  console.error('Usage: node 06-audit-evidence.mjs --council=<name> [--skip-wayback]');
  process.exit(2);
}

const councilName = String(args.council);
function slugify(n) {
  return n.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}
const slug = slugify(councilName);
const councilDir = join(DATA_DIR, 'pdfs', 'council-pdfs', slug);

const run = startRun('06-audit-evidence', councilName);

async function main() {
  const evPath = join(councilDir, 'extracted-values.json');
  if (!existsSync(evPath)) {
    console.error(`✗ ${evPath} not found — run 03-extract-pdf and choose candidates first.`);
    run.finish('blocked', { reason: 'no extracted-values.json' });
    process.exit(2);
  }
  const ev = JSON.parse(readFileSync(evPath, 'utf8'));
  const chosen = ev.chosen || {};
  const fields = Object.keys(chosen);
  if (fields.length === 0) {
    console.error('✗ No `chosen` entries in extracted-values.json — review candidates first.');
    run.finish('blocked', { reason: 'nothing chosen' });
    process.exit(1);
  }

  // 1. Build the render spec from chosen candidates with a page.
  const specItems = [];
  const sourceUrls = new Set();
  for (const field of fields) {
    const choice = chosen[field];
    const index = typeof choice === 'object' ? choice.index : choice;
    const cand = (ev.candidates || {})[field]?.[index];
    if (!cand || !cand.page || !cand.pdf) continue;
    specItems.push({
      council: councilName,
      field,
      pdf: cand.pdf,
      page: cand.page,
      value: String(cand.value ?? cand.raw ?? ''),
    });
    if (cand.source_url) sourceUrls.add(cand.source_url.split('#')[0]);
  }
  if (specItems.length === 0) {
    console.error('✗ No chosen candidate has a (pdf, page) — nothing to render.');
    process.exit(1);
  }

  const specsDir = join(REPO_ROOT, 'scripts', 'council-research', 'specs');
  mkdirSync(specsDir, { recursive: true });
  const specPath = join(specsDir, `${slug}-images.json`);
  // Merge with an existing spec: keep prior entries for fields not
  // re-chosen this run (idempotent re-runs, accumulating evidence).
  let spec = [];
  if (existsSync(specPath)) {
    try { spec = JSON.parse(readFileSync(specPath, 'utf8')); } catch {}
  }
  const byField = new Map(spec.map((s) => [s.field, s]));
  for (const item of specItems) byField.set(item.field, item);
  spec = [...byField.values()];
  writeFileSync(specPath, JSON.stringify(spec, null, 2) + '\n');
  console.log(`Spec: ${specPath} (${spec.length} entr${spec.length === 1 ? 'y' : 'ies'})`);

  // 2. Render PNGs.
  const render = spawnSync('node', [join(__dirname, 'render-page-images.mjs'), `--spec=${specPath}`], {
    stdio: 'inherit',
  });
  if (render.status !== 0) {
    console.error('✗ render-page-images failed — fix and re-run.');
    run.finish('failed', { reason: 'render-page-images failed', spec: specPath });
    process.exit(1);
  }

  // 3. Regenerate the evidence-image fingerprint manifest.
  const manifest = spawnSync('node', [join(REPO_ROOT, 'scripts', 'generate-image-manifest.mjs')], {
    stdio: 'inherit',
  });
  if (manifest.status !== 0) {
    console.error('✗ generate-image-manifest failed — evidence PNGs are unfingerprinted; fix before shipping.');
    run.finish('failed', { reason: 'image-manifest regeneration failed' });
    process.exit(1);
  }

  // 4. Wayback snapshots for cited sources (best-effort, never blocks).
  if (!args['skip-wayback']) {
    for (const url of sourceUrls) {
      const wb = await ensureSnapshot(url);
      console.log(`  ${wb ? '✓' : '·'} wayback ${url}${wb ? '' : ' (snapshot not confirmed — monthly job will retry)'}`);
    }
  }

  // Status
  const statusDir = join(REPO_ROOT, 'scripts', 'council-research', 'status');
  mkdirSync(statusDir, { recursive: true });
  const statusPath = join(statusDir, `${slug}.json`);
  let current = {};
  if (existsSync(statusPath)) { try { current = JSON.parse(readFileSync(statusPath, 'utf8')); } catch {} }
  writeFileSync(statusPath, JSON.stringify({
    council: councilName, slug, ...current,
    phases: { ...(current.phases || {}), phase_1b_page_images: { done: true, at: new Date().toISOString(), images: spec.length } },
    last_session: new Date().toISOString(),
  }, null, 2) + '\n');

  console.log('');
  console.log(`✓ Evidence ready. Next: node scripts/council-research/05-populate.mjs --council="${councilName}"`);
  run.finish('ok', { images: spec.length, wayback_attempted: args['skip-wayback'] ? 0 : sourceUrls.size });
}

main().catch((e) => { console.error('Fatal:', e); run.finish('crashed', { error: String(e?.stack || e) }); process.exit(2); });
