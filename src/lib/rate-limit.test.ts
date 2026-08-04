import { describe, it, expect } from 'vitest';
import { getClientIP, checkRateLimit } from '@/lib/rate-limit';

function requestWithHeaders(headers: Record<string, string>): Request {
  return new Request('https://x', { headers });
}

describe('getClientIP', () => {
  it('prefers x-vercel-forwarded-for and takes the first entry', () => {
    const req = requestWithHeaders({
      'x-vercel-forwarded-for': '1.2.3.4, 5.6.7.8',
      'x-real-ip': '9.9.9.9',
      'x-forwarded-for': '8.8.8.8',
    });
    expect(getClientIP(req)).toBe('1.2.3.4');
  });

  it('falls back to x-real-ip when x-vercel-forwarded-for is absent', () => {
    const req = requestWithHeaders({ 'x-real-ip': '9.9.9.9' });
    expect(getClientIP(req)).toBe('9.9.9.9');
  });

  it('uses leftmost x-forwarded-for entry, trimmed and lowercased', () => {
    const req = requestWithHeaders({ 'x-forwarded-for': '  AB:CD::1 , 2.2.2.2' });
    expect(getClientIP(req)).toBe('ab:cd::1');
  });

  it('returns "unknown" when no IP headers are present', () => {
    expect(getClientIP(requestWithHeaders({}))).toBe('unknown');
  });
});

describe('checkRateLimit (in-memory fallback)', () => {
  // No Redis env vars under test, so the in-memory limiter is exercised.
  // Unique identifiers per test avoid cross-test state bleed in the
  // module-level map.
  it('allows the first request for a fresh identifier', async () => {
    const result = await checkRateLimit(`test-fresh-${Date.now()}-${Math.random()}`, {
      limit: 2,
      windowSeconds: 60,
    });
    expect(result.success).toBe(true);
    expect(result.remaining).toBe(1);
  });

  it('blocks once the limit is exceeded within the window', async () => {
    const id = `test-exceed-${Date.now()}-${Math.random()}`;
    const config = { limit: 2, windowSeconds: 60 };
    expect((await checkRateLimit(id, config)).success).toBe(true);
    expect((await checkRateLimit(id, config)).success).toBe(true);
    const third = await checkRateLimit(id, config);
    expect(third.success).toBe(false);
    expect(third.remaining).toBe(0);
  });
});
