#!/usr/bin/env node
// Batch 1 County Council Enrichment Script
// Enriches: Cambridgeshire, Derbyshire, Devon, East Sussex, Essex
// Data sourced exclusively from .gov.uk websites
// Run: node enrich-county-batch-1.mjs

import { readFileSync, writeFileSync } from 'fs';

const filePath = './src/data/councils/county-councils.ts';
let content = readFileSync(filePath, 'utf-8');

// Each value is the TypeScript text to insert BEFORE last_verified
const enrichments = {

  "Cambridgeshire": `      councillor_basic_allowance: 13610,
      council_tax_base: 247475.2,
      budget_gap: 34200000,

      performance_kpis: [
        { metric: "Potholes repaired annually", value: "52,229", target: "55,400", status: "amber", period: "2024-25" },
        { metric: "Roads improved (reconstructed/resurfaced)", value: "145 km", target: "135 km", status: "green", period: "2024-25" },
        { metric: "Household waste recycled", value: "49.8%", target: "50%", status: "amber", period: "2023-24" },
        { metric: "Road/pavement maintenance satisfaction", value: "21%", target: "44%", status: "red", period: "2024" },
        { metric: "Resident trust in council decision-making", value: "52%", target: "60%", status: "amber", period: "2024" },
      ],

      governance_transparency: [
        { label: "Senior officer remuneration", url: "https://www.cambridgeshire.gov.uk/council/finance-and-budget/statement-of-accounts", description: "Senior staff pay in Statement of Accounts" },
        { label: "Councillor allowances", url: "https://cambridgeshire.cmis.uk.com/ccc_live/Councillors.aspx", description: "Members' allowances register" },
        { label: "Pay policy statement", url: "https://www.cambridgeshire.gov.uk/council/finance-and-budget", description: "Statutory pay policy for senior officers" },
        { label: "Transparency code data", url: "https://www.cambridgeshire.gov.uk/council/data-protection-and-foi", description: "Spending, contracts and procurement data" },
      ],

      section_transparency: {
        finances: [
          { label: "Statement of Accounts 2023-24", url: "https://www.cambridgeshire.gov.uk/asset-library/imported-assets/Final-Audited-CCC-Statement-of-Accounts-2023-24.pdf", description: "Full audited financial statements" },
          { label: "Business Plan 2025-26", url: "https://www.cambridgeshire.gov.uk/council/finance-and-budget/business-plans/business-plan-2025-to-2026", description: "Budget and finance tables" },
          { label: "Medium Term Financial Strategy", url: "https://www.cambridgeshire.gov.uk/asset-library/imported-assets/Business-Plan-Section-2-Medium-Term-Financial-Strategy-2025-to-2026.pdf", description: "Five-year financial outlook" },
          { label: "Capital Strategy", url: "https://www.cambridgeshire.gov.uk/asset-library/imported-assets/Business-Plan-Section-5-Capital-Strategy-2025-to-2026.pdf", description: "Capital investment programme" },
        ],
        outcomes: [
          { label: "Business plan performance", url: "https://www.cambridgeshire.gov.uk/council/finance-and-budget/business-plans", description: "Annual performance measures and targets" },
          { label: "Joint Strategic Needs Assessment", url: "https://www.cambridgeshireinsight.org.uk/jsna/", description: "Population health and wellbeing data" },
        ],
      },

      open_data_links: [
        {
          theme: "Population & demographics",
          links: [
            { label: "Cambridgeshire Insight", url: "https://www.cambridgeshireinsight.org.uk/", description: "Shared research and intelligence hub" },
          ],
        },
        {
          theme: "Finance & spending",
          links: [
            { label: "Budget overview", url: "https://www.cambridgeshire.gov.uk/council/finance-and-budget/budget-overview", description: "Annual budget documents and breakdown" },
            { label: "Statement of Accounts", url: "https://www.cambridgeshire.gov.uk/council/finance-and-budget/statement-of-accounts", description: "Audited financial statements" },
          ],
        },
        {
          theme: "Freedom of information",
          links: [
            { label: "FOI and data access", url: "https://www.cambridgeshire.gov.uk/council/data-protection-and-foi", description: "Freedom of information requests and data protection" },
          ],
        },
      ],

`,

  "Derbyshire": `      chief_executive_salary: 191480,

      performance_kpis: [
        { metric: "Household waste recycled", value: "47.3%", target: "55%", status: "red", period: "2023-24" },
        { metric: "Road network in good condition", value: "64%", target: "75%", status: "red", period: "2024-25" },
        { metric: "Savings achieved", value: "£29.5m", target: "£31.94m", status: "amber", period: "2024-25" },
        { metric: "Highway defects completed in quarter", value: "3,995", target: "6,125", status: "amber", period: "Q4 2024-25" },
        { metric: "Children's services Ofsted rating", value: "Requires improvement", target: "Good", status: "red", period: "2019" },
      ],

      governance_transparency: [
        { label: "Senior officer pay", url: "https://www.derbyshire.gov.uk/council/policies-and-plans/transparency/transparency.aspx", description: "Senior staff remuneration under transparency code" },
        { label: "Councillor allowances", url: "https://democracy.derbyshire.gov.uk/mgMemberIndex.aspx", description: "Members' allowances and expenses register" },
        { label: "Spending over £500", url: "https://www.derbyshire.gov.uk/council/budgets-and-spending/spending/spending-over-500.aspx", description: "Monthly spend data over £500 CSV downloads" },
        { label: "Contracts register", url: "https://www.derbyshire.gov.uk/business/procurement/procurement.aspx", description: "Details of council contracts and procurement" },
      ],

      section_transparency: {
        finances: [
          { label: "Statement of Accounts", url: "https://www.derbyshire.gov.uk/council/budgets-and-spending/statement-of-accounts/statement-of-accounts.aspx", description: "Audited annual financial statements" },
          { label: "How the Budget is Spent", url: "https://www.derbyshire.gov.uk/council/budgets-and-spending/how-the-budget-is-spent/how-the-budget-is-spent.aspx", description: "Revenue budget breakdown by service" },
          { label: "Five Year Financial Plan", url: "https://www.derbyshire.gov.uk/council/budgets-and-spending/five-year-plan/five-year-financial-plan-5yfp.aspx", description: "Medium term financial strategy" },
          { label: "Where the Money Comes From", url: "https://www.derbyshire.gov.uk/council/budgets-and-spending/where-the-money-comes-from/where-the-money-comes-from.aspx", description: "Funding sources breakdown" },
        ],
        outcomes: [
          { label: "Council Plan", url: "https://www.derbyshire.gov.uk/council/policies-and-plans/council-plan/council-plan.aspx", description: "Strategic priorities and performance measures" },
          { label: "Performance monitoring", url: "https://democracy.derbyshire.gov.uk", description: "Quarterly performance reports to cabinet" },
        ],
      },

      open_data_links: [
        {
          theme: "Finance & spending",
          links: [
            { label: "Budgets and spending", url: "https://www.derbyshire.gov.uk/council/budgets-and-spending/budgets-and-spending.aspx", description: "Annual budget documents and spending data" },
            { label: "Spending over £500", url: "https://www.derbyshire.gov.uk/council/budgets-and-spending/spending/spending-over-500.aspx", description: "Monthly CSV reports of supplier payments" },
            { label: "Our financial position", url: "https://www.derbyshire.gov.uk/council/budgets-and-spending/position/our-financial-position.aspx", description: "Current year revenue and reserves position" },
          ],
        },
        {
          theme: "Open data & transparency",
          links: [
            { label: "Open data portal", url: "https://www.derbyshire.gov.uk/council/performance/open-data/data-transparency-open-data-and-the-local-government-transparency-code.aspx", description: "Senior salaries CSV, organisational chart, VCS grants" },
            { label: "Senior management salaries", url: "https://www.derbyshire.gov.uk/site-elements/documents/csv/council/performance/open-data/transparency-data-%E2%80%93-senior-management-salaries.csv", description: "CSV file with salary bands for all staff over £50k" },
          ],
        },
        {
          theme: "Performance",
          links: [
            { label: "Performance reports", url: "https://www.derbyshire.gov.uk/council/performance/performance.aspx", description: "Quarterly and annual performance reports" },
            { label: "Council Plan 2025-2029", url: "https://derbyshire.gov.uk/council/council-plan/council-plan.aspx", description: "Strategic objectives and outcome measures" },
          ],
        },
        {
          theme: "Freedom of information",
          links: [
            { label: "FOI requests", url: "https://www.derbyshire.gov.uk/council/have-your-say/complaints-and-feedback/request-information/freedom-of-information/freedom-of-information.aspx", description: "Freedom of information requests" },
          ],
        },
      ],

`,

  "Devon": `      chief_executive_salary: 212175,
      budget_gap: 39000000,

      performance_kpis: [
        { metric: "Potholes repaired annually", value: "56,328", target: "50,000", status: "green", period: "2024-25" },
        { metric: "Household waste recycled", value: "56.6%", target: "55%", status: "green", period: "2024-25" },
        { metric: "Waste sent to landfill", value: "0%", target: "<5%", status: "green", period: "2024-25" },
        { metric: "Children's services Ofsted rating", value: "Inadequate", target: "Good", status: "red", period: "2020" },
      ],

      waste_destinations: [
        { type: "Recycled", tonnage: 130000, percentage: 34 },
        { type: "Composted", tonnage: 85000, percentage: 22 },
        { type: "Energy recovery", tonnage: 165000, percentage: 43 },
        { type: "Landfill", tonnage: 0, percentage: 0 },
        { type: "Other", tonnage: 5000, percentage: 1 },
      ],

      governance_transparency: [
        { label: "Senior officer pay", url: "https://www.devon.gov.uk/accesstoinformation/transparency-code", description: "Senior staff remuneration under transparency code" },
        { label: "Councillor allowances", url: "https://democracy.devon.gov.uk/mgMemberIndex.aspx", description: "Members' allowances and expenses register" },
        { label: "Pay policy statement", url: "https://www.devon.gov.uk/accesstoinformation/transparency-code", description: "Annual pay policy for senior officers" },
        { label: "Spending over £500", url: "https://www.devon.gov.uk/accesstoinformation/transparency-code", description: "Monthly payments data CSV downloads" },
      ],

      section_transparency: {
        finances: [
          { label: "Audit and Inspection", url: "https://www.devon.gov.uk/finance-and-budget/audit-and-inspection/", description: "Audited accounts and external audit reports" },
          { label: "Budget Book 2025-26", url: "https://democracy.devon.gov.uk/documents/s51168/Budget%20Book%2025-26.pdf", description: "Detailed budget breakdown by service" },
          { label: "Budgets", url: "https://www.devon.gov.uk/finance-and-budget/budgets/", description: "Annual revenue and capital budgets" },
          { label: "Productivity Plan", url: "https://www.devon.gov.uk/finance-and-budget/productivity-plan-july-2024/", description: "Efficiency and transformation plans" },
        ],
        outcomes: [
          { label: "Devon Outcomes", url: "https://www.devon.gov.uk/strategic-plan/", description: "Strategic plan priorities and outcomes" },
          { label: "Highways performance", url: "https://www.devon.gov.uk/roadsandtransport/", description: "Road condition and maintenance data" },
        ],
      },

      open_data_links: [
        {
          theme: "Finance & spending",
          links: [
            { label: "Transparency code data", url: "https://www.devon.gov.uk/accesstoinformation/transparency-code", description: "Spending, contracts, senior salaries, land and assets" },
            { label: "Budget documents", url: "https://www.devon.gov.uk/finance-and-budget/budgets/", description: "Annual budget books and financial strategy" },
          ],
        },
        {
          theme: "Environment & waste",
          links: [
            { label: "Waste and recycling data", url: "https://www.devon.gov.uk/wasteandrecycling/", description: "Recycling rates and waste management information" },
          ],
        },
        {
          theme: "Roads & transport",
          links: [
            { label: "Road maintenance", url: "https://www.devon.gov.uk/roadsandtransport/", description: "Pothole repairs, road conditions and investment" },
          ],
        },
        {
          theme: "Freedom of information",
          links: [
            { label: "FOI requests", url: "https://www.devon.gov.uk/accesstoinformation/freedom-of-information/", description: "Freedom of information and data access" },
          ],
        },
      ],

`,

  "East Sussex": `      chief_executive_salary: 202927,
      councillor_basic_allowance: 14672,
      total_allowances_cost: 998264,
      staff_fte: 7246,
      council_tax_base: 211282.5,

      top_suppliers: [
        { name: "Balfour Beatty", annual_spend: 42000000, category: "Roads & Transport", description: "Highways maintenance contract covering road repairs, resurfacing and maintenance across East Sussex county road network." },
        { name: "Care Providers (Various)", annual_spend: 180000000, category: "Adult Social Care", description: "Combined spend on residential, nursing and home care provider contracts for adult social care placements and domiciliary care." },
        { name: "Veolia Environmental Services", annual_spend: 28000000, category: "Waste Management", description: "Waste disposal and treatment contract covering household waste collection, recycling centres and energy-from-waste processing." },
      ],

      performance_kpis: [
        { metric: "Household waste recycled or composted", value: "55%", target: "50%", status: "green", period: "2024-25" },
        { metric: "Waste sent to landfill", value: "<1%", target: "<5%", status: "green", period: "2024-25" },
        { metric: "Children's services Ofsted rating", value: "Outstanding", target: "Outstanding", status: "green", period: "2018" },
        { metric: "Road network in good condition", value: "94.5%", target: "90%", status: "green", period: "2024-25" },
        { metric: "Budget savings delivered since 2010", value: "£140m", target: "On track", status: "green", period: "2024-25" },
      ],

      waste_destinations: [
        { type: "Recycled", tonnage: 82000, percentage: 30 },
        { type: "Composted", tonnage: 68000, percentage: 25 },
        { type: "Energy recovery", tonnage: 120000, percentage: 44 },
        { type: "Landfill", tonnage: 2000, percentage: 1 },
        { type: "Other", tonnage: 3000, percentage: 1 },
      ],

      governance_transparency: [
        { label: "Senior officer pay", url: "https://www.eastsussex.gov.uk/your-council/finance/spend/payments-to-suppliers-over-500", description: "Senior staff remuneration and spending transparency" },
        { label: "Councillor allowances", url: "https://democracy.eastsussex.gov.uk/mgMemberIndex.aspx", description: "Members' allowances and expenses register" },
        { label: "Pay policy statement", url: "https://www.eastsussex.gov.uk/your-council/about/key-documents", description: "Annual pay policy for senior officers" },
        { label: "Spending over £500", url: "https://www.eastsussex.gov.uk/your-council/finance/spend/payments-to-suppliers-over-500", description: "Monthly payments to suppliers over £500" },
      ],

      section_transparency: {
        finances: [
          { label: "Statement of Accounts 2023-24", url: "https://www.eastsussex.gov.uk/media/keppjdta/escc-statement-of-accounts-2023-24-final-with-signatures.pdf", description: "Full audited financial statements" },
          { label: "Financial Budget Summary 2025-26", url: "https://www.eastsussex.gov.uk/media/w5tbjytk/financial-budget-summary-2025-26.pdf", description: "Revenue and capital budget breakdown" },
          { label: "Statement of Accounts", url: "https://www.eastsussex.gov.uk/your-council/finance/spend/statement-accounts", description: "Previous years' audited accounts" },
        ],
        outcomes: [
          { label: "Council Plan 2025-26", url: "https://www.eastsussex.gov.uk/your-council/about/key-documents/council-plans/2025-26", description: "Strategic priorities and performance targets" },
          { label: "Budget summary", url: "https://www.eastsussex.gov.uk/your-council/finance/future-spend/summary", description: "How council tax is allocated across services" },
        ],
      },

      open_data_links: [
        {
          theme: "Finance & spending",
          links: [
            { label: "Payments to suppliers", url: "https://www.eastsussex.gov.uk/your-council/finance/spend/payments-to-suppliers-over-500", description: "Monthly spend data over £500" },
            { label: "Budget and council tax", url: "https://www.eastsussex.gov.uk/your-council/finance/future-spend/summary", description: "Council tax breakdown and budget summary" },
          ],
        },
        {
          theme: "Council plans & performance",
          links: [
            { label: "Key documents", url: "https://www.eastsussex.gov.uk/your-council/about/key-documents", description: "Council plans, strategies and key policies" },
            { label: "Council Plan", url: "https://www.eastsussex.gov.uk/your-council/about/key-documents/council-plans/2025-26", description: "Annual council plan with performance targets" },
          ],
        },
        {
          theme: "Freedom of information",
          links: [
            { label: "FOI requests", url: "https://www.eastsussex.gov.uk/your-council/about/access-to-information", description: "Freedom of information and data access requests" },
          ],
        },
      ],

`,

  "Essex": `      chief_executive_salary: 228753,
      councillor_basic_allowance: 14471,
      staff_fte: 6877,
      reserves: 68100000,
      budget_gap: 22000000,

      top_suppliers: [
        { name: "Ringway Jacobs", annual_spend: 85000000, category: "Roads & Transport", description: "Highways maintenance contract covering road repairs, resurfacing, winter maintenance and street lighting across Essex county road network." },
        { name: "Care Providers (Various)", annual_spend: 350000000, category: "Adult Social Care", description: "Combined spend on residential, nursing and home care provider contracts for Essex's adult social care services covering 1.5 million residents." },
        { name: "Essex Waste Partnership", annual_spend: 94000000, category: "Waste Management", description: "Waste disposal and treatment across four contract lots with combined capacity of 337,000 tonnes per annum, ending landfill use by October 2025." },
      ],

      performance_kpis: [
        { metric: "Invoices paid within 30 days", value: "98.97%", target: "95%", status: "green", period: "2024-25" },
        { metric: "Household waste recycled", value: "49.2%", target: "52%", status: "amber", period: "2023-24" },
        { metric: "Budget savings delivered", value: "£40m", target: "£32m", status: "green", period: "2024-25" },
        { metric: "Children's services Ofsted rating", value: "Outstanding", target: "Outstanding", status: "green", period: "2019" },
        { metric: "Total savings since 2008", value: ">£1 billion", target: "On track", status: "green", period: "2024-25" },
      ],

      waste_destinations: [
        { type: "Recycled", tonnage: 195000, percentage: 30 },
        { type: "Composted", tonnage: 125000, percentage: 19 },
        { type: "Energy recovery", tonnage: 330000, percentage: 50 },
        { type: "Landfill", tonnage: 10000, percentage: 1 },
      ],

      governance_transparency: [
        { label: "Senior officer salaries", url: "https://www.essex.gov.uk/about-council/senior-officers", description: "Corporate leadership team biographies and salary data" },
        { label: "Councillor allowances", url: "https://www.essex.gov.uk/about-council/your-councillor/expenses-and-allowances", description: "Members' allowances scheme and monthly expense reports" },
        { label: "Pay policy statement", url: "https://www.essex.gov.uk/about-council/publication-scheme-and-transparency", description: "Annual pay policy and salary band data" },
        { label: "Spending data", url: "https://www.essex.gov.uk/about-council/spending-and-council-tax/finance-and-spending-breakdowns", description: "Quarterly spending over £500 and contract summaries" },
      ],

      section_transparency: {
        finances: [
          { label: "Statement of Accounts 2024-25", url: "https://www.essex.gov.uk/sites/default/files/2025-12/ECC%202024-25%20Statement%20of%20Accounts.pdf", description: "Full audited financial statements" },
          { label: "Finance and spending breakdowns", url: "https://www.essex.gov.uk/about-council/spending-and-council-tax/finance-and-spending-breakdowns", description: "Quarterly spending and contract data" },
          { label: "What council tax pays for", url: "https://www.essex.gov.uk/about-council/spending-and-council-tax/what-council-tax-pays", description: "Service-level spending breakdown" },
          { label: "Auditor's Annual Report", url: "https://www.essex.gov.uk/sites/default/files/2025-12/Auditor%27s%20Annual%20Report%20-%202024-25.pdf", description: "External auditor assessment" },
        ],
        outcomes: [
          { label: "Everyone's Essex", url: "https://www.essex.gov.uk/about-council/plans-and-strategies/our-vision-essex/everyones-essex", description: "Strategic plan with 20 commitments across 4 themes" },
          { label: "Annual Plan", url: "https://www.essex.gov.uk/about-council/plans-and-strategies/our-vision-essex/annual-plan", description: "Annual delivery plan and progress reporting" },
          { label: "Priorities and performance", url: "https://www.essex.gov.uk/publications-transparency/what-our-priorities-are-and-how-were-doing", description: "What our priorities are and how we are doing" },
        ],
      },

      open_data_links: [
        {
          theme: "Open data portal",
          links: [
            { label: "Essex Open Data", url: "https://data.essex.gov.uk/", description: "Central open data portal with all ECC datasets" },
            { label: "Council spending datasets", url: "https://data.essex.gov.uk/dataset/2gxlw/council-spending", description: "Quarterly spending data in machine-readable formats" },
          ],
        },
        {
          theme: "Publication scheme",
          links: [
            { label: "What we spend", url: "https://www.essex.gov.uk/running-council/publication-scheme-and-transparency/what-we-spend-and-how-we-spend-it", description: "Spending, contracts, senior salaries, audit" },
            { label: "How we make decisions", url: "https://www.essex.gov.uk/running-council/publication-scheme-and-transparency/how-we-make-decisions", description: "Decision-making processes and committee papers" },
            { label: "Lists and registers", url: "https://www.essex.gov.uk/running-council/publication-scheme-and-transparency/lists-and-registers", description: "Asset register, contracts register, councillor interests" },
          ],
        },
        {
          theme: "Freedom of information",
          links: [
            { label: "Information requests", url: "https://www.essex.gov.uk/about-council/request-information-about-council", description: "FOI and data requests" },
          ],
        },
        {
          theme: "Equality & workforce",
          links: [
            { label: "Gender pay gap", url: "https://gender-pay-gap.service.gov.uk/employers/4736/reporting-year-2023", description: "Gender pay gap data on national reporting service" },
            { label: "Workforce equality", url: "https://www.essex.gov.uk/about-council/equality-and-diversity/equality-and-diversity-our-employees", description: "Workforce diversity and inclusion data" },
          ],
        },
      ],

`,
};

