#!/usr/bin/env node
/**
 * generate-queue.mjs — build/refresh ROLLOUT-QUEUE.json: every council
 * not yet at North-Star standard, in rollout order.
 *
 * Order: districts first (smallest applicable field set, most
 * pattern-repetitive), then unitaries, mets, London boroughs, counties;
 * alphabetical within each type. The driver works strictly top-down;
 * deferrals are recorded in place and revisited at the end.
 *
 * Existing queue state is PRESERVED on refresh — a council already
 * marked shipped/deferred keeps its status; only membership and
 * ordering are recomputed (a council that reached STRICT_COUNCILS
 * drops out of the queue entirely).
 *
 * Usage: node scripts/council-research/generate-queue.mjs
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { parseCsvLine } from './lib/tier1-refs.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..', '..');
const QUEUE_PATH = join(__dirname, 'ROLLOUT-QUEUE.json');

// North-Star-complete set = tier-classification's STRICT_COUNCILS (the
// single list every rollout appends to at Phase 7).
const tcSrc = readFileSync(join(REPO_ROOT, 'scripts', 'validate', 'validators', 'tier-classification.mjs'), 'utf-8');
const strict = new Set([...tcSrc.match(/STRICT_COUNCILS = new Set\(\[([\s\S]*?)\]\)/)[1].matchAll(/'([^']+)'/g)].map((m) => m[1]));

// Full council list from the parity tracker.
const csv = readFileSync(join(REPO_ROOT, 'src', 'data', 'councils', 'tracking', 'kent-parity-audit.csv'), 'utf-8');
const rows = csv.trim().split('\n').slice(1).map((l) => {
  const [name, ons_code, type] = parseCsvLine(l).map((c) => c.trim().replace(/^"|"$/g, ''));
  return { name, ons_code, type };
});

const TYPE_ORDER = ['District Councils', 'Unitary Authorities', 'Metropolitan Districts', 'London Boroughs', 'County Councils'];

const remaining = rows
  .filter((r) => r.name && !strict.has(r.name))
  .sort((a, b) =>
    TYPE_ORDER.indexOf(a.type) - TYPE_ORDER.indexOf(b.type) ||
    a.name.localeCompare(b.name),
  );

// Preserve prior statuses.
let prior = {};
if (existsSync(QUEUE_PATH)) {
  try {
    for (const e of JSON.parse(readFileSync(QUEUE_PATH, 'utf-8')).queue ?? []) prior[e.name] = e;
  } catch {}
}

const queue = remaining.map((r) => ({
  name: r.name,
  ons_code: r.ons_code,
  type: r.type,
  status: prior[r.name]?.status ?? 'queued', // queued | shipped | deferred
  attempts: prior[r.name]?.attempts ?? 0,
  ...(prior[r.name]?.deferred_reason ? { deferred_reason: prior[r.name].deferred_reason } : {}),
  ...(prior[r.name]?.shipped_at ? { shipped_at: prior[r.name].shipped_at } : {}),
}));

writeFileSync(QUEUE_PATH, JSON.stringify({
  generated_at: new Date().toISOString(),
  north_star_complete: strict.size,
  total_councils: rows.length,
  remaining: queue.filter((q) => q.status !== 'shipped').length,
  queue,
}, null, 2) + '\n');

const counts = {};
for (const q of queue) counts[q.status] = (counts[q.status] ?? 0) + 1;
console.log(`Queue: ${queue.length} councils (${JSON.stringify(counts)}) — ${strict.size} already North-Star complete`);
console.log('Next up:', queue.filter((q) => q.status === 'queued').slice(0, 6).map((q) => q.name).join(' · '));
