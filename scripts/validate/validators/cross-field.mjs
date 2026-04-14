/**
 * cross-field.mjs — Inter-field logical consistency checks.
 * Catches contradictions between related fields within a council.
 */

export function validate(councils, population, report) {
  for (const c of councils) {
    const d = c.detailed || {};
    const pop = population[c.name];

    // -- Budget category sum vs total_service --
    report.tick();
    const budgetCats = [
      'education', 'transport', 'childrens_social_care', 'adult_social_care',
      'public_health', 'housing', 'cultural', 'environmental', 'planning',
      'central_services', 'other',
    ];
    const totalService = c.budget?.total_service;
    if (totalService != null && typeof totalService === 'number' && totalService !== 0) {
      let catSum = 0;
      let catCount = 0;
      for (const cat of budgetCats) {
        const val = c.budget?.[cat];
        if (val != null && typeof val === 'number') {
          catSum += val;
          catCount++;
        }
      }
      if (catCount > 0) {
        const diff = Math.abs(catSum - totalService) / Math.abs(totalService);
        if (diff > 0.05) {
          report.finding(c, 'cross-field', 'budget_sum_mismatch', 'error',
            `Budget categories sum (${catSum}) differs from total_service (${totalService}) by ${(diff * 100).toFixed(1)}%`,
            'budget.total_service', totalService, `~${catSum} (sum of categories)`);
        }
      }
    }

    // -- Per-capita spending sanity --
    report.tick();
    if (totalService != null && typeof totalService === 'number' && pop != null && pop > 0) {
      const perCapita = (totalService * 1000) / pop; // Convert from thousands
      if (perCapita < 100 || perCapita > 10000) {
        report.finding(c, 'cross-field', 'per_capita_spend_extreme', 'warning',
          `Per-capita spend ${perCapita.toFixed(0)} outside expected range 100-10000`,
          'budget.total_service', totalService, `100-10000 per capita (pop: ${pop})`);
      }
    }

    // -- District councils should NOT have waste_destinations --
    report.tick();
    if (c.type === 'SD' && d._has?.waste_destinations) {
      report.finding(c, 'cross-field', 'district_has_waste_destinations', 'error',
        `District council should not have waste_destinations (they handle collection, not disposal)`,
        'detailed.waste_destinations', true, 'absent for SD type');
    }

    // -- total_councillors vs councillor_allowances_detail count --
    // Detail can be a subset (top earners), so only flag if detail count EXCEEDS total
    report.tick();
    if (d.total_councillors != null && typeof d.total_councillors === 'number'
        && d._counts?.councillor_allowances_detail > 0) {
      const detailCount = d._counts.councillor_allowances_detail;
      if (detailCount > d.total_councillors + 5) {
        report.finding(c, 'cross-field', 'councillor_count_exceeds_total', 'warning',
          `Allowances detail has ${detailCount} entries but total_councillors is only ${d.total_councillors}`,
          'detailed.councillor_allowances_detail', detailCount, `<= ${d.total_councillors}`);
      }
    }

    // -- Sum of councillor_allowances_detail totals vs total_allowances_cost --
    // Only warn (not error) since detail may be a subset (top earners) and the sum will undershoot.
    // Flag only when detail sum EXCEEDS total cost (impossible) or when detail count is full
    // and sum is ≥ 1.5x or ≤ 0.5x the total cost (likely a unit error or massive omission).
    report.tick();
    const detailSum = d._sums?.councillor_allowances_detail_total;
    const totalCost = d.total_allowances_cost;
    if (detailSum != null && totalCost != null && typeof totalCost === 'number' && totalCost > 0) {
      const ratio = detailSum / totalCost;
      const detailCount = d._counts?.councillor_allowances_detail || 0;
      const isFullList = d.total_councillors && detailCount >= d.total_councillors * 0.9;

      if (detailSum > totalCost * 1.05) {
        // Detail sum exceeds total cost — impossible
        report.finding(c, 'cross-field', 'allowances_sum_exceeds_total', 'error',
          `Sum of individual allowances (£${Math.round(detailSum).toLocaleString()}) exceeds total_allowances_cost (£${Math.round(totalCost).toLocaleString()})`,
          'detailed.total_allowances_cost', totalCost, `>= ${Math.round(detailSum)}`);
      } else if (isFullList && (ratio < 0.7 || ratio > 1.3)) {
        // Detail covers ~all councillors but sum is wildly off
        report.finding(c, 'cross-field', 'allowances_sum_inconsistent', 'warning',
          `Sum of individual allowances (£${Math.round(detailSum).toLocaleString()}) differs from total_allowances_cost (£${Math.round(totalCost).toLocaleString()}) by ${Math.round(Math.abs(1 - ratio) * 100)}% (full councillor list)`,
          'detailed.total_allowances_cost', totalCost, `~${Math.round(detailSum)}`);
      }
    }

    // -- budget_gap should be positive if present --
    report.tick();
    if (d.budget_gap != null && typeof d.budget_gap === 'number') {
      if (d.budget_gap < 0) {
        report.finding(c, 'cross-field', 'budget_gap_negative', 'warning',
          `budget_gap (${d.budget_gap}) is negative`,
          'detailed.budget_gap', d.budget_gap, '>= 0');
      }
    }

    // -- savings_target should be positive if present --
    report.tick();
    if (d.savings_target != null && typeof d.savings_target === 'number') {
      if (d.savings_target < 0) {
        report.finding(c, 'cross-field', 'savings_target_negative', 'warning',
          `savings_target (${d.savings_target}) is negative`,
          'detailed.savings_target', d.savings_target, '>= 0');
      }
    }

    // -- Council tax requirement vs population * Band D (rough sanity) --
    report.tick();
    if (d.council_tax_requirement != null && typeof d.council_tax_requirement === 'number'
        && pop != null && c.council_tax?.band_d_2025 != null) {
      // Rough estimate: CTR ~ population * 0.45 * Band D (assuming ~45% are Band D equivalent)
      const roughEstimate = pop * 0.45 * c.council_tax.band_d_2025;
      const ratio = d.council_tax_requirement / roughEstimate;
      if (ratio < 0.2 || ratio > 5) {
        report.finding(c, 'cross-field', 'council_tax_requirement_implausible', 'warning',
          `council_tax_requirement (${d.council_tax_requirement}) vs rough estimate (${roughEstimate.toFixed(0)}) ratio is ${ratio.toFixed(2)}`,
          'detailed.council_tax_requirement', d.council_tax_requirement,
          `Roughly ${roughEstimate.toFixed(0)} (pop * 0.45 * Band D)`);
      }
    }

    // -- Cabinet size 1-20 --
    report.tick();
    if (d._counts?.cabinet > 0) {
      if (d._counts.cabinet > 20) {
        report.finding(c, 'cross-field', 'cabinet_size_extreme', 'warning',
          `Cabinet has ${d._counts.cabinet} members (expected 1-20)`,
          'detailed.cabinet', d._counts.cabinet, '1-20');
      }
    }
  }
}
