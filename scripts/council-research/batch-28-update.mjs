#!/usr/bin/env node
/**
 * batch-28-update.mjs — Update CE name/salary + add field_sources for batch-28 districts.
 *
 * Reads a config like:
 * {
 *   "council": "Adur",
 *   "ce_name": "Dr Catherine Howe",      // null to strip
 *   "ce_salary": 166626,                  // null to strip
 *   "ce_name_page": 93,
 *   "ce_salary_page": 94,
 *   "ce_name_excerpt": "Dr Catherine Howe, Chief Executive",
 *   "ce_salary_excerpt": "Chief Executive 2024/25 166,626",
 *   "slug": "adur",
 *   "url": "https://...",
 *   "title": "Adur DC Statement of Accounts 2024/25",
 *   "sha": "...",
 *   "strip_reason_ce_name": "...",   // optional, only if ce_name=null
 *   "strip_reason_ce_salary": "..."  // optional, only if ce_salary=null
 * }
 */

import { readFileSync, writeFileSync } from 'node:fs';

const ACCESSED = '2026-04-29';

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
  let start = -1;
  for (let i = nameLine; i >= 0; i--) {
    if (/^\s*\{\s*$/.test(lines[i])) {
      start = i;
      break;
    }
  }
  if (start === -1) throw new Error(`No opening brace for: ${councilName}`);

  let depth = 0;
  for (let i = start; i < lines.length; i++) {
    for (const ch of lines[i]) {
      if (ch === '{') depth++;
      if (ch === '}') depth--;
    }
    if (depth === 0 && i > start) return { start, end: i };
  }
  throw new Error(`No closing brace for: ${councilName}`);
}

function buildFieldSourcesBlock(cfg) {
  const indent = '      ';
  const inner = '        ';
  const inner2 = '          ';
  const lines = [`${indent}field_sources: {`];

  if (cfg.ce_name) {
    lines.push(`${inner}chief_executive: {`);
    lines.push(`${inner2}url: "${cfg.url}#page=${cfg.ce_name_page}",`);
    lines.push(`${inner2}title: "${cfg.title}",`);
    lines.push(`${inner2}accessed: "${ACCESSED}",`);
    lines.push(`${inner2}data_year: "2024-25",`);
    lines.push(`${inner2}tier: 3,`);
    lines.push(`${inner2}extraction_method: "pdf_page",`);
    lines.push(`${inner2}sha256_at_access: "${cfg.sha}",`);
    lines.push(`${inner2}page: ${cfg.ce_name_page},`);
    lines.push(`${inner2}excerpt: "${cfg.ce_name_excerpt}",`);
    lines.push(`${inner2}page_image_url: "/archive/${cfg.slug}/images/chief_executive-p${cfg.ce_name_page}.png",`);
    lines.push(`${inner}},`);
  }
  if (cfg.ce_salary !== null && cfg.ce_salary !== undefined) {
    lines.push(`${inner}chief_executive_salary: {`);
    lines.push(`${inner2}url: "${cfg.url}#page=${cfg.ce_salary_page}",`);
    lines.push(`${inner2}title: "${cfg.title}",`);
    lines.push(`${inner2}accessed: "${ACCESSED}",`);
    lines.push(`${inner2}data_year: "2024-25",`);
    lines.push(`${inner2}tier: 3,`);
    lines.push(`${inner2}extraction_method: "pdf_page",`);
    lines.push(`${inner2}sha256_at_access: "${cfg.sha}",`);
    lines.push(`${inner2}page: ${cfg.ce_salary_page},`);
    lines.push(`${inner2}excerpt: "${cfg.ce_salary_excerpt}",`);
    lines.push(`${inner2}page_image_url: "/archive/${cfg.slug}/images/chief_executive_salary-p${cfg.ce_salary_page}.png",`);
    lines.push(`${inner}},`);
  }
  lines.push(`${indent}},`);
  return lines;
}

