import { councils, getCouncilPopulation } from '@/data/councils';

/**
 * Comparable groups for fair council comparisons.
 * Canonical definition — import from here, do not duplicate.
 */
export const COMPARABLE_GROUPS = [
  { label: 'All-in-one councils', description: 'Unitary, metropolitan, and London boroughs', types: ['UA', 'MD', 'LB', 'OLB', 'ILB'] },
  { label: 'District councils', description: 'Two-tier lower (residents also pay county tax)', types: ['SD'] },
  { label: 'County councils', description: 'Two-tier upper (residents also pay district tax)', types: ['SC'] },
] as const;

export function getComparableGroupLabel(type: string): string {
  const group = COMPARABLE_GROUPS.find(g => (g.types as readonly string[]).includes(type));
  return group?.label || 'Council';
}

interface TypeAverages {
  bandD: number;
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

  const withBandD = peers.filter(c => c.council_tax?.band_d_2025);
  const bandD = withBandD.length > 0
    ? withBandD.reduce((s, c) => s + c.council_tax!.band_d_2025, 0) / withBandD.length
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

  return { bandD, spendingPerResident, ceoSalary, basicAllowance, totalBudget, count: peers.length };
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
        return c.council_tax?.band_d_2025 ?? null;
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
