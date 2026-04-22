/**
 * lib/sha256.mjs — content fingerprinting.
 *
 * Exports:
 *   hashFile(path) → sha256 hex string
 *   hashBuffer(buf) → sha256 hex string
 *
 * Spec: NORTH-STAR.md §12 (content-addressed archive)
 */

import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';

export function hashBuffer(buf) {
  return createHash('sha256').update(buf).digest('hex');
}

export function hashFile(path) {
  return hashBuffer(readFileSync(path));
}
