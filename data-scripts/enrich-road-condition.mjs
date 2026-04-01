import fs from 'fs';

// Enrich council data files with road condition data from DfT
// Matches by ONS code and inserts condition_good_percent + condition_poor_percent
// into existing service_outcomes.roads blocks (or creates new roads blocks)

const roadData = JSON.parse(fs.readFileSync('data-scripts/road-condition-parsed.json', 'utf-8'));
console.log(`Loaded ${roadData.length} road condition entries`);

// Create a map by ONS code for fast lookup
const roadMap = new Map();
for (const entry of roadData) {
  roadMap.set(entry.ons_code, entry);
}

// Files to process (NOT districts — they're not highway authorities)
const files = [
  'src/data/councils/county-councils.ts',
  'src/data/councils/unitary.ts',
  'src/data/councils/metropolitan.ts',
  'src/data/councils/london-boroughs.ts',
];

let totalEnriched = 0;
let totalSkipped = 0;

for (const file of files) {
  console.log(`\nProcessing ${file}...`);
  let content = fs.readFileSync(file, 'utf-8');
  const lines = content.split('\n');
  const result = [];
  let enrichedInFile = 0;
  let skippedInFile = 0;

  let currentOnsCode = null;
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    // Track current council ONS code
    if (trimmed.startsWith('ons_code:')) {
      const match = trimmed.match(/ons_code:\s*["']([^"']+)["']/);
      if (match) {
        currentOnsCode = match[1];
      }
    }

    // Find existing roads: { block inside service_outcomes
    // Insert condition data after the opening brace
    if (trimmed.startsWith('roads:') && trimmed.includes('{') && currentOnsCode) {
      const roadEntry = roadMap.get(currentOnsCode);
      if (roadEntry) {
        result.push(line);
        const indent = line.match(/^(\s*)/)[1] + '  ';

        // Check if condition_good_percent already exists in next few lines
        let alreadyHasCondition = false;
        for (let j = i + 1; j < Math.min(i + 8, lines.length); j++) {
          if (lines[j].trim().startsWith('condition_good_percent:')) {
            alreadyHasCondition = true;
            break;
          }
          if (lines[j].trim().startsWith('}')) break;
        }

        if (!alreadyHasCondition) {
          result.push(`${indent}condition_good_percent: ${roadEntry.condition_good_percent},`);
          result.push(`${indent}condition_poor_percent: ${roadEntry.condition_poor_percent},`);
          enrichedInFile++;
        }

        i++;
        continue;
      }
    }

    // If we find a service_outcomes block and the council has road data but no roads: {} block
    // we need to create one
    if (trimmed === 'service_outcomes: {' && currentOnsCode) {
      const roadEntry = roadMap.get(currentOnsCode);
      if (roadEntry) {
        // Check if there's already a roads: block within this service_outcomes
        let hasRoads = false;
        let depth = 1;
        for (let j = i + 1; j < lines.length && depth > 0; j++) {
          const t = lines[j].trim();
          if (t.startsWith('roads:')) {
            hasRoads = true;
            break;
          }
          depth += (lines[j].match(/{/g) || []).length;
          depth -= (lines[j].match(/}/g) || []).length;
        }

        if (!hasRoads) {
          result.push(line);
          const indent = line.match(/^(\s*)/)[1] + '  ';
          result.push(`${indent}roads: {`);
          result.push(`${indent}  condition_good_percent: ${roadEntry.condition_good_percent},`);
          result.push(`${indent}  condition_poor_percent: ${roadEntry.condition_poor_percent},`);
          result.push(`${indent}},`);
          enrichedInFile++;
          i++;
          continue;
        }
      }
    }

    result.push(line);
    i++;
  }

  fs.writeFileSync(file, result.join('\n'));
  console.log(`  Enriched: ${enrichedInFile} councils`);
  totalEnriched += enrichedInFile;
}

console.log(`\nTotal enriched: ${totalEnriched} highway authorities with road condition data`);

// Verify
for (const file of files) {
  const content = fs.readFileSync(file, 'utf-8');
  const count = (content.match(/condition_good_percent:/g) || []).length;
  console.log(`  ${file}: ${count} condition_good_percent entries`);
}
