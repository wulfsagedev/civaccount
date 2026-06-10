#!/usr/bin/env node
/**
 * render-csv-evidence.mjs — visual evidence for spreadsheet-sourced stats.
 *
 * PDF-sourced stats get a photograph of the page. Spreadsheet-sourced
 * stats (council tax, budgets, population — the GOV.UK bulk files) had
 * NO visual evidence: there is no "page 93" in a CSV. This closes that
 * gap: for each Tier-1 field, it renders the council's actual row from
 * the archived reference file as a captioned PNG —
 *
 *   ┌──────────────────────────────────────────────┐
 *   │ ons_code   name      …   band_d_2025         │
 *   │ E08000032  Bradford  …   [ 2246 ] ← highlight│
 *   │ GOV.UK Council Tax live tables (Band D)      │
 *   │ file … · fingerprint … · row E08000032       │
 *   └──────────────────────────────────────────────┘
 *
 * Honesty note baked into every caption: this is a RENDERING of the
 * archived file's row (not a photo of a webpage) — reproducible by
 * anyone from the same fingerprinted file. The raw GOV.UK file's own
 * sha256 from source-manifest.json is printed on the image.
 *
 * Output:
 *   pdfs/council-pdfs/<slug>/images/<field_path_underscored>-row.png
 *   src/data/evidence-images.json updated (compact index the popover
 *     uses to know which tier-1 fields have an image)
 *   image-manifest.json regenerated (tamper-evidence fingerprints)
 *
 * Usage:
 *   node scripts/council-research/render-csv-evidence.mjs --council=Bradford
 *
 * Requires puppeteer (already a dependency for fetch-pdf-puppeteer).
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import {
  loadSimpleCsvRaw,
  loadRaRowDisplay,
  manifestFor,
  RA1_COLUMNS,
} from './lib/tier1-refs.mjs';
import { normalizeCouncilName } from '../validate/lib/normalize.mjs';
import { startRun } from './lib/journal.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..', '..');
const DATA_DIR = join(REPO_ROOT, 'src', 'data', 'councils');
const INDEX_PATH = join(REPO_ROOT, 'src', 'data', 'evidence-images.json');

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const m = a.match(/^--([^=]+)(?:=(.*))?$/);
    return m ? [m[1], m[2] ?? true] : [a, true];
  }),
);

if (!args.council) {
  console.error('Usage: node render-csv-evidence.mjs --council=<name>');
  process.exit(2);
}

const councilName = String(args.council);
function slugify(n) {
  return n.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}
const slug = slugify(councilName);
const imagesDir = join(DATA_DIR, 'pdfs', 'council-pdfs', slug, 'images');
const run = startRun('render-csv-evidence', councilName);

/** field path → on-disk/url filename. MUST stay in sync with
 *  tier1EvidenceImage() in src/data/provenance.ts. */
const fileFor = (fieldPath) => `${fieldPath.replace(/\./g, '_')}-row.png`;

function onsAndType() {
  const TS_FILES = ['county-councils.ts', 'districts.ts', 'metropolitan.ts', 'unitary.ts', 'london-boroughs.ts'];
  for (const f of TS_FILES) {
    const path = join(DATA_DIR, f);
    if (!existsSync(path)) continue;
    const src = readFileSync(path, 'utf8');
    const nameIdx = src.indexOf(`\n    name: "${councilName}",`);
    if (nameIdx === -1) continue;
    const open = src.lastIndexOf('{', nameIdx);
    const block = src.slice(open, nameIdx + 400);
    return { ons: block.match(/ons_code: "([^"]+)"/)?.[1] ?? null };
  }
  return { ons: null };
}

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** Build the evidence card HTML for one field. */
function cardHtml({ sourceTitle, fileLine, fingerprintLine, rowLabel, headers, cells, highlightIdx }) {
  const th = headers.map((h) => `<th>${esc(h)}</th>`).join('');
  const td = cells.map((c, i) =>
    `<td class="${i === highlightIdx ? 'hl' : ''}">${esc(c)}</td>`).join('');
  return `<!doctype html><html><head><meta charset="utf-8"><style>
  body { margin: 0; font-family: -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background: #fff; }
  .card { display: inline-block; padding: 20px 24px; }
  table { border-collapse: collapse; }
  th, td { border: 1px solid #c9c9c9; padding: 8px 14px; font-size: 15px; text-align: left; white-space: nowrap; }
  th { background: #f0f0ee; font-weight: 600; font-size: 13px; }
  td.hl { background: #fff7d6; border: 2px solid #b8860b; font-weight: 700; }
  .title { font-size: 16px; font-weight: 700; margin: 0 0 10px; color: #111; }
  .meta { font-size: 12px; color: #444; margin-top: 12px; line-height: 1.6; }
  .meta code { font-family: ui-monospace, Menlo, monospace; font-size: 11.5px; background: #f4f4f2; padding: 1px 4px; }
  </style></head><body><div class="card" id="card">
  <p class="title">${esc(sourceTitle)}</p>
  <table><tr>${th}</tr><tr>${td}</tr></table>
  <p class="meta">${rowLabel}<br>${fileLine}<br>${fingerprintLine}<br>
  Rendered from CivAccount&rsquo;s archived copy of the official file &mdash; anyone can reproduce this row from the same fingerprinted file.</p>
  </div></body></html>`;
}

