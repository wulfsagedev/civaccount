/**
 * Insights stats — pure compute functions over the static `councils` array.
 *
 * Shared by:
 *  - /insights tiles (InsightCard)
 *  - /insights/<slug> sub-pages (InsightHero)
 *  - /insights/<slug>/opengraph-image (OG renderers)
 *
 * No React, no side effects. Results are cached for the process lifetime since
 * the underlying council data is static.
 */

import { councils, getCouncilPopulation, type Council } from '@/data/councils';
import { COMPARABLE_GROUPS } from '@/lib/council-averages';

// ── Shared service metadata (plain English names for the 10 service categories) ──

export const SERVICE_KEYS = [
  'adult_social_care',
  'childrens_social_care',
  'education',
  'transport',
  'public_health',
  'housing',
  'cultural',
  'environmental',
  'planning',
  'central_services',
] as const;

export type ServiceKey = (typeof SERVICE_KEYS)[number];

export const SERVICE_NAMES: Record<ServiceKey, string> = {
  adult_social_care: 'Adult social care',
  childrens_social_care: "Children's services",
  education: 'Education',
  transport: 'Roads and transport',
  public_health: 'Public health',
  housing: 'Housing',
  cultural: 'Culture and leisure',
  environmental: 'Bins and environment',
  planning: 'Planning',
  central_services: 'Running the council',
};

// ── National total spend (hero card) ──────────────────────────────────────────

export interface NationalSpendStats {
  /** Total net service spend across all councils, in pounds. */
  totalSpend: number;
  /** Number of councils included in the total. */
  councilCount: number;
  /** Total residents served across all councils. */
  totalPopulation: number;
  /** Spend per resident, in pounds. */
  spendPerPerson: number;
}

let _nationalSpend: NationalSpendStats | null = null;

export function getNationalSpendStats(): NationalSpendStats {
  if (_nationalSpend) return _nationalSpend;

  let totalThousands = 0;
  let councilCount = 0;
  for (const c of councils) {
    const t = c.budget?.total_service;
    if (typeof t === 'number' && t > 0) {
      totalThousands += t;
      councilCount++;
    }
  }

  const totalSpend = totalThousands * 1000;
  const totalPopulation = councils.reduce(
    (s, c) => s + (getCouncilPopulation(c.name) ?? 0),
    0,
  );
  const spendPerPerson = totalPopulation > 0 ? totalSpend / totalPopulation : 0;

  _nationalSpend = { totalSpend, councilCount, totalPopulation, spendPerPerson };
  return _nationalSpend;
}

// ── National bill (legacy card 1 — kept for back-compat) ──────────────────────

export interface NationalBillStats {
  avg: number;
  min: number;
  max: number;
  median: number;
  count: number;
}

let _nationalBill: NationalBillStats | null = null;

export function getNationalBillStats(): NationalBillStats {
  if (_nationalBill) return _nationalBill;

  const values = councils
    .filter((c) => c.council_tax?.band_d_2025)
    .map((c) => c.council_tax!.band_d_2025);

  const sorted = [...values].sort((a, b) => a - b);
  const avg = values.reduce((s, v) => s + v, 0) / values.length;

  _nationalBill = {
    avg,
    min: sorted[0],
    max: sorted[sorted.length - 1],
    median: sorted[Math.floor(sorted.length / 2)],
    count: values.length,
  };
  return _nationalBill;
}

// ── Where every £1 goes (card 2.1) ────────────────────────────────────────────

export interface ServiceShare {
  key: ServiceKey;
  name: string;
  /** Pence of every £1 spent on this service (0–100). */
  pence: number;
  /** Total national spend on this service in pounds. */
  total: number;
}

let _whereEveryPoundGoes: ServiceShare[] | null = null;

