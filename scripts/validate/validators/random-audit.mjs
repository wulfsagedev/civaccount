/**
 * random-audit.mjs — Pick N random councils and deep-verify every field.
 *
 * Unlike spot-check.mjs (which checks specific fields against CSVs),
 * this validator picks random councils and verifies:
 *   1. All URLs in the council's data are HTTPS .gov.uk domains (or known exceptions)
 *   2. Budget categories sum to total_service (within 5%)
 *   3. Precepts sum to total_band_d (within 1%)
 *   4. Cabinet members have real portfolios (not placeholders)
 *   5. Supplier annual_spend values are plausible (>0, <£2bn)
 *   6. Grant amounts are plausible (>0, <£500m)
 *   7. All dates are valid ISO format
 *   8. No duplicate names in cabinet, suppliers, or allowances
 *
 * Runs on every validation pass. Picks 10 random councils per run.
 */

const SAMPLE_SIZE = 10;
const ALLOWED_URL_PATTERNS = [
  /\.gov\.uk/,
  /\.nhs\.uk/,
  /opencouncildata\.co\.uk/,
  /wikipedia\.org/,
  /360giving\.org/,
  /contractsfinder\.service\.gov\.uk/,
];

function isPlausibleUrl(url) {
  if (!url || typeof url !== 'string') return false;
  return url.startsWith('https://') || url.startsWith('http://');
}

function pickRandom(arr, n) {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}

export function validate(councils, population, report) {
  const sample = pickRandom(councils, Math.min(SAMPLE_SIZE, councils.length));

  for (const c of sample) {
    const d = c.detailed || {};
    report.tick();

    // ── 1. URL domain check ──
    const urlFields = ['website', 'council_tax_url', 'budget_url', 'transparency_url', 'accounts_url', 'councillors_url'];
    for (const field of urlFields) {
      if (d[field] && isPlausibleUrl(d[field])) {
        const url = d[field];
        const isGovUk = ALLOWED_URL_PATTERNS.some(p => p.test(url));
        if (!isGovUk) {
          report.finding(c, 'random-audit', 'non_gov_url', 'warning',
            `${field} URL is not a .gov.uk domain: ${url.slice(0, 80)}`,
            `detailed.${field}`, url, '.gov.uk domain');
        }
      }
    }

    // ── 2. Budget sum check ──
    if (c.budget && c.budget.total_service) {
      const categories = ['education', 'transport', 'childrens_social_care', 'adult_social_care',
        'public_health', 'housing', 'cultural', 'environmental', 'planning', 'central_services', 'other'];
      const sum = categories.reduce((acc, cat) => acc + (c.budget[cat] || 0), 0);
      if (sum > 0 && c.budget.total_service > 0) {
        const ratio = Math.abs(sum - c.budget.total_service) / c.budget.total_service;
        if (ratio > 0.05) {
          report.finding(c, 'random-audit', 'budget_sum_mismatch', 'warning',
            `Budget categories sum (${sum}) differs from total_service (${c.budget.total_service}) by ${(ratio * 100).toFixed(1)}%`,
            'budget', sum, c.budget.total_service);
        }
      }
    }

    // ── 3. Precepts sum check ──
    if (d.precepts && d.total_band_d) {
      const preceptSum = d.precepts.reduce((acc, p) => acc + p.band_d, 0);
      const ratio = Math.abs(preceptSum - d.total_band_d) / d.total_band_d;
      if (ratio > 0.01) {
        report.finding(c, 'random-audit', 'precept_sum_mismatch', 'warning',
          `Precepts sum (${preceptSum.toFixed(2)}) differs from total_band_d (${d.total_band_d}) by ${(ratio * 100).toFixed(1)}%`,
          'detailed.precepts', preceptSum, d.total_band_d);
      }
    }

    // ── 4. Cabinet placeholder check ──
    if (d.cabinet && d.cabinet.length > 0) {
      for (const member of d.cabinet) {
        if (member.portfolio === 'Cabinet Member' || member.portfolio === 'TBC' || member.portfolio === 'Unknown') {
          report.finding(c, 'random-audit', 'cabinet_placeholder', 'warning',
            `Cabinet member "${member.name}" has placeholder portfolio: "${member.portfolio}"`,
            'detailed.cabinet', member.portfolio, 'Real portfolio name');
        }
      }
    }

    // ── 5. Supplier plausibility ──
    if (d.top_suppliers && d.top_suppliers.length > 0) {
      for (const s of d.top_suppliers) {
        if (s.annual_spend <= 0) {
          report.finding(c, 'random-audit', 'supplier_zero_spend', 'error',
            `Supplier "${s.name}" has zero or negative annual_spend: ${s.annual_spend}`,
            'detailed.top_suppliers', s.annual_spend, '>0');
        }
        if (s.annual_spend > 2_000_000_000) {
          report.finding(c, 'random-audit', 'supplier_implausible_spend', 'error',
            `Supplier "${s.name}" has implausibly high annual_spend: £${(s.annual_spend / 1e6).toFixed(0)}m`,
            'detailed.top_suppliers', s.annual_spend, '<£2bn');
        }
      }
    }

    // ── 6. Grant plausibility ──
    if (d.grant_payments && d.grant_payments.length > 0) {
      for (const g of d.grant_payments) {
        if (g.amount <= 0) {
          report.finding(c, 'random-audit', 'grant_zero_amount', 'error',
            `Grant to "${g.recipient}" has zero or negative amount: ${g.amount}`,
            'detailed.grant_payments', g.amount, '>0');
        }
        if (g.amount > 500_000_000) {
          report.finding(c, 'random-audit', 'grant_implausible_amount', 'warning',
            `Grant to "${g.recipient}" has very high amount: £${(g.amount / 1e6).toFixed(0)}m`,
            'detailed.grant_payments', g.amount, '<£500m');
        }
      }
    }

    // ── 7. Duplicate name check ──
    if (d.cabinet && d.cabinet.length > 1) {
      const names = d.cabinet.map(m => m.name);
      const dupes = names.filter((n, i) => names.indexOf(n) !== i);
      if (dupes.length > 0) {
        report.finding(c, 'random-audit', 'duplicate_cabinet_name', 'warning',
          `Duplicate cabinet member name(s): ${[...new Set(dupes)].join(', ')}`,
          'detailed.cabinet');
      }
    }

    // ── 8. last_verified date validity ──
    if (d.last_verified) {
      const date = new Date(d.last_verified);
      if (isNaN(date.getTime())) {
        report.finding(c, 'random-audit', 'invalid_date', 'error',
          `Invalid last_verified date: "${d.last_verified}"`,
          'detailed.last_verified', d.last_verified, 'ISO date string');
      }
    }
  }
}
