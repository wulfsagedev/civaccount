/**
 * freshness.mjs — Flag stale data sources based on expected update cadence.
 *
 * Reads source-manifest.json and compares each source's `next_expected_update`
 * against today. Severity ramps with how overdue the source is:
 *   - not yet due              → no finding
 *   - overdue <30 days         → warning: approaching staleness
 *   - overdue 30-90 days       → warning: data is stale
 *   - overdue >90 days         → warning: data is critically stale (info-level for CI)
 *
 * Note: freshness only emits warnings — stale source dates don't make existing
 * data wrong, so we never block CI on freshness alone. Action is still required.
 *
 * Sources without `next_expected_update` (e.g. update_frequency: "continuous")
 * are skipped — they have no fixed cadence to check against.
 */
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const MANIFEST_PATH = join(__dirname, '..', 'source-manifest.json');

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export function validate(councils, population, report) {
  if (!existsSync(MANIFEST_PATH)) {
    report.finding(
      { name: '[system]', ons_code: '' },
      'freshness', 'manifest_missing', 'error',
      'source-manifest.json not found — cannot verify data freshness'
    );
    return;
  }

  const manifest = JSON.parse(readFileSync(MANIFEST_PATH, 'utf-8'));
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  for (const source of manifest.sources) {
    report.tick();

    // Skip sources with no fixed cadence (e.g. "continuous" update_frequency)
    if (!source.next_expected_update) continue;

    const expected = new Date(source.next_expected_update);
    if (isNaN(expected.getTime())) {
      report.finding(
        { name: '[system]', ons_code: '' },
        'freshness', 'invalid_date', 'error',
        `Source "${source.id}" has invalid next_expected_update: ${source.next_expected_update}`,
        source.id, source.next_expected_update
      );
      continue;
    }

    const overdueDays = Math.floor((today - expected) / MS_PER_DAY);

    // Not yet overdue — all good
    if (overdueDays < 0) continue;

    const label = `${source.id} (${source.publisher}, data year ${source.data_year})`;

    if (overdueDays > 90) {
      report.finding(
        { name: '[system]', ons_code: '' },
        'freshness', 'critically_stale', 'warning',
        `${label} is critically stale — expected update on ${source.next_expected_update}, overdue by ${overdueDays} days. Re-download from ${source.gov_uk_page || 'publisher'}.`,
        source.id, source.last_downloaded, source.next_expected_update
      );
    } else if (overdueDays >= 30) {
      report.finding(
        { name: '[system]', ons_code: '' },
        'freshness', 'stale', 'warning',
        `${label} is stale — expected update on ${source.next_expected_update}, overdue by ${overdueDays} days. Check for a newer release.`,
        source.id, source.last_downloaded, source.next_expected_update
      );
    } else {
      report.finding(
        { name: '[system]', ons_code: '' },
        'freshness', 'approaching_staleness', 'warning',
        `${label} is approaching staleness — expected update on ${source.next_expected_update}, overdue by ${overdueDays} days.`,
        source.id, source.last_downloaded, source.next_expected_update
      );
    }
  }
}
