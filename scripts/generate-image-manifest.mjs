#!/usr/bin/env node
/**
 * generate-image-manifest.mjs — content-fingerprint every evidence screenshot.
 *
 * The page_image_url PNGs are the visual proof a reader sees when they tap
 * "See the original page". They are served by /archive/<slug>/images/<file>
 * with a 1-year immutable cache — but the filenames are NOT content-addressed
 * (field-p93.png), so until now a silently replaced PNG was undetectable.
 *
 * This script walks src/data/councils/pdfs/council-pdfs/<slug>/images/*.png
 * and writes src/data/councils/image-manifest.json:
 *
 *   { "<slug>/images/<file>.png": { "sha256": "…", "bytes": 12345 }, … }
 *
 * The manifest lives in the PRIVATE data repo (it versions together with the
 * images). scripts/validate/screenshot-parity.mjs re-hashes every cited PNG
 * against it on each run — any post-capture edit to an evidence image fails
 * CI. Re-run this script whenever new screenshots are added:
 *
 *   npm run generate:image-manifest
 */

import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const PDF_DIR = join(ROOT, 'src', 'data', 'councils', 'pdfs', 'council-pdfs');
const OUT = join(ROOT, 'src', 'data', 'councils', 'image-manifest.json');

if (!existsSync(PDF_DIR)) {
  console.log('image-manifest: private data repo not present — skipped');
  process.exit(0);
}

const manifest = {};
let count = 0;

for (const slug of readdirSync(PDF_DIR).sort()) {
  const imagesDir = join(PDF_DIR, slug, 'images');
  if (!existsSync(imagesDir) || !statSync(imagesDir).isDirectory()) continue;
  for (const file of readdirSync(imagesDir).sort()) {
    if (!file.endsWith('.png')) continue;
    const path = join(imagesDir, file);
    const body = readFileSync(path);
    manifest[`${slug}/images/${file}`] = {
      sha256: createHash('sha256').update(body).digest('hex'),
      bytes: body.length,
    };
    count++;
  }
}

writeFileSync(OUT, JSON.stringify(manifest, null, 2) + '\n');
console.log(`image-manifest: fingerprinted ${count} evidence screenshots → ${OUT}`);
