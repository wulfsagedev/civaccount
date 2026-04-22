#!/usr/bin/env node
/**
 * render-page-images.mjs — Generate per-field page-render PNGs.
 *
 * Spec: NORTH-STAR.md §6 Phase 1b (visual evidence), §8 (presentation)
 *
 * For each (field, pdf, page) in the render spec, produces a PNG at
 *   src/data/councils/pdfs/council-pdfs/<slug>/images/<field>-p<page>.png
 *
 * The PNG is then referenced from Council.detailed.field_sources[k].page_image_url
 * so the SourceAnnotation popover can show it inline.
 *
 * Idempotent: skips rendering if the target PNG already exists with a
 * reasonable file size (> 10 KB).
 *
 * Input: --spec=<json-path>  or  --council=<name> + defaults
 *   spec format: [ { field, pdf, page } ]
 *
 * Output: PNGs under images/ + optional status-file update
 *
 * Usage:
 *   node scripts/council-research/render-page-images.mjs \
 *     --spec=scripts/council-research/specs/bradford-images.json
 */

import { existsSync, mkdirSync, readFileSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { renderPage } from './lib/pdf.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..', '..');

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const m = a.match(/^--([^=]+)(?:=(.*))?$/);
    return m ? [m[1], m[2] ?? true] : [a, true];
  }),
);

if (!args.spec && !args.council) {
  console.error('Usage: node render-page-images.mjs --spec=<path> OR --council=<name>');
  process.exit(2);
}

function slugify(n) {
  return n.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

const spec = args.spec
  ? JSON.parse(readFileSync(args.spec, 'utf8'))
  : null;

if (!spec) {
  console.error(`No spec file provided. Create one at scripts/council-research/specs/<slug>-images.json`);
  console.error(`Expected: [ { "field": "chief_executive_salary", "pdf": "pay-policy-2025-26.pdf", "page": 11, "council": "Bradford" }, ... ]`);
  process.exit(2);
}

const results = [];
for (const item of spec) {
  const { field, pdf, page, council } = item;
  const slug = slugify(council);
  const councilDir = join(REPO_ROOT, 'src', 'data', 'councils', 'pdfs', 'council-pdfs', slug);
  const pdfPath = join(councilDir, pdf);
  const imagesDir = join(councilDir, 'images');
  mkdirSync(imagesDir, { recursive: true });

  const outName = `${field}-p${page}.png`;
  const outPath = join(imagesDir, outName);

  // Idempotency: skip if already rendered and > 10 KB
  if (existsSync(outPath) && statSync(outPath).size > 10_000) {
    console.log(`  · ${slug}/${outName} (skipped — already rendered)`);
    results.push({ ...item, outPath, status: 'skipped' });
    continue;
  }

  if (!existsSync(pdfPath)) {
    console.error(`  ✗ ${slug}/${pdf} not found — cannot render`);
    results.push({ ...item, status: 'pdf_missing' });
    continue;
  }

  try {
    const rendered = renderPage(pdfPath, page, imagesDir, {
      dpi: 150,
      filenamePrefix: field,
    });
    // renderPage emits field-p<page>-<page>.png; we want field-p<page>.png
    // Let's normalise by renaming if needed.
    if (rendered !== outPath) {
      const fs = await import('node:fs');
      fs.renameSync(rendered, outPath);
    }
    const size = statSync(outPath).size;
    console.log(`  ✓ ${slug}/${outName} (${(size / 1024).toFixed(0)} KB)`);
    results.push({ ...item, outPath, status: 'ok', size });
  } catch (e) {
    console.error(`  ✗ ${slug}/${outName}: ${e.message}`);
    results.push({ ...item, status: 'error', error: e.message });
  }
}

const ok = results.filter((r) => r.status === 'ok').length;
const skipped = results.filter((r) => r.status === 'skipped').length;
const failed = results.filter((r) => r.status !== 'ok' && r.status !== 'skipped').length;
console.log('');
console.log(`Summary: ${ok} rendered · ${skipped} skipped · ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
