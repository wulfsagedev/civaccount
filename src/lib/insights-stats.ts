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

import {
  councils,
  getAreaBandD,
  getCouncilPopulation,
  CURRENT_TAX_YEAR,
  PREVIOUS_TAX_YEAR,
  type Council,
  getCouncilSlug,
} from '@/data/councils';
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


// ── Current-year area Band D stats (2026-27, billing authorities) ─────────────
//
// These are the year-aware equivalents of the legacy band_d_2025 stats above.
// They use `getAreaBandD()` (the most recent verified AREA Band D — the full
// bill for the area) restricted to billing authorities that carry the
// 2026-27 figure. County councils (type SC) are not billing authorities and
// have no 2026-27 area figure, so they are excluded from these money
// rankings — copy that uses these stats should say "billing authorities".

export interface AreaBillStats {
  avg: number;
  min: number;
  max: number;
  median: number;
  /** Billing authorities included (those with a verified 2026-27 area Band D). */
  count: number;
  /** The financial year every number above belongs to. */
  year: typeof CURRENT_TAX_YEAR;
}

let _areaBill: AreaBillStats | null = null;

export function getAreaBillStats(): AreaBillStats {
  if (_areaBill) return _areaBill;

  const values = councils
    .map((c) => getAreaBandD(c))
    .filter((a): a is NonNullable<typeof a> => a !== null && a.year === CURRENT_TAX_YEAR)
    .map((a) => a.value);

  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);

  _areaBill = {
    avg: values.reduce((s, v) => s + v, 0) / values.length,
    min: sorted[0],
    max: sorted[sorted.length - 1],
    median:
      sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid],
    count: values.length,
    year: CURRENT_TAX_YEAR,
  };
  return _areaBill;
}

export interface AreaExtremesGroup {
  label: string;
  description: string;
  types: readonly string[];
  cheapest: Council;
  cheapestValue: number;
  mostExpensive: Council;
  mostExpensiveValue: number;
  count: number;
  /** The financial year this group's figures belong to. County councils fall
   * back to 2025-26 (their own share) — always render this next to the data. */
  year: typeof CURRENT_TAX_YEAR | typeof PREVIOUS_TAX_YEAR;
}

let _areaExtremes: AreaExtremesGroup[] | null = null;

/** Cheapest vs most expensive per comparable group, in the year
 * `getAreaBandD` returns for that group's members (2026-27 for billing
 * authorities, 2025-26 for county councils). */
export function getAreaExtremesByGroup(): AreaExtremesGroup[] {
  if (_areaExtremes) return _areaExtremes;

  _areaExtremes = COMPARABLE_GROUPS.map((group): AreaExtremesGroup | null => {
    const types = group.types as readonly string[];
    const peers = councils
      .filter((c) => types.includes(c.type))
      .map((c) => ({ council: c, area: getAreaBandD(c) }))
      .filter((p): p is { council: Council; area: NonNullable<ReturnType<typeof getAreaBandD>> } => p.area !== null)
      .sort((a, b) => a.area.value - b.area.value);
    if (peers.length === 0) return null;
    const cheapest = peers[0];
    const mostExpensive = peers[peers.length - 1];
    return {
      label: group.label,
      description: group.description,
      types,
      cheapest: cheapest.council,
      cheapestValue: cheapest.area.value,
      mostExpensive: mostExpensive.council,
      mostExpensiveValue: mostExpensive.area.value,
      count: peers.length,
      year: cheapest.area.year,
    };
  }).filter((g): g is AreaExtremesGroup => g !== null);

  return _areaExtremes;
}

/** All-in-one cheapest vs most expensive on the 2026-27 area Band D. */
export interface AreaBillExtremes {
  cheapest: Council;
  cheapestValue: number;
  mostExpensive: Council;
  mostExpensiveValue: number;
  /** Always CURRENT_TAX_YEAR — billing authorities only, so the comparison is
   * like-for-like. County councils are excluded because they have no 2026-27
   * area figure, only their own 2025-26 share. */
  year: typeof CURRENT_TAX_YEAR;
  count: number;
}

let _areaBillExtremes: AreaBillExtremes | null = null;