export function getWhereEveryPoundGoes(): ServiceShare[] {
  if (_whereEveryPoundGoes) return _whereEveryPoundGoes;

  const totals: Record<ServiceKey, number> = {
    adult_social_care: 0,
    childrens_social_care: 0,
    education: 0,
    transport: 0,
    public_health: 0,
    housing: 0,
    cultural: 0,
    environmental: 0,
    planning: 0,
    central_services: 0,
  };

  for (const c of councils) {
    if (!c.budget) continue;
    for (const key of SERVICE_KEYS) {
      const value = c.budget[key];
      if (typeof value === 'number') totals[key] += value;
    }
  }

  // Budget values are in thousands — convert to pounds.
  const totalPounds = Object.values(totals).reduce((s, v) => s + v, 0) * 1000;

  _whereEveryPoundGoes = SERVICE_KEYS.map((key) => {
    const total = totals[key] * 1000;
    return {
      key,
      name: SERVICE_NAMES[key],
      pence: totalPounds > 0 ? (total / totalPounds) * 100 : 0,
      total,
    };
  })
    .filter((s) => s.total > 0)
    .sort((a, b) => b.pence - a.pence);

  return _whereEveryPoundGoes;
}

// ── Cheapest vs most expensive (card 1.2 · postcode lottery) ──────────────────

export interface ComparableGroupExtremes {
  label: string;
  description: string;
  types: readonly string[];
  cheapest: Council;
  mostExpensive: Council;
  count: number;
}

let _extremesByGroup: ComparableGroupExtremes[] | null = null;

export function getExtremesByGroup(): ComparableGroupExtremes[] {
  if (_extremesByGroup) return _extremesByGroup;

  _extremesByGroup = COMPARABLE_GROUPS.map((group) => {
    const types = group.types as readonly string[];
    const peers = councils.filter(
      (c) => types.includes(c.type) && c.council_tax?.band_d_2025,
    );
    const sorted = [...peers].sort(
      (a, b) => a.council_tax!.band_d_2025 - b.council_tax!.band_d_2025,
    );
    return {
      label: group.label,
      description: group.description,
      types,
      cheapest: sorted[0],
      mostExpensive: sorted[sorted.length - 1],
      count: peers.length,
    };
  }).filter((g) => g.count > 0);

  return _extremesByGroup;
}

/** All-in-one cheapest vs most expensive — the headline comparison. */
export function getHeadlineExtremes(): ComparableGroupExtremes {
  const all = getExtremesByGroup();
  return all.find((g) => g.label.startsWith('All-in-one')) ?? all[0];
}

// ── Biggest tax rises (card 1.3) ──────────────────────────────────────────────

export interface TaxRiseEntry {
  council: Council;
  from: number;
  to: number;
  changePct: number;
  changeAbs: number;
}

let _biggestRises: TaxRiseEntry[] | null = null;

export function getBiggestTaxRises(limit = 5): TaxRiseEntry[] {
  if (_biggestRises) return _biggestRises.slice(0, limit);

  _biggestRises = councils
    .filter((c) => c.council_tax?.band_d_2025 && c.council_tax?.band_d_2024)
    .map((c) => {
      const from = c.council_tax!.band_d_2024!;
      const to = c.council_tax!.band_d_2025;
      return {
        council: c,
        from,
        to,
        changeAbs: to - from,
        changePct: ((to - from) / from) * 100,
      };
    })
    .sort((a, b) => b.changePct - a.changePct);

  return _biggestRises.slice(0, limit);
}

export function getAverageTaxRise(): number {
  const withBoth = councils.filter(
    (c) => c.council_tax?.band_d_2025 && c.council_tax?.band_d_2024,
  );
  if (withBoth.length === 0) return 0;
  const sum = withBoth.reduce((s, c) => {
    const from = c.council_tax!.band_d_2024!;
    const to = c.council_tax!.band_d_2025;
    return s + ((to - from) / from) * 100;
  }, 0);
  return sum / withBoth.length;
}

/** Number of councils that raised Band D by 4.99% or more (the standard cap). */
export function getCouncilsAtOrOverCap(capPct = 4.99): number {
  return councils.filter((c) => {
    if (!c.council_tax?.band_d_2025 || !c.council_tax?.band_d_2024) return false;
    const pct =
      ((c.council_tax.band_d_2025 - c.council_tax.band_d_2024) /
        c.council_tax.band_d_2024) *
      100;
    return pct >= capPct;
  }).length;
}

// ── CEO pay league (card 4.3) ─────────────────────────────────────────────────

