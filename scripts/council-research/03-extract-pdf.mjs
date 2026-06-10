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
 * Detected fields:
 *   chief_executive_salary, chief_executive, councillor_basic_allowance,
 *   total_allowances_cost, reserves (with the GF-vs-usable trap labelled),
 *   budget_gap, savings_target, salary_bands (page locations only)
 *
 * Output: pdfs/council-pdfs/<slug>/extracted-values.json
 *   {
 *     council, slug, generated_at,
 *     current_values: { ... },          // what the TS holds today
 *     candidates: { field: [ {value, raw, page, excerpt, pdf, sha256,
 *                              source_url, document_type, fiscal_year,
 *                              confidence, matched} ] },
 *     chosen: {},                        // ← reviewer fills: field → index
 *     warnings: [ ... ]                  // judgment traps to read first
 *   }
 *
 * After review:  node 06-audit-evidence.mjs --council=X   (render PNGs)
 *                node 05-populate.mjs --council=X         (dry-run diff)
 *
 * Usage:
 *   node scripts/council-research/03-extract-pdf.mjs --council=Basildon
 *
 * Spec: NORTH-STAR.md §6 Phase 2; ROLLOUT-LESSONS §2 (reserves discipline)
 */

import { existsSync, readFileSync, writeFileSync, readdirSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { extractText } from './lib/pdf.mjs';
import { readMeta } from './lib/meta.mjs';

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
  console.error('Usage: node 03-extract-pdf.mjs --council=<name>');
  process.exit(2);
}

const councilName = String(args.council);
function slugify(n) {
  return n.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}
const slug = slugify(councilName);
const councilDir = join(DATA_DIR, 'pdfs', 'council-pdfs', slug);

// ── Amount parsing ───────────────────────────────────────────────────
// "£141,324" / "141,324" / "£1.2m" / "£950k" / "£1,234,567"
function parseAmounts(line) {
  const out = [];
  for (const m of line.matchAll(/£?\s?(\d{1,3}(?:,\d{3})+|\d+(?:\.\d+)?\s?[km])\b/gi)) {
    const raw = m[1];
    let value;
    if (/[km]$/i.test(raw.replace(/\s/g, ''))) {
      const n = parseFloat(raw);
      value = /m$/i.test(raw.replace(/\s/g, '')) ? n * 1_000_000 : n * 1_000;
    } else {
      value = parseInt(raw.replace(/,/g, ''), 10);
    }
    if (!isNaN(value)) out.push({ value, raw: m[0].trim() });
  }
  return out;
}

const clean = (s) => s.replace(/\s+/g, ' ').trim().slice(0, 180);

