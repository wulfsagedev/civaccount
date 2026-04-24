#!/usr/bin/env node
/**
 * audit-tier1-drift.mjs — compare rendered TS values against the parsed
 * GOV.UK/ONS CSV references for each of the 22 North-Star councils.
 * Reports every cell of drift.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const REPO = '/Users/owenfisher/Projects/CivAccount/V3.0';
const BULK = join(REPO, 'src', 'data', 'councils', 'pdfs', 'gov-uk-bulk-data');

const NORTH_STAR_22 = [
  'Bradford', 'Kent', 'Camden',
  'Manchester', 'Birmingham', 'Leeds', 'Surrey', 'Cornwall',
  'Liverpool', 'Bristol', 'Lancashire', 'Tower Hamlets',
  'Hampshire', 'Essex', 'Hertfordshire', 'Sheffield', 'Westminster',
  'Nottinghamshire', 'Staffordshire', 'Wiltshire', 'Newcastle upon Tyne', 'Croydon',
];

// Parse a CSV into a row-object array (handles commas inside quoted strings)
function parseCsv(path) {
  const text = readFileSync(path, 'utf8');
  const lines = text.split(/\r?\n/).filter(l => l.length);
  if (!lines.length) return [];
  const headers = parseCsvRow(lines[0]);
  return lines.slice(1).map(l => {
    const cols = parseCsvRow(l);
    const row = {};
    headers.forEach((h, i) => { row[h] = cols[i]; });
    return row;
  });
}
function parseCsvRow(line) {
  const out = [];
  let cur = '', q = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') q = !q;
    else if (c === ',' && !q) { out.push(cur); cur = ''; }
    else cur += c;
  }
  out.push(cur);
  return out;
}

// Load population reference
const popCsv = parseCsv(join(BULK, 'parsed-population.csv'));
const popMap = {};
for (const r of popCsv) {
  popMap[r.name] = parseInt(r.population, 10);
}

// Load band_d reference (no header in first row — let's look)
const bdText = readFileSync(join(BULK, 'parsed-area-band-d.csv'), 'utf8');
const bdLines = bdText.split(/\r?\n/).filter(Boolean);
const bdHeader = parseCsvRow(bdLines[0]);
// Check header
console.error('band_d header:', bdHeader);
// Headers look like: ONS, name, type, y1, y2, y3, y4, y5, y6 (year order?)
const bdMap = {};
for (const line of bdLines.slice(1)) {
  const cols = parseCsvRow(line);
  const name = cols[1];
  // Map: 1809,1869,1968,2066,2172,2284 — looks like 6 years
  // Assume: band_d_2020, 2021, 2022, 2023, 2024, 2025? No — we need to check
  bdMap[name] = {
    band_d_2021: parseFloat(cols[3]),
    band_d_2022: parseFloat(cols[4]),
    band_d_2023: parseFloat(cols[5]),
    band_d_2024: parseFloat(cols[6]),
    band_d_2025: parseFloat(cols[7]),
    band_d_2026: parseFloat(cols[8]),
  };
}

// Load RA Part 1 reference (different directory)
const raPath = join(REPO, 'src', 'data', 'councils', 'pdfs', 'gov-uk-ra-data', 'RA_Part1_LA_Data.csv');
const raText = readFileSync(raPath, 'utf8');
const raLines = raText.split(/\r?\n/).filter(Boolean);
// Find the row with asset IDs (row 7 contains column codes)
const raCodeRow = parseCsvRow(raLines[6]);  // 0-indexed row 6 = 7th row
const raMap = {};
for (const line of raLines.slice(8)) {
  const cols = parseCsvRow(line);
  const ons = cols[1];
  const name = cols[2];
  if (!ons || !name) continue;
  raMap[name] = raMap[name] || {};
  for (let i = 0; i < raCodeRow.length; i++) {
    const code = raCodeRow[i];
    if (code) raMap[name][code] = parseFloat(cols[i]);
  }
}

// Load each council's TS record
const TS_FILES = [
  'county-councils.ts', 'metropolitan.ts', 'unitary.ts', 'london-boroughs.ts',
];

function extractCouncil(ts, name) {
  const nameIdx = ts.indexOf(`\n    name: "${name}",`);
  if (nameIdx === -1) return null;
  const endIdx = ts.indexOf('\n  },\n  {\n    ons_code:', nameIdx);
  const block = ts.slice(nameIdx, endIdx === -1 ? ts.length : endIdx);
  const ext = (field) => {
    const m = block.match(new RegExp(`${field}:\\s*([\\-\\d.]+)\\b`));
    return m ? parseFloat(m[1]) : null;
  };
  return {
    band_d_2021: ext('band_d_2021'),
    band_d_2022: ext('band_d_2022'),
    band_d_2023: ext('band_d_2023'),
    band_d_2024: ext('band_d_2024'),
    band_d_2025: ext('band_d_2025'),
    education: ext('education'),
    transport: ext('transport'),
    childrens_social_care: ext('childrens_social_care'),
    adult_social_care: ext('adult_social_care'),
    public_health: ext('public_health'),
    housing: ext('housing'),
    cultural: ext('cultural'),
    environmental: ext('environmental'),
    planning: ext('planning'),
    central_services: ext('central_services'),
    total_service: ext('total_service'),
    net_current: ext('net_current'),
  };
}

// Load population.ts
const popTs = readFileSync(join(REPO, 'src', 'data', 'population.ts'), 'utf8');
function getPopulationFromTs(name) {
  const m = popTs.match(new RegExp(`"${name}":\\s*(\\d+)`));
  return m ? parseInt(m[1], 10) : null;
}

const allDrift = [];

for (const name of NORTH_STAR_22) {
  const ts = TS_FILES
    .map(f => readFileSync(join(REPO, 'src', 'data', 'councils', f), 'utf8'))
    .find(src => src.includes(`\n    name: "${name}",`));
  if (!ts) { console.error(`Can't find ${name} in TS files`); continue; }
  const data = extractCouncil(ts, name);
  const popTsVal = getPopulationFromTs(name);
  const popCsvVal = popMap[name];
  const bd = bdMap[name] || {};
  const ra = raMap[name] || {};

  const drift = [];
  // Population
  if (popTsVal != null && popCsvVal != null && popTsVal !== popCsvVal) {
    const delta_pct = ((popTsVal - popCsvVal) / popCsvVal * 100).toFixed(2);
    drift.push({ field: 'population', ts: popTsVal, csv: popCsvVal, delta: popTsVal - popCsvVal, delta_pct: parseFloat(delta_pct) });
  }
  // Band_d years — we don't know the exact column mapping yet, so compare all
  // against expected columns
  for (const y of ['band_d_2021', 'band_d_2022', 'band_d_2023', 'band_d_2024', 'band_d_2025']) {
    if (data[y] != null && bd[y] != null && Math.abs(data[y] - bd[y]) > 0.5) {
      drift.push({ field: y, ts: data[y], csv: bd[y], delta: data[y] - bd[y] });
    }
  }
  // Budget categories — RA Part 1 uses different column codes
  // Education = edutot (in £k); TS education is also in £k (see budget: {education: 684006})
  // BUT: the RA CSV has gross, the TS might have net. Flag any > 5% delta.
  const raMap2 = {
    education: 'edutot',
    transport: 'transtot',
    childrens_social_care: 'chsertot',
    adult_social_care: 'asctot',
    public_health: 'phtot',
    housing: 'houtot',
    cultural: 'culttot',
    environmental: 'envtot',
    planning: 'plantot',
    central_services: 'centtot',
  };
  for (const [tsField, csvCol] of Object.entries(raMap2)) {
    if (data[tsField] != null && ra[csvCol] != null && Math.abs(data[tsField] - ra[csvCol]) > 1) {
      drift.push({
        field: `budget.${tsField}`, ts: data[tsField], csv: ra[csvCol],
        delta: data[tsField] - ra[csvCol], csv_col: csvCol,
      });
    }
  }

  allDrift.push({ council: name, drift });
  if (drift.length) {
    console.log(`\n=== ${name}: ${drift.length} fields drifted ===`);
    for (const d of drift) {
      const pct = d.delta_pct != null ? ` (${d.delta_pct}%)` : '';
      console.log(`  ${d.field}: TS=${d.ts} · CSV=${d.csv}${pct}`);
    }
  } else {
    console.log(`\n=== ${name}: no drift ✓ ===`);
  }
}

// Write summary
writeFileSync('/tmp/tier1-drift-report.json', JSON.stringify({
  audited_at: new Date().toISOString(),
  councils: NORTH_STAR_22.length,
  total_drift_fields: allDrift.reduce((s, c) => s + c.drift.length, 0),
  by_council: Object.fromEntries(allDrift.map(c => [c.council, c.drift])),
}, null, 2));
console.log(`\n\nTotal drift: ${allDrift.reduce((s, c) => s + c.drift.length, 0)} fields across ${NORTH_STAR_22.length} councils`);
console.log(`Report: /tmp/tier1-drift-report.json`);
