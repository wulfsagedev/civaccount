import XLSX from 'xlsx';
import fs from 'fs';

// Parse DfT Road Condition Statistics - Table RDC0120
// % of classified roads where maintenance should be considered (red condition)
// by local highway authority in England
// Two sheets: A Roads + Motorways, B and C Roads

const workbook = XLSX.readFile('data-scripts/road-condition-data.ods');

// Parse both sheets
function parseSheet(sheetName) {
  const sheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

  // Row 4 is the header
  const headers = data[4];
  console.log(`\n${sheetName} headers:`, headers);

  // Find the latest FYE column
  let latestCol = -1;
  let latestYear = '';
  for (let i = 3; i < headers.length; i++) {
    const h = String(headers[i]);
    if (h.startsWith('FYE')) {
      latestCol = i;
      latestYear = h;
    }
  }
  console.log(`Latest column: ${latestCol} = "${latestYear}"`);

  // Extract data from row 5 onwards
  const results = [];
  for (let i = 5; i < data.length; i++) {
    const row = data[i];
    const onsCode = String(row[0] || '').trim();
    const name = String(row[2] || '').trim();
    const value = row[latestCol];

    if (!onsCode || !onsCode.startsWith('E')) continue;
    if (!name || name.startsWith('[')) continue;

    // Clean the value - skip [x], [y], [z] codes
    const numValue = typeof value === 'number' ? value : parseFloat(String(value));
    if (isNaN(numValue)) {
      continue; // Skip non-numeric values
    }

    results.push({
      ons_code: onsCode,
      name: name.replace(/\s*\[note.*?\]/g, '').replace(/\s*\[r\]/g, '').trim(),
      percent_needing_maintenance: numValue,
    });
  }

  return { results, year: latestYear };
}

const aRoads = parseSheet('RDC0120_A_Roads_and_Motorways');
const bcRoads = parseSheet('RDC0120_B_and_C_Roads');

console.log(`\nA roads: ${aRoads.results.length} authorities, year: ${aRoads.year}`);
console.log(`B/C roads: ${bcRoads.results.length} authorities, year: ${bcRoads.year}`);

// Combine: average the A road and B/C road condition percentages
// This gives us an overall "% requiring maintenance" for classified roads
const combined = new Map();

for (const entry of aRoads.results) {
  combined.set(entry.ons_code, {
    ons_code: entry.ons_code,
    name: entry.name,
    a_roads_poor: entry.percent_needing_maintenance,
    bc_roads_poor: null,
  });
}

for (const entry of bcRoads.results) {
  if (combined.has(entry.ons_code)) {
    combined.get(entry.ons_code).bc_roads_poor = entry.percent_needing_maintenance;
  } else {
    combined.set(entry.ons_code, {
      ons_code: entry.ons_code,
      name: entry.name,
      a_roads_poor: null,
      bc_roads_poor: entry.percent_needing_maintenance,
    });
  }
}

// Calculate combined condition
const output = [];
for (const [onsCode, data] of combined) {
  // Use average of A roads and B/C roads if both available
  // Otherwise use whichever is available
  let poor_percent;
  if (data.a_roads_poor !== null && data.bc_roads_poor !== null) {
    // Weighted average would be more accurate but we'd need road length data
    // Simple average is reasonable for a summary metric
    poor_percent = Math.round(((data.a_roads_poor + data.bc_roads_poor) / 2) * 10) / 10;
  } else if (data.a_roads_poor !== null) {
    poor_percent = data.a_roads_poor;
  } else {
    poor_percent = data.bc_roads_poor;
  }

  const good_percent = Math.round((100 - poor_percent) * 10) / 10;

  // Derive rating
  let rating;
  if (poor_percent <= 5) rating = 'green';
  else if (poor_percent <= 10) rating = 'amber';
  else rating = 'red';

  output.push({
    ons_code: onsCode,
    name: data.name,
    condition_good_percent: good_percent,
    condition_poor_percent: poor_percent,
    condition_rating: rating,
    a_roads_poor: data.a_roads_poor,
    bc_roads_poor: data.bc_roads_poor,
    year: aRoads.year.replace('FYE ', ''),
  });
}

// Sort by name
output.sort((a, b) => a.name.localeCompare(b.name));

console.log(`\nCombined: ${output.length} highway authorities`);

// Show sample
console.log('\nSample entries:');
for (const entry of output.slice(0, 10)) {
  console.log(`  ${entry.name}: ${entry.condition_good_percent}% good (A: ${entry.a_roads_poor}%, B/C: ${entry.bc_roads_poor}% poor) [${entry.condition_rating}]`);
}

// Show some notable ones
const kent = output.find(e => e.name.includes('Kent'));
const birmingham = output.find(e => e.name.includes('Birmingham'));
const croydon = output.find(e => e.name.includes('Croydon'));
console.log('\nNotable:');
if (kent) console.log(`  Kent: ${kent.condition_good_percent}% good (${kent.condition_rating})`);
if (birmingham) console.log(`  Birmingham: ${birmingham.condition_good_percent}% good (${birmingham.condition_rating})`);
if (croydon) console.log(`  Croydon: ${croydon.condition_good_percent}% good (${croydon.condition_rating})`);

// Stats
const goods = output.map(e => e.condition_good_percent);
const avg = goods.reduce((s, v) => s + v, 0) / goods.length;
console.log(`\nNational average: ${Math.round(avg * 10) / 10}% good condition`);
console.log(`Range: ${Math.min(...goods)}% to ${Math.max(...goods)}%`);

// Save
fs.writeFileSync('data-scripts/road-condition-parsed.json', JSON.stringify(output, null, 2));
console.log('\nSaved to data-scripts/road-condition-parsed.json');
