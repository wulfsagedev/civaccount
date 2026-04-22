#!/usr/bin/env node
/**
 * 02-archive.mjs — Phase 1 of the per-council research pipeline.
 *
 * Given an inventory of source URLs, downloads each to the local
 * content-addressed archive, records sha256 + `_meta.json`, triggers a
 * Wayback Machine snapshot. For PDFs, page-render PNGs are NOT generated
 * here — that's 03-extract-pdf.mjs's job (we don't know which pages to
 * render until we've extracted values). Archive now; render later.
 *
 * Idempotent: if a source file already exists at the recorded sha256,
 * we skip fetch (no wasted bandwidth / re-triggering SavePageNow).
 *
 * Spec: NORTH-STAR.md §6 Phase 1, §13 (Memento), §14 (immutable archive)
 *
 * Usage:
 *   node scripts/council-research/02-archive.mjs --council=Bradford
 *   node scripts/council-research/02-archive.mjs --council=Bradford --inventory=path/to/inventory.json
 *   node scripts/council-research/02-archive.mjs --council=Bradford --skip-wayback  # don't trigger SavePageNow (faster)
 *
 * Input:
 *   inventory.json at pdfs/council-pdfs/<slug>/inventory.json
 *   OR existing `_meta.json` files already present (re-verification mode)
 *
 * Output:
 *   pdfs/council-pdfs/<slug>/<doc-name>.pdf         (or .csv / .xlsx / .json)
 *   pdfs/council-pdfs/<slug>/<doc-name>_meta.json
 *
 * Status update:
 *   scripts/council-research/status/<slug>.json phase_1_archive
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, basename, extname } from 'node:path';

import { fetchUrl } from './lib/fetch.mjs';
import { hashBuffer, hashFile } from './lib/sha256.mjs';
import { readMeta, writeMeta, validateMeta } from './lib/meta.mjs';
import { ensureSnapshot } from './lib/wayback.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..', '..');

// ── CLI parsing ──────────────────────────────────────────────────
const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const m = a.match(/^--([^=]+)(?:=(.*))?$/);
    return m ? [m[1], m[2] ?? true] : [a, true];
  }),
);

if (!args.council) {
  console.error('Usage: node 02-archive.mjs --council=<name> [--inventory=<path>] [--skip-wayback]');
  process.exit(2);
}

const councilName = String(args.council);
const slug = slugify(councilName);
const councilDir = join(REPO_ROOT, 'src', 'data', 'councils', 'pdfs', 'council-pdfs', slug);

function slugify(n) {
  return n.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

// ── Main ─────────────────────────────────────────────────────────

async function main() {
  if (!existsSync(councilDir)) {
    mkdirSync(councilDir, { recursive: true });
  }

  // Determine what to archive: either from --inventory=<path>, or
  // from existing _meta.json files (re-verification mode).
  const inventoryPath =
    args.inventory || join(councilDir, 'inventory.json');

  let entries;
  if (existsSync(inventoryPath)) {
    const raw = JSON.parse(readFileSync(inventoryPath, 'utf8'));
    entries = raw.documents || [];
    console.log(`Archive: ${entries.length} entries from ${inventoryPath}`);
  } else {
    // Re-verification mode — walk _meta.json files.
    entries = findExistingMetas(councilDir);
    console.log(
      `Archive: no inventory.json at ${inventoryPath}. ` +
      `Re-verifying ${entries.length} existing archived files.`,
    );
  }

  const results = [];
  for (const entry of entries) {
    const r = await archiveOne(entry, {
      councilDir,
      skipWayback: !!args['skip-wayback'],
    });
    results.push(r);
    console.log(`  ${statusIcon(r.status)} ${entry.source_url} → ${r.status}`);
  }

  // Summary
  const ok = results.filter((r) => r.status === 'ok').length;
  const skipped = results.filter((r) => r.status === 'skipped_same_sha256').length;
  const blocked = results.filter((r) => r.status === 'archive_exempt_cloudflare').length;
  const failed = results.filter((r) => r.status === 'failed').length;
  console.log('');
  console.log(`Summary: ${ok} ok · ${skipped} unchanged · ${blocked} bot-blocked · ${failed} failed`);

  // Update status file
  updateStatus(slug, { phase_1_archive: { done: failed === 0, at: new Date().toISOString(), results: { ok, skipped, blocked, failed } } });

  process.exit(failed > 0 ? 1 : 0);
}

function statusIcon(s) {
  if (s === 'ok') return '✓';
  if (s === 'skipped_same_sha256') return '·';
  if (s === 'archive_exempt_cloudflare') return '⚠';
  if (s === 'archive_exempt_bot') return '⚠';
  if (s === 'failed') return '✗';
  return '?';
}

// ── Per-entry archival ───────────────────────────────────────────

async function archiveOne(entry, { councilDir, skipWayback }) {
  const url = entry.source_url;
  const filename = entry.filename || deriveFilename(url);
  const pdfPath = join(councilDir, filename);
  const metaPath = join(councilDir, `${filename.replace(/\.[^.]+$/, '')}_meta.json`);
  const existingMeta = readMeta(metaPath);

  // If a file already exists locally, verify its sha256 matches the meta
  // (detects tampering) and skip re-fetch unless --force.
  if (existsSync(pdfPath) && existingMeta?.sha256) {
    const actualSha = hashFile(pdfPath);
    if (actualSha === existingMeta.sha256) {
      // Optionally refresh Wayback if missing
      if (!existingMeta.wayback_url && !skipWayback) {
        const wb = await ensureSnapshot(url);
        if (wb) {
          existingMeta.wayback_url = wb;
          writeMeta(metaPath, existingMeta);
        }
      }
      return { status: 'skipped_same_sha256', path: pdfPath };
    } else {
      console.warn(`  ! ${filename} local sha256 ${actualSha.slice(0, 12)} != recorded ${existingMeta.sha256.slice(0, 12)}`);
    }
  }

  // Fetch
  const res = await fetchUrl(url);

  if (!res.ok) {
    if (res.cloudflareBlocked) {
      // Bot-blocked. If we already have a local file with a valid
      // sha256 in the existing meta, PRESERVE the existing record —
      // the file was fetched previously (perhaps via Wayback) and is
      // still valid. Only write a fresh archive_exempt meta when we
      // have no existing local archive.
      if (existingMeta?.sha256 && existsSync(pdfPath)) {
        const localSha = hashFile(pdfPath);
        if (localSha === existingMeta.sha256) {
          return { status: 'skipped_same_sha256', path: pdfPath };
        }
      }
      const wb = skipWayback ? null : await ensureSnapshot(url);
      writeMeta(metaPath, {
        ...(existingMeta || {}),
        source_url: url,
        publisher: entry.publisher || existingMeta?.publisher || '',
        document_type: entry.document_type || existingMeta?.document_type || 'unknown',
        fiscal_year: entry.fiscal_year || existingMeta?.fiscal_year || 'unknown',
        fetched: existingMeta?.fetched || new Date().toISOString(),
        archive_exempt: 'cloudflare_blocked',
        licence: 'Open Government Licence v3.0',
        wayback_url: existingMeta?.wayback_url || existingMeta?.archive_url || wb || null,
      });
      return { status: 'archive_exempt_cloudflare', path: null };
    }
    return { status: 'failed', error: res.error, path: null };
  }

  // Write bytes
  mkdirSync(councilDir, { recursive: true });
  writeFileSync(pdfPath, res.body);
  const sha = hashBuffer(res.body);

  // Trigger Wayback
  const wb = skipWayback ? null : await ensureSnapshot(url);

  // Merge with existing meta — preserve rich enrichment fields
  // (landing_page, fields_verified, notes, etc.) added by hand in
  // earlier sessions. Only update the provenance fundamentals.
  const meta = {
    ...(existingMeta || {}),
    source_url: url,
    publisher: entry.publisher || existingMeta?.publisher || '',
    document_type: entry.document_type || existingMeta?.document_type || classifyUrl(url),
    fiscal_year: entry.fiscal_year || existingMeta?.fiscal_year || existingMeta?.period || 'unknown',
    fetched: new Date().toISOString(),
    sha256: sha,
    content_type: res.contentType,
    content_length: res.contentLength,
    wayback_url: wb || existingMeta?.wayback_url || existingMeta?.archive_url || null,
    licence: existingMeta?.licence || 'Open Government Licence v3.0',
  };
  const v = validateMeta(meta);
  if (!v.ok) {
    console.warn(`  ! Meta validation warnings for ${filename}: ${v.errors.join('; ')}`);
  }
  writeMeta(metaPath, meta);

  return { status: 'ok', path: pdfPath, sha256: sha };
}

// ── Helpers ──────────────────────────────────────────────────────

function deriveFilename(url) {
  try {
    const u = new URL(url);
    const lastSegment = u.pathname.split('/').filter(Boolean).pop() || 'document';
    const ext = extname(lastSegment) || '.pdf';
    const base = basename(lastSegment, extname(lastSegment)) || 'document';
    return `${base.toLowerCase().replace(/[^a-z0-9-]+/g, '-')}${ext.toLowerCase()}`;
  } catch {
    return 'document.bin';
  }
}

function classifyUrl(url) {
  const u = url.toLowerCase();
  if (u.includes('pay-policy')) return 'pay-policy';
  if (u.includes('statement-of-accounts') || u.includes('statement%20of%20accounts')) return 'statement-of-accounts';
  if (u.includes('mtfs') || u.includes('medium-term') || u.includes('financial-strategy')) return 'mtfs';
  if (u.includes('councillor') && u.includes('allowance')) return 'councillor-allowances';
  if (u.includes('earnings')) return 'councillors-earnings';
  if (u.includes('budget-book')) return 'budget-book';
  if (u.includes('budget')) return 'budget';
  return 'unknown';
}

function findExistingMetas(dir) {
  if (!existsSync(dir)) return [];
  const files = readdirSync(dir);
  return files
    .filter((f) => f.endsWith('_meta.json'))
    .map((f) => {
      const meta = readMeta(join(dir, f));
      if (!meta) return null;
      const baseName = f.replace('_meta.json', '');
      // Find the actual source file — try common extensions
      const candidates = [
        `${baseName}.pdf`,
        `${baseName}.csv`,
        `${baseName}.xlsx`,
        `${baseName}.xls`,
        `${baseName}.json`,
        `${baseName}.ods`,
      ];
      const filename = candidates.find((c) => files.includes(c)) || `${baseName}.pdf`;
      return {
        source_url: meta.source_url,
        filename,
        publisher: meta.publisher,
        document_type: meta.document_type,
        fiscal_year: meta.fiscal_year,
      };
    })
    .filter(Boolean);
}

function updateStatus(slug, patch) {
  const statusDir = join(REPO_ROOT, 'scripts', 'council-research', 'status');
  mkdirSync(statusDir, { recursive: true });
  const statusPath = join(statusDir, `${slug}.json`);
  let current = {};
  if (existsSync(statusPath)) {
    try { current = JSON.parse(readFileSync(statusPath, 'utf8')); } catch {}
  }
  const next = {
    council: slug,
    slug,
    ...current,
    phases: { ...(current.phases || {}), ...patch },
    last_session: new Date().toISOString(),
  };
  writeFileSync(statusPath, JSON.stringify(next, null, 2) + '\n');
}

main().catch((e) => {
  console.error('Fatal:', e);
  process.exit(2);
});
