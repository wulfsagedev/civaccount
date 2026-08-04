/**
 * ctr-cross-check.mjs — cross-check each council's stored
 * `council_tax_requirement` against MHCLG's national RA return.
 *
 * Why this is worth doing: `council_tax_requirement` is a statutory figure
 * with one meaning, published in two independent places — the council's own
 * approved budget (which is where we take it from, at £1 precision) and
 * MHCLG's Revenue Account Budget return (column `ctrtot`, in £ thousand).
 * Two independent publications of the same statutory number should agree.
 *
 * They will NOT agree exactly, and that is expected:
 *   - the RA CSV is rounded to £ thousand (±£500 of noise on its own);
 *   - councils submit RA returns before/after final budget approval, so small
 *     genuine revisions exist.
 * So this flags *proportional* divergence, not inequality. A council whose two
 * published figures differ by more than a fraction of a percent is either a
 * transcription error on our side or a real-world discrepancy worth a note —
 * both need a human to look.
 *
 * This does not make the field "proven": proof still requires the verbatim
 * excerpt from the council's own budget document. This is corroboration —
 * it catches wrong numbers across all 317 councils mechanically, which
 * per-council evidence work cannot do at that speed.
 */

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const RA_PATH = join(
  __dirname, '..', '..', '..',
  'src', 'data', 'councils', 'pdfs', 'gov-uk-ra-data', 'RA_Part1_LA_Data.csv',
);

// Divergence beyond this fraction is reported. 0.5% is comfortably wider than
// £ thousand rounding on any council (the largest CTR is ~£1bn, where £500 of
// rounding is 0.00005%), so anything tripping this is a real difference.
const WARN_FRACTION = 0.005;   // 0.5%
const ERROR_FRACTION = 0.05;   // 5% — cannot be rounding or a late revision

const COL = { ons: 1, name: 2, ctr: 211 };
const HEADER_ROW = 9; // 0-indexed; data starts after it

function parseCsvLine(line) {
  const out = [];
  let cur = '';
  let inQuotes = false;
  for (const ch of line) {
    if (ch === '"') inQuotes = !inQuotes;
    else if (ch === ',' && !inQuotes) { out.push(cur); cur = ''; }
    else cur += ch;
  }
  out.push(cur);
  return out;
}

function loadRaIndex() {
  if (!existsSync(RA_PATH)) return null;
  const lines = readFileSync(RA_PATH, 'utf8').split('\n');

  // Verify the column really is COUNCIL TAX REQUIREMENT before trusting the
  // index — if MHCLG reshapes the sheet, fail loudly rather than compare the
  // wrong column.
  const header = parseCsvLine(lines[HEADER_ROW] || '');
  if (!/COUNCIL TAX REQUIREMENT/i.test(header[COL.ctr] || '')) return 'SCHEMA_DRIFT';

  const byOns = new Map();
  for (let i = HEADER_ROW + 1; i < lines.length; i++) {
    const row = parseCsvLine(lines[i]);
    const ons = (row[COL.ons] || '').trim();
    const raw = (row[COL.ctr] || '').trim().replace(/,/g, '');
    if (!ons || !raw) continue;
    const thousands = parseFloat(raw);
    if (!Number.isFinite(thousands)) continue;
    byOns.set(ons, { pounds: thousands * 1000, name: (row[COL.name] || '').trim() });
  }
  return byOns;
}

export function validate(councils, _population, report) {
  const ra = loadRaIndex();

  if (ra === 'SCHEMA_DRIFT') {
    report.finding(
      { name: '[system]', ons_code: '' },
      'ctr-cross-check', 'ra_schema_drift', 'error',
      `RA_Part1_LA_Data.csv column ${COL.ctr} is no longer COUNCIL TAX REQUIREMENT — cross-check disabled until the column index is re-derived`,
    );
    return;
  }
  if (!ra) {
    report.finding(
      { name: '[system]', ons_code: '' },
      'ctr-cross-check', 'ra_missing', 'warning',
      'RA_Part1_LA_Data.csv not found — council tax requirement cross-check skipped',
    );
    return;
  }

  for (const c of councils) {
    const ours = c.detailed?.council_tax_requirement;
    if (typeof ours !== 'number' || ours <= 0) continue;

    report.tick();
    const ref = ra.get(c.ons_code);
    if (!ref) {
      report.finding(c, 'ctr-cross-check', 'no_ra_row', 'info',
        `No RA return row for ${c.ons_code} — council tax requirement cannot be cross-checked`,
        'detailed.council_tax_requirement', ours, 'an RA row to compare against');
      continue;
    }

    const diff = Math.abs(ours - ref.pounds);
    const frac = diff / ref.pounds;
    if (frac < WARN_FRACTION) continue;

    const fmt = (n) => `£${Math.round(n).toLocaleString('en-GB')}`;
    const severity = frac >= ERROR_FRACTION ? 'error' : 'warning';
    report.finding(
      c, 'ctr-cross-check',
      frac >= ERROR_FRACTION ? 'ctr_contradicts_ra' : 'ctr_diverges_from_ra',
      severity,
      `Council tax requirement ${fmt(ours)} differs from the MHCLG RA return ${fmt(ref.pounds)} by ${fmt(diff)} (${(frac * 100).toFixed(2)}%) — two publications of the same statutory figure should agree`,
      'detailed.council_tax_requirement', ours, `within 0.5% of ${fmt(ref.pounds)}`,
    );
  }
}
