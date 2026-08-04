#!/usr/bin/env node
/**
 * ux-audit-batch.mjs — run the Phase 5b live UX gate (ux-audit.mjs) across
 * many councils against a running server, in search-demand priority order.
 *
 * It shells out to ux-audit.mjs per council rather than reimplementing the
 * sweep. That costs a Chromium launch per council, but it guarantees the
 * batch result and the single-council result can never diverge — there is
 * exactly one implementation of the gate.
 *
 * Usage:
 *   node scripts/council-research/ux-audit-batch.mjs --base=http://localhost:3000
 *   node scripts/council-research/ux-audit-batch.mjs --base=... --top=40 --concurrency=4
 */

import { spawn } from 'child_process';
import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { loadCouncils, loadPopulation } from '../validate/load-councils.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPORTS_DIR = join(__dirname, '..', 'validate', 'reports');

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const m = a.match(/^--([^=]+)(?:=(.*))?$/);
    return m ? [m[1], m[2] ?? true] : [a, true];
  }),
);

const BASE = (args.base || 'http://localhost:3000').replace(/\/$/, '');
const CONCURRENCY = Math.max(1, parseInt(args.concurrency ?? '4', 10) || 4);
const TOP = args.top ? parseInt(args.top, 10) : null;

/** MUST match generateSlug() in src/data/councils.ts — in particular
 * apostrophes are STRIPPED, not turned into separators, or "King's Lynn &
 * West Norfolk" resolves to a 404 and the sweep reports the "404" text as a
 * violation instead of the audit simply failing. */
function slugify(name) {
  return name
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-+/g, '-');
}

function runOne(council) {
  const slug = slugify(council.name);
  return new Promise((resolve) => {
    const proc = spawn(
      process.execPath,
      [
        join(__dirname, 'ux-audit.mjs'),
        `--council=${council.name}`,
        `--url=${BASE}/council/${slug}`,
      ],
      { cwd: join(__dirname, '..', '..') },
    );
    let out = '';
    proc.stdout.on('data', (d) => (out += d));
    proc.stderr.on('data', (d) => (out += d));
    const timer = setTimeout(() => proc.kill('SIGKILL'), 120000);
    proc.on('close', (code) => {
      clearTimeout(timer);
      const clean = out.replace(/\[[0-9;]*m/g, '');
      const m = clean.match(/(\d+)\s+violation\(s\)/);
      const pass = /0 violations/.test(clean);
      // A missing page renders Next's 404, whose only "number" is the 404
      // itself. Surface that as a broken URL — never as a data violation,
      // which would send someone hunting for provenance on a page that
      // doesn't exist.
      if (!pass && /"404"|• 404\b/.test(clean)) {
        resolve({
          name: council.name, slug, ran: true, pass: false, violations: null,
          unwrapped: 0, derived: 0,
          error: `page not found at ${BASE}/council/${slug} — check the slug`,
        });
        return;
      }
      const unwrapped = parseInt((clean.match(/(\d+) unwrapped/) || [])[1] ?? '0', 10);
      const derived = parseInt((clean.match(/(\d+) derived/) || [])[1] ?? '0', 10);
      resolve({
        name: council.name,
        slug,
        ran: code !== null,
        pass,
        violations: pass ? 0 : m ? parseInt(m[1], 10) : null,
        unwrapped,
        derived,
        error: pass || m ? undefined : clean.trim().split('\n').slice(-3).join(' | ').slice(0, 220),
      });
    });
  });
}

async function mapWithConcurrency(items, limit, fn) {
  const results = new Array(items.length);
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (true) {
        const i = next++;
        if (i >= items.length) return;
        results[i] = await fn(items[i], i);
      }
    }),
  );
  return results;
}

async function main() {
  const councils = loadCouncils();
  const population = loadPopulation();
  const ranked = councils
    .map((c) => ({ c, pop: population[c.name] ?? -1 }))
    .sort((a, b) => b.pop - a.pop)
    .map((x) => x.c);
  const selected = TOP ? ranked.slice(0, TOP) : ranked;

  console.log(`\n═══ UX AUDIT BATCH (Phase 5b live gate) ═══`);
  console.log(`Base URL:    ${BASE}`);
  console.log(`Councils:    ${selected.length}   concurrency ${CONCURRENCY}\n`);

  let done = 0;
  const results = await mapWithConcurrency(selected, CONCURRENCY, async (c) => {
    const r = await runOne(c);
    done++;
    if (!r.pass) console.log(`  ✗ ${r.name} — ${r.violations ?? '?'} violation(s)${r.error ? ` [${r.error}]` : ''}`);
    if (done % 20 === 0) console.log(`  … ${done}/${selected.length}`);
    return r;
  });

  const failed = results.filter((r) => !r.pass);
  const errored = results.filter((r) => r.violations === null);

  if (!existsSync(REPORTS_DIR)) mkdirSync(REPORTS_DIR, { recursive: true });
  writeFileSync(
    join(REPORTS_DIR, 'ux-audit-batch-latest.json'),
    JSON.stringify(
      { generated: new Date().toISOString(), base: BASE, audited: results.length, passed: results.length - failed.length, failed: failed.length, results },
      null, 2,
    ),
  );

  console.log(`\n═══ RESULT ═══`);
  console.log(`  Passed 0/0:   ${results.length - failed.length} / ${results.length}`);
  console.log(`  Failed:       ${failed.length}`);
  if (errored.length) console.log(`  Could not run: ${errored.length} (see report)`);
  for (const f of failed.slice(0, 25)) {
    console.log(`    ✗ ${f.name.padEnd(26)} unwrapped=${f.unwrapped} derived=${f.derived}${f.error ? ` ${f.error}` : ''}`);
  }
  console.log(`\nReport → scripts/validate/reports/ux-audit-batch-latest.json`);
}

main().catch((e) => { console.error(e); process.exit(2); });
