#!/usr/bin/env node
/**
 * audit-bradford-sources.mjs — Bradford-specific source-URL audit.
 *
 * Walks every URL Bradford carries in the dataset (top-level *_url fields,
 * field_sources, documents, open_data_links, governance_transparency,
 * section_transparency) and GETs each one, flagging:
 *   - hard 404/403/timeouts
 *   - silent 404 (200 → /page-not-found/ etc.)
 *   - OK
 *
 * Output: scripts/validate/reports/bradford-url-audit.json
 *         + console table.
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPORTS_DIR = join(__dirname, 'reports');
const METROPOLITAN = join(__dirname, '..', '..', 'src', 'data', 'councils', 'metropolitan.ts');

const TIMEOUT = 15000;
const CONCURRENCY = 8;
const UA = 'Mozilla/5.0 (compatible; CivAccount-BradfordAudit/1.0; +https://civaccount.co.uk)';

const NOT_FOUND_PATH = ['/page-not-found', '/not-found', '/404', '/error/404', '/pagenotfound'];
const NOT_FOUND_BODY = ['<title>Page not found', '<h1>Page not found', '<title>404', '<h1>404', 'The page you requested is not available'];

function extractBradfordUrls() {
  const src = readFileSync(METROPOLITAN, 'utf-8');
  const nameRe = /\n  \{\n    ons_code: "([^"]+)",\n    name: "([^"]+)"/g;
  const entries = [];
  let m;
  while ((m = nameRe.exec(src)) !== null) entries.push({ ons: m[1], name: m[2], index: m.index });
  const bradford = entries.find((e) => e.name === 'Bradford');
  if (!bradford) throw new Error('Bradford not found');
  const next = entries.find((e) => e.index > bradford.index);
  const section = src.substring(bradford.index, next ? next.index : src.length);

  const urls = [];
  const seen = new Set();

  // Top-level URL fields
  for (const field of ['website', 'council_tax_url', 'budget_url', 'accounts_url', 'transparency_url', 'councillors_url']) {
    const m = section.match(new RegExp(`${field}:\\s*"([^"]+)"`));
    if (m && !seen.has(m[1])) { urls.push({ url: m[1], context: `top.${field}` }); seen.add(m[1]); }
  }

  // field_sources entries
  const fsRe = /([A-Za-z_][A-Za-z0-9_]*):\s*\{\s*url:\s*"([^"]+)"(?:,\s*title:\s*"([^"]*)")?/g;
  const fsIdx = section.indexOf('field_sources: {');
  if (fsIdx !== -1) {
    const fsBlock = section.substring(fsIdx, fsIdx + 5000);
    let fm;
    while ((fm = fsRe.exec(fsBlock)) !== null) {
      if (fm[1] === 'field_sources') continue;
      if (!seen.has(fm[2])) { urls.push({ url: fm[2], context: `field_sources.${fm[1]}`, title: fm[3] }); seen.add(fm[2]); }
    }
  }

  // All other url occurrences within the Bradford block (documents, section_transparency, open_data_links, governance_transparency, sources)
  const urlRe = /url:\s*"(https?:\/\/[^"]+)"/g;
  let um;
  while ((um = urlRe.exec(section)) !== null) {
    if (!seen.has(um[1])) { urls.push({ url: um[1], context: 'array_link' }); seen.add(um[1]); }
  }

  return urls;
}

async function checkUrl(entry) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT);
  try {
    const res = await fetch(entry.url, {
      method: 'GET', signal: ctrl.signal, redirect: 'follow',
      headers: { 'User-Agent': UA, Accept: 'text/html,application/pdf,*/*' },
    });
    clearTimeout(timer);
    const finalUrl = res.url || entry.url;
    if (!res.ok) return { ...entry, status: res.status, ok: false, final_url: finalUrl };

    // Silent-404 detection on HTML
    const ct = res.headers.get('content-type') || '';
    if (ct.includes('text/html')) {
      const path = new URL(finalUrl).pathname.toLowerCase();
      for (const pat of NOT_FOUND_PATH) {
        if (path.includes(pat)) return { ...entry, status: res.status, ok: false, silent_404: true, reason: `final URL ${pat}`, final_url: finalUrl };
      }
      // read 8KB
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
          const merged = new Uint8Array(chunks.reduce((n, c) => n + c.length, 0));
          let off = 0; for (const c of chunks) { merged.set(c, off); off += c.length; }
          const body = new TextDecoder().decode(merged);
          for (const marker of NOT_FOUND_BODY) {
            if (body.slice(0, 4000).includes(marker)) return { ...entry, status: res.status, ok: false, silent_404: true, reason: `body "${marker.slice(0, 30)}"`, final_url: finalUrl };
          }
        }
      } catch { /* ignore */ }
    }
    return { ...entry, status: res.status, ok: true, final_url: finalUrl };
  } catch (err) {
    clearTimeout(timer);
    return { ...entry, status: 0, ok: false, error: err.name === 'AbortError' ? 'timeout' : (err.code || err.message) };
  }
}

async function main() {
  const urls = extractBradfordUrls();
  console.log(`Bradford has ${urls.length} unique source URLs\n`);

  const results = [];
  for (let i = 0; i < urls.length; i += CONCURRENCY) {
    const batch = urls.slice(i, i + CONCURRENCY);
    const batchResults = await Promise.all(batch.map(checkUrl));
    results.push(...batchResults);
    process.stdout.write(`\r  Checked ${Math.min(i + CONCURRENCY, urls.length)}/${urls.length}`);
  }
  console.log();

  const ok = results.filter((r) => r.ok);
  const broken = results.filter((r) => !r.ok);
  console.log(`\n  OK:     ${ok.length}`);
  console.log(`  Broken: ${broken.length}`);

  if (broken.length > 0) {
    console.log('\n  === BROKEN URLs ===');
    for (const b of broken) {
      const reason = b.silent_404 ? `silent-404 (${b.reason})` : b.error || `HTTP ${b.status}`;
      console.log(`    [${b.context}] ${b.url}`);
      console.log(`      → ${reason}`);
      if (b.final_url && b.final_url !== b.url) console.log(`      → final: ${b.final_url}`);
    }
  }

  if (!existsSync(REPORTS_DIR)) mkdirSync(REPORTS_DIR, { recursive: true });
  writeFileSync(join(REPORTS_DIR, 'bradford-url-audit.json'), JSON.stringify({
    generated: new Date().toISOString(),
    total: urls.length,
    ok: ok.length,
    broken: broken.length,
    results,
  }, null, 2));
  console.log(`\nReport: ${join(REPORTS_DIR, 'bradford-url-audit.json')}`);
}

main().catch((err) => { console.error(err); process.exit(1); });
