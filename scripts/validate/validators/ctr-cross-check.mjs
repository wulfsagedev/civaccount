/**
 * ctr-cross-check.mjs — cross-check each council's stored
 * `council_tax_requirement` against MHCLG's statutory CTR1 return.
 *
 * SOURCE CHOICE MATTERS HERE, and the first version of this validator got it
 * wrong. There are two MHCLG figures that both look like a council tax
 * requirement, and only one of them is the statutory number:
 *
 *   ✓ CTR1 return — published as Table 10 of "Council tax levels set by local
 *     authorities in England". This is the statutory council tax requirement
 *     the council resolves. Parsed here as parsed-council-tax-requirement.csv
 *     (manifest id `council-tax-2025`, checksum-verified like every other
 *     Tier-1 source).
 *
 *   ✗ RA return line 990 (RA_Part1_LA_Data.csv) — a financing residual
 *     (revenue expenditure less grants, business rates and reserve
 *     movements). It diverges from the statutory figure for real reasons:
 *     some councils report excluding parish precepts (Adur's gap is exactly
 *     its £485,452 of parish precepts), and MHCLG's own Notes sheet, note 7,
 *     states that Havant, Barnet and Guildford "have provided council tax
 *     requirement figures that differ from figures reported in their CTR
 *     return. No explanation for this discrepancy has been provided."
 *
 * Comparing against the RA line produced seven confident "contradictions"
 * against councils whose figures are quoted verbatim from their own
 * tax-setting resolutions. A check that loudly fails on correct data is
 * worse than no check: it trains you to ignore it.
 *
 * This does not make the field "proven" — proof still needs the verbatim
 * excerpt from the council's own resolution. This is corroboration against
 * an independent national source, applied to all 317 councils at once.
 */

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CTR_PATH = join(
  __dirname, '..', '..', '..',
  'src', 'data', 'councils', 'pdfs', 'gov-uk-bulk-data', 'parsed-council-tax-requirement.csv',
);

// CTR1 is the same statutory figure we store, so agreement should be near
// exact. Allow a little room for pence-level rounding in the parse.
const WARN_FRACTION = 0.005;  // 0.5%
const ERROR_FRACTION = 0.05;  // 5% — not roundable; one of the two is wrong

function normaliseName(n) {
  return String(n).toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '');
}

function loadCtrIndex() {
  if (!existsSync(CTR_PATH)) return null;
  const lines = readFileSync(CTR_PATH, 'utf8').split('\n');
  const header = (lines[0] || '').trim().toLowerCase();
  if (!header.startsWith('name,council_tax_requirement')) return 'SCHEMA_DRIFT';

  const byName = new Map();
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const idx = line.lastIndexOf(',');
    if (idx === -1) continue;
    const name = line.slice(0, idx).replace(/^"|"$/g, '');
    const value = parseFloat(line.slice(idx + 1));
    if (!Number.isFinite(value)) continue;
    byName.set(normaliseName(name), { pounds: value, name });
  }
  return byName;
}

export function validate(councils, _population, report) {
  const ctr = loadCtrIndex();

  if (ctr === 'SCHEMA_DRIFT') {
    report.finding(
      { name: '[system]', ons_code: '' },
      'ctr-cross-check', 'ctr_schema_drift', 'error',
      'parsed-council-tax-requirement.csv no longer has the expected name,council_tax_requirement header — cross-check disabled until re-derived',
    );
    return;
  }
  if (!ctr) {
    report.finding(
      { name: '[system]', ons_code: '' },
      'ctr-cross-check', 'ctr_missing', 'warning',
      'parsed-council-tax-requirement.csv not found — council tax requirement cross-check skipped',
    );
    return;
  }

  for (const c of councils) {
    const ours = c.detailed?.council_tax_requirement;
    if (typeof ours !== 'number' || ours <= 0) continue;

    report.tick();
    const ref = ctr.get(normaliseName(c.name));
    if (!ref) {
      report.finding(c, 'ctr-cross-check', 'no_ctr_row', 'info',
        `No CTR1 row matched "${c.name}" — council tax requirement could not be cross-checked`,
        'detailed.council_tax_requirement', ours, 'a CTR1 row to compare against');
      continue;
    }

    const diff = Math.abs(ours - ref.pounds);
    const frac = diff / ref.pounds;
    if (frac < WARN_FRACTION) continue;

    const fmt = (n) => `£${Math.round(n).toLocaleString('en-GB')}`;
    // A figure quoted verbatim from the council's own tax-setting resolution
    // outranks a national aggregate, so an evidenced divergence is reported
    // but does not fail the build.
    const src = c.detailed?.field_sources?.council_tax_requirement;
    const verifiedAgainstPrimary = Boolean(src?.url && src?.excerpt);

    const severity = verifiedAgainstPrimary
      ? 'info'
      : frac >= ERROR_FRACTION ? 'error' : 'warning';

    report.finding(
      c, 'ctr-cross-check',
      verifiedAgainstPrimary ? 'ctr_diverges_ours_verified'
        : frac >= ERROR_FRACTION ? 'ctr_contradicts_ctr1' : 'ctr_diverges_from_ctr1',
      severity,
      verifiedAgainstPrimary
        ? `Council tax requirement ${fmt(ours)} differs from MHCLG CTR1 ${fmt(ref.pounds)} by ${fmt(diff)} (${(frac * 100).toFixed(2)}%). Ours is quoted verbatim from the council's own tax-setting resolution.`
        : `Council tax requirement ${fmt(ours)} differs from MHCLG CTR1 ${fmt(ref.pounds)} by ${fmt(diff)} (${(frac * 100).toFixed(2)}%) — the same statutory figure published twice should agree, and ours carries no verbatim quote from the council's own resolution`,
      'detailed.council_tax_requirement', ours,
      verifiedAgainstPrimary ? 'documented divergence' : `within 0.5% of ${fmt(ref.pounds)}`,
    );
  }
}
