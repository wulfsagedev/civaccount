// Auto-generated UK Council Data
// Sources: GOV.UK Council Tax 2025-26, Revenue Expenditure 2024-25, ONS Mid-2024 Population Estimates
// Last updated: January 2026

import { populationData } from './population';
import { allCouncils } from './councils/index';

export interface CouncilBudget {
  education: number | null;
  transport: number | null;
  childrens_social_care: number | null;
  adult_social_care: number | null;
  public_health: number | null;
  housing: number | null;
  cultural: number | null;
  environmental: number | null;
  planning: number | null;
  central_services: number | null;
  other: number | null;
  total_service: number | null;
  net_current: number | null;
}

export interface CouncilTax {
  band_d_2025: number;
  band_d_2024: number | null;
  band_d_2023: number | null;
  band_d_2022: number | null;
  band_d_2021: number | null;
}

// Enhanced detailed data from individual council sources
export interface PreceptBreakdown {
  authority: string;
  band_d: number;
  description?: string;
}

export interface ServiceDetail {
  name: string;
  description: string;
}

export interface DataSource {
  title: string;
  url: string;
  description?: string;
}

// Data provenance — used by SourceAnnotation to show where each number comes from
export type DataLabel = 'published' | 'calculated' | 'comparison' | 'editorial' | 'official';

export interface DataProvenance {
  label: DataLabel;
  source_url?: string;
  source_title?: string;
  data_year?: string;
  methodology?: string;
}

// Leadership team member
export interface LeadershipMember {
  name: string;
  role: string;
  responsibilities?: string[];
}

// Cabinet/executive member
export interface CabinetMember {
  name: string;
  role: string;
  portfolio: string;
  party?: string;
}

// Town/parish council precept
export interface ParishPrecept {
  name: string;
  precept_total: number; // Total precept amount
  band_d?: number; // Band D equivalent if available
}

// Grant recipient
export interface GrantRecipient {
  organisation: string;
  amount: number;
  purpose?: string;
  year?: string;
}

// Key document/report
export interface CouncilDocument {
  title: string;
  url: string;
  type: 'budget' | 'accounts' | 'strategy' | 'audit' | 'report' | 'other';
  year?: string;
  size_kb?: number;
}

// Budget category for expenditure/income breakdown
export interface BudgetCategory {
  name: string;
  expenditure: number; // Gross expenditure in pounds
  income: number; // Income (negative value or absolute)
  net: number; // Net expenditure
  description?: string;
}

// Top contracts per service area (from contracts registers / council decisions)
export interface ServiceContract {
  supplier: string;
  description: string;
  annual_value?: number;      // £ per year
  contract_period?: string;   // e.g., "2026-2047"
  source_url?: string;        // .gov.uk or council domain link
}

// Links to raw transparency data (invoices, contracts registers, budget books)
export interface TransparencyLink {
  label: string;              // e.g., "Invoices over £250"
  url: string;                // Public URL to transparency data
  description?: string;       // e.g., "Every payment over £250, updated monthly"
}

// Detailed service spending breakdown (what each budget category covers)
export interface ServiceSpendingDetail {
  category: string; // e.g., 'environmental', 'housing', 'planning'
  budget?: number; // Total budget for this category in pounds (optional)
  services: Array<{
    name: string;
    description: string;
    amount?: number; // Specific spending if known
  }>;
  contracts?: ServiceContract[];       // Top contracts for this service area
  transparency_links?: TransparencyLink[]; // Links to raw data sources
}

// Council tax precept share by precepting authority
export interface CouncilTaxShare {
  authority: string;
  band_d: number;
  percentage: number;
}

// Service outcomes from GOV.UK published data — what the money actually achieved
export interface ServiceOutcomes {
  // General
  population_served?: number;          // Total population the council serves

  // Streets & Infrastructure (DfT + DEFRA data)
  roads?: {
    maintained_miles?: number;         // Miles of roads the council maintains
    condition_good_percent?: number;   // % classified roads in good condition
    condition_fair_percent?: number;
    condition_poor_percent?: number;
    condition_rating?: 'green' | 'amber' | 'red'; // DfT maintenance rating
    potholes_repaired?: number;
    year?: string;
    maintenance_backlog?: number;      // Total maintenance backlog in £
    annual_investment?: number;        // Annual road repair spend in £
    network_length_miles?: number;     // Total road network in miles
  };
  waste?: {
    recycling_rate_percent?: number;   // Household recycling rate
    fly_tipping_incidents?: number;
    total_waste_tonnes?: number;
    year?: string;
  };

