/**
 * lib/pdf.mjs — poppler wrappers for PDF text + image extraction.
 *
 * Requires: poppler-utils (pdftotext, pdftoppm, pdfinfo). Installed via
 * `brew install poppler`.
 *
 * Spec: NORTH-STAR.md §6 Phase 1b, §19 (tooling inventory)
 */

import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { platform } from 'node:os';

// Ensure poppler binaries are discoverable. Homebrew installs to
// /opt/homebrew/bin on Apple Silicon; Node's default PATH from an
// IDE / script launcher may not include it. Linux distros typically
// ship poppler on default PATH.
const popplerPaths =
  platform() === 'darwin'
    ? ['/opt/homebrew/bin', '/usr/local/bin']
    : [];
const augmentedEnv = {
  ...process.env,
  PATH: [...popplerPaths, process.env.PATH || ''].filter(Boolean).join(':'),
};

/**
 * Extract text from a PDF. Returns string or throws.
 *   opts.page  — restrict to a single page (1-indexed)
 *   opts.first — first page (1-indexed)
 *   opts.last  — last page (1-indexed)
 *   opts.layout — preserve column layout (default true)
 */
export function extractText(pdfPath, opts = {}) {
  if (!existsSync(pdfPath)) throw new Error(`PDF not found: ${pdfPath}`);
  const args = [];
  if (opts.layout !== false) args.push('-layout');
  if (opts.page) args.push('-f', String(opts.page), '-l', String(opts.page));
  else {
    if (opts.first) args.push('-f', String(opts.first));
    if (opts.last) args.push('-l', String(opts.last));
  }
  args.push(pdfPath, '-'); // write to stdout
  const r = spawnSync('pdftotext', args, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, env: augmentedEnv });
  if (r.status !== 0) {
    throw new Error(`pdftotext failed (status=${r.status}): ${r.stderr}`);
  }
  return r.stdout;
}

/**
 * Render a specific page of a PDF to PNG.
 *   pdfPath  — source PDF
 *   page     — 1-indexed page number
 *   outDir   — directory for output
 *   opts.dpi — DPI (default 150; ~200 KB per typical A4 page)
 *   opts.filenamePrefix — basename (default: PDF name without extension)
 *
 * Returns the full path to the generated PNG.
 *
 * pdftoppm emits files as `<prefix>-<page>.png`; for a single page
 * it appends the page number. We normalise the output path.
 */
export function renderPage(pdfPath, page, outDir, opts = {}) {
  if (!existsSync(pdfPath)) throw new Error(`PDF not found: ${pdfPath}`);
  const dpi = opts.dpi ?? 150;
  const base =
    opts.filenamePrefix ||
    pdfPath.split('/').pop().replace(/\.pdf$/i, '');
  const prefix = join(outDir, `${base}-p${page}`);

  const r = spawnSync(
    'pdftoppm',
    ['-png', '-r', String(dpi), '-f', String(page), '-l', String(page), pdfPath, prefix],
    { encoding: 'utf8', env: augmentedEnv },
  );
  if (r.status !== 0) {
    throw new Error(`pdftoppm failed (status=${r.status}): ${r.stderr}`);
  }
  // pdftoppm adds a page-number suffix with zero-padding depending on
  // total pages. For single-page render, it's simpler: try the
  // common forms and return the one that exists.
  const candidates = [
    `${prefix}-${page}.png`,
    `${prefix}-0${page}.png`,
    `${prefix}-00${page}.png`,
    `${prefix}.png`,
  ];
  for (const c of candidates) {
    if (existsSync(c)) return c;
  }
  throw new Error(
    `pdftoppm ran successfully but no output file found. Tried: ${candidates.join(', ')}`,
  );
}

/** Count pages in a PDF via pdfinfo. */
export function countPages(pdfPath) {
  if (!existsSync(pdfPath)) throw new Error(`PDF not found: ${pdfPath}`);
  const r = spawnSync('pdfinfo', [pdfPath], { encoding: 'utf8', env: augmentedEnv });
  if (r.status !== 0) throw new Error(`pdfinfo failed: ${r.stderr}`);
  const m = r.stdout.match(/^Pages:\s+(\d+)/m);
  return m ? parseInt(m[1], 10) : 0;
}

/**
 * Locate the page containing a given search string. Returns the 1-indexed
 * page number or null. Useful when we know the text to search for but not
 * the page it's on.
 */
export function findPageContaining(pdfPath, searchString, opts = {}) {
  const totalPages = countPages(pdfPath);
  const caseInsensitive = opts.caseInsensitive !== false;
  const target = caseInsensitive ? searchString.toLowerCase() : searchString;
  for (let p = 1; p <= totalPages; p += 1) {
    const text = extractText(pdfPath, { page: p });
    const haystack = caseInsensitive ? text.toLowerCase() : text;
    if (haystack.includes(target)) return p;
  }
  return null;
}

// Convenience — also export readFileSync for downstream scripts
export { readFileSync };
