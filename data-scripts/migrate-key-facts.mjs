import fs from 'fs';

// Migrate key_facts data into service_outcomes for county councils
const file = 'src/data/councils/county-councils.ts';
let content = fs.readFileSync(file, 'utf-8');

// Parse each council's key_facts block
const keyFactsRegex = /key_facts:\s*\{([^}]+)\}/g;
let match;
let count = 0;

while ((match = keyFactsRegex.exec(content)) !== null) {
  count++;
  const block = match[1];

  // Extract values
  const population = block.match(/population_served:\s*(\d+)/)?.[1];
  const roads = block.match(/roads_maintained_miles:\s*(\d+)/)?.[1];
  const libraries = block.match(/libraries:\s*(\d+)/)?.[1];
  const libraryVisits = block.match(/library_visits_annual:\s*(\d+)/)?.[1];
  const potholes = block.match(/potholes_repaired_2025:\s*(\d+)/)?.[1];
  const socialCareClients = block.match(/adult_social_care_clients:\s*(\d+)/)?.[1];

  console.log(`Council #${count}: pop=${population}, roads=${roads}, libs=${libraries}, visits=${libraryVisits}, potholes=${potholes}, asc=${socialCareClients}`);
}

console.log(`\nFound ${count} key_facts blocks to migrate\n`);

// Now do the actual migration
// Strategy: For each council, find the service_outcomes block and inject the key_facts fields into it
// Then remove the key_facts block entirely

// Step 1: Process each council block
// Find pattern: key_facts: { ... }, followed later by service_outcomes: { ... }

// We need to process the file more carefully - line by line approach
const lines = content.split('\n');
const result = [];
let i = 0;
let migratedCount = 0;

// Collect key_facts data for each council as we encounter them
let currentKeyFacts = null;
let inKeyFacts = false;
let keyFactsStartLine = -1;
let braceDepth = 0;

// First pass: collect key_facts and mark lines for removal
const keyFactsData = []; // { startLine, endLine, data }
const lineFlags = new Array(lines.length).fill(true); // true = keep

for (i = 0; i < lines.length; i++) {
  const line = lines[i];
  const trimmed = line.trim();

  if (trimmed.startsWith('key_facts:') && trimmed.includes('{')) {
    inKeyFacts = true;
    keyFactsStartLine = i;
    currentKeyFacts = {};
    braceDepth = (line.match(/{/g) || []).length - (line.match(/}/g) || []).length;

    if (braceDepth === 0) {
      // Single-line key_facts (unlikely but handle it)
      parseKeyFactsLine(trimmed, currentKeyFacts);
      keyFactsData.push({ startLine: keyFactsStartLine, endLine: i, data: { ...currentKeyFacts } });
      inKeyFacts = false;
      currentKeyFacts = null;
    }
    continue;
  }

  if (inKeyFacts) {
    parseKeyFactsLine(trimmed, currentKeyFacts);
    braceDepth += (line.match(/{/g) || []).length - (line.match(/}/g) || []).length;

    if (braceDepth <= 0) {
      keyFactsData.push({ startLine: keyFactsStartLine, endLine: i, data: { ...currentKeyFacts } });
      inKeyFacts = false;
      currentKeyFacts = null;
    }
  }
}

function parseKeyFactsLine(line, obj) {
  const m = line.match(/(\w+):\s*(\d+)/);
  if (m) {
    obj[m[1]] = parseInt(m[2]);
  }
}

console.log(`Collected ${keyFactsData.length} key_facts blocks:`);
keyFactsData.forEach((kf, idx) => {
  console.log(`  #${idx + 1} lines ${kf.startLine + 1}-${kf.endLine + 1}: ${JSON.stringify(kf.data)}`);
});

// Mark key_facts lines for removal
for (const kf of keyFactsData) {
  for (let j = kf.startLine; j <= kf.endLine; j++) {
    lineFlags[j] = false;
  }
}

// Second pass: find service_outcomes blocks and inject migrated data
// We need to find the opening of each service_outcomes block and add new fields
let outputLines = [];
let kfIndex = 0; // Track which key_facts we're on (by council order)

// Track which council we're in by counting opening patterns
let councilIndex = -1;

