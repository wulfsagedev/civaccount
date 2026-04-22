/**
 * north-star-gate.mjs — CI gate enforcing NORTH-STAR-STANDARD.md.
 *
 * Runs the per-council north-star audit against the reference set.
 * Fails if any reference council regresses below 0 gaps.
 *
 * The reference set is defined here — new councils get added only
 * after they reach 0 gaps on a manual audit.
 */

import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const AUDIT_SCRIPT = join(__dirname, '..', 'audit-north-star.mjs');

/**
 * Councils that must remain north-star at 0 gaps. If any entry
 * regresses, CI fails and the commit can't land without either
 * (a) fixing the regression or (b) explicitly removing the council
 * from the set (which also fails CI via a separate check).
 */
const NORTH_STAR_REFERENCE = ['Bradford', 'Camden', 'Kent'];

export function validate(councils, _population, report) {
  for (const councilName of NORTH_STAR_REFERENCE) {
    report.tick();
    const c = councils.find((x) => x.name === councilName);
    if (!c) {
      report.finding(
        { name: councilName, ons_code: 'n/a', type: 'n/a' },
        'north-star-gate',
        'reference_council_not_loaded',
        'error',
        `NORTH_STAR_REFERENCE includes "${councilName}" but it was not loaded. Either the data file is absent or the name has drifted.`,
        null, null, null,
      );
      continue;
    }

    const result = spawnSync('node', [AUDIT_SCRIPT, `--council=${councilName}`], {
      encoding: 'utf8',
    });

    // Exit 0 = 0 gaps. Anything else means at least one gap.
    if (result.status !== 0) {
      report.finding(
        c,
        'north-star-gate',
        'north_star_regression',
        'error',
        `${councilName} is a NORTH_STAR_REFERENCE council but has gaps against NORTH-STAR-STANDARD.md. Run \`node scripts/validate/audit-north-star.mjs --council=${councilName}\` for the punch-list.`,
        null, null, null,
      );
    }
  }
}
