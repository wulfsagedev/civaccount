// Council search, as launch QA (29 Oct 2026) tried it: "and" for "&", full
// stops dropped, and a whole word ranked before a match inside one.
import { describe, expect, it } from 'vitest';
import { searchCouncilsFast } from './search-index';
import { councils } from '@/data/councils';

// These cases name real councils. CI without the private dataset runs on the
// three-council fixture, which has none of them, so they run only where the
// councils exist (locally, and in data-repo CI).
const has = (name: string) => councils.some((c) => c.name.includes(name));
const withCouncils = (...names: string[]) => (names.every(has) ? it : it.skip);

const first = (q: string) => searchCouncilsFast(q, 10)[0]?.name ?? '';

describe('council search', () => {
  withCouncils('Hull', 'Solihull')('finds Kingston upon Hull before Solihull for "Hull"', () => {
    expect(first('Hull')).toMatch(/Hull/);
    expect(first('Hull')).not.toMatch(/Solihull/);
  });
  withCouncils('Brighton & Hove', 'Bath & North East Somerset', 'Folkestone')('reads "and" as "&", both ways', () => {
    expect(first('Brighton and Hove')).toMatch(/Brighton & Hove/);
    expect(first('Bath and North East Somerset')).toMatch(/Bath & North East Somerset/);
    expect(first('Folkestone & Hythe')).toMatch(/Folkestone/);
  });
  withCouncils('St Helens')('ignores full stops', () => {
    expect(first('St. Helens')).toMatch(/St Helens/);
  });
});
