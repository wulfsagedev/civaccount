/**
 * load-councils.mjs — Load council data from TS source files via regex parsing,
 * and load parsed gov.uk CSV reference datasets.
 *
 * Uses the same regex approach as audit-kent-parity.py to avoid needing
 * a TypeScript compiler at runtime.
 */

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { normalizeCouncilName } from './lib/normalize.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PROJECT_ROOT = join(__dirname, '..', '..');
const COUNCILS_DIR = join(PROJECT_ROOT, 'src', 'data', 'councils');
const BULK_DATA_DIR = join(COUNCILS_DIR, 'pdfs', 'gov-uk-bulk-data');

const TS_FILES = [
  { type: 'SC', typeName: 'County Council', file: 'county-councils.ts' },
  { type: 'SD', typeName: 'District Council', file: 'districts.ts' },
  { type: 'MD', typeName: 'Metropolitan District', file: 'metropolitan.ts' },
  { type: 'UA', typeName: 'Unitary Authority', file: 'unitary.ts' },
  { type: 'LB', typeName: 'London Borough', file: 'london-boroughs.ts' },
];

// Parse a TypeScript number/string/array/object value from a raw section string
function extractField(section, fieldName) {
  // Check if field exists at all
  const pattern = new RegExp(`(?:^|\\n)\\s*${fieldName}:\\s*`, 'm');
  if (!pattern.test(section)) return undefined;

  // Extract the value portion
  const match = section.match(new RegExp(`(?:^|\\n)\\s*${fieldName}:\\s*(.+)`, 'm'));
  if (!match) return undefined;

  const valueStart = match[1].trim();

  // Simple number
  if (/^-?[\d.]+,?\s*$/.test(valueStart)) {
    return parseFloat(valueStart.replace(',', ''));
  }

  // String value
  if (valueStart.startsWith('"') || valueStart.startsWith("'")) {
    const strMatch = valueStart.match(/^["']([^"']*)["']/);
    return strMatch ? strMatch[1] : valueStart;
  }

  // Boolean
  if (valueStart === 'true,' || valueStart === 'true') return true;
  if (valueStart === 'false,' || valueStart === 'false') return false;

  // null
  if (valueStart === 'null,' || valueStart === 'null') return null;

  return valueStart;
}

// Check if a field exists in the section (same as audit-kent-parity.py)
function hasField(section, fieldName) {
  return section.includes(`${fieldName}:`);
}

