/**
 * field-staleness.mjs — Per-field-group staleness based on field_sources accessed dates.
 *
 * Phase 5b: each council's `detailed.field_sources` map has `accessed` ISO dates
 * per field group (chief_executive_salary, councillor_basic_allowance, cabinet,
 * budget_gap, salary_bands). This validator flags individual field groups that
 * are stale, not just sources that are stale globally.
 *
 *   - field accessed > 12 months ago → warning (stale)
 *   - field accessed > 24 months ago → warning (critically stale)
 *   - missing accessed date         → info (recommend re-verification)
 *
 * Why warnings only: stale `accessed` dates don't mean the data is wrong —
 * they mean we haven't re-verified it recently. Action is still required.
 */

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export function validate(councils, population, report) {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  // Track distribution for summary
  const fieldsTracked = new Map();
  const staleByField = new Map();

  for (const c of councils) {
    const d = c.detailed || {};

    // We don't have field_sources fully parsed by the loader, so extract from raw section
    if (!c._raw_section) continue;
    const raw = c._raw_section;

    const fsIdx = raw.indexOf('field_sources:');
    if (fsIdx === -1) continue;

    // Find the end of field_sources block (closing brace at matching depth)
    let depth = 0;
    let endIdx = raw.length;
    for (let si = fsIdx + 'field_sources:'.length; si < raw.length; si++) {
      if (raw[si] === '{') depth++;
      else if (raw[si] === '}') { depth--; if (depth === 0) { endIdx = si + 1; break; } }
    }
    const fsBlock = raw.substring(fsIdx, endIdx);

    // Parse each "fieldname: { url, title, accessed }" entry
    const fieldPattern = /(\w+):\s*\{[^}]*?accessed:\s*"(\d{4}-\d{2}-\d{2})"/g;
    let m;
    while ((m = fieldPattern.exec(fsBlock)) !== null) {
      const fieldName = m[1];
      const accessedStr = m[2];

      report.tick();
      fieldsTracked.set(fieldName, (fieldsTracked.get(fieldName) || 0) + 1);

      const accessed = new Date(accessedStr);
      if (isNaN(accessed.getTime())) continue;

      const daysSince = Math.floor((today - accessed) / MS_PER_DAY);
      const monthsSince = Math.floor(daysSince / 30.44);

      if (monthsSince > 24) {
        staleByField.set(fieldName, (staleByField.get(fieldName) || 0) + 1);
        report.finding(c, 'field-staleness', `${fieldName}_critically_stale`, 'warning',
          `${fieldName} source last verified ${monthsSince} months ago (${accessedStr}) — re-check the linked URL`,
          `detailed.field_sources.${fieldName}.accessed`, accessedStr, '< 24 months');
      } else if (monthsSince > 12) {
        staleByField.set(fieldName, (staleByField.get(fieldName) || 0) + 1);
        report.finding(c, 'field-staleness', `${fieldName}_stale`, 'warning',
          `${fieldName} source last verified ${monthsSince} months ago (${accessedStr})`,
          `detailed.field_sources.${fieldName}.accessed`, accessedStr, '< 12 months');
      }
    }
  }
}