function updateCouncil(content, cfg) {
  let lines = content.split('\n');
  const { start, end } = findCouncilBoundaries(lines, cfg.council);

  let modified = false;

  for (let i = start; i <= end; i++) {
    // Update chief_executive
    if (/^      chief_executive:\s*"[^"]*",?(\s*\/\/.*)?\s*$/.test(lines[i])) {
      if (cfg.ce_name) {
        lines[i] = `      chief_executive: "${cfg.ce_name}",  // SoA 2024-25 p${cfg.ce_name_page} verbatim`;
      } else {
        lines[i] = `      // chief_executive stripped 2026-04-29 — ${cfg.strip_reason_ce_name || 'not in archived SoA'}`;
      }
      modified = true;
    }
    // Update chief_executive_salary
    if (/^      chief_executive_salary:\s*\d+,?(\s*\/\/.*)?\s*$/.test(lines[i])) {
      if (cfg.ce_salary !== null && cfg.ce_salary !== undefined) {
        lines[i] = `      chief_executive_salary: ${cfg.ce_salary},  // SoA 2024-25 p${cfg.ce_salary_page} verbatim`;
      } else {
        lines[i] = `      // chief_executive_salary stripped 2026-04-29 — ${cfg.strip_reason_ce_salary || 'not in archived SoA'}`;
      }
      modified = true;
    }
  }

  // Find existing field_sources or insert before last_verified
  let fsStart = -1;
  let fsEnd = -1;
  let lastVerifiedLine = -1;
  for (let i = start; i <= end; i++) {
    if (/^      field_sources:\s*\{/.test(lines[i])) {
      fsStart = i;
      let depth = 0;
      for (let j = i; j <= end; j++) {
        for (const ch of lines[j]) {
          if (ch === '{') depth++;
          if (ch === '}') depth--;
        }
        if (depth === 0 && j > i) {
          fsEnd = j;
          break;
        }
      }
      break;
    }
    if (/^      last_verified:/.test(lines[i])) {
      lastVerifiedLine = i;
    }
  }

  const newFs = buildFieldSourcesBlock(cfg);
  if (fsStart !== -1 && fsEnd !== -1) {
    // Replace existing
    lines.splice(fsStart, fsEnd - fsStart + 1, ...newFs);
    modified = true;
  } else if (lastVerifiedLine !== -1) {
    // Insert before last_verified
    lines.splice(lastVerifiedLine, 0, ...newFs, '');
    modified = true;
  } else {
    // Insert before closing `},` of detailed (the second-to-last `},`)
    // Find the `    },` line that closes `detailed: {`
    let depth = 0;
    let detailedClose = -1;
    for (let i = start; i <= end; i++) {
      if (/^    detailed:\s*\{/.test(lines[i])) {
        depth = 1;
        for (let j = i + 1; j <= end; j++) {
          for (const ch of lines[j]) {
            if (ch === '{') depth++;
            if (ch === '}') depth--;
          }
          if (depth === 0) {
            detailedClose = j;
            break;
          }
        }
        break;
      }
    }
    if (detailedClose !== -1) {
      lines.splice(detailedClose, 0, ...newFs);
      modified = true;
    }
  }

  // Update last_verified
  for (let i = start; i <= Math.min(start + (end - start) + newFs.length + 5, lines.length - 1); i++) {
    if (/^      last_verified:/.test(lines[i])) {
      lines[i] = `      last_verified: "${ACCESSED}",`;
      break;
    }
  }

  return { content: lines.join('\n'), modified };
}

function main() {
  const [, , file, configPath] = process.argv;
  if (!file || !configPath) {
    console.error('Usage: batch-28-update.mjs <ts-file> <config.json>');
    process.exit(2);
  }
  const config = JSON.parse(readFileSync(configPath, 'utf8'));
  let content = readFileSync(file, 'utf8');

  const councils = Array.isArray(config) ? config : [config];
  for (const cfg of councils) {
    const r = updateCouncil(content, cfg);
    if (r.modified) {
      content = r.content;
      console.log(`✓ ${cfg.council} updated`);
    } else {
      console.log(`- ${cfg.council} no changes`);
    }
  }
  writeFileSync(file, content);
}

main();
