import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, getClientIP } from '@/lib/rate-limit';

/**
 * CSP violation reporting endpoint.
 *
 * Browsers POST here whenever a loaded page violates the site's Content
 * Security Policy (e.g., a script blocked by the CSP, an image from a
 * disallowed origin, a form-action mismatch).  The report body is a JSON
 * object; we log a compact summary so anomalies surface in Vercel's function
 * logs without filling them with noise.
 *
 * Two browser-era formats are accepted:
 *   - Legacy `application/csp-report` (Chrome ≤ 94, Safari): single object
 *     wrapped as `{ "csp-report": { … } }` under a "report-uri" directive.
 *   - Modern `application/reports+json` (Chrome 95+, Edge, Firefox): an array
 *     of reports under a "report-to" directive.
 *
 * Both are rate-limited to 20 reports/minute/IP.  A browser-side replay loop
 * or a malicious page that tries to flood this endpoint gets throttled
 * without burning Vercel function-minutes budget.  We always 204 so we don't
 * give an attacker a feedback signal about which URLs are being tried.
 */

const RATE_LIMIT = { limit: 20, windowSeconds: 60 };

type LegacyCspReport = {
  'csp-report': {
    'document-uri'?: string;
    referrer?: string;
    'violated-directive'?: string;
    'effective-directive'?: string;
    'original-policy'?: string;
    'blocked-uri'?: string;
    'status-code'?: number;
    'source-file'?: string;
    'line-number'?: number;
    'column-number'?: number;
  };
};

type ReportingApiReport = {
  type: string;
  url?: string;
  user_agent?: string;
  body?: {
    documentURL?: string;
    referrer?: string;
    effectiveDirective?: string;
    originalPolicy?: string;
    blockedURL?: string;
    statusCode?: number;
    sourceFile?: string;
    lineNumber?: number;
    columnNumber?: number;
  };
};

export async function POST(request: NextRequest) {
  const ip = getClientIP(request);
  const { success: allowed } = await checkRateLimit(`csp-report:${ip}`, RATE_LIMIT);
  if (!allowed) {
    // Still 204 — never tell the reporter they were rate-limited.
    return new NextResponse(null, { status: 204 });
  }

  const contentType = request.headers.get('content-type') ?? '';
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return new NextResponse(null, { status: 204 });
  }

  // Normalise both formats to a common shape and log one line per violation.
  const summaries: string[] = [];

  if (contentType.includes('application/csp-report')) {
    const r = (body as LegacyCspReport)['csp-report'];
    if (r) {
      summaries.push(formatViolation({
        directive: r['effective-directive'] ?? r['violated-directive'],
        blocked: r['blocked-uri'],
        document: r['document-uri'],
        source: r['source-file'],
        line: r['line-number'],
      }));
    }
  } else if (Array.isArray(body)) {
    for (const r of body as ReportingApiReport[]) {
      if (r.type === 'csp-violation' && r.body) {
        summaries.push(formatViolation({
          directive: r.body.effectiveDirective,
          blocked: r.body.blockedURL,
          document: r.body.documentURL,
          source: r.body.sourceFile,
          line: r.body.lineNumber,
        }));
      }
    }
  }

  for (const summary of summaries) {
    // One line per violation, easy to grep in Vercel function logs.
    // Deliberately at info level — CSP violations are signal, not errors.
    console.info(`[csp-report] ${summary}`);
  }

  return new NextResponse(null, { status: 204 });
}

function formatViolation(v: {
  directive?: string;
  blocked?: string;
  document?: string;
  source?: string;
  line?: number;
}): string {
  // Keep the log line compact and free of user-identifying info beyond the
  // URL path (which the browser was already sending to us as Referer anyway).
  const parts: string[] = [];
  if (v.directive) parts.push(`directive=${v.directive}`);
  if (v.blocked) parts.push(`blocked=${shortenUrl(v.blocked)}`);
  if (v.document) parts.push(`on=${shortenUrl(v.document)}`);
  if (v.source) parts.push(`src=${shortenUrl(v.source)}:${v.line ?? '?'}`);
  return parts.join(' ');
}

function shortenUrl(u: string): string {
  // Trim query strings and long data URIs so one-line logs stay readable.
  // `data:` URIs are the most common cause of unbounded growth — we only
  // need to know it WAS a data URI, not the payload.
  if (u.startsWith('data:')) return 'data:...';
  const qIdx = u.indexOf('?');
  const clean = qIdx >= 0 ? u.slice(0, qIdx) : u;
  return clean.length > 120 ? clean.slice(0, 117) + '...' : clean;
}

// Legacy Firefox sends GET on some CSP-report flows; 204 them cleanly.
export async function GET() {
  return new NextResponse(null, { status: 204 });
}
