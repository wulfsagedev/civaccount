/**
 * import-search-console.mjs — turn a Google Search Console export into a
 * normalised priority table the audit/rollout tooling can rank councils by.
 *
 * WHY THIS EXISTS
 * ---------------
 * Council rollout order was proxied by ONS population because Search Console
 * was not readable from here. Population is a guess at demand. Impressions are
 * the measurement. This script replaces the guess with the measurement.
 *
 * INPUT — a Performance report export from Search Console:
 *   Search Console → Performance → Search results → Export → CSV/Excel
 *   The zip contains Pages.csv (plus Queries.csv, Dates.csv, ...).
 *   Drop Pages.csv into scripts/seo/exports/ and run this.
 *
 * Column names are detected case-insensitively, so exports from the UI, the
 * API, Looker Studio and BigQuery all parse without configuration.
 *
 * OUTPUT — scripts/seo/data/gsc-pages.json
 *   { generated, source, range, totals, councils: {slug: {...}}, pages: [...] }
 *
 * PRIVACY / REPO SPLIT
 * --------------------
 * This script is public (it is a CSV parser and reveals nothing). Its INPUT and
 * OUTPUT are performance metrics, which per the repo split belong in the
 * private civaccount-data repo — both paths are gitignored here. Copy the
 * output to civaccount-data/tracking/press/ if you want it version-controlled.
 *
 * Usage:
 *   node scripts/seo/import-search-console.mjs                    # auto-find export
 *   node scripts/seo/import-search-console.mjs path/to/Pages.csv
 *   node scripts/seo/import-search-console.mjs --top=30           # print top N
 */

import { readFileSync, writeFileSync, existsSync, readdirSync, mkdirSync, statSync } from 'fs';
import { join, dirname, basename } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const EXPORTS_DIR = join(__dirname, 'exports');
const DATA_DIR = join(__dirname, 'data');
const OUT_PATH = join(DATA_DIR, 'gsc-pages.json');

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const m = a.match(/^--([^=]+)(?:=(.*))?$/);
    return m ? [m[1], m[2] ?? true] : ['_file', a];
  }),
);
const TOP = args.top ? parseInt(args.top, 10) : 20;

/** Mirror of the app's generateSlug in src/data/councils.ts — keep in sync. */
function generateSlug(name) {
  return name
    .toLowerCase()
    .replace(/['‘’]/g, '')
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-+/g, '-');
}

/** RFC4180-ish CSV parse: handles quoted fields, embedded commas and newlines. */
function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;
  // Strip UTF-8 BOM — Search Console exports carry one.
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else field += ch;
      continue;
    }
    if (ch === '"') { inQuotes = true; continue; }
    if (ch === ',') { row.push(field); field = ''; continue; }
    if (ch === '\r') continue;
    if (ch === '\n') { row.push(field); rows.push(row); row = []; field = ''; continue; }
    field += ch;
  }
  if (field.length > 0 || row.length > 0) { row.push(field); rows.push(row); }
  return rows.filter((r) => r.some((c) => c.trim() !== ''));
}

/** Find a column index by trying each candidate name against the header. */
function findColumn(header, candidates) {
  const norm = header.map((h) => h.trim().toLowerCase());
  for (const cand of candidates) {
    const i = norm.indexOf(cand);
    if (i !== -1) return i;
  }
  // Fall back to substring match so "Top pages"/"Page URL" style variants land.
  for (const cand of candidates) {
    const i = norm.findIndex((h) => h.includes(cand));
    if (i !== -1) return i;
  }
  return -1;
}

function toNumber(raw) {
  if (raw == null) return 0;
  const cleaned = String(raw).replace(/[,%\s]/g, '');
  const n = parseFloat(cleaned);
  return Number.isFinite(n) ? n : 0;
}

/** Newest CSV in exports/, preferring one that looks like a Pages export. */
function autoFindExport() {
  if (!existsSync(EXPORTS_DIR)) return null;
  const csvs = readdirSync(EXPORTS_DIR)
    .filter((f) => f.toLowerCase().endsWith('.csv'))
    .map((f) => ({ f, path: join(EXPORTS_DIR, f), mtime: statSync(join(EXPORTS_DIR, f)).mtimeMs }))
    .sort((a, b) => {
      const aPage = /page/i.test(a.f) ? 1 : 0;
      const bPage = /page/i.test(b.f) ? 1 : 0;
      if (aPage !== bPage) return bPage - aPage;
      return b.mtime - a.mtime;
    });
  return csvs.length ? csvs[0].path : null;
}

function classify(pathname) {
  if (pathname === '/' || pathname === '') return 'home';
  const seg = pathname.split('/').filter(Boolean);
  const known = ['council', 'compare', 'insights', 'guide', 'parish', 'townhall', 'data', 'embed'];
  return known.includes(seg[0]) ? seg[0] : 'other';
}

