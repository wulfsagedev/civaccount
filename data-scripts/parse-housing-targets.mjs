import XLSX from 'xlsx';
import fs from 'fs';

// Parse MHCLG Housing Delivery Test 2023 measurement
// Contains 3-year housing requirement (target) and delivery per local planning authority
// We divide by 3 to get an annual target figure

const workbook = XLSX.readFile('data-scripts/housing-delivery-test.ods');
const sheet = workbook.Sheets['Sheet1'];
const data = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

// Data starts at row 6 (row 4 = headers, row 5 = year sub-headers)
// Actual column layout (merged headers span multiple cols):
// Col 0: ONS Code
// Col 1: Area Name
// Col 2-4: Homes required for 2020-21, 2021-22, 2022-23
// Col 5: Total homes required (3-year sum)
// Col 6-8: Homes delivered for 2020-21, 2021-22, 2022-23
// Col 9: Total homes delivered (3-year sum)
// Col 10: HDT measurement (delivery/requirement ratio)
// Col 11: Consequence (None/Buffer/Action plan/Presumption)

const output = [];

for (let i = 6; i < data.length; i++) {
  const row = data[i];
  const onsCode = String(row[0] || '').trim();
  const name = String(row[1] || '').trim();

  if (!onsCode || !onsCode.startsWith('E')) continue;
  if (!name) continue;

  const totalRequired = typeof row[5] === 'number' ? row[5] : parseFloat(String(row[5]));
  const totalDelivered = typeof row[9] === 'number' ? row[9] : parseFloat(String(row[9]));
  const hdtResult = typeof row[10] === 'number' ? row[10] : parseFloat(String(row[10]));
  const consequence = String(row[11] || '').trim();

  // Skip if no valid requirement data
  if (isNaN(totalRequired) || totalRequired <= 0) continue;

  // Annual target = 3-year sum / 3
  const annualTarget = Math.round(totalRequired / 3);
  const annualDelivered = !isNaN(totalDelivered) ? Math.round(totalDelivered / 3) : null;
  const deliveryPercent = !isNaN(hdtResult) ? Math.round(hdtResult * 100) : null;

  output.push({
    ons_code: onsCode,
    name,
    annual_target: annualTarget,
    annual_delivered: annualDelivered,
    delivery_percent: deliveryPercent,
    consequence, // None, Buffer, Action plan, Presumption
    total_required_3yr: Math.round(totalRequired),
    total_delivered_3yr: !isNaN(totalDelivered) ? Math.round(totalDelivered) : null,
  });
}

// Sort by name
output.sort((a, b) => a.name.localeCompare(b.name));

console.log(`Parsed ${output.length} local planning authorities`);

// Show sample
console.log('\nSample:');
for (const entry of output.slice(0, 8)) {
  console.log(`  ${entry.name}: target ${entry.annual_target}/yr, delivered ${entry.annual_delivered}/yr (${entry.delivery_percent}%) → ${entry.consequence}`);
}

// Show some notable ones
const adur = output.find(e => e.name === 'Adur');
const birmingham = output.find(e => e.name === 'Birmingham');
const croydon = output.find(e => e.name === 'Croydon');
const woking = output.find(e => e.name === 'Woking');
console.log('\nNotable:');
if (adur) console.log(`  Adur: target ${adur.annual_target}/yr, delivered ${adur.annual_delivered}/yr (${adur.delivery_percent}%) → ${adur.consequence}`);
if (birmingham) console.log(`  Birmingham: target ${birmingham.annual_target}/yr, delivered ${birmingham.annual_delivered}/yr (${birmingham.delivery_percent}%) → ${birmingham.consequence}`);
if (croydon) console.log(`  Croydon: target ${croydon.annual_target}/yr, delivered ${croydon.annual_delivered}/yr (${croydon.delivery_percent}%) → ${croydon.consequence}`);
if (woking) console.log(`  Woking: target ${woking.annual_target}/yr, delivered ${woking.annual_delivered}/yr (${woking.delivery_percent}%) → ${woking.consequence}`);

// Stats
const consequences = {};
for (const e of output) {
  consequences[e.consequence] = (consequences[e.consequence] || 0) + 1;
}
console.log('\nConsequences distribution:', consequences);

// Save
fs.writeFileSync('data-scripts/housing-targets-parsed.json', JSON.stringify(output, null, 2));
console.log('\nSaved to data-scripts/housing-targets-parsed.json');
