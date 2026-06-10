#!/usr/bin/env node
/**
 * 03-extract-pdf.mjs — Phase 2 of the per-council research pipeline (PDF half).
 *
 * For every archived PDF in a council's folder, runs pdftotext and
 * LOCATES candidate values for the core field set — with the page
 * number and the verbatim line each candidate came from.
 *
 * It deliberately does NOT decide. Council publications are messy and
 * the judgment calls (General Fund vs Total Usable Reserves, current vs
 * prior-year column, CE salary vs salary band midpoint) are exactly
 * where trust is won or lost — see ROLLOUT-LESSONS §2. The output is a
 * ranked candidate list per field; a human/agent reviews the excerpts,
 * sets `chosen`, and only then does 05-populate write anything.
 *
 * FAIL-LOUD CONTRACT: if ANY archived PDF cannot be text-extracted, the
 * run exits 1 and the phase is marked not-done. A run that silently
 * skipped a document used to look identical to a complete one — that is
 * exactly the class of failure that produces untrustworthy data. The
 * explicit escape hatch is --allow-parse-failures (e.g. for a known
 * scanned-image PDF), which records WHICH documents were skipped in the
 * output and the run journal.
 *
 * Detection logic lives in lib/detectors.mjs (pure, self-tested by
 * pipeline-selftest.mjs — change a regex there and the fixtures must
 * still pass).
 *
 * Output: pdfs/council-pdfs/<slug>/extracted-values.json
 * Journal: scripts/council-research/status/runs.jsonl (every run, append-only)
 *
 * Usage:
 *   node scripts/council-research/03-extract-pdf.mjs --council=Basildon
 *   node scripts/council-research/03-extract-pdf.mjs --council=Basildon --allow-parse-failures
 *
 * Spec: NORTH-STAR.md §6 Phase 2; ROLLOUT-LESSONS §2 (reserves discipline)
 */

import { existsSync, readFileSync, writeFileSync, readdirSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { extractText } from './lib/pdf.mjs';
import { readMeta } from './lib/meta.mjs';
import { DETECTORS, clean } from './lib/detectors.mjs';
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
  console.error('Usage: node 03-extract-pdf.mjs --council=<name> [--allow-parse-failures]');
  process.exit(2);
}

const councilName = String(args.council);
function slugify(n) {
  return n.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}
const slug = slugify(councilName);
const councilDir = join(DATA_DIR, 'pdfs', 'council-pdfs', slug);
const run = startRun('03-extract-pdf', councilName);

// ── Current TS values for side-by-side comparison ────────────────────
function currentValuesFromTs() {
  const TS_FILES = ['county-councils.ts', 'districts.ts', 'metropolitan.ts', 'unitary.ts', 'london-boroughs.ts'];
  for (const f of TS_FILES) {
    const path = join(DATA_DIR, f);
    if (!existsSync(path)) continue;
    const src = readFileSync(path, 'utf8');
    const nameIdx = src.indexOf(`\n    name: "${councilName}",`);
    if (nameIdx === -1) continue;
    const nextIdx = src.indexOf('\n  },\n  {\n    ons_code:', nameIdx);
    const block = src.slice(nameIdx, nextIdx === -1 ? src.length : nextIdx);
    const out = {};
    for (const field of Object.keys(DETECTORS)) {
      const m = block.match(new RegExp(`\\n\\s{6}${field}:\\s*("([^"]*)"|[\\d.]+)`));
      if (m) out[field] = m[2] !== undefined ? m[2] : parseFloat(m[1]);
    }
    return out;
  }
  return {};
}

