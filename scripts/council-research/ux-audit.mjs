#!/usr/bin/env node
/**
 * ux-audit.mjs — Phase 5b audit (COUNCIL-ROLLOUT-PLAYBOOK.md).
 *
 * Loads /council/<slug> in a real Chromium via Puppeteer, walks every
 * text node, and reports every numeric value that isn't wrapped in
 * a SourceAnnotation.
 *
 * This is the automated version of the browser sweep a human would
 * run post-Phase-5. Any council claiming North-Star-complete must
 * pass `ux-audit.mjs --council=X` with 0 violations.
 *
 * Usage:
 *   node scripts/council-research/ux-audit.mjs --council=Bradford
 *   node scripts/council-research/ux-audit.mjs --council=Bradford --url=http://localhost:3000/council/bradford
 *   node scripts/council-research/ux-audit.mjs --council=Bradford --prod  # hits civaccount.co.uk
 *
 * Prerequisites:
 *   - Dev server running on :3000 (or --url pointing at a deployed build)
 *   - `npm install puppeteer` (already in dependencies if /browse skill installed)
 *
 * Exit codes:
 *   0 — no violations
 *   1 — violations found (printed + written to reports/ux-audit-<slug>.json)
 *   2 — setup error (browser not available, URL unreachable, etc.)
 *
 * What counts as a violation:
 *   Any numeric text node not inside a `[role="button"][aria-label^="Source:"]`
 *   ancestor. Strict filter — excludes obvious decorative items (year
 *   labels, currency-band labels, source-title strings).
 *
 * Spec: NORTH-STAR.md §6 Phase 5b (added 2026-04-22), COUNCIL-ROLLOUT-
 * PLAYBOOK.md Phase 5b.
 */

import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..', '..');

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const m = a.match(/^--([^=]+)(?:=(.*))?$/);
    return m ? [m[1], m[2] ?? true] : [a, true];
  }),
);

if (!args.council) {
  console.error('Usage: node ux-audit.mjs --council=<name> [--url=<url>] [--prod]');
  process.exit(2);
}

function slugify(n) {
  return n.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

const slug = slugify(String(args.council));
const url = args.url
  ? String(args.url)
  : args.prod
  ? `https://civaccount.co.uk/council/${slug}`
  : `http://localhost:3000/council/${slug}`;

const sweepScript = `
(() => {
  const main = document.querySelector('main') || document.body;
  const walker = document.createTreeWalker(main, NodeFilter.SHOW_TEXT, null);
  const numberRegex = /(£[\\d,]+(?:\\.\\d+)?(?:\\s*(?:million|billion|bn|m))?|\\d{1,3}(?:,\\d{3})+(?:\\.\\d+)?|\\d+\\.\\d+%|\\d{3,}\\b)/;
  const results = [];
  let node;
  while ((node = walker.nextNode())) {
    const text = node.textContent.trim();
    if (!text) continue;
    const m = text.match(numberRegex);
    if (!m) continue;
    let el = node.parentElement;
    let wrapped = false, depth = 0;
    while (el && depth < 15) {
      if (el.getAttribute && el.getAttribute('role') === 'button' &&
          el.getAttribute('aria-label') && el.getAttribute('aria-label').startsWith('Source:')) {
        wrapped = true; break;
      }
      if (el.getAttribute && el.getAttribute('role') === 'dialog') { wrapped = 'in-dialog'; break; }
      el = el.parentElement; depth++;
    }
    if (wrapped === true || wrapped === 'in-dialog') continue;
    let h = node.parentElement, card = null;
    while (h && h.tagName !== 'BODY') {
      if (h.tagName === 'SECTION' || (h.tagName === 'DIV' && h.classList && h.classList.contains('card-elevated'))) {
        card = (h.querySelector('h2, h3') && h.querySelector('h2, h3').textContent.trim().slice(0, 40)) || '(no heading)';
        break;
      }
      h = h.parentElement;
    }
    results.push({ text: text.slice(0, 100), card });
  }
  // Strip decorative / non-data items
  return results.filter(r => {
    if (/^20\\d\\d$/.test(r.text)) return false;
    if (/^\\d{4}-\\d{2}$/.test(r.text)) return false;
    if (/^£\\d+k(-£\\d+k|\\+)$/.test(r.text)) return false;
    if (/^£\\d+k[\\u2013-]£\\d+k$/.test(r.text)) return false;
    if (r.text.startsWith('Show all ')) return false;
    if (r.text.startsWith('tonnes total ')) return false;
    if (/Bradford|Camden|Kent|Council|Statement|Pay Policy|Grants|City of Culture/.test(r.text) && !/^£/.test(r.text)) return false;
    if (r.text === 'Spending over £500') return false;
    if (r.text === 'Staff earning £50,000 or more' || r.text === 'staff earn £50,000 or more') return false;
    if (/^In 20\\d\\d-\\d\\d,/.test(r.text)) return false;
    if (/^\\d\\d? [A-Z][a-z]+ \\d{4}$/.test(r.text)) return false;
    return true;
  });
})()
`;

async function main() {
  let puppeteer;
  try {
    puppeteer = (await import('puppeteer')).default;
  } catch {
    console.error('puppeteer not installed — run `npm install puppeteer` first.');
    console.error('Or paste the sweep into DevTools manually — see COUNCIL-ROLLOUT-PLAYBOOK.md §Phase 5b.');
    process.exit(2);
  }

  console.log(`UX audit: ${args.council} @ ${url}`);

  const browser = await puppeteer.launch({ headless: true });
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 900 });
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 60_000 });
    const violations = await page.evaluate(sweepScript);

    const reportsDir = join(REPO_ROOT, 'scripts', 'validate', 'reports');
    mkdirSync(reportsDir, { recursive: true });
    const outPath = join(reportsDir, `ux-audit-${slug}.json`);
    writeFileSync(outPath, JSON.stringify({
      council: args.council,
      slug,
      url,
      audited_at: new Date().toISOString(),
      violation_count: violations.length,
      violations,
    }, null, 2));

    if (violations.length === 0) {
      console.log(`\n✓ 0 violations — ${args.council} passes Phase 5b`);
      console.log(`  Report: ${outPath}`);
      process.exit(0);
    }

    console.log(`\n✗ ${violations.length} violation(s) — ${args.council} fails Phase 5b`);
    console.log('  Each is a numeric value rendered without SourceAnnotation provenance.\n');
    for (const v of violations.slice(0, 30)) {
      console.log(`  • [${v.card ?? 'unknown'}] "${v.text}"`);
    }
    if (violations.length > 30) {
      console.log(`  … and ${violations.length - 30} more.`);
    }
    console.log(`\nFull list: ${outPath}`);
    console.log(`Per COUNCIL-ROLLOUT-PLAYBOOK.md §Phase 5b: wrap each or strip the source data. Re-run until 0.`);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

main().catch((e) => {
  console.error('Fatal:', e);
  process.exit(2);
});
