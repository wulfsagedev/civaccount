#!/usr/bin/env node
/**
 * generate-manifests.mjs — Phase 6 per-council reproducibility manifest.
 *
 * For each Batch-6/7 council, build manifests/<slug>.json from:
 *   - All _meta.json files in pdfs/council-pdfs/<slug>/
 *   - All images in pdfs/council-pdfs/<slug>/images/
 *   - The Phase 1b image spec (for value_verified)
 *   - Inventory.json (for tier-4 live pages + stripped fields)
 */

import { readFileSync, writeFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO = join(__dirname, '..', '..');
const PDFS = join(REPO, 'src', 'data', 'councils', 'pdfs', 'council-pdfs');
const MANIFESTS = join(REPO, 'src', 'data', 'councils', 'manifests');

const BATCH_67 = [
  { name: 'Hampshire', slug: 'hampshire', ons: 'E10000014', type: 'SC' },
  { name: 'Essex', slug: 'essex', ons: 'E10000012', type: 'SC' },
  { name: 'Hertfordshire', slug: 'hertfordshire', ons: 'E10000015', type: 'SC' },
  { name: 'Sheffield', slug: 'sheffield', ons: 'E08000039', type: 'MD' },
  { name: 'Westminster', slug: 'westminster', ons: 'E09000033', type: 'LB' },
  { name: 'Nottinghamshire', slug: 'nottinghamshire', ons: 'E10000024', type: 'SC' },
  { name: 'Staffordshire', slug: 'staffordshire', ons: 'E10000028', type: 'SC' },
  { name: 'Wiltshire', slug: 'wiltshire', ons: 'E06000054', type: 'UA' },
  { name: 'Newcastle upon Tyne', slug: 'newcastle-upon-tyne', ons: 'E08000021', type: 'MD' },
  { name: 'Croydon', slug: 'croydon', ons: 'E09000008', type: 'LB' },
];

const IMAGE_SPEC = JSON.parse(readFileSync(
  join(__dirname, 'specs', 'batch-6-7-images.json'), 'utf8'
));

for (const { name, slug, ons, type } of BATCH_67) {
  const councilDir = join(PDFS, slug);
  if (!existsSync(councilDir)) continue;

  const metaFiles = readdirSync(councilDir).filter(f => f.endsWith('_meta.json'));
  const archivedSources = {};
  for (const f of metaFiles) {
    const meta = JSON.parse(readFileSync(join(councilDir, f), 'utf8'));
    const pdfName = f.replace(/_meta\.json$/, '.pdf');
    archivedSources[pdfName] = {
      sha256: meta.sha256,
      source_url: meta.source_url,
      publisher: meta.publisher,
      document_type: meta.document_type,
      fiscal_year: meta.fiscal_year,
      ...(meta.pages ? { pages: meta.pages } : {}),
      licence: meta.licence || 'Open Government Licence v3.0',
      wayback_url: meta.wayback_url || null,
      wayback_method: meta.wayback_method || null,
      fetch_method: meta.fetch_method || null,
      fetched: (meta.fetched || '').slice(0, 10) || null,
      ...(meta.notes ? { notes: meta.notes } : {}),
    };
  }

  // Page images
  const imagesDir = join(councilDir, 'images');
  const pageImages = {};
  if (existsSync(imagesDir)) {
    for (const img of readdirSync(imagesDir)) {
      if (!img.endsWith('.png')) continue;
      // name pattern: <field>-p<page>.png
      const m = img.match(/^(.+)-p(\d+)\.png$/);
      if (!m) continue;
      const field = m[1];
      const page = parseInt(m[2], 10);
      const specEntry = IMAGE_SPEC.find(s =>
        s.council === name && s.field === field && s.page === page
      );
      pageImages[img] = {
        source_pdf: specEntry?.pdf || 'unknown',
        page,
        field,
        value_verified: specEntry?.value || null,
        file_size_bytes: statSync(join(imagesDir, img)).size,
        dpi: 150,
      };
    }
  }

  // Inventory for tier-4 + stripped
  const inventoryPath = join(councilDir, 'inventory.json');
  let tier4 = [], stripped = [];
  if (existsSync(inventoryPath)) {
    const inv = JSON.parse(readFileSync(inventoryPath, 'utf8'));
    tier4 = (inv.sources || []).filter(s => s.tier_guess === 4).map(s => ({
      field: (s.fields_expected || []).join(', ') || 'meta',
      url: s.url,
      rationale: s.notes || '',
    }));
    stripped = inv.stripped_fields || [];
  }

  const manifest = {
    $schema: 'https://civaccount.co.uk/schemas/manifest-v1.json',
    council: name,
    slug,
    ons_code: ons,
    type,
    generated_at: new Date().toISOString().slice(0, 10),
    methodology_version: 'NORTH-STAR v1.1 strict',
    spec_uri: 'https://github.com/wulfsagedev/civaccount/blob/main/NORTH-STAR.md',
    batch: name === 'Nottinghamshire' || name === 'Staffordshire' || name === 'Wiltshire' || name === 'Newcastle upon Tyne' || name === 'Croydon' ? 'Batch-7 (2026-04-23)' : 'Batch-6 (2026-04-23)',

    archived_sources: archivedSources,
    page_images: pageImages,
    tier_4_live_pages: tier4,
    stripped_fields: stripped,

    reproduce: {
      command: `npm run reproduce -- --council="${name}"`,
      expected: 'exit 0 — all archived sha256s match current files; all field_sources excerpts re-extract to current rendered values',
      scaffolded: true,
      implemented: false,
      note: 'Reproduce script will land in Phase E per ROADMAP.md',
    },
  };

  const out = join(MANIFESTS, `${slug}.json`);
  writeFileSync(out, JSON.stringify(manifest, null, 2) + '\n');
  console.log(`✓ ${out}`);
}

console.log('\nDone.');
