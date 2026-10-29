import { describe, it, expect } from 'vitest';
import { calculateBands, formatBudget, formatCurrency, getTotalBandD, getOwnBandD, getOwnPrecept, getBillSplitYear, type Council } from '@/data/councils';

describe('calculateBands', () => {
  it('derives all bands from Band D using the statutory ninths ratios', () => {
    const bands = calculateBands(1800);
    expect(bands.D).toBe(1800);
    expect(bands.A).toBe(1200); // 6/9 = 2/3
    expect(bands.H).toBe(3600); // 2x Band D
    expect(bands.B).toBeCloseTo(1800 * (7 / 9), 10);
    expect(bands.C).toBeCloseTo(1800 * (8 / 9), 10);
    expect(bands.E).toBeCloseTo(1800 * (11 / 9), 10);
    expect(bands.F).toBeCloseTo(1800 * (13 / 9), 10);
    expect(bands.G).toBeCloseTo(1800 * (15 / 9), 10);
  });
});

describe('formatCurrency', () => {
  it('returns N/A for null', () => {
    expect(formatCurrency(null)).toBe('N/A');
  });

  it('formats with explicit 2 decimals', () => {
    expect(formatCurrency(288.45, { decimals: 2 })).toBe('£288.45');
  });

  it('defaults to 0 decimals for whole numbers', () => {
    expect(formatCurrency(112)).toBe('£112');
  });

  it('defaults to 2 decimals for fractional numbers', () => {
    expect(formatCurrency(288.45)).toBe('£288.45');
  });

  it('adds thousands separators', () => {
    expect(formatCurrency(2344.65, { decimals: 2 })).toBe('£2,344.65');
  });
});

describe('formatBudget', () => {
  // Amounts are stored in THOUSANDS of pounds (repo convention).
  it('returns N/A for null', () => {
    expect(formatBudget(null)).toBe('N/A');
  });

  it('formats millions with one decimal', () => {
    expect(formatBudget(21300)).toBe('£21.3 million');
  });

  it('formats clean millions without a decimal', () => {
    expect(formatBudget(21000)).toBe('£21 million');
  });

  it('formats billions with one decimal', () => {
    expect(formatBudget(1500000)).toBe('£1.5 billion');
  });

  it('prefixes negatives with a minus', () => {
    const out = formatBudget(-21300);
    expect(out.startsWith('-')).toBe(true);
    expect(out).toBe('-£21.3 million');
  });

  it('formats sub-million amounts as comma-separated pounds', () => {
    expect(formatBudget(500)).toBe('£500,000');
  });
});

// Shapes taken from the real data: Bradford 2026-27 (a billing authority with
// parish councils) and Kent 2025-26 (a county, which has no area total).
const bradford = {
  name: 'Bradford',
  type: 'MD',
  council_tax: { band_d_2025: 2246.15, band_d_2026: 2360.73, band_d_2024: 2055.35, band_d_2023: null, band_d_2022: null, band_d_2021: null },
  detailed: {
    precepts: [
      { authority: 'City of Bradford Metropolitan District Council', band_d: 1992.96, kind: 'council', includes_parish_average: true, band_d_excluding_parish: 1965.28 },
      { authority: 'West Yorkshire Combined Authority (police)', band_d: 278.28, kind: 'police' },
      { authority: 'West Yorkshire Fire and Rescue Authority', band_d: 89.49, kind: 'fire' },
    ],
    precepts_year: '2026-27',
    total_band_d: 2360.73,
  },
} as unknown as Council;

const kent = {
  name: 'Kent',
  type: 'SC',
  council_tax: { band_d_2025: 1691.19, band_d_2024: null, band_d_2023: null, band_d_2022: null, band_d_2021: null },
  detailed: {
    precepts: [
      { authority: 'Kent County Council', band_d: 1691.19, kind: 'council' },
      { authority: 'Kent Police and Crime Commissioner', band_d: 270.15, kind: 'police' },
      { authority: 'Kent and Medway Fire Authority', band_d: 94.86, kind: 'fire' },
    ],
    precepts_year: '2025-26',
  },
} as unknown as Council;

describe('bill split helpers', () => {
  it('total is the area Band D the rows add up to', () => {
    const rows = bradford.detailed!.precepts!;
    const sum = rows.reduce((s, p) => s + p.band_d, 0);
    expect(getTotalBandD(bradford)).toBe(2360.73);
    expect(sum).toBeCloseTo(2360.73, 2);
  });

  it('a county has no total — never its rows summed into a fake one', () => {
    expect(getTotalBandD(kent)).toBeNull();
  });

  it('own share excludes parish precepts', () => {
    expect(getOwnPrecept(bradford)?.kind).toBe('council');
    expect(getOwnBandD(bradford)).toBe(1965.28);
    expect(getOwnBandD(kent)).toBe(1691.19);
  });

  it('reports the split year, defaulting to 2025-26 without one', () => {
    expect(getBillSplitYear(bradford)).toBe('2026-27');
    expect(getBillSplitYear(kent)).toBe('2025-26');
    expect(getBillSplitYear({ name: 'X', type: 'UA', council_tax: { band_d_2025: 1 } } as unknown as Council)).toBe('2025-26');
  });

  it('falls back to a name match for rows without a kind', () => {
    const legacy = { name: 'Bradford', type: 'MD', council_tax: { band_d_2025: 1 }, detailed: { precepts: [
      { authority: 'West Yorkshire Fire and Rescue Authority', band_d: 89.49 },
      { authority: 'City of Bradford Metropolitan District Council', band_d: 1965.28 },
    ] } } as unknown as Council;
    expect(getOwnBandD(legacy)).toBe(1965.28);
  });
});
