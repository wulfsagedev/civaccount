/**
 * bill-split.mjs — every council's "Your bill" rows must add up, and every
 * row must match MHCLG Table 10 to the penny.
 *
 * Why this exists: on 2026-10-29 all five launch-QA testers found bill
 * rows that didn't add up to the total shown beside them (Bradford £1,898
 * of rows against a £2,246 total; Manchester's own share mistyped by £399;
 * Kent's total left out the district). 282 of 317 councils were off by
 * more than £1. Nothing caught it: the only sum check was a warning, and
 * the loader never read total_band_d, so the checks that used it skipped.
 *
 * Checks (all errors — a bill that doesn't add up must not ship):
 *   Every council
 *     - has precept rows, a precepts_year, and one `kind: "council"` row
 *     - every row has a known kind
 *   Billing authorities (precepts_year = 2026-27, Table 10 Data_Billing)
 *     - rows sum to total_band_d, to the penny
 *     - total_band_d = line 17 (area Band D) and = council_tax.band_d_2026
 *     - own row = line 8; band_d_excluding_parish = line 9 where they differ
 *     - one row per non-zero line-16 preceptor, same value and name; no extras
 *   County councils (precepts_year = 2025-26, Table 10 Data_Precepting)
 *     - no total_band_d (a county has no area total: the district's share
 *       and any parish precept sit on top)
 *     - own row = the county's Band D = council_tax.band_d_2025
 *     - police / fire / combined authority rows = those preceptors' Band D
 */

import {
  loadBillSplitSources, expectedSplit, PRECEPT_KINDS, BILLING_SPLIT_YEAR, COUNTY_SPLIT_YEAR,
} from '../lib/bill-split.mjs';

const PENNY = 0.005;
const same = (a, b) => typeof a === 'number' && typeof b === 'number' && Math.abs(a - b) < PENNY;
const money = (n) => (typeof n === 'number' ? `£${n.toFixed(2)}` : String(n));

export function validate(councils, population, report) {
  const sources = loadBillSplitSources();
  if (sources.components.size === 0 || sources.precepting.size === 0) {
    report.finding({ name: '[system]', ons_code: '' }, 'bill-split', 'source_missing', 'error',
      'parsed-band-d-components.csv / parsed-precepting-band-d.csv not found — run python3 scripts/parse-band-d-components.py');
    return;
  }

  for (const c of councils) {
    const d = c.detailed || {};
    const rows = d.precepts || [];
    const fail = (check, message, field = 'detailed.precepts', value = null, expected = null) =>
      report.finding(c, 'bill-split', check, 'error', message, field, value, expected);

    report.tick();
    if (rows.length === 0) { fail('no_rows', 'No bill split rows (detailed.precepts)'); continue; }
    const wantYear = c.type === 'SC' ? COUNTY_SPLIT_YEAR : BILLING_SPLIT_YEAR;
    if (d.precepts_year !== wantYear) {
      fail('wrong_year', `precepts_year is ${d.precepts_year ?? 'missing'}; expected ${wantYear}`, 'detailed.precepts_year', d.precepts_year, wantYear);
    }
    const unknown = rows.filter((r) => !PRECEPT_KINDS.has(r.kind));
    if (unknown.length) fail('unknown_kind', `Rows without a known kind: ${unknown.map((r) => r.authority).join('; ')}`);
    const own = rows.filter((r) => r.kind === 'council');
    if (own.length !== 1) { fail('own_row', `Expected one kind "council" row, found ${own.length}`); continue; }

    const expected = expectedSplit(c, own[0].authority, sources);
    if (expected.error) { fail('no_source_row', expected.error); continue; }

    // ── Totals
    const sum = rows.reduce((s, r) => s + r.band_d, 0);
    if (c.type === 'SC') {
      if (d.total_band_d != null) {
        fail('county_total', `County has total_band_d ${money(d.total_band_d)} — a county has no area total (district and parish shares sit on top)`, 'detailed.total_band_d', d.total_band_d, null);
      }
      if (!same(c.council_tax?.band_d_2025, own[0].band_d)) {
        fail('county_band_d', `council_tax.band_d_2025 ${money(c.council_tax?.band_d_2025)} ≠ own row ${money(own[0].band_d)}`, 'council_tax.band_d_2025', c.council_tax?.band_d_2025, own[0].band_d);
      }
    } else {
      if (!same(sum, d.total_band_d)) {
        fail('sum', `Rows add up to ${money(sum)} but total_band_d is ${money(d.total_band_d)}`, 'detailed.total_band_d', d.total_band_d, Number(sum.toFixed(2)));
      }
      if (!same(d.total_band_d, expected.total)) {
        fail('total_vs_gov_uk', `total_band_d ${money(d.total_band_d)} ≠ Table 10 ${expected.year} line 17 ${money(expected.total)}`, 'detailed.total_band_d', d.total_band_d, expected.total);
      }
      if (!same(c.council_tax?.band_d_2026, expected.total)) {
        fail('total_vs_band_d', `council_tax.band_d_2026 ${money(c.council_tax?.band_d_2026)} ≠ Table 10 line 17 ${money(expected.total)} — the headline and the bill split must be one number`, 'council_tax.band_d_2026', c.council_tax?.band_d_2026, expected.total);
      }
    }

    // ── Row by row against Table 10
    const want = expected.rows;
    const ownWant = want[0];
    if (!same(own[0].band_d, ownWant.band_d)) {
      fail('own_value', `Own row ${money(own[0].band_d)} ≠ Table 10 ${money(ownWant.band_d)}`, 'detailed.precepts', own[0].band_d, ownWant.band_d);
    }
    if (!!own[0].includes_parish_average !== !!ownWant.includes_parish_average
        || (ownWant.includes_parish_average && !same(own[0].band_d_excluding_parish, ownWant.band_d_excluding_parish))) {
      fail('own_parish', ownWant.includes_parish_average
        ? `Own row must say it includes the average parish precept and carry Table 10 line 9 ${money(ownWant.band_d_excluding_parish)} as band_d_excluding_parish (has ${money(own[0].band_d_excluding_parish)}, includes_parish_average: ${!!own[0].includes_parish_average})`
        : 'Own row is marked as including parish precepts, but Table 10 shows none for this area',
        'detailed.precepts', own[0].band_d_excluding_parish ?? null, ownWant.band_d_excluding_parish ?? null);
    }
    for (const w of want.slice(1)) {
      const got = rows.filter((r) => r.kind === w.kind);
      if (got.length !== 1) { fail('missing_row', `Expected one ${w.kind} row (${w.authority} ${money(w.band_d)}), found ${got.length}`); continue; }
      if (!same(got[0].band_d, w.band_d)) fail('row_value', `${w.authority}: ${money(got[0].band_d)} ≠ Table 10 ${money(w.band_d)}`, 'detailed.precepts', got[0].band_d, w.band_d);
      if (got[0].authority !== w.authority) fail('row_name', `${w.kind} row named "${got[0].authority}"; Table 10 names "${w.authority}"`, 'detailed.precepts', got[0].authority, w.authority);
    }
    const wantKinds = new Set(want.map((w) => w.kind));
    for (const r of rows) {
      if (!wantKinds.has(r.kind)) fail('extra_row', `Row "${r.authority}" (${r.kind}) is not in Table 10 for this area`);
    }
  }
}
