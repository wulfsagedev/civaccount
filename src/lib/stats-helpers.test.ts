import { describe, it, expect } from 'vitest';
import { median } from '@/lib/stats-helpers';

describe('median', () => {
  it('averages the two middle values on even-length input (the bug this fixes)', () => {
    expect(median([10, 20, 30, 40])).toBe(25);
  });

  it('returns the middle value on odd-length input', () => {
    expect(median([10, 20, 30])).toBe(20);
  });

  it('returns 0 for an empty array', () => {
    expect(median([])).toBe(0);
  });

  it('returns the single value for a one-element array', () => {
    expect(median([5])).toBe(5);
  });

  it('sorts before picking the median', () => {
    expect(median([40, 10, 30, 20])).toBe(25);
  });

  it('does not mutate its input', () => {
    const input = [3, 1, 2];
    median(input);
    expect(input).toEqual([3, 1, 2]);
  });
});
