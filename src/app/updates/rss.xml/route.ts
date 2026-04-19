import { updates } from '@/data/updates';

/**
 * RSS 2.0 feed for CivAccount releases.
 *
 * Why: AI engines (ChatGPT, Perplexity, Claude) and traditional search treat
 * feeds as a strong fresh-content signal. Journalists + civic-tech observers
 * subscribe via readers and via x-feed → newsletter pipelines.
 *
 * Referenced from root layout via:
 *   <link rel="alternate" type="application/rss+xml" title="CivAccount updates"
 *         href="/updates/rss.xml" />
 *
 * Spec: RSS 2.0 (https://www.rssboard.org/rss-specification)
 */

const BASE_URL = 'https://www.civaccount.co.uk';

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function toRfc822(isoDate: string): string {
  // RSS requires RFC 822 dates: "Wed, 19 Apr 2026 00:00:00 +0000"
  const d = new Date(`${isoDate}T00:00:00Z`);
  return d.toUTCString();
}

export function GET() {
  const items = updates
    .map((u) => {
      const url = `${BASE_URL}/updates#v${u.version.replace(/\./g, '-')}`;
      const changesList = u.changes.map((c) => `<li>${escapeXml(c)}</li>`).join('');
      const descriptionHtml = `<p>${escapeXml(u.summary)}</p><ul>${changesList}</ul>`;
      return `
    <item>
      <title>${escapeXml(u.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <pubDate>${toRfc822(u.date)}</pubDate>
      <description><![CDATA[${descriptionHtml}]]></description>
      <category>CivAccount release</category>
    </item>`;
    })
    .join('');

  const lastBuild = toRfc822(updates[0].date);

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>CivAccount — Updates</title>
    <link>${BASE_URL}/updates</link>
    <description>Release notes and data updates for CivAccount, the UK council budget transparency project covering all 317 English councils.</description>
    <language>en-GB</language>
    <lastBuildDate>${lastBuild}</lastBuildDate>
    <pubDate>${lastBuild}</pubDate>
    <ttl>1440</ttl>
    <atom:link href="${BASE_URL}/updates/rss.xml" rel="self" type="application/rss+xml" />
    <generator>CivAccount (Next.js)</generator>${items}
  </channel>
</rss>
`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