// Parse a council section into a structured object
function parseCouncilSection(section, onsCode, name, type, typeName) {
  const council = {
    ons_code: onsCode,
    name: name,
    type: type,
    type_name: typeName,
    _raw_section: section, // Keep for field presence checks
  };

  // Council tax
  council.council_tax = {
    band_d_2025: extractField(section, 'band_d_2025'),
    band_d_2024: extractField(section, 'band_d_2024'),
    band_d_2023: extractField(section, 'band_d_2023'),
    band_d_2022: extractField(section, 'band_d_2022'),
    band_d_2021: extractField(section, 'band_d_2021'),
  };

  // Budget — extract key fields
  council.budget = {
    education: extractField(section, 'education'),
    transport: extractField(section, 'transport'),
    childrens_social_care: extractField(section, 'childrens_social_care'),
    adult_social_care: extractField(section, 'adult_social_care'),
    public_health: extractField(section, 'public_health'),
    housing: extractField(section, 'housing'),
    cultural: extractField(section, 'cultural'),
    environmental: extractField(section, 'environmental'),
    planning: extractField(section, 'planning'),
    central_services: extractField(section, 'central_services'),
    other: extractField(section, 'other'),
    total_service: extractField(section, 'total_service'),
    net_current: extractField(section, 'net_current'),
  };

  // Detailed fields — extract numeric/string values
  council.detailed = {};
  const d = council.detailed;

  // Financial
  d.revenue_budget = extractField(section, 'revenue_budget');
  d.capital_programme = extractField(section, 'capital_programme');
  d.reserves = extractField(section, 'reserves');
  d.budget_gap = extractField(section, 'budget_gap');
  d.savings_target = extractField(section, 'savings_target');
  d.council_tax_requirement = extractField(section, 'council_tax_requirement');

  // Leadership
  d.chief_executive = extractField(section, 'chief_executive');
  d.council_leader = extractField(section, 'council_leader');
  d.total_councillors = extractField(section, 'total_councillors');

  // Salary / staff
  d.chief_executive_salary = extractField(section, 'chief_executive_salary');
  d.chief_executive_total_remuneration = extractField(section, 'chief_executive_total_remuneration');
  d.councillor_basic_allowance = extractField(section, 'councillor_basic_allowance');
  d.total_allowances_cost = extractField(section, 'total_allowances_cost');
  d.staff_fte = extractField(section, 'staff_fte');

  // URLs
  d.website = extractField(section, 'website');
  d.council_tax_url = extractField(section, 'council_tax_url');
  d.budget_url = extractField(section, 'budget_url');
  d.transparency_url = extractField(section, 'transparency_url');
  d.accounts_url = extractField(section, 'accounts_url');
  d.councillors_url = extractField(section, 'councillors_url');

  // Metadata
  d.last_verified = extractField(section, 'last_verified');

  // Field presence flags for arrays/objects (can't easily parse, but can check existence)
  d._has = {};
  const arrayFields = [
    'cabinet', 'salary_bands', 'councillor_allowances_detail', 'top_suppliers',
    'grant_payments', 'performance_kpis', 'waste_destinations', 'service_spending',
    'service_outcomes', 'governance_transparency', 'section_transparency',
    'documents', 'open_data_links', 'sources', 'precepts', 'council_tax_shares',
  ];
  for (const f of arrayFields) {
    d._has[f] = hasField(section, f);
  }

  // Count array items where possible
  d._counts = {};

  // Count cabinet members
  if (d._has.cabinet) {
    const cabinetMatches = section.match(/portfolio:/g);
    d._counts.cabinet = cabinetMatches ? cabinetMatches.length : 0;
  }

  // Count suppliers
  if (d._has.top_suppliers) {
    const supplierMatches = section.match(/annual_spend:/g);
    d._counts.top_suppliers = supplierMatches ? supplierMatches.length : 0;
  }

  // Count councillor_allowances_detail and sum totals
  if (d._has.councillor_allowances_detail) {
    // Find the array start, then track bracket depth to find the end
    const startIdx = section.indexOf('councillor_allowances_detail: [');
    if (startIdx !== -1) {
      let depth = 0;
      let endIdx = section.length;
      for (let si = 'councillor_allowances_detail: '.length + startIdx; si < section.length; si++) {
        if (section[si] === '[') depth++;
        else if (section[si] === ']') { depth--; if (depth === 0) { endIdx = si + 1; break; } }
      }
      const detailSection = section.substring(startIdx, endIdx);
      // Each entry has a "total:" field — sum these for cross-validation
      const totalMatches = [...detailSection.matchAll(/\btotal:\s*(-?[\d.]+)/g)];
      d._counts.councillor_allowances_detail = totalMatches.length;
      d._sums = d._sums || {};
      d._sums.councillor_allowances_detail_total = totalMatches.reduce(
        (sum, m) => sum + parseFloat(m[1]), 0
      );
    } else {
      d._counts.councillor_allowances_detail = 0;
    }
  }

  // Count waste destinations
  if (d._has.waste_destinations) {
    const wasteMatches = section.match(/tonnage:/g);
    d._counts.waste_destinations = wasteMatches ? wasteMatches.length : 0;
  }

  // Count performance KPIs
  if (d._has.performance_kpis) {
    const kpiMatches = section.match(/status: ["'](green|amber|red)["']/g);
    d._counts.performance_kpis = kpiMatches ? kpiMatches.length : 0;
  }

  // Count documents
  if (d._has.documents) {
    const docTypeMatches = section.match(/type: ["'](budget|accounts|strategy|audit|report|other)["']/g);
    d._counts.documents = docTypeMatches ? docTypeMatches.length : 0;
  }

  // Extract precepts as a real array so cross-field validators can use them.
  // Each entry: { authority: string, band_d: number }
  if (d._has.precepts) {
    const pStartIdx = section.indexOf('precepts: [');
    if (pStartIdx !== -1) {
      let depth = 0;
      let pEndIdx = section.length;
      for (let si = pStartIdx + 'precepts: '.length; si < section.length; si++) {
        if (section[si] === '[') depth++;
        else if (section[si] === ']') { depth--; if (depth === 0) { pEndIdx = si + 1; break; } }
      }
      const pSection = section.substring(pStartIdx, pEndIdx);
      const precepts = [];
      // Match: { authority: "...", band_d: NUMBER }  (order-flexible)
      const entryRe = /\{\s*authority:\s*"([^"]+)"\s*,\s*band_d:\s*([\d.]+)/g;
      let pm;
      while ((pm = entryRe.exec(pSection)) !== null) {
        precepts.push({ authority: pm[1], band_d: parseFloat(pm[2]) });
      }
      d.precepts = precepts;
    }
  }

  // Extract all supplier names for duplicate checking
  if (d._has.top_suppliers) {
    const supplierNames = [];
    // Must match 'top_suppliers: [' (the array)
    const supArrayIdx = section.indexOf('top_suppliers: [');
    const supplierSection = supArrayIdx !== -1 ? section.substring(supArrayIdx) : '';
    // Find the matching close bracket by tracking nesting depth
    let supEndIdx = 0;
    if (supplierSection.length > 0) {
      let depth = 0;
      for (let si = 'top_suppliers: '.length; si < supplierSection.length; si++) {
        if (supplierSection[si] === '[') depth++;
        else if (supplierSection[si] === ']') { depth--; if (depth === 0) { supEndIdx = si + 1; break; } }
      }
    }
    const sub = supEndIdx > 0 ? supplierSection.substring(0, supEndIdx) : '';
    const re2 = /name: ["']([^"']+)["']/g;
    let m;
    while ((m = re2.exec(sub)) !== null) {
      supplierNames.push(m[1]);
    }
    d._supplierNames = supplierNames;
  }

  // Extract cabinet names and portfolios
  if (d._has.cabinet) {
    const cabinetNames = [];
    const cabinetPortfolios = [];
    // Must match 'cabinet: [' (the array), NOT 'cabinet: {' (section_transparency source)
    const cabArrayIdx = section.indexOf('cabinet: [');
    const cabinetSection = cabArrayIdx !== -1 ? section.substring(cabArrayIdx) : '';
    // Find the matching close bracket by tracking nesting depth
    let cabEndIdx = 0;
    if (cabinetSection.length > 0) {
      let depth = 0;
      for (let ci = 'cabinet: '.length; ci < cabinetSection.length; ci++) {
        if (cabinetSection[ci] === '[') depth++;
        else if (cabinetSection[ci] === ']') { depth--; if (depth === 0) { cabEndIdx = ci + 1; break; } }
      }
    }
    const cabSub = cabEndIdx > 0 ? cabinetSection.substring(0, cabEndIdx) : '';

    const nameRe = /name: ["']([^"']+)["']/g;
    const portfolioRe = /portfolio: ["']([^"']+)["']/g;
    let nm;
    while ((nm = nameRe.exec(cabSub)) !== null) cabinetNames.push(nm[1]);
    while ((nm = portfolioRe.exec(cabSub)) !== null) cabinetPortfolios.push(nm[1]);
    d._cabinetNames = cabinetNames;
    d._cabinetPortfolios = cabinetPortfolios;
  }

  // Extract all URLs for domain checking
  const urlFields = ['website', 'council_tax_url', 'budget_url', 'transparency_url', 'accounts_url', 'councillors_url'];
  d._urls = {};
  for (const f of urlFields) {
    const val = d[f];
    if (val && typeof val === 'string') {
      d._urls[f] = val;
    }
  }

  // Extract document URLs and years
  if (d._has.documents) {
    const docYears = [];
    const yearRe = /year: ["'](\d{4}(?:-\d{2,4})?)["']/g;
    let ym;
    while ((ym = yearRe.exec(section)) !== null) docYears.push(ym[1]);
    d._docYears = docYears;
  }

  // Extract salary bands for order checking
  if (d._has.salary_bands) {
    const bands = [];
    const bandSection = section.substring(section.indexOf('salary_bands:'));
    const bandEnd = bandSection.indexOf('\n    ],') !== -1
      ? bandSection.indexOf('\n    ],') + 10 : Math.min(bandSection.length, 3000);
    const bandSub = bandSection.substring(0, bandEnd);
    const bandRe = /band: ["']([^"']+)["']/g;
    let bm;
    while ((bm = bandRe.exec(bandSub)) !== null) bands.push(bm[1]);
    d._salaryBands = bands;
  }

  // Extract waste percentages
  if (d._has.waste_destinations) {
    const percentages = [];
    const wasteSection = section.substring(section.indexOf('waste_destinations:'));
    const wasteEnd = wasteSection.indexOf('\n    ],') !== -1
      ? wasteSection.indexOf('\n    ],') + 10 : Math.min(wasteSection.length, 3000);
    const wasteSub = wasteSection.substring(0, wasteEnd);
    const pctRe = /percentage: ([\d.]+)/g;
    let pm;
    while ((pm = pctRe.exec(wasteSub)) !== null) percentages.push(parseFloat(pm[1]));
    d._wastePercentages = percentages;
  }

  // Extract KPI statuses for validation
  if (d._has.performance_kpis) {
    const statuses = [];
    const statusRe = /status: ["']([\w]+)["']/g;
    let sm;
    while ((sm = statusRe.exec(section)) !== null) statuses.push(sm[1]);
    d._kpiStatuses = statuses;
  }

  return council;
}

/**
 * Load all 317 councils from the TypeScript source files.
 */
export function loadCouncils() {
  const councils = [];

  for (const { type, typeName, file } of TS_FILES) {
    const filePath = join(COUNCILS_DIR, file);
    const content = readFileSync(filePath, 'utf-8');

    const entryRe = /\n  \{\n    ons_code: "([^"]+)",\n    name: "([^"]+)"/g;
    const entries = [];
    let match;
    while ((match = entryRe.exec(content)) !== null) {
      entries.push({ onsCode: match[1], name: match[2], index: match.index });
    }

    for (let i = 0; i < entries.length; i++) {
      const start = entries[i].index;
      const end = i + 1 < entries.length ? entries[i + 1].index : content.length;
      const section = content.substring(start, end);

      councils.push(parseCouncilSection(
        section, entries[i].onsCode, entries[i].name, type, typeName
      ));
    }
  }

  return councils;
}

/**
 * Load population data from population.ts
 */
export function loadPopulation() {
  const filePath = join(PROJECT_ROOT, 'src', 'data', 'population.ts');
  const content = readFileSync(filePath, 'utf-8');

  const pop = {};
  const re = /"([^"]+)":\s*([\d]+)/g;
  let m;
  while ((m = re.exec(content)) !== null) {
    pop[m[1]] = parseInt(m[2], 10);
  }
  return pop;
}

/**
 * Load a parsed CSV reference dataset.
 * Returns array of { name, ...columns } with normalized name key.
 */
export function loadCsv(filename) {
  const filePath = join(BULK_DATA_DIR, filename);
  if (!existsSync(filePath)) return [];

  const content = readFileSync(filePath, 'utf-8').trim();
  const lines = content.split('\n');
  if (lines.length < 2) return [];

  const headers = lines[0].split(',');
  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    const parts = lines[i].split(',');
    if (parts.length < headers.length) continue;

    const row = {};
    for (let j = 0; j < headers.length; j++) {
      const val = parts[j]?.trim();
      row[headers[j].trim()] = val;
    }
    row._normalized = normalizeCouncilName(row.name || '');
    rows.push(row);
  }

  return rows;
}

/**
 * Build a lookup from normalized name -> CSV row for quick matching.
 */
export function buildCsvIndex(rows) {
  const index = new Map();
  for (const row of rows) {
    if (row._normalized) {
      index.set(row._normalized, row);
    }
  }
  return index;
}

/**
 * Build a lookup from ONS code -> CSV row for exact matching.
 * Preferred over name-based matching — ONS codes are unique identifiers.
 */
export function buildOnsIndex(rows) {
  const index = new Map();
  for (const row of rows) {
    const ons = row.ons_code || row.ons;
    if (ons) index.set(ons, row);
  }
  return index;
}

export { PROJECT_ROOT, BULK_DATA_DIR };
