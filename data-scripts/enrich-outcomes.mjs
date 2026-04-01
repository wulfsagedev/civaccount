/**
 * enrich-outcomes.mjs
 *
 * Reads parsed-outcomes.json and inserts service_outcomes data into
 * the 5 council data files. For each council:
 *   1. Finds `name: "CouncilName"` in the file
 *   2. Searches forward for either `accountability:` or `last_verified:` (whichever first)
 *   3. Safety check: no other top-level `name:` between them
 *   4. Inserts `service_outcomes: { ... }` before that first match
 */

import { readFileSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── Load parsed outcomes ──────────────────────────────────────────
const outcomesPath = join(__dirname, "parsed-outcomes.json");
const outcomes = JSON.parse(readFileSync(outcomesPath, "utf-8"));

// ── Files to process ──────────────────────────────────────────────
const councilsDir = join(__dirname, "..", "src", "data", "councils");
const files = [
  { path: join(councilsDir, "county-councils.ts"), label: "county-councils.ts", expected: 21 },
  { path: join(councilsDir, "london-boroughs.ts"), label: "london-boroughs.ts", expected: 33 },
  { path: join(councilsDir, "metropolitan.ts"), label: "metropolitan.ts", expected: 36 },
  { path: join(councilsDir, "unitary.ts"), label: "unitary.ts", expected: 63 },
  { path: join(councilsDir, "districts.ts"), label: "districts.ts", expected: 164 },
];

// ── Name matching helpers ─────────────────────────────────────────
function normalise(name) {
  return name
    .replace(/&/g, "and")
    .replace(/\./g, "")
    .replace(/'/g, "'")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

/**
 * Special name mappings for truncated/mismatched keys in parsed-outcomes.json.
 */
const specialMappings = {
  "King's Lynn & West Norfolk": "King",
};

/**
 * Build a lookup from normalised name → original JSON key.
 */
const normalisedLookup = new Map();
for (const key of Object.keys(outcomes)) {
  normalisedLookup.set(normalise(key), key);
}

function findOutcomeKey(tsName) {
  // Special mappings first
  if (specialMappings[tsName] && outcomes[specialMappings[tsName]]) {
    return specialMappings[tsName];
  }
  // Exact match
  if (outcomes[tsName]) return tsName;
  // Normalised match
  const norm = normalise(tsName);
  if (normalisedLookup.has(norm)) return normalisedLookup.get(norm);
  return null;
}

// ── Build the service_outcomes block ──────────────────────────────
function buildServiceOutcomesBlock(data, indent) {
  const sp = " ".repeat(indent); // 6 spaces for first level
  const sp2 = " ".repeat(indent + 2); // 8 spaces for nested objects
  const sp3 = " ".repeat(indent + 4); // 10 spaces for nested fields

  const parts = [];

  // waste
  if (data.recycling_rate_percent != null) {
    const rate = Math.round(data.recycling_rate_percent * 10) / 10; // round to 1 decimal
    parts.push(
      `${sp2}waste: {`,
      `${sp3}recycling_rate_percent: ${rate},`,
      data.waste_year ? `${sp3}year: "${data.waste_year}",` : null,
      `${sp2}},`
    );
  }

  // housing
  if (data.homes_built != null && data.homes_built > 0) {
    parts.push(
      `${sp2}housing: {`,
      `${sp3}homes_built: ${data.homes_built},`,
      data.homes_built_year ? `${sp3}homes_built_year: "${data.homes_built_year}",` : null,
      `${sp2}},`
    );
  }

  // children_services
  if (data.ofsted_rating) {
    parts.push(
      `${sp2}children_services: {`,
      `${sp3}ofsted_rating: "${data.ofsted_rating}",`,
      data.ofsted_date ? `${sp3}ofsted_date: "${data.ofsted_date}",` : null,
      `${sp2}},`
    );
  }

  // Filter out nulls
  const filteredParts = parts.filter(Boolean);

  if (filteredParts.length === 0) return null; // nothing to insert

  const lines = [
    `${sp}service_outcomes: {`,
    ...filteredParts,
    `${sp}},`,
  ];

  return lines.join("\n");
}

// ── Process each file ─────────────────────────────────────────────
const totalStats = { enriched: 0, skipped: 0, noData: 0, notFound: 0 };
const allSkipped = [];
const allNotFound = [];

for (const fileInfo of files) {
  console.log(`\n━━━ Processing ${fileInfo.label} (expected: ${fileInfo.expected}) ━━━`);

  let content = readFileSync(fileInfo.path, "utf-8");
  const lines = content.split("\n");

  // Find all council names in this file with their line indices
  // Council-level name: fields are at ~4 spaces indentation
  const councilNameRegex = /^(\s{2,6})name:\s*"([^"]+)"/;
  const councils = [];

  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(councilNameRegex);
    if (m) {
      const indent = m[1].length;
      // Only match top-level council names (typically 4 spaces)
      if (indent <= 6) {
        councils.push({ name: m[2], lineIndex: i, indent });
      }
    }
  }

  console.log(`  Found ${councils.length} councils in file`);

  let fileEnriched = 0;
  let fileSkipped = 0;
  let fileNoData = 0;
  let fileNotFound = 0;

  // Process in reverse order so line indices remain valid after insertions
  for (let c = councils.length - 1; c >= 0; c--) {
    const council = councils[c];
    const nextCouncilLine = c < councils.length - 1 ? councils[c + 1].lineIndex : lines.length;

    // Find the outcome data
    const outcomeKey = findOutcomeKey(council.name);
    if (!outcomeKey) {
      fileNotFound++;
      allNotFound.push(`${fileInfo.label}: "${council.name}"`);
      continue;
    }

    const data = outcomes[outcomeKey];

    // Check if there's any useful data to insert
    const hasWaste = data.recycling_rate_percent != null;
    const hasHousing = data.homes_built != null && data.homes_built > 0;
    const hasOfsted = !!data.ofsted_rating;

    if (!hasWaste && !hasHousing && !hasOfsted) {
      fileNoData++;
      continue;
    }

    // Build the block
    const block = buildServiceOutcomesBlock(data, 6);
    if (!block) {
      fileNoData++;
      continue;
    }

    // Search forward from the council name line for `accountability:` or `last_verified:`
    // We need to find whichever comes first, staying within this council's bounds
    let insertBeforeLine = -1;
    let foundWhat = "";

    for (let i = council.lineIndex + 1; i < nextCouncilLine; i++) {
      const line = lines[i];

      // Check for accountability: at ~6 spaces indent
      if (/^\s{4,8}accountability:\s*\{/.test(line)) {
        insertBeforeLine = i;
        foundWhat = "accountability";
        break;
      }

      // Check for last_verified: at ~6 spaces indent
      if (/^\s{4,8}last_verified:/.test(line)) {
        insertBeforeLine = i;
        foundWhat = "last_verified";
        break;
      }
    }

    if (insertBeforeLine === -1) {
      fileSkipped++;
      allSkipped.push(`${fileInfo.label}: "${council.name}" - no last_verified/accountability found`);
      continue;
    }

    // Safety check: no other top-level name: between council.lineIndex and insertBeforeLine
    let safetyFail = false;
    for (let i = council.lineIndex + 1; i < insertBeforeLine; i++) {
      const m = lines[i].match(/^(\s{2,6})name:\s*"/);
      if (m && m[1].length <= 6) {
        safetyFail = true;
        break;
      }
    }

    if (safetyFail) {
      fileSkipped++;
      allSkipped.push(`${fileInfo.label}: "${council.name}" - safety check failed (another name: found between)`);
      continue;
    }

    // Check if service_outcomes already exists between the council name and the insertion point
    let alreadyExists = false;
    for (let i = council.lineIndex + 1; i < insertBeforeLine; i++) {
      if (/^\s{4,8}service_outcomes:\s*\{/.test(lines[i])) {
        alreadyExists = true;
        break;
      }
    }

    if (alreadyExists) {
      fileSkipped++;
      allSkipped.push(`${fileInfo.label}: "${council.name}" - service_outcomes already exists`);
      continue;
    }

    // Insert the block before the found line
    const blockLines = block.split("\n");
    lines.splice(insertBeforeLine, 0, ...blockLines);
    fileEnriched++;
  }

  // Write the file back
  writeFileSync(fileInfo.path, lines.join("\n"), "utf-8");

  console.log(`  Enriched: ${fileEnriched}`);
  console.log(`  Skipped: ${fileSkipped}`);
  console.log(`  No useful data: ${fileNoData}`);
  console.log(`  Not found in JSON: ${fileNotFound}`);

  totalStats.enriched += fileEnriched;
  totalStats.skipped += fileSkipped;
  totalStats.noData += fileNoData;
  totalStats.notFound += fileNotFound;
}

// ── Summary ───────────────────────────────────────────────────────
console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
console.log("SUMMARY");
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
console.log(`Total enriched:     ${totalStats.enriched}`);
console.log(`Total skipped:      ${totalStats.skipped}`);
console.log(`Total no data:      ${totalStats.noData}`);
console.log(`Total not found:    ${totalStats.notFound}`);
console.log(`Grand total:        ${totalStats.enriched + totalStats.skipped + totalStats.noData + totalStats.notFound}`);

if (allNotFound.length > 0) {
  console.log(`\n⚠ Not found in parsed-outcomes.json (${allNotFound.length}):`);
  for (const item of allNotFound) {
    console.log(`  - ${item}`);
  }
}

if (allSkipped.length > 0) {
  console.log(`\n⚠ Skipped (${allSkipped.length}):`);
  for (const item of allSkipped) {
    console.log(`  - ${item}`);
  }
}

console.log("\nDone!");
