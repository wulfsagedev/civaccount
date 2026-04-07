/**
 * quality.mjs — Data quality checks.
 * Catches placeholder text, duplicates, format violations, stale data.
 */

const PLACEHOLDER_PATTERNS = [
  /^tbc$/i, /^t\.b\.c\.?$/i, /^n\/a$/i, /^unknown$/i, /^todo$/i,
  /^placeholder$/i, /^tbd$/i, /^pending$/i, /^not available$/i, /^none$/i,
];

const HTML_ENTITY_RE = /&(?:amp|lt|gt|quot|apos|nbsp|#\d+|#x[\da-f]+);/i;

const ONS_TYPE_PREFIX = {
  'SC': 'E10',
  'SD': 'E07',
  'MD': 'E08',
  'LB': 'E09',
  'UA': 'E06',
};

export function validate(councils, _population, report) {
  for (const c of councils) {
    const d = c.detailed || {};

    // -- Placeholder text in string fields --
    const stringFields = [
      ['detailed.chief_executive', d.chief_executive],
      ['detailed.council_leader', d.council_leader],
      ['detailed.website', d.website],
      ['detailed.last_verified', d.last_verified],
    ];
    for (const [path, val] of stringFields) {
      report.tick();
      if (val && typeof val === 'string') {
        for (const pattern of PLACEHOLDER_PATTERNS) {
          if (pattern.test(val.trim())) {
            report.finding(c, 'quality', 'placeholder_text', 'warning',
              `"${val}" in ${path} looks like placeholder text`,
              path, val, 'Actual data');
            break;
          }
        }
      }
    }

    // -- Cabinet portfolio placeholder --
    report.tick();
    if (d._cabinetPortfolios) {
      const placeholderPortfolios = d._cabinetPortfolios.filter(
        p => p === 'Cabinet Member' || p === 'Cabinet member'
      );
      if (placeholderPortfolios.length > 0) {
        report.finding(c, 'quality', 'cabinet_placeholder_portfolio', 'warning',
          `${placeholderPortfolios.length} cabinet member(s) with placeholder portfolio "Cabinet Member"`,
          'detailed.cabinet.portfolio', placeholderPortfolios.length,
          'Specific portfolio description');
      }
    }

    // -- Duplicate supplier names --
    report.tick();
    if (d._supplierNames && d._supplierNames.length > 0) {
      const seen = new Set();
      const dupes = new Set();
      for (const name of d._supplierNames) {
        const lower = name.toLowerCase();
        if (seen.has(lower)) dupes.add(name);
        seen.add(lower);
      }
      if (dupes.size > 0) {
        report.finding(c, 'quality', 'duplicate_suppliers', 'error',
          `Duplicate supplier names: ${[...dupes].join(', ')}`,
          'detailed.top_suppliers', [...dupes], 'Unique supplier names');
      }
    }

    // -- Duplicate cabinet names --
    report.tick();
    if (d._cabinetNames && d._cabinetNames.length > 0) {
      const seen = new Set();
      const dupes = new Set();
      for (const name of d._cabinetNames) {
        const lower = name.toLowerCase();
        if (seen.has(lower)) dupes.add(name);
        seen.add(lower);
      }
      if (dupes.size > 0) {
        report.finding(c, 'quality', 'duplicate_cabinet', 'error',
          `Duplicate cabinet member names: ${[...dupes].join(', ')}`,
          'detailed.cabinet', [...dupes], 'Unique cabinet names');
      }
    }

    // -- URLs must be .gov.uk --
    report.tick();
    if (d._urls) {
      for (const [field, url] of Object.entries(d._urls)) {
        if (url && typeof url === 'string' && url.startsWith('http')) {
          try {
            const hostname = new URL(url).hostname;
            // ModernGov and CMIS are legitimate council platforms
            const allowed = ['.gov.uk', '.police.uk', '.moderngov.co.uk', '.cmis.uk.com', '.moderngov.com', 'meetings.info'];
            const isAllowed = allowed.some(d => hostname.endsWith(d) || hostname.includes(d));
            if (!isAllowed) {
              report.finding(c, 'quality', 'non_gov_uk_url', 'error',
                `${field} URL "${url}" is not .gov.uk`,
                `detailed.${field}`, url, '.gov.uk domain');
            }
          } catch {
            report.finding(c, 'quality', 'invalid_url', 'error',
              `${field} URL "${url}" is malformed`,
              `detailed.${field}`, url, 'Valid URL');
          }
        }
      }
    }

    // -- ONS code format matches council type --
    report.tick();
    const expectedPrefix = ONS_TYPE_PREFIX[c.type];
    if (expectedPrefix && c.ons_code) {
      if (!c.ons_code.startsWith(expectedPrefix)) {
        report.finding(c, 'quality', 'ons_code_type_mismatch', 'error',
          `ONS code ${c.ons_code} doesn't match expected prefix ${expectedPrefix} for type ${c.type}`,
          'ons_code', c.ons_code, `${expectedPrefix}*`);
      }
    }

    // -- Empty arrays where data is expected --
    report.tick();
    const expectedArrays = ['cabinet', 'performance_kpis', 'documents'];
    for (const field of expectedArrays) {
      if (d._has?.[field] && d._counts?.[field] === 0) {
        report.finding(c, 'quality', 'empty_array', 'warning',
          `${field} is present but appears empty (0 items)`,
          `detailed.${field}`, 0, '> 0 items');
      }
    }

    // -- Stale last_verified --
    report.tick();
    if (d.last_verified && typeof d.last_verified === 'string') {
      const verified = new Date(d.last_verified);
      const now = new Date();
      const monthsAgo = (now - verified) / (1000 * 60 * 60 * 24 * 30);
      if (!isNaN(verified.getTime()) && monthsAgo > 12) {
        report.finding(c, 'quality', 'stale_last_verified', 'info',
          `last_verified "${d.last_verified}" is ${Math.round(monthsAgo)} months old`,
          'detailed.last_verified', d.last_verified, 'Within last 12 months');
      }
    }

    // -- Document years outside 2022-2026 --
    report.tick();
    if (d._docYears) {
      for (const year of d._docYears) {
        const y = parseInt(year.substring(0, 4), 10);
        if (!isNaN(y) && (y < 2022 || y > 2026)) {
          report.finding(c, 'quality', 'document_year_stale', 'info',
            `Document year "${year}" outside expected range 2022-2026`,
            'detailed.documents.year', year, '2022-2026');
        }
      }
    }

    // -- Salary bands not in ascending order --
    report.tick();
    if (d._salaryBands && d._salaryBands.length > 1) {
      // Extract lower bound from band strings like "£50,000 - £54,999"
      const bounds = d._salaryBands.map(b => {
        const m = b.replace(/[£,]/g, '').match(/(\d+)/);
        return m ? parseInt(m[1], 10) : 0;
      });
      let sorted = true;
      for (let i = 1; i < bounds.length; i++) {
        if (bounds[i] < bounds[i - 1]) { sorted = false; break; }
      }
      if (!sorted) {
        report.finding(c, 'quality', 'salary_bands_order', 'warning',
          `Salary bands are not in ascending order`,
          'detailed.salary_bands', d._salaryBands, 'Ascending order');
      }
    }

    // -- HTML entities in council name --
    report.tick();
    if (HTML_ENTITY_RE.test(c.name)) {
      report.finding(c, 'quality', 'html_entity_in_name', 'error',
        `Council name "${c.name}" contains HTML entities`,
        'name', c.name, 'Plain text');
    }

    // -- Supplier description = supplier name --
    report.tick();
    if (d._has?.top_suppliers) {
      const descRe = /name: ["']([^"']+)["'][^}]*?description: ["']([^"']+)["']/gs;
      let dm;
      const rawSection = c._raw_section;
      const supplierPart = rawSection.substring(rawSection.indexOf('top_suppliers:'));
      while ((dm = descRe.exec(supplierPart)) !== null) {
        if (dm[1].toLowerCase().trim() === dm[2].toLowerCase().trim()) {
          report.finding(c, 'quality', 'supplier_desc_equals_name', 'info',
            `Supplier "${dm[1]}" has description identical to name`,
            'detailed.top_suppliers.description', dm[2], 'Meaningful description');
        }
      }
    }
  }
}
