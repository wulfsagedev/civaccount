#!/usr/bin/env node
/**
 * pipeline-status.mjs — the monitoring view over the research pipeline.
 *
 * Answers, in one command: which councils are mid-pipeline, what phase
 * is each at, when did each last run, and did ANYTHING fail recently.
 * Reads status/<slug>.json (latest state) + status/runs.jsonl (the
 * append-only journal of every run ever made).
 *
 * Usage:
 *   npm run pipeline:status                      # overview + recent failures
 *   node scripts/council-research/pipeline-status.mjs --council=Basildon  # one council's full history
 *   node scripts/council-research/pipeline-status.mjs --failures          # every non-ok run ever
 */

import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const STATUS_DIR = join(__dirname, 'status');
const JOURNAL = join(STATUS_DIR, 'runs.jsonl');

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const m = a.match(/^--([^=]+)(?:=(.*))?$/);
    return m ? [m[1], m[2] ?? true] : [a, true];
  }),
);

function loadJournal() {
  if (!existsSync(JOURNAL)) return [];
  return readFileSync(JOURNAL, 'utf8')
    .trim()
    .split('\n')
    .filter(Boolean)
    .map((l) => { try { return JSON.parse(l); } catch { return { script: '(corrupt journal line)', status: 'failed', raw: l }; } });
}

const PHASE_ORDER = [
  ['phase_0_inventory', '0 inv'],
  ['phase_1_archive', '1 arc'],
  ['phase_1b_page_images', '1b img'],
  ['phase_2_extract', '2 ext'],
  ['phase_3_5_tier1_crosscheck', '3.5 t1'],
  ['phase_4_populate', '4 pop'],
];

function main() {
  const journal = loadJournal();

  // ── Single-council deep view ──────────────────────────────────────
  if (args.council && args.council !== true) {
    const name = String(args.council);
    const slug = name.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const statusPath = join(STATUS_DIR, `${slug}.json`);
    if (existsSync(statusPath)) {
      const st = JSON.parse(readFileSync(statusPath, 'utf8'));
      console.log(`${st.council ?? name} — phase state:`);
      for (const [k, v] of Object.entries(st.phases || {})) {
        console.log(`  ${v.done ? '✓' : '✗'} ${k}  (${v.at ?? '?'})${v.drift ? ` drift=${v.drift}` : ''}${v.parse_failures ? ` parse_failures=${v.parse_failures}` : ''}`);
      }
    } else {
      console.log(`No status file for ${name} (${slug}.json) — pipeline never ran.`);
    }
    const runs = journal.filter((r) => r.council === name || r.council === slug);
    console.log(`\nRun history (${runs.length} runs):`);
    for (const r of runs) {
      const icon = r.status === 'ok' ? '✓' : r.status === 'blocked' ? '◦' : '✗';
      console.log(`  ${icon} ${r.finished_at ?? r.started}  ${r.script.padEnd(18)} ${r.status}${r.reason ? ` — ${r.reason}` : ''}${r.error ? ` — ${String(r.error).split('\n')[0]}` : ''}`);
    }
    return;
  }

  // ── Failures view ─────────────────────────────────────────────────
  if (args.failures) {
    const bad = journal.filter((r) => r.status !== 'ok' && r.status !== 'blocked');
    console.log(`Non-ok pipeline runs (${bad.length} total, 'blocked' preconditions excluded):\n`);
    for (const r of bad) {
      console.log(`  ✗ ${r.finished_at ?? r.started}  ${(r.council ?? '—').padEnd(22)} ${r.script.padEnd(18)} ${r.status}${r.reason ? ` — ${r.reason}` : ''}${r.error ? ` — ${String(r.error).split('\n')[0]}` : ''}`);
    }
    if (bad.length === 0) console.log('  none — every recorded run succeeded or was blocked on a precondition.');
    return;
  }

  // ── Overview ──────────────────────────────────────────────────────
  const statusFiles = existsSync(STATUS_DIR)
    ? readdirSync(STATUS_DIR).filter((f) => f.endsWith('.json') && !f.startsWith('batch-'))
    : [];

  console.log(`Pipeline status — ${statusFiles.length} council(s) tracked, ${journal.length} journaled run(s)\n`);
  console.log(`  ${'council'.padEnd(26)} ${PHASE_ORDER.map(([, label]) => label.padEnd(7)).join('')} last activity`);
  for (const f of statusFiles.sort()) {
    let st;
    try { st = JSON.parse(readFileSync(join(STATUS_DIR, f), 'utf8')); } catch { continue; }
    const cells = PHASE_ORDER.map(([key, label]) => {
      const p = (st.phases || {})[key];
      const mark = !p ? '·' : p.done ? '✓' : '✗';
      return mark.padEnd(7);
    }).join('');
    console.log(`  ${String(st.council ?? f.replace('.json', '')).padEnd(26)} ${cells} ${st.last_session ?? ''}`);
  }

  const recentBad = journal.filter((r) => r.status !== 'ok' && r.status !== 'blocked').slice(-8);
  console.log('');
  if (recentBad.length > 0) {
    console.log(`⚠ Recent failures (last ${recentBad.length} — full list: --failures):`);
    for (const r of recentBad) {
      console.log(`  ✗ ${r.finished_at ?? r.started}  ${(r.council ?? '—').padEnd(22)} ${r.script} — ${r.reason ?? r.error?.split('\n')[0] ?? r.status}`);
    }
  } else {
    console.log('✓ No failed runs in the journal.');
  }
  console.log('\nLegend: ✓ done · ✗ ran-but-not-done (read the council view) · · never ran');
  console.log('Deep view: node scripts/council-research/pipeline-status.mjs --council=<Name>');
}

main();
