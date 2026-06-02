#!/usr/bin/env node
/**
 * lock-council.mjs — freeze a council's proven state into an immutability lock.
 *
 * The lock is a cryptographic fingerprint of EVERYTHING that makes a council's
 * data true: every rendered value, the sha256 of every source archive, every
 * verbatim excerpt, the sha256 of every screenshot, and the proof verdict per
 * field. It is the "absolute" reference — once a council is locked, ANY later
 * change to a value, source file, excerpt, or screenshot changes the lock hash,
 * and `verify-council-lock.mjs` fails. That is immutability: proven facts can be
 * added (a new year), but a frozen proven fact cannot be silently altered.
 *
 * Usage:
 *   node scripts/validate/lock-council.mjs Bradford          # write the lock
 *   node scripts/validate/lock-council.mjs Bradford --print  # print, don't write
 *
 * Output: scripts/validate/locks/<slug>.lock.json
 *
 * Refuses to lock a council that is not FULLY-COVERED (you cannot freeze an
 * unproven state — that would enshrine a hole).
 */

import { execSync } from 'child_process';
import { readFileSync, writeFileSync, existsSync, mkdirSync, statSync } from 'fs';
import { createHash } from 'crypto';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { loadCouncils } from './load-councils.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO = join(__dirname, '..', '..');
const PDFS = join(REPO, 'src', 'data', 'councils', 'pdfs', 'council-pdfs');
const LOCKS = join(__dirname, 'locks');

const name = process.argv[2];
const printOnly = process.argv.includes('--print');
const outArg = (process.argv.find(a => a.startsWith('--out=')) || '').split('=')[1] || null;
if (!name) { console.error('usage: node lock-council.mjs <CouncilName> [--print] [--out=<path>]'); process.exit(1); }

function slugify(n) { return n.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); }
function sha256(buf) { return createHash('sha256').update(buf).digest('hex'); }
function sha256str(s) { return createHash('sha256').update(s, 'utf8').digest('hex'); }

// Pull the proof engine's structured verdict for this council.
function getProof(council) {
  const raw = execSync(`node "${join(__dirname, 'proof.mjs')}" --council="${council}" --json 2>/dev/null`, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  return JSON.parse(raw).councils[0];
}

const slug = slugify(name);
const council = loadCouncils().find(c => c.name.toLowerCase() === name.toLowerCase());
if (!council) { console.error(`no council "${name}"`); process.exit(1); }

const proof = getProof(name);
if (!proof.fully_covered) {
  console.error(`✗ ${name} is NOT fully-covered — cannot lock an unproven state.`);
  console.error(`  Run: node scripts/validate/proof.mjs --council="${name}"  and close the holes first.`);
  process.exit(1);
}

const fs = council.detailed?.field_sources || {};
const imgDir = join(PDFS, slug, 'images');

// Build a per-field fingerprint. Each entry pins the value + every piece of
// evidence by hash, so changing any of them changes the lock.
const fields = [];
for (const [field, e] of Object.entries(fs)) {
  const rec = {
    field,
    rendered_value: council.detailed?.[field] ?? null,
    tier: e.tier ?? null,
    data_year: e.data_year ?? null,
    extraction_method: e.extraction_method ?? null,
    source_url: e.url ?? null,
    archive_sha256: e.sha256_at_access ?? null,   // the source document fingerprint (② tamper)
    excerpt_sha256: e.excerpt ? sha256str(e.excerpt) : null, // the verbatim claim (③ align)
    page: e.page ?? null,
    page_image_url: e.page_image_url ?? null,
  };
  // Screenshot fingerprint (⑥): hash the actual PNG bytes on disk.
  if (e.page_image_url) {
    const png = join(REPO, 'src', 'data', 'councils', 'pdfs', 'council-pdfs', e.page_image_url.replace(/^\/archive\//, ''));
    rec.screenshot_sha256 = existsSync(png) && statSync(png).isFile() ? sha256(readFileSync(png)) : null;
  }
  // The proof verdict for this field (from the engine).
  const v = proof.tier3.entries.find(x => x.field === field);
  rec.verdict = v ? v.verdict : 'UNKNOWN';
  fields.push(rec);
}
fields.sort((a, b) => a.field.localeCompare(b.field));

// Council tax Band D (Tier-1) — pin every rendered year.
const bandD = {};
for (const y of ['band_d_2021', 'band_d_2022', 'band_d_2023', 'band_d_2024', 'band_d_2025', 'band_d_2026']) {
  if (council.council_tax?.[y] != null) bandD[y] = council.council_tax[y];
}

const body = {
  council: council.name,
  ons_code: council.ons_code,
  type: council.type,
  slug,
  fully_covered: proof.fully_covered,
  tier1_band_d: bandD,
  tier1_summary: { checked: proof.tier1.checked, exact: proof.tier1.exact, failed: proof.tier1.failed },
  coverage: proof.coverage,
  fields,
};

// The lock hash = sha256 of the canonical JSON body. THIS is the immutability anchor.
const lockHash = sha256str(JSON.stringify(body));
const lock = { lock_version: 1, lock_sha256: lockHash, ...body };

// --out=<path>: write the freshly-derived lock JSON to a file (no stdout pipe →
// avoids the 8KB pipe-buffer truncation that nested execSync hits). Used by
// verify-council-lock.mjs to re-derive without capturing megabytes over a pipe.
if (outArg) {
  writeFileSync(outArg, JSON.stringify(lock, null, 2));
  process.exit(0);
}

if (printOnly) {
  console.log(JSON.stringify(lock, null, 2));
  process.exit(0);
}

if (!existsSync(LOCKS)) mkdirSync(LOCKS, { recursive: true });
const out = join(LOCKS, `${slug}.lock.json`);
writeFileSync(out, JSON.stringify(lock, null, 2) + '\n');
console.log(`🔒 Locked ${council.name}: ${fields.length} fields + ${Object.keys(bandD).length} Band D years`);
console.log(`   lock_sha256: ${lockHash}`);
console.log(`   → ${out.replace(REPO + '/', '')}`);
console.log(`   Verify anytime: node scripts/validate/verify-council-lock.mjs ${council.name}`);
