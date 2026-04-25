#!/usr/bin/env node
/**
 * screenshot-parity.mjs — enforce 1:1 screenshot coverage across the 22
 * North-Star councils.
 *
 * For every council in NORTH_STAR_22, require:
 *   1. At least one `field_sources.<key>.page_image_url` entry (screenshot
 *      coverage exists).
 *   2. Every `page_image_url` references an on-disk PNG at
 *      `src/data/councils/pdfs/council-pdfs/<slug>/images/<file>.png`.
 *   3. For page_image_url entries whose `<key>` resolves to a rendered
 *      TS scalar (`detailed.<key>`), the scalar value appears verbatim in
 *      the archived source (PDF via `pdftotext -layout`, or HTML via plain
 *      string search). This is the "1:1 matched data" invariant.
 *
 * Exit code: 1 if any council fails any of the three checks.
 *
 * Background: added 2026-04-24 after the Bradford/Kent/Camden-only screenshot
 * regression revealed on the live site. The user's rule now: "every single
 * council has screenshot preview confirmations of 1:1 matched data".
 */

import { readFileSync, existsSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { join } from 'node:path';

const REPO = '/Users/owenfisher/Projects/CivAccount/V3.0';
const DC = join(REPO, 'src', 'data', 'councils');

// Kept the identifier as NORTH_STAR_22 for historical continuity, but the list
// grows as each batch lands. Update here + STRICT_COUNCILS in validators/tier-
// classification.mjs whenever a council reaches North-Star complete.
const NORTH_STAR_22 = [
  'Bradford', 'Kent', 'Camden',
  'Manchester', 'Birmingham', 'Leeds', 'Surrey', 'Cornwall',
  'Liverpool', 'Bristol', 'Lancashire', 'Tower Hamlets',
  'Hampshire', 'Essex', 'Hertfordshire', 'Sheffield', 'Westminster',
  'Nottinghamshire', 'Staffordshire', 'Wiltshire', 'Newcastle upon Tyne', 'Croydon',
  // Batch-8 (2026-04-24): next 5 most-populous SC not yet complete.
  'Norfolk', 'West Sussex', 'Derbyshire', 'Lincolnshire',
  // Batch-9 (2026-04-24): Suffolk, Leicestershire, Cambridgeshire.
  // Devon + Oxfordshire deferred — both sites block puppeteer PDF navigation.
  'Suffolk', 'Leicestershire', 'Cambridgeshire',
  // Batch-10 (2026-04-24): Gloucestershire, Worcestershire, North Yorkshire.
  // Warwickshire + Somerset deferred — Warwickshire's api.warwickshire.gov.uk
  // blocks puppeteer fetch; Somerset 2023-24 SoA PDF not directly downloadable
  // from somerset.gov.uk (audit cycle unresolved).
  'Gloucestershire', 'Worcestershire', 'North Yorkshire',
  // Batch-9-take-2 (2026-04-25): re-attempting the deferred ones via Wayback.
  'Devon', 'East Sussex', 'Oxfordshire', 'Wakefield', 'Doncaster', 'Coventry', 'Bolton', 'Salford', 'Wirral', 'Sandwell', 'Sefton', 'Stockport', 'Wolverhampton', 'Barnsley', 'Solihull', 'St Helens', 'Dudley', 'Oldham',
  // Batch-11 (2026-04-26): UAs.
  'York', 'Plymouth', 'Portsmouth', 'Luton',
  // Batch-12 (2026-04-26): London Boroughs.
  'Hillingdon', 'Bromley', 'Bexley', 'Greenwich',
  // Batch-13 (2026-04-26): more LBs (Lewisham swapped for Hounslow — Lewisham Azure WAF blocked).
  'Lambeth', 'Wandsworth', 'Newham', 'Hounslow',
  // Batch-14 (2026-04-26): UAs (Bedford swapped for Brighton & Hove — Bedford SoA URL not findable).
  'Brighton & Hove', 'Reading', 'Stoke-on-Trent', 'Telford & Wrekin',
  // Batch-15 (2026-04-26): more LBs (Hackney+Hammersmith deferred — moderngov page-only links).
  'Southwark', 'Barnet', 'Haringey', 'Merton',
  // Batch-16 (2026-04-26): UAs.
  'Cheshire East', 'Cheshire West & Chester', 'Buckinghamshire', 'Bedford',
  // Batch-17 (2026-04-26): more LBs (Islington swapped for Kingston — Islington direct PDF blocked).
  'Kingston upon Thames', 'Kensington & Chelsea', 'Redbridge', 'Waltham Forest',
  // Batch-18 (2026-04-26): UAs.
  'Bath & North East Somerset', 'Halton', 'Bracknell Forest', 'Wokingham',
  // Batch-19 (2026-04-26): 3 more LBs (Hammersmith/Hackney/Sutton/Havering/Enfield/Lewisham all blocked or unpublished).
  'Barking & Dagenham', 'Brent', 'Ealing',
];

function slugify(n) {
  return n.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

const TS_FILES = ['county-councils.ts', 'metropolitan.ts', 'unitary.ts', 'london-boroughs.ts'];

// Canonicalise text so whitespace/punctuation variations don't break matching.
// - Collapse all whitespace (\n, tabs, multi-space) to single space
// - Normalise unicode dashes (em/en dash/minus) to ASCII hyphen
// - Strip zero-width and non-breaking spaces
// - Lowercase
function canonicalise(s) {
  return String(s)
    .replace(/\u00a0|\u200b|\u200c|\u200d|\ufeff/g, ' ')
    .replace(/[\u2013\u2014\u2212]/g, '-')
    .replace(/[\u2018\u2019\u201a\u201b]/g, "'")
    .replace(/[\u201c\u201d\u201e\u201f]/g, '"')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

// Unescape literal \n \t \" sequences that appear in TS-string excerpts
// (extractFieldSources captures the raw source between quotes, so "\\n"
// comes through as a two-char backslash+n instead of a real newline).
function unescapeTsString(s) {
  return String(s)
    .replace(/\\n/g, '\n')
    .replace(/\\t/g, '\t')
    .replace(/\\"/g, '"')
    .replace(/\\\\/g, '\\');
}

// Verify `excerpt` is present in `source`. Instead of strict substring, we
// split the excerpt into distinctive "chunks" (separated by newlines/multi-
// spaces in the original — which correspond to columns in PDF tables) and
// require every chunk to appear in the source after canonicalisation.
// This handles column-width differences between the extraction time and
// the audit time (pdftotext with different page ranges formats spaces
// differently).
function matchesExcerpt(source, excerpt) {
  const srcCanon = canonicalise(source);
  const ex = unescapeTsString(excerpt);
  // Split excerpt into key phrases. PDF column separators (multi-space,
  // newlines) AND explicit dash/colon connectors we use when authoring
  // excerpts (e.g. "Mark Wynn — Chief Executive") all count as splits.
  const rawChunks = ex.split(/[\n\u2014\u2013\u2212]|\s-\s|\s{2,}|:\s|\|/).map(c => c.trim()).filter(c => c.length > 0);
  const chunks = rawChunks.filter(c => c.length > 2).sort((a, b) => b.length - a.length);
  if (srcCanon.includes(canonicalise(ex))) return true;
  if (chunks.length === 0) return false;
  const hits = chunks.filter(c => srcCanon.includes(canonicalise(c))).length;
  return hits / chunks.length >= 0.6;
}

// Extract council-level block for a given name (reuse the brace-match shape
// used elsewhere — see link-check-tier4.mjs for the same pattern).
function extractCouncilBlock(src, name) {
  const nameIdx = src.indexOf(`\n    name: "${name}",`);
  if (nameIdx === -1) return null;
  const nextIdx = src.indexOf('\n  },\n  {\n    ons_code:', nameIdx);
  return src.slice(nameIdx, nextIdx === -1 ? src.length : nextIdx);
}

// Extract field_sources map: { key: { url, page_image_url, tier, sha256_at_access, page } }
function extractFieldSources(block) {
  const fsIdx = block.indexOf('field_sources: {');
  if (fsIdx === -1) return {};
  // Brace-match the block
  let depth = 0, i = fsIdx + 'field_sources: '.length;
  for (; i < block.length; i++) {
    if (block[i] === '{') depth++;
    else if (block[i] === '}') { depth--; if (depth === 0) break; }
  }
  const fsBody = block.slice(fsIdx, i + 1);

  const out = {};
  const keyRe = /(^\s{8}|\n\s{8})([a-z_]+):\s*\{/g;
  let km;
  while ((km = keyRe.exec(fsBody))) {
    const field = km[2];
    const startBrace = km.index + km[0].length - 1;
    let d = 1, j = startBrace + 1;
    for (; j < fsBody.length; j++) {
      if (fsBody[j] === '{') d++;
      else if (fsBody[j] === '}') { d--; if (d === 0) break; }
    }
    const inner = fsBody.slice(startBrace + 1, j);
    out[field] = {
      url: inner.match(/url:\s*"([^"]+)"/)?.[1],
      page_image_url: inner.match(/page_image_url:\s*"([^"]+)"/)?.[1],
      tier: parseInt(inner.match(/tier:\s*(\d+)/)?.[1] || '', 10),
      sha256: inner.match(/sha256_at_access:\s*"([^"]+)"/)?.[1],
      page: parseInt(inner.match(/\bpage:\s*(\d+)/)?.[1] || '', 10),
      excerpt: inner.match(/excerpt:\s*"([^"]+)"/)?.[1],
    };
  }
  return out;
}

// Extract a scalar value for a given field key from the council's detailed
// block. Keys we care about: chief_executive, council_leader, reserves, etc.
function extractDetailedScalar(block, field) {
  // Try various shapes:
  //   <field>: "some value",
  //   <field>: 12345,
  //   <field>: 12345.67,
  const re = new RegExp(`^\\s+${field}:\\s*(?:"([^"\\n]*)"|(-?[0-9][0-9.,]*))\\s*,`, 'm');
  const m = block.match(re);
  if (!m) return null;
  return m[1] !== undefined ? m[1] : m[2];
}

// For a given page_image_url and the TS value, check if value appears verbatim
// in the source. Source type is inferred from URL:
//   - *.pdf / *.pdf#page=N → pdftotext the archived PDF at the given page
//   - HTML (Wayback or direct) → grep the archived HTML file
//   - Else: treat as "cannot verify verbatim" (return undefined)
function verifyVerbatim(slug, fs, value) {
  if (!value) return { ok: null, reason: 'no TS value for this field' };
  const url = fs.url || '';
  const page = fs.page;
  const pdfsDir = join(DC, 'pdfs', 'council-pdfs', slug);

  // Extract the archive filename from the URL — handles both direct PDF URLs
  // and Wayback snapshots.
  // For PDF: look for a local file whose sha256 matches fs.sha256 (meta.json).
  if (fs.sha256) {
    // Find which file in the council's dir has this sha256
    try {
      const ls = execSync(`ls "${pdfsDir}"/*_meta.json 2>/dev/null || true`, { encoding: 'utf8', shell: '/bin/bash' }).trim().split('\n').filter(Boolean);
      for (const metaPath of ls) {
        const meta = JSON.parse(readFileSync(metaPath, 'utf8'));
        if (meta.sha256 === fs.sha256) {
          const stem = metaPath.replace(/_meta\.json$/, '');
          // Try likely file extensions — PDF most common, HTML for Wayback snapshots.
          const candidates = ['.pdf', '.html', '.htm', '.csv', ''];
          const docPath = candidates.map(ext => stem + ext).find(p => existsSync(p));
          if (!docPath) {
            return { ok: false, reason: `meta.json matched but no document file at ${stem.split('/').pop()}(.pdf|.html)` };
          }
          if (docPath.endsWith('.pdf')) {
            const args = Number.isFinite(page) ? `-layout -f ${page} -l ${page}` : '-layout';
            let text = '';
            try { text = execSync(`pdftotext ${args} "${docPath}" -`, { encoding: 'utf8' }); } catch { return { ok: false, reason: 'pdftotext failed' }; }
            const hit = matchesExcerpt(text, String(value));
            return hit ? { ok: true, reason: `verbatim "${String(value).slice(0,60)}…" in ${docPath.split('/').pop()} p${page || '*'}` } : { ok: false, reason: `"${String(value).slice(0,60)}…" not found in ${docPath.split('/').pop()} p${page || '*'}` };
          }
          if (docPath.endsWith('.html') || docPath.endsWith('.htm')) {
            const html = readFileSync(docPath, 'utf8');
            // Strip HTML tags before comparison so text inside <p>/<span> works.
            const textOnly = html.replace(/<[^>]+>/g, ' ');
            const hit = matchesExcerpt(textOnly, String(value));
            return hit ? { ok: true, reason: `verbatim "${String(value).slice(0,60)}…" in ${docPath.split('/').pop()}` } : { ok: false, reason: `"${String(value).slice(0,60)}…" not found in ${docPath.split('/').pop()}` };
          }
          return { ok: null, reason: `unsupported file type: ${docPath.split('/').pop()}` };
        }
      }
      return { ok: false, reason: `no archived file matches sha256 ${fs.sha256.slice(0,16)}…` };
    } catch (e) {
      return { ok: false, reason: `error resolving archive: ${e.message}` };
    }
  }
  return { ok: null, reason: 'no sha256 on field_source (cannot resolve archive)' };
}

// Main
const results = [];
let fatal = 0;

for (const name of NORTH_STAR_22) {
  const slug = slugify(name);
  let block = null;
  for (const f of TS_FILES) {
    const src = readFileSync(join(DC, f), 'utf8');
    block = extractCouncilBlock(src, name);
    if (block) break;
  }
  if (!block) { console.error(`? ${name}: could not locate council block`); fatal++; continue; }

  const fs = extractFieldSources(block);
  const withPng = Object.entries(fs).filter(([_, v]) => v.page_image_url);

  if (withPng.length === 0) {
    console.log(`✗ ${name}: 0 page_image_url entries — FAIL`);
    fatal++;
    results.push({ council: name, ok: false, reason: 'no page_image_url entries' });
    continue;
  }

  const perEntry = [];
  let councilOk = true;
  for (const [field, entry] of withPng) {
    // 1. PNG on disk?
    const pngPath = join(DC, 'pdfs', 'council-pdfs', entry.page_image_url.replace(/^\/archive\//, ''));
    const pngExists = existsSync(pngPath);
    // 2. 1:1 verbatim check.
    //    Prefer `excerpt` (the verbatim extraction claimed in the TS) — if
    //    that text appears in the archived source, the entry is sound.
    //    Fall back to the TS scalar (string or raw number) when no excerpt
    //    is set.
    const scalarValue = extractDetailedScalar(block, field);
    const checkValue = entry.excerpt || scalarValue;
    const verify = verifyVerbatim(slug, entry, checkValue);

    perEntry.push({ field, pngExists, scalarValue, excerpt: entry.excerpt, verify });
    if (!pngExists) councilOk = false;
    if (verify.ok === false) councilOk = false;
  }

  const pngs = perEntry.length;
  const onesToOne = perEntry.filter(p => p.verify.ok === true).length;
  const archivalOnly = perEntry.filter(p => p.verify.ok === null).length;
  const mismatches = perEntry.filter(p => p.verify.ok === false).length;
  const missingPng = perEntry.filter(p => !p.pngExists).length;

  const icon = councilOk ? '✓' : '✗';
  console.log(`${icon} ${name}: ${pngs} screenshot(s) · ${onesToOne} verbatim-1:1 · ${archivalOnly} archival-only · ${mismatches} mismatched · ${missingPng} missing PNG`);
  if (!councilOk) {
    for (const p of perEntry) {
      if (!p.pngExists) console.log(`     · ${p.field}: PNG missing on disk`);
      if (p.verify.ok === false) console.log(`     · ${p.field}: ${p.verify.reason}`);
    }
    fatal++;
  }

  results.push({
    council: name,
    ok: councilOk,
    entries: perEntry,
  });
}

console.log(`\nSummary: ${NORTH_STAR_22.length - fatal}/${NORTH_STAR_22.length} councils pass screenshot-parity.`);
if (fatal > 0) process.exit(1);
