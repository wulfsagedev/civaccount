import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const mocks = vi.hoisted(() => ({
  upsert: vi.fn(),
  email: 'resident@example.test',
}));

vi.mock('@supabase/ssr', () => ({
  createServerClient: () => ({
    auth: {
      exchangeCodeForSession: async () => ({ error: null }),
      getUser: async () => ({ data: { user: { id: 'user-1', email: mocks.email } } }),
    },
    from: () => ({ upsert: mocks.upsert }),
  }),
}));

import { GET } from '@/app/auth/callback/route';

const callback = (query: string) => GET(new NextRequest(`https://www.civaccount.co.uk/auth/callback?${query}`));

describe('auth callback', () => {
  beforeEach(() => {
    mocks.upsert.mockReset();
    mocks.upsert.mockResolvedValue({ error: null });
    mocks.email = 'resident@example.test';
  });

  it('creates the record once and leaves an existing one alone', async () => {
    await callback('code=abc');

    expect(mocks.upsert).toHaveBeenCalledWith(
      { id: 'user-1', email: 'resident@example.test', display_name: 'resident' },
      { onConflict: 'id', ignoreDuplicates: true },
    );
  });

  it('leaves the name empty when the email prefix does not fit the name rules', async () => {
    mocks.email = 'a@example.test';

    await callback('code=abc');

    expect(mocks.upsert.mock.calls[0][0].display_name).toBeNull();
  });

  it('returns to the page the resident came from', async () => {
    const response = await callback(`code=abc&next=${encodeURIComponent('/council/kent/proposals')}`);

    expect(response.headers.get('location')).toBe('https://www.civaccount.co.uk/council/kent/proposals');
  });

  it('stays on the site for any other return target', async () => {
    const response = await callback(`code=abc&next=${encodeURIComponent('/\\example.com')}`);

    expect(response.headers.get('location')).toBe('https://www.civaccount.co.uk/');
  });

  it('asks the resident to sign in again if the record cannot be created', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    mocks.upsert.mockResolvedValue({ error: { code: '23505' } });

    const response = await callback('code=abc');

    expect(response.headers.get('location')).toBe('https://www.civaccount.co.uk/auth/login?error=auth');
    consoleError.mockRestore();
  });
});