for (i = 0; i < lines.length; i++) {
  if (!lineFlags[i]) {
    // Skip removed key_facts lines
    // But check if the line before or after needs cleanup (trailing comma, blank line)
    continue;
  }

  const line = lines[i];
  const trimmed = line.trim();

  // Count councils by their ONS code pattern (first field)
  if (trimmed.startsWith('ons_code:')) {
    councilIndex++;
  }

  // Find service_outcomes opening and inject new fields
  if (trimmed === 'service_outcomes: {') {
    outputLines.push(line);

    // Find which key_facts block corresponds to this council
    const kf = keyFactsData[councilIndex];
    if (kf && kf.data) {
      const indent = line.match(/^(\s*)/)[1] + '  '; // Add 2 more spaces for nesting
      const data = kf.data;

      // Inject population_served
      if (data.population_served) {
        outputLines.push(`${indent}population_served: ${data.population_served},`);
      }

      // Inject into roads sub-object - we need to find the existing roads block
      // or add before it. Let's handle this by looking ahead.
      // Actually, let's inject after the opening brace and before existing content

      // For roads: maintained_miles and potholes_repaired
      if (data.roads_maintained_miles || data.potholes_repaired_2025) {
        // Check if next lines already have roads: {
        let hasRoads = false;
        for (let j = i + 1; j < Math.min(i + 5, lines.length); j++) {
          if (lines[j].trim().startsWith('roads:')) {
            hasRoads = true;
            break;
          }
        }
        // We'll handle roads injection when we encounter the roads block
        // Store for later
      }

      // Inject libraries
      if (data.libraries) {
        outputLines.push(`${indent}libraries: {`);
        outputLines.push(`${indent}  count: ${data.libraries},`);
        if (data.library_visits_annual) {
          outputLines.push(`${indent}  visits_annual: ${data.library_visits_annual},`);
        }
        outputLines.push(`${indent}},`);
      }

      // Inject adult_social_care if we have clients
      if (data.adult_social_care_clients) {
        // Check if there's already an adult_social_care block
        let hasASC = false;
        for (let j = i + 1; j < Math.min(i + 20, lines.length); j++) {
          if (lines[j].trim().startsWith('adult_social_care:')) {
            hasASC = true;
            break;
          }
        }
        if (!hasASC) {
          outputLines.push(`${indent}adult_social_care: {`);
          outputLines.push(`${indent}  clients_served: ${data.adult_social_care_clients},`);
          outputLines.push(`${indent}},`);
        }
      }

      migratedCount++;
    }
    continue;
  }

  // Inject maintained_miles into existing roads blocks
  if (trimmed.startsWith('roads:') && trimmed.includes('{')) {
    outputLines.push(line);
    const kf = keyFactsData[councilIndex];
    if (kf && kf.data && kf.data.roads_maintained_miles) {
      const indent = line.match(/^(\s*)/)[1] + '  ';
      outputLines.push(`${indent}maintained_miles: ${kf.data.roads_maintained_miles},`);
    }
    if (kf && kf.data && kf.data.potholes_repaired_2025) {
      const indent = line.match(/^(\s*)/)[1] + '  ';
      // Check if potholes_repaired already exists in this block
      let hasPotholes = false;
      for (let j = i + 1; j < Math.min(i + 5, lines.length); j++) {
        if (lines[j].trim().startsWith('potholes_repaired:')) {
          hasPotholes = true;
          break;
        }
        if (lines[j].trim().startsWith('}')) break;
      }
      if (!hasPotholes) {
        outputLines.push(`${indent}potholes_repaired: ${kf.data.potholes_repaired_2025},`);
      }
    }
    continue;
  }

  // For councils that don't have a roads block but have roads data in key_facts
  // we need to create one. Check after service_outcomes opening + injections
  // Actually, let's handle this: if we see waste: { (the next block after roads would be)
  // and the current council has roads data but no existing roads block
  if (trimmed.startsWith('waste:') && trimmed.includes('{')) {
    const kf = keyFactsData[councilIndex];
    if (kf && kf.data && kf.data.roads_maintained_miles) {
      // Check if we already emitted a roads block for this council
      let alreadyHasRoads = false;
      for (let j = outputLines.length - 1; j >= Math.max(0, outputLines.length - 20); j--) {
        if (outputLines[j].trim().startsWith('roads:')) {
          alreadyHasRoads = true;
          break;
        }
        if (outputLines[j].trim().startsWith('service_outcomes:')) break;
      }
      if (!alreadyHasRoads) {
        const indent = line.match(/^(\s*)/)[1];
        outputLines.push(`${indent}roads: {`);
        outputLines.push(`${indent}  maintained_miles: ${kf.data.roads_maintained_miles},`);
        if (kf.data.potholes_repaired_2025) {
          outputLines.push(`${indent}  potholes_repaired: ${kf.data.potholes_repaired_2025},`);
        }
        outputLines.push(`${indent}},`);
      }
    }
  }

  outputLines.push(line);
}

// Clean up: remove consecutive blank lines that may result from key_facts removal
let finalLines = [];
let lastWasBlank = false;
for (const line of outputLines) {
  const isBlank = line.trim() === '';
  if (isBlank && lastWasBlank) continue;
  finalLines.push(line);
  lastWasBlank = isBlank;
}

const finalContent = finalLines.join('\n');
fs.writeFileSync(file, finalContent);

// Verify
const remainingKeyFacts = (finalContent.match(/key_facts:/g) || []).length;
const serviceOutcomesCount = (finalContent.match(/service_outcomes:/g) || []).length;
const populationCount = (finalContent.match(/population_served:/g) || []).length;
const maintainedMilesCount = (finalContent.match(/maintained_miles:/g) || []).length;
const librariesCount = (finalContent.match(/libraries:/g) || []).length;

console.log(`\nMigration complete!`);
console.log(`  key_facts remaining: ${remainingKeyFacts} (should be 0)`);
console.log(`  service_outcomes blocks: ${serviceOutcomesCount}`);
console.log(`  population_served injected: ${populationCount}`);
console.log(`  maintained_miles injected: ${maintainedMilesCount}`);
console.log(`  libraries injected: ${librariesCount}`);
console.log(`  Councils migrated: ${migratedCount}`);
