/**
 * Per-council "what changed" data.
 *
 * Mirrors the `phase_3_5_drift_fixes` and `phase_3_6_personnel_currency_fixes`
 * sections of the manifest files in `src/data/councils/manifests/<slug>.json`,
 * but lives in the public repo so the council page builds cleanly in both
 * full-dataset mode and fixture mode (without the private data submodule).
 *
 * Add a new entry here whenever a new council ships Phase 6 with a manifest
 * that contains personnel-currency or Tier-1 drift fixes. The friction of
 * the manual sync is intentional — it forces the rollout to write a real,
 * user-facing summary rather than relying on raw JSON keys.
 */

export interface CouncilChangelogEntry {
  /** ISO date YYYY-MM-DD. */
  date: string;
  /** Plain-English description, ≤ 140 chars. */
  summary: string;
  /** Optional source label or document title. */
  source?: string;
}

/** Map: council slug → most-recent changelog entries (sorted desc). */
export const councilChangelogData: Record<string, CouncilChangelogEntry[]> = {
  adur: [
    {
      date: '2026-05-01',
      summary:
        'Council leader updated to Cllr Jeremy Gardner (Labour) — Adur changed political control on 23 May 2024.',
      source: 'democracy.adur-worthing.gov.uk Cabinet Cmt 138 (via Wayback)',
    },
    {
      date: '2026-05-01',
      summary:
        'Chief executive changed from Dr Catherine Howe to Paul Brewer.',
      source:
        'Adur & Worthing Senior Management Structure (last updated 13 Jan 2026)',
    },
    {
      date: '2026-05-01',
      summary:
        'Population corrected from 64,200 to 64,889 (verbatim ONS Mid-2024).',
      source: 'parsed-population.csv (ONS Mid-2024)',
    },
  ],
  bradford: [
    {
      date: '2026-04-22',
      summary:
        'First North-Star reference council — full Datasheet-for-Datasets audit shipped.',
      source: 'docs/BRADFORD-AUDIT.md',
    },
    {
      date: '2026-04-22',
      summary: 'Population corrected from 546,200 to 563,605 (Tier-1 ONS drift).',
      source: 'parsed-population.csv (ONS Mid-2024)',
    },
  ],
  kent: [
    {
      date: '2026-04-22',
      summary:
        'Second North-Star reference council. All sources via Internet Archive (kent.gov.uk blocks direct fetch).',
      source: 'docs/KENT-AUDIT.md',
    },
    {
      date: '2026-04-22',
      summary:
        'Reserves corrected from £85m to £43m, council tax requirement aligned to PDF Table 6.2 (£994,287,650).',
      source: 'Kent SoA + Draft Revenue Budget',
    },
  ],
  camden: [
    {
      date: '2026-04-22',
      summary:
        'Third North-Star reference council and the first London Borough.',
      source: 'docs/CAMDEN-AUDIT.md',
    },
    {
      date: '2026-04-22',
      summary:
        'Chief executive name stripped (was Jenny Rowlands 2024-25; current CE Jon Rowney — pending live confirmation).',
      source: 'Camden SoA Note 26',
    },
    {
      date: '2026-04-22',
      summary:
        'Reserves corrected from £125.7m to £17m (General Fund per §2.73), population from 218,400 to 216,943.',
      source: 'Camden SoA + ONS Mid-2024',
    },
  ],
};
