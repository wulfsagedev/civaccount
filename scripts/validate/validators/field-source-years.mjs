/**
 * field-source-years.mjs — enforce `data_year` on every field_sources entry.
 *
 * Per DATA-YEAR-POLICY.md: every rendered value must be attributable to
 * a fiscal year from its source document. This validator walks every
 * council's `field_sources` and fails if any entry is missing `data_year`
 * or has a malformed value.
 *
 * Runs in the main `validate.mjs` pipeline.
 */

const VALID_YEAR_RE = /^(\d{4}-\d{2}|mid-\d{4}|current)$/;

export function validate(councils, _population, report) {
  for (const c of councils) {
    const fs = c.detailed?.field_sources;
    if (!fs) continue;

    for (const [fieldKey, entry] of Object.entries(fs)) {
      report.tick();

      if (!entry || typeof entry !== 'object') {
        report.finding(
          c,
          'field-source-years',
          'field_source_malformed',
          'error',
          `field_sources.${fieldKey} is not an object`,
          `field_sources.${fieldKey}`,
          null,
          'object with { url, title, accessed, data_year }'
        );
        continue;
      }

      if (entry.data_year == null || entry.data_year === '') {
        report.finding(
          c,
          'field-source-years',
          'field_source_missing_data_year',
          'error',
          `field_sources.${fieldKey} is missing required data_year`,
          `field_sources.${fieldKey}.data_year`,
          undefined,
          'required string like "2025-26" | "2024-25" | "mid-2024" | "current"'
        );
        continue;
      }

      if (!VALID_YEAR_RE.test(entry.data_year)) {
        report.finding(
          c,
          'field-source-years',
          'field_source_bad_data_year',
          'error',
          `field_sources.${fieldKey}.data_year "${entry.data_year}" does not match "YYYY-YY" | "mid-YYYY" | "current"`,
          `field_sources.${fieldKey}.data_year`,
          entry.data_year,
          '"2025-26" | "2024-25" | "mid-2024" | "current"'
        );
      }
    }
  }
}
