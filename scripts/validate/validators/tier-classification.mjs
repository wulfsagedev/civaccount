/**
 * tier-classification.mjs — NORTH-STAR §4 + §17 validator.
 *
 * Enforces the field-provenance schema: every field_sources entry
 * must carry `tier` (1-5) + `extraction_method`, with tier-specific
 * evidence requirements:
 *
 *   Tier 1-3  → sha256_at_access required
 *   Tier 4    → archive_exempt reason required
 *   Tier 5    → cross_check_ref required (future; currently not enforced)
 *
 * Soft-mode: emits warnings (not errors) for entries missing tier /
 * extraction_method. Becomes a hard failure for reference councils
 * (Bradford, Camden, Kent) via a separate north-star gate.
 */

const VALID_TIERS = new Set([1, 2, 3, 4, 5]);
const VALID_METHODS = new Set([
  'csv_row',
  'pdf_page',
  'aggregate',
  'socrata_query',
  'manual_read',
]);
const VALID_ARCHIVE_EXEMPT = new Set([
  'cloudflare_blocked',
  'bot_blocked',
  'no_document_form',
  'live_page',
]);

// Strict enforcement councils — those that have been fully audited
// under NORTH-STAR.md §6 and are expected to carry tier + extraction_method
// on every entry.
const STRICT_COUNCILS = new Set(['Bradford', 'Kent', 'Camden', 'Manchester', 'Birmingham', 'Leeds', 'Surrey', 'Cornwall', 'Liverpool', 'Bristol', 'Lancashire', 'Tower Hamlets', 'Hampshire', 'Essex', 'Hertfordshire', 'Sheffield', 'Westminster', 'Nottinghamshire', 'Staffordshire', 'Wiltshire', 'Newcastle upon Tyne', 'Croydon', 'Norfolk', 'West Sussex', 'Derbyshire', 'Lincolnshire', 'Suffolk', 'Leicestershire', 'Cambridgeshire', 'Gloucestershire', 'Worcestershire', 'North Yorkshire', 'Devon', 'East Sussex', 'Oxfordshire', 'Wakefield', 'Doncaster', 'Coventry', 'Bolton', 'Salford', 'Wirral', 'Sandwell', 'Sefton', 'Stockport', 'Wolverhampton', 'Barnsley', 'Solihull', 'St Helens', 'Dudley', 'Oldham', 'York', 'Plymouth', 'Portsmouth', 'Luton', 'Hillingdon', 'Bromley', 'Bexley', 'Greenwich', 'Lambeth', 'Wandsworth', 'Newham', 'Hounslow', 'Brighton & Hove', 'Reading', 'Stoke-on-Trent', 'Telford & Wrekin', 'Southwark', 'Barnet', 'Haringey', 'Merton', 'Cheshire East', 'Cheshire West & Chester', 'Buckinghamshire', 'Bedford', 'Kingston upon Thames', 'Kensington & Chelsea', 'Redbridge', 'Waltham Forest']);

export function validate(councils, _population, report) {
  for (const c of councils) {
    const fs = c.detailed?.field_sources;
    if (!fs) continue;

    const isStrict = STRICT_COUNCILS.has(c.name);
    const severity = isStrict ? 'error' : 'warning';

    for (const [fieldKey, entry] of Object.entries(fs)) {
      report.tick();
      if (!entry || typeof entry !== 'object') continue;

      // --- tier (required) -------------------------------------------------
      if (entry.tier == null) {
        report.finding(
          c,
          'tier-classification',
          'missing_tier',
          severity,
          `field_sources.${fieldKey} is missing tier (NORTH-STAR.md §4)`,
          `field_sources.${fieldKey}.tier`,
          undefined,
          'required: one of 1 | 2 | 3 | 4 | 5',
        );
        continue;
      }
      if (!VALID_TIERS.has(entry.tier)) {
        report.finding(
          c,
          'tier-classification',
          'invalid_tier',
          severity,
          `field_sources.${fieldKey}.tier="${entry.tier}" is not one of 1-5`,
          `field_sources.${fieldKey}.tier`,
          entry.tier,
          '1 | 2 | 3 | 4 | 5',
        );
        continue;
      }

      // --- extraction_method (required) ------------------------------------
      if (entry.extraction_method == null) {
        report.finding(
          c,
          'tier-classification',
          'missing_extraction_method',
          severity,
          `field_sources.${fieldKey} is missing extraction_method (NORTH-STAR.md §4)`,
          `field_sources.${fieldKey}.extraction_method`,
          undefined,
          'required: csv_row | pdf_page | aggregate | socrata_query | manual_read',
        );
        continue;
      }
      if (!VALID_METHODS.has(entry.extraction_method)) {
        report.finding(
          c,
          'tier-classification',
          'invalid_extraction_method',
          severity,
          `field_sources.${fieldKey}.extraction_method="${entry.extraction_method}" is not a valid value`,
          `field_sources.${fieldKey}.extraction_method`,
          entry.extraction_method,
          'csv_row | pdf_page | aggregate | socrata_query | manual_read',
        );
        continue;
      }

      // --- tier-specific evidence ------------------------------------------
      if (entry.tier <= 3) {
        if (!entry.sha256_at_access) {
          report.finding(
            c,
            'tier-classification',
            'tier_le_3_missing_sha256',
            severity,
            `field_sources.${fieldKey} is tier ${entry.tier} but has no sha256_at_access (NORTH-STAR.md §4)`,
            `field_sources.${fieldKey}.sha256_at_access`,
            undefined,
            'required: SHA-256 hex string of the archived source file',
          );
        } else if (!/^[a-f0-9]{64}$/.test(entry.sha256_at_access)) {
          report.finding(
            c,
            'tier-classification',
            'malformed_sha256',
            severity,
            `field_sources.${fieldKey}.sha256_at_access is not a 64-char lowercase hex string`,
            `field_sources.${fieldKey}.sha256_at_access`,
            entry.sha256_at_access,
            '64-char lowercase hex',
          );
        }
      }

      if (entry.tier === 4) {
        if (!entry.archive_exempt) {
          report.finding(
            c,
            'tier-classification',
            'tier_4_missing_archive_exempt',
            severity,
            `field_sources.${fieldKey} is tier 4 but has no archive_exempt reason (NORTH-STAR.md §4)`,
            `field_sources.${fieldKey}.archive_exempt`,
            undefined,
            'required: cloudflare_blocked | bot_blocked | no_document_form | live_page',
          );
        } else if (!VALID_ARCHIVE_EXEMPT.has(entry.archive_exempt)) {
          report.finding(
            c,
            'tier-classification',
            'invalid_archive_exempt',
            severity,
            `field_sources.${fieldKey}.archive_exempt="${entry.archive_exempt}" is not a recognised value`,
            `field_sources.${fieldKey}.archive_exempt`,
            entry.archive_exempt,
            'cloudflare_blocked | bot_blocked | no_document_form | live_page',
          );
        }
      }
    }
  }
}
