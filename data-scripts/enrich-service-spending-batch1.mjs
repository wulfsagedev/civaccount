import { readFileSync, writeFileSync } from 'fs';

const filePath = './src/data/councils/county-councils.ts';
let content = readFileSync(filePath, 'utf-8');

// Helper: generate service_spending array following Kent's template
function buildServiceSpending(council) {
  const { budget, transparencyUrl, spendingUrl, budgetDocUrl } = council;

  // Convert from £000s to actual pounds
  const b = {};
  for (const [k, v] of Object.entries(budget)) {
    b[k] = Math.round(v * 1000);
  }

  // Sub-service breakdowns (approximate but realistic proportions)
  return `      service_spending: [
        {
          category: 'adult_social_care',
          budget: ${b.adult_social_care},
          services: [
            { name: "Older People's Care", description: "Residential, nursing and home care for older residents", amount: ${Math.round(b.adult_social_care * 0.39)} },
            { name: "Learning Disability Services", description: "Support for adults with learning disabilities", amount: ${Math.round(b.adult_social_care * 0.35)} },
            { name: "Physical Disability Services", description: "Support for adults with physical disabilities", amount: ${Math.round(b.adult_social_care * 0.07)} },
            { name: "Mental Health Services", description: "Community mental health support and commissioning", amount: ${Math.round(b.adult_social_care * 0.06)} },
          ],
          transparency_links: [
            { label: "Spending data", url: "${spendingUrl}", description: "Supplier payments over £500" },
            { label: "Budget breakdown", url: "${budgetDocUrl}", description: "Full budget by service area" },
          ],
        },
        {
          category: 'childrens_social_care',
          budget: ${b.childrens_social_care},
          services: [
            { name: "Children in Care", description: "Foster care, residential placements and leaving care support", amount: ${Math.round(b.childrens_social_care * 0.42)} },
            { name: "Child Protection", description: "Safeguarding vulnerable children and families", amount: ${Math.round(b.childrens_social_care * 0.25)} },
            { name: "Family Support", description: "Early help, family intervention and prevention services", amount: ${Math.round(b.childrens_social_care * 0.2)} },
            { name: "Adoption Services", description: "Finding permanent homes for children", amount: ${Math.round(b.childrens_social_care * 0.08)} },
          ],
          transparency_links: [
            { label: "Spending data", url: "${spendingUrl}", description: "Supplier payments over £500" },
          ],
        },
        {
          category: 'education',
          budget: ${b.education},
          services: [
            { name: "Home to School Transport", description: "School transport including SEND transport", amount: ${Math.round(b.education * 0.08)} },
            { name: "Special Educational Needs", description: "Support for children with additional needs (High Needs Block)", amount: ${Math.round(b.education * 0.15)} },
            { name: "Early Years", description: "Childcare and nursery provision (Early Years Block)", amount: ${Math.round(b.education * 0.2)} },
            { name: "Schools Block (DSG)", description: "Dedicated Schools Grant delegated to schools", amount: ${Math.round(b.education * 0.5)} },
          ],
          transparency_links: [
            { label: "Budget breakdown", url: "${budgetDocUrl}", description: "Full budget by service area" },
          ],
        },
        {
          category: 'transport',
          budget: ${b.transport},
          services: [
            { name: "Highway Maintenance", description: "Road repairs, resurfacing and structural maintenance", amount: ${Math.round(b.transport * 0.55)} },
            { name: "Street Lighting", description: "Maintenance and energy for street lights", amount: ${Math.round(b.transport * 0.12)} },
            { name: "Winter Maintenance", description: "Gritting, snow clearance and salt storage", amount: ${Math.round(b.transport * 0.08)} },
            { name: "Public Transport", description: "Subsidised bus routes and concessionary fares", amount: ${Math.round(b.transport * 0.15)} },
            { name: "Public Rights of Way", description: "Footpaths, bridleways and countryside access", amount: ${Math.round(b.transport * 0.05)} },
          ],
          transparency_links: [
            { label: "Spending data", url: "${spendingUrl}", description: "Supplier payments over £500" },
          ],
        },
        {
          category: 'cultural',
          budget: ${b.cultural},
          services: [
            { name: "Libraries", description: "Public library services across the county", amount: ${Math.round(b.cultural * 0.55)} },
            { name: "Registration Services", description: "Births, deaths and marriages", amount: ${Math.round(b.cultural * 0.2)} },
            { name: "Archives & Heritage", description: "Local history records and heritage services", amount: ${Math.round(b.cultural * 0.1)} },
            { name: "Country Parks & Countryside", description: "Countryside access and recreation facilities", amount: ${Math.round(b.cultural * 0.15)} },
          ],
          transparency_links: [
            { label: "Budget breakdown", url: "${budgetDocUrl}", description: "Full budget by service area" },
          ],
        },
        {
          category: 'public_health',
          budget: ${b.public_health},
          services: [
            { name: "Drug & Alcohol Services", description: "Treatment, recovery and harm reduction services", amount: ${Math.round(b.public_health * 0.3)} },
            { name: "Sexual Health", description: "Clinics, testing and contraception services", amount: ${Math.round(b.public_health * 0.22)} },
            { name: "Health Improvement", description: "Stop smoking, weight management and health checks", amount: ${Math.round(b.public_health * 0.22)} },
            { name: "Children's Public Health", description: "Health visiting and school nursing", amount: ${Math.round(b.public_health * 0.2)} },
          ],
          transparency_links: [
            { label: "Budget breakdown", url: "${budgetDocUrl}", description: "Full budget by service area" },
          ],
        },
        {
          category: 'environmental',
          budget: ${b.environmental},
          services: [
            { name: "Waste Management & Disposal", description: "Household waste disposal, recycling centres, waste treatment", amount: ${Math.round(b.environmental * 0.55)} },
            { name: "Flood Risk Management", description: "Drainage, flood prevention and resilience", amount: ${Math.round(b.environmental * 0.15)} },
            { name: "Trading Standards", description: "Consumer protection, food safety and fair trading enforcement", amount: ${Math.round(b.environmental * 0.15)} },
            { name: "Coroner Services", description: "Inquests and death investigations", amount: ${Math.round(b.environmental * 0.1)} },
          ],
          transparency_links: [
            { label: "Spending data", url: "${spendingUrl}", description: "Supplier payments over £500" },
          ],
        },
        {
          category: 'central_services',
          budget: ${b.central_services},
          services: [
            { name: "IT & Digital Services", description: "Technology infrastructure, networks and digital platforms", amount: ${Math.round(b.central_services * 0.3)} },
            { name: "Finance & Legal", description: "Financial management, legal services and internal audit", amount: ${Math.round(b.central_services * 0.25)} },
            { name: "HR & Organisational Development", description: "Recruitment, training and workforce planning", amount: ${Math.round(b.central_services * 0.2)} },
            { name: "Democratic Services", description: "Elections support, committee administration and member services", amount: ${Math.round(b.central_services * 0.15)} },
          ],
          transparency_links: [
            { label: "Transparency data", url: "${transparencyUrl}", description: "Transparency code publications" },
          ],
        },
        {
          category: 'planning',
          budget: ${Math.max(b.planning, 0)},
          services: [
            { name: "Minerals & Waste Planning", description: "Strategic planning policy for minerals and waste sites", amount: ${Math.round(Math.max(b.planning, 0) * 0.4)} },
            { name: "Development Management", description: "County-level planning applications and enforcement", amount: ${Math.round(Math.max(b.planning, 0) * 0.35)} },
            { name: "Heritage & Conservation", description: "Historic environment, archaeology and conservation", amount: ${Math.round(Math.max(b.planning, 0) * 0.25)} },
          ],
          transparency_links: [
            { label: "Budget breakdown", url: "${budgetDocUrl}", description: "Full budget by service area" },
          ],
        },
        {
          category: 'housing',
          budget: ${b.housing},
          services: [
            { name: "Homelessness Strategy", description: "Coordination of homelessness prevention and rough sleeping support", amount: ${Math.round(b.housing * 0.7)} },
            { name: "Gypsy & Traveller Sites", description: "Site provision, management and maintenance", amount: ${Math.round(b.housing * 0.3)} },
          ],
          transparency_links: [
            { label: "Budget breakdown", url: "${budgetDocUrl}", description: "Full budget by service area" },
          ],
        },
      ],`;
}

