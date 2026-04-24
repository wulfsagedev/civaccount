#!/usr/bin/env node
/**
 * trigger-wayback-snapshots.mjs — Phase 1 Wayback SavePageNow trigger.
 *
 * For every PDF in the Batch-6/7 archive that was fetched direct_https
 * (not already via Wayback), trigger a SavePageNow snapshot and write
 * the returned wayback_url back into the _meta.json.
 *
 * Idempotent: skips PDFs that already have a wayback_url in meta.
 */

import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { saveNow, getLatestSnapshot } from './lib/wayback.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..', '..');
const PDFS_DIR = join(REPO_ROOT, 'src', 'data', 'councils', 'pdfs', 'council-pdfs');

const BATCH_67_SLUGS = [
  // Batch-6
  'hampshire', 'essex', 'hertfordshire', 'sheffield', 'westminster',
  // Batch-7
  'nottinghamshire', 'staffordshire', 'wiltshire', 'newcastle-upon-tyne', 'croydon',
  // Batch-5 (retroactive)
  'manchester', 'birmingham', 'leeds', 'surrey', 'cornwall',
  // Batch-4-overnight (retroactive)
  'liverpool', 'bristol', 'lancashire', 'tower-hamlets',
];

async function processCouncil(slug) {
  const dir = join(PDFS_DIR, slug);
  if (!existsSync(dir)) return { slug, processed: 0, triggered: 0, skipped: 0, errors: 0 };

  const metaFiles = readdirSync(dir).filter(f => f.endsWith('_meta.json'));
  const results = { slug, processed: 0, triggered: 0, skipped: 0, errors: 0 };

  for (const f of metaFiles) {
    const path = join(dir, f);
    const meta = JSON.parse(readFileSync(path, 'utf8'));
    results.processed++;

    if (meta.wayback_url) {
      console.log(`  · ${slug}/${f} already has wayback_url — skipping`);
      results.skipped++;
      continue;
    }

    if (!meta.source_url) {
      console.log(`  ? ${slug}/${f} has no source_url — skipping`);
      results.skipped++;
      continue;
    }

    // First check if IA already has a snapshot
    const existing = await getLatestSnapshot(meta.source_url);
    if (existing?.waybackUrl) {
      meta.wayback_url = existing.waybackUrl;
      meta.wayback_timestamp = existing.timestamp;
      meta.wayback_method = 'existing_snapshot';
      writeFileSync(path, JSON.stringify(meta, null, 2) + '\n');
      console.log(`  ✓ ${slug}/${f} → ${existing.waybackUrl} (existing)`);
      results.triggered++;
      continue;
    }

    // Trigger new snapshot
    console.log(`  ... ${slug}/${f} triggering SavePageNow`);
    const result = await saveNow(meta.source_url);
    if (result.ok && result.waybackUrl) {
      meta.wayback_url = result.waybackUrl;
      meta.wayback_timestamp = new Date().toISOString().slice(0, 19).replace(/[-:T]/g, '');
      meta.wayback_method = 'savepagenow_sync';
      writeFileSync(path, JSON.stringify(meta, null, 2) + '\n');
      console.log(`  ✓ ${slug}/${f} → ${result.waybackUrl}`);
      results.triggered++;
    } else if (result.ok) {
      meta.wayback_method = 'savepagenow_queued';
      meta.wayback_note = result.error || 'async';
      writeFileSync(path, JSON.stringify(meta, null, 2) + '\n');
      console.log(`  ~ ${slug}/${f} queued (no immediate URL; ${result.error || 'async'})`);
      results.triggered++;
    } else {
      console.log(`  ✗ ${slug}/${f} failed: ${result.error}`);
      results.errors++;
    }

    // Rate limit: 4s between requests per SavePageNow docs
    await new Promise(r => setTimeout(r, 4000));
  }

  return results;
}

const all = [];
for (const slug of BATCH_67_SLUGS) {
  console.log(`\n=== ${slug} ===`);
  const r = await processCouncil(slug);
  all.push(r);
}

console.log('\n=== Summary ===');
let t = 0, s = 0, e = 0, p = 0;
for (const r of all) {
  console.log(`${r.slug}: ${r.processed} metas, ${r.triggered} triggered/existing, ${r.skipped} skipped, ${r.errors} errors`);
  p += r.processed; t += r.triggered; s += r.skipped; e += r.errors;
}
console.log(`\nTotal: ${p} PDFs processed — ${t} wayback URLs recorded, ${s} skipped (already had one), ${e} errors`);
