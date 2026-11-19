import { describe, expect, it } from 'vitest';
import { clamp, safeLocalPath } from './security';

describe('safeLocalPath', () => {
  it.each([
    ['/', '/'],
    ['/council/kent', '/council/kent'],
    ['/council/kent/proposals?sort=new#top', '/council/kent/proposals?sort=new#top'],
  ])('keeps the site path %s', (input, expected) => {
    expect(safeLocalPath(input)).toBe(expected);
  });

  it.each([
    [null],
    [undefined],
    [''],
    ['https://example.com/landing'],
    ['HTTPS://example.com/landing'],
    ['//example.com/landing'],
    ['/\\example.com/landing'],
    ['/\t/example.com/landing'],
    ['/\n/example.com/landing'],
    ['/\r/example.com/landing'],
    [' https://example.com/landing'],
    ['/.//example.com/landing'],
    ['/a/..//example.com/landing'],
    ['javascript:void(0)'],
    ['data:text/html,hello'],
  ])('falls back to the home page for %j', (input) => {
    expect(safeLocalPath(input)).toBe('/');
  });
});

describe('clamp', () => {
  it('keeps text on one line', () => {
    expect(clamp('one\r\ntwo\u2028three\u2029four\u0085five', 100)).toBe('one two three four five');
  });

  it('removes control characters', () => {
    expect(clamp('a\u0000b\u001Bc\u007Fd\u009Be', 100)).toBe('abcde');
  });

  it('marks text it has shortened', () => {
    expect(clamp('abcdefghij', 5)).toBe('abcd…');
  });

  it('treats missing text as empty', () => {
    expect(clamp(null, 5)).toBe('');
  });
});
