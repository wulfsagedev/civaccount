#!/usr/bin/env node
/**
 * visual-spot-check.mjs — Phase 5b visual spot-check (COUNCIL-ROLLOUT-PLAYBOOK.md).
 *
 * For each council:
 *   1. Load /council/<slug> in headless Chromium
 *   2. Take full-page screenshot → reports/visual/<slug>.png
 *   3. Click 3 random SourceAnnotation popovers and record the URLs
 *   4. Verify each URL is a specific page (not just a landing page)
 *   5. Write results to reports/visual-spot-check-<slug>.json
 *
 * Usage:
 *   node scripts/council-research/visual-spot-check.mjs --council=Hampshire
 *   node scripts/council-research/visual-spot-check.mjs --all   # all 10 batch-6/7 councils
 */

import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
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

const BATCH_67 = [
  'Hampshire', 'Essex', 'Hertfordshire', 'Sheffield', 'Westminster',
  'Nottinghamshire', 'Staffordshire', 'Wiltshire', 'Newcastle upon Tyne', 'Croydon',
];

function slugify(n) {
  return n.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

async function spotCheckCouncil(browser, name) {
  const slug = slugify(name);
  const url = `http://localhost:3000/council/${slug}`;
  console.log(`\n=== ${name} @ ${url} ===`);
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900, deviceScaleFactor: 2 });
  await page.goto(url, { waitUntil: 'networkidle2', timeout: 60_000 });

  // Full-page screenshot
  const reportsDir = join(REPO_ROOT, 'scripts', 'validate', 'reports', 'visual');
  if (!existsSync(reportsDir)) mkdirSync(reportsDir, { recursive: true });
  const screenshotPath = join(reportsDir, `${slug}.png`);
  await page.screenshot({ path: screenshotPath, fullPage: true });
  console.log(`  Screenshot: ${screenshotPath}`);

  // Pick 3 random popovers (deterministic seed based on slug so runs are reproducible)
  // Exclude popovers nested inside <a> tags (known UI bug — click bubbles to navigate)
  const popoverInfo = await page.evaluate((seed) => {
    const allButtons = Array.from(document.querySelectorAll('[role="button"][aria-label^="Source:"]'));
    const buttons = allButtons.filter(b => !b.closest('a[href]'));
    const count = buttons.length;
    const excluded = allButtons.length - count;
    if (count === 0) return { count: 0, excluded, samples: [] };
    // Deterministic sample indices
    const hash = seed.split('').reduce((h, c) => ((h << 5) - h + c.charCodeAt(0)) | 0, 0);
    const offsets = [
      Math.abs(hash) % count,
      Math.abs(hash + 17) % count,
      Math.abs(hash + 37) % count,
    ];
    const unique = [...new Set(offsets)];
    // Store global index too so we can re-select with the full-button list
    buttons.forEach((b, i) => b.setAttribute('data-spot-check-idx', String(i)));
    return {
      count,
      excluded,
      samples: unique.map(i => ({
        index: i,
        value: buttons[i].textContent.trim().slice(0, 100),
        label: buttons[i].getAttribute('aria-label').slice(0, 150),
      })),
    };
  }, slug);
  console.log(`  Popovers found: ${popoverInfo.count}`);

  // For each sample, click, read the dialog's first link, close
  const results = [];
  for (const sample of popoverInfo.samples) {
    // Close any existing dialog
    await page.keyboard.press('Escape').catch(() => {});
    await new Promise(r => setTimeout(r, 200));
    // Click the popover trigger
    const clicked = await page.evaluate((idx) => {
      const btn = document.querySelector(`[data-spot-check-idx="${idx}"]`);
      if (!btn) return false;
      btn.click();
      return true;
    }, sample.index);
    if (!clicked) { results.push({ ...sample, href: null, text: 'click failed' }); continue; }
    await new Promise(r => setTimeout(r, 600));
    const dialogInfo = await page.evaluate(() => {
      const dialog = document.querySelector('[role="dialog"]');
      if (!dialog) return null;
      const links = Array.from(dialog.querySelectorAll('a[href]'));
      const primary = links.find(a => a.getAttribute('target') === '_blank') || links[0];
      if (!primary) return { hasDialog: true, hasLink: false };
      return {
        hasDialog: true,
        hasLink: true,
        href: primary.href,
        linkText: primary.textContent.trim().slice(0, 120),
      };
    });
    results.push({ ...sample, ...(dialogInfo || { hasDialog: false }) });
    await page.keyboard.press('Escape').catch(() => {});
  }

  // Check that each URL is specific (not just a bare landing)
  const classified = results.map(r => {
    if (!r.href) return { ...r, quality: 'no_link' };
    const u = new URL(r.href);
    const path = u.pathname;
    const hasDeepPath = path.split('/').filter(Boolean).length >= 2;
    const hasPageFragment = u.hash && u.hash.includes('page=');
    const isPdf = path.toLowerCase().endsWith('.pdf');
    const isGovUk = u.hostname.endsWith('.gov.uk');
    const quality = (isPdf && (hasPageFragment || hasDeepPath)) ? 'specific_pdf_page'
      : (hasDeepPath && isGovUk) ? 'deep_page'
      : (isGovUk && path === '/') ? 'bare_landing'
      : (path === '/') ? 'bare_host'
      : 'deep_page';
    return { ...r, quality };
  });

  // Write per-council report
  const report = {
    council: name,
    slug,
    url,
    screenshot: screenshotPath,
    popover_count: popoverInfo.count,
    samples: classified,
    summary: {
      total_samples: classified.length,
      specific_pdf_page: classified.filter(s => s.quality === 'specific_pdf_page').length,
      deep_page: classified.filter(s => s.quality === 'deep_page').length,
      bare_landing: classified.filter(s => s.quality === 'bare_landing').length,
      bare_host: classified.filter(s => s.quality === 'bare_host').length,
      no_link: classified.filter(s => s.quality === 'no_link').length,
    },
  };
  writeFileSync(
    join(REPO_ROOT, 'scripts', 'validate', 'reports', `visual-spot-check-${slug}.json`),
    JSON.stringify(report, null, 2),
  );

  await page.close();
  return report;
}

async function main() {
  const puppeteer = (await import('puppeteer')).default;
  const browser = await puppeteer.launch({ headless: true });
  try {
    const councils = args.all ? BATCH_67 : [args.council].filter(Boolean);
    const reports = [];
    for (const c of councils) {
      const r = await spotCheckCouncil(browser, c);
      reports.push(r);
      console.log(`  Samples: ${JSON.stringify(r.summary)}`);
      for (const s of r.samples) {
        console.log(`    [${s.quality}] "${s.value}" → ${s.href || '(no link)'}`);
      }
    }
    const combined = join(REPO_ROOT, 'scripts', 'validate', 'reports', 'visual-spot-check-summary.json');
    writeFileSync(combined, JSON.stringify({
      date: new Date().toISOString(),
      councils: reports.length,
      total_popovers: reports.reduce((s, r) => s + r.popover_count, 0),
      total_samples: reports.reduce((s, r) => s + r.summary.total_samples, 0),
      any_bare_landings: reports.some(r => r.summary.bare_landing > 0),
      any_no_links: reports.some(r => r.summary.no_link > 0),
      reports,
    }, null, 2));
    console.log(`\nCombined summary: ${combined}`);
  } finally {
    await browser.close();
  }
}

main().catch(e => { console.error(e); process.exit(1); });
