// Council search, as launch QA (29 Oct 2026) tried it: "and" for "&", full
// stops dropped, and a whole word ranked before a match inside one.
import { describe, expect, it } from 'vitest';
import { searchCouncilsFast } from './search-index';

const first = (q: string) => searchCouncilsFast(q, 10)[0]?.name ?? '';

describe('council search', () => {
  it('finds Kingston upon Hull before Solihull for "Hull"', () => {
    expect(first('Hull')).toMatch(/Hull/);
    expect(first('Hull')).not.toMatch(/Solihull/);
  });
  it('reads "and" as "&", both ways', () => {
    expect(first('Brighton and Hove')).toMatch(/Brighton & Hove/);
    expect(first('Bath and North East Somerset')).toMatch(/Bath & North East Somerset/);
    expect(first('Folkestone & Hythe')).toMatch(/Folkestone/);
  });
  it('ignores full stops', () => {
    expect(first('St. Helens')).toMatch(/St Helens/);
  });
});
