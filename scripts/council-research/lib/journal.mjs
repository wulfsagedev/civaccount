/**
 * lib/journal.mjs — append-only run journal for the pipeline.
 *
 * Every pipeline script records every run — success OR failure — as one
 * JSON line in scripts/council-research/status/runs.jsonl. The journal
 * is the permanent trace: who ran what, on which council, when, with
 * what outcome and what counts. status/<slug>.json holds the latest
 * state; the journal holds the history. Both are committed.
 *
 * Usage (in a script):
 *   import { startRun } from './lib/journal.mjs';
 *   const run = startRun('03-extract-pdf', councilName);
 *   …
 *   run.finish('ok', { candidates: 16 });          // success
 *   run.finish('failed', { reason: '…' });          // loud failure
 *
 * finish() is idempotent — first call wins. If a script crashes before
 * calling finish(), the process exit hook records status 'crashed' with
 * the error, so even an unhandled exception leaves a trace.
 */

import { appendFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
// CIVACCOUNT_JOURNAL_PATH override exists so the self-test can journal
// to a temp file instead of polluting the real run history.
const JOURNAL = process.env.CIVACCOUNT_JOURNAL_PATH
  || join(__dirname, '..', 'status', 'runs.jsonl');

function append(entry) {
  mkdirSync(dirname(JOURNAL), { recursive: true });
  appendFileSync(JOURNAL, JSON.stringify(entry) + '\n');
}

export function startRun(script, council) {
  const started = new Date().toISOString();
  let finished = false;
  let lastError = null;

  const finish = (status, detail = {}) => {
    if (finished) return;
    finished = true;
    append({
      script,
      council: council ?? null,
      started,
      finished_at: new Date().toISOString(),
      status, // 'ok' | 'failed' | 'crashed' | 'blocked'
      ...detail,
    });
  };

  // Crash net: an unhandled exception or a process.exit() without
  // finish() still leaves a journal line. No silent deaths.
  process.on('uncaughtException', (e) => {
    lastError = String(e?.stack || e);
    finish('crashed', { error: lastError });
    process.exitCode = 2;
    // Re-print so the console shows the original failure too.
    console.error(e);
    process.exit(2);
  });
  process.on('exit', (code) => {
    if (!finished) finish(code === 0 ? 'ok' : 'failed', { exit_code: code, note: 'recorded by exit hook (script did not call finish explicitly)' });
  });

  return { finish };
}
