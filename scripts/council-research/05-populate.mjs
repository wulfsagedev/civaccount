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
 * decides, this script merely transcribes. That's the whole reason it
 * can be trusted to touch districts.ts.
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

const TITLE_LABEL = {
  'statement-of-accounts': 'Statement of Accounts',
  'pay-policy': 'Pay Policy Statement',
  'councillor-allowances': "Members' Allowances Scheme",
  'councillors-earnings': "Members' Allowances Scheme",
  mtfs: 'Medium Term Financial Strategy',
  'budget-book': 'Budget Book',
  budget: 'Budget',
  unknown: 'Council publication',
};

// Scalar type per field — numbers are written bare, strings quoted.
const FIELD_KIND = {
  chief_executive: 'string',
  chief_executive_salary: 'number',
  councillor_basic_allowance: 'number',
  total_allowances_cost: 'number',
  reserves: 'number',
  budget_gap: 'number',
  savings_target: 'number',
};

const today = new Date().toISOString().slice(0, 10);

const esc = (s) => String(s).replace(/\\/g, '\\\\').replace(/"/g, '\\"');

/** "…/Basildon_Draft_Annual_Financial_Report_2024_25_v3.pdf" →
 *  "Basildon Draft Annual Financial Report 2024 25" — used when the
 *  archived meta carries no recognised document_type. */
function titleFromUrl(url) {
  try {
    const seg = decodeURIComponent(new URL(url).pathname.split('/').filter(Boolean).pop() || '');
    return seg
      .replace(/\.[a-z0-9]+$/i, '')
      .replace(/_v\d+$/i, '')
      .replace(/[_-]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  } catch {
    return '';
  }
}

function buildFieldSourceEntry(field, cand) {
  const isPdf = /\.pdf(\?|$)/i.test(cand.source_url) || true; // archived docs are PDFs here
  const url = cand.source_url.includes('#') || !cand.page || !isPdf
    ? cand.source_url
    : `${cand.source_url}#page=${cand.page}`;
  const label = TITLE_LABEL[cand.document_type];
  const fromUrl = label ? null : titleFromUrl(cand.source_url);
  const title = fromUrl && fromUrl.length >= 12
    ? fromUrl
    : `${councilName} ${label || TITLE_LABEL.unknown}${cand.fiscal_year && cand.fiscal_year !== 'unknown' ? ` ${cand.fiscal_year}` : ''}`;
  const pngName = `${field}-p${cand.page}.png`;
  const pngOnDisk = existsSync(join(councilDir, 'images', pngName));

  const lines = [
    `        ${field}: {`,
    `          url: "${esc(url)}",`,
    `          title: "${esc(title)}",`,
    `          accessed: "${today}",`,
    `          data_year: "${esc(cand.fiscal_year || 'unknown')}",`,
    `          tier: 3,`,
    `          extraction_method: "pdf_page",`,
    `          sha256_at_access: "${cand.sha256}",`,
  ];
  if (cand.page) lines.push(`          page: ${cand.page},`);
  if (cand.excerpt) lines.push(`          excerpt: "${esc(cand.excerpt)}",`);
  if (pngOnDisk) lines.push(`          page_image_url: "/archive/${slug}/images/${pngName}",`);
  lines.push('        },');
  return { text: lines.join('\n'), pngOnDisk, pngName };
}

// ── TS surgery helpers ───────────────────────────────────────────────
function braceMatch(src, openIdx) {
  let depth = 0;
  for (let i = openIdx; i < src.length; i++) {
    if (src[i] === '{') depth++;
    else if (src[i] === '}') { depth--; if (depth === 0) return i; }
  }
  return -1;
}

function main() {
  const evPath = join(councilDir, 'extracted-values.json');
  if (!existsSync(evPath)) {
    console.error(`✗ ${evPath} not found — run 03-extract-pdf first.`);
    process.exit(2);
  }
  const ev = JSON.parse(readFileSync(evPath, 'utf8'));
  const chosen = ev.chosen || {};
  const fields = Object.keys(chosen).filter((f) => FIELD_KIND[f]);

  if (fields.length === 0) {
    console.error('✗ Nothing chosen. Review candidates in extracted-values.json, set `chosen`, re-run.');
    console.error('  (salary_bands has no scalar — populate it by hand if the table is worth shipping.)');
    process.exit(1);
  }
  if (ev.tier1_drift_count > 0) {
    console.error(`✗ extracted-values.json records ${ev.tier1_drift_count} unresolved Tier-1 drift(s) — run 04-extract-csv and resolve first.`);
    process.exit(1);
  }

  // Locate the council in its TS file.
  const TS_FILES = ['county-councils.ts', 'districts.ts', 'metropolitan.ts', 'unitary.ts', 'london-boroughs.ts'];
  let tsFile = null, src = null, blockStart = -1, blockEnd = -1;
  for (const f of TS_FILES) {
    const path = join(DATA_DIR, f);
    if (!existsSync(path)) continue;
    const s = readFileSync(path, 'utf8');
    const nameIdx = s.indexOf(`\n    name: "${councilName}",`);
    if (nameIdx === -1) continue;
    tsFile = path;
    src = s;
    blockStart = nameIdx;
    const nextIdx = s.indexOf('\n  },\n  {\n    ons_code:', nameIdx);
    blockEnd = nextIdx === -1 ? s.length : nextIdx;
    break;
  }
  if (!tsFile) {
    console.error(`✗ Council "${councilName}" not found in any data file.`);
    process.exit(2);
  }

  let block = src.slice(blockStart, blockEnd);
  const changes = [];
  const skipped = [];

  // Bounds of detailed: { ... } within the block.
  const detailedIdx = block.indexOf('detailed: {');
  if (detailedIdx === -1) {
    console.error('✗ Council block has no `detailed: {` — populate by hand (unexpected shape).');
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

    const kind = FIELD_KIND[field];
    const valueText = kind === 'string' ? `"${esc(value)}"` : String(value);

    // 1. Scalar upsert (6-space indent inside detailed).
    const scalarRe = new RegExp(`(\\n {6}${field}: )("[^"]*"|-?[\\d.]+)(,)`);
    const scalarMatch = block.match(scalarRe);
    if (scalarMatch) {
      if (scalarMatch[2] !== valueText) {
        block = block.replace(scalarRe, `$1${valueText}$3`);
        changes.push(`${field}: ${scalarMatch[2]} → ${valueText}`);
      } else {
        changes.push(`${field}: unchanged (${valueText}) — citation refreshed`);
      }
    } else {
      // Insert scalar right after `detailed: {`.
      block = block.replace('detailed: {', `detailed: {\n      ${field}: ${valueText},`);
      changes.push(`${field}: (new) ${valueText}`);
    }

    // 2. field_sources upsert.
    const entry = buildFieldSourceEntry(field, cand);
    if (!APPLY) {
      console.log(`  ── proposed field_sources entry for ${field}: ──`);
      console.log(entry.text.split('\n').map((l) => `  │ ${l}`).join('\n'));
    }
    if (!entry.pngOnDisk) {
      skipped.push(`${field}: no page-image PNG at images/${entry.pngName} — run 06-audit-evidence first for screenshot evidence (entry written without page_image_url)`);
    }
    const fsIdx = block.indexOf('field_sources: {');
    if (fsIdx === -1) {
      // No field_sources map yet — create one at the end of detailed,
      // just before last_verified if present.
      const insertion = `field_sources: {\n${entry.text}\n      },\n      `;
      if (block.includes('\n      last_verified:')) {
        block = block.replace(/\n {6}last_verified:/, `\n      ${insertion.trimEnd()}\n      last_verified:`);
      } else {
        // Append before detailed's closing brace.
        const dIdx = block.indexOf('detailed: {');
        const dEnd = braceMatch(block, block.indexOf('{', dIdx));
        block = `${block.slice(0, dEnd)}  ${insertion.trimEnd()}\n    ${block.slice(dEnd)}`;
      }
      changes.push(`${field}: field_sources map created with entry`);
    } else {
      const keyRe = new RegExp(`\\n {8}${field}: \\{`);
      const keyMatch = block.slice(fsIdx).match(keyRe);
      if (keyMatch) {
        // Replace the existing entry block.
        const keyStart = fsIdx + keyMatch.index + 1; // skip leading \n
        const openBrace = block.indexOf('{', keyStart);
        const closeBrace = braceMatch(block, openBrace);
        // Entry ends after the trailing comma if present.
        const after = block[closeBrace + 1] === ',' ? closeBrace + 2 : closeBrace + 1;
        block = `${block.slice(0, keyStart)}${entry.text.trimStart()}${block.slice(after)}`;
        changes.push(`${field}: field_sources entry replaced`);
      } else {
        // Insert as the first entry in the map.
        block = block.replace('field_sources: {', `field_sources: {\n${entry.text}`);
        changes.push(`${field}: field_sources entry added`);
      }
    }
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
    return;
  }

  writeFileSync(tsFile, src.slice(0, blockStart) + block + src.slice(blockEnd));

  // Status
  const statusDir = join(REPO_ROOT, 'scripts', 'council-research', 'status');
  mkdirSync(statusDir, { recursive: true });
  const statusPath = join(statusDir, `${slug}.json`);
  let current = {};
  if (existsSync(statusPath)) { try { current = JSON.parse(readFileSync(statusPath, 'utf8')); } catch {} }
  writeFileSync(statusPath, JSON.stringify({
    council: councilName, slug, ...current,
    phases: { ...(current.phases || {}), phase_4_populate: { done: true, at: new Date().toISOString(), fields: fields.length } },
    last_session: new Date().toISOString(),
  }, null, 2) + '\n');

  console.log(`✓ Written. Now run: npm run validate && node scripts/validate/screenshot-parity.mjs`);
}

main();