/**
 * The single cheapest and single most expensive area Band D bill in England,
 * across billing authorities only.
 *
 * This is the headline claim on /insights/cheapest-council-tax and
 * /insights/most-expensive-council-tax, and it is also what those pages put in
 * their title and meta description. Both must come from here so a rendered
 * figure and the snippet Google shows for it can never disagree.
 *
 * Ties resolve to the first council encountered, matching the reduce these
 * pages have always used.
 */
export function getAreaBillExtremes(): AreaBillExtremes {
  if (_areaBillExtremes) return _areaBillExtremes;

  const billing = councils
    .map((council) => ({ council, area: getAreaBandD(council) }))
    .filter(
      (e): e is { council: Council; area: NonNullable<ReturnType<typeof getAreaBandD>> } =>
        e.area !== null && e.area.year === CURRENT_TAX_YEAR,
    );

  const cheapest = billing.reduce((min, e) => (e.area.value < min.area.value ? e : min));
  const mostExpensive = billing.reduce((max, e) => (e.area.value > max.area.value ? e : max));

  _areaBillExtremes = {
    cheapest: cheapest.council,
    cheapestValue: cheapest.area.value,
    mostExpensive: mostExpensive.council,
    mostExpensiveValue: mostExpensive.area.value,
    year: CURRENT_TAX_YEAR,
    count: billing.length,
  };
  return _areaBillExtremes;
}

export function getHeadlineAreaExtremes(): AreaExtremesGroup {
  const all = getAreaExtremesByGroup();
  return all.find((g) => g.label.startsWith('All-in-one')) ?? all[0];
}

export interface AreaTaxRiseEntry {
  council: Council;
  /** 2025-26 area Band D, pounds. */
  from: number;
  /** 2026-27 area Band D, pounds. */
  to: number;
  changeAbs: number;
  changePct: number;
}

let _areaRises: AreaTaxRiseEntry[] | null = null;

/** Year-on-year area Band D rises, 2025-26 → 2026-27. Billing authorities
 * only (296) — county councils have no 2026-27 figure. */
export function getAreaTaxRises(limit = 5): AreaTaxRiseEntry[] {
  if (_areaRises) return _areaRises.slice(0, limit);

  _areaRises = councils
    .filter((c) => c.council_tax?.band_d_2026 && c.council_tax?.band_d_2025)
    .map((c) => {
      const from = c.council_tax!.band_d_2025;
      const to = c.council_tax!.band_d_2026!;
      return {
        council: c,
        from,
        to,
        changeAbs: to - from,
        changePct: ((to - from) / from) * 100,
      };
    })
    .sort((a, b) => b.changePct - a.changePct);

  return _areaRises.slice(0, limit);
}

/** Average 2025-26 → 2026-27 area Band D rise across billing authorities. */
export function getAverageAreaTaxRise(): number {
  const all = getAreaTaxRises(Number.MAX_SAFE_INTEGER);
  if (all.length === 0) return 0;
  return all.reduce((s, e) => s + e.changePct, 0) / all.length;
}

/** Number of billing-authority areas where the 2026-27 Band D bill rose by
 * `capPct` or more. Note: the referendum cap applies to each council's own
 * element — this counts whole-area rises, so treat it as context, not a
 * cap-compliance count. */