  // Community services
  libraries?: {
    count?: number;                    // Number of libraries
    visits_annual?: number;            // Annual library visits
  };

  // Social Care & Children (Ofsted + CQC + ASCOF)
  children_services?: {
    ofsted_rating?: 'Outstanding' | 'Good' | 'Requires improvement' | 'Inadequate';
    ofsted_date?: string;              // Last inspection date
    children_looked_after?: number;
  };
  adult_social_care?: {
    cqc_rating?: 'Outstanding' | 'Good' | 'Requires improvement' | 'Inadequate';
    cqc_date?: string;
    satisfaction_percent?: number;     // ASCOF user satisfaction
    clients_served?: number;
  };

  // Housing & Planning (MHCLG)
  housing?: {
    homes_built?: number;              // Net additional dwellings
    homes_built_year?: string;
    homes_target?: number;             // Annual housing delivery target (MHCLG HDT)
    delivery_percent?: number;         // homes delivered / target * 100 (HDT result)
    affordable_homes_built?: number;
    planning_major_on_time_percent?: number;  // % major apps decided within target
    planning_minor_on_time_percent?: number;
    homelessness_assessments?: number;
    temp_accommodation_households?: number;
  };
}

// Accountability flags — financial distress and oversight
export interface Accountability {
  section_114?: {
    issued: boolean;
    dates?: string[];       // Can have multiple (Croydon had 2)
    reason?: string;
  };
  audit_opinion?: 'Unqualified' | 'Qualified' | 'Disclaimed' | 'Adverse';
  audit_year?: string;
  government_intervention?: boolean;  // Commissioners appointed
  intervention_reason?: string;
}

export interface DetailedCouncilData {
  // Council tax breakdown by precepting authority
  precepts?: PreceptBreakdown[];
  total_band_d?: number; // Total Band D including all precepts

  // Budget details from council website
  operating_budget?: number; // In pounds
  capital_programme?: number; // In pounds
  council_tax_increase_percent?: number;
  revenue_budget?: number; // Net revenue budget
  reserves?: number; // General reserves
  housing_revenue_account?: number; // HRA if applicable

  // Budget breakdown by category (from official .gov.uk sources)
  budget_categories?: BudgetCategory[];
  council_tax_requirement?: number; // Amount to be raised from council tax
  council_tax_base?: number; // Number of Band D equivalent properties

  // Council tax share breakdown
  council_tax_shares?: CouncilTaxShare[];

  // Medium Term Financial Strategy
  mtfs_deficit?: number; // Forecast deficit
  savings_target?: number; // Planned savings
  savings_achieved?: number; // Achieved savings
  budget_gap?: number; // Gap before savings measures
  total_savings_since_2011?: number; // Cumulative savings

  // Services this council provides
  services?: ServiceDetail[];

  // Detailed breakdown of what each spending category covers
  service_spending?: ServiceSpendingDetail[];

  // Leadership and governance
  chief_executive?: string;
  leadership_team?: LeadershipMember[];
  cabinet?: CabinetMember[];
  council_leader?: string;
  chair?: string;
  total_councillors?: number;

  // Staff information
  staff_count?: number;
  staff_cost?: number; // Total staff cost
  staff_fte?: number; // Full-time equivalent headcount
  agency_staff_count?: number; // Agency/temp staff

  // Senior pay (from annual pay policy statement)
  chief_executive_salary?: number; // Base salary in £
  chief_executive_total_remuneration?: number; // Salary + pension + benefits

  // Councillor allowances (from members' allowances scheme)
  councillor_basic_allowance?: number; // Per-councillor basic allowance per year
  leader_allowance?: number; // Leader's special responsibility allowance
  total_allowances_cost?: number; // Total cost of all member allowances

  // Transparency links for governance data
  governance_transparency?: TransparencyLink[];

