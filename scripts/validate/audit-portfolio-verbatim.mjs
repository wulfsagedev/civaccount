#!/usr/bin/env node
/**
 * audit-portfolio-verbatim.mjs — v3 §5.4 cabinet portfolio verbatim audit.
 *
 * For each council with a cabinet list, fetch the council's `councillors_url`
 * page and check each cabinet member's `portfolio` string against the page
 * body. If the portfolio appears verbatim (case-insensitive substring match),
 * mark it verbatim. If not, flag it for human review — that entry is a
 * candidate for re-scrape or removal per the integrity policy.
 *
 * This is a sampling audit, not a rewrite. Output goes to
 * scripts/validate/reports/portfolio-audit-latest.json for user triage.
 *
 * Usage:
 *   node scripts/validate/audit-portfolio-verbatim.mjs              # all councils
 *   node scripts/validate/audit-portfolio-verbatim.mjs --sample=25  # random 25
 *   node scripts/validate/audit-portfolio-verbatim.mjs --council=Bradford
 */

import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { loadCouncils } from './load-councils.mjs';
import { readFileSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const COUNCILS_DIR = join(__dirname, '..', '..', 'src', 'data', 'councils');
const REPORTS_DIR = join(__dirname, 'reports');

const TIMEOUT_MS = 15000;
const USER_AGENT = 'Mozilla/5.0 (compatible; CivAccount-PortfolioAudit/1.0; +https://civaccount.co.uk)';

const argv = process.argv.slice(2);
const sampleArg = argv.find((a) => a.startsWith('--sample='))?.slice(9);
const councilArg = argv.find((a) => a.startsWith('--council='))?.slice(10);
const SAMPLE_SIZE = sampleArg ? parseInt(sampleArg, 10) : null;

/**
 * Extract cabinet data directly from the TS source files — the loader
 * only counts portfolios, we need the strings.
 */
function loadCabinets() {
  const files = ['county-councils.ts', 'districts.ts', 'metropolitan.ts', 'unitary.ts', 'london-boroughs.ts'];
  const cabinets = new Map(); // council name -> [{ name, role, portfolio }]
  for (const f of files) {
    const content = readFileSync(join(COUNCILS_DIR, f), 'utf-8');
    const councilRe = /\n  \{\n    ons_code: "[^"]+",\n    name: "([^"]+)"/g;
    const councils = [];
    let m;
    while ((m = councilRe.exec(content)) !== null) {
      councils.push({ name: m[1], index: m.index });
    }
    for (let i = 0; i < councils.length; i++) {
      const start = councils[i].index;
      const end = i + 1 < councils.length ? councils[i + 1].index : content.length;
      const section = content.substring(start, end);
      const cabIdx = section.indexOf('cabinet: [');
      if (cabIdx === -1) continue;
      let depth = 0;
      let cabEnd = section.length;
      for (let ci = cabIdx + 'cabinet: '.length; ci < section.length; ci++) {
        if (section[ci] === '[') depth++;
        else if (section[ci] === ']') { depth--; if (depth === 0) { cabEnd = ci + 1; break; } }
      }
      const cab = section.substring(cabIdx, cabEnd);
      const members = [];
      // { name: "...", role: "...", portfolio: "...", party?: "..." }
      const entryRe = /\{\s*name:\s*"([^"]+)",\s*role:\s*"([^"]+)"(?:,\s*portfolio:\s*"([^"]+)")?/g;
      let em;
      while ((em = entryRe.exec(cab)) !== null) {
        members.push({ name: em[1], role: em[2], portfolio: em[3] ?? null });
      }
      if (members.length > 0) cabinets.set(councils[i].name, members);
    }
  }
  return cabinets;
}

async function fetchBody(url) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      method: 'GET',
      signal: ctrl.signal,
      redirect: 'follow',
      headers: { 'User-Agent': USER_AGENT, Accept: 'text/html,*/*' },
    });
    clearTimeout(timer);
    if (!res.ok) return { ok: false, status: res.status, body: '' };
    const body = await res.text();
    return { ok: true, status: res.status, body, final_url: res.url };
  } catch (err) {
    clearTimeout(timer);
    return { ok: false, status: 0, error: err.code || err.message };
  }
}