export function getAreaRisesAtOrOverPct(capPct = 4.99): number {
  return getAreaTaxRises(Number.MAX_SAFE_INTEGER).filter((e) => {
    const pct = Math.round(e.changePct * 100) / 100;
    return pct >= capPct;
  }).length;
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

// ── Big 5 outsourcers (card 3.2) ──────────────────────────────────────────────

/**
 * The five outsourcers most commonly associated with English local government:
 * Capita, Serco, Veolia, Biffa, Amey. We match any supplier whose normalised
 * name begins with one of these brand keys.
 */
const BIG_FIVE_KEYS = ['capita', 'serco', 'veolia', 'biffa', 'amey'] as const;

export interface BigFiveOutsourcer {
  brand: string;
  /** Total annual spend aggregated across councils, pounds. */
  totalSpend: number;
  /** Number of councils that list this brand in their top suppliers. */
  councilCount: number;
}

export interface BigFiveStats {
  brands: BigFiveOutsourcer[];
  /** Combined spend across the Big 5, pounds. */
  combinedSpend: number;
  /** Share of all top-supplier spend going to the Big 5 (0–100). */
  sharePct: number;
  /** Total top-supplier spend nationally, pounds. */
  nationalTopSupplierSpend: number;
}

let _bigFive: BigFiveStats | null = null;

export function getBigFiveOutsourcers(): BigFiveStats {
  if (_bigFive) return _bigFive;

  const brandTotals = new Map<string, { totalSpend: number; councilCount: number }>();
  for (const k of BIG_FIVE_KEYS) brandTotals.set(k, { totalSpend: 0, councilCount: 0 });

  let nationalTopSupplierSpend = 0;

  for (const c of councils) {
    const suppliers = c.detailed?.top_suppliers;
    if (!suppliers?.length) continue;

    const hitBrands = new Set<string>();
    for (const s of suppliers) {
      if (!s.name || !s.annual_spend) continue;
      nationalTopSupplierSpend += s.annual_spend;

      const key = normaliseSupplierName(s.name);
      for (const brand of BIG_FIVE_KEYS) {
        if (key.startsWith(brand)) {
          const entry = brandTotals.get(brand)!;
          entry.totalSpend += s.annual_spend;
          hitBrands.add(brand);
          break;
        }
      }
    }
    for (const b of hitBrands) brandTotals.get(b)!.councilCount += 1;
  }

  const brands: BigFiveOutsourcer[] = BIG_FIVE_KEYS.map((k) => ({
    brand: k[0].toUpperCase() + k.slice(1),
    totalSpend: brandTotals.get(k)!.totalSpend,
    councilCount: brandTotals.get(k)!.councilCount,
  })).sort((a, b) => b.totalSpend - a.totalSpend);

  const combinedSpend = brands.reduce((s, b) => s + b.totalSpend, 0);
  const sharePct =
    nationalTopSupplierSpend > 0
      ? (combinedSpend / nationalTopSupplierSpend) * 100
      : 0;

  _bigFive = { brands, combinedSpend, sharePct, nationalTopSupplierSpend };
  return _bigFive;
}

// ── The £100k club (card 4.4) ─────────────────────────────────────────────────

export interface HundredKCouncil {
  council: Council;
  count: number;
}

export interface HundredKClubStats {
  /** Total number of disclosed staff earning £100k+ across all councils. */
  totalStaff: number;
  /** Councils with at least one staff member in this bracket. */
  councilsWithAny: number;
  /** Total disclosing councils (publish salary bands at all). */
  councilsDisclosing: number;
  /** Median number of £100k+ staff per disclosing council. */
  medianPerCouncil: number;
  /** Councils ranked by total £100k+ staff count. */
  top: HundredKCouncil[];
}

let _hundredK: HundredKClubStats | null = null;

function parseBandMin(band: string): number | null {
  // Salary bands come in four shapes: "£50,000 - £54,999", "£50k-£55k",
  // "£50k–£55k" (en-dash), and "£100k+". Grab the first number and its k-suffix.
  const match = band.match(/£?([\d,]+)(k)?/i);
  if (!match) return null;
  const num = Number(match[1].replace(/,/g, ''));
  if (!Number.isFinite(num)) return null;
  return match[2] ? num * 1000 : num;
}

export function getHundredKClub(limit = 10): HundredKClubStats {
  if (_hundredK) return { ..._hundredK, top: _hundredK.top.slice(0, limit) };

  const entries: HundredKCouncil[] = [];
  let totalStaff = 0;
  let councilsDisclosing = 0;
  let councilsWithAny = 0;

  for (const c of councils) {
    const bands = c.detailed?.salary_bands;
    if (!bands?.length) continue;
    councilsDisclosing++;

    let count = 0;
    for (const b of bands) {
      const min = parseBandMin(b.band);
      if (min !== null && min >= 100_000 && typeof b.count === 'number') {
        count += b.count;
      }
    }

    if (count > 0) {
      councilsWithAny++;
      entries.push({ council: c, count });
      totalStaff += count;
    }
  }

  entries.sort((a, b) => b.count - a.count);

  const sortedCounts = entries.map((e) => e.count).sort((a, b) => a - b);
  const medianPerCouncil =
    sortedCounts.length > 0 ? sortedCounts[Math.floor(sortedCounts.length / 2)] : 0;

  _hundredK = {
    totalStaff,
    councilsWithAny,
    councilsDisclosing,
    medianPerCouncil,
    top: entries,
  };
  return { ..._hundredK, top: _hundredK.top.slice(0, limit) };
}

// ── Tax cap breakers (card 6.2) ───────────────────────────────────────────────


// ── Three-year Band D squeeze (card 1.4) ──────────────────────────────────────

export interface ThreeYearSqueezeEntry {
  council: Council;
  /** 2023-24 Band D rate, pounds. */
  from: number;
  /** 2026-27 Band D rate, pounds. */
  to: number;
  /** Absolute pound increase over the three-year window. */
  changeAbs: number;
  /** Compound percentage rise 2023-24 → 2026-27. */
  changePct: number;
}

export interface ThreeYearSqueezeStats {
  /** Councils ranked by absolute £ rise, descending. */
  top: ThreeYearSqueezeEntry[];
  /** National median absolute £ rise over the three-year window. */
  medianAbs: number;
  /** National mean absolute £ rise. */
  meanAbs: number;
  /** National median compound % rise. */
  medianPct: number;
  /** National mean compound % rise. */
  meanPct: number;
  /** Councils included — billing authorities with 2023-24 and 2026-27. */
  councilsWithData: number;
  /** Start of the window. */
  fromYear: string;
  /** End of the window. */
  toYear: string;
}

let _threeYear: ThreeYearSqueezeStats | null = null;

/**
 * Compound Band D rise from 2023-24 to 2026-27 — a genuine three-year window.
 *
 * This ran 2023-24 → 2025-26 until now, which is two years, on a card called
 * "three-year squeeze"; the old code comment said "the 2-year window" outright.
 * With 2026-27 published for every billing authority the window finally matches
 * the name. County councils drop out: they are precepting, not billing,
 * authorities and carry no 2026-27 area figure.
 */
export function getThreeYearSqueeze(limit = 10): ThreeYearSqueezeStats {
  if (_threeYear) {
    return { ..._threeYear, top: _threeYear.top.slice(0, limit) };
  }

  const entries: ThreeYearSqueezeEntry[] = [];
  for (const c of councils) {
    const from = c.council_tax?.band_d_2023;
    const to = c.council_tax?.band_d_2026;
    if (!from || !to) continue;
    entries.push({
      council: c,
      from,
      to,
      changeAbs: to - from,
      changePct: (to / from - 1) * 100,
    });
  }

  // Rank by absolute £ rise — the hero figure. Councils paying more per
  // household over the three-year window tell a more concrete story than %s.
  entries.sort((a, b) => b.changeAbs - a.changeAbs);

  const sortedAbs = entries.map((e) => e.changeAbs).sort((a, b) => a - b);
  const sortedPcts = entries.map((e) => e.changePct).sort((a, b) => a - b);
  const medianAbs =
    sortedAbs.length > 0 ? sortedAbs[Math.floor(sortedAbs.length / 2)] : 0;
  const meanAbs =
    sortedAbs.length > 0
      ? sortedAbs.reduce((s, v) => s + v, 0) / sortedAbs.length
      : 0;
  const medianPct =
    sortedPcts.length > 0 ? sortedPcts[Math.floor(sortedPcts.length / 2)] : 0;
  const meanPct =
    sortedPcts.length > 0
      ? sortedPcts.reduce((s, v) => s + v, 0) / sortedPcts.length
      : 0;

  _threeYear = {
    top: entries,
    medianAbs,
    meanAbs,
    medianPct,
    meanPct,
    councilsWithData: entries.length,
    fromYear: '2023-24',
    toYear: CURRENT_TAX_YEAR,
  };
  return { ..._threeYear, top: _threeYear.top.slice(0, limit) };
}

// ── Cap every year (card 6.3) ─────────────────────────────────────────────────


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