export interface CeoPayEntry {
  council: Council;
  salary: number;
  /** Total remuneration if disclosed, otherwise salary. */
  total: number;
}

export interface CeoPayStats {
  avg: number;
  min: number;
  max: number;
  median: number;
  count: number;
  /** Number of councils paying their CEO over £200k. */
  over200k: number;
  highestPaid: CeoPayEntry;
  /** Top N highest-paid, ranked by total (or salary if total absent). */
  top: CeoPayEntry[];
  /** Bottom N lowest-paid (excluding zero/unknown). */
  bottom: CeoPayEntry[];
}

let _ceoPay: CeoPayStats | null = null;

export function getCeoPayStats(limit = 5): CeoPayStats {
  if (_ceoPay) {
    return {
      ..._ceoPay,
      top: _ceoPay.top.slice(0, limit),
      bottom: _ceoPay.bottom.slice(0, limit),
    };
  }

  const entries: CeoPayEntry[] = councils
    .filter(
      (c) =>
        c.detailed?.chief_executive_salary &&
        c.detailed.chief_executive_salary > 0,
    )
    .map((c) => ({
      council: c,
      salary: c.detailed!.chief_executive_salary!,
      total:
        c.detailed!.chief_executive_total_remuneration ??
        c.detailed!.chief_executive_salary!,
    }))
    .sort((a, b) => b.total - a.total);

  const salaries = entries.map((e) => e.salary);
  const sorted = [...salaries].sort((a, b) => a - b);
  const avg = salaries.reduce((s, v) => s + v, 0) / salaries.length;

  _ceoPay = {
    avg,
    min: sorted[0],
    max: sorted[sorted.length - 1],
    median: sorted[Math.floor(sorted.length / 2)],
    count: salaries.length,
    over200k: salaries.filter((s) => s >= 200_000).length,
    highestPaid: entries[0],
    top: entries,
    bottom: [...entries].sort((a, b) => a.total - b.total),
  };
  return {
    ..._ceoPay,
    top: _ceoPay.top.slice(0, limit),
    bottom: _ceoPay.bottom.slice(0, limit),
  };
}

// ── Scale of English councils (legacy card) ───────────────────────────────────

export interface ScaleStats {
  totalCouncils: number;
  totalStaffFte: number;
  totalSpend: number;
  totalPopulation: number;
  staffCoverageCount: number;
}

let _scale: ScaleStats | null = null;

export function getScaleStats(): ScaleStats {
  if (_scale) return _scale;

  const staffEntries = councils.filter(
    (c) => typeof c.detailed?.staff_fte === 'number' && c.detailed.staff_fte! > 0,
  );
  const totalStaffFte = staffEntries.reduce(
    (s, c) => s + (c.detailed!.staff_fte! as number),
    0,
  );

  const totalSpend = councils.reduce(
    (s, c) => s + (c.budget?.total_service ?? 0) * 1000,
    0,
  );

  const totalPopulation = councils.reduce(
    (s, c) => s + (getCouncilPopulation(c.name) ?? 0),
    0,
  );

  _scale = {
    totalCouncils: councils.length,
    totalStaffFte,
    totalSpend,
    totalPopulation,
    staffCoverageCount: staffEntries.length,
  };
  return _scale;
}

// ── Top suppliers nationally (card 3.1) ───────────────────────────────────────

export interface NationalSupplier {
  name: string;
  /** Aggregate annual spend across all councils that disclose this supplier, in pounds. */
  totalSpend: number;
  /** Number of councils that list this supplier in their top suppliers. */
  councilCount: number;
  /** Sample categories/descriptions — first seen, for copy hints. */
  exampleCategory?: string;
}

export interface TopSuppliersStats {
  /** Top N aggregated suppliers, sorted by total spend descending. */
  top: NationalSupplier[];
  /** Total aggregate spend across all listed suppliers (pounds). */
  totalAggregateSpend: number;
  /** Number of councils whose supplier disclosures contributed. */
  councilsWithData: number;
}

let _topSuppliers: TopSuppliersStats | null = null;