function stripHtml(html) {
  // Reduce scraped HTML to plain text for substring matching. We never
  // render this text — only use it for `.includes(portfolio)` checks —
  // so full HTML parsing is overkill. Two CodeQL notes addressed:
  //   1. `</script\s*>` and `</style\s*>` tolerate whitespace before `>`
  //      (the plain `</script>` variant misses `</script >`).
  //   2. Entity decoding runs after tag removal so un-escaped characters
  //      can't be re-interpreted as tags. Decoding is minimal — we
  //      decode only the three entities we actually care about and keep
  //      the rest as-is; the grep downstream is case-insensitive and
  //      tolerant of leftover entities.
  return html
    .replace(/<script[\s\S]*?<\/script\s*>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style\s*>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;|&#160;|&#xA0;/gi, ' ')
    .replace(/&(amp|quot|#34|#x22);/gi, (_, e) => {
      const low = e.toLowerCase();
      if (low === 'amp') return '&';
      return '"';
    })
    .replace(/\s+/g, ' ')
    .toLowerCase();
}

async function main() {
  console.log('Loading councils + cabinets...');
  const councils = loadCouncils();
  const cabinets = loadCabinets();
  console.log(`  ${cabinets.size} councils with cabinet data`);

  let targets = councils.filter((c) => cabinets.has(c.name) && c.detailed?.councillors_url);
  if (councilArg) targets = targets.filter((c) => c.name === councilArg);
  if (SAMPLE_SIZE) targets = shuffle(targets).slice(0, SAMPLE_SIZE);

  console.log(`Auditing ${targets.length} councils...\n`);

  const report = [];
  let idx = 0;
  for (const council of targets) {
    idx++;
    const url = council.detailed.councillors_url;
    process.stdout.write(`  [${idx}/${targets.length}] ${council.name}: fetching ${url}... `);
    const result = await fetchBody(url);
    if (!result.ok) {
      console.log(`FAIL (${result.status}${result.error ? ' ' + result.error : ''})`);
      report.push({ council: council.name, url, fetched: false, reason: `HTTP ${result.status}${result.error ? ' ' + result.error : ''}` });
      continue;
    }
    const pageText = stripHtml(result.body);
    const members = cabinets.get(council.name) || [];
    const checks = members.map((m) => {
      if (!m.portfolio) return { ...m, verbatim: null };
      const needle = m.portfolio.toLowerCase();
      return { ...m, verbatim: pageText.includes(needle) };
    });
    const verbatimCount = checks.filter((c) => c.verbatim === true).length;
    const paraphrasedCount = checks.filter((c) => c.verbatim === false).length;
    const noPortfolio = checks.filter((c) => c.verbatim === null).length;
    console.log(`verbatim ${verbatimCount}, paraphrased ${paraphrasedCount}, no portfolio ${noPortfolio}`);
    report.push({
      council: council.name,
      url,
      final_url: result.final_url,
      fetched: true,
      member_count: members.length,
      verbatim_count: verbatimCount,
      paraphrased_count: paraphrasedCount,
      no_portfolio_count: noPortfolio,
      members: checks,
    });
  }

  // Summary
  const fetched = report.filter((r) => r.fetched);
  const totalMembers = fetched.reduce((n, r) => n + (r.member_count || 0), 0);
  const totalVerbatim = fetched.reduce((n, r) => n + (r.verbatim_count || 0), 0);
  const totalParaphrased = fetched.reduce((n, r) => n + (r.paraphrased_count || 0), 0);

  console.log('\n═══ PORTFOLIO AUDIT SUMMARY ═══');
  console.log(`  Councils targeted:    ${targets.length}`);
  console.log(`  Successfully fetched: ${fetched.length}`);
  console.log(`  Fetch failures:       ${report.length - fetched.length}`);
  console.log(`  Total members:        ${totalMembers}`);
  console.log(`  Verbatim (pass):      ${totalVerbatim} (${((totalVerbatim / (totalMembers || 1)) * 100).toFixed(1)}%)`);
  console.log(`  Paraphrased (flag):   ${totalParaphrased} (${((totalParaphrased / (totalMembers || 1)) * 100).toFixed(1)}%)`);

  if (!existsSync(REPORTS_DIR)) mkdirSync(REPORTS_DIR, { recursive: true });
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const out = join(REPORTS_DIR, 'portfolio-audit-latest.json');
  const stamped = join(REPORTS_DIR, `portfolio-audit-${timestamp}.json`);
  const doc = {
    generated: new Date().toISOString(),
    sample_size: targets.length,
    summary: {
      councils_targeted: targets.length,
      councils_fetched: fetched.length,
      fetch_failures: report.length - fetched.length,
      members_total: totalMembers,
      verbatim: totalVerbatim,
      paraphrased: totalParaphrased,
    },
    report,
  };
  writeFileSync(out, JSON.stringify(doc, null, 2));
  writeFileSync(stamped, JSON.stringify(doc, null, 2));
  console.log(`\nReport: ${out}`);
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

main().catch((err) => { console.error(err); process.exit(1); });