function main() {
  const file = args._file || autoFindExport();
  if (!file) {
    console.error('✗ No CSV found.');
    console.error('');
    console.error('  Get one: Search Console → Performance → Search results →');
    console.error('  set the date range to the last 3 months → Export → CSV.');
    console.error(`  Unzip it and drop Pages.csv into ${EXPORTS_DIR}/`);
    console.error('  Then re-run this command.');
    process.exit(2);
  }
  if (!existsSync(file)) {
    console.error(`✗ No such file: ${file}`);
    process.exit(2);
  }

  const rows = parseCsv(readFileSync(file, 'utf8'));
  if (rows.length < 2) {
    console.error(`✗ ${basename(file)} has no data rows.`);
    process.exit(2);
  }

  const header = rows[0];
  const iUrl = findColumn(header, ['top pages', 'page', 'url', 'landing page', 'address']);
  const iClicks = findColumn(header, ['clicks', 'url clicks']);
  const iImpr = findColumn(header, ['impressions', 'impr']);
  const iCtr = findColumn(header, ['ctr', 'click through rate']);
  const iPos = findColumn(header, ['position', 'average position', 'avg position']);

  if (iUrl === -1 || iImpr === -1) {
    console.error(`✗ Could not find a URL column and an impressions column in ${basename(file)}.`);
    console.error(`  Header seen: ${header.join(' | ')}`);
    console.error('  Expected a Search Console *Pages* export (Pages.csv), not Queries.csv.');
    process.exit(2);
  }

  const pages = [];
  for (const r of rows.slice(1)) {
    const rawUrl = (r[iUrl] || '').trim();
    if (!rawUrl || /^top pages$/i.test(rawUrl)) continue;

    let pathname = rawUrl;
    try {
      pathname = new URL(rawUrl).pathname;
    } catch {
      // Already a path, or a malformed row — keep whatever we were given.
      if (!pathname.startsWith('/')) continue;
    }
    pathname = pathname.replace(/\/+$/, '') || '/';

    const entry = {
      path: pathname,
      section: classify(pathname),
      clicks: iClicks === -1 ? 0 : toNumber(r[iClicks]),
      impressions: toNumber(r[iImpr]),
      ctr: iCtr === -1 ? null : toNumber(r[iCtr]),
      position: iPos === -1 ? null : toNumber(r[iPos]),
    };
    if (entry.section === 'council') {
      const seg = pathname.split('/').filter(Boolean);
      // /council/<slug> and /council/<slug>/provenance both credit the council.
      if (seg[1]) entry.slug = seg[1];
    }
    pages.push(entry);
  }

  if (pages.length === 0) {
    console.error(`✗ Parsed 0 usable rows from ${basename(file)}.`);
    process.exit(2);
  }

  // Roll sub-pages (e.g. /provenance) up into the parent council.
  const councils = {};
  for (const p of pages) {
    if (!p.slug) continue;
    const c = (councils[p.slug] ||= { slug: p.slug, clicks: 0, impressions: 0, bestPosition: null });
    c.clicks += p.clicks;
    c.impressions += p.impressions;
    if (p.position != null && p.position > 0) {
      c.bestPosition = c.bestPosition == null ? p.position : Math.min(c.bestPosition, p.position);
    }
  }

  const bySection = {};
  for (const p of pages) {
    const s = (bySection[p.section] ||= { pages: 0, clicks: 0, impressions: 0 });
    s.pages++;
    s.clicks += p.clicks;
    s.impressions += p.impressions;
  }

  const out = {
    generated: new Date().toISOString(),
    source: basename(file),
    totals: {
      pages: pages.length,
      clicks: pages.reduce((a, p) => a + p.clicks, 0),
      impressions: pages.reduce((a, p) => a + p.impressions, 0),
      councilsSeen: Object.keys(councils).length,
    },
    bySection,
    councils,
    pages: pages.sort((a, b) => b.impressions - a.impressions),
  };

  mkdirSync(DATA_DIR, { recursive: true });
  writeFileSync(OUT_PATH, JSON.stringify(out, null, 2));

  const ranked = Object.values(councils).sort((a, b) => b.impressions - a.impressions);

  console.log('');
  console.log('═══ Search Console import ═══');
  console.log(`Source file:        ${basename(file)}`);
  console.log(`Rows parsed:        ${pages.length}`);
  console.log(`Total impressions:  ${out.totals.impressions.toLocaleString()}`);
  console.log(`Total clicks:       ${out.totals.clicks.toLocaleString()}`);
  console.log(`Councils with data: ${ranked.length} of 317`);
  console.log('');
  console.log('By section:');
  for (const [name, s] of Object.entries(bySection).sort((a, b) => b[1].impressions - a[1].impressions)) {
    console.log(`  ${name.padEnd(10)} ${String(s.pages).padStart(5)} pages  ${String(s.impressions).toLocaleString().padStart(9)} impr  ${String(s.clicks).toLocaleString().padStart(6)} clicks`);
  }
  if (ranked.length) {
    console.log('');
    console.log(`Top ${Math.min(TOP, ranked.length)} councils by impressions — this is the rollout order:`);
    ranked.slice(0, TOP).forEach((c, i) => {
      const pos = c.bestPosition == null ? '—' : c.bestPosition.toFixed(1);
      console.log(`  ${String(i + 1).padStart(3)}. ${c.slug.padEnd(32)} ${String(c.impressions).toLocaleString().padStart(8)} impr  ${String(c.clicks).padStart(5)} clicks  pos ${pos}`);
    });
  }
  console.log('');
  console.log(`Written → ${OUT_PATH.replace(process.cwd() + '/', '')}`);
  console.log('Now run: node scripts/validate/audit-all.mjs --top=25');
  console.log('');
}

main();
