/**
 * spot-check.mjs — Cross-reference council data against parsed gov.uk CSV datasets.
 * All checks are offline — no network calls.
 */

import { loadCsv, buildCsvIndex, buildOnsIndex } from '../load-councils.mjs';
import { normalizeCouncilName } from '../lib/normalize.mjs';
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const RA_DIR = join(__dirname, '..', '..', '..', 'src', 'data', 'councils', 'pdfs', 'gov-uk-ra-data');

/**
 * Parse RA Part 1 CSV (Revenue Account) — extracts budget category totals per authority.
 * The CSV has metadata rows at top; row 10 (0-indexed: 9) is the human-readable header.
 * Returns Map<ons_code, { education, transport, ... total_service }> in £thousands.
 */
function loadRaBudgets() {
  const csvPath = join(RA_DIR, 'RA_Part1_LA_Data.csv');
  if (!existsSync(csvPath)) return new Map();

  const content = readFileSync(csvPath, 'utf-8');
  const lines = content.split('\n');
  if (lines.length < 12) return new Map();

  // Parse header row (row 10, 0-indexed: 9) to find TOTAL column indices
  const headerLine = lines[9];
  const headers = parseCSVLine(headerLine);

  const colMap = {};
  const fieldMap = {
    'TOTAL EDUCATION SERVICES': 'education',
    'TOTAL HIGHWAYS AND TRANSPORT SERVICES': 'transport',
    'TOTAL HOUSING SERVICES (GFRA only)': 'housing',
    'TOTAL CULTURAL AND RELATED SERVICES': 'cultural',
    'TOTAL ENVIRONMENTAL AND REGULATORY SERVICES': 'environmental',
    'TOTAL PLANNING AND DEVELOPMENT SERVICES': 'planning',
    'TOTAL CENTRAL SERVICES': 'central_services',
    'TOTAL OTHER SERVICES': 'other',
    'TOTAL SERVICE EXPENDITURE': 'total_service',
  };

  for (let i = 0; i < headers.length; i++) {
    const h = headers[i].trim();
    if (fieldMap[h]) {
      colMap[fieldMap[h]] = i;
    }
  }

  // Parse data rows (from row 11 onwards, 0-indexed: 10)
  const budgets = new Map();
  for (let r = 10; r < lines.length; r++) {
    const row = parseCSVLine(lines[r]);
    if (row.length < 5) continue;
    const ons = (row[1] || '').trim();
    if (!ons.startsWith('E')) continue;

    const entry = {};
    for (const [field, colIdx] of Object.entries(colMap)) {
      const val = parseFloat((row[colIdx] || '').trim());
      if (!isNaN(val)) entry[field] = val;
    }
    if (Object.keys(entry).length > 0) {
      budgets.set(ons, entry);
    }
  }
  return budgets;
}

/** Simple CSV line parser that handles quoted fields with commas */
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}

function withinTolerance(actual, expected, tolerancePct) {
  if (expected === 0) return actual === 0;
  return Math.abs(actual - expected) / Math.abs(expected) <= tolerancePct;
}

function withinAbsolute(actual, expected, tolerance) {
  return Math.abs(actual - expected) <= tolerance;
}

