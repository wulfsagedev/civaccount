/**
 * lib/fetch.mjs — HTTP fetching with realistic UA, timeout, retry.
 *
 * Uses Node's built-in global fetch (Node 18+). Realistic browser UA
 * so council sites are less likely to 403 us. Retries on 5xx and
 * transient network errors. On 403 / Cloudflare challenge page, returns
 * a signal so callers can mark the URL `archive_exempt`.
 *
 * Spec: NORTH-STAR.md §6 Phase 1, §13
 */

const DEFAULT_UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/605.1.15 ' +
  '(KHTML, like Gecko) Version/17.0 Safari/605.1.15';
const DEFAULT_TIMEOUT_MS = 30_000;
const DEFAULT_RETRIES = 2;

/**
 * Fetch a URL. Returns a structured result including:
 *   ok: true/false (HTTP 200-299)
 *   status: HTTP status code (or 'network_error')
 *   body: Uint8Array buffer of response body (null on failure)
 *   contentType: string
 *   contentLength: number | null
 *   finalUrl: string (after redirects)
 *   cloudflareBlocked: true if response looks like a WAF challenge
 *   error: string (if anything failed)
 */
export async function fetchUrl(url, opts = {}) {
  const {
    userAgent = DEFAULT_UA,
    timeout = DEFAULT_TIMEOUT_MS,
    retries = DEFAULT_RETRIES,
  } = opts;

  let lastErr = null;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const controller = new AbortController();
      const abortTimer = setTimeout(() => controller.abort(), timeout);
      const res = await fetch(url, {
        headers: {
          'User-Agent': userAgent,
          'Accept':
            'text/html,application/xhtml+xml,application/xml;q=0.9,' +
            'application/pdf;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-GB,en;q=0.9',
        },
        redirect: 'follow',
        signal: controller.signal,
      });
      clearTimeout(abortTimer);

      const contentType = res.headers.get('content-type') || '';
      const contentLengthRaw = res.headers.get('content-length');
      const contentLength = contentLengthRaw ? parseInt(contentLengthRaw, 10) : null;

      if (!res.ok) {
        // Read body anyway — Cloudflare challenge pages return 403 with HTML body
        const body = new Uint8Array(await res.arrayBuffer());
        const cloudflareBlocked = detectCloudflareBlock(res, body, contentType);
        if (res.status >= 500 && attempt < retries) {
          await backoff(attempt);
          continue;
        }
        return {
          ok: false,
          status: res.status,
          body,
          contentType,
          contentLength,
          finalUrl: res.url,
          cloudflareBlocked,
          error: `HTTP ${res.status}`,
        };
      }

      const body = new Uint8Array(await res.arrayBuffer());
      return {
        ok: true,
        status: res.status,
        body,
        contentType,
        contentLength: contentLength ?? body.length,
        finalUrl: res.url,
        cloudflareBlocked: false,
        error: null,
      };
    } catch (e) {
      lastErr = e;
      if (attempt < retries) {
        await backoff(attempt);
        continue;
      }
    }
  }
  return {
    ok: false,
    status: 'network_error',
    body: null,
    contentType: '',
    contentLength: null,
    finalUrl: url,
    cloudflareBlocked: false,
    error: lastErr ? String(lastErr.message || lastErr) : 'network error',
  };
}

function backoff(attempt) {
  return new Promise((r) => setTimeout(r, 1000 * Math.pow(2, attempt)));
}

function detectCloudflareBlock(res, body, contentType) {
  if (res.status === 403 && contentType.includes('text/html')) {
    const text = new TextDecoder('utf-8').decode(body.slice(0, 2000));
    if (
      text.includes('Cloudflare') ||
      text.includes('cf-ray') ||
      text.includes('Just a moment') ||
      text.includes('Checking your browser') ||
      text.includes('Please enable cookies')
    ) {
      return true;
    }
  }
  if (res.headers.get('cf-ray')) return true;
  if (res.headers.get('server')?.includes('cloudflare')) {
    return res.status >= 400;
  }
  return false;
}