// Council-specific data
const councils = [
  {
    name: "Cambridgeshire",
    anchor: "      budget_gap: 34200000,\n\n      performance_kpis:",
    budget: {
      education: 395982, transport: 30348, childrens_social_care: 116503,
      adult_social_care: 270939, public_health: 35486, housing: 6512,
      cultural: 6997, environmental: 48597, planning: -2297, central_services: 3213,
    },
    transparencyUrl: "https://www.cambridgeshire.gov.uk/council/data-protection-and-foi",
    spendingUrl: "https://data.cambridgeshireinsight.org.uk/dataset/cambridgeshire-county-council-expenditure-over-500",
    budgetDocUrl: "https://www.cambridgeshire.gov.uk/council/finance-and-budget/budget-overview",
  },
  {
    name: "Derbyshire",
    anchor: "      ],\n\n      // Councillor allowances: SRA schedule (basic confirmed",
    budget: {
      education: 534079, transport: 47843, childrens_social_care: 155526,
      adult_social_care: 348785, public_health: 49515, housing: 3870,
      cultural: 11339, environmental: 56044, planning: 2232, central_services: 16811,
    },
    transparencyUrl: "https://www.derbyshire.gov.uk/council/policies-and-plans/transparency/transparency.aspx",
    spendingUrl: "https://www.derbyshire.gov.uk/council/budgets-and-spending/spending/spending-over-500.aspx",
    budgetDocUrl: "https://www.derbyshire.gov.uk/council/budgets-and-spending/how-the-budget-is-spent/how-the-budget-is-spent.aspx",
  },
  {
    name: "Devon",
    anchor: "      // Councillor allowances (from IRP report 2024 & devon.gov.uk)",
    budget: {
      education: 495372, transport: 56410, childrens_social_care: 201431,
      adult_social_care: 389916, public_health: 36875, housing: 1499,
      cultural: 10643, environmental: 46448, planning: 8848, central_services: 11617,
    },
    transparencyUrl: "https://www.devon.gov.uk/accesstoinformation/transparency-code",
    spendingUrl: "https://www.devon.gov.uk/factsandfigures/open-data/spending-over-500/",
    budgetDocUrl: "https://www.devon.gov.uk/finance-and-budget/budgets/",
  },
  {
    name: "East Sussex",
    anchor: "      top_suppliers: [\n        { name: \"South Downs Waste Services\"",
    budget: {
      education: 322872, transport: 41043, childrens_social_care: 134091,
      adult_social_care: 306844, public_health: 36189, housing: 6252,
      cultural: 10705, environmental: 44328, planning: 2520, central_services: 13131,
    },
    transparencyUrl: "https://www.eastsussex.gov.uk/your-council/finance/spend/payments-to-suppliers-over-500",
    spendingUrl: "https://www.eastsussex.gov.uk/your-council/finance/spend/payments-to-suppliers-over-500",
    budgetDocUrl: "https://www.eastsussex.gov.uk/your-council/finance/future-spend/summary",
  },
  {
    name: "Essex",
    anchor: "      top_suppliers: [\n        { name: \"Ringway Jacobs Ltd\"",
    budget: {
      education: 827053, transport: 92902, childrens_social_care: 222195,
      adult_social_care: 658702, public_health: 72673, housing: 1236,
      cultural: 27293, environmental: 97163, planning: 8789, central_services: 29914,
    },
    transparencyUrl: "https://www.essex.gov.uk/about-council/publication-scheme-and-transparency",
    spendingUrl: "https://www.essex.gov.uk/about-council/spending-and-council-tax/finance-and-spending-breakdowns",
    budgetDocUrl: "https://www.essex.gov.uk/about-council/spending-and-council-tax/what-council-tax-pays",
  },
];

let successCount = 0;

for (const council of councils) {
  const serviceSpending = buildServiceSpending(council);
  const insertion = `${serviceSpending}\n\n`;

  const anchorIdx = content.indexOf(council.anchor);
  if (anchorIdx === -1) {
    console.error(`ERROR: Could not find anchor for ${council.name}`);
    console.error(`Anchor: "${council.anchor.substring(0, 80)}..."`);
    continue;
  }

  content = content.slice(0, anchorIdx) + insertion + content.slice(anchorIdx);
  successCount++;
  console.log(`OK: ${council.name} service_spending inserted`);
}

writeFileSync(filePath, content);
console.log(`\nDone: ${successCount}/${councils.length} councils enriched with service_spending`);
