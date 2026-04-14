/**
 * link-check.mjs — Verify all source URLs in council data are still live.
 *
 * Extracts URLs from sources[], documents[], open_data_links[],
 * governance_transparency[], and URL fields (website, council_tax_url, etc.)
 * across all 317 councils. Deduplicates, then performs HEAD requests.
 *
 * Opt-in via --link-check flag (requires network access, takes ~2 minutes).
 * Designed to run weekly via GitHub Actions, not on every PR.
 */

const CONCURRENCY = 5;
const DELAY_MS = 200;
const TIMEOUT_MS = 8000;
const URL_FIELDS = ['website', 'council_tax_url', 'budget_url', 'transparency_url', 'accounts_url', 'councillors_url'];

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function checkUrl(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
      redirect: 'follow',
      headers: { 'User-Agent': 'CivAccount-LinkChecker/1.0 (+https://civaccount.com)' },
    });
    clearTimeout(timer);
    return { url, status: res.status, ok: res.ok, redirected: res.redirected };
  } catch (err) {
    clearTimeout(timer);
    if (err.name === 'AbortError') {
      return { url, status: 0, ok: false, error: 'timeout' };
    }
    return { url, status: 0, ok: false, error: err.code || err.message };
  }
}

function extractUrls(councils) {
  const urlMap = new Map(); // url → Set of council names using it

  for (const c of councils) {
    const d = c.detailed || {};

    // URL fields
    for (const field of URL_FIELDS) {
      if (d[field]) {
        if (!urlMap.has(d[field])) urlMap.set(d[field], new Set());
        urlMap.get(d[field]).add(c.name);
      }
    }

    // sources[]
    if (d.sources) {
      for (const s of d.sources) {
        if (s.url) {
          if (!urlMap.has(s.url)) urlMap.set(s.url, new Set());
          urlMap.get(s.url).add(c.name);
        }
      }
    }

    // documents[]
    if (d.documents) {
      for (const doc of d.documents) {
        if (doc.url) {
          if (!urlMap.has(doc.url)) urlMap.set(doc.url, new Set());
          urlMap.get(doc.url).add(c.name);
        }
      }
    }

    // open_data_links[]
    if (d.open_data_links) {
      for (const group of d.open_data_links) {
        for (const link of group.links || []) {
          if (link.url) {
            if (!urlMap.has(link.url)) urlMap.set(link.url, new Set());
            urlMap.get(link.url).add(c.name);
          }
        }
      }
    }

    // governance_transparency[]
    if (d.governance_transparency) {
      for (const link of d.governance_transparency) {
        if (link.url) {
          if (!urlMap.has(link.url)) urlMap.set(link.url, new Set());
          urlMap.get(link.url).add(c.name);
        }
      }
    }
  }

  return urlMap;
}

export async function validate(councils, population, report) {
  const urlMap = extractUrls(councils);
  const urls = [...urlMap.keys()];

  process.stdout.write(`(${urls.length} unique URLs) `);

  let checked = 0;
  const broken = [];
  const redirected = [];
  const timedOut = [];

  // Process in batches
  for (let i = 0; i < urls.length; i += CONCURRENCY) {
    const batch = urls.slice(i, i + CONCURRENCY);
    const results = await Promise.all(batch.map(checkUrl));

    for (const result of results) {
      report.tick();
      checked++;

      if (result.error === 'timeout') {
        timedOut.push(result);
      } else if (result.status >= 400) {
        broken.push(result);
      } else if (result.redirected) {
        redirected.push(result);
      }
    }

    // Rate limit between batches
    if (i + CONCURRENCY < urls.length) {
      await sleep(DELAY_MS);
    }
  }

  // Report broken URLs as errors (affect multiple councils)
  for (const result of broken) {
    const councils = urlMap.get(result.url);
    const councilList = [...councils].slice(0, 3).join(', ');
    const more = councils.size > 3 ? ` (+${councils.size - 3} more)` : '';
    report.finding(
      { name: councilList + more, ons_code: '' },
      'link-check', 'broken_url', 'error',
      `HTTP ${result.status}: ${result.url} (used by ${councils.size} council${councils.size > 1 ? 's' : ''})`,
      'url', result.status, '200'
    );
  }

  // Report timeouts as warnings
  for (const result of timedOut) {
    const councils = urlMap.get(result.url);
    report.finding(
      { name: [...councils][0], ons_code: '' },
      'link-check', 'url_timeout', 'warning',
      `Timeout (${TIMEOUT_MS}ms): ${result.url}`,
      'url'
    );
  }

  // Report redirects as info (often fine but worth monitoring)
  for (const result of redirected) {
    const councils = urlMap.get(result.url);
    if (councils.size > 5) {
      // Only report high-impact redirects
      report.finding(
        { name: `${councils.size} councils`, ons_code: '' },
        'link-check', 'url_redirect', 'info',
        `Redirect: ${result.url} (used by ${councils.size} councils)`,
        'url', result.status
      );
    }
  }
}
