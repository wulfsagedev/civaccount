import type { Council } from '@/data/councils';

export interface CardType {
  slug: string;
  title: (councilName: string) => string;
  description: (councilName: string) => string;
  hasData: (council: Council) => boolean;
}

export const CARD_TYPES: Record<string, CardType> = {
  'your-bill': {
    slug: 'your-bill',
    title: (name) => `Your Council Tax Bill — ${name}`,
    description: (name) => `See how much Band D council tax costs in ${name} for 2025-26.`,
    hasData: (c) => !!c.council_tax?.band_d_2025,
  },
  'bill-breakdown': {
    slug: 'bill-breakdown',
    title: (name) => `Council Tax Breakdown — ${name}`,
    description: (name) => `See who gets your council tax in ${name} — council, police, fire, and more.`,
    hasData: (c) => !!c.detailed?.precepts?.length,
  },
  'tax-bands': {
    slug: 'tax-bands',
    title: (name) => `Council Tax Bands A-H — ${name}`,
    description: (name) => `Council tax by property band in ${name} for 2025-26.`,
    hasData: (c) => !!c.council_tax?.band_d_2025,
  },
  'bill-history': {
    slug: 'bill-history',
    title: (name) => `How Your Bill Has Changed — ${name}`,
    description: (name) => `5-year council tax trend for ${name}, from 2021 to 2025.`,
    hasData: (c) => !!c.council_tax?.band_d_2025 && !!c.council_tax?.band_d_2021,
  },
  'spending': {
    slug: 'spending',
    title: (name) => `Where Your Tax Goes — ${name}`,
    description: (name) => `Budget breakdown showing how ${name} spends your council tax.`,
    hasData: (c) => !!c.budget?.total_service,
  },
  'suppliers': {
    slug: 'suppliers',
    title: (name) => `Top Suppliers — ${name}`,
    description: (name) => `The biggest companies and organisations paid by ${name}.`,
    hasData: (c) => !!c.detailed?.top_suppliers?.length,
  },
  'grants': {
    slug: 'grants',
    title: (name) => `Grant Payments — ${name}`,
    description: (name) => `Local organisations receiving grants from ${name}.`,
    hasData: (c) => !!c.detailed?.grant_payments?.length,
  },
  'financial-health': {
    slug: 'financial-health',
    title: (name) => `Financial Health — ${name}`,
    description: (name) => `Reserves, budget gap, and savings targets for ${name}.`,
    hasData: (c) => !!c.detailed?.reserves || !!c.detailed?.budget_gap,
  },
  'leadership': {
    slug: 'leadership',
    title: (name) => `Who Runs ${name}`,
    description: (name) => `Council leader, chief executive, and cabinet members for ${name}.`,
    hasData: (c) => !!c.detailed?.council_leader || !!c.detailed?.chief_executive,
  },
  'pay': {
    slug: 'pay',
    title: (name) => `Pay & Allowances — ${name}`,
    description: (name) => `CEO salary, councillor allowances, and senior pay at ${name}.`,
    hasData: (c) => !!c.detailed?.chief_executive_salary || !!c.detailed?.councillor_basic_allowance,
  },
  'performance': {
    slug: 'performance',
    title: (name) => `Council Performance — ${name}`,
    description: (name) => `Key performance indicators and ratings for ${name}.`,
    hasData: (c) => !!c.detailed?.performance_kpis?.length,
  },
  'service-outcomes': {
    slug: 'service-outcomes',
    title: (name) => `What Your Money Does — ${name}`,
    description: (name) => `Service outcomes and impact metrics for ${name}.`,
    hasData: (c) => !!c.detailed?.service_outcomes,
  },
};

export const VALID_CARD_TYPES = Object.keys(CARD_TYPES);
