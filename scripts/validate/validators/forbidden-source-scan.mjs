/**
 * forbidden-source-scan.mjs — the source-licence gate (NORTH-STAR §3,
 * CLAUDE.md "Data Sources", owner directive 2026-06-10).
 *
 * Every URL a council record carries — field_sources (url + wayback),
 * documents, sources, open-data links, the top-level *_url fields —
 * must be ONS / GOV.UK / a named OGL publisher. Zero tolerance:
 * a violation on a North-Star council is an ERROR (blocks CI); on a
 * not-yet-rolled-out council it is a WARNING (its rollout fixes it —
 * and the pipeline gates in 01-inventory/05-populate stop any NEW
 * violation from entering regardless of council).
 *
 * The rule itself lives in lib/source-licence.mjs (shared with the
 * pipeline gates and covered by pipeline-selftest fixtures).
 *
 * Was a scaffold no-op ("roadmap Phase E") until 2026-06-10 — the rule
 * existed only as prose, which is exactly how an unlicensed source
 * could have crept in silently.
 */

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

import { classifySourceUrl, collectCouncilUrls } from '../lib/source-licence.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));

// North-Star councils (zero-tolerance set) — parse tier-classification's
// STRICT_COUNCILS so there is exactly one list to maintain.
function loadStrictCouncils() {
  const path = join(__dirname, 'tier-classification.mjs');
  if (!existsSync(path)) return new Set();
  const src = readFileSync(path, 'utf-8');
  const m = src.match(/STRICT_COUNCILS = new Set\(\[([\s\S]*?)\]\)/);
  if (!m) return new Set();
  return new Set([...m[1].matchAll(/'([^']+)'/g)].map((x) => x[1]));
}

// Councils where ANY violation is a hard CI error. Bradford first
// (owner directive 2026-06-10); councils join as audits confirm them
// clean. Everyone else gets warnings + the ratchet below.
const ZERO_TOLERANCE_COUNCILS = new Set(['Bradford']);

// Ratchet: the recorded violation count may only go DOWN. A new
// violation anywhere — even on a not-yet-cleaned council — exceeds the
// floor and errors the build. Lower the floor as cleanups land:
// update scripts/validate/source-licence-floor.json to the new count.
const FLOOR_PATH = join(__dirname, '..', 'source-licence-floor.json');

export function validate(councils, _population, report) {
  const strict = loadStrictCouncils();
  let total = 0;

  for (const c of councils) {
    const severity = ZERO_TOLERANCE_COUNCILS.has(c.name) ? 'error' : 'warning';
    for (const { where, url } of collectCouncilUrls(c)) {
      report.tick();
      const verdict = classifySourceUrl(url);
      if (verdict.allowed) continue;
      total++;
      const strictNote = strict.has(c.name) && severity === 'warning'
        ? ' [North-Star council — clean this at next audit, then add to ZERO_TOLERANCE_COUNCILS]'
        : '';
      report.finding(
        c,
        'forbidden-source-scan',
        'source_licence_violation',
        severity,
        `${where}: ${verdict.reason}${strictNote}`,
        where,
        url,
        'ONS / GOV.UK / named OGL publisher only (lib/source-licence.mjs)',
      );
    }
  }

  // Ratchet check — violations may never increase.
  let floor = null;
  if (existsSync(FLOOR_PATH)) {
    try { floor = JSON.parse(readFileSync(FLOOR_PATH, 'utf-8')).max_violations; } catch {}
  }
  if (floor != null && total > floor) {
    report.finding(
      { name: 'SYSTEM', ons_code: '' },
      'forbidden-source-scan',
      'source_licence_ratchet',
      'error',
      `Source-licence violations INCREASED: ${total} found, floor is ${floor}. A non-OGL source has been added somewhere — remove it. (If a cleanup legitimately lowered the count, update source-licence-floor.json.)`,
      'system', total, `≤ ${floor}`,
    );
  } else if (floor != null && total < floor) {
    report.finding(
      { name: 'SYSTEM', ons_code: '' },
      'forbidden-source-scan',
      'source_licence_ratchet',
      'info',
      `Source-licence violations dropped ${floor} → ${total}. Lock it in: set max_violations to ${total} in source-licence-floor.json.`,
      'system', total, `≤ ${floor}`,
    );
  }
}
