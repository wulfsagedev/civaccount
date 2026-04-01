import { councils, type Council } from '@/data/councils';
import { getCategoryLabel } from './proposals';

export interface CivicDiff {
  id: string;
  council_slug: string;
  council_name: string;
  budget_category: string;
  year_from: number;
  year_to: number;
  amount_from: number;
  amount_to: number;
  pct_change: number;
  summary: string;
  type: 'council_tax' | 'budget';
}

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/['']/g, '')
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

// Generate council tax diffs (year-over-year Band D changes)
function generateTaxDiffs(council: Council): CivicDiff[] {
  const diffs: CivicDiff[] = [];
  const tax = council.council_tax;
  if (!tax) return diffs;

  const slug = generateSlug(council.name);
  const years: [number, number | null][] = [
    [2025, tax.band_d_2025],
    [2024, tax.band_d_2024],
    [2023, tax.band_d_2023],
    [2022, tax.band_d_2022],
    [2021, tax.band_d_2021],
  ];

  for (let i = 0; i < years.length - 1; i++) {
    const [yearTo, amountTo] = years[i];
    const [yearFrom, amountFrom] = years[i + 1];
    if (amountTo === null || amountFrom === null) continue;

    const pctChange = ((amountTo - amountFrom) / amountFrom) * 100;
    const direction = pctChange > 0 ? 'increased' : pctChange < 0 ? 'decreased' : 'stayed the same';
    const absPct = Math.abs(pctChange).toFixed(1);

    diffs.push({
      id: `${slug}-tax-${yearFrom}-${yearTo}`,
      council_slug: slug,
      council_name: council.name,
      budget_category: 'council_tax',
      year_from: yearFrom,
      year_to: yearTo,
      amount_from: amountFrom,
      amount_to: amountTo,
      pct_change: Math.round(pctChange * 10) / 10,
      summary: `${council.name} Band D council tax ${direction} by ${absPct}% (£${amountFrom.toFixed(2)} to £${amountTo.toFixed(2)}).`,
      type: 'council_tax',
    });
  }

  return diffs;
}

// Generate budget category diffs (current vs implied previous year)
function generateBudgetDiffs(council: Council): CivicDiff[] {
  const diffs: CivicDiff[] = [];
  const budget = council.budget;
  if (!budget) return diffs;

  const slug = generateSlug(council.name);
  const categories = [
    'education', 'transport', 'childrens_social_care', 'adult_social_care',
    'public_health', 'housing', 'cultural', 'environmental', 'planning',
    'central_services',
  ] as const;

  // We only have current year budget data, so generate diffs from council_tax_increase_percent
  // as a proxy for overall budget change
  const taxIncrease = council.detailed?.council_tax_increase_percent;
  if (taxIncrease !== undefined && taxIncrease !== null) {
    const totalBudget = budget.total_service;
    if (totalBudget) {
      const impliedPrevious = totalBudget / (1 + taxIncrease / 100);
      diffs.push({
        id: `${slug}-budget-total-2024-2025`,
        council_slug: slug,
        council_name: council.name,
        budget_category: 'total',
        year_from: 2024,
        year_to: 2025,
        amount_from: Math.round(impliedPrevious),
        amount_to: totalBudget,
        pct_change: taxIncrease,
        summary: `${council.name} total service spending changed by ${taxIncrease > 0 ? '+' : ''}${taxIncrease.toFixed(1)}% in 2025-26.`,
        type: 'budget',
      });
    }
  }

  return diffs;
}

// Get all diffs for a specific council
export function getDiffsForCouncil(councilSlug: string): CivicDiff[] {
  const council = councils.find(c => generateSlug(c.name) === councilSlug);
  if (!council) return [];

  return [
    ...generateTaxDiffs(council),
    ...generateBudgetDiffs(council),
  ].sort((a, b) => b.year_to - a.year_to);
}

// Get the most recent diffs across all councils (for a global feed)
export function getRecentDiffs(limit: number = 20): CivicDiff[] {
  const allDiffs: CivicDiff[] = [];

  for (const council of councils) {
    const taxDiffs = generateTaxDiffs(council);
    if (taxDiffs.length > 0) {
      allDiffs.push(taxDiffs[0]); // Most recent year-over-year change
    }
  }

  // Sort by absolute pct_change (most dramatic changes first)
  return allDiffs
    .sort((a, b) => Math.abs(b.pct_change) - Math.abs(a.pct_change))
    .slice(0, limit);
}

// Get diffs for a specific council and category
export function getDiffsForCategory(councilSlug: string, category: string): CivicDiff[] {
  return getDiffsForCouncil(councilSlug).filter(d => d.budget_category === category);
}
