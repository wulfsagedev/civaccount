/**
 * lib/populate-logic.mjs — pure TS-surgery logic for 05-populate.
 *
 * Everything here is string → string with no file I/O, so the
 * self-test can round-trip a fixture council block and assert the
 * exact output. The script owns reading/writing files; this module
 * owns getting the edit right.
 */

export const TITLE_LABEL = {
  'statement-of-accounts': 'Statement of Accounts',
  'pay-policy': 'Pay Policy Statement',
  'councillor-allowances': "Members' Allowances Scheme",
  'councillors-earnings': "Members' Allowances Scheme",
  mtfs: 'Medium Term Financial Strategy',
  'budget-book': 'Budget Book',
  budget: 'Budget',
  unknown: 'Council publication',
};

// Scalar type per field — numbers are written bare, strings quoted.
export const FIELD_KIND = {
  chief_executive: 'string',
  chief_executive_salary: 'number',
  councillor_basic_allowance: 'number',
  total_allowances_cost: 'number',
  reserves: 'number',
  budget_gap: 'number',
  savings_target: 'number',
};

// A raw LF/CR inside a double-quoted TS literal is a SYNTAX ERROR in the
// generated data file (bit the Amber Valley rollout, 2026-06-10 — hand-added
// multi-line excerpts). Escape every control character so the output is
// always a single-line, parseable literal. The two-char \n sequence is the
// house style for multi-line excerpts; screenshot-parity canonicalises it.
export const esc = (s) => String(s)
  .replace(/\\/g, '\\\\')
  .replace(/"/g, '\\"')
  .replace(/\r\n?/g, '\n') // canonicalise CRLF / lone CR to LF first
  .replace(/\n/g, '\\n')
  .replace(/\t/g, '\\t')
  .replace(/[\u0000-\u001f]/g, (c) => `\\u${c.charCodeAt(0).toString(16).padStart(4, '0')}`);

/** "…/Basildon_Draft_Annual_Financial_Report_2024_25_v3.pdf" →
 *  "Basildon Draft Annual Financial Report 2024 25" — used when the
 *  archived meta carries no recognised document_type. */
export function titleFromUrl(url) {
  try {
    const seg = decodeURIComponent(new URL(url).pathname.split('/').filter(Boolean).pop() || '');
    return seg
      .replace(/\.[a-z0-9]+$/i, '')
      .replace(/_v\d+$/i, '')
      .replace(/[_-]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  } catch {
    return '';
  }
}

/** Find the matching `}` for the `{` at openIdx. Skips the contents of
 *  double-quoted strings (including \" escapes) — an excerpt containing
 *  a brace must not derail the match. */
export function braceMatch(src, openIdx) {
  let depth = 0;
  let inStr = false;
  for (let i = openIdx; i < src.length; i++) {
    const ch = src[i];
    if (inStr) {
      if (ch === '\\') i++;
      else if (ch === '"') inStr = false;
    } else if (ch === '"') inStr = true;
    else if (ch === '{') depth++;
    else if (ch === '}') { depth--; if (depth === 0) return i; }
  }
  return -1;
}

/**
 * Build the full field_sources entry text (NORTH-STAR §4 schema, house
 * 8/10-space indentation, trailing commas).
 *   opts: { councilName, slug, pngOnDisk, today }
 */
export function buildFieldSourceEntry(field, cand, opts) {
  const { councilName, slug, pngOnDisk, today } = opts;
  const isPdf = /\.pdf(\?|$)/i.test(cand.source_url) || true; // archived docs are PDFs here
  const url = cand.source_url.includes('#') || !cand.page || !isPdf
    ? cand.source_url
    : `${cand.source_url}#page=${cand.page}`;
  // 'unknown' must NOT claim the generic label — a filename-derived
  // title ("Basildon Draft Annual Financial Report 2024 25") tells the
  // reader far more than "Council publication".
  const label = cand.document_type && cand.document_type !== 'unknown'
    ? TITLE_LABEL[cand.document_type]
    : null;
  const fromUrl = label ? null : titleFromUrl(cand.source_url);
  const title = fromUrl && fromUrl.length >= 12
    ? fromUrl
    : `${councilName} ${label || TITLE_LABEL.unknown}${cand.fiscal_year && cand.fiscal_year !== 'unknown' ? ` ${cand.fiscal_year}` : ''}`;
  const pngName = `${field}-p${cand.page}.png`;

  const lines = [
    `        ${field}: {`,
    `          url: "${esc(url)}",`,
    `          title: "${esc(title)}",`,
    `          accessed: "${today}",`,
    `          data_year: "${esc(cand.fiscal_year || 'unknown')}",`,
    `          tier: 3,`,
    `          extraction_method: "pdf_page",`,
    `          sha256_at_access: "${cand.sha256}",`,
  ];
  if (cand.page) lines.push(`          page: ${cand.page},`);
  if (cand.excerpt) lines.push(`          excerpt: "${esc(cand.excerpt)}",`);
  if (pngOnDisk) lines.push(`          page_image_url: "/archive/${slug}/images/${pngName}",`);
  lines.push('        },');
  return { text: lines.join('\n'), pngName };
}

/** Upsert a scalar inside the council block's `detailed:` map. */
export function upsertScalar(block, field, valueText) {
  const scalarRe = new RegExp(`(\\n {6}${field}: )("[^"]*"|-?[\\d.]+)(,)`);
  const scalarMatch = block.match(scalarRe);
  if (scalarMatch) {
    if (scalarMatch[2] !== valueText) {
      return { block: block.replace(scalarRe, `$1${valueText}$3`), change: `${field}: ${scalarMatch[2]} → ${valueText}` };
    }
    return { block, change: `${field}: unchanged (${valueText}) — citation refreshed` };
  }
  return {
    block: block.replace('detailed: {', `detailed: {\n      ${field}: ${valueText},`),
    change: `${field}: (new) ${valueText}`,
  };
}

/** Upsert a field_sources entry (create map / replace entry / insert entry). */
export function upsertFieldSources(block, field, entryText) {
  const fsIdx = block.indexOf('field_sources: {');
  if (fsIdx === -1) {
    // No field_sources map yet — create one at the end of detailed,
    // just before last_verified if present.
    const insertion = `field_sources: {\n${entryText}\n      },\n      `;
    if (block.includes('\n      last_verified:')) {
      return {
        block: block.replace(/\n {6}last_verified:/, `\n      ${insertion.trimEnd()}\n      last_verified:`),
        change: `${field}: field_sources map created with entry`,
      };
    }
    const dIdx = block.indexOf('detailed: {');
    const dEnd = braceMatch(block, block.indexOf('{', dIdx));
    return {
      block: `${block.slice(0, dEnd)}  ${insertion.trimEnd()}\n    ${block.slice(dEnd)}`,
      change: `${field}: field_sources map created with entry`,
    };
  }
  const keyRe = new RegExp(`\\n {8}${field}: \\{`);
  const keyMatch = block.slice(fsIdx).match(keyRe);
  if (keyMatch) {
    // Replace the existing entry block. keyStart sits on the first char
    // of the old entry's 8-space indent, so the replaced range swallows
    // that indent — entryText must keep its own (a trimStart() here put
    // the key at column 0; bit the Ashfield rollout, 2026-06-10).
    const keyStart = fsIdx + keyMatch.index + 1; // skip leading \n
    const openBrace = block.indexOf('{', keyStart);
    const closeBrace = braceMatch(block, openBrace);
    const after = block[closeBrace + 1] === ',' ? closeBrace + 2 : closeBrace + 1;
    return {
      block: `${block.slice(0, keyStart)}${entryText}${block.slice(after)}`,
      change: `${field}: field_sources entry replaced`,
    };
  }
  return {
    block: block.replace('field_sources: {', `field_sources: {\n${entryText}`),
    change: `${field}: field_sources entry added`,
  };
}

/**
 * Post-write verification: confirm the block now contains the scalar
 * with the expected value AND a parseable field_sources entry for the
 * field. Run by 05 after --apply (re-reading the file from disk) so a
 * surgery bug can never pass silently.
 */
export function verifyBlockContains(block, field, valueText) {
  const scalarRe = new RegExp(`\\n {6}${field}: ${valueText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')},`);
  if (!scalarRe.test(block)) return { ok: false, reason: `scalar ${field}: ${valueText} not found after write` };
  const keyRe = new RegExp(`\\n {8}${field}: \\{`);
  const fsIdx = block.indexOf('field_sources: {');
  if (fsIdx === -1 || !keyRe.test(block.slice(fsIdx))) {
    return { ok: false, reason: `field_sources.${field} entry not found after write` };
  }
  const keyStart = fsIdx + block.slice(fsIdx).match(keyRe).index + 1;
  const openBrace = block.indexOf('{', keyStart);
  const closeBrace = braceMatch(block, openBrace);
  if (closeBrace === -1) return { ok: false, reason: `field_sources.${field} entry has unbalanced braces` };
  // PARSE the entry instead of substring-scanning it: a raw newline
  // inside a string literal is a TS syntax error that substring checks
  // sail straight past (the Amber Valley excerpt bug, 2026-06-10). The
  // entry is plain object-literal syntax, so the JS engine is the parser.
  let entry;
  try {
    entry = new Function(`"use strict"; return (${block.slice(openBrace, closeBrace + 1)});`)();
  } catch (e) {
    return { ok: false, reason: `field_sources.${field} entry does not parse: ${e.message}` };
  }
  for (const required of ['url', 'sha256_at_access', 'accessed', 'tier']) {
    if (entry[required] == null) return { ok: false, reason: `field_sources.${field} missing ${required}` };
  }
  return { ok: true };
}
