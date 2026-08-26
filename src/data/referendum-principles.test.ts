import { describe, it, expect } from 'vitest';
import {
  REFERENDUM_PRINCIPLES,
  getCouncilLimit,
  isAtPermittedMaximum,
  isExcessive,
} from './referendum-principles';

/**
 * These tests exist because of a specific, shipped bug.
 *
 * The insight cards applied a flat 4.99% to all 317 councils. On the 2025-26
 * figures that produced a "cap breakers" list headed by Bradford (+9.29%),
 * Windsor & Maidenhead (+8.31%), Newham (+7.66%) and Birmingham (+7.36%) —
 * every one of which had stayed INSIDE a higher limit government had granted
 * it. The site named four councils for breaking a rule they had not broken.
 *
 * The cases below are that bug, frozen.
 */

const cc = (type: string, slug: string) => ({ type, slug });

describe('getCouncilLimit', () => {
  it('gives social care authorities the standard percentage', () => {
    for (const type of ['UA', 'MD', 'LB', 'SC']) {
      const limit = getCouncilLimit(cc(type, 'somewhere'), '2026-27');
      expect(limit).not.toBeNull();
      expect(limit!.pct).toBe(5);
      expect(limit!.bespoke).toBe(false);
      // Only districts carry a cash floor.
      expect(limit!.absGbp).toBeNull();
    }
  });

  it('gives districts a lower percentage and a cash floor', () => {
    const limit = getCouncilLimit(cc('SD', 'somewhere'), '2026-27')!;
    expect(limit.pct).toBe(3);
    expect(limit.absGbp).toBe(5);
  });

  it('lets a bespoke grant override the type default', () => {
    const shropshire = getCouncilLimit(cc('UA', 'shropshire'), '2026-27')!;
    expect(shropshire.pct).toBe(9);
    expect(shropshire.standardPct).toBe(5);
    expect(shropshire.bespoke).toBe(true);
  });

  it('applies bespoke grants per-year, not forever', () => {
    // Bradford held a 10% limit in 2025-26 and a standard one in 2026-27.
    expect(getCouncilLimit(cc('MD', 'bradford'), '2025-26')!.pct).toBe(10);
    expect(getCouncilLimit(cc('MD', 'bradford'), '2026-27')!.pct).toBe(5);
    expect(getCouncilLimit(cc('MD', 'bradford'), '2026-27')!.bespoke).toBe(false);
  });

  it('returns null for a year we have not sourced', () => {
    expect(getCouncilLimit(cc('UA', 'anywhere'), '2019-20')).toBeNull();
  });
});

describe('the four councils the old flat-4.99% rule wrongly flagged', () => {
  // 2025-26 Band D, from the dataset, rounded to the pound.
  const cases = [
    { name: 'Bradford', slug: 'bradford', type: 'MD', from: 1956, to: 2138, granted: 10 },
    { name: 'Windsor & Maidenhead', slug: 'windsor-and-maidenhead', type: 'UA', from: 1450, to: 1570, granted: 9 },
    { name: 'Newham', slug: 'newham', type: 'LB', from: 1590, to: 1712, granted: 9 },
    { name: 'Birmingham', slug: 'birmingham', type: 'MD', from: 1988, to: 2134, granted: 7.5 },
  ];

  for (const c of cases) {
    it(`${c.name} rose above 4.99% but stayed inside its granted ${c.granted}% limit`, () => {
      const limit = getCouncilLimit(cc(c.type, c.slug), '2025-26')!;
      const risePct = ((c.to - c.from) / c.from) * 100;

      expect(limit.pct).toBe(c.granted);
      expect(risePct).toBeGreaterThan(4.99); // what the old rule saw
      expect(risePct).toBeLessThan(c.granted); // what it actually did
      expect(isExcessive(limit, c.from, c.to)).toBe(false);
      expect(isAtPermittedMaximum(limit, c.from, c.to)).toBe(false);
    });
  }
});

describe('isAtPermittedMaximum', () => {
  it('counts a council that set exactly one penny under the trigger', () => {
    // 4.99% against a 5% trigger is the classic "went to the cap" case.
    const limit = getCouncilLimit(cc('UA', 'anywhere'), '2026-27')!;
    expect(isAtPermittedMaximum(limit, 2000, 2000 * 1.0499)).toBe(true);
    expect(isExcessive(limit, 2000, 2000 * 1.0499)).toBe(false);
  });

  it('does not count a council comfortably under its limit', () => {
    const limit = getCouncilLimit(cc('UA', 'anywhere'), '2026-27')!;
    expect(isAtPermittedMaximum(limit, 2000, 2060)).toBe(false); // +3%
  });

  it('judges a district on the greater of its percentage and cash floor', () => {
    const limit = getCouncilLimit(cc('SD', 'anywhere'), '2026-27')!;

    // Small district: 3% of £120 is £3.60, so the £5 floor binds. A £5 rise
    // is 4.17% — well over 3%, and still the maximum it may set.
    expect(isAtPermittedMaximum(limit, 120, 125)).toBe(true);
    expect(isAtPermittedMaximum(limit, 120, 123)).toBe(false);

    // Larger district: 3% of £250 is £7.50, which now exceeds the £5 floor,
    // so £5 is no longer enough to be at the maximum.
    expect(isAtPermittedMaximum(limit, 250, 255)).toBe(false);
    expect(isAtPermittedMaximum(limit, 250, 257.5)).toBe(true);
  });
});

describe('sourcing', () => {
  it('every year carries a GOV.UK source with a verbatim excerpt', () => {
    for (const [year, p] of Object.entries(REFERENDUM_PRINCIPLES)) {
      expect(p.year).toBe(year);
      expect(p.source.url).toMatch(/^https:\/\/www\.gov\.uk\//);
      expect(p.source.excerpt.length).toBeGreaterThan(40);
      expect(p.source.bespokeExcerpt.length).toBeGreaterThan(40);
      expect(p.source.section).toContain('Referendum principles');
    }
  });

  it('names every bespoke council in the excerpt that justifies it', () => {
    // A limit nobody can trace back to the published wording is exactly the
    // kind of unsourced number the Data Constitution exists to prevent.
    for (const p of Object.values(REFERENDUM_PRINCIPLES)) {
      for (const slug of Object.keys(p.bespokePct)) {
        const firstWord = slug.split('-')[0];
        expect(p.source.bespokeExcerpt.toLowerCase()).toContain(firstWord);
      }
    }
  });
});