  // Councillor allowances detail (per-member breakdown)
  councillor_allowances_detail?: Array<{
    name: string;
    basic: number;
    special?: number;
    travel?: number;
    total: number;
  }>;

  // Top suppliers by annual spend (from invoices over £250)
  top_suppliers?: Array<{
    name: string;
    annual_spend: number;
    category?: string;
    description?: string;
  }>;

  // Staff salary band distribution (£50k+ in £5k bands)
  salary_bands?: Array<{
    band: string;
    count: number;
  }>;

  // Grant payments to voluntary/community sector
  grant_payments?: Array<{
    recipient: string;
    amount: number;
    purpose?: string;
    description?: string;
  }>;

  // Quarterly performance KPIs with RAG status
  performance_kpis?: Array<{
    metric: string;
    value: string;
    target?: string;
    status: 'green' | 'amber' | 'red';
    period: string;
  }>;

  // Waste destinations breakdown
  waste_destinations?: Array<{
    type: string;
    tonnage: number;
    percentage: number;
  }>;

  // Section-level transparency links (keyed by dashboard section)
  section_transparency?: Record<string, TransparencyLink[]>;

  // Open data links organised by theme
  open_data_links?: Array<{
    theme: string;
    links: TransparencyLink[];
  }>;

  // Parish/town councils (for district councils)
  parish_precepts?: ParishPrecept[];

  // Grants awarded
  grants?: GrantRecipient[];
  total_grants?: number;

  // Key documents
  documents?: CouncilDocument[];

  // Official data sources
  sources?: DataSource[];

  // Service outcomes from GOV.UK published data
  service_outcomes?: ServiceOutcomes;

  // Accountability flags
  accountability?: Accountability;

  // Council website URLs
  website?: string;
  council_tax_url?: string;
  budget_url?: string;
  transparency_url?: string;
  accounts_url?: string;
  councillors_url?: string;

  // When this detailed data was last verified
  last_verified?: string;

  // Per-field source URLs — exact provenance for each data point
  // Every field that comes from a council website (not GOV.UK bulk data) should have an entry here
  field_sources?: Record<string, {
    url: string;        // Direct URL to the source document/page
    title: string;      // Human-readable source title
    page?: number;      // Page number within a PDF (optional)
    accessed: string;   // ISO date when this source was last verified
  }>;
}

export interface Council {
  ons_code: string;
  name: string;
  type: string;
  type_name: string;
  region?: string;
  population?: number;
  council_tax?: CouncilTax;
  budget?: CouncilBudget;
  // Optional detailed data from council's own website
  detailed?: DetailedCouncilData;
}

export type CouncilType = 'SC' | 'SD' | 'UA' | 'MD' | 'LB' | 'OLB' | 'ILB';

export const COUNCIL_TYPE_NAMES: Record<string, string> = {
  'SC': 'County Council',
  'SD': 'District Council',
  'UA': 'Unitary Authority',
  'MD': 'Metropolitan District',
  'LB': 'London Borough',
  'OLB': 'Outer London Borough',
  'ILB': 'Inner London Borough',
};

// Sentence-form of the type name (for use mid-sentence, e.g. "X is a county council").
// Generic nouns lowercase; proper nouns (London) stay capitalised.
export const COUNCIL_TYPE_NAMES_SENTENCE: Record<string, string> = {
  'County Council': 'county council',
  'District Council': 'district council',
  'Unitary Authority': 'unitary authority',
  'Metropolitan District': 'metropolitan district',
  'London Borough': 'London borough',
  'Outer London Borough': 'Outer London borough',
  'Inner London Borough': 'Inner London borough',
};

/** Return the sentence-form of a council type name, safe for mid-sentence prose. */
export function toSentenceTypeName(typeName: string | undefined): string {
  if (!typeName) return 'council';
  return COUNCIL_TYPE_NAMES_SENTENCE[typeName] || typeName.toLowerCase();
}

// Calculate council tax bands from Band D
export function calculateBands(bandD: number): Record<string, number> {
  return {
    A: bandD * (6/9),
    B: bandD * (7/9),
    C: bandD * (8/9),
    D: bandD,
    E: bandD * (11/9),
    F: bandD * (13/9),
    G: bandD * (15/9),
    H: bandD * 2,
  };
}