async function main() {
  const { ons } = onsAndType();
  if (!ons) {
    console.error(`✗ Council "${councilName}" not found / no ONS code.`);
    run.finish('failed', { reason: 'council not found' });
    process.exit(2);
  }

  const jobs = []; // { fieldPath, html }

  // ── Band D (parsed-area-band-d.csv) — one image per year, cell highlighted
  {
    const file = 'parsed-area-band-d.csv';
    const raw = loadSimpleCsvRaw(file);
    const man = manifestFor(file);
    if (raw) {
      const rowIdx = raw.rows.findIndex((r) => (r[0] || '').trim() === ons);
      if (rowIdx !== -1) {
        const row = raw.rows[rowIdx].map((c) => c.trim());
        for (const year of [2021, 2022, 2023, 2024, 2025, 2026]) {
          const col = raw.header.indexOf(`band_d_${year}`);
          if (col === -1 || !row[col]) continue;
          jobs.push({
            fieldPath: `council_tax.band_d_${year}`,
            html: cardHtml({
              sourceTitle: `GOV.UK Council Tax live tables — area Band D (${man?.publisher ?? 'MHCLG'})`,
              fileLine: `File: <code>${esc(man?.raw_file ?? file)}</code> &middot; parsed as <code>${esc(file)}</code>`,
              fingerprintLine: `Official file fingerprint (SHA-256): <code>${esc((man?.raw_file_sha256 ?? '').slice(0, 24))}&hellip;</code>`,
              rowLabel: `Row: <code>${esc(ons)}</code> (${esc(councilName)}) &middot; highlighted column: <code>band_d_${year}</code>`,
              headers: raw.header,
              cells: row,
              highlightIdx: col,
            }),
          });
        }
      }
    }
  }

  // ── Budget categories (RA Part 1, incl. net_current bottom line) —
  //    identity cols + the one column
  {
    const ra = [
      { file: 'RA_Part1_LA_Data.csv', cols: RA1_COLUMNS },
    ];
    for (const { file, cols } of ra) {
      const man = manifestFor(file);
      for (const [header, field] of Object.entries(cols)) {
        const disp = loadRaRowDisplay(file, ons, [header]);
        if (!disp || !disp.cells[0]) continue;
        jobs.push({
          fieldPath: `budget.${field}`,
          html: cardHtml({
            sourceTitle: `GOV.UK Revenue Account (${file.includes('Part1') ? 'RA Part 1' : 'RA Part 2'}) — ${man?.publisher ?? 'MHCLG'}`,
            fileLine: `File: <code>${esc(man?.raw_file ?? file)}</code> &middot; parsed as <code>${esc(file)}</code> &middot; figures in &pound;000s`,
            fingerprintLine: `Official file fingerprint (SHA-256): <code>${esc((man?.raw_file_sha256 ?? '').slice(0, 24))}&hellip;</code>`,
            rowLabel: `Row: <code>${esc(disp.identity.ons_code)}</code> (${esc(disp.identity.authority || councilName)}) &middot; highlighted column: <code>${esc(header)}</code>`,
            headers: ['ONS code', 'Authority', header],
            cells: [disp.identity.ons_code, disp.identity.authority || councilName, disp.cells[0]],
            highlightIdx: 2,
          }),
        });
      }
    }
  }

  // ── Simple name-keyed singles
  {
    const singles = [
      { file: 'parsed-population.csv', fieldPath: 'population', col: 'population', title: 'ONS mid-year population estimates' },
      { file: 'parsed-lgbce-councillors.csv', fieldPath: 'detailed.total_councillors', col: 'total_councillors', title: 'LGBCE electoral data — councillor numbers' },
      { file: 'parsed-capital-expenditure.csv', fieldPath: 'detailed.capital_programme', col: 'capital_expenditure_k', title: 'GOV.UK capital expenditure (COR A1)' },
    ];
    for (const s of singles) {
      const raw = loadSimpleCsvRaw(s.file);
      if (!raw) continue;
      const man = manifestFor(s.file);
      const nameCol = raw.header.indexOf('name');
      const valCol = raw.header.indexOf(s.col);
      if (nameCol === -1 || valCol === -1) continue;
      const target = normalizeCouncilName(councilName);
      const row = raw.rows.find((r) => normalizeCouncilName((r[nameCol] || '').trim()) === target);
      if (!row || !(row[valCol] || '').trim()) continue;
      jobs.push({
        fieldPath: s.fieldPath,
        html: cardHtml({
          sourceTitle: s.title,
          fileLine: `File: <code>${esc(man?.raw_file ?? s.file)}</code> &middot; parsed as <code>${esc(s.file)}</code>`,
          fingerprintLine: `Official file fingerprint (SHA-256): <code>${esc((man?.raw_file_sha256 ?? '').slice(0, 24))}&hellip;</code>`,
          rowLabel: `Row: ${esc((row[nameCol] || '').trim())} &middot; highlighted column: <code>${esc(s.col)}</code>`,
          headers: raw.header,
          cells: row.map((c) => (c || '').trim()),
          highlightIdx: valCol,
        }),
      });
    }
  }

  if (jobs.length === 0) {
    console.error('✗ No tier-1 rows found for this council — nothing to render.');
    run.finish('failed', { reason: 'no tier-1 rows found' });
    process.exit(1);
  }

  console.log(`Rendering ${jobs.length} row-evidence image(s) for ${councilName} (${ons})…`);
  mkdirSync(imagesDir, { recursive: true });

  const puppeteer = (await import('puppeteer')).default;
  const browser = await puppeteer.launch({ headless: 'shell' });
  let rendered = 0;
  let skipped = 0;
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1400, height: 600, deviceScaleFactor: 2 });
    for (const job of jobs) {
      const out = join(imagesDir, fileFor(job.fieldPath));
      if (existsSync(out) && !args.force) { skipped++; continue; }
      await page.setContent(job.html, { waitUntil: 'load' });
      const el = await page.$('#card');
      await el.screenshot({ path: out });
      rendered++;
      console.log(`  ✓ ${fileFor(job.fieldPath)}`);
    }
  } finally {
    await browser.close();
  }

  // ── Update the compact index the popover reads ──────────────────────
  // { "_fields": [vocab…], "<slug>": [indices into vocab] }
  let index = { _fields: [] };
  if (existsSync(INDEX_PATH)) { try { index = JSON.parse(readFileSync(INDEX_PATH, 'utf8')); } catch {} }
  if (!Array.isArray(index._fields)) index._fields = [];
  const slugIdxs = new Set(index[slug] || []);
  for (const job of jobs) {
    let vi = index._fields.indexOf(job.fieldPath);
    if (vi === -1) { index._fields.push(job.fieldPath); vi = index._fields.length - 1; }
    slugIdxs.add(vi);
  }
  index[slug] = [...slugIdxs].sort((a, b) => a - b);
  writeFileSync(INDEX_PATH, JSON.stringify(index) + '\n');
  console.log(`  index: ${INDEX_PATH} — ${index[slug].length} field(s) for ${slug}`);

  // ── Fingerprint the new images ───────────────────────────────────────
  const manifest = spawnSync('node', [join(REPO_ROOT, 'scripts', 'generate-image-manifest.mjs')], { stdio: 'inherit' });
  if (manifest.status !== 0) {
    console.error('✗ image-manifest regeneration failed — images are unfingerprinted.');
    run.finish('failed', { rendered, reason: 'manifest regen failed' });
    process.exit(1);
  }

  console.log(`✓ ${rendered} rendered, ${skipped} already existed. Tier-1 stats for ${councilName} now carry visual evidence.`);
  run.finish('ok', { rendered, skipped, fields: jobs.map((j) => j.fieldPath) });
}

main().catch((e) => { console.error('Fatal:', e); run.finish('crashed', { error: String(e?.stack || e) }); process.exit(2); });
