/**
 * lib/tier1-refs.mjs — shared access to the archived GOV.UK reference
 * files (the Tier-1 sources of truth).
 *
 * Used by 04-extract-csv (cross-check tables) and render-csv-evidence
 * (visual row evidence) so both read the SAME files the SAME way —
 * column mappings are copied from validators/source-truth.mjs, so what
 * these tools show is exactly what CI verifies.
 */

import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..', '..', '..');
export const BULK_DIR = join(REPO_ROOT, 'src', 'data', 'councils', 'pdfs', 'gov-uk-bulk-data');
export const RA_DIR = join(REPO_ROOT, 'src', 'data', 'councils', 'pdfs', 'gov-uk-ra-data');
const SOURCE_MANIFEST = join(REPO_ROOT, 'scripts', 'validate', 'source-manifest.json');

export const RA1_COLUMNS = {
  'TOTAL EDUCATION SERVICES': 'education',
  'TOTAL HIGHWAYS AND TRANSPORT SERVICES': 'transport',
  "TOTAL CHILDREN'S SOCIAL CARE": 'childrens_social_care',
  'TOTAL ADULT SOCIAL CARE': 'adult_social_care',
  'TOTAL PUBLIC HEALTH': 'public_health',
  'TOTAL HOUSING SERVICES (GFRA only)': 'housing',
  'TOTAL CULTURAL AND RELATED SERVICES': 'cultural',
  'TOTAL ENVIRONMENTAL AND REGULATORY SERVICES': 'environmental',
  'TOTAL PLANNING AND DEVELOPMENT SERVICES': 'planning',
  'TOTAL CENTRAL SERVICES': 'central_services',
  'TOTAL OTHER SERVICES': 'other',
  'TOTAL SERVICE EXPENDITURE': 'total_service',
  // Bottom-line column of the SAME Part 1 file. Part 2 holds only
  // reserves / HRA / investment-property columns — a Part 2 lookup for
  // this header matches nothing and silently drops the field.
  'NET CURRENT EXPENDITURE': 'net_current',
};

/** Fail loud when a requested column is absent from the header row —
 *  a renamed GOV.UK column must never silently shrink the checks. */
function warnMissingColumns(filename, missing) {
  if (missing.length === 0) return;
  console.warn(
    `⚠ ${filename}: column(s) not found in header row (file line 10): ` +
    `${missing.map((h) => `"${h}"`).join(', ')} — these fields are SKIPPED. ` +
    'The GOV.UK file layout may have changed; fix the column mapping.',
  );
}

export function parseCsvLine(line) {
  const result = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') inQuotes = !inQuotes;
    else if (ch === ',' && !inQuotes) { result.push(cur); cur = ''; }
    else cur += ch;
  }
  result.push(cur);
  return result;
}

/** Simple header-row CSVs (parsed-population.csv etc.) → row objects. */
export function loadSimpleCsv(filename) {
  const path = join(BULK_DIR, filename);
  if (!existsSync(path)) return null;
  const lines = readFileSync(path, 'utf-8').split('\n').filter((l) => l.trim());
  const header = parseCsvLine(lines[0]).map((h) => h.trim());
  return lines.slice(1).map((l) => {
    const row = parseCsvLine(l);
    const o = {};
    header.forEach((h, i) => { o[h] = (row[i] || '').trim(); });
    return o;
  });
}

/** Same, but returns { header, rows } with raw arrays — for display. */
export function loadSimpleCsvRaw(filename) {
  const path = join(BULK_DIR, filename);
  if (!existsSync(path)) return null;
  const lines = readFileSync(path, 'utf-8').split('\n').filter((l) => l.trim());
  return {
    header: parseCsvLine(lines[0]).map((h) => h.trim()),
    rows: lines.slice(1).map(parseCsvLine),
  };
}

/** RA CSVs: header at line 9, data from line 10, ONS code in col 1.
 *  Returns mapped { field: value } for one council. */
export function loadRaRow(filename, valueColumns, ons) {
  const path = join(RA_DIR, filename);
  if (!existsSync(path)) return null;
  const lines = readFileSync(path, 'utf-8').split('\n');
  if (lines.length < 12) return null;
  const header = parseCsvLine(lines[9]);
  const colMap = {};
  for (let i = 0; i < header.length; i++) {
    const h = header[i].trim();
    if (valueColumns[h]) colMap[valueColumns[h]] = i;
  }
  warnMissingColumns(filename, Object.entries(valueColumns)
    .filter(([, field]) => colMap[field] === undefined)
    .map(([h]) => h));
  for (let r = 10; r < lines.length; r++) {
    const row = parseCsvLine(lines[r]);
    if ((row[1] || '').trim() !== ons) continue;
    const entry = {};
    for (const [field, col] of Object.entries(colMap)) {
      const v = parseFloat((row[col] || '').trim());
      if (!isNaN(v)) entry[field] = v;
    }
    return entry;
  }
  return null;
}

/** RA display access: { headers, cells } for one council + named columns. */
export function loadRaRowDisplay(filename, ons, wantedHeaders) {
  const path = join(RA_DIR, filename);
  if (!existsSync(path)) return null;
  const lines = readFileSync(path, 'utf-8').split('\n');
  if (lines.length < 12) return null;
  const header = parseCsvLine(lines[9]).map((h) => h.trim());
  warnMissingColumns(filename, wantedHeaders.filter((w) => header.indexOf(w) === -1));
  for (let r = 10; r < lines.length; r++) {
    const row = parseCsvLine(lines[r]);
    if ((row[1] || '').trim() !== ons) continue;
    const idxs = wantedHeaders.map((w) => header.indexOf(w));
    return {
      headers: wantedHeaders,
      cells: idxs.map((i) => (i === -1 ? '' : (row[i] || '').trim())),
      identity: { ons_code: (row[1] || '').trim(), authority: (row[2] || row[0] || '').trim() },
    };
  }
  return null;
}

/** source-manifest.json lookup by parsed_csv or raw_file name.
 *  Manifest entries may carry a directory prefix (e.g.
 *  'gov-uk-ra-data/RA_Part1_LA_Data.csv') while callers pass the bare
 *  filename — so match on basename, never exact path only. A miss is
 *  LOUD: a null here strips the publisher and official-file fingerprint
 *  from rendered evidence captions, which must never happen silently. */
export function manifestFor(filename) {
  const base = (p) => String(p).split('/').pop();
  if (!existsSync(SOURCE_MANIFEST)) {
    console.warn(`⚠ manifestFor("${filename}"): ${SOURCE_MANIFEST} not found — captions will lack publisher + official fingerprint.`);
    return null;
  }
  const m = JSON.parse(readFileSync(SOURCE_MANIFEST, 'utf-8'));
  const want = base(filename);
  const hit = (m.sources || []).find(
    (s) => (s.parsed_csv && base(s.parsed_csv) === want) ||
           (s.raw_file && base(s.raw_file) === want),
  ) || null;
  if (!hit) {
    console.warn(`⚠ manifestFor("${filename}"): no source-manifest.json entry matches — captions will lack publisher + official fingerprint.`);
  }
  return hit;
}
