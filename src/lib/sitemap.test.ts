import { beforeEach, describe, expect, it, vi } from 'vitest';
import { councils, getCouncilSlug } from '@/data/councils';

const rows = vi.hoisted(() => ({ value: [] as { id: string; council_slug: string; created_at: string; author_id?: string }[] }));

// The sitemap reads through the cookie-free public client (CA-O5).
vi.mock('@/lib/supabase/public', () => ({
  createPublicClient: () => {
    const query = {
      select: () => query,
      in: () => query,
      order: () => query,
      limit: async () => ({ data: rows.value }),
    };
    return { from: () => query };
  },
}));

import sitemap from '@/app/sitemap';

const created_at = '2026-11-01T10:00:00.000Z';
const id = '11111111-2222-4333-8444-555555555555';

describe('sitemap proposal pages', () => {
  beforeEach(() => {
    rows.value = [];
  });

  it('lists a proposal under a real council', async () => {
    const slug = getCouncilSlug(councils[0]);
    rows.value = [{ id, council_slug: slug, created_at }];

    const urls = (await sitemap()).map((entry) => entry.url);

    expect(urls).toContain(`https://www.civaccount.co.uk/council/${slug}/proposals/${id}`);
  });

  it.each(['not-a-council', 'Mixed Case', 'a<b>&c', '../../somewhere'])(
    'leaves out a proposal whose council is %j',
    async (council_slug) => {
      rows.value = [{ id, council_slug, created_at }];

      const urls = (await sitemap()).map((entry) => entry.url);

      expect(urls.filter((url) => url.includes(id))).toEqual([]);
    },
  );

  it('only produces URLs that are safe inside XML', async () => {
    const slug = getCouncilSlug(councils[0]);
    rows.value = [{ id: 'a<b>&"c', council_slug: slug, created_at }];

    const urls = (await sitemap()).map((entry) => entry.url);

    for (const url of urls) {
      expect(url).not.toMatch(/[<>&"]/);
    }
  });

  it('leaves out example posts (CA-D3)', async () => {
    const slug = getCouncilSlug(councils[0]);
    rows.value = [{ id, council_slug: slug, created_at, author_id: '00000000-0000-4000-a000-000000000001' }];

    const urls = (await sitemap()).map((entry) => entry.url);

    expect(urls.filter((url) => url.includes(id))).toEqual([]);
  });
});