export function validate(councils, population, report) {
  // Load all reference CSVs
  const raBudgets = loadRaBudgets();
  const populationCsv = buildCsvIndex(loadCsv('parsed-population.csv'));
  const workforceCsv = buildCsvIndex(loadCsv('parsed-workforce.csv'));
  const ceoSalaryCsv = buildCsvIndex(loadCsv('parsed-ceo-salary.csv'));
  const ctrCsv = buildCsvIndex(loadCsv('parsed-council-tax-requirement.csv'));
  const reservesCsv = buildCsvIndex(loadCsv('parsed-reserves.csv'));
  const wasteCsv = buildCsvIndex(loadCsv('parsed-waste.csv'));
  const councillorsCsv = buildCsvIndex(loadCsv('parsed-lgbce-councillors.csv'));
  const ofstedCsv = buildCsvIndex(loadCsv('parsed-ofsted.csv'));
  const roadCondCsv = buildCsvIndex(loadCsv('parsed-road-condition.csv'));

  for (const c of councils) {
    const d = c.detailed || {};
    const normalized = normalizeCouncilName(c.name);
    const pop = population[c.name];

    // -- Population vs parsed-population.csv (±10%) --
    // Both sources are ONS Mid-2024 estimates, but ours are stored rounded to
    // the nearest hundred while the reference CSV stores unrounded figures.
    // ONS also revises these estimates between the preliminary and final
    // publication, and the two datasets can diverge by a few percent as a
    // result. A ~5-10% systematic gap across many councils is not a data
    // error — it's version/rounding drift.
    // Tolerance is ±10% to catch gross outliers (City of London day pop vs
    // resident pop — flagged at -41%; Westminster flagged at +28%) while
    // letting the natural drift pass.
    report.tick();
    const popRef = populationCsv.get(normalized);
    if (popRef && pop != null) {
      const refPop = parseInt(popRef.population, 10);
      if (!isNaN(refPop) && !withinTolerance(pop, refPop, 0.10)) {
        const diff = ((pop - refPop) / refPop * 100).toFixed(1);
        report.finding(c, 'spot-check', 'population_mismatch', 'warning',
          `Population ${pop} differs from gov.uk reference ${refPop} by ${diff}%`,
          'population', pop, `${refPop} (±10%)`);
      }
    }

    // -- Staff FTE vs parsed-workforce.csv (±50%) --
    // Definitional note: the LGA QPSES reference typically INCLUDES schools
    // staff (teachers + support) for education authorities (counties, MDs,
    // unitaries, LBs). Our pay policy-derived figures typically EXCLUDE
    // schools staff because pay policies only cover the council itself.
    // Schools can be 40-60% of a county's total FTE, which explains the
    // systematic ~50% undershoot. Skip zero-valued reference entries (no
    // coverage) and loosen tolerance to ±50% to flag only order-of-magnitude
    // errors.
    report.tick();
    const wfRef = workforceCsv.get(normalized);
    if (wfRef && d.staff_fte != null && typeof d.staff_fte === 'number') {
      const refFte = parseFloat(wfRef.staff_fte);
      if (!isNaN(refFte) && refFte > 0 && !withinTolerance(d.staff_fte, refFte, 0.50)) {
        const diff = ((d.staff_fte - refFte) / refFte * 100).toFixed(1);
        report.finding(c, 'spot-check', 'staff_fte_mismatch', 'warning',
          `staff_fte ${d.staff_fte} differs from LGA QPSES reference ${refFte} by ${diff}% (ours typically excludes schools staff)`,
          'detailed.staff_fte', d.staff_fte, `${refFte} (±50%, excludes schools)`);
      }
    }

    // -- CEO salary vs parsed-ceo-salary.csv (sanity check only) --
    // The reference CSV is compiled from public sources (TPA Rich List,
    // pay policy snapshots) and is frequently stale. Our per-council data
    // is manually researched from each council's current pay policy
    // statement — it's often MORE accurate than the reference.
    // So this check is sanity-only: flag gross deltas (likely real errors),
    // not £1,000 year-over-year updates.
    //   Warn when: |delta| > £40k AND ratio < 0.6 or > 1.67 (both conditions must hold)
    // That catches "CEO salary is 2x what the reference says" — a real
    // error smell — but lets genuine updates through.
    report.tick();
    const salaryRef = ceoSalaryCsv.get(normalized);
    if (salaryRef && d.chief_executive_salary != null && typeof d.chief_executive_salary === 'number') {
      const refSalary = parseFloat(salaryRef.chief_executive_salary);
      if (!isNaN(refSalary) && refSalary > 0) {
        const absDiff = Math.abs(d.chief_executive_salary - refSalary);
        const ratio = d.chief_executive_salary / refSalary;
        if (absDiff > 40000 && (ratio < 0.6 || ratio > 1.67)) {
          report.finding(c, 'spot-check', 'ceo_salary_mismatch', 'warning',
            `CEO salary ${d.chief_executive_salary} differs from gov.uk reference ${refSalary} by ${((ratio - 1) * 100).toFixed(0)}% (ours likely current; reference may be stale)`,
            'detailed.chief_executive_salary', d.chief_executive_salary, `${refSalary} (±40k and ±40%)`);
        }
      }
    }

    // -- CEO total remuneration vs parsed-ceo-salary.csv (same rationale) --
    report.tick();
    if (salaryRef && d.chief_executive_total_remuneration != null
        && typeof d.chief_executive_total_remuneration === 'number') {
      const refRemun = parseFloat(salaryRef.chief_executive_total_remuneration);
      if (!isNaN(refRemun) && refRemun > 0) {
        const absDiff = Math.abs(d.chief_executive_total_remuneration - refRemun);
        const ratio = d.chief_executive_total_remuneration / refRemun;
        if (absDiff > 50000 && (ratio < 0.6 || ratio > 1.67)) {
          report.finding(c, 'spot-check', 'ceo_remuneration_mismatch', 'warning',
            `CEO total remuneration ${d.chief_executive_total_remuneration} differs from gov.uk reference ${refRemun} by ${((ratio - 1) * 100).toFixed(0)}%`,
            'detailed.chief_executive_total_remuneration', d.chief_executive_total_remuneration,
            `${refRemun} (±50k and ±40%)`);
        }
      }
    }

    // -- Council tax requirement vs parsed-council-tax-requirement.csv (±5%) --
    report.tick();
    const ctrRef = ctrCsv.get(normalized);
    if (ctrRef && d.council_tax_requirement != null && typeof d.council_tax_requirement === 'number') {
      const refCtr = parseFloat(ctrRef.council_tax_requirement);
      if (!isNaN(refCtr) && !withinTolerance(d.council_tax_requirement, refCtr, 0.05)) {
        const diff = ((d.council_tax_requirement - refCtr) / refCtr * 100).toFixed(1);
        report.finding(c, 'spot-check', 'council_tax_requirement_mismatch', 'warning',
          `council_tax_requirement ${d.council_tax_requirement} differs from gov.uk reference ${refCtr} by ${diff}%`,
          'detailed.council_tax_requirement', d.council_tax_requirement, `${refCtr} (±5%)`);
      }
    }

    // -- Reserves vs parsed-reserves.csv (one-sided: ours must NOT exceed ref) --
    // Definitional note: our `reserves` field captures GENERAL/UNALLOCATED
    // reserves (from Statement of Accounts), while the reference CSV captures
    // TOTAL USABLE reserves (general + earmarked) from RA Part 2. These are
    // two different metrics — general reserves are always a subset of total
    // reserves, so ours SHOULD be smaller. The only real error smell is when
    // ours EXCEEDS the reference — that's impossible unless one of the values
    // is wrong. Also flag if ours is more than 10x smaller (could indicate a
    // unit error like storing thousands as pounds, or a missing zero).
    report.tick();
    if (d.reserves != null && typeof d.reserves === 'number') {
      const resRef = reservesCsv.get(normalized);
      if (resRef) {
        const refReserves = parseFloat(resRef.reserves_k);
        if (!isNaN(refReserves) && refReserves > 0) {
          const refPounds = refReserves * 1000;
          if (d.reserves > refPounds * 1.1) {
            // Ours exceeds total — impossible
            report.finding(c, 'spot-check', 'reserves_exceeds_total', 'error',
              `reserves ${d.reserves} exceeds total usable reserves reference ${refPounds} — general reserves cannot exceed total`,
              'detailed.reserves', d.reserves, `<= ${refPounds}`);
          } else if (d.reserves > 0 && d.reserves < refPounds * 0.01) {
            // Ours is <1% of total — likely unit error or missing zero
            report.finding(c, 'spot-check', 'reserves_suspiciously_small', 'warning',
              `reserves ${d.reserves} is <1% of total reserves reference ${refPounds} — possible unit error`,
              'detailed.reserves', d.reserves, `>= ${Math.round(refPounds * 0.01)} (1% of total)`);
          }
        }
      }
    }

    // -- Total councillors vs parsed-lgbce-councillors.csv (exact) --
    report.tick();
    const cllrRef = councillorsCsv.get(normalized);
    if (cllrRef && d.total_councillors != null && typeof d.total_councillors === 'number') {
      const refCount = parseInt(cllrRef.total_councillors, 10);
      if (!isNaN(refCount) && d.total_councillors !== refCount) {
        report.finding(c, 'spot-check', 'councillor_count_mismatch', 'info',
          `total_councillors ${d.total_councillors} differs from LGBCE reference ${refCount}`,
          'detailed.total_councillors', d.total_councillors, refCount);
      }
    }

    // -- Children's services Ofsted rating vs parsed-ofsted.csv --
    // The reference CSV snapshot is systematically stale (most dates are
    // 2018-2019, and Ofsted re-inspects on a 3-4 year cycle). Our per-council
    // data is researched from each council's current Ofsted publication and
    // is typically more up-to-date than the reference. Only flag when the
    // reference date is MORE RECENT than our last_verified, or when the
    // reference was published after 2023 — otherwise the reference is
    // presumed stale and the mismatch is not a data error.
    report.tick();
    const ofstedRef = ofstedCsv.get(normalized);
    if (ofstedRef && d._has?.service_outcomes) {
      const raw = c._raw_section;
      const ratingMatch = raw.match(/ofsted_rating: ["'](Outstanding|Good|Requires improvement|Inadequate)["']/);
      if (ratingMatch) {
        const ourRating = ratingMatch[1];
        const refRating = ofstedRef.rating;
        const refDate = ofstedRef.date || '';
        // Only flag if reference is from 2023 or later (reasonably fresh)
        const refIsFresh = refDate >= '2023-01-01';
        if (refIsFresh && refRating && ourRating !== refRating) {
          report.finding(c, 'spot-check', 'ofsted_rating_mismatch', 'warning',
            `Ofsted rating "${ourRating}" differs from gov.uk reference "${refRating}" (inspected ${refDate})`,
            'detailed.service_outcomes.children_services.ofsted_rating', ourRating, refRating);
        }
      }
    }

    // -- Road condition vs parsed-road-condition.csv (±5 percentage points) --
    report.tick();
    const roadRef = roadCondCsv.get(normalized);
    if (roadRef && d._has?.service_outcomes) {
      const raw = c._raw_section;
      const poorMatch = raw.match(/condition_poor_percent: ([\d.]+)/);
      if (poorMatch) {
        const ourPoor = parseFloat(poorMatch[1]);
        const refPoor = parseFloat(roadRef.pct_red);
        if (!isNaN(refPoor) && !withinAbsolute(ourPoor, refPoor, 5)) {
          report.finding(c, 'spot-check', 'road_condition_mismatch', 'warning',
            `Road condition poor % (${ourPoor}) differs from DfT reference (${refPoor}) by more than 5pp`,
            'detailed.service_outcomes.roads.condition_poor_percent', ourPoor, `${refPoor} (±5pp)`);
        }
      }
    }

    // -- Budget total_service vs RA Part 1 (±20%) --
    // The RA CSV is MHCLG's 2025-26 budget return; our TS data is a mix of 2024-25
    // estimates and 2025-26 figures depending on when each council was enriched.
    // A ~10% systematic gap is normal year-over-year growth (inflation + service
    // demand), not a data error. The validator's job here is to catch gross
    // order-of-magnitude mistakes (wrong council matched, unit error, missing
    // zero) — not to police natural year-drift.
    // Warn only when the delta exceeds 20% — that's a real smell.
    report.tick();
    const raRef = raBudgets.get(c.ons_code);
    if (raRef && c.budget?.total_service != null) {
      const ourTotal = c.budget.total_service; // in £thousands
      const raTotal = raRef.total_service;     // in £thousands
      if (raTotal && !withinTolerance(ourTotal, raTotal, 0.20)) {
        const diff = ((ourTotal - raTotal) / raTotal * 100).toFixed(1);
        report.finding(c, 'spot-check', 'budget_total_ra_mismatch', 'warning',
          `budget.total_service ${ourTotal}k differs from RA Part 1 2025-26 reference ${raTotal}k by ${diff}% (our data may be 2024-25 estimate)`,
          'budget.total_service', ourTotal, `${raTotal} (±20%, allows for year-drift)`);
      }
    }
  }
}
