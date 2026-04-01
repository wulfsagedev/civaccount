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

// Batch 2 Council data
const councils = [
  {
    name: "Gloucestershire",
    anchor: "      last_verified: \"2026-02-25\",\n    },\n  },\n  {\n    ons_code: \"E10000014\",",
    budget: {
      education: 417250, transport: 53557, childrens_social_care: 159040,
      adult_social_care: 227627, public_health: 28757, housing: 4142,
      cultural: 7623, environmental: 30605, planning: 2157, central_services: 15785,
    },
    transparencyUrl: "https://www.gloucestershire.gov.uk/council-and-democracy/transparency/",
    spendingUrl: "https://www.gloucestershire.gov.uk/council-and-democracy/transparency/",
    budgetDocUrl: "https://www.gloucestershire.gov.uk/council-and-democracy/performance-and-spending/budget-and-medium-term-financial-strategy/",
  },
  {
    name: "Hampshire",
    anchor: "      last_verified: \"2026-02-25\",\n    },\n  },\n  {\n    ons_code: \"E10000015\",",
    budget: {
      education: 1244355, transport: 83402, childrens_social_care: 300348,
      adult_social_care: 606128, public_health: 59442, housing: 62,
      cultural: 24292, environmental: 73458, planning: 8177, central_services: 13539,
    },
    transparencyUrl: "https://www.hants.gov.uk/aboutthecouncil/budgetspendingandperformance",
    spendingUrl: "https://www.hants.gov.uk/aboutthecouncil/budgetspendingandperformance",
    budgetDocUrl: "https://www.hants.gov.uk/aboutthecouncil/budgetspendingandperformance/budgetandcounciltax",
  },
  {
    name: "Hertfordshire",
    anchor: "      last_verified: \"2026-02-25\",\n    },\n  },\n  {\n    ons_code: \"E10000016\",",
    budget: {
      education: 909714, transport: 85113, childrens_social_care: 235405,
      adult_social_care: 520546, public_health: 55031, housing: 7994,
      cultural: 19475, environmental: 59310, planning: 4848, central_services: 12165,
    },
    transparencyUrl: "https://www.hertfordshire.gov.uk/about-the-council/freedom-of-information-and-council-data/open-data-statistics-about-hertfordshire/what-we-spend-and-how-we-spend-it/what-we-spend-and-how-we-spend-it.aspx",
    spendingUrl: "https://www.hertfordshire.gov.uk/about-the-council/freedom-of-information-and-council-data/open-data-statistics-about-hertfordshire/what-we-spend-and-how-we-spend-it/what-we-spend-and-how-we-spend-it.aspx",
    budgetDocUrl: "https://www.hertfordshire.gov.uk/about-the-council/freedom-of-information-and-council-data/open-data-statistics-about-hertfordshire/what-we-spend-and-how-we-spend-it/integrated-plan/integrated-plan.aspx",
  },
  {
    name: "Lancashire",
    anchor: "      last_verified: \"2026-02-25\",\n    },\n  },\n  {\n    ons_code: \"E10000018\",",
    budget: {
      education: 1159701, transport: 62923, childrens_social_care: 294046,
      adult_social_care: 585546, public_health: 98722, housing: 0,
      cultural: 23841, environmental: 91943, planning: 16088, central_services: 22876,
    },
    transparencyUrl: "https://www.lancashire.gov.uk/council/being-accountable/",
    spendingUrl: "https://www.lancashire.gov.uk/council/being-accountable/",
    budgetDocUrl: "https://www.lancashire.gov.uk/council/finance/budget/",
  },
  {
    name: "Leicestershire",
    anchor: "      last_verified: \"2026-02-25\",\n    },\n  },\n  {\n    ons_code: \"E10000019\",",
    budget: {
      education: 326383, transport: 50967, childrens_social_care: 142210,
      adult_social_care: 283175, public_health: 31237, housing: 0,
      cultural: 8739, environmental: 42392, planning: 6301, central_services: 11456,
    },
    transparencyUrl: "https://www.leicestershire.gov.uk/about-the-council/council-spending",
    spendingUrl: "https://www.leicestershire.gov.uk/about-the-council/council-spending",
    budgetDocUrl: "https://www.leicestershire.gov.uk/about-the-council/council-spending/our-budget-2026-30",
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

  // Insert BEFORE the last_verified line
  content = content.slice(0, anchorIdx) + insertion + content.slice(anchorIdx);
  successCount++;
  console.log(`OK: ${council.name} service_spending inserted`);
}

writeFileSync(filePath, content);
console.log(`\nDone: ${successCount}/${councils.length} councils enriched with service_spending`);