/** Normalise a supplier name so that "Capita PLC" and "Capita plc" aggregate. */
function normaliseSupplierName(raw: string): string {
  return raw
    .trim()
    .replace(
      /\b(ltd|limited|plc|llp|llc|inc|group|holdings|services|uk)\b\.?/gi,
      '',
    )
    .replace(/[.,&]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function titleCaseSupplierName(raw: string): string {
  return raw
    .trim()
    .split(/\s+/)
    .map((w) => (w.length <= 3 ? w.toUpperCase() : w[0].toUpperCase() + w.slice(1).toLowerCase()))
    .join(' ');
}

export function getTopSuppliersNational(limit = 10): TopSuppliersStats {
  if (_topSuppliers) {
    return {
      ..._topSuppliers,
      top: _topSuppliers.top.slice(0, limit),
    };
  }

  const agg = new Map<
    string,
    { display: string; totalSpend: number; councilCount: number; exampleCategory?: string }
  >();
  let councilsWithData = 0;

  for (const c of councils) {
    const suppliers = c.detailed?.top_suppliers;
    if (!suppliers?.length) continue;
    councilsWithData++;

    for (const s of suppliers) {
      if (!s.name || !s.annual_spend) continue;
      const key = normaliseSupplierName(s.name);
      if (!key) continue;
      const existing = agg.get(key);
      if (existing) {
        existing.totalSpend += s.annual_spend;
        existing.councilCount += 1;
        if (!existing.exampleCategory && s.category) {
          existing.exampleCategory = s.category;
        }
      } else {
        agg.set(key, {
          display: titleCaseSupplierName(s.name),
          totalSpend: s.annual_spend,
          councilCount: 1,
          exampleCategory: s.category,
        });
      }
    }
  }

  const sorted = [...agg.values()]
    .sort((a, b) => b.totalSpend - a.totalSpend)
    .map((v) => ({
      name: v.display,
      totalSpend: v.totalSpend,
      councilCount: v.councilCount,
      exampleCategory: v.exampleCategory,
    }));

  const totalAggregateSpend = sorted.reduce((s, v) => s + v.totalSpend, 0);

  _topSuppliers = {
    top: sorted,
    totalAggregateSpend,
    councilsWithData,
  };
  return {
    ..._topSuppliers,
    top: _topSuppliers.top.slice(0, limit),
  };
}

// ── Closest to bankruptcy (card 6.1) ──────────────────────────────────────────

export interface BankruptcyRiskEntry {
  council: Council;
  /** Budget gap in pounds. */
  gapPounds: number;
  /** Net service budget in pounds. */
  netBudgetPounds: number;
  /** Gap as a percentage of net budget (0–100). */
  gapPct: number;
  /** Planned savings target in pounds, if disclosed. */
  savingsTargetPounds?: number;
}

export interface BankruptcyRiskStats {
  top: BankruptcyRiskEntry[];
  /** How many councils have a gap ≥ 10% of net budget. */
  over10pct: number;
  /** How many councils have a gap ≥ 5% of net budget. */
  over5pct: number;
  /** Total national budget gap across all disclosing councils (pounds). */
  totalGap: number;
  /** Number of councils that disclose a budget gap. */
  councilsWithData: number;
}

let _bankruptcyRisk: BankruptcyRiskStats | null = null;

export function getClosestToBankruptcy(limit = 10): BankruptcyRiskStats {
  if (_bankruptcyRisk) {
    return { ..._bankruptcyRisk, top: _bankruptcyRisk.top.slice(0, limit) };
  }

  const entries: BankruptcyRiskEntry[] = [];
  let totalGap = 0;

  for (const c of councils) {
    const gap = c.detailed?.budget_gap;
    // Prefer revenue_budget (£ in pounds) — it's the total revenue envelope the
    // gap is measured against. Fall back to net_current (stored in £k) and
    // finally total_service. Using total_service alone gives misleading
    // percentages for districts because it excludes fee-offset income.
    const revenueBudget = c.detailed?.revenue_budget ?? null;
    const netCurrentThousands = c.budget?.net_current ?? null;
    const totalServiceThousands = c.budget?.total_service ?? null;

    const netBudgetPounds =
      revenueBudget && revenueBudget > 0
        ? revenueBudget
        : netCurrentThousands && netCurrentThousands > 0
          ? netCurrentThousands * 1000
          : totalServiceThousands && totalServiceThousands > 0
            ? totalServiceThousands * 1000
            : 0;

    if (!gap || gap <= 0 || netBudgetPounds <= 0) continue;

    // Clamp ratios that indicate cumulative MTFS figures rather than single-year
    // gaps — anything over 100% almost certainly reflects a multi-year total
    // being compared to a single-year budget. We still show the absolute gap,
    // but cap the percentage so it's not misleading.
    const rawPct = (gap / netBudgetPounds) * 100;
    const gapPct = Math.min(rawPct, 100);

    entries.push({
      council: c,
      gapPounds: gap,
      netBudgetPounds,
      gapPct,
      savingsTargetPounds: c.detailed?.savings_target,
    });
    totalGap += gap;
  }

  // Rank by absolute gap size (larger gaps = bigger financial pressure).
  entries.sort((a, b) => b.gapPounds - a.gapPounds);

  _bankruptcyRisk = {
    top: entries,
    over10pct: entries.filter((e) => e.gapPct >= 10).length,
    over5pct: entries.filter((e) => e.gapPct >= 5).length,
    totalGap,
    councilsWithData: entries.length,
  };
  return { ..._bankruptcyRisk, top: _bankruptcyRisk.top.slice(0, limit) };
}

// ── Social care squeeze (card 2.2) ────────────────────────────────────────────

export interface SocialCareSqueezeEntry {
  council: Council;
  /** Combined adult + children's social care spend in pounds. */
  careSpend: number;
  /** Total service spend in pounds. */
  totalSpend: number;
  /** Social care as percentage of total service spend (0–100). */
  squeezePct: number;
}

export interface SocialCareSqueezeStats {
  /** National share of every £1 that goes on adult + children's care. */
  nationalPct: number;
  /** National median share across councils that provide both services. */
  medianPct: number;
  /** Number of councils where care is ≥ 60% of service spend. */
  over60pct: number;
  /** Number of councils where care is ≥ 70%. */
  over70pct: number;
  top: SocialCareSqueezeEntry[];
  /** Total councils contributing (providing at least one care service). */
  councilsWithData: number;
}

let _socialCareSqueeze: SocialCareSqueezeStats | null = null;

export function getSocialCareSqueeze(limit = 10): SocialCareSqueezeStats {
  if (_socialCareSqueeze) {
    return { ..._socialCareSqueeze, top: _socialCareSqueeze.top.slice(0, limit) };
  }

  let nationalCareThousands = 0;
  let nationalTotalThousands = 0;
  const entries: SocialCareSqueezeEntry[] = [];

  for (const c of councils) {
    const b = c.budget;
    if (!b) continue;

    const adult = b.adult_social_care ?? 0;
    const children = b.childrens_social_care ?? 0;
    const care = adult + children;
    const total = b.total_service ?? 0;

    // Only include councils that deliver care (non-zero) and have a total.
    if (care > 0 && total > 0) {
      nationalCareThousands += care;
      nationalTotalThousands += total;

      entries.push({
        council: c,
        careSpend: care * 1000,
        totalSpend: total * 1000,
        squeezePct: (care / total) * 100,
      });
    }
  }

  entries.sort((a, b) => b.squeezePct - a.squeezePct);

  const nationalPct =
    nationalTotalThousands > 0
      ? (nationalCareThousands / nationalTotalThousands) * 100
      : 0;

  const sortedPcts = entries.map((e) => e.squeezePct).sort((a, b) => a - b);
  const medianPct =
    sortedPcts.length > 0 ? sortedPcts[Math.floor(sortedPcts.length / 2)] : 0;

  _socialCareSqueeze = {
    nationalPct,
    medianPct,
    over60pct: entries.filter((e) => e.squeezePct >= 60).length,
    over70pct: entries.filter((e) => e.squeezePct >= 70).length,
    top: entries,
    councilsWithData: entries.length,
  };
  return { ..._socialCareSqueeze, top: _socialCareSqueeze.top.slice(0, limit) };
}
