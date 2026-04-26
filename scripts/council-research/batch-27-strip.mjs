#!/usr/bin/env node
/**
 * batch-27-strip.mjs — Bulk strip Bradford-list fields from a council record.
 *
 * Strips:
 *   - waste_destinations
 *   - performance_kpis
 *   - salary_bands
 *   - grant_payments
 *   - councillor_allowances_detail
 *   - top_suppliers
 *   - service_outcomes
 *   - service_spending
 *   - cabinet (per Bradford strip-list — rarely verbatim in SoA)
 *   - total_allowances_cost
 *   - budget_gap / savings_target (derived from GOV.UK)
 *   - council_tax_shares (derived from precepts)
 *   - council_leader (often not verbatim in archived source)
 *   - staff_fte (rarely in SoA)
 *
 * Usage: node batch-27-strip.mjs <file> "<Council Name>"
 *
 * Strip is text-based; finds each named field, identifies its block boundaries
 * by counting brackets, and replaces with an inline strip comment.
 */

import { readFileSync, writeFileSync } from 'node:fs';

const STRIP_FIELDS_BLOCK = [
  // arrays
  'waste_destinations',
  'performance_kpis',
  'salary_bands',
  'grant_payments',
  'councillor_allowances_detail',
  'top_suppliers',
  'service_spending',
  'cabinet',
  'documents',
  // single-value scalars
];

const STRIP_FIELDS_OBJECT = [
  'service_outcomes',
];

const STRIP_FIELDS_SCALAR = [
  'total_allowances_cost',
  'budget_gap',
  'savings_target',
  'council_leader',
  'staff_fte',
];

function findCouncilBoundaries(lines, councilName) {
  const escaped = councilName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = new RegExp(`name:\\s*"${escaped}"`);
  let nameLine = -1;
  for (let i = 0; i < lines.length; i++) {
    if (pattern.test(lines[i])) {
      nameLine = i;
      break;
    }
  }
  if (nameLine === -1) throw new Error(`Council not found: ${councilName}`);

  // Walk backward to find council record opening `{` (preceded by `,` or `[`)
  let start = -1;
  for (let i = nameLine; i >= 0; i--) {
    if (/^\s*\{\s*$/.test(lines[i])) {
      start = i;
      break;
    }
  }
  if (start === -1) throw new Error(`No opening brace for council: ${councilName}`);

  // Walk forward from start, depth=0 → 1 (council `{`) → 0 again at council `}`
  let depth = 0;
  for (let i = start; i < lines.length; i++) {
    const line = lines[i];
    for (const ch of line) {
      if (ch === '{') depth++;
      if (ch === '}') depth--;
    }
    if (depth === 0 && i > start) {
      return { start, end: i };
    }
  }
  throw new Error(`No closing brace for council: ${councilName}`);
}

function stripBlock(lines, start, end, fieldName, openChar, closeChar) {
  // Match exactly 6 spaces of indentation (top-level field of `detailed: {`)
  // This avoids stripping nested fields inside `field_sources: {...}` (8 spaces)
  const fieldPattern = new RegExp(`^      ${fieldName}:\\s*\\${openChar}`);
  let modified = false;
  for (let i = start; i <= end; i++) {
    if (fieldPattern.test(lines[i])) {
      // Find matching close
      let depth = 0;
      let blockStart = i;
      let blockEnd = -1;
      // Strip leading line comment if any
      let realStart = blockStart;
      // Check for adjacent leading `// ...` comments to also strip
      while (realStart > 0 && /^\s*\/\//.test(lines[realStart - 1])) realStart--;

      for (let j = i; j <= end; j++) {
        for (const ch of lines[j]) {
          if (ch === openChar) depth++;
          if (ch === closeChar) {
            depth--;
            if (depth === 0) {
              blockEnd = j;
              break;
            }
          }
        }
        if (blockEnd !== -1) break;
      }
      if (blockEnd === -1) continue;
      // Check if line ends with comma after close
      let trail = '';
      const closeLine = lines[blockEnd];
      const afterClose = closeLine.indexOf(closeChar) + 1;
      // Replace blockStart..blockEnd with strip comment
      const indent = lines[blockStart].match(/^\s*/)[0];
      const stripLine = `${indent}// ${fieldName} stripped 2026-04-26 (Bradford strip-list)`;
      lines.splice(realStart, blockEnd - realStart + 1, stripLine);
      end -= (blockEnd - realStart);
      modified = true;
      // restart from same i (now strip line)
      i = realStart;
    }
  }
  return { lines, end, modified };
}

function stripScalar(lines, start, end, fieldName) {
  // Only match top-level fields (exactly 6 spaces indent)
  const fieldPattern = new RegExp(`^(      )${fieldName}:\\s*[^,{[]+,?\\s*(//.*)?$`);
  for (let i = start; i <= end; i++) {
    const m = lines[i].match(fieldPattern);
    if (m) {
      const indent = m[1];
      lines[i] = `${indent}// ${fieldName} stripped 2026-04-26 (Bradford strip-list)`;
    }
  }
  return lines;
}

function main() {
  const [, , file, councilName] = process.argv;
  if (!file || !councilName) {
    console.error('Usage: batch-27-strip.mjs <file> "<Council Name>"');
    process.exit(2);
  }

  let content = readFileSync(file, 'utf8');
  let lines = content.split('\n');
  const { start, end: origEnd } = findCouncilBoundaries(lines, councilName);
  let end = origEnd;

  console.error(`${councilName}: lines ${start + 1}-${end + 1}`);

  let totalStrips = 0;
  for (const f of STRIP_FIELDS_BLOCK) {
    const r = stripBlock(lines, start, end, f, '[', ']');
    end = r.end;
    if (r.modified) totalStrips++;
  }
  for (const f of STRIP_FIELDS_OBJECT) {
    const r = stripBlock(lines, start, end, f, '{', '}');
    end = r.end;
    if (r.modified) totalStrips++;
  }
  for (const f of STRIP_FIELDS_SCALAR) {
    lines = stripScalar(lines, start, end, f);
  }

  writeFileSync(file, lines.join('\n'));
  console.error(`  ${totalStrips} block fields stripped + ${STRIP_FIELDS_SCALAR.length} scalar fields scanned`);
}

main();
