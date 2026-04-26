#!/usr/bin/env node
/**
 * robust-fetch.mjs — Multi-strategy PDF fetcher for council documents.
 *
 * Tries strategies in order:
 *   1. Direct curl with realistic browser headers
 *   2. Wayback existing snapshot (if already archived)
 *   3. Wayback /save/ endpoint (forces a fresh archive — Wayback's IP
 *      range is allowlisted by most CDNs, so this bypasses Cloudflare,
 *      Azure WAF, etc.)
 *   4. Wayback /save/ with retry/polling (for slow archives)
 *
 * Strategy 3 is the workhorse for Cloudflare-protected sites
 * (moderngov.co.uk, democracy.* subdomains, etc.) — Wayback's crawler
 * is allowlisted and the redirect serves the saved snapshot directly.
 *
 * Usage:
 *   node robust-fetch.mjs <url> <out-path>
 */

import { writeFileSync, statSync, existsSync, unlinkSync } from 'node:fs';
import { execSync } from 'node:child_process';

const REALISTIC_UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15';

function isPdfFile(path) {
  if (!existsSync(path)) return false;
  const sz = statSync(path).size;
  if (sz < 1024) return false; // too small to be a real PDF
  // Read first 5 bytes for %PDF-
  try {
    const fd = require('node:fs').openSync(path, 'r');
    const buf = Buffer.alloc(5);
    require('node:fs').readSync(fd, buf, 0, 5, 0);
    require('node:fs').closeSync(fd);
    return buf.toString('latin1').startsWith('%PDF-');
  } catch {
    return false;
  }
}

async function tryDirect(url, out) {
  try {
    execSync(
      `curl -sL --compressed --max-time 60 -A "${REALISTIC_UA}" -H "Accept: application/pdf,*/*;q=0.8" -H "Accept-Language: en-GB,en;q=0.9" "${url}" -o "${out}"`,
      { stdio: 'pipe' }
    );
    return isPdfFile(out);
  } catch {
    return false;
  }
}

async function tryWaybackSnapshot(url, out) {
  // Try `2026/` wildcard which serves the latest snapshot
  try {
    execSync(
      `curl -sL --compressed --max-time 60 -A "${REALISTIC_UA}" "https://web.archive.org/web/2026/${url}" -o "${out}"`,
      { stdio: 'pipe' }
    );
    return isPdfFile(out);
  } catch {
    return false;
  }
}

async function tryWaybackSave(url, out) {
  // GET /save/<url> → triggers fresh archive + 302s to the snapshot URL
  // Wayback's crawler is on most CDN allowlists, so this works where
  // direct fetch fails.
  try {
    execSync(
      `curl -sL --compressed --max-time 120 -A "${REALISTIC_UA}" "https://web.archive.org/save/${url}" -o "${out}"`,
      { stdio: 'pipe' }
    );
    return isPdfFile(out);
  } catch {
    return false;
  }
}

async function tryWaybackSaveWithRetry(url, out) {
  // Sometimes the /save/ endpoint returns an in-progress page. Poll the
  // availability API for a few minutes, then re-fetch from the snapshot.
  const apiUrl = `https://archive.org/wayback/available?url=${encodeURIComponent(url)}&timestamp=20260426`;

  // Trigger a save first (may be slow)
  try {
    execSync(`curl -sL --compressed --max-time 60 -A "${REALISTIC_UA}" "https://web.archive.org/save/${url}" -o /dev/null`, {
      stdio: 'pipe',
    });
  } catch {
    // ignore
  }

  // Poll for snapshot availability up to 5 minutes
  for (let i = 0; i < 30; i++) {
    await new Promise((r) => setTimeout(r, 10_000));
    try {
      const json = execSync(`curl -s --max-time 15 "${apiUrl}"`, { stdio: 'pipe' }).toString();
      const m = json.match(/"timestamp":"(\d+)"/);
      if (m) {
        const ts = m[1];
        const snapUrl = `https://web.archive.org/web/${ts}id_/${url}`;
        execSync(`curl -sL --compressed --max-time 60 -A "${REALISTIC_UA}" "${snapUrl}" -o "${out}"`, {
          stdio: 'pipe',
        });
        if (isPdfFile(out)) return true;
      }
    } catch {
      // keep polling
    }
  }
  return false;
}

export async function robustFetchPdf(url, out) {
  const strategies = [
    { name: 'direct', fn: tryDirect },
    { name: 'wayback-snapshot', fn: tryWaybackSnapshot },
    { name: 'wayback-save', fn: tryWaybackSave },
    { name: 'wayback-save-poll', fn: tryWaybackSaveWithRetry },
  ];

  for (const { name, fn } of strategies) {
    if (existsSync(out)) unlinkSync(out);
    process.stderr.write(`  · trying ${name}... `);
    try {
      const ok = await fn(url, out);
      if (ok) {
        const sz = statSync(out).size;
        process.stderr.write(`✓ (${(sz / 1024).toFixed(0)} KB)\n`);
        return { ok: true, strategy: name, bytes: sz };
      } else {
        process.stderr.write(`✗\n`);
      }
    } catch (e) {
      process.stderr.write(`✗ (${e.message})\n`);
    }
  }
  return { ok: false };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const [, , url, outPath] = process.argv;
  if (!url || !outPath) {
    console.error('Usage: node robust-fetch.mjs <url> <out-path>');
    process.exit(2);
  }
  robustFetchPdf(url, outPath)
    .then(({ ok, strategy, bytes }) => {
      if (ok) {
        console.log(`✓ ${outPath} (${bytes} bytes via ${strategy})`);
        process.exit(0);
      } else {
        console.error(`✗ all strategies failed for ${url}`);
        process.exit(1);
      }
    })
    .catch((err) => {
      console.error(`✗ ${err.message}`);
      process.exit(1);
    });
}
