import { describe, it, expect } from 'vitest';
import { parseIntParam } from '@/lib/api-params';

describe('parseIntParam', () => {
  const bounds = { fallback: 20, min: 0, max: 50 };

  it('falls back on non-numeric input (the NaN bug this guards)', () => {
    expect(parseIntParam('abc', bounds)).toBe(20);
  });

  it('falls back when the param is absent (null)', () => {
    expect(parseIntParam(null, bounds)).toBe(20);
  });

  it('clamps values above max', () => {
    expect(parseIntParam('999', bounds)).toBe(50);
  });

  it('clamps values below min', () => {
    expect(parseIntParam('-5', { fallback: 0, min: 0, max: 50 })).toBe(0);
  });

  it('passes through valid in-range values', () => {
    expect(parseIntParam('30', bounds)).toBe(30);
  });

  it('truncates numeric prefixes the way parseInt does, then clamps', () => {
    expect(parseIntParam('30abc', bounds)).toBe(30);
  });

  it('falls back on empty string', () => {
    expect(parseIntParam('', bounds)).toBe(20);
  });
});
