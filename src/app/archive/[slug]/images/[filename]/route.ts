/**
 * Archive image route — serves pre-generated PDF-page PNGs from the
 * private data repo's archive folder.
 *
 * URL scheme: /archive/<council-slug>/images/<field>-p<page>.png
 * Backing:    src/data/councils/pdfs/council-pdfs/<slug>/images/<field>-p<page>.png
 *
 * Spec: NORTH-STAR.md §6 Phase 1b (visual evidence), §8 (presentation)
 *
 * Security:
 *  - `slug` and `filename` are sanitised against a strict regex so a
 *    user can't ../../ out of the images folder
 *  - Only serves files that actually exist; 404 otherwise
 *  - Cache headers set to 1 year (content-addressed by hash means
 *    images are effectively immutable per filename)
 */

import { NextResponse } from 'next/server';
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { cwd } from 'node:process';

const SLUG_RE = /^[a-z0-9][a-z0-9-]{0,63}$/;
const FILENAME_RE = /^[a-z0-9][a-z0-9_-]{0,127}\.png$/;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string; filename: string }> },
) {
  const { slug, filename } = await params;

  if (!SLUG_RE.test(slug)) {
    return NextResponse.json({ error: 'invalid slug' }, { status: 400 });
  }
  if (!FILENAME_RE.test(filename)) {
    return NextResponse.json({ error: 'invalid filename' }, { status: 400 });
  }

  const path = join(
    cwd(),
    'src',
    'data',
    'councils',
    'pdfs',
    'council-pdfs',
    slug,
    'images',
    filename,
  );

  if (!existsSync(path)) {
    return NextResponse.json({ error: 'not found' }, { status: 404 });
  }

  const body = await readFile(path);
  // Convert Node Buffer to Uint8Array for NextResponse
  const data = new Uint8Array(body);
  return new NextResponse(data, {
    status: 200,
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=31536000, immutable',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
