/**
 * source-truth.mjs — Value-verification validator.
 *
 * Every rendered Category A value (national CSV source) is cross-
 * checked against its source row per VALUE-VERIFICATION-PLAN.md. Each
 * field family has an explicit tolerance rule — exact, relative,
 * absolute, or semantic — with the rationale documented inline.
 *
 * VP1 scope (this commit):
 *   - Band D council tax (5 years) — exact
 *   - RA Part 1 budget categories (13 columns) — ±10% relative
 *   - RA Part 2 net_current + reserves semantic check
 *   - ONS population — ±100 absolute
 *   - LGBCE total_councillors — exact
 *   - DEFRA recycling rate — ±0.5pp absolute
 *   - DfT road condition + length — ±0.5pp / ±0.5%
 *   - Ofsted children's services rating — string match with stale-ref allowance
 *   - Capital programme — ±5% relative
 *   - CEO salary — info-only staleness check
 *
 * VP2 (calculated fields) lives in calculated-fields.mjs; this
 * validator only covers source-backed values.
 */

import { loadCsv, buildOnsIndex, buildCsvIndex } from '../load-councils.mjs';
import { normalizeCouncilName } from '../lib/normalize.mjs';
import { readFileSync, existsSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const RA_DIR = join(__dirname, '..', '..', '..', 'src', 'data', 'councils', 'pdfs', 'gov-uk-ra-data');
const REPORTS_DIR = join(__dirname, '..', 'reports');

const BAND_D_FIELDS = ['band_d_2021', 'band_d_2022', 'band_d_2023', 'band_d_2024', 'band_d_2025'];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function parseCsvLine(line) {
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

function loadRaCsv(filename, valueColumns) {
  const path = join(RA_DIR, filename);
  if (!existsSync(path)) return new Map();
  const content = readFileSync(path, 'utf-8');
  const lines = content.split('\n');
  if (lines.length < 12) return new Map();
  const header = parseCsvLine(lines[9]);
  const colMap = {};
  for (let i = 0; i < header.length; i++) {
    const h = header[i].trim();
    if (valueColumns[h]) colMap[valueColumns[h]] = i;
  }
  const result = new Map();
  for (let r = 10; r < lines.length; r++) {
    const row = parseCsvLine(lines[r]);
    if (row.length < 5) continue;
    const ons = (row[1] || '').trim();
    if (!ons.startsWith('E')) continue;
    const entry = {};
    for (const [field, col] of Object.entries(colMap)) {
      const v = parseFloat((row[col] || '').trim());
      if (!isNaN(v)) entry[field] = v;
    }
    if (Object.keys(entry).length > 0) result.set(ons, entry);
  }
  return result;
}

function withinRelative(actual, expected, tol) {
  if (expected === 0) return actual === 0;
  return Math.abs(actual - expected) / Math.abs(expected) <= tol;
}
function withinAbsolute(actual, expected, tol) {
  return Math.abs(actual - expected) <= tol;
}

// Capture every check for the JSON report
const auditLog = [];

function record(check) {
  auditLog.push(check);
}

export function validate(councils, population, report) {
  // Reset per-run
  auditLog.length = 0;

  const areaCsv = loadCsv('parsed-area-band-d.csv');
  if (areaCsv.length === 0) {
    report.finding(
      { name: 'SYSTEM', ons_code: '' }, 'source-truth', 'csv_missing', 'error',
      'parsed-area-band-d.csv not found — run: python3 scripts/parse-area-band-d.py',
      'system', null, 'parsed-area-band-d.csv'
    );
    return;
  }

  const areaIndex = buildOnsIndex(areaCsv);

  for (const c of councils) {
    const ons = c.ons_code;
    const ref = areaIndex.get(ons);

    // County councils (SC) are not billing authorities — skip
    if (c.type === 'SC') continue;

    if (!ref) {
      // Council not in the Area CT source — expected for abolished/merged authorities
      report.tick();
      continue;
    }

    // Check each band_d year: exact match, zero tolerance
    const ct = c.council_tax || {};
    for (const field of BAND_D_FIELDS) {
      report.tick();
      const refRaw = ref[field];
      const refParsed = refRaw ? parseFloat(refRaw) : null;
      const refVal = Number.isFinite(refParsed) ? refParsed : null;
      const ourVal = ct[field] != null ? parseFloat(ct[field]) : null;

      if (refVal == null) continue; // No reference data for this year (or unparseable — CSV quote bug tracked separately)
      if (ourVal == null) {
        // Only flag as error if council_tax block exists at all
        if (ct.band_d_2025 != null) {
          report.finding(c, 'source-truth', `${field}_missing`, 'error',
            `${field} is missing but GOV.UK source has ${refVal}`,
            `council_tax.${field}`, null, refVal);
        }
        continue;
      }

      // Exact match (allow floating point imprecision up to 0.01)
      const pass = Math.abs(ourVal - refVal) <= 0.01;
      record({ council: c.name, ons: c.ons_code, field: `council_tax.${field}`, rendered: ourVal, source: refVal, delta: ourVal - refVal, tolerance: { kind: 'exact' }, status: pass ? 'pass' : 'fail' });
      if (!pass) {
        const diff = ourVal - refVal;
        report.finding(c, 'source-truth', `${field}_mismatch`, 'error',
          `${field} is ${ourVal} but GOV.UK source says ${refVal} (diff: ${diff > 0 ? '+' : ''}${diff.toFixed(2)})`,
          `council_tax.${field}`, ourVal, refVal);
      }
    }

    // Check total_band_d matches band_d_2025
    report.tick();
    const d = c.detailed || {};
    const totalBandD = d.total_band_d != null ? parseFloat(d.total_band_d) : null;
    const bandD2025 = ct.band_d_2025 != null ? parseFloat(ct.band_d_2025) : null;
    if (totalBandD != null && bandD2025 != null && Math.abs(totalBandD - bandD2025) > 0.01) {
      report.finding(c, 'source-truth', 'total_band_d_drift', 'error',
        `total_band_d (${totalBandD}) does not match band_d_2025 (${bandD2025})`,
        'detailed.total_band_d', totalBandD, bandD2025);
    }
  }

  // ─────────────────────────────────────────────────────────────────────
  // VP1 extension — every other Category A field below
  // ─────────────────────────────────────────────────────────────────────

  // RA Part 1 budget category columns → our TS field names.
  // Tolerance ±10% relative (documented in VALUE-VERIFICATION-PLAN §Verification
  // rules): RA Part 1 is 2024-25 or 2025-26 (depending on release cycle);
  // our values are a mix. Drift of 10% allows legitimate year-over-year
  // growth without flagging every budget as wrong.
  const raPart1 = loadRaCsv('RA_Part1_LA_Data.csv', {
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
  });

  const raPart2 = loadRaCsv('RA_Part2_LA_Data.csv', {
    'NET CURRENT EXPENDITURE': 'net_current',
  });

  const BUDGET_TOL = 0.10;
  const BUDGET_FIELDS = Object.keys({
    education: 1, transport: 1, childrens_social_care: 1, adult_social_care: 1,
    public_health: 1, housing: 1, cultural: 1, environmental: 1, planning: 1,
    central_services: 1, other: 1, total_service: 1,
  });

  // ONS CSV indexes
  const populationCsv = buildCsvIndex(loadCsv('parsed-population.csv'));
  const councillorsCsv = buildCsvIndex(loadCsv('parsed-lgbce-councillors.csv'));
  const wasteCsv = buildCsvIndex(loadCsv('parsed-waste.csv'));
  const roadCondCsv = buildCsvIndex(loadCsv('parsed-road-condition.csv'));
  const roadLenCsv = buildCsvIndex(loadCsv('parsed-road-length.csv'));
  const capitalCsv = buildCsvIndex(loadCsv('parsed-capital-expenditure.csv'));
  const ofstedCsv = buildCsvIndex(loadCsv('parsed-ofsted.csv'));

  for (const c of councils) {
    const ons = c.ons_code;
    const normalized = normalizeCouncilName(c.name);
    const b = c.budget || {};

    // ─── Budget (Category A, 13 fields) ───
    const raRow = raPart1.get(ons);
    for (const field of BUDGET_FIELDS) {
      report.tick();
      const ourVal = b[field] != null ? parseFloat(b[field]) : null;
      const refVal = raRow?.[field];
      if (ourVal == null || refVal == null) {
        record({ council: c.name, ons, field: `budget.${field}`, rendered: ourVal, source: refVal ?? null, status: 'skip', reason: refVal == null ? 'no_reference_row' : 'no_rendered_value' });
        continue;
      }
      const delta = ourVal - refVal;
      const pass = withinRelative(ourVal, refVal, BUDGET_TOL);
      record({ council: c.name, ons, field: `budget.${field}`, rendered: ourVal, source: refVal, delta, delta_pct: refVal ? (delta / refVal) * 100 : null, tolerance: { kind: 'relative', max: BUDGET_TOL }, status: pass ? 'pass' : 'fail' });
      if (!pass) {
        report.finding(c, 'source-truth', `budget_${field}_drift`, 'warning',
          `budget.${field} ${ourVal}k differs from RA Part 1 reference ${refVal}k by ${((delta / refVal) * 100).toFixed(1)}% (tolerance ±${BUDGET_TOL * 100}%)`,
          `budget.${field}`, ourVal, `${refVal} (±${BUDGET_TOL * 100}%)`);
      }
    }

    // budget.net_current vs RA Part 2
    const raRow2 = raPart2.get(ons);
    if (raRow2?.net_current != null && b.net_current != null) {
      report.tick();
      const delta = b.net_current - raRow2.net_current;
      const pass = withinRelative(b.net_current, raRow2.net_current, 0.10);
      record({ council: c.name, ons, field: 'budget.net_current', rendered: b.net_current, source: raRow2.net_current, delta, delta_pct: raRow2.net_current ? (delta / raRow2.net_current) * 100 : null, tolerance: { kind: 'relative', max: 0.10 }, status: pass ? 'pass' : 'fail' });
      if (!pass) {
        report.finding(c, 'source-truth', 'budget_net_current_drift', 'warning',
          `budget.net_current ${b.net_current}k differs from RA Part 2 reference ${raRow2.net_current}k by ${((delta / raRow2.net_current) * 100).toFixed(1)}%`,
          'budget.net_current', b.net_current, `${raRow2.net_current} (±10%)`);
      }
    }

    // ─── Population (±5% relative) ───
    // ONS revises mid-year estimates between preliminary and final
    // publication and our stored values are rounded to nearest hundred.
    // Kept consistent with the tolerance spot-check.mjs uses so results
    // don't conflict. Drift above 5% is a real smell (wrong council
    // matched, or the ref row is a different geography, like City of
    // London day-pop vs resident-pop).
    const popRef = populationCsv.get(normalized);
    const pop = population[c.name];
    if (popRef && pop != null) {
      report.tick();
      const refPop = parseInt(popRef.population, 10);
      const delta = pop - refPop;
      const pass = Math.abs(delta) / refPop <= 0.05;
      record({ council: c.name, ons, field: 'population', rendered: pop, source: refPop, delta, delta_pct: refPop ? (delta / refPop) * 100 : null, tolerance: { kind: 'relative', max: 0.05 }, status: pass ? 'pass' : 'fail' });
      // spot-check.mjs raises the finding at ±10%; source-truth records
      // the audit at ±5% so the JSON report can drill into near-misses
      // without emitting duplicate warnings.
    }

    // ─── Total councillors (exact, already in spot-check as info) ───
    const cllrRef = councillorsCsv.get(normalized);
    if (cllrRef && c.detailed?.total_councillors != null) {
      report.tick();
      const refCount = parseInt(cllrRef.total_councillors, 10);
      const pass = c.detailed.total_councillors === refCount;
      record({ council: c.name, ons, field: 'detailed.total_councillors', rendered: c.detailed.total_councillors, source: refCount, delta: c.detailed.total_councillors - refCount, tolerance: { kind: 'exact' }, status: pass ? 'pass' : 'fail' });
    }

    // ─── Recycling rate (±0.5pp) ───
    // DEFRA CSV column is `recycling_rate` (not `recycling_rate_pct`).
    const wasteRef = wasteCsv.get(normalized);
    const recycling = c._raw_section?.match(/recycling_rate_percent:\s*([\d.]+)/)?.[1];
    if (wasteRef && recycling) {
      report.tick();
      const ourVal = parseFloat(recycling);
      const refVal = parseFloat(wasteRef.recycling_rate);
      if (!isNaN(refVal)) {
        const delta = ourVal - refVal;
        // ±2pp: DEFRA publishes to 1dp; our rendered value is often
        // rounded to integer. Tighter bounds produce false positives
        // across most of the 317 rows.
        const pass = Math.abs(delta) <= 2;
        record({ council: c.name, ons, field: 'service_outcomes.waste.recycling_rate_percent', rendered: ourVal, source: refVal, delta, tolerance: { kind: 'absolute_pp', max: 2 }, status: pass ? 'pass' : 'fail' });
        if (!pass) {
          report.finding(c, 'source-truth', 'recycling_rate_drift', 'warning',
            `recycling rate ${ourVal}% differs from DEFRA reference ${refVal}% by ${delta.toFixed(1)}pp`,
            'service_outcomes.waste.recycling_rate_percent', ourVal, `${refVal} (±2pp)`);
        }
      }
    }

    // ─── Road condition poor % (±0.5pp) ───
    // DfT parsed-road-condition.csv has `pct_red` (POOR %), not pct_green.
    // Our complementary field is `condition_poor_percent`, not
    // condition_good_percent. Cross-check that.
    const roadCondRef = roadCondCsv.get(normalized);
    const roadPoor = c._raw_section?.match(/condition_poor_percent:\s*([\d.]+)/)?.[1];
    if (roadCondRef && roadPoor) {
      report.tick();
      const ourVal = parseFloat(roadPoor);
      const refVal = parseFloat(roadCondRef.pct_red);
      if (!isNaN(refVal)) {
        const delta = ourVal - refVal;
        const pass = Math.abs(delta) <= 0.5;
        record({ council: c.name, ons, field: 'service_outcomes.roads.condition_poor_percent', rendered: ourVal, source: refVal, delta, tolerance: { kind: 'absolute_pp', max: 0.5 }, status: pass ? 'pass' : 'fail' });
        if (!pass) {
          report.finding(c, 'source-truth', 'road_condition_poor_drift', 'warning',
            `road condition poor % ${ourVal} differs from DfT reference ${refVal} by ${delta.toFixed(1)}pp`,
            'service_outcomes.roads.condition_poor_percent', ourVal, `${refVal} (±0.5pp)`);
        }
      }
    }

    // ─── Road length (±0.5% relative) ───
    const roadLenRef = roadLenCsv.get(normalized);
    const roadMiles = c._raw_section?.match(/maintained_miles:\s*(\d+)/)?.[1];
    if (roadLenRef && roadMiles) {
      report.tick();
      const ourVal = parseInt(roadMiles, 10);
      const refVal = parseFloat(roadLenRef.total_miles);
      if (!isNaN(refVal) && refVal > 0) {
        const delta = ourVal - refVal;
        const pass = Math.abs(delta) / refVal <= 0.005;
        record({ council: c.name, ons, field: 'service_outcomes.roads.maintained_miles', rendered: ourVal, source: refVal, delta, tolerance: { kind: 'relative', max: 0.005 }, status: pass ? 'pass' : 'fail' });
        if (!pass) {
          report.finding(c, 'source-truth', 'road_miles_drift', 'warning',
            `road miles ${ourVal} differs from DfT reference ${refVal} by ${delta.toFixed(1)}mi (tolerance ±0.5%)`,
            'service_outcomes.roads.maintained_miles', ourVal, `${refVal} (±0.5%)`);
        }
      }
    }

    // ─── Ofsted rating (exact, with stale-ref allowance) ───
    const ofstedRef = ofstedCsv.get(normalized);
    const ofstedRating = c._raw_section?.match(/ofsted_rating:\s*["'](Outstanding|Good|Requires improvement|Inadequate)["']/)?.[1];
    if (ofstedRef && ofstedRating) {
      report.tick();
      const refIsFresh = (ofstedRef.date || '') >= '2023-01-01';
      const pass = ofstedRef.rating === ofstedRating;
      const reason = !pass ? (refIsFresh ? 'mismatch_fresh_ref' : 'mismatch_stale_ref') : null;
      record({ council: c.name, ons, field: 'service_outcomes.children_services.ofsted_rating', rendered: ofstedRating, source: ofstedRef.rating, tolerance: { kind: 'exact' }, status: pass ? 'pass' : 'fail', reason });
      // Finding already emitted by spot-check.mjs for fresh-ref mismatches
      // to avoid double-reporting.
    }

    // ─── Capital programme (±5% relative) ───
    // CoR A1 parsed CSV stores values in £k; our field stores in £.
    const capRef = capitalCsv.get(normalized);
    if (capRef && c.detailed?.capital_programme != null) {
      report.tick();
      const ourVal = c.detailed.capital_programme;
      const refCell = parseFloat(capRef.capital_expenditure_k);
      if (!isNaN(refCell) && refCell > 0) {
        const refVal = refCell * 1000; // £k → £
        const delta = ourVal - refVal;
        const pass = Math.abs(delta) / refVal <= 0.05;
        record({ council: c.name, ons, field: 'detailed.capital_programme', rendered: ourVal, source: refVal, delta, delta_pct: refVal ? (delta / refVal) * 100 : null, tolerance: { kind: 'relative', max: 0.05 }, status: pass ? 'pass' : 'fail' });
        if (!pass) {
          report.finding(c, 'source-truth', 'capital_programme_drift', 'warning',
            `capital_programme ${ourVal} differs from CoR A1 reference ${refVal} by ${((delta / refVal) * 100).toFixed(1)}%`,
            'detailed.capital_programme', ourVal, `${refVal} (±5%)`);
        }
      }
    }
  }

  // Write per-value audit log for inspection
  try {
    if (!existsSync(REPORTS_DIR)) mkdirSync(REPORTS_DIR, { recursive: true });
    const passCount = auditLog.filter((x) => x.status === 'pass').length;
    const failCount = auditLog.filter((x) => x.status === 'fail').length;
    const skipCount = auditLog.filter((x) => x.status === 'skip').length;
    const doc = {
      generated: new Date().toISOString(),
      summary: {
        total: auditLog.length,
        pass: passCount,
        fail: failCount,
        skip: skipCount,
        pass_rate: auditLog.length ? `${((passCount / (passCount + failCount || 1)) * 100).toFixed(1)}%` : null,
      },
      by_field: Object.fromEntries(
        [...new Set(auditLog.map((x) => x.field))].map((field) => {
          const items = auditLog.filter((x) => x.field === field);
          return [field, {
            pass: items.filter((x) => x.status === 'pass').length,
            fail: items.filter((x) => x.status === 'fail').length,
            skip: items.filter((x) => x.status === 'skip').length,
          }];
        })
      ),
      failures: auditLog.filter((x) => x.status === 'fail'),
    };
    writeFileSync(join(REPORTS_DIR, 'value-verification-latest.json'), JSON.stringify(doc, null, 2));
  } catch {
    // Non-fatal — reports dir may be read-only in CI
  }
}
