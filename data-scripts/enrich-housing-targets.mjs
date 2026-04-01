import fs from 'fs';

// Enrich council data files with housing delivery targets from MHCLG HDT
// Inserts homes_target and delivery_percent into existing service_outcomes.housing blocks

const targetData = JSON.parse(fs.readFileSync('data-scripts/housing-targets-parsed.json', 'utf-8'));
console.log(`Loaded ${targetData.length} housing target entries`);

// Create a map by ONS code
const targetMap = new Map();
for (const entry of targetData) {
  targetMap.set(entry.ons_code, entry);
}

// Process all 5 council data files (housing targets apply to all planning authorities)
const files = [
  'src/data/councils/county-councils.ts',
  'src/data/councils/unitary.ts',
  'src/data/councils/metropolitan.ts',
  'src/data/councils/london-boroughs.ts',
  'src/data/councils/districts.ts',
];

let totalEnriched = 0;

for (const file of files) {
  console.log(`\nProcessing ${file}...`);
  let content = fs.readFileSync(file, 'utf-8');
  const lines = content.split('\n');
  const result = [];
  let enrichedInFile = 0;

  let currentOnsCode = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Track current council ONS code
    if (trimmed.startsWith('ons_code:')) {
      const match = trimmed.match(/ons_code:\s*["']([^"']+)["']/);
      if (match) {
        currentOnsCode = match[1];
      }
    }

    // Find homes_built line inside housing block — insert target after it
    if (trimmed.startsWith('homes_built:') && !trimmed.startsWith('homes_built_year:') && currentOnsCode) {
      const targetEntry = targetMap.get(currentOnsCode);
      result.push(line);

      if (targetEntry) {
        // Check if homes_target already exists in next few lines
        let alreadyHasTarget = false;
        for (let j = i + 1; j < Math.min(i + 5, lines.length); j++) {
          if (lines[j].trim().startsWith('homes_target:')) {
            alreadyHasTarget = true;
            break;
          }
          if (lines[j].trim().startsWith('}')) break;
        }

        if (!alreadyHasTarget) {
          // Look for homes_built_year line next — insert after it
          if (i + 1 < lines.length && lines[i + 1].trim().startsWith('homes_built_year:')) {
            // Push the year line first, then insert target
            result.push(lines[i + 1]);
            const indent = lines[i + 1].match(/^(\s*)/)[1];
            result.push(`${indent}homes_target: ${targetEntry.annual_target},`);
            result.push(`${indent}delivery_percent: ${targetEntry.delivery_percent},`);
            enrichedInFile++;
            i++; // Skip the year line since we already pushed it
          } else {
            // No year line, insert directly after homes_built
            const indent = line.match(/^(\s*)/)[1];
            result.push(`${indent}homes_target: ${targetEntry.annual_target},`);
            result.push(`${indent}delivery_percent: ${targetEntry.delivery_percent},`);
            enrichedInFile++;
          }
        }
      }

      continue;
    }

    result.push(line);
  }

  fs.writeFileSync(file, result.join('\n'));
  console.log(`  Enriched: ${enrichedInFile} councils`);
  totalEnriched += enrichedInFile;
}

console.log(`\nTotal enriched: ${totalEnriched} councils with housing targets`);

// Verify
for (const file of files) {
  const content = fs.readFileSync(file, 'utf-8');
  const targetCount = (content.match(/homes_target:/g) || []).length;
  const deliveryCount = (content.match(/delivery_percent:/g) || []).length;
  console.log(`  ${file}: ${targetCount} homes_target, ${deliveryCount} delivery_percent`);
}
