import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import nextConfig from '../../next.config';

// Every origin the browser fetches from must be in the site's own
// Content-Security-Policy, or the browser refuses the request. The postcode
// search fetched api.postcodes.io for months while the policy left it out,
// so every postcode search on the live site failed (audit, 17 Nov 2026).

const SRC = resolve(__dirname, '..');

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) {
      // Server-only code is not bound by the browser's policy.
      return name === 'api' || name === 'data' ? [] : sourceFiles(path);
    }
    return /\.tsx?$/.test(name) && !name.endsWith('.test.ts') ? [path] : [];
  });
}

function browserFetchOrigins(): string[] {
  const origins = new Set<string>();
  for (const file of sourceFiles(SRC)) {
    const text = readFileSync(file, 'utf8');
    if (!text.startsWith("'use client'") && !text.startsWith('"use client"')) continue;
    for (const match of text.matchAll(/fetch\(\s*[`'"](https:\/\/[^/`'"$]+)/g)) {
      origins.add(match[1]);
    }
  }
  return [...origins];
}

async function connectSources(): Promise<string[]> {
  const rules = await nextConfig.headers!();
  const csp = rules
    .flatMap((rule) => rule.headers)
    .find((header) => header.key.toLowerCase() === 'content-security-policy')?.value;
  const directive = csp?.split(';').map((part) => part.trim()).find((part) => part.startsWith('connect-src'));
  return directive ? directive.split(/\s+/).slice(1) : [];
}

function allowed(origin: string, sources: string[]): boolean {
  const host = new URL(origin).host;
  return sources.some((source) => {
    if (!source.startsWith('https://')) return false;
    const allowedHost = source.slice('https://'.length);
    return allowedHost.startsWith('*.') ? host.endsWith(allowedHost.slice(1)) : host === allowedHost;
  });
}

describe('Content-Security-Policy connect-src', () => {
  it('finds the postcode lookup among the browser fetches', () => {
    expect(browserFetchOrigins()).toContain('https://api.postcodes.io');
  });

  it('allows every origin the browser fetches from', async () => {
    const sources = await connectSources();
    const blocked = browserFetchOrigins().filter((origin) => !allowed(origin, sources));
    expect(blocked).toEqual([]);
  });
});
