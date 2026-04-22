/**
 * lib/meta.mjs — _meta.json schema for archived documents.
 *
 * Exports:
 *   readMeta(pathToMetaJson) → MetaObject | null
 *   writeMeta(pathToMetaJson, meta) → void
 *   validateMeta(meta) → { ok, errors }
 *
 * MetaObject schema matches NORTH-STAR.md §6 Phase 1:
 *
 *   {
 *     source_url: string        // where we downloaded from
 *     publisher: string         // "City of Bradford Metropolitan District Council"
 *     document_type: string     // "pay-policy" | "statement-of-accounts" | ...
 *     fiscal_year: string       // "2025-26" | "mid-2024" | "current"
 *     fetched: string           // ISO datetime
 *     sha256: string            // hex lowercase
 *     content_type: string      // "application/pdf"
 *     content_length: number    // bytes
 *     wayback_url?: string      // auto-snapshot on ingest
 *     licence: string           // usually "Open Government Licence v3.0"
 *     archive_exempt?: string   // if not downloadable
 *   }
 *
 * Scaffold — minimal impl below, extended in Phase B.
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const REQUIRED_FIELDS = [
  'source_url',
  'publisher',
  'document_type',
  'fiscal_year',
  'fetched',
  'sha256',
  'licence',
];

export function readMeta(path) {
  if (!existsSync(path)) return null;
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch {
    return null;
  }
}

export function writeMeta(path, meta) {
  writeFileSync(path, JSON.stringify(meta, null, 2) + '\n');
}

export function validateMeta(meta) {
  const errors = [];
  for (const f of REQUIRED_FIELDS) {
    if (!meta[f]) errors.push(`missing required field: ${f}`);
  }
  if (meta.sha256 && !/^[a-f0-9]{64}$/.test(meta.sha256)) {
    errors.push(`sha256 must be 64-char lowercase hex; got ${meta.sha256}`);
  }
  return { ok: errors.length === 0, errors };
}
