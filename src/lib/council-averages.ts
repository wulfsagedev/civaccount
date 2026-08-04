import {
  councils,
  getAreaBandD,
  getCouncilPopulation,
  CURRENT_TAX_YEAR,
  PREVIOUS_TAX_YEAR,
} from '@/data/councils';

/**
 * Comparable groups for fair council comparisons.
 * Canonical definition — import from here, do not duplicate.
 */
export const COMPARABLE_GROUPS = [
  { label: 'All-in-one councils', description: 'Unitary, metropolitan, and London boroughs', types: ['UA', 'MD', 'LB', 'OLB', 'ILB'] },
  { label: 'District councils', description: 'Two-tier lower (shares services with a county council)', types: ['SD'] },
  { label: 'County councils', description: 'Two-tier upper (shares services with district councils)', types: ['SC'] },
] as const;

export function getComparableGroupLabel(type: string): string {
  const group = COMPARABLE_GROUPS.find(g => (g.types as readonly string[]).includes(type));
  return group?.label || 'Council';
}

interface TypeAverages {
  /** Average area Band D for the type, in `bandDYear`. */
  bandD: number;
  /** The financial year `bandD` belongs to — 2026-27 for billing-authority
   * types, 2025-26 for county councils (SC). Render it next to the number. */
  bandDYear: typeof CURRENT_TAX_YEAR | typeof PREVIOUS_TAX_YEAR;
  /** Average area Band D for the type in 2025-26 specifically. Exists for
   * surfaces pinned to 2025-26 (the tax-card receipt, which must reconcile
   * against the 2025-26 precept stack) so they never compare a 2025-26 bill
   * against a 2026-27 average. */
  bandD2025: number;
  spendingPerResident: number;
  ceoSalary: number;
  basicAllowance: number;
  totalBudget: number; // in thousands
  count: number;
}

// Cache computed once per process (static data never changes at runtime)
const _cache = new Map<string, TypeAverages>();

function computeForType(type: string): TypeAverages {
  const peers = councils.filter(c => c.type === type);

  // Year-aware: use the most recent verified area Band D per council. All
  // members of a type share the same year (billing types → 2026-27, SC →
  // 2025-26), so the average never mixes years within a type.
  const withBandD = peers
    .map(c => getAreaBandD(c))
    .filter((a): a is NonNullable<typeof a> => a !== null);
  const bandD = withBandD.length > 0
    ? withBandD.reduce((s, a) => s + a.value, 0) / withBandD.length
    : 0;
  const bandDYear = type === 'SC' ? PREVIOUS_TAX_YEAR : CURRENT_TAX_YEAR;

  // The same average pinned to 2025-26: for billing types that is each
  // council's `previous` (2025-26); for SC the current value already is.
  const the2025Values = withBandD
    .map(a => (a.year === CURRENT_TAX_YEAR ? a.previous : a.value))
    .filter((v): v is number => typeof v === 'number');
  const bandD2025 = the2025Values.length > 0
    ? the2025Values.reduce((s, v) => s + v, 0) / the2025Values.length
    : 0;

  const withSpending = peers.filter(c => {
    const pop = getCouncilPopulation(c.name);
    return c.budget?.total_service && pop;
  });
  const spendingPerResident = withSpending.length > 0
    ? withSpending.reduce((s, c) => s + ((c.budget?.total_service || 0) * 1000) / (getCouncilPopulation(c.name) || 1), 0) / withSpending.length
    : 0;

  const withCeo = peers.filter(c => c.detailed?.chief_executive_salary);
  const ceoSalary = withCeo.length > 0
    ? withCeo.reduce((s, c) => s + c.detailed!.chief_executive_salary!, 0) / withCeo.length
    : 0;

  const withAllowance = peers.filter(c => c.detailed?.councillor_basic_allowance);
  const basicAllowance = withAllowance.length > 0
    ? withAllowance.reduce((s, c) => s + c.detailed!.councillor_basic_allowance!, 0) / withAllowance.length
    : 0;

  const withBudget = peers.filter(c => c.budget?.total_service);
  const totalBudget = withBudget.length > 0
    ? withBudget.reduce((s, c) => s + (c.budget?.total_service || 0), 0) / withBudget.length
    : 0;

  return { bandD, bandDYear, bandD2025, spendingPerResident, ceoSalary, basicAllowance, totalBudget, count: peers.length };
}

/**
 * Get pre-computed averages for a council type.
 * Results are cached for the lifetime of the process.
 */
export function getTypeAverages(type: string): TypeAverages {
  if (!_cache.has(type)) {
    _cache.set(type, computeForType(type));
  }
  return _cache.get(type)!;
}

/**
 * Get rank of a council within its type for a given metric.
 * Returns { rank, total } where rank is 1-indexed.
 */
export function getRankInType(
  councilName: string,
  type: string,
  metric: 'bandD' | 'ceoSalary' | 'spendingPerResident'
): { rank: number; total: number } | null {
  const peers = councils.filter(c => c.type === type);

  const getValue = (c: typeof councils[0]): number | null => {
    switch (metric) {
      case 'bandD':
        // Year-aware: most recent verified area Band D. Consistent within a
        // type (billing types all 2026-27, SC all 2025-26), so ranks never
        // compare across years.
        return getAreaBandD(c)?.value ?? null;
      case 'ceoSalary':
        return c.detailed?.chief_executive_salary ?? null;
      case 'spendingPerResident': {
        const pop = getCouncilPopulation(c.name);
        return c.budget?.total_service && pop ? (c.budget.total_service * 1000) / pop : null;
      }
    }
  };

  const withValues = peers
    .map(c => ({ name: c.name, value: getValue(c) }))
    .filter((x): x is { name: string; value: number } => x.value !== null)
    .sort((a, b) => a.value - b.value); // lowest first

  const idx = withValues.findIndex(x => x.name === councilName);
  if (idx === -1) return null;
  return { rank: idx + 1, total: withValues.length };
}
