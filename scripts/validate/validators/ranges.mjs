/**
 * ranges.mjs — Bounds/sanity checks on individual values.
 * Catches values that are technically valid types but semantically impossible.
 */

export function validate(councils, population, report) {
  for (const c of councils) {
    const d = c.detailed || {};
    const pop = population[c.name];

    // -- Council Tax Band D range --
    const years = ['band_d_2025', 'band_d_2024', 'band_d_2023', 'band_d_2022', 'band_d_2021'];
    for (const year of years) {
      const val = c.council_tax?.[year];
      report.tick();
      if (val != null && typeof val === 'number') {
        if (val < 50 || val > 3000) {
          report.finding(c, 'ranges', 'council_tax_band_d_range', 'error',
            `${year} (${val}) outside expected range 50-3000`,
            `council_tax.${year}`, val, '50-3000');
        }
      }
    }

    // -- Council tax year-over-year swing --
    for (let i = 0; i < years.length - 1; i++) {
      const curr = c.council_tax?.[years[i]];
      const prev = c.council_tax?.[years[i + 1]];
      report.tick();
      if (curr != null && prev != null && typeof curr === 'number' && typeof prev === 'number' && prev > 0) {
        const change = Math.abs((curr - prev) / prev * 100);
        if (change > 20) {
          report.finding(c, 'ranges', 'council_tax_yoy_swing', 'warning',
            `${years[i]} to ${years[i + 1]}: ${change.toFixed(1)}% swing (${prev} -> ${curr})`,
            `council_tax.${years[i]}`, change, '<=20% year-over-year');
        }
      }
    }

    // -- Budget categories non-negative --
    const budgetCats = [
      'education', 'transport', 'childrens_social_care', 'adult_social_care',
      'public_health', 'housing', 'cultural', 'environmental', 'planning',
      'central_services', 'other',
    ];
    for (const cat of budgetCats) {
      const val = c.budget?.[cat];
      report.tick();
      if (val != null && typeof val === 'number') {
        // Budget in thousands — negative is possible for some categories (income) but flag large negatives
        if (val < -500000) { // < -500M
          report.finding(c, 'ranges', 'budget_category_extreme_negative', 'warning',
            `budget.${cat} = ${val} (thousands) is extremely negative`,
            `budget.${cat}`, val, '>= -500000');
        }
        if (val > 5000000) { // > 5B
          report.finding(c, 'ranges', 'budget_category_extreme', 'warning',
            `budget.${cat} = ${val} (thousands) exceeds 5B`,
            `budget.${cat}`, val, '<= 5000000');
        }
      }
    }

    // -- Budget total --
    report.tick();
    const totalService = c.budget?.total_service;
    if (totalService != null && typeof totalService === 'number') {
      if (totalService <= 0) {
        report.finding(c, 'ranges', 'budget_total_nonpositive', 'error',
          `total_service budget is ${totalService} (expected positive)`,
          'budget.total_service', totalService, '> 0');
      }
    }

    // -- CEO salary --
    report.tick();
    if (d.chief_executive_salary != null && typeof d.chief_executive_salary === 'number') {
      if (d.chief_executive_salary < 50000 || d.chief_executive_salary > 500000) {
        report.finding(c, 'ranges', 'ceo_salary_range', 'warning',
          `CEO salary ${d.chief_executive_salary} outside expected range 50k-500k`,
          'detailed.chief_executive_salary', d.chief_executive_salary, '50000-500000');
      }
    }

    // -- CEO total remuneration >= salary --
    report.tick();
    if (d.chief_executive_salary != null && d.chief_executive_total_remuneration != null
        && typeof d.chief_executive_salary === 'number'
        && typeof d.chief_executive_total_remuneration === 'number') {
      if (d.chief_executive_total_remuneration < d.chief_executive_salary) {
        report.finding(c, 'ranges', 'ceo_remuneration_less_than_salary', 'error',
          `Total remuneration (${d.chief_executive_total_remuneration}) < salary (${d.chief_executive_salary})`,
          'detailed.chief_executive_total_remuneration', d.chief_executive_total_remuneration,
          `>= ${d.chief_executive_salary}`);
      }
      if (d.chief_executive_total_remuneration > 1000000) {
        report.finding(c, 'ranges', 'ceo_remuneration_extreme', 'warning',
          `Total remuneration ${d.chief_executive_total_remuneration} exceeds 1M`,
          'detailed.chief_executive_total_remuneration', d.chief_executive_total_remuneration, '<= 1000000');
      }
    }

    // -- Councillor basic allowance --
    report.tick();
    if (d.councillor_basic_allowance != null && typeof d.councillor_basic_allowance === 'number') {
      if (d.councillor_basic_allowance < 500 || d.councillor_basic_allowance > 30000) {
        report.finding(c, 'ranges', 'councillor_allowance_range', 'warning',
          `Councillor basic allowance ${d.councillor_basic_allowance} outside expected range 500-30000`,
          'detailed.councillor_basic_allowance', d.councillor_basic_allowance, '500-30000');
      }
    }

    // -- Staff FTE --
    report.tick();
    if (d.staff_fte != null && typeof d.staff_fte === 'number') {
      if (d.staff_fte < 10 || d.staff_fte > 50000) {
        report.finding(c, 'ranges', 'staff_fte_range', 'warning',
          `Staff FTE ${d.staff_fte} outside expected range 10-50000`,
          'detailed.staff_fte', d.staff_fte, '10-50000');
      }
    }

    // -- Population --
    report.tick();
    if (pop != null) {
      if (pop < 1000 || pop > 9000000) {
        report.finding(c, 'ranges', 'population_range', 'error',
          `Population ${pop} outside expected range 1000-9000000`,
          'population', pop, '1000-9000000');
      }
    }

    // -- Waste percentages --
    report.tick();
    if (d._wastePercentages && d._wastePercentages.length > 0) {
      for (const pct of d._wastePercentages) {
        if (pct < 0 || pct > 100) {
          report.finding(c, 'ranges', 'waste_percentage_invalid', 'error',
            `Waste percentage ${pct} outside 0-100`,
            'detailed.waste_destinations.percentage', pct, '0-100');
        }
      }
      const sum = d._wastePercentages.reduce((a, b) => a + b, 0);
      if (sum < 90 || sum > 110) {
        report.finding(c, 'ranges', 'waste_percentages_sum', 'warning',
          `Waste percentages sum to ${sum.toFixed(1)}% (expected ~100%)`,
          'detailed.waste_destinations', sum, '90-110');
      }
    }

    // -- KPI statuses --
    report.tick();
    if (d._kpiStatuses) {
      const validStatuses = new Set(['green', 'amber', 'red']);
      for (const status of d._kpiStatuses) {
        if (!validStatuses.has(status)) {
          report.finding(c, 'ranges', 'kpi_status_invalid', 'error',
            `KPI status "${status}" not in [green, amber, red]`,
            'detailed.performance_kpis.status', status, 'green|amber|red');
        }
      }
    }

    // -- Supplier annual spend --
    report.tick();
    if (d._has?.top_suppliers) {
      const spendRe = /annual_spend: ([\d.]+)/g;
      let sm;
      while ((sm = spendRe.exec(c._raw_section)) !== null) {
        const spend = parseFloat(sm[1]);
        if (spend <= 0) {
          report.finding(c, 'ranges', 'supplier_spend_nonpositive', 'error',
            `Supplier annual_spend ${spend} is not positive`,
            'detailed.top_suppliers.annual_spend', spend, '> 0');
        }
        if (spend > 500000000) {
          report.finding(c, 'ranges', 'supplier_spend_extreme', 'warning',
            `Supplier annual_spend ${spend} exceeds 500M`,
            'detailed.top_suppliers.annual_spend', spend, '<= 500000000');
        }
      }
    }
  }
}
