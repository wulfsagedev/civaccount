/**
 * source-truth.mjs — Exact-match validator against GOV.UK source data.
 *
 * Every auto-synced field in the TS data files must EXACTLY match
 * its parsed CSV source. Zero tolerance. The source CSV is derived
 * directly from the local GOV.UK ODS file — no estimates, no rounding.
 *
 * If this validator fires, either:
 *   1. Someone manually edited a band_d value (run npm run sync:band-d)
 *   2. The ODS was updated but the CSV wasn't regenerated (run python3 scripts/parse-area-band-d.py)
 *   3. The sync script has a bug
 *
 * This is the validator that would have caught the Bradford issue.
 */

import { loadCsv, buildOnsIndex } from '../load-councils.mjs';

const BAND_D_FIELDS = ['band_d_2021', 'band_d_2022', 'band_d_2023', 'band_d_2024', 'band_d_2025'];

export function validate(councils, population, report) {
  const areaCsv = loadCsv('parsed-area-band-d.csv');
  if (areaCsv.length === 0) {
    report.finding(
      { name: 'SYSTEM', ons_code: '' }, 'source-truth', 'csv_missing', 'error',
      'parsed-area-band-d.csv not found — run: python3 scripts/parse-area-band-d.py',
      'system', null, 'parsed-area-band-d.csv'
    );
    return;
  }

  const areaIndex = buildOnsIndex(areaCsv);

  for (const c of councils) {
    const ons = c.ons_code;
    const ref = areaIndex.get(ons);

    // County councils (SC) are not billing authorities — skip
    if (c.type === 'SC') continue;

    if (!ref) {
      // Council not in the Area CT source — expected for abolished/merged authorities
      report.tick();
      continue;
    }

    // Check each band_d year: exact match, zero tolerance
    const ct = c.council_tax || {};
    for (const field of BAND_D_FIELDS) {
      report.tick();
      const refVal = ref[field] ? parseFloat(ref[field]) : null;
      const ourVal = ct[field] != null ? parseFloat(ct[field]) : null;

      if (refVal == null) continue; // No reference data for this year
      if (ourVal == null) {
        // Only flag as error if council_tax block exists at all
        if (ct.band_d_2025 != null) {
          report.finding(c, 'source-truth', `${field}_missing`, 'error',
            `${field} is missing but GOV.UK source has ${refVal}`,
            `council_tax.${field}`, null, refVal);
        }
        continue;
      }

      // Exact match (allow floating point imprecision up to 0.01)
      if (Math.abs(ourVal - refVal) > 0.01) {
        const diff = ourVal - refVal;
        report.finding(c, 'source-truth', `${field}_mismatch`, 'error',
          `${field} is ${ourVal} but GOV.UK source says ${refVal} (diff: ${diff > 0 ? '+' : ''}${diff.toFixed(2)})`,
          `council_tax.${field}`, ourVal, refVal);
      }
    }

    // Check total_band_d matches band_d_2025
    report.tick();
    const d = c.detailed || {};
    const totalBandD = d.total_band_d != null ? parseFloat(d.total_band_d) : null;
    const bandD2025 = ct.band_d_2025 != null ? parseFloat(ct.band_d_2025) : null;
    if (totalBandD != null && bandD2025 != null && Math.abs(totalBandD - bandD2025) > 0.01) {
      report.finding(c, 'source-truth', 'total_band_d_drift', 'error',
        `total_band_d (${totalBandD}) does not match band_d_2025 (${bandD2025})`,
        'detailed.total_band_d', totalBandD, bandD2025);
    }
  }
}
