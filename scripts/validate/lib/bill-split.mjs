/**
 * bill-split.mjs — the council tax bill split each council should carry,
 * built from MHCLG Table 10 (Local Authority Level Data).
 *
 * Shared by scripts/sync-bill-split.mjs (writes `detailed.precepts`) and
 * validators/bill-split.mjs (checks them), so the two can never disagree
 * about how a GOV.UK row becomes a bill row.
 *
 * Billing authorities (districts, unitaries, metropolitan districts, London
 * boroughs) carry the headline year, 2026-27, from Data_Billing:
 *   - this council's row = line 8, its average Band D INCLUDING parish
 *     precepts. Where parishes exist, the row says so and also carries
 *     line 9 (excluding parishes) as `band_d_excluding_parish` — this
 *     council's own share. The parish part is never shown on its own:
 *     MHCLG doesn't publish it, and a subtraction would be a derived figure.
 *   - one row per major preceptor in the area = line 16 (county or GLA,
 *     police, fire, combined authority)
 *   - `total_band_d` = line 17, the area Band D. Lines 8 + 16 = 17 exactly.
 *
 * County councils carry 2025-26 (their 2026-27 Band D is not yet ingested;
 * see getAreaBandD in src/data/councils.ts), from Data_Precepting: the
 * county's own Band D plus the police, fire and combined authority Band D
 * for the county's area. There is no area total — each district's share
 * and any parish precept sit on top — so a county has no `total_band_d`.
 */

import { loadCsv } from '../load-councils.mjs';

export const BILLING_SPLIT_YEAR = '2026-27';
export const COUNTY_SPLIT_YEAR = '2025-26';
export const COMPONENTS_CSV = 'parsed-band-d-components.csv';
export const PRECEPTING_CSV = 'parsed-precepting-band-d.csv';

export const PRECEPT_ROLES = [
  { role: 'county_or_gla', kind: (row) => (row.county_or_gla_authority === 'Greater London Authority' ? 'gla' : 'county') },
  { role: 'police', kind: () => 'police' },
  { role: 'fire', kind: () => 'fire' },
  { role: 'combined_authority', kind: () => 'combined_authority' },
];

export const PRECEPT_KINDS = new Set(['council', 'county', 'gla', 'police', 'fire', 'combined_authority']);

/** Load both Table 10 CSVs once. */
export function loadBillSplitSources() {
  const components = new Map(); // `${year}|${ons}` → row
  for (const r of loadCsv(COMPONENTS_CSV)) components.set(`${r.year}|${r.ons_code}`, r);
  const precepting = new Map(); // `${year}|${ecode}` → row
  for (const r of loadCsv(PRECEPTING_CSV)) precepting.set(`${r.year}|${r.ecode}`, r);
  return { components, precepting };
}

const pounds = (s) => Math.round(parseFloat(s) * 100) / 100;

/**
 * Expected split for one council, or { error } when Table 10 has no match.
 * `ownLabel` names this council's own row (Table 10 doesn't carry the
 * council's full corporate name, so the caller supplies it).
 */
export function expectedSplit(council, ownLabel, sources) {
  const { components, precepting } = sources;

  if (council.type !== 'SC') {
    const row = components.get(`${BILLING_SPLIT_YEAR}|${council.ons_code}`);
    if (!row) return { error: `no ${BILLING_SPLIT_YEAR} Table 10 Data_Billing row for ${council.ons_code}` };
    const inc = pounds(row.own_band_d_inc_parish);
    const exc = pounds(row.own_band_d_exc_parish);
    const own = { authority: ownLabel, band_d: inc, kind: 'council' };
    if (Math.abs(inc - exc) >= 0.005) {
      own.includes_parish_average = true;
      own.band_d_excluding_parish = exc;
    }
    const rows = [own];
    for (const { role, kind } of PRECEPT_ROLES) {
      const v = pounds(row[role] || '0');
      if (v > 0) rows.push({ authority: row[`${role}_authority`], band_d: v, kind: kind(row) });
    }
    return { year: BILLING_SPLIT_YEAR, rows, total: pounds(row.area_band_d), source: row };
  }

  // County: own Band D from Data_Precepting; police / fire / combined authority
  // are the preceptors every district in the county names in Data_Billing.
  const year = COUNTY_SPLIT_YEAR;
  const self = [...precepting.values()].find((p) => p.year === year && p.ons_code === council.ons_code && p.class === 'SC');
  if (!self) return { error: `no ${year} Table 10 Data_Precepting row for ${council.ons_code}` };
  const districts = [...components.values()].filter((r) => r.year === year && r.county_or_gla_ecode === self.ecode);
  if (districts.length === 0) return { error: `no ${year} districts name ${self.name} as their county` };
  const rows = [{ authority: ownLabel, band_d: pounds(self.band_d), kind: 'council' }];
  for (const { role, kind } of PRECEPT_ROLES.slice(1)) {
    const ecodes = new Set(districts.map((d) => d[`${role}_ecode`]).filter(Boolean));
    if (ecodes.size === 0) continue;
    if (ecodes.size > 1) return { error: `${self.name} districts name different ${role} preceptors: ${[...ecodes].join(', ')}` };
    const [ecode] = ecodes;
    const p = precepting.get(`${year}|${ecode}`);
    if (!p) return { error: `no ${year} Data_Precepting row for ${role} preceptor ${ecode}` };
    const name = districts.find((d) => d[`${role}_ecode`] === ecode)[`${role}_authority`];
    rows.push({ authority: name, band_d: pounds(p.band_d), kind: kind() });
  }
  return { year, rows, total: null, source: self };
}

const STRIP = new Set(['police', 'fire', 'crime', 'combined', 'commissioner', 'authority', 'pcc', 'rescue', 'mayor', 'gla']);
const words = (s) => s.toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, ' ').trim().split(' ');

/** This council's own row label, taken from its existing precept rows (the
 *  curated corporate name, e.g. "City of Bradford Metropolitan District
 *  Council"). Matches whole words, so "Gloucester" never picks up
 *  "Gloucestershire County Council". */
export function pickOwnLabel(council, existingRows) {
  const own = (existingRows || []).find((p) => p.kind === 'council');
  if (own) return own.authority;
  const rows = (existingRows || []).filter((p) => !words(p.authority).some((t) => STRIP.has(t)));
  const name = words(council.name);
  const contains = (hay) => hay.some((_, i) => name.every((t, j) => hay[i + j] === t));
  const hit = rows.find((p) => contains(words(p.authority)))
    || rows.find((p) => words(p.authority).includes(name[0]))
    || rows.find((p) => /\bcouncil\b/i.test(p.authority) && words(council.name).some((t) => t.length > 3 && words(p.authority).includes(t)));
  return hit ? hit.authority : null;
}
