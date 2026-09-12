import { describe, it, expect } from 'vitest';
import { TITLE_MAX, DESCRIPTION_MAX, pickWithinLimit } from './seo-limits';
import { getAreaBillExtremes } from './insights-stats';
import {
  councils,
  getAreaBandD,
  getCouncilDisplayName,
  formatCurrency,
  CURRENT_TAX_YEAR,
} from '@/data/councils';

describe('getAreaBillExtremes', () => {
  const x = getAreaBillExtremes();

  it('agrees with the reduce the ranking pages render from', () => {
    // The two pages compute their headline council inline. If that ever drifts
    // from this helper, the snippet Google shows would contradict the page.
    const billing = councils
      .map((council) => ({ council, area: getAreaBandD(council) }))
      .filter((e) => e.area !== null && e.area.year === CURRENT_TAX_YEAR) as Array<{
      council: (typeof councils)[number];
      area: { value: number };
    }>;
    const cheapest = billing.reduce((min, e) => (e.area.value < min.area.value ? e : min));
    const dearest = billing.reduce((max, e) => (e.area.value > max.area.value ? e : max));

    expect(x.cheapest.name).toBe(cheapest.council.name);
    expect(x.cheapestValue).toBe(cheapest.area.value);
    expect(x.mostExpensive.name).toBe(dearest.council.name);
    expect(x.mostExpensiveValue).toBe(dearest.area.value);
    expect(x.count).toBe(billing.length);
  });

  it('puts the cheapest below the most expensive', () => {
    expect(x.cheapestValue).toBeLessThan(x.mostExpensiveValue);
  });
});

describe('pickWithinLimit', () => {
  it('takes the first candidate that fits', () => {
    expect(pickWithinLimit(['toolongtoolong', 'short'], 6)).toBe('short');
  });

  it('prefers an earlier candidate when several fit', () => {
    expect(pickWithinLimit(['aaa', 'bb'], 10)).toBe('aaa');
  });

  it('returns the last candidate rather than undefined when none fit', () => {
    expect(pickWithinLimit(['aaaaaa', 'bbbbb'], 2)).toBe('bbbbb');
  });
});

describe('search snippets stay inside what Google renders', () => {
  const x = getAreaBillExtremes();

  // Mirrors the cascades in the two pages' generateMetadata.
  const cases = [
    {
      page: 'cheapest-council-tax',
      shortName: x.cheapest.name,
      name: getCouncilDisplayName(x.cheapest),
      amount: formatCurrency(x.cheapestValue, { decimals: 0 }),
      titles: (n: string, a: string) => [
        `Cheapest Council Tax in England ${x.year}: ${n} ${a}`,
        `${n}: Cheapest Council Tax in England ${x.year}`,
        `${n}: Cheapest Council Tax in England`,
        `Cheapest Council Tax in England ${x.year}: Full Rankings`,
      ],
      descriptions: (n: string, a: string) => [
        `${n} charges England's lowest Band D council tax in ${x.year} at ${a}. See the 20 cheapest councils, sourced from .gov.uk.`,
        `The lowest Band D council tax in England for ${x.year}, ranked across all ${x.count} billing authorities. Sourced from .gov.uk.`,
      ],
    },
    {
      page: 'most-expensive-council-tax',
      shortName: x.mostExpensive.name,
      name: getCouncilDisplayName(x.mostExpensive),
      amount: formatCurrency(x.mostExpensiveValue, { decimals: 0 }),
      titles: (n: string, a: string) => [
        `Highest Council Tax in England ${x.year}: ${n} ${a}`,
        `${n}: Highest Council Tax in England ${x.year}`,
        `${n}: Highest Council Tax in England`,
        `Highest Council Tax in England ${x.year}: Full Rankings`,
      ],
      descriptions: (n: string, a: string) => [
        `${n} charges England's highest Band D council tax in ${x.year} at ${a}. See the 20 most expensive councils, sourced from .gov.uk.`,
        `The highest Band D council tax in England for ${x.year}, ranked across all ${x.count} billing authorities. Sourced from .gov.uk.`,
      ],
    },
  ];

  for (const c of cases) {
    const title = pickWithinLimit(c.titles(c.shortName, c.amount), TITLE_MAX);
    const description = pickWithinLimit(c.descriptions(c.name, c.amount), DESCRIPTION_MAX);

    it(`${c.page}: chosen title fits`, () => {
      expect(title.length, `too long: "${title}"`).toBeLessThanOrEqual(TITLE_MAX);
    });

    it(`${c.page}: chosen description fits`, () => {
      expect(description.length, `too long: "${description}"`).toBeLessThanOrEqual(
        DESCRIPTION_MAX,
      );
    });

    it(`${c.page}: the last-resort candidates fit whatever the data does`, () => {
      const ts = c.titles(c.name, c.amount);
      const ds = c.descriptions(c.name, c.amount);
      expect(ts[ts.length - 1].length).toBeLessThanOrEqual(TITLE_MAX);
      expect(ds[ds.length - 1].length).toBeLessThanOrEqual(DESCRIPTION_MAX);
    });

    it(`${c.page}: names the council for all but the longest name in the data`, () => {
      // The cascade drops the figure, then the year, before giving up on the
      // council name. Verified against every real council rather than a
      // synthetic string, because the real names are what it has to survive.
      const failures = councils
        .map((council) => council.name)
        .filter((n) => !pickWithinLimit(c.titles(n, c.amount), TITLE_MAX).includes(n));

      // Only "Bournemouth, Christchurch & Poole" (33 chars) exhausts the
      // cascade. If a future rename pushes more councils over, this catches it.
      expect(failures.length, `titles losing the council name: ${failures.join(', ')}`).toBeLessThanOrEqual(1);
    });

    it(`${c.page}: leads with the answer, not a description of the page`, () => {
      expect(`${title} ${description}`).toMatch(/£[\d,]+/);
      expect(description).toContain(c.name);
    });
  }
});
