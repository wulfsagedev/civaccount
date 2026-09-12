import { describe, it, expect } from 'vitest';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { resolveMatchup, getPopularComparisons } from './comparisons';
import { councils, getCouncilSlug } from '@/data/councils';

const a = councils[0];
const b = councils[1];

describe('resolveMatchup', () => {
  it('resolves a well-formed matchup of two real councils', () => {
    const slug = `${getCouncilSlug(a)}-vs-${getCouncilSlug(b)}`;
    const r = resolveMatchup(slug);
    expect(r).not.toBeNull();
    expect(r!.councilA.name).toBe(a.name);
    expect(r!.councilB.name).toBe(b.name);
  });

  it('rejects a matchup with no separator', () => {
    expect(resolveMatchup('justonething')).toBeNull();
  });

  it('rejects a matchup with three parts', () => {
    const slug = `${getCouncilSlug(a)}-vs-${getCouncilSlug(b)}-vs-${getCouncilSlug(a)}`;
    expect(resolveMatchup(slug)).toBeNull();
  });

  it('rejects a matchup where one half is not a council', () => {
    expect(resolveMatchup(`${getCouncilSlug(a)}-vs-not-a-real-council`)).toBeNull();
  });

  it('rejects a matchup where neither half is a council', () => {
    expect(resolveMatchup('fake-vs-nonsense')).toBeNull();
  });

  it('every prerendered popular matchup resolves', () => {
    // A popular matchup that does not resolve would be prerendered as a 404.
    for (const m of getPopularComparisons()) {
      expect(resolveMatchup(m), `popular matchup did not resolve: ${m}`).not.toBeNull();
    }
  });
});

describe('soft-404 invariant', () => {
  // /compare/[matchup] cannot use `dynamicParams = false` the way /council and
  // /parish do: only ~13 matchups are prerendered and the rest render on
  // demand, carrying real search traffic. So an unknown matchup is rejected by
  // notFound() inside generateMetadata instead.
  //
  // That only yields a real HTTP 404 while no Suspense boundary sits above the
  // route. A root src/app/loading.tsx is exactly such a boundary: it makes Next
  // stream a 200 shell before the page resolves, after which notFound() can
  // still render the not-found UI but can no longer set the status. The result
  // is a 200 "Loading..." page cached for a year (s-maxage=31536000) across an
  // unbounded URL space.
  //
  // Routes that genuinely want a loading state declare their own loading.tsx
  // (council/[slug], council/[slug]/proposals, insights). The root one must
  // stay absent.
  it('has no root app/loading.tsx, which would reintroduce soft 404s', () => {
    const rootLoading = resolve(__dirname, '..', 'app', 'loading.tsx');
    expect(existsSync(rootLoading)).toBe(false);
  });
});
