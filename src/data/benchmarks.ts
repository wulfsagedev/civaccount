// Service outcome benchmarks — computed from all 317 councils
// Provides averages, distributions, and context for each metric
// so raw numbers can be shown alongside meaningful comparisons.

import { councils, COUNCIL_TYPE_NAMES } from './councils';

// ─── Types ──────────────────────────────────────────────────

interface TypeBreakdown {
  average: number;
  median: number;
  count: number;
  min: number;
  max: number;
}

export interface RecyclingBenchmarks {
  nationalAverage: number;
  nationalMedian: number;
  count: number;
  min: number;
  max: number;
  byType: Record<string, TypeBreakdown>;
}

export interface HomesBuiltBenchmarks {
  nationalAverage: number;
  nationalMedian: number;
  nationalTotal: number;
  count: number;
  byType: Record<string, TypeBreakdown>;
}

export interface OfstedBenchmarks {
  distribution: Record<string, number>;
  total: number;
}

export interface RoadConditionBenchmarks {
  nationalAverage: number;
  count: number;
  byType: Record<string, TypeBreakdown>;
}

export interface ServiceOutcomeBenchmarks {
  recycling: RecyclingBenchmarks;
  housing: HomesBuiltBenchmarks;
  ofsted: OfstedBenchmarks;
  roadCondition: RoadConditionBenchmarks;
}

// ─── Helpers ────────────────────────────────────────────────