// Get display name for council type
export function getCouncilTypeDisplay(type: string): string {
  return COUNCIL_TYPE_NAMES[type] || type;
}

// Get full display name for a council (e.g., "Kent" -> "Kent County Council")
export function getCouncilDisplayName(council: Council): string {
  const name = council.name;
  const type = council.type;

  // If name already includes the type, return as-is
  if (name.includes('Council') || name.includes('Authority') || name.includes('Borough')) {
    return name;
  }

  // Add appropriate suffix based on type
  switch (type) {
    case 'SC':
      return `${name} County Council`;
    case 'SD':
      return `${name} District Council`;
    case 'UA':
      return `${name} Council`;
    case 'MD':
      return `${name} Council`;
    case 'LB':
    case 'OLB':
    case 'ILB':
      return `${name}`;
    default:
      return name;
  }
}

// Format budget amount (input in thousands) - UK friendly formatting
export function formatBudget(amountInThousands: number | null): string {
  if (amountInThousands === null) return 'N/A';

  // Handle negative values: format the absolute value, then prepend minus
  if (amountInThousands < 0) {
    return `-${formatBudget(Math.abs(amountInThousands))}`;
  }

  // Convert to actual pounds for clarity
  const pounds = amountInThousands * 1000;

  // Billions (1,000,000,000+)
  if (pounds >= 1000000000) {
    const billions = pounds / 1000000000;
    return `£${billions.toFixed(1)} billion`;
  }

  // Millions (1,000,000+)
  if (pounds >= 1000000) {
    const millions = pounds / 1000000;
    // Show whole number if it's clean, otherwise one decimal
    return millions % 1 === 0
      ? `£${millions.toFixed(0)} million`
      : `£${millions.toFixed(1)} million`;
  }

  // Thousands - show with commas for readability
  return `£${pounds.toLocaleString('en-GB')}`;
}

// Format currency for display (pounds, with appropriate formatting)
export function formatCurrency(amount: number | null, options?: { decimals?: number }): string {
  if (amount === null) return 'N/A';

  const decimals = options?.decimals ?? (amount % 1 === 0 ? 0 : 2);

  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(amount);
}

export const councils: Council[] = allCouncils;


// Get councils by type
export function getCouncilsByType(type: string): Council[] {
  return councils.filter(c => c.type === type);
}

// Get council by ONS code
export function getCouncilByCode(code: string): Council | undefined {
  return councils.find(c => c.ons_code === code);
}

// Get council by name (exact or close match)
export function getCouncilByName(name: string): Council | undefined {
  const lowerName = name.toLowerCase();
  return councils.find(c => c.name.toLowerCase() === lowerName) ||
         councils.find(c => c.name.toLowerCase().includes(lowerName));
}

// Generate URL-friendly slug from council name
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/['']/g, '')
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-+/g, '-');
}

// Get council by URL slug
export function getCouncilBySlug(slug: string): Council | undefined {
  return councils.find(c => generateSlug(c.name) === slug);
}

// Get all council slugs for static generation
export function getAllCouncilSlugs(): string[] {
  return councils.map(c => generateSlug(c.name));
}

// Get slug for a council
export function getCouncilSlug(council: Council): string {
  return generateSlug(council.name);
}

// Get average Band D by council type
export function getAverageBandDByType(type: string): number {
  const typeCouncils = councils.filter(c => c.type === type && c.council_tax?.band_d_2025);
  if (typeCouncils.length === 0) return 0;
  const total = typeCouncils.reduce((sum, c) => sum + (c.council_tax?.band_d_2025 || 0), 0);
  return total / typeCouncils.length;
}

// Statistics
export const councilStats = {
  totalCouncils: councils.length,
  byType: {
    countyCouncils: councils.filter(c => c.type === 'SC').length,
    districtCouncils: councils.filter(c => c.type === 'SD').length,
    unitaryAuthorities: councils.filter(c => c.type === 'UA').length,
    metropolitanDistricts: councils.filter(c => c.type === 'MD').length,
    londonBoroughs: councils.filter(c => c.type === 'LB' || c.type === 'OLB' || c.type === 'ILB').length,
  },
  withCouncilTax: councils.filter(c => c.council_tax).length,
  withBudget: councils.filter(c => c.budget).length,
  // Enrichment progress tracking
  withCabinet: councils.filter(c => c.detailed?.cabinet?.length).length,
  withDocuments: councils.filter(c => c.detailed?.documents?.length).length,
  withReserves: councils.filter(c => c.detailed?.reserves).length,
  withSources: councils.filter(c => c.detailed?.sources?.length).length,
};

