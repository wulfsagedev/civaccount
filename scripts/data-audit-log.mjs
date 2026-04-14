#!/usr/bin/env node
/**
 * data-audit-log.mjs — Generate a human-readable audit log of all data changes
 * since a given commit, focused on the council data files.
 *
 * Reads `git log` for changes to src/data/councils/*.ts and source files,
 * then groups commits by category (band_d sync, field_sources, validator
 * changes, manual edits) and writes a markdown summary.
 *
 * Usage:
 *   node scripts/data-audit-log.mjs              # since last release tag
 *   node scripts/data-audit-log.mjs --since=v3.0 # since specific tag
 *   node scripts/data-audit-log.mjs --days=30    # last 30 days
 */

import { execSync } from 'child_process';
import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = join(__dirname, '..');
const OUTPUT = join(PROJECT_ROOT, 'DATA-AUDIT-LOG.md');

const args = process.argv.slice(2);
const sinceArg = args.find(a => a.startsWith('--since='))?.slice('--since='.length);
const daysArg = args.find(a => a.startsWith('--days='))?.slice('--days='.length);

// Determine git range
let range = '';
let rangeLabel = '';
if (sinceArg) {
  range = `${sinceArg}..HEAD`;
  rangeLabel = `since ${sinceArg}`;
} else if (daysArg) {
  range = `--since="${daysArg} days ago"`;
  rangeLabel = `last ${daysArg} days`;
} else {
  // Try latest tag, fall back to last 30 days
  try {
    const lastTag = execSync('git describe --tags --abbrev=0', { cwd: PROJECT_ROOT }).toString().trim();
    range = `${lastTag}..HEAD`;
    rangeLabel = `since ${lastTag}`;
  } catch {
    range = '--since="30 days ago"';
    rangeLabel = 'last 30 days';
  }
}

console.log(`Generating data audit log ${rangeLabel}...`);

// Files to track for data changes
const DATA_PATHS = [
  'src/data/councils/county-councils.ts',
  'src/data/councils/metropolitan.ts',
  'src/data/councils/london-boroughs.ts',
  'src/data/councils/unitary.ts',
  'src/data/councils/districts.ts',
  'src/data/councils/pdfs/gov-uk-bulk-data/',
  'src/data/councils/pdfs/gov-uk-ra-data/',
  'src/data/provenance.ts',
  'scripts/validate/source-manifest.json',
];

// Get commits touching data files
const logCmd = `git log ${range} --pretty=format:'COMMIT::%H::%s::%an::%ai' -- ${DATA_PATHS.join(' ')}`;
const log = execSync(logCmd, { cwd: PROJECT_ROOT }).toString().trim();

if (!log) {
  console.log('No data changes in range.');
  writeFileSync(OUTPUT, `# Data Audit Log\n\nNo data changes ${rangeLabel}.\n`);
  process.exit(0);
}

// Categorize commits
const categories = {
  bandDSync: [],
  fieldSources: [],
  validators: [],
  budgetData: [],
  fixes: [],
  manifest: [],
  other: [],
};

const commits = log.split('\n').map(line => {
  const [, hash, subject, author, date] = line.split('::');
  return { hash, subject, author, date };
});

for (const c of commits) {
  const subj = c.subject.toLowerCase();
  if (subj.includes('band_d') || subj.includes('area ct') || subj.includes('sync:band-d')) {
    categories.bandDSync.push(c);
  } else if (subj.includes('field_source') || subj.includes('field source')) {
    categories.fieldSources.push(c);
  } else if (subj.includes('validator') || subj.includes('source-truth') || subj.includes('freshness')) {
    categories.validators.push(c);
  } else if (subj.includes('budget') || subj.includes('spending')) {
    categories.budgetData.push(c);
  } else if (subj.includes('manifest') || subj.includes('checksum')) {
    categories.manifest.push(c);
  } else if (subj.startsWith('fix:')) {
    categories.fixes.push(c);
  } else {
    categories.other.push(c);
  }
}

// File-level diff stats
let diffStats = '';
try {
  diffStats = execSync(`git diff ${range} --stat -- ${DATA_PATHS.join(' ')}`, { cwd: PROJECT_ROOT }).toString().trim();
} catch {
  diffStats = '(diff stats unavailable)';
}

// Compose markdown
const today = new Date().toISOString().split('T')[0];
const sections = [];

sections.push(`# Data Audit Log\n`);
sections.push(`**Range**: ${rangeLabel}`);
sections.push(`**Generated**: ${today}`);
sections.push(`**Total commits affecting data**: ${commits.length}\n`);

const renderGroup = (title, items) => {
  if (items.length === 0) return '';
  const lines = [`## ${title} (${items.length})\n`];
  for (const c of items) {
    const shortDate = c.date.split(' ')[0];
    lines.push(`- \`${c.hash.slice(0, 7)}\` ${shortDate} — ${c.subject} _(${c.author})_`);
  }
  return lines.join('\n') + '\n';
};

sections.push(renderGroup('Band D synchronization', categories.bandDSync));
sections.push(renderGroup('Per-council source URLs (field_sources)', categories.fieldSources));
sections.push(renderGroup('Validator changes', categories.validators));
sections.push(renderGroup('Budget / spending data', categories.budgetData));
sections.push(renderGroup('Source manifest / checksums', categories.manifest));
sections.push(renderGroup('Fixes', categories.fixes));
sections.push(renderGroup('Other data changes', categories.other));

sections.push(`---\n## File-level changes\n\n\`\`\`\n${diffStats || '(no diff)'}\n\`\`\`\n`);
sections.push(`---\n_Generated by \`scripts/data-audit-log.mjs\`. Run \`npm run audit:data\` to regenerate._\n`);

const content = sections.filter(Boolean).join('\n');
writeFileSync(OUTPUT, content);

console.log(`Wrote ${OUTPUT}`);
console.log(`  Band D sync: ${categories.bandDSync.length}`);
console.log(`  Field sources: ${categories.fieldSources.length}`);
console.log(`  Validators: ${categories.validators.length}`);
console.log(`  Budget data: ${categories.budgetData.length}`);
console.log(`  Manifest: ${categories.manifest.length}`);
console.log(`  Fixes: ${categories.fixes.length}`);
console.log(`  Other: ${categories.other.length}`);
console.log(`  Total: ${commits.length}`);
