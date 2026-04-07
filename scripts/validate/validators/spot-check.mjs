/**
 * spot-check.mjs — Cross-reference council data against parsed gov.uk CSV datasets.
 * All checks are offline — no network calls.
 */

import { loadCsv, buildCsvIndex } from '../load-councils.mjs';
import { normalizeCouncilName } from '../lib/normalize.mjs';

function withinTolerance(actual, expected, tolerancePct) {
  if (expected === 0) return actual === 0;
  return Math.abs(actual - expected) / Math.abs(expected) <= tolerancePct;
}

function withinAbsolute(actual, expected, tolerance) {
  return Math.abs(actual - expected) <= tolerance;
}

export function validate(councils, population, report) {
  // Load all reference CSVs
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

    // -- Population vs parsed-population.csv (±5% — population.ts uses rounded values) --
    report.tick();
    const popRef = populationCsv.get(normalized);
    if (popRef && pop != null) {
      const refPop = parseInt(popRef.population, 10);
      if (!isNaN(refPop) && !withinTolerance(pop, refPop, 0.05)) {
        const diff = ((pop - refPop) / refPop * 100).toFixed(1);
        report.finding(c, 'spot-check', 'population_mismatch', 'warning',
          `Population ${pop} differs from gov.uk reference ${refPop} by ${diff}%`,
          'population', pop, `${refPop} (±5%)`);
      }
    }

    // -- Staff FTE vs parsed-workforce.csv (±5%) --
    report.tick();
    const wfRef = workforceCsv.get(normalized);
    if (wfRef && d.staff_fte != null && typeof d.staff_fte === 'number') {
      const refFte = parseFloat(wfRef.staff_fte);
      if (!isNaN(refFte) && !withinTolerance(d.staff_fte, refFte, 0.05)) {
        const diff = ((d.staff_fte - refFte) / refFte * 100).toFixed(1);
        report.finding(c, 'spot-check', 'staff_fte_mismatch', 'warning',
          `staff_fte ${d.staff_fte} differs from gov.uk reference ${refFte} by ${diff}%`,
          'detailed.staff_fte', d.staff_fte, `${refFte} (±5%)`);
      }
    }

    // -- CEO salary vs parsed-ceo-salary.csv (±£1000) --
    report.tick();
    const salaryRef = ceoSalaryCsv.get(normalized);
    if (salaryRef && d.chief_executive_salary != null && typeof d.chief_executive_salary === 'number') {
      const refSalary = parseFloat(salaryRef.chief_executive_salary);
      if (!isNaN(refSalary) && !withinAbsolute(d.chief_executive_salary, refSalary, 1000)) {
        report.finding(c, 'spot-check', 'ceo_salary_mismatch', 'warning',
          `CEO salary ${d.chief_executive_salary} differs from gov.uk reference ${refSalary}`,
          'detailed.chief_executive_salary', d.chief_executive_salary, `${refSalary} (±£1000)`);
      }
    }

    // -- CEO total remuneration vs parsed-ceo-salary.csv (±£1000) --
    report.tick();
    if (salaryRef && d.chief_executive_total_remuneration != null
        && typeof d.chief_executive_total_remuneration === 'number') {
      const refRemun = parseFloat(salaryRef.chief_executive_total_remuneration);
      if (!isNaN(refRemun) && !withinAbsolute(d.chief_executive_total_remuneration, refRemun, 1000)) {
        report.finding(c, 'spot-check', 'ceo_remuneration_mismatch', 'warning',
          `CEO total remuneration ${d.chief_executive_total_remuneration} differs from gov.uk reference ${refRemun}`,
          'detailed.chief_executive_total_remuneration', d.chief_executive_total_remuneration,
          `${refRemun} (±£1000)`);
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

    // -- Reserves vs parsed-reserves.csv (±10%) --
    report.tick();
    if (d.reserves != null && typeof d.reserves === 'number') {
      const resRef = reservesCsv.get(normalized);
      if (resRef) {
        const refReserves = parseFloat(resRef.reserves_k);
        // Reference is in thousands, our data is in pounds
        if (!isNaN(refReserves)) {
          const refPounds = refReserves * 1000;
          if (!withinTolerance(d.reserves, refPounds, 0.10)) {
            const diff = ((d.reserves - refPounds) / refPounds * 100).toFixed(1);
            report.finding(c, 'spot-check', 'reserves_mismatch', 'warning',
              `reserves ${d.reserves} differs from gov.uk reference ${refPounds} by ${diff}%`,
              'detailed.reserves', d.reserves, `${refPounds} (±10%)`);
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
    report.tick();
    const ofstedRef = ofstedCsv.get(normalized);
    if (ofstedRef && d._has?.service_outcomes) {
      // We can check if the council has children_services in raw section
      const raw = c._raw_section;
      const ratingMatch = raw.match(/ofsted_rating: ["'](Outstanding|Good|Requires improvement|Inadequate)["']/);
      if (ratingMatch) {
        const ourRating = ratingMatch[1];
        const refRating = ofstedRef.rating;
        if (refRating && ourRating !== refRating) {
          report.finding(c, 'spot-check', 'ofsted_rating_mismatch', 'info',
            `Ofsted rating "${ourRating}" differs from gov.uk reference "${refRating}"`,
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
  }
}
