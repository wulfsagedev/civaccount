#!/usr/bin/env node
/**
 * audit-all.mjs — run the deterministic North-Star audit gates across EVERY
 * council in one pass, in search-demand priority order.
 *
 * Why this exists: `/audit-council <Name>` runs seven gates for one council.
 * Auditing 317 councils that way means 317 sessions. This runs the gates that
 * are fully deterministic (no network, no browser, no judgement) for all of
 * them in a few minutes, and produces a ranked defect list telling you exactly
 * which councils need the expensive per-council gates.
 *
 * It does NOT replace `/audit-council`. It cannot: gates 3 (live URL check),
 * 5 (live browser UX sweep) and 6 (live-site reality check) need the network
 * and a dev server, and the CE/Leader staleness check needs judgement. Those
 * stay per-council. This tool tells you where to spend them.
 *
 * Gates covered here:
 *   Gate 1  structural — every renderable field has URL, data year, live URL,
 *           sha256 fingerprint, and appears on /provenance
 *           (spawns audit-north-star.mjs, the authoritative implementation)
 *   Gate 2  Tier-1 drift — Band D vs GOV.UK CSV at penny precision
 *           (read from the proof engine report)
 *   Gate 4  validator suite — per-council errors/warnings
 *           (read from the validator report)
 *   +       evidence + coverage: how many rendered numbers are backed by
 *           re-derivable archived evidence (the proof engine's own scoreboard)
 *
 * Priority order: real Search Console impressions when an import exists
 * (scripts/seo/import-search-console.mjs), else population descending.
 * Population is only a proxy: search demand for "<council> council
 * tax" tracks population closely, and it is data we hold and can verify —
 * unlike search volume, which needs Search Console (not yet connected). When
 * GSC is wired up, swap PRIORITY_SOURCE for real impressions.
 *
 * Usage:
 *   node scripts/validate/audit-all.mjs                 # all councils
 *   node scripts/validate/audit-all.mjs --top=25        # top 25 by priority
 *   node scripts/validate/audit-all.mjs --concurrency=8
 *   node scripts/validate/audit-all.mjs --skip-structural   # reports only (fast)
 *
 * Exit code: 0 always (this is a reporting tool — CI gating is validate.mjs's
 * job). Read the report, not the exit code.
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { spawn } from 'child_process';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { loadCouncils, loadPopulation } from './load-councils.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPORTS_DIR = join(__dirname, 'reports');
const POPULATION_SOURCE = 'ONS mid-2024 population (proxy for search demand)';
const GSC_PATH = join(__dirname, '..', 'seo', 'data', 'gsc-pages.json');

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const m = a.match(/^--([^=]+)(?:=(.*))?$/);
    return m ? [m[1], m[2] ?? true] : [a, true];
  }),
);

const CONCURRENCY = Math.max(1, parseInt(args.concurrency ?? '8', 10) || 8);
const TOP = args.top ? parseInt(args.top, 10) : null;

function readJsonIfPresent(path) {
  if (!existsSync(path)) return null;
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch {
    return null;
  }
}

/**
 * Mirror of generateSlug() in src/data/councils.ts — the rule that actually
 * builds the live URLs, and therefore the only rule that can match a Search
 * Console export. Note this differs from the looser slugify() in proof.mjs /
 * audit-north-star.mjs, which does not strip apostrophes: for "King's Lynn &
 * West Norfolk" the app serves /council/kings-lynn-and-west-norfolk while the
 * looser rule yields king-s-lynn-and-west-norfolk. Using the wrong one here
 * would silently score that council as having zero search demand.
 */
function slugify(name) {
  return name
    .toLowerCase()
    .replace(/['\u2018\u2019]/g, '')
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-+/g, '-');
}

/** Run the authoritative structural auditor for one council. */
function runStructural(name) {
  return new Promise((resolve) => {
    const proc = spawn(
      process.execPath,
      [join(__dirname, 'audit-north-star.mjs'), `--council=${name}`],
      { cwd: join(__dirname, '..', '..') },
    );
    let out = '';
    proc.stdout.on('data', (d) => (out += d));
    proc.stderr.on('data', (d) => (out += d));
    proc.on('close', (code) => {
      // Strip ANSI so the gap lines parse regardless of colour support.
      const clean = out.replace(/\[[0-9;]*m/g, '');
      const gaps = {};
      let total = 0;
      for (const m of clean.matchAll(/^\s*[✓✗x]?\s*(\d)\.\s*([^:]+):\s*(\d+)\s*gaps?/gim)) {
        const n = parseInt(m[3], 10);
        gaps[m[2].trim()] = n;
        total += n;
      }
      const parsed = Object.keys(gaps).length > 0;
      resolve({
        ran: code === 0 || parsed,
        parsed,
        exitCode: code,
        totalGaps: parsed ? total : null,
        gaps,
        raw: parsed ? undefined : clean.slice(0, 400),
      });
    });
  });
}

async function mapWithConcurrency(items, limit, fn) {
  const results = new Array(items.length);
  let next = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (true) {
      const i = next++;
      if (i >= items.length) return;
      results[i] = await fn(items[i], i);
    }
  });
  await Promise.all(workers);
  return results;
}