function median(sorted: number[]): number {
  if (sorted.length === 0) return 0;
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

function computeTypeBreakdowns(
  data: Array<{ value: number; type: string }>
): Record<string, TypeBreakdown> {
  const groups: Record<string, number[]> = {};

  for (const d of data) {
    if (!groups[d.type]) groups[d.type] = [];
    groups[d.type].push(d.value);
  }

  const result: Record<string, TypeBreakdown> = {};
  for (const [type, values] of Object.entries(groups)) {
    const sorted = [...values].sort((a, b) => a - b);
    const sum = sorted.reduce((s, v) => s + v, 0);
    result[type] = {
      average: Math.round((sum / sorted.length) * 10) / 10,
      median: Math.round(median(sorted) * 10) / 10,
      count: sorted.length,
      min: sorted[0],
      max: sorted[sorted.length - 1],
    };
  }

  return result;
}

// ─── Main computation ───────────────────────────────────────

let _cached: ServiceOutcomeBenchmarks | null = null;

export function getServiceOutcomeBenchmarks(): ServiceOutcomeBenchmarks {
  if (_cached) return _cached;

  const recyclingData: Array<{ value: number; type: string }> = [];
  const housingData: Array<{ value: number; type: string }> = [];
  const roadConditionData: Array<{ value: number; type: string }> = [];
  const ofstedCounts: Record<string, number> = {
    'Outstanding': 0,
    'Good': 0,
    'Requires improvement': 0,
    'Inadequate': 0,
  };
  let ofstedTotal = 0;

  for (const council of councils) {
    const outcomes = council.detailed?.service_outcomes;
    if (!outcomes) continue;

    // Recycling
    if (outcomes.waste?.recycling_rate_percent != null) {
      recyclingData.push({
        value: outcomes.waste.recycling_rate_percent,
        type: council.type,
      });
    }

    // Homes built
    if (outcomes.housing?.homes_built != null && outcomes.housing.homes_built > 0) {
      housingData.push({
        value: outcomes.housing.homes_built,
        type: council.type,
      });
    }

    // Road condition
    if (outcomes.roads?.condition_good_percent != null) {
      roadConditionData.push({
        value: outcomes.roads.condition_good_percent,
        type: council.type,
      });
    }

    // Ofsted
    if (outcomes.children_services?.ofsted_rating) {
      const rating = outcomes.children_services.ofsted_rating;
      ofstedCounts[rating] = (ofstedCounts[rating] || 0) + 1;
      ofstedTotal++;
    }
  }

  // Sort for median computation
  const recycSorted = recyclingData.map(d => d.value).sort((a, b) => a - b);
  const houseSorted = housingData.map(d => d.value).sort((a, b) => a - b);
  const roadSorted = roadConditionData.map(d => d.value).sort((a, b) => a - b);

  const recycSum = recycSorted.reduce((s, v) => s + v, 0);
  const houseSum = houseSorted.reduce((s, v) => s + v, 0);
  const roadSum = roadSorted.reduce((s, v) => s + v, 0);

  _cached = {
    recycling: {
      nationalAverage: recycSorted.length > 0
        ? Math.round((recycSum / recycSorted.length) * 10) / 10
        : 0,
      nationalMedian: Math.round(median(recycSorted) * 10) / 10,
      count: recycSorted.length,
      min: recycSorted[0] ?? 0,
      max: recycSorted[recycSorted.length - 1] ?? 0,
      byType: computeTypeBreakdowns(recyclingData),
    },
    housing: {
      nationalAverage: houseSorted.length > 0
        ? Math.round(houseSum / houseSorted.length)
        : 0,
      nationalMedian: Math.round(median(houseSorted)),
      nationalTotal: houseSum,
      count: houseSorted.length,
      byType: computeTypeBreakdowns(housingData),
    },
    ofsted: {
      distribution: ofstedCounts,
      total: ofstedTotal,
    },
    roadCondition: {
      nationalAverage: roadSorted.length > 0
        ? Math.round((roadSum / roadSorted.length) * 10) / 10
        : 0,
      count: roadSorted.length,
      byType: computeTypeBreakdowns(roadConditionData),
    },
  };

  return _cached;
}

// ─── Per-council context helpers ────────────────────────────

// Minimum councils per type before we use type-level comparisons
const MIN_TYPE_COUNT = 5;

export function getRecyclingContext(
  rate: number,
  councilType: string,
): { compareAverage: number; compareLabel: string } {
  const benchmarks = getServiceOutcomeBenchmarks();
  const typeData = benchmarks.recycling.byType[councilType];
  const useType = typeData && typeData.count >= MIN_TYPE_COUNT;

  const compareAverage = useType ? typeData.average : benchmarks.recycling.nationalAverage;
  const typeName = COUNCIL_TYPE_NAMES[councilType]?.toLowerCase();
  const compareLabel = useType && typeName
    ? `${typeName}s`
    : 'all councils';

  return { compareAverage, compareLabel };
}

export function getHomesBuiltContext(
  homes: number,
  councilType: string,
): { compareAverage: number; compareLabel: string } {
  const benchmarks = getServiceOutcomeBenchmarks();
  const typeData = benchmarks.housing.byType[councilType];
  const useType = typeData && typeData.count >= MIN_TYPE_COUNT;

  const compareAverage = useType ? Math.round(typeData.average) : benchmarks.housing.nationalAverage;
  const typeName = COUNCIL_TYPE_NAMES[councilType]?.toLowerCase();
  const compareLabel = useType && typeName
    ? `${typeName}s`
    : 'all councils';

  return { compareAverage, compareLabel };
}

export function getOfstedContext(
  rating: string,
): { sameRatingCount: number; totalAssessed: number } {
  const benchmarks = getServiceOutcomeBenchmarks();
  return {
    sameRatingCount: benchmarks.ofsted.distribution[rating] || 0,
    totalAssessed: benchmarks.ofsted.total,
  };
}

export function getRoadConditionContext(
  conditionPercent: number,
  councilType: string,
): { compareAverage: number; compareLabel: string } {
  const benchmarks = getServiceOutcomeBenchmarks();
  const typeData = benchmarks.roadCondition.byType[councilType];
  const useType = typeData && typeData.count >= MIN_TYPE_COUNT;

  const compareAverage = useType ? typeData.average : benchmarks.roadCondition.nationalAverage;
  const typeName = COUNCIL_TYPE_NAMES[councilType]?.toLowerCase();
  const compareLabel = useType && typeName
    ? `${typeName}s`
    : 'all councils';

  return { compareAverage, compareLabel };
}