// Population helper functions
export function getCouncilPopulation(councilName: string): number | undefined {
  // Direct match
  if (populationData[councilName]) {
    return populationData[councilName];
  }

  // Try common variations
  const normalizedName = councilName
    .replace(' Council', '')
    .replace(' Borough Council', '')
    .replace(' District Council', '')
    .replace(' County Council', '')
    .replace(' City Council', '')
    .replace(', City of', '')
    .replace(' UA', '')
    .replace(' & ', ' and ') // Handle ampersand variations
    .trim();

  if (populationData[normalizedName]) {
    return populationData[normalizedName];
  }

  // Also try replacing 'and' with '&' for reverse matching
  const ampersandName = councilName
    .replace(' and ', ' & ')
    .trim();

  return populationData[ampersandName];
}

// Efficiency metrics calculations
export interface EfficiencyMetrics {
  perCapitaSpending: number | null;  // Total spending per person
  adminOverheadPercent: number | null;  // Central services as % of total
  serviceSpendingPerCapita: Record<string, number>;  // Per-capita by service
}

export function calculateEfficiencyMetrics(council: Council): EfficiencyMetrics | null {
  const population = getCouncilPopulation(council.name);

  if (!population || !council.budget?.total_service) {
    return null;
  }

  const totalBudget = council.budget.total_service * 1000; // Convert from thousands
  const centralServices = council.budget.central_services ? council.budget.central_services * 1000 : 0;

  const serviceSpendingPerCapita: Record<string, number> = {};
  const services = [
    'education', 'transport', 'childrens_social_care', 'adult_social_care',
    'public_health', 'housing', 'cultural', 'environmental', 'planning', 'central_services'
  ] as const;

  for (const service of services) {
    const amount = council.budget[service];
    if (amount !== null && amount > 0) {
      serviceSpendingPerCapita[service] = (amount * 1000) / population;
    }
  }

  return {
    perCapitaSpending: totalBudget / population,
    adminOverheadPercent: totalBudget > 0 ? (centralServices / totalBudget) * 100 : null,
    serviceSpendingPerCapita,
  };
}

// Calculate national efficiency statistics
export function getNationalEfficiencyStats() {
  const councilsWithData = councils
    .filter(c => c.budget?.total_service && getCouncilPopulation(c.name))
    .map(c => {
      const population = getCouncilPopulation(c.name)!;
      const totalBudget = c.budget!.total_service! * 1000;
      const centralServices = c.budget!.central_services ? c.budget!.central_services * 1000 : 0;

      return {
        council: c,
        population,
        perCapitaSpending: totalBudget / population,
        adminOverheadPercent: totalBudget > 0 ? (centralServices / totalBudget) * 100 : 0,
      };
    });

  if (councilsWithData.length === 0) {
    return null;
  }

  const avgPerCapita = councilsWithData.reduce((sum, c) => sum + c.perCapitaSpending, 0) / councilsWithData.length;
  const avgAdminOverhead = councilsWithData.reduce((sum, c) => sum + c.adminOverheadPercent, 0) / councilsWithData.length;

  const sortedByPerCapita = [...councilsWithData].sort((a, b) => a.perCapitaSpending - b.perCapitaSpending);
  const sortedByAdmin = [...councilsWithData].sort((a, b) => a.adminOverheadPercent - b.adminOverheadPercent);

  return {
    totalCouncilsAnalysed: councilsWithData.length,
    averagePerCapitaSpending: avgPerCapita,
    averageAdminOverhead: avgAdminOverhead,
    lowestPerCapita: sortedByPerCapita.slice(0, 5),
    highestPerCapita: sortedByPerCapita.slice(-5).reverse(),
    lowestAdminOverhead: sortedByAdmin.slice(0, 5),
    highestAdminOverhead: sortedByAdmin.slice(-5).reverse(),
  };
}