function severityOf(row) {
  // Ordered worst-first. Anything that makes a RENDERED number untrustworthy
  // outranks anything that is merely unproven or incomplete.
  if (row.tier1.applicable && row.tier1.failed > 0) return 'tier1-drift';
  if (row.validator.errors > 0) return 'validator-error';
  if (row.structural.totalGaps > 0) return 'structural-gap';
  if (row.coverage.rendered > 0 && row.coverage.backed < row.coverage.rendered) return 'unbacked-numbers';
  if (row.evidence.unproven > 0) return 'unproven-evidence';
  return 'clean';
}

const SEVERITY_RANK = {
  'tier1-drift': 0,
  'validator-error': 1,
  'structural-gap': 2,
  'unbacked-numbers': 3,
  'unproven-evidence': 4,
  clean: 5,
};

async function main() {
  const councils = loadCouncils();
  const population = loadPopulation();

  const proof = readJsonIfPresent(join(REPORTS_DIR, 'proof-latest.json'));
  const validation = readJsonIfPresent(join(REPORTS_DIR, 'validation-latest.json'));

  if (!proof) {
    console.error('✗ No proof-latest.json — run `npm run proof` first (it is the scoreboard).');
    process.exit(2);
  }

  const proofByOns = new Map();
  for (const c of proof.councils || []) proofByOns.set(c.ons, c);

  // Per-council validator tallies.
  const vByName = new Map();
  for (const f of validation?.findings || []) {
    const key = f.council || f.name;
    if (!key) continue;
    if (!vByName.has(key)) vByName.set(key, { errors: 0, warnings: 0, info: 0 });
    const t = vByName.get(key);
    if (f.severity === 'error') t.errors++;
    else if (f.severity === 'warning') t.warnings++;
    else t.info++;
  }

  // Priority: measured search demand beats a proxy for it. When a Search
  // Console import exists, rank by impressions. Councils absent from the
  // export have genuinely no measured demand yet, so they fall back to the
  // population proxy and sort below every council that has real data —
  // never mixed into the same scale, which would compare unlike units.
  const gsc = readJsonIfPresent(GSC_PATH);
  const gscCouncils = gsc?.councils ?? null;
  const usingGsc = !!gscCouncils && Object.keys(gscCouncils).length > 0;

  const PRIORITY_SOURCE = usingGsc
    ? `Search Console impressions (${gsc.source}, imported ${gsc.generated.slice(0, 10)}) — ` +
      `${Object.keys(gscCouncils).length}/${councils.length} councils measured, rest by population`
    : POPULATION_SOURCE;

  const ranked = councils
    .map((c) => {
      const pop = population[c.name] ?? null;
      const g = usingGsc ? gscCouncils[slugify(c.name)] : undefined;
      return {
        council: c,
        pop,
        impressions: g ? g.impressions : null,
        clicks: g ? g.clicks : null,
        position: g ? g.bestPosition : null,
      };
    })
    .sort((a, b) => {
      // Measured councils first, ordered by impressions.
      if (a.impressions != null && b.impressions != null) return b.impressions - a.impressions;
      if (a.impressions != null) return -1;
      if (b.impressions != null) return 1;
      // Unmeasured: population proxy, nulls last.
      return (b.pop ?? -1) - (a.pop ?? -1);
    });

  const selected = TOP ? ranked.slice(0, TOP) : ranked;

  console.log(`\n═══ CivAccount AUDIT — ALL COUNCILS ═══`);
  console.log(`Councils in scope:   ${selected.length}${TOP ? ` (top ${TOP} of ${ranked.length})` : ''}`);
  console.log(`Priority order:      ${PRIORITY_SOURCE}`);
  console.log(`Proof report:        ${proof.generated || 'unknown'}`);
  console.log(`Structural gate:     ${args['skip-structural'] ? 'SKIPPED (--skip-structural)' : `running at concurrency ${CONCURRENCY}`}`);
  console.log('');

  let done = 0;
  const rows = await mapWithConcurrency(selected, CONCURRENCY, async ({ council, pop, impressions, clicks, position }, i) => {
    const p = proofByOns.get(council.ons_code) || {};
    const structural = args['skip-structural']
      ? { ran: false, parsed: false, totalGaps: null, gaps: {} }
      : await runStructural(council.name);

    done++;
    if (done % 25 === 0 || done === selected.length) {
      process.stdout.write(`  audited ${done}/${selected.length}\n`);
    }

    const v = vByName.get(council.name) || { errors: 0, warnings: 0, info: 0 };
    const row = {
      rank: i + 1,
      name: council.name,
      slug: p.slug || slugify(council.name),
      type: council.type,
      population: pop,
      impressions,
      clicks,
      searchPosition: position,
      tier1: {
        applicable: p.tier1?.applicable ?? null,
        checked: p.tier1?.checked ?? 0,
        exact: p.tier1?.exact ?? 0,
        failed: p.tier1?.failed ?? 0,
        safe: p.tier1?.safe ?? null,
        fails: p.tier1?.fails ?? [],
      },
      evidence: {
        proven: p.tier3?.proven ?? 0,
        unproven: p.tier3?.unproven ?? 0,
        tier4: p.tier3?.tier4 ?? 0,
      },
      coverage: {
        rendered: p.coverage?.rendered ?? 0,
        backed: p.coverage?.covered ?? 0,
        unbacked: p.coverage?.holes ?? [],
      },
      validator: v,
      structural,
    };
    row.severity = severityOf(row);
    return row;
  });

  const bySeverity = {};
  for (const r of rows) bySeverity[r.severity] = (bySeverity[r.severity] || 0) + 1;

  const report = {
    tool: 'audit-all',
    generated: new Date().toISOString(),
    priority_source: PRIORITY_SOURCE,
    proof_generated: proof.generated || null,
    validation_generated: validation?.generated || null,
    structural_gate_run: !args['skip-structural'],
    councils_audited: rows.length,
    by_severity: bySeverity,
    gates_not_covered: [
      'Gate 3 — live Tier-4 URL check (needs network)',
      'Gate 3b — chief executive / leader currency (needs judgement)',
      'Gate 5 — live browser UX sweep (needs dev server)',
      'Gate 6 — live-site reality check (needs archived PDFs + network)',
    ],
    councils: rows,
  };

  if (!existsSync(REPORTS_DIR)) mkdirSync(REPORTS_DIR, { recursive: true });
  writeFileSync(join(REPORTS_DIR, 'audit-all-latest.json'), JSON.stringify(report, null, 2));

  console.log('\n═══ RESULTS BY SEVERITY (worst first) ═══');
  for (const sev of Object.keys(SEVERITY_RANK)) {
    if (!bySeverity[sev]) continue;
    const mark = sev === 'clean' ? '🟢' : sev === 'tier1-drift' || sev === 'validator-error' ? '🔴' : '🟡';
    console.log(`  ${mark} ${sev.padEnd(20)} ${bySeverity[sev]}`);
  }

  const worst = rows
    .filter((r) => r.severity !== 'clean')
    .sort((a, b) => SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity] || a.rank - b.rank)
    .slice(0, 20);

  if (worst.length) {
    console.log('\n═══ TOP DEFECTS (severity, then search priority) ═══');
    for (const r of worst) {
      const detail =
        r.severity === 'tier1-drift'
          ? r.tier1.fails.map((f) => `${f.field} ${f.rendered}≠${f.source}`).join(', ')
          : r.severity === 'validator-error'
            ? `${r.validator.errors} validator errors`
            : r.severity === 'structural-gap'
              ? Object.entries(r.structural.gaps).filter(([, n]) => n > 0).map(([k, n]) => `${k}:${n}`).join(', ')
              : r.severity === 'unbacked-numbers'
                ? `${r.coverage.rendered - r.coverage.backed} unbacked: ${r.coverage.unbacked.slice(0, 4).join(', ')}`
                : `${r.evidence.unproven} unproven`;
      console.log(`  #${String(r.rank).padStart(3)} ${r.name.padEnd(26)} ${r.severity.padEnd(18)} ${detail}`);
    }
  }

  const totalRendered = rows.reduce((s, r) => s + r.coverage.rendered, 0);
  const totalBacked = rows.reduce((s, r) => s + r.coverage.backed, 0);
  console.log('\n═══ PROVABILITY (can a reader verify the number themselves?) ═══');
  console.log(`  Rendered numbers backed by evidence:  ${totalBacked} / ${totalRendered}` +
    (totalRendered ? `  (${((totalBacked / totalRendered) * 100).toFixed(1)}%)` : ''));
  console.log(`  Councils with zero unbacked numbers:  ${rows.filter((r) => r.coverage.rendered > 0 && r.coverage.backed === r.coverage.rendered).length} / ${rows.length}`);
  console.log(`\nReport → scripts/validate/reports/audit-all-latest.json`);
  console.log(`Gates NOT covered here (still need /audit-council per council):`);
  for (const g of report.gates_not_covered) console.log(`  · ${g}`);
}

main().catch((err) => {
  console.error('audit-all failed:', err);
  process.exit(2);
});
