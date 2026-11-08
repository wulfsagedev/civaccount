import { afterEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/csp-report/route';

function report(fields: Record<string, unknown>) {
  return new NextRequest('https://www.civaccount.co.uk/api/csp-report', {
    method: 'POST',
    headers: { 'content-type': 'application/csp-report', 'x-forwarded-for': '203.0.113.7' },
    body: JSON.stringify({ 'csp-report': fields }),
  });
}

describe('CSP report log line', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('writes one prefixed line whatever the fields hold', async () => {
    const info = vi.spyOn(console, 'info').mockImplementation(() => {});

    const response = await POST(report({
      'effective-directive': 'script-src\nsecond line',
      'blocked-uri': 'https://example.com/a\r\nthird line',
      'document-uri': 'https://www.civaccount.co.uk/',
      'source-file': 'https://www.civaccount.co.uk/app.js',
      'line-number': '7\nfourth line',
    }));

    expect(response.status).toBe(204);
    expect(info).toHaveBeenCalledTimes(1);
    const line = info.mock.calls[0][0] as string;
    expect(line.startsWith('[csp-report] ')).toBe(true);
    expect(line).not.toMatch(/[\r\n]/);
  });

  it('keeps ordinary reports readable', async () => {
    const info = vi.spyOn(console, 'info').mockImplementation(() => {});

    await POST(report({
      'effective-directive': 'img-src',
      'blocked-uri': 'https://example.com/a.png?size=1',
      'document-uri': 'https://www.civaccount.co.uk/insights',
    }));

    expect(info.mock.calls[0][0]).toBe(
      '[csp-report] directive=img-src blocked=https://example.com/a.png on=https://www.civaccount.co.uk/insights',
    );
  });
});