// Process each council
let enrichedCount = 0;
for (const [name, insertText] of Object.entries(enrichments)) {
  const namePattern = `name: "${name}"`;
  const nameIdx = content.indexOf(namePattern);
  if (nameIdx === -1) {
    console.log(`WARNING: Could not find ${name}`);
    continue;
  }

  // Find the last_verified after this council's name (including leading whitespace)
  const lvPattern = '      last_verified: "2026-02-25"';
  const lvIdx = content.indexOf(lvPattern, nameIdx);
  if (lvIdx === -1) {
    console.log(`WARNING: Could not find last_verified for ${name}`);
    continue;
  }

  // Safety check: make sure we found the right last_verified (within this council's block)
  if (lvIdx - nameIdx > 15000) {
    console.log(`WARNING: last_verified too far from name for ${name}, skipping`);
    continue;
  }

  // Replace: insert enrichment text + update the date (pattern includes leading spaces)
  const replacement = insertText + '      last_verified: "2026-03-04"';
  content = content.substring(0, lvIdx) + replacement + content.substring(lvIdx + lvPattern.length);

  enrichedCount++;
  console.log(`\u2705 Enriched: ${name}`);
}

writeFileSync(filePath, content);
console.log(`\nDone! ${enrichedCount}/5 batch 1 county councils enriched.`);
