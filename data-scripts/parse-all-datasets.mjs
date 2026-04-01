/**
 * parse-all-datasets.mjs
 *
 * Reads 4 ODS files from GOV.UK (DEFRA waste, MHCLG planning, MHCLG housing, Ofsted)
 * and extracts per-council outcome data into a single JSON file.
 *
 * Usage: node data-scripts/parse-all-datasets.mjs
 */

import XLSX from 'xlsx';
import { writeFileSync, readFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ============================================================
// UTILITY: Normalize council names for matching
// ============================================================

function normalizeCouncilName(name) {
  if (!name || typeof name !== 'string') return '';

  let n = name.trim();

  // Remove common suffixes used in GOV.UK data
  const suffixesToRemove = [
    / UA$/i,
    / Council$/i,
    / Borough Council$/i,
    / District Council$/i,
    / County Council$/i,
    / City Council$/i,
    / Metropolitan Borough Council$/i,
    / Metropolitan District Council$/i,
    / Metropolitan District$/i,
    / Metropolitan Borough$/i,
    / London Borough$/i,
    / Royal Borough$/i,
    /^City of /i,
    /^Royal Borough of /i,
    /^London Borough of /i,
    / LB$/i,
    / MBC$/i,
    / BC$/i,
    / DC$/i,
    / CC$/i,
    / MB$/i,
    / MD$/i,
    / City$/i,
  ];

  for (const suffix of suffixesToRemove) {
    n = n.replace(suffix, '');
  }

  // Normalize "and" / "&"
  n = n.replace(/\band\b/gi, '&');
  // Normalize multiple spaces
  n = n.replace(/\s+/g, ' ');
  // Lowercase for comparison
  n = n.toLowerCase().trim();
  // Remove punctuation except &
  n = n.replace(/[,.']/g, '');

  return n;
}

// ============================================================
// Load our council names from the project source files
// ============================================================

function loadOurCouncilNames() {
  const councilsDir = join(__dirname, '..', 'src', 'data', 'councils');
  const files = ['county-councils.ts', 'districts.ts', 'london-boroughs.ts', 'metropolitan.ts', 'unitary.ts'];
  const councils = [];

  for (const file of files) {
    const content = readFileSync(join(councilsDir, file), 'utf-8');
    // Match the name field in each council object
    // Pattern: name: "Council Name", or name: 'Council Name',
    const nameMatches = content.matchAll(/^\s*name:\s*["']([^"']+)["']\s*,/gm);
    // Also get the ons_code just before each name
    const onsMatches = content.matchAll(/ons_code:\s*["']([^"']+)["']\s*,\s*\n\s*name:\s*["']([^"']+)["']/gm);

    for (const m of onsMatches) {
      councils.push({ ons_code: m[1], name: m[2] });
    }
  }

  return councils;
}

// Build a lookup map: normalizedName -> our council name
function buildCouncilLookup(councils) {
  const lookup = new Map();
  for (const c of councils) {
    const norm = normalizeCouncilName(c.name);
    lookup.set(norm, c.name);
    // Also index by ONS code
    if (c.ons_code) {
      lookup.set(c.ons_code.toLowerCase(), c.name);
    }
  }
  return lookup;
}

// Try to match a GOV.UK name to one of our councils
function matchCouncil(govName, onsCode, lookup) {
  // Try ONS code first (most reliable)
  if (onsCode) {
    const byCode = lookup.get(onsCode.toLowerCase());
    if (byCode) return byCode;
  }

  // Try normalized name
  const norm = normalizeCouncilName(govName);
  if (!norm) return null;

  const byName = lookup.get(norm);
  if (byName) return byName;

  // Try some common variations
  // "St" vs "St."
  const stVariant = norm.replace(/\bst\b/g, 'st.');
  if (lookup.has(stVariant)) return lookup.get(stVariant);
  const stVariant2 = norm.replace(/\bst\.\b/g, 'st');
  if (lookup.has(stVariant2)) return lookup.get(stVariant2);

  // Try with "upon" variations
  const uponVariant = norm.replace(/-upon-/g, ' upon ');
  if (lookup.has(uponVariant)) return lookup.get(uponVariant);

  // Try with hyphen/space variations
  const hyphenVariant = norm.replace(/-/g, ' ');
  if (lookup.has(hyphenVariant)) return lookup.get(hyphenVariant);

  return null;
}

// ============================================================
// EXPLORE & EXTRACT: Waste / Recycling Data (DEFRA)
// ============================================================

function extractWasteData(filePath, lookup) {
  console.log('\n' + '='.repeat(60));
  console.log('WASTE / RECYCLING DATA (DEFRA)');
  console.log('='.repeat(60));

  const wb = XLSX.readFile(filePath);
  console.log('Sheet names:', wb.SheetNames.join(', '));

  // Table_3 has the recycling rate percentage
  const ws = wb.Sheets['Table_3'];
  const data = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
  console.log(`\nTable_3: ${data.length} rows`);
  console.log('Headers:', JSON.stringify(data[3]).substring(0, 200));

  // Column mapping from exploration:
  // Col 0: Financial Year
  // Col 1: Region
  // Col 2: ONS code
  // Col 3: Jpp Order
  // Col 4: Authority
  // Col 5: Authority type
  // Col 6: Residual household waste per household (kg)
  // Col 7: Percentage of household waste sent for reuse, recycling or composting

  // Extract 2023-24 data (the latest year in the dataset)
  const results = {};
  let rowCount = 0;
  let matchCount = 0;

  console.log('\nSample 2023-24 rows:');
  let sampleShown = 0;

  for (let i = 4; i < data.length; i++) {
    const row = data[i];
    if (row[0] !== '2023-24') continue;
    rowCount++;

    const authority = row[4];
    const onsCode = row[2];
    const recyclingRate = row[7];

    if (sampleShown < 5) {
      console.log(`  ${authority} (${onsCode}): recycling=${recyclingRate}`);
      sampleShown++;
    }

    if (!authority || recyclingRate === '' || recyclingRate === '-') continue;

    const councilName = matchCouncil(authority, onsCode, lookup);
    if (councilName) {
      // The recycling rate is stored as a decimal (e.g. 0.405 = 40.5%)
      const rate = typeof recyclingRate === 'number'
        ? (recyclingRate < 1 ? +(recyclingRate * 100).toFixed(1) : +recyclingRate.toFixed(1))
        : parseFloat(recyclingRate);

      results[councilName] = {
        recycling_rate_percent: rate,
        waste_year: '2023-24',
      };
      matchCount++;
    }
  }

  console.log(`\nFound ${rowCount} rows for 2023-24`);
  console.log(`Matched ${matchCount} councils to our data`);

  return results;
}

// ============================================================
// EXPLORE & EXTRACT: Planning Data (MHCLG)
// ============================================================

function extractPlanningData(filePath, lookup) {
  console.log('\n' + '='.repeat(60));
  console.log('PLANNING APPLICATION DATA (MHCLG)');
  console.log('='.repeat(60));

  const wb = XLSX.readFile(filePath);
  console.log('Sheet names:', wb.SheetNames.join(', '));

  // LT_P124A has per-council data for year ending Sept 2025
  // Columns: Authority name, ONS code, then major/minor/other decision counts
  const ws = wb.Sheets['LT_P124A'];
  const data = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
  console.log(`\nLT_P124A: ${data.length} rows`);

  const headers = data[3];
  console.log('Headers:');
  for (let i = 0; i < Math.min(10, headers.length); i++) {
    console.log(`  Col ${i}: ${headers[i]}`);
  }

  // Col 0: Planning authority
  // Col 1: ONS code
  // Col 9: Major decisions: TOTAL
  // Col 16: Minor decisions: TOTAL
  // Col 24: Major and minor decisions: TOTAL
  // Col 31: Other decisions: TOTAL
  // Col 32: Total decisions: GRAND TOTAL

  // Also extract national speed data from LT_P120 for the most recent full year
  const wsP120 = wb.Sheets['LT_P120'];
  const dataP120 = XLSX.utils.sheet_to_json(wsP120, { header: 1, defval: '' });
  console.log(`\nLT_P120 (national speed): ${dataP120.length} rows`);
  console.log('Headers:', JSON.stringify(dataP120[3]).substring(0, 300));

  // P120 Columns (corrected):
  // Col 0: Year
  // Col 1: Quarter
  // Col 7: % major decided within statutory time only (excl. performance agreements) - NOT the right metric
  // Col 14: % of major applications decided within 13 weeks or agreed time (incl. performance agreements)
  // Col 15: % of minor applications decided within 8 weeks or agreed time (incl. performance agreements)

  // Find most recent full year (annual row where Quarter is empty)
  let nationalMajorSpeed = null;
  let nationalMinorSpeed = null;
  let nationalYear = null;

  for (let i = dataP120.length - 1; i >= 5; i--) {
    const row = dataP120[i];
    if (row[0] && row[1] === '' && typeof row[14] === 'number') {
      nationalYear = row[0];
      nationalMajorSpeed = row[14]; // % major decided within 13 weeks or agreed time
      nationalMinorSpeed = row[15]; // % minor decided within 8 weeks or agreed time
      console.log(`\nMost recent full year in P120: ${nationalYear}`);
      console.log(`  National major speed (within 13 wks or agreed): ${nationalMajorSpeed}%`);
      console.log(`  National minor speed (within 8 wks or agreed): ${nationalMinorSpeed}%`);
      break;
    }
  }

  // Extract per-council data from LT_P124A
  const results = {};
  let matchCount = 0;

  console.log('\nSample per-council rows from LT_P124A:');
  let sampleShown = 0;

  // Rows 18+ are per-council (rows 5-17 are regions/national)
  for (let i = 18; i < data.length; i++) {
    const row = data[i];
    const authority = row[0];
    const onsCode = row[1];

    if (!authority || typeof authority !== 'string' || authority === '') continue;

    const majorTotal = row[9];
    const minorTotal = row[16];
    const grandTotal = row[32];

    if (sampleShown < 5) {
      console.log(`  ${authority} (${onsCode}): major=${majorTotal}, minor=${minorTotal}, total=${grandTotal}`);
      sampleShown++;
    }

    const councilName = matchCouncil(authority, onsCode, lookup);
    if (councilName) {
      results[councilName] = {
        planning_major_decisions: typeof majorTotal === 'number' ? majorTotal : null,
        planning_minor_decisions: typeof minorTotal === 'number' ? minorTotal : null,
        planning_total_decisions: typeof grandTotal === 'number' ? grandTotal : null,
        planning_year: 'Oct 2024 - Sep 2025',
        // National speed data (per-council speed not available in this dataset)
        planning_major_on_time_percent: nationalMajorSpeed,
        planning_minor_on_time_percent: nationalMinorSpeed,
        planning_speed_year: nationalYear,
        planning_speed_note: 'Speed percentages are national averages (per-council speed data not in this file)',
      };
      matchCount++;
    }
  }

  console.log(`\nMatched ${matchCount} councils to our data`);

  return results;
}

// ============================================================
// EXPLORE & EXTRACT: Housing Data (MHCLG)
// ============================================================

function extractHousingData(filePath, lookup) {
  console.log('\n' + '='.repeat(60));
  console.log('HOUSING SUPPLY / NET ADDITIONAL DWELLINGS (MHCLG)');
  console.log('='.repeat(60));

  const wb = XLSX.readFile(filePath);
  console.log('Sheet names:', wb.SheetNames.join(', '));

  const ws = wb.Sheets['LT_122'];
  const data = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
  console.log(`\nLT_122: ${data.length} rows`);

  const headers = data[4];
  console.log('Headers:');
  for (let i = 0; i < headers.length; i++) {
    console.log(`  Col ${i}: ${headers[i]}`);
  }

  // Col 0: DCLG code
  // Col 1: Former ONS code
  // Col 2: Current ONS code
  // Col 3: Authority data (name)
  // Col 4-27: Years from 2001-02 to 2024-25
  // Col 26: 2023-24 [r] (revised)
  // Col 27: 2024-25 [p] (provisional)

  const results = {};
  let matchCount = 0;

  console.log('\nSample rows:');
  let sampleShown = 0;

  for (let i = 5; i < data.length; i++) {
    const row = data[i];
    const onsCode = row[2];
    const authority = row[3];

    if (!authority || typeof authority !== 'string') continue;
    // Skip aggregate rows (England, regions, etc.)
    if (!onsCode || typeof onsCode !== 'string' || !onsCode.startsWith('E0')) continue;

    // Use 2024-25 provisional if available, otherwise 2023-24 revised
    let homesBuild = row[27]; // 2024-25 [p]
    let year = '2024-25';

    if (homesBuild === '' || homesBuild === '[x]' || homesBuild === undefined || homesBuild === null) {
      homesBuild = row[26]; // 2023-24 [r]
      year = '2023-24';
    }

    if (homesBuild === '' || homesBuild === '[x]' || homesBuild === undefined || homesBuild === null) {
      continue;
    }

    if (sampleShown < 5) {
      console.log(`  ${authority} (${onsCode}): homes=${homesBuild} (${year})`);
      sampleShown++;
    }

    const councilName = matchCouncil(authority, onsCode, lookup);
    if (councilName) {
      results[councilName] = {
        homes_built: typeof homesBuild === 'number' ? homesBuild : parseInt(homesBuild),
        homes_built_year: year,
      };
      matchCount++;
    }
  }

  console.log(`\nMatched ${matchCount} councils to our data`);

  return results;
}

// ============================================================
// EXPLORE & EXTRACT: Ofsted Data
// ============================================================

function extractOfstedData(filePath, lookup) {
  console.log('\n' + '='.repeat(60));
  console.log('OFSTED CHILDREN\'S SERVICES INSPECTION OUTCOMES');
  console.log('='.repeat(60));

  const wb = XLSX.readFile(filePath);
  console.log('Sheet names:', wb.SheetNames.join(', '));

  // Provider_level_data has per-LA inspection data
  const ws = wb.Sheets['Provider_level_data'];
  const data = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
  console.log(`\nProvider_level_data: ${data.length} rows`);

  const headers = data[2];
  console.log('Headers:');
  for (let i = 0; i < headers.length; i++) {
    console.log(`  Col ${i}: ${headers[i]}`);
  }

  // Col 0: URN
  // Col 1: Name (LA name)
  // Col 2: Publish date
  // Col 3: Publication type
  // Col 4: Remit
  // Col 5: As at date (serial)
  // Col 6: Published date (serial - when inspection report was published)
  // Col 7: Government office region
  // Col 8: Local authority area
  // Col 9: Constituency
  // Col 10: Provider type
  // Col 11: Provision type
  // Col 12: Sector
  // Col 13: Deprivation index
  // Col 14: Overall effectiveness (1=Outstanding, 2=Good, 3=Requires improvement, 4=Inadequate)

  // Rating map
  const ratingMap = {
    1: 'Outstanding',
    2: 'Good',
    3: 'Requires improvement',
    4: 'Inadequate',
  };

  // Find the most recent "as at date"
  const asAtDates = new Set();
  for (let i = 3; i < data.length; i++) {
    if (typeof data[i][5] === 'number') {
      asAtDates.add(data[i][5]);
    }
  }
  const mostRecentDate = Math.max(...asAtDates);
  console.log(`\nMost recent as-at date serial: ${mostRecentDate}`);
  console.log(`As-at dates found: ${[...asAtDates].sort().join(', ')}`);

  // Helper to convert Excel serial date to YYYY-MM
  function serialToYearMonth(serial) {
    if (!serial || typeof serial !== 'number') return null;
    const date = XLSX.SSF.parse_date_code(serial);
    if (!date) return null;
    const month = String(date.m).padStart(2, '0');
    return `${date.y}-${month}`;
  }

  console.log(`Most recent as-at date: ${serialToYearMonth(mostRecentDate)}`);

  // Extract data for the most recent "as at date"
  const results = {};
  let matchCount = 0;

  console.log('\nSample rows (most recent):');
  let sampleShown = 0;

  for (let i = 3; i < data.length; i++) {
    const row = data[i];
    if (row[5] !== mostRecentDate) continue;

    const name = row[1];
    const overallEffectiveness = row[14];
    const publishedDate = row[6];
    const laArea = row[8]; // Local authority area

    if (!name || typeof name !== 'string') continue;
    if (overallEffectiveness === '' || overallEffectiveness === undefined) continue;

    const rating = ratingMap[overallEffectiveness] || `Unknown (${overallEffectiveness})`;
    const inspectionDate = serialToYearMonth(publishedDate);

    if (sampleShown < 5) {
      console.log(`  ${name} (LA area: ${laArea}): rating=${rating} (${overallEffectiveness}), date=${inspectionDate}`);
      sampleShown++;
    }

    // Try to match by name (the Name column is the LA name)
    const councilName = matchCouncil(name, null, lookup) || matchCouncil(laArea, null, lookup);
    if (councilName) {
      results[councilName] = {
        ofsted_rating: rating,
        ofsted_date: inspectionDate,
      };
      matchCount++;
    }
  }

  console.log(`\nMatched ${matchCount} councils to our data`);

  return results;
}

// ============================================================
// MAIN
// ============================================================

function main() {
  console.log('CivAccount Data Parser - Extracting per-council outcome data');
  console.log('=' .repeat(60));

  // Load our council names
  const ourCouncils = loadOurCouncilNames();
  console.log(`\nLoaded ${ourCouncils.length} councils from our data files`);

  // Show some sample names
  console.log('Sample names:', ourCouncils.slice(0, 5).map(c => `${c.name} (${c.ons_code})`).join(', '));

  const lookup = buildCouncilLookup(ourCouncils);

  // Extract data from each source
  const wasteData = extractWasteData(join(__dirname, 'waste-data.ods'), lookup);
  const planningData = extractPlanningData(join(__dirname, 'planning-data.ods'), lookup);
  const housingData = extractHousingData(join(__dirname, 'housing-data.ods'), lookup);
  const ofstedData = extractOfstedData(join(__dirname, 'ofsted-data.ods'), lookup);

  // ============================================================
  // COMBINE all data
  // ============================================================

  console.log('\n' + '='.repeat(60));
  console.log('COMBINING DATA');
  console.log('='.repeat(60));

  const combined = {};
  const allCouncilNames = new Set([
    ...Object.keys(wasteData),
    ...Object.keys(planningData),
    ...Object.keys(housingData),
    ...Object.keys(ofstedData),
  ]);

  for (const name of allCouncilNames) {
    combined[name] = {
      ...(wasteData[name] || {}),
      ...(planningData[name] || {}),
      ...(housingData[name] || {}),
      ...(ofstedData[name] || {}),
    };
  }

  // Sort by council name
  const sorted = {};
  for (const name of [...Object.keys(combined)].sort()) {
    sorted[name] = combined[name];
  }

  console.log(`\nTotal councils with any data: ${Object.keys(sorted).length}`);
  console.log(`  - With recycling data: ${Object.keys(wasteData).length}`);
  console.log(`  - With planning data: ${Object.keys(planningData).length}`);
  console.log(`  - With housing data: ${Object.keys(housingData).length}`);
  console.log(`  - With Ofsted data: ${Object.keys(ofstedData).length}`);

  // Show councils with all 4 datasets
  let fullDataCount = 0;
  for (const name of Object.keys(sorted)) {
    const d = sorted[name];
    if (d.recycling_rate_percent !== undefined && d.planning_total_decisions !== undefined &&
        d.homes_built !== undefined && d.ofsted_rating !== undefined) {
      fullDataCount++;
    }
  }
  console.log(`  - With ALL 4 datasets: ${fullDataCount}`);

  // Show a sample entry
  const sampleName = Object.keys(sorted).find(n =>
    sorted[n].recycling_rate_percent !== undefined &&
    sorted[n].homes_built !== undefined &&
    sorted[n].ofsted_rating !== undefined
  );
  if (sampleName) {
    console.log(`\nSample entry - "${sampleName}":`);
    console.log(JSON.stringify(sorted[sampleName], null, 2));
  }

  // Show councils that had NO matches (for debugging)
  const ourNames = ourCouncils.map(c => c.name);
  const unmatchedOurs = ourNames.filter(n => !sorted[n]);
  if (unmatchedOurs.length > 0) {
    console.log(`\nCouncils from our data with NO matches in any dataset (${unmatchedOurs.length}):`);
    for (const name of unmatchedOurs.slice(0, 20)) {
      console.log(`  - ${name}`);
    }
    if (unmatchedOurs.length > 20) {
      console.log(`  ... and ${unmatchedOurs.length - 20} more`);
    }
  }

  // Write output
  const outputPath = join(__dirname, 'parsed-outcomes.json');
  writeFileSync(outputPath, JSON.stringify(sorted, null, 2));
  console.log(`\nWritten to: ${outputPath}`);
  console.log(`File size: ${(readFileSync(outputPath).length / 1024).toFixed(1)} KB`);
}

main();
