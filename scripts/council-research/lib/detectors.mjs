/**
 * lib/detectors.mjs — pure candidate-detection logic for 03-extract-pdf.
 *
 * Extracted from the script so pipeline-selftest.mjs can exercise every
 * detector against real-world fixture lines WITHOUT running a pipeline
 * pass. If you change a regex here, the self-test must still pass —
 * that's the contract that prevents silent detector rot.
 *
 * Each detector: (line, ctx) → [{value, raw, matched, confidence}]
 * `ctx.docType` boosts confidence when the document type is the
 * canonical home for that field.
 *
 * Spec: NORTH-STAR.md §6 Phase 2; ROLLOUT-LESSONS §2 (reserves trap)
 */

// ── Amount parsing ───────────────────────────────────────────────────
// "£141,324" / "141,324" / "£1.2m" / "£950k" / "£1,234,567"
export function parseAmounts(line) {
  const out = [];
  for (const m of line.matchAll(/£?\s?(\d{1,3}(?:,\d{3})+|\d+(?:\.\d+)?\s?[km])\b/gi)) {
    const raw = m[1];
    let value;
    if (/[km]$/i.test(raw.replace(/\s/g, ''))) {
      const n = parseFloat(raw);
      value = /m$/i.test(raw.replace(/\s/g, '')) ? n * 1_000_000 : n * 1_000;
    } else {
      value = parseInt(raw.replace(/,/g, ''), 10);
    }
    if (!isNaN(value)) out.push({ value, raw: m[0].trim() });
  }
  return out;
}

export const clean = (s) => s.replace(/\s+/g, ' ').trim().slice(0, 180);

// ── Field detectors ──────────────────────────────────────────────────
export const DETECTORS = {
  chief_executive_salary(line, ctx) {
    if (!/chief\s+executive/i.test(line)) return [];
    return parseAmounts(line)
      .filter((a) => a.value >= 80_000 && a.value <= 350_000)
      .map((a) => ({
        ...a,
        matched: 'chief executive + salary-range amount',
        confidence: ctx.docType === 'pay-policy' || ctx.docType === 'statement-of-accounts' ? 0.85 : 0.5,
      }));
  },

  chief_executive(line) {
    if (!/chief\s+executive/i.test(line)) return [];
    const m =
      line.match(/((?:Dr|Mr|Mrs|Ms|Miss|Professor)\.?\s+)?([A-Z][a-z]+(?:\s+[A-Z][a-zA-Z'\-]+){1,3})\s*[,–—\-|(]?\s*Chief\s+Executive/) ||
      line.match(/Chief\s+Executive\s*[,:–—\-|)]?\s*((?:Dr|Mr|Mrs|Ms|Miss|Professor)\.?\s+)?([A-Z][a-z]+(?:\s+[A-Z][a-zA-Z'\-]+){1,3})/);
    if (!m) return [];
    let name = `${(m[1] || '').trim()} ${m[2].trim()}`.trim();
    // Remuneration tables append column words to the name — strip them.
    name = name.replace(/\s+(?:From|To|Note|Notes|Salary|Total|Left|Joined)$/i, '');
    // Filter obvious non-names that satisfy the capitalised pattern.
    if (/Officer|Council|Director|Statement|Accounts|Executive|Remuneration|Salary|Pension/i.test(name)) return [];
    return [{ value: name, raw: name, matched: 'name adjacent to "Chief Executive"', confidence: 0.5 }];
  },

  councillor_basic_allowance(line, ctx) {
    if (!/basic\s+allowance/i.test(line)) return [];
    return parseAmounts(line)
      .filter((a) => a.value >= 1_500 && a.value <= 25_000)
      .map((a) => ({
        ...a,
        matched: 'basic allowance + amount',
        confidence: ctx.docType === 'councillor-allowances' || ctx.docType === 'councillors-earnings' ? 0.85 : 0.6,
      }));
  },

  total_allowances_cost(line, ctx) {
    if (!(/allowance/i.test(line) && /total/i.test(line))) return [];
    return parseAmounts(line)
      .filter((a) => a.value >= 30_000 && a.value <= 3_000_000)
      .map((a) => ({
        ...a,
        matched: 'total + allowances + amount',
        confidence: ctx.docType === 'councillor-allowances' || ctx.docType === 'councillors-earnings' ? 0.8 : 0.5,
      }));
  },

  reserves(line, ctx) {
    const isGF = /general\s+fund/i.test(line) && /balance|reserve/i.test(line);
    const isUsable = /total\s+usable\s+reserves/i.test(line);
    // The actual GF balance usually sits in a "Balance at 31 March 20XX"
    // ROW under a "General Fund" COLUMN — line-based matching can't see
    // the column, so flag the row as a page locator for the reviewer.
    if (/balance\s+(?:at|as\s+at)\s+31\s+march/i.test(line)) {
      return [{
        value: null,
        raw: clean(line),
        matched: 'balance-at-31-March row (read the General Fund COLUMN on this page — likely the real reserves figure)',
        confidence: ctx.docType === 'statement-of-accounts' ? 0.7 : 0.4,
      }];
    }
    if (!isGF && !isUsable) return [];
    return parseAmounts(line)
      .filter((a) => a.value >= 100 && a.value <= 2_000_000_000)
      .map((a) => ({
        ...a,
        matched: isGF ? 'GENERAL FUND balance/reserve (the correct field)' : 'TOTAL USABLE reserves (⚠ NOT the field we render — see ROLLOUT-LESSONS §2)',
        confidence: isGF ? (ctx.docType === 'statement-of-accounts' ? 0.75 : 0.5) : 0.2,
      }));
  },

  budget_gap(line, ctx) {
    if (!/budget\s+gap|funding\s+gap/i.test(line)) return [];
    return parseAmounts(line).map((a) => ({
      ...a,
      matched: 'budget/funding gap + amount',
      confidence: ctx.docType === 'mtfs' ? 0.8 : 0.55,
    }));
  },

  savings_target(line, ctx) {
    if (!/savings?\s+(?:target|requirement|programme|plan)/i.test(line)) return [];
    return parseAmounts(line).map((a) => ({
      ...a,
      matched: 'savings target/requirement + amount',
      confidence: ctx.docType === 'mtfs' ? 0.8 : 0.5,
    }));
  },

  salary_bands(line) {
    if (/remuneration\s+band|salary\s+band|(?:salaries|remuneration)\s+(?:over|above|exceeding)\s+£?50/i.test(line)) {
      return [{ value: null, raw: clean(line), matched: 'salary-band table marker (page location only)', confidence: 0.6 }];
    }
    return [];
  },
};
