/**
 * last-verified-freshness.mjs — NORTH-STAR §16 freshness enforcement.
 *
 * Non-negotiable #6 requires every council's data re-verified quarterly at
 * minimum. This validator enforces the hard CI backstop on each council's
 * `detailed.last_verified` stamp:
 *
 *   - > 120 days (one quarter + grace) → warning: re-verification overdue
 *   - > 180 days                        → error: critically overdue (fails CI)
 *   - missing/unparseable stamp         → warning
 *
 * Council-level only: per-field `accessed` dates are covered by
 * field-staleness.mjs, and dataset-level cadence by freshness.mjs. This is
 * the last line of defence against a whole council silently rotting.
 */

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const OVERDUE_DAYS = 120;   // quarterly cadence + 30-day grace
const CRITICAL_DAYS = 180;  // NORTH-STAR §16 hard threshold

export function validate(councils, _population, report) {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  for (const c of councils) {
    report.tick();
    const stamp = c.detailed?.last_verified;

    if (!stamp || typeof stamp !== 'string') {
      report.finding(c, 'last-verified-freshness', 'missing_last_verified', 'warning',
        'No detailed.last_verified stamp — cannot tell when this council was last re-verified',
        'detailed.last_verified', String(stamp), 'ISO date within last 120 days');
      continue;
    }

    const verified = new Date(stamp);
    if (isNaN(verified.getTime())) {
      report.finding(c, 'last-verified-freshness', 'invalid_last_verified', 'warning',
        `detailed.last_verified "${stamp}" is not a parseable date`,
        'detailed.last_verified', stamp, 'ISO date (YYYY-MM-DD)');
      continue;
    }

    const daysSince = Math.floor((today - verified) / MS_PER_DAY);
    if (daysSince > CRITICAL_DAYS) {
      report.finding(c, 'last-verified-freshness', 'critically_overdue', 'error',
        `Last verified ${daysSince} days ago (${stamp}) — over the ${CRITICAL_DAYS}-day NORTH-STAR limit; council must be re-verified or dropped from STRICT_COUNCILS`,
        'detailed.last_verified', stamp, `re-verified within ${CRITICAL_DAYS} days`);
    } else if (daysSince > OVERDUE_DAYS) {
      report.finding(c, 'last-verified-freshness', 'overdue', 'warning',
        `Last verified ${daysSince} days ago (${stamp}) — quarterly re-verification is overdue`,
        'detailed.last_verified', stamp, `re-verified within ${OVERDUE_DAYS} days`);
    }
  }
}
