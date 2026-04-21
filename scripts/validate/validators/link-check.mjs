/**
 * link-check.mjs — Verify all source URLs in council data are still live.
 *
 * Extracts URLs from sources[], documents[], open_data_links[],
 * governance_transparency[], field_sources{}, and URL fields
 * (website, council_tax_url, etc.) across all 317 councils. Deduplicates,
 * then performs GET requests that follow redirects and inspect the final URL
 * and body for silent-404 patterns ("/page-not-found/", 404 markup).
 *
 * Opt-in via --link-check flag (requires network access, takes ~2 minutes).
 * Designed to run weekly via GitHub Actions, not on every PR.
 *
 * Silent-404 detection:
 *   A URL that returns HTTP 200 but whose final URL path (after redirects)
 *   contains "page-not-found", "/404", "not-found", or "/error" is treated
 *   as broken. Also scans response body for a small set of canonical 404
 *   phrases. This catches the Bradford case where
 *   `/your-council/council-budgets-and-spending/` 302-redirects to
 *   `/page-not-found/` with a 200.
 */

const CONCURRENCY = 5;
const DELAY_MS = 200;
const TIMEOUT_MS = 10000;
const URL_FIELDS = ['website', 'council_tax_url', 'budget_url', 'transparency_url', 'accounts_url', 'councillors_url'];

// Path fragments that indicate a silent 404 even when status is 200.
// Lowercased before compare. Keep this list conservative — false positives
// here would flag legitimate pages.
const NOT_FOUND_PATH_PATTERNS = [
  '/page-not-found',
  '/not-found',
  '/404',
  '/error/404',
  '/error-404',
  '/pagenotfound',
  '/page_not_found',
];

// Body substring markers. Only used when path pattern is ambiguous.
// Must be distinctive enough not to appear on real content pages.
const NOT_FOUND_BODY_MARKERS = [
  '<title>Page not found',
  '<h1>Page not found',
  '<title>404',
  '<h1>404',
  'The page you requested is not available',
  'the page you are looking for cannot be found',
];

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function detectSilentNotFound(finalUrl, body) {
  try {
    const path = new URL(finalUrl).pathname.toLowerCase();
    for (const pat of NOT_FOUND_PATH_PATTERNS) {
      if (path.includes(pat)) return { silent: true, reason: `final URL path contains "${pat}"` };
    }
  } catch {
    // unparseable URL — fall through
  }
  if (body) {
    const bodyHead = body.slice(0, 4000); // only scan the head of the page
    for (const marker of NOT_FOUND_BODY_MARKERS) {
      if (bodyHead.includes(marker)) return { silent: true, reason: `body contains "${marker.slice(0, 40)}"` };
    }
  }
  return { silent: false };
}

async function checkUrl(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    // Use GET so we can read the final URL + body for silent-404 detection.
    // HEAD would mask the redirect chain and give no body.
    const res = await fetch(url, {
      method: 'GET',
      signal: controller.signal,
      redirect: 'follow',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; CivAccount-LinkChecker/2.0; +https://civaccount.com)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
    });
    clearTimeout(timer);

    const finalUrl = res.url || url;
    const redirected = finalUrl !== url;

    let body = '';
    // Read up to 8KB of body (enough to see <title>/<h1>, cheap on bandwidth).
    if (res.ok && res.headers.get('content-type')?.includes('text/html')) {
      try {
        const reader = res.body?.getReader();
        if (reader) {
          const chunks = [];
          let total = 0;
          while (total < 8192) {
            const { value, done } = await reader.read();
            if (done) break;
            chunks.push(value);
            total += value.length;
          }
          reader.cancel().catch(() => {});
          body = new TextDecoder().decode(concatChunks(chunks));
        }
      } catch { /* ignore body read errors */ }
    }

    let silent = { silent: false };
    if (res.ok) {
      silent = detectSilentNotFound(finalUrl, body);
    }

    return {
      url,
      final_url: finalUrl,
      status: res.status,
      ok: res.ok && !silent.silent,
      redirected,
      silent_404: silent.silent,
      silent_reason: silent.reason,
    };
  } catch (err) {
    clearTimeout(timer);
    if (err.name === 'AbortError') {
      return { url, status: 0, ok: false, error: 'timeout' };
    }
    return { url, status: 0, ok: false, error: err.code || err.message };
  }
}

function concatChunks(chunks) {
  const total = chunks.reduce((n, c) => n + c.length, 0);
  const out = new Uint8Array(total);
  let off = 0;
  for (const c of chunks) { out.set(c, off); off += c.length; }
  return out;
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

    // field_sources{} — per-field explicit source URLs (the URLs most
    // directly surfaced in the SourceAnnotation popover). Missing these is
    // why the audit script existed in the first place.
    if (d.field_sources) {
      for (const entry of Object.values(d.field_sources)) {
        if (entry?.url) {
          if (!urlMap.has(entry.url)) urlMap.set(entry.url, new Set());
          urlMap.get(entry.url).add(c.name);
        }
      }
    }

    // section_transparency{} — grouped per-section links
    if (d.section_transparency) {
      for (const links of Object.values(d.section_transparency)) {
        if (!Array.isArray(links)) continue;
        for (const link of links) {
          if (link.url) {
            if (!urlMap.has(link.url)) urlMap.set(link.url, new Set());
            urlMap.get(link.url).add(c.name);
          }
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
  const broken = [];       // status >= 400
  const silent = [];       // status 200 but landed on a 404 page
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
      } else if (result.silent_404) {
        silent.push(result);
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

  // Report silent 404s as errors — these are worse than hard 404s because
  // they slip past naive checkers and erode user trust when clicked.
  for (const result of silent) {
    const councils = urlMap.get(result.url);
    const councilList = [...councils].slice(0, 3).join(', ');
    const more = councils.size > 3 ? ` (+${councils.size - 3} more)` : '';
    report.finding(
      { name: councilList + more, ons_code: '' },
      'link-check', 'silent_404', 'error',
      `Silent 404: ${result.url} → ${result.final_url} (${result.silent_reason}, used by ${councils.size} council${councils.size > 1 ? 's' : ''})`,
      'url', result.final_url, 'real content page'
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
