import { describe, it, expect } from 'vitest';
import { calculateBands, formatBudget, formatCurrency } from '@/data/councils';

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
