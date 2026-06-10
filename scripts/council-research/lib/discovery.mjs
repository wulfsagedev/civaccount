/**
 * lib/discovery.mjs — pure document-discovery logic for 01-inventory.
 *
 * Extracted so pipeline-selftest.mjs can exercise classification, fiscal
 * year parsing and link harvesting against fixture HTML/URLs without a
 * single network request.
 */

export const DOC_KEYWORDS = [
  { re: /pay[\s_-]?policy/i, type: 'pay-policy' },
  { re: /statement[\s_-]?of[\s_-]?accounts|statement%20of%20accounts|soa[\s_-]?20/i, type: 'statement-of-accounts' },
  { re: /unaudited[\s_-]?accounts|audited[\s_-]?accounts|annual[\s_-]?accounts/i, type: 'statement-of-accounts' },
  { re: /mtfs|medium[\s_-]?term/i, type: 'mtfs' },
  { re: /allowance/i, type: 'councillor-allowances' },
  { re: /budget[\s_-]?book/i, type: 'budget-book' },
  { re: /budget/i, type: 'budget' },
  { re: /pay[\s_-]?multiple|gender[\s_-]?pay/i, type: 'pay-policy' },
];

export function classifyDoc(urlOrText) {
  for (const { re, type } of DOC_KEYWORDS) if (re.test(urlOrText)) return type;
  return null;
}

export function guessFiscalYear(s) {
  // Decode %20 etc. first — encoded URLs otherwise read "…%20202223…"
  // and the year parser trips over the percent-twenties.
  let d = String(s);
  try { d = decodeURIComponent(d); } catch { /* malformed encoding — parse raw */ }
  // "2024-25", "2024_25", "2024/25", "202425", "2024-2025"
  const m = d.match(/20(\d{2})[\s_/-]*(?:20)?(\d{2})/);
  if (m && Number(m[2]) === Number(m[1]) + 1) return `20${m[1]}-${m[2]}`;
  const y = d.match(/20(\d{2})(?!\d)/);
  return y ? `20${y[1]}` : 'unknown';
}

/** Documents older than this are noise for a current rollout. */
export function isCurrentEnough(fiscalYear) {
  const m = String(fiscalYear).match(/^20(\d{2})/);
  return !m || Number(m[1]) >= 23; // unknown years pass — reviewer decides
}

export function harvestLinks(html, baseUrl) {
  const found = [];
  // href capture — tolerant of single/double quotes.
  for (const m of html.matchAll(/<a\b[^>]*href=["']([^"'#]+)["'][^>]*>([\s\S]{0,200}?)<\/a>/gi)) {
    const href = m[1].trim();
    const text = m[2].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    let abs;
    try { abs = new URL(href, baseUrl).toString(); } catch { continue; }
    if (!/^https?:/.test(abs)) continue;
    // Pages served from the Wayback Machine rewrite every href to
    // /web/<timestamp>/<original> — unwrap back to the live URL.
    const wb = abs.match(/^https?:\/\/web\.archive\.org\/web\/\d+(?:[a-z_]+)?\/(https?:\/\/.+)$/i);
    if (wb) abs = wb[1];
    if (/^https?:\/\/web\.archive\.org\//i.test(abs)) continue; // wayback chrome links
    const isPdf = /\.pdf(\?|$)/i.test(abs) || /mgConvert2PDF|documents\/s\d+/i.test(abs);
    if (!isPdf) continue;
    const type = classifyDoc(abs) || classifyDoc(text);
    if (!type) continue;
    found.push({ url: abs.split('#')[0], document_type: type, link_text: text.slice(0, 120), fiscal_year: guessFiscalYear(abs + ' ' + text) });
  }
  return found;
}
