/**
 * citation-required.mjs — Constitution Rule 1: no uncited value.
 *
 * Every per-council data value CivAccount renders must name the document it
 * came from. This is the gate that makes an invented number impossible to
 * add: a figure with no `field_sources` entry is, by definition,
 * indistinguishable from one somebody typed in.
 *
 * Scope — the fields whose truth lives in a COUNCIL's own publication
 * (`origin: 'council_pdf' | 'council_html'` in renderable-fields.ts). National
 * dataset fields (Band D, service budgets, population) are not in scope here:
 * their provenance is the checksum-verified national CSV, enforced by
 * compare-checksums.mjs + spot-check.mjs, which is a stronger guarantee than a
 * per-council URL.
 *
 * Two independent requirements, both mandatory:
 *   1. the value has a field_sources entry with a URL at all; and
 *   2. that URL passes the source-licence rule (.gov.uk, a named OGL
 *      publisher, or a Wayback wrapper around one) — an uncheckable citation
 *      is no better than none.
 *
 * RATCHET — the point of the whole thing. The live uncited count is compared
 * against citation-floor.json. Exceed it by one and CI fails, so a new uncited
 * value cannot enter the dataset no matter who or what adds it. The floor only
 * ever moves down, as rollouts and audits pay off the existing debt.
 */

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { classifySourceUrl } from '../lib/source-licence.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const FLOOR_PATH = join(__dirname, '..', 'citation-floor.json');
const RENDERABLE_PATH = join(__dirname, '..', '..', '..', 'src', 'data', 'renderable-fields.ts');

/** Fields whose truth lives in a council's own publication. */
function loadPerCouncilFields() {
  if (!existsSync(RENDERABLE_PATH)) return null;
  const src = readFileSync(RENDERABLE_PATH, 'utf8');
  const re = /\{\s*path:\s*'([^']+)',\s*origin:\s*'([^']+)'[^}]*?status:\s*'([^']+)'[^}]*?\}/g;
  const out = [];
  let m;
  while ((m = re.exec(src))) {
    if (m[2] !== 'council_pdf' && m[2] !== 'council_html') continue;
    if (m[3] === 'removed' || m[3] === 'under_review') continue;
    out.push({ path: m[1], key: m[1].replace(/^detailed\./, '').split('.')[0] });
  }
  return out;
}

function hasValue(v) {
  if (v === undefined || v === null) return false;
  if (Array.isArray(v)) return v.length > 0;
  if (typeof v === 'string') return v.trim() !== '';
  return true;
}

export function validate(councils, _population, report) {
  const fields = loadPerCouncilFields();
  if (!fields) {
    report.finding({ name: '[system]', ons_code: '' }, 'citation-required', 'renderable_fields_missing', 'error',
      'src/data/renderable-fields.ts not found — cannot determine which fields require a citation');
    return;
  }

  // De-dupe by key: several renderable paths can share one field_sources entry
  // (e.g. detailed.top_suppliers.annual_spend and .description).
  const keys = [...new Set(fields.map((f) => f.key))];

  let uncited = 0;
  let unlicensed = 0;

  for (const c of councils) {
    const sources = c.detailed?.field_sources || {};
    for (const key of keys) {
      const value = c.detailed?.[key];
      if (!hasValue(value)) continue;
      report.tick();

      const url = sources[key]?.url;
      if (!url) {
        uncited++;
        report.finding(c, 'citation-required', 'value_without_citation', 'warning',
          `${key} has a value but no field_sources entry — nothing states where this number came from`,
          `detailed.${key}`, typeof value === 'object' ? '[object]' : String(value),
          'a field_sources entry naming the source document');
        continue;
      }

      const verdict = classifySourceUrl(url);
      if (!verdict.allowed) {
        unlicensed++;
        report.finding(c, 'citation-required', 'citation_not_government_source', 'warning',
          `${key} is cited to ${verdict.host ?? url} — ${verdict.reason}`,
          `detailed.field_sources.${key}.url`, url,
          '.gov.uk, a named OGL publisher, or a Wayback copy of one');
      }
    }
  }

  // ── The ratchet ──
  let floor = null;
  if (existsSync(FLOOR_PATH)) {
    try {
      floor = JSON.parse(readFileSync(FLOOR_PATH, 'utf8')).max_uncited_values;
    } catch {
      floor = null;
    }
  }

  if (typeof floor !== 'number') {
    report.finding({ name: '[system]', ons_code: '' }, 'citation-required', 'citation_floor_missing', 'error',
      'citation-floor.json missing or unreadable — the ratchet is what stops new uncited values entering, so a missing floor is a failure, not a pass');
    return;
  }

  if (uncited > floor) {
    report.finding({ name: '[system]', ons_code: '' }, 'citation-required', 'uncited_values_above_floor', 'error',
      `${uncited} values carry no citation, above the floor of ${floor}. A new uncited value has entered the dataset. ` +
      `Cite it, or remove it — the floor may only be lowered, never raised to accommodate new debt.`,
      'scripts/validate/citation-floor.json', String(uncited), `<= ${floor}`);
  } else if (uncited < floor) {
    report.finding({ name: '[system]', ons_code: '' }, 'citation-required', 'citation_floor_can_be_lowered', 'info',
      `${uncited} uncited values, below the floor of ${floor} — lower max_uncited_values in citation-floor.json to ${uncited} to lock the gain in`);
  }

  // Unlicensed citations get their own ratchet, same principle: existing debt
  // is frozen and visible, a new one is impossible. Blocking CI outright on
  // pre-existing debt would mean nothing can ship until it is all paid off —
  // which in practice gets the check disabled, not the debt fixed.
  const unlicensedFloor = existsSync(FLOOR_PATH)
    ? (JSON.parse(readFileSync(FLOOR_PATH, 'utf8')).max_unlicensed_citations ?? 0)
    : 0;

  if (unlicensed > unlicensedFloor) {
    report.finding({ name: '[system]', ons_code: '' }, 'citation-required', 'unlicensed_citations_above_floor', 'error',
      `${unlicensed} values are cited to a non-government source, above the floor of ${unlicensedFloor}. ` +
      `Re-source it to the council's own .gov.uk page, or add the host to OGL_PUBLISHERS with a written justification.`,
      'scripts/validate/citation-floor.json', String(unlicensed), `<= ${unlicensedFloor}`);
  } else if (unlicensed < unlicensedFloor) {
    report.finding({ name: '[system]', ons_code: '' }, 'citation-required', 'unlicensed_floor_can_be_lowered', 'info',
      `${unlicensed} unlicensed citations, below the floor of ${unlicensedFloor} — lower max_unlicensed_citations to ${unlicensed} to lock the gain in`);
  }
}
