/**
 * lib/pdf.mjs — wrappers around poppler's pdftotext + pdftoppm.
 *
 * Exports:
 *   extractText(pdfPath, { page, layout }) → string
 *   renderPage(pdfPath, page, outDir, { dpi }) → string (png path)
 *   countPages(pdfPath) → number
 *
 * Spec: NORTH-STAR.md §18 (tooling inventory)
 *
 * Scaffold — implementation in Phase B.
 */

// TODO:
// - extractText: spawn pdftotext with -layout (preserves columns)
//   plus -f <page> -l <page> for page-range extraction
// - renderPage: spawn pdftoppm -png -r <dpi> -f N -l N <pdf> <prefix>
// - countPages: pdfinfo <pdf> parse "Pages:" line
// - All functions are synchronous wrappers around subprocesses;
//   pdftotext output is returned via stdout
// - Handle encrypted PDFs gracefully (pdfinfo returns specific error)

export function extractText(_pdfPath, _opts = {}) {
  throw new Error('extractText: not yet implemented — scaffold only');
}

export function renderPage(_pdfPath, _page, _outDir, _opts = {}) {
  throw new Error('renderPage: not yet implemented — scaffold only');
}

export function countPages(_pdfPath) {
  throw new Error('countPages: not yet implemented — scaffold only');
}