// ── Main ─────────────────────────────────────────────────────────────
function main() {
  if (!existsSync(councilDir)) {
    console.error(`✗ No archive folder at ${councilDir} — run 01-inventory + 02-archive first.`);
    run.finish('blocked', { reason: 'no archive folder' });
    process.exit(2);
  }

  const metas = readdirSync(councilDir)
    .filter((f) => f.endsWith('_meta.json'))
    .map((f) => ({ metaFile: f, meta: readMeta(join(councilDir, f)) }))
    .filter(({ meta }) => meta?.sha256);

  const pdfs = metas
    .map(({ metaFile, meta }) => {
      const base = metaFile.replace('_meta.json', '');
      const pdfFile = `${base}.pdf`;
      return existsSync(join(councilDir, pdfFile)) ? { pdfFile, meta } : null;
    })
    .filter(Boolean);

  if (pdfs.length === 0) {
    console.error(`✗ No archived PDFs with meta at ${councilDir} — run 02-archive first.`);
    run.finish('blocked', { reason: 'no archived PDFs' });
    process.exit(2);
  }

  console.log(`Extract: ${councilName} — scanning ${pdfs.length} archived PDF(s)`);

  const candidates = {};
  for (const field of Object.keys(DETECTORS)) candidates[field] = [];
  const parseFailures = [];

  for (const { pdfFile, meta } of pdfs) {
    const pdfPath = join(councilDir, pdfFile);
    let fullText;
    try {
      fullText = extractText(pdfPath); // -layout, \f between pages
    } catch (e) {
      console.error(`  ✗ ${pdfFile}: pdftotext FAILED (${e.message})`);
      parseFailures.push({ pdf: pdfFile, error: String(e.message) });
      continue;
    }
    const pages = fullText.split('\f');
    const ctx = { docType: meta.document_type || 'unknown' };

    let hits = 0;
    pages.forEach((pageText, i) => {
      const page = i + 1;
      for (const rawLine of pageText.split('\n')) {
        const line = rawLine.trim();
        if (line.length < 6) continue;
        for (const [field, detect] of Object.entries(DETECTORS)) {
          for (const cand of detect(line, ctx)) {
            candidates[field].push({
              value: cand.value,
              raw: cand.raw,
              page,
              excerpt: clean(rawLine),
              pdf: pdfFile,
              sha256: meta.sha256,
              source_url: meta.source_url,
              document_type: meta.document_type || 'unknown',
              fiscal_year: meta.fiscal_year || 'unknown',
              matched: cand.matched,
              confidence: cand.confidence,
            });
            hits++;
          }
        }
      }
    });
    console.log(`  ✓ ${pdfFile} (${pages.length} pages, ${hits} candidate hits)`);
  }

  // Rank + dedupe per field: highest confidence first, then earliest page;
  // drop exact duplicate (value, page, pdf) triples; cap at 12 per field.
  for (const field of Object.keys(candidates)) {
    const seen = new Set();
    candidates[field] = candidates[field]
      .sort((a, b) => b.confidence - a.confidence || a.page - b.page)
      .filter((c) => {
        const k = `${c.value}|${c.page}|${c.pdf}`;
        if (seen.has(k)) return false;
        seen.add(k);
        return true;
      })
      .slice(0, 12);
  }

  const warnings = [];
  if (parseFailures.length > 0) {
    warnings.push(
      `${parseFailures.length} archived PDF(s) could NOT be text-extracted: ` +
      parseFailures.map((p) => p.pdf).join(', ') +
      ' — their values are NOT in the candidate list. Extract them manually or fix the PDFs.',
    );
  }
  if (candidates.reserves.length > 0) {
    warnings.push(
      'reserves: the rendered field is the GENERAL FUND reserve, NOT Total Usable Reserves. ' +
      'Candidates are labelled — picking the usable-reserves figure is the #1 validator fail (ROLLOUT-LESSONS §2). ' +
      'Cross-check against the GOV.UK RA Part 2 reference before choosing.',
    );
  }
  if (candidates.chief_executive.length > 0) {
    warnings.push('chief_executive: name detection is heuristic — read the excerpt; prefer the pay-policy/SoA officer list over narrative mentions.');
  }
  warnings.push('Every chosen value must be re-read in the excerpt by a human/agent before 05-populate — this file proposes, it never decides.');

  // Preserve a reviewer's existing chosen/warnings notes on re-runs.
  const outPath = join(councilDir, 'extracted-values.json');
  let prior = {};
  if (existsSync(outPath)) { try { prior = JSON.parse(readFileSync(outPath, 'utf8')); } catch {} }

  const out = {
    council: councilName,
    slug,
    generated_at: new Date().toISOString(),
    current_values: currentValuesFromTs(),
    candidates,
    chosen: prior.chosen ?? {},
    parse_failures: parseFailures,
    tier1_references: prior.tier1_references,
    tier1_drift_count: prior.tier1_drift_count,
    warnings,
  };
  writeFileSync(outPath, JSON.stringify(out, null, 2) + '\n');

  // Status + journal
  const totalCands = Object.values(candidates).reduce((n, c) => n + c.length, 0);
  const hardFail = parseFailures.length > 0 && !args['allow-parse-failures'];
  const statusDir = join(REPO_ROOT, 'scripts', 'council-research', 'status');
  mkdirSync(statusDir, { recursive: true });
  const statusPath = join(statusDir, `${slug}.json`);
  let current = {};
  if (existsSync(statusPath)) { try { current = JSON.parse(readFileSync(statusPath, 'utf8')); } catch {} }
  writeFileSync(statusPath, JSON.stringify({
    council: councilName, slug, ...current,
    phases: {
      ...(current.phases || {}),
      phase_2_extract: {
        done: totalCands > 0 && !hardFail,
        at: new Date().toISOString(),
        candidates: totalCands,
        parse_failures: parseFailures.length,
      },
    },
    last_session: new Date().toISOString(),
  }, null, 2) + '\n');

  console.log('');
  console.log(`Extracted candidates → ${outPath}`);
  for (const [field, cands] of Object.entries(candidates)) {
    if (cands.length === 0) continue;
    const top = cands[0];
    console.log(`  ${field}: ${cands.length} candidate(s) — top: ${JSON.stringify(top.value ?? top.raw)} (p${top.page} ${top.pdf}, conf ${top.confidence})`);
  }

  if (hardFail) {
    console.error('');
    console.error(`✗ ${parseFailures.length} PDF(s) failed text extraction — refusing to report success.`);
    console.error('  Fix the documents, or re-run with --allow-parse-failures to explicitly accept the gap');
    console.error('  (the gap is recorded in extracted-values.json `parse_failures` either way).');
    run.finish('failed', { candidates: totalCands, parse_failures: parseFailures });
    process.exit(1);
  }

  console.log('');
  console.log('Next: review excerpts, set `chosen` in extracted-values.json, then:');
  console.log(`  node scripts/council-research/06-audit-evidence.mjs --council="${councilName}"`);
  console.log(`  node scripts/council-research/05-populate.mjs --council="${councilName}"`);
  run.finish('ok', {
    candidates: totalCands,
    pdfs_scanned: pdfs.length,
    parse_failures: parseFailures,
    ...(parseFailures.length > 0 ? { note: 'parse failures explicitly accepted via --allow-parse-failures' } : {}),
  });
}

main();