// ── Field detectors ──────────────────────────────────────────────────
// Each takes (line, context) → array of {value, raw, matched, confidence}.
// `context.docType` boosts confidence when the document type is the
// canonical home for that field.
const DETECTORS = {
  chief_executive_salary(line, ctx) {
    if (!/chief\s+executive/i.test(line)) return [];
    return parseAmounts(line)
      .filter((a) => a.value >= 80_000 && a.value <= 350_000)
      .map((a) => ({
        ...a,
        matched: 'chief executive + salary-range amount',
        confidence: ctx.docType === 'pay-policy' || ctx.docType === 'statement-of-accounts' ? 0.85 : 0.5,
      }));
  },

  chief_executive(line) {
    if (!/chief\s+executive/i.test(line)) return [];
    const m =
      line.match(/((?:Dr|Mr|Mrs|Ms|Miss|Professor)\.?\s+)?([A-Z][a-z]+(?:\s+[A-Z][a-zA-Z'\-]+){1,3})\s*[,–—\-|(]?\s*Chief\s+Executive/) ||
      line.match(/Chief\s+Executive\s*[,:–—\-|)]?\s*((?:Dr|Mr|Mrs|Ms|Miss|Professor)\.?\s+)?([A-Z][a-z]+(?:\s+[A-Z][a-zA-Z'\-]+){1,3})/);
    if (!m) return [];
    let name = `${(m[1] || '').trim()} ${m[2].trim()}`.trim();
    // Remuneration tables append column words to the name — strip them.
    name = name.replace(/\s+(?:From|To|Note|Notes|Salary|Total|Left|Joined)$/i, '');
    // Filter obvious non-names that satisfy the capitalised pattern.
    if (/Officer|Council|Director|Statement|Accounts|Executive|Remuneration|Salary|Pension/i.test(name)) return [];
    return [{ value: name, raw: name, matched: 'name adjacent to "Chief Executive"', confidence: 0.5 }];
  },

  councillor_basic_allowance(line, ctx) {
    if (!/basic\s+allowance/i.test(line)) return [];
    return parseAmounts(line)
      .filter((a) => a.value >= 1_500 && a.value <= 25_000)
      .map((a) => ({
        ...a,
        matched: 'basic allowance + amount',
        confidence: ctx.docType === 'councillor-allowances' || ctx.docType === 'councillors-earnings' ? 0.85 : 0.6,
      }));
  },

  total_allowances_cost(line, ctx) {
    if (!(/allowance/i.test(line) && /total/i.test(line))) return [];
    return parseAmounts(line)
      .filter((a) => a.value >= 30_000 && a.value <= 3_000_000)
      .map((a) => ({
        ...a,
        matched: 'total + allowances + amount',
        confidence: ctx.docType === 'councillor-allowances' || ctx.docType === 'councillors-earnings' ? 0.8 : 0.5,
      }));
  },

  reserves(line, ctx) {
    const isGF = /general\s+fund/i.test(line) && /balance|reserve/i.test(line);
    const isUsable = /total\s+usable\s+reserves/i.test(line);
    // The actual GF balance usually sits in a "Balance at 31 March 20XX"
    // ROW under a "General Fund" COLUMN — line-based matching can't see
    // the column, so flag the row as a page locator for the reviewer.
    if (/balance\s+(?:at|as\s+at)\s+31\s+march/i.test(line)) {
      return [{
        value: null,
        raw: clean(line),
        matched: 'balance-at-31-March row (read the General Fund COLUMN on this page — likely the real reserves figure)',
        confidence: ctx.docType === 'statement-of-accounts' ? 0.7 : 0.4,
      }];
    }
    if (!isGF && !isUsable) return [];
    return parseAmounts(line)
      .filter((a) => a.value >= 100 && a.value <= 2_000_000_000)
      .map((a) => ({
        ...a,
        matched: isGF ? 'GENERAL FUND balance/reserve (the correct field)' : 'TOTAL USABLE reserves (⚠ NOT the field we render — see ROLLOUT-LESSONS §2)',
        confidence: isGF ? (ctx.docType === 'statement-of-accounts' ? 0.75 : 0.5) : 0.2,
      }));
  },

  budget_gap(line, ctx) {
    if (!/budget\s+gap|funding\s+gap/i.test(line)) return [];
    return parseAmounts(line).map((a) => ({
      ...a,
      matched: 'budget/funding gap + amount',
      confidence: ctx.docType === 'mtfs' ? 0.8 : 0.55,
    }));
  },

  savings_target(line, ctx) {
    if (!/savings?\s+(?:target|requirement|programme|plan)/i.test(line)) return [];
    return parseAmounts(line).map((a) => ({
      ...a,
      matched: 'savings target/requirement + amount',
      confidence: ctx.docType === 'mtfs' ? 0.8 : 0.5,
    }));
  },

  salary_bands(line) {
    if (/remuneration\s+band|salary\s+band|(?:salaries|remuneration)\s+(?:over|above|exceeding)\s+£?50/i.test(line)) {
      return [{ value: null, raw: clean(line), matched: 'salary-band table marker (page location only)', confidence: 0.6 }];
    }
    return [];
  },
};

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
    process.exit(2);
  }

  console.log(`Extract: ${councilName} — scanning ${pdfs.length} archived PDF(s)`);

  const candidates = {};
  for (const field of Object.keys(DETECTORS)) candidates[field] = [];

  for (const { pdfFile, meta } of pdfs) {
    const pdfPath = join(councilDir, pdfFile);
    let fullText;
    try {
      fullText = extractText(pdfPath); // -layout, \f between pages
    } catch (e) {
      console.warn(`  ! ${pdfFile}: pdftotext failed (${e.message}) — skipping`);
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

  const out = {
    council: councilName,
    slug,
    generated_at: new Date().toISOString(),
    current_values: currentValuesFromTs(),
    candidates,
    chosen: {},
    warnings,
  };

  const outPath = join(councilDir, 'extracted-values.json');
  writeFileSync(outPath, JSON.stringify(out, null, 2) + '\n');

  // Status
  const statusDir = join(REPO_ROOT, 'scripts', 'council-research', 'status');
  mkdirSync(statusDir, { recursive: true });
  const statusPath = join(statusDir, `${slug}.json`);
  let current = {};
  if (existsSync(statusPath)) { try { current = JSON.parse(readFileSync(statusPath, 'utf8')); } catch {} }
  const totalCands = Object.values(candidates).reduce((n, c) => n + c.length, 0);
  writeFileSync(statusPath, JSON.stringify({
    council: councilName, slug, ...current,
    phases: { ...(current.phases || {}), phase_2_extract: { done: totalCands > 0, at: new Date().toISOString(), candidates: totalCands } },
    last_session: new Date().toISOString(),
  }, null, 2) + '\n');

  console.log('');
  console.log(`Extracted candidates → ${outPath}`);
  for (const [field, cands] of Object.entries(candidates)) {
    if (cands.length === 0) continue;
    const top = cands[0];
    console.log(`  ${field}: ${cands.length} candidate(s) — top: ${JSON.stringify(top.value ?? top.raw)} (p${top.page} ${top.pdf}, conf ${top.confidence})`);
  }
  console.log('');
  console.log('Next: review excerpts, set `chosen` in extracted-values.json, then:');
  console.log(`  node scripts/council-research/06-audit-evidence.mjs --council="${councilName}"`);
  console.log(`  node scripts/council-research/05-populate.mjs --council="${councilName}"`);
}

main();
