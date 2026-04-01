#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'fs';

const filePath = './src/data/councils/london-boroughs.ts';
let content = readFileSync(filePath, 'utf-8');

// Enrichment data for each London borough
const enrichments = {
  "Barking & Dagenham": {
    accounts_url: "https://www.lbbd.gov.uk/council-and-democracy/performance-and-spending/council-accounts-and-budget",
    transparency_url: "https://www.lbbd.gov.uk/council-and-democracy/performance-and-spending",
    sources: [
      { title: "Council Accounts and Budget", url: "https://www.lbbd.gov.uk/council-and-democracy/performance-and-spending/council-accounts-and-budget" },
    ],
  },
  "Barnet": {
    accounts_url: "https://www.barnet.gov.uk/your-council/finance-funding-and-pensions/our-statement-accounts",
    transparency_url: "https://www.barnet.gov.uk/your-council/finance-funding-and-pensions",
    sources: [
      { title: "Statement of Accounts", url: "https://www.barnet.gov.uk/your-council/finance-funding-and-pensions/our-statement-accounts" },
    ],
  },
  "Bexley": {
    accounts_url: "https://www.bexley.gov.uk/about-the-council/budgets-and-spending",
    transparency_url: "https://www.bexley.gov.uk/about-the-council/budgets-and-spending",
    documents: [
      { title: "Statement of Accounts 2023-24", url: "https://www.bexley.gov.uk/sites/default/files/2025-02/final-statement-of-accounts-2023-2024.pdf", type: "accounts", year: "2023-24" },
    ],
    sources: [
      { title: "Budgets and Spending", url: "https://www.bexley.gov.uk/about-the-council/budgets-and-spending" },
    ],
  },
  "Brent": {
    accounts_url: "https://www.brent.gov.uk/the-council-and-democracy/budgets-and-spending/annual-statement-of-accounts",
    transparency_url: "https://www.brent.gov.uk/the-council-and-democracy/budgets-and-spending",
    sources: [
      { title: "Annual Statement of Accounts", url: "https://www.brent.gov.uk/the-council-and-democracy/budgets-and-spending/annual-statement-of-accounts" },
      { title: "Budgets and Spending", url: "https://www.brent.gov.uk/the-council-and-democracy/budgets-and-spending" },
    ],
  },
  "Bromley": {
    accounts_url: "https://www.bromley.gov.uk/finance-funding/statement-accounts",
    transparency_url: "https://www.bromley.gov.uk/finance-funding",
    sources: [
      { title: "Statement of Accounts", url: "https://www.bromley.gov.uk/finance-funding/statement-accounts" },
    ],
  },
  "Camden": {
    accounts_url: "https://www.camden.gov.uk/statement-of-accounts",
    transparency_url: "https://www.camden.gov.uk/finances-and-spending",
    sources: [
      { title: "Statement of Accounts", url: "https://www.camden.gov.uk/statement-of-accounts" },
    ],
  },
  "City of London": {
    accounts_url: "https://www.cityoflondon.gov.uk/about-us/budgets-spending/statements-of-accounts",
    transparency_url: "https://www.cityoflondon.gov.uk/about-us/budgets-spending",
    documents: [
      { title: "Statement of Accounts 2023-24", url: "https://www.cityoflondon.gov.uk/assets/about-us/budget-and-spending/audited-statement-of-accounts-2023-24.pdf", type: "accounts", year: "2023-24" },
      { title: "Draft Statement of Accounts 2024-25", url: "https://www.cityoflondon.gov.uk/assets/about-us/budget-and-spending/draft-statement-of-accounts-2024-25.pdf", type: "accounts", year: "2024-25" },
    ],
    sources: [
      { title: "Statements of Accounts", url: "https://www.cityoflondon.gov.uk/about-us/budgets-spending/statements-of-accounts" },
      { title: "Budgets and Spending", url: "https://www.cityoflondon.gov.uk/about-us/budgets-spending" },
    ],
  },
  "Croydon": {
    accounts_url: "https://www.croydon.gov.uk/council-and-elections/budgets-and-spending/statement-accounts",
    transparency_url: "https://www.croydon.gov.uk/council-and-elections/budgets-and-spending",
    sources: [
      { title: "Budgets and Spending", url: "https://www.croydon.gov.uk/council-and-elections/budgets-and-spending" },
    ],
  },
  "Ealing": {
    accounts_url: "https://www.ealing.gov.uk/info/201041/council_budgets_and_spending/338/statement_of_accounts",
    transparency_url: "https://www.ealing.gov.uk/info/201041/council_budgets_and_spending",
    sources: [
      { title: "Statement of Accounts", url: "https://www.ealing.gov.uk/info/201041/council_budgets_and_spending/338/statement_of_accounts" },
    ],
  },
  "Enfield": {
    accounts_url: "https://www.enfield.gov.uk/services/your-council/what-we-spend-and-how-we-spend-it",
    transparency_url: "https://www.enfield.gov.uk/services/your-council/what-we-spend-and-how-we-spend-it",
    sources: [
      { title: "What We Spend and How We Spend It", url: "https://www.enfield.gov.uk/services/your-council/what-we-spend-and-how-we-spend-it" },
    ],
  },
  "Greenwich": {
    accounts_url: "https://www.royalgreenwich.gov.uk/council-and-elections/spending-performance-and-standards/statement-accounts",
    transparency_url: "https://www.royalgreenwich.gov.uk/council-and-elections/spending-performance-and-standards",
    sources: [
      { title: "Statement of Accounts", url: "https://www.royalgreenwich.gov.uk/council-and-elections/spending-performance-and-standards/statement-accounts" },
    ],
  },
  "Hackney": {
    accounts_url: "https://hackney.gov.uk/accounts/",
    transparency_url: "https://hackney.gov.uk/budget",
    sources: [
      { title: "Council Accounts", url: "https://hackney.gov.uk/accounts/" },
    ],
  },
  "Hammersmith & Fulham": {
    accounts_url: "https://www.lbhf.gov.uk/councillors-and-democracy/about-hammersmith-fulham-council/statement-accounts",
    transparency_url: "https://www.lbhf.gov.uk/councillors-and-democracy/about-hammersmith-fulham-council",
    sources: [
      { title: "Statement of Accounts", url: "https://www.lbhf.gov.uk/councillors-and-democracy/about-hammersmith-fulham-council/statement-accounts" },
    ],
  },
  "Haringey": {
    accounts_url: "https://www.haringey.gov.uk/council-and-elections/budgets-and-spending/statement-accounts",
    transparency_url: "https://www.haringey.gov.uk/council-and-elections/budgets-and-spending",
    sources: [
      { title: "Budgets and Spending", url: "https://www.haringey.gov.uk/council-and-elections/budgets-and-spending" },
    ],
  },
  "Harrow": {
    accounts_url: "https://www.harrow.gov.uk/council/statement-accounts",
    transparency_url: "https://www.harrow.gov.uk/council/finance-spending",
    sources: [
      { title: "Statement of Accounts", url: "https://www.harrow.gov.uk/council/statement-accounts" },
    ],
  },
  "Havering": {
    accounts_url: "https://www.havering.gov.uk/info/20032/council_budgets_and_spending/164/statement_of_accounts",
    transparency_url: "https://www.havering.gov.uk/info/20032/council_budgets_and_spending",
    sources: [
      { title: "Council Budgets and Spending", url: "https://www.havering.gov.uk/info/20032/council_budgets_and_spending" },
    ],
  },
  "Hillingdon": {
    accounts_url: "https://www.hillingdon.gov.uk/statement-of-accounts",
    transparency_url: "https://www.hillingdon.gov.uk/council-spending",
    documents: [
      { title: "Statement of Accounts 2023-24", url: "https://www.hillingdon.gov.uk/media/16116/202324-accounts/pdf/g32023-24.pdf", type: "accounts", year: "2023-24" },
    ],
    sources: [
      { title: "Statement of Accounts", url: "https://www.hillingdon.gov.uk/statement-of-accounts" },
    ],
  },
  "Hounslow": {
    accounts_url: "https://www.hounslow.gov.uk/info/20003/council_tax_and_benefits/1254/statement_of_accounts",
    transparency_url: "https://www.hounslow.gov.uk/info/20003/council_tax_and_benefits",
    sources: [
      { title: "Statement of Accounts", url: "https://www.hounslow.gov.uk/info/20003/council_tax_and_benefits/1254/statement_of_accounts" },
    ],
  },
  "Islington": {
    accounts_url: "https://www.islington.gov.uk/about-the-council/funding-and-spending/statement-of-accounts",
    transparency_url: "https://www.islington.gov.uk/about-the-council/funding-and-spending",
    documents: [
      { title: "Statement of Accounts 2024-25", url: "https://www.islington.gov.uk/-/media/sharepoint-lists/public-records/finance/information/adviceandinformation/20242025/202425-statement-of-accounts.pdf", type: "accounts", year: "2024-25" },
      { title: "Audited Statement of Accounts 2023-24", url: "https://www.islington.gov.uk/-/media/sharepoint-lists/public-records/finance/information/adviceandinformation/20232024/audited-statement-of-accounts-202324--accessible.pdf", type: "accounts", year: "2023-24" },
    ],
    sources: [
      { title: "Statement of Accounts", url: "https://www.islington.gov.uk/about-the-council/funding-and-spending/statement-of-accounts" },
      { title: "Funding and Spending", url: "https://www.islington.gov.uk/about-the-council/funding-and-spending" },
    ],
  },
  "Kensington & Chelsea": {
    accounts_url: "https://www.rbkc.gov.uk/council-councillors-and-democracy/how-council-manages-money/council-spending-and-finances",
    transparency_url: "https://www.rbkc.gov.uk/council-councillors-and-democracy/how-council-manages-money",
    documents: [
      { title: "Statement of Accounts 2023-24", url: "https://www.rbkc.gov.uk/sites/default/files/media/documents/Statement%20of%20Accounts%202023-24%20Audited.pdf", type: "accounts", year: "2023-24" },
    ],
    sources: [
      { title: "Council Spending and Finances", url: "https://www.rbkc.gov.uk/council-councillors-and-democracy/how-council-manages-money/council-spending-and-finances" },
    ],
  },
  "Kingston upon Thames": {
    accounts_url: "https://www.kingston.gov.uk/council-democracy/statement-accounts",
    transparency_url: "https://www.kingston.gov.uk/council-democracy/budgets-spending",
    sources: [
      { title: "Statement of Accounts", url: "https://www.kingston.gov.uk/council-democracy/statement-accounts" },
    ],
  },
  "Lambeth": {
    accounts_url: "https://www.lambeth.gov.uk/council-and-democracy/finance-and-spending/statement-accounts",
    transparency_url: "https://www.lambeth.gov.uk/council-and-democracy/finance-and-spending",
    sources: [
      { title: "Finance and Spending", url: "https://www.lambeth.gov.uk/council-and-democracy/finance-and-spending" },
    ],
  },
  "Lewisham": {
    accounts_url: "https://lewisham.gov.uk/mayorandcouncil/about-the-council/finances",
    transparency_url: "https://lewisham.gov.uk/mayorandcouncil/about-the-council/finances",
    documents: [
      { title: "Statement of Accounts 2024-25", url: "https://lewisham.gov.uk/-/media/mayor-and-council/about-us/finances/audit/statement-of-accounts-24-25.pdf", type: "accounts", year: "2024-25" },
    ],
    sources: [
      { title: "Council Finances", url: "https://lewisham.gov.uk/mayorandcouncil/about-the-council/finances" },
    ],
  },
  "Merton": {
    accounts_url: "https://www.merton.gov.uk/council-and-local-democracy/finance/statement-accounts",
    transparency_url: "https://www.merton.gov.uk/council-and-local-democracy/finance",
    documents: [
      { title: "Audited Statement of Accounts 2024-25", url: "https://www.merton.gov.uk/sites/default/files/2026-02/Audited%20Statement%20of%20Accounts%202024-25.pdf", type: "accounts", year: "2024-25" },
    ],
    sources: [
      { title: "Statement of Accounts", url: "https://www.merton.gov.uk/council-and-local-democracy/finance/statement-accounts" },
    ],
  },
  "Newham": {
    accounts_url: "https://www.newham.gov.uk/council/spend-spend",
    transparency_url: "https://www.newham.gov.uk/council/spend-spend",
    sources: [
      { title: "What We Spend and How We Spend It", url: "https://www.newham.gov.uk/council/spend-spend" },
    ],
  },
  "Redbridge": {
    accounts_url: "https://www.redbridge.gov.uk/about-the-council/budgets-and-spending/statement-of-accounts",
    transparency_url: "https://www.redbridge.gov.uk/about-the-council/budgets-and-spending",
    sources: [
      { title: "Budgets and Spending", url: "https://www.redbridge.gov.uk/about-the-council/budgets-and-spending" },
    ],
  },
  "Richmond upon Thames": {
    accounts_url: "https://www.richmond.gov.uk/council/how_we_work/finance/statement_of_accounts",
    transparency_url: "https://www.richmond.gov.uk/council/how_we_work/finance",
    sources: [
      { title: "Statement of Accounts", url: "https://www.richmond.gov.uk/council/how_we_work/finance/statement_of_accounts" },
    ],
  },
  "Southwark": {
    accounts_url: "https://www.southwark.gov.uk/about-council/how-council-works/budgets-and-spending/statement-accounts",
    transparency_url: "https://www.southwark.gov.uk/about-council/how-council-works/budgets-and-spending",
    documents: [
      { title: "Audited Statement of Accounts 2024-25", url: "https://moderngov.southwark.gov.uk/documents/s129909/Appendix%20A%20-%20Statement%20of%20Accounts%202024-25.pdf", type: "accounts", year: "2024-25" },
    ],
    sources: [
      { title: "Statement of Accounts", url: "https://www.southwark.gov.uk/about-council/how-council-works/budgets-and-spending/statement-accounts" },
      { title: "Budgets and Spending", url: "https://www.southwark.gov.uk/about-council/how-council-works/budgets-and-spending" },
    ],
  },
  "Sutton": {
    accounts_url: "https://www.sutton.gov.uk/council-and-democracy/budgets-and-spending/statement-accounts",
    transparency_url: "https://www.sutton.gov.uk/council-and-democracy/budgets-and-spending",
    documents: [
      { title: "Statement of Accounts 2023-24", url: "https://www.sutton.gov.uk/documents/d/guest/lbs-statement-of-accounts-2023-24-draft-1-", type: "accounts", year: "2023-24" },
    ],
    sources: [
      { title: "Budgets and Spending", url: "https://www.sutton.gov.uk/council-and-democracy/budgets-and-spending" },
    ],
  },
  "Tower Hamlets": {
    accounts_url: "https://www.towerhamlets.gov.uk/council/finance/statement-accounts",
    transparency_url: "https://www.towerhamlets.gov.uk/council/finance",
    sources: [
      { title: "Council Finance", url: "https://www.towerhamlets.gov.uk/council/finance" },
    ],
  },
  "Waltham Forest": {
    accounts_url: "https://www.walthamforest.gov.uk/council-and-elections/budgets-and-spending/statement-accounts",
    transparency_url: "https://www.walthamforest.gov.uk/council-and-elections/budgets-and-spending",
    sources: [
      { title: "Budgets and Spending", url: "https://www.walthamforest.gov.uk/council-and-elections/budgets-and-spending" },
    ],
  },
  "Wandsworth": {
    accounts_url: "https://www.wandsworth.gov.uk/what-we-spend-and-how-spend-it",
    transparency_url: "https://www.wandsworth.gov.uk/what-we-spend-and-how-spend-it",
    sources: [
      { title: "What We Spend and How We Spend It", url: "https://www.wandsworth.gov.uk/what-we-spend-and-how-spend-it" },
    ],
  },
  "Westminster": {
    accounts_url: "https://www.westminster.gov.uk/council-tax-and-benefits/council-tax/statement-accounts",
    transparency_url: "https://www.westminster.gov.uk/council-tax-and-benefits",
    sources: [
      { title: "Statement of Accounts", url: "https://www.westminster.gov.uk/council-tax-and-benefits/council-tax/statement-accounts" },
    ],
  },
};

// Process each borough
for (const [name, data] of Object.entries(enrichments)) {
  // Find the last_verified line for this borough
  const namePattern = `name: "${name}"`;
  const nameIdx = content.indexOf(namePattern);
  if (nameIdx === -1) {
    console.log(`WARNING: Could not find ${name}`);
    continue;
  }

  // Find the last_verified after this name
  const searchStart = nameIdx;
  const lvPattern = 'last_verified: "2025-01-19"';
  const lvIdx = content.indexOf(lvPattern, searchStart);
  if (lvIdx === -1) {
    console.log(`WARNING: Could not find last_verified for ${name}`);
    continue;
  }

  // Build the enrichment text to insert before last_verified
  let insertText = '';

  // Add documents if present
  if (data.documents && data.documents.length > 0) {
    insertText += '      documents: [\n';
    for (const doc of data.documents) {
      insertText += `        { title: "${doc.title}", url: "${doc.url}", type: "${doc.type}", year: "${doc.year}" },\n`;
    }
    insertText += '      ],\n';
  }

  // Add accounts_url and transparency_url
  insertText += `      accounts_url: "${data.accounts_url}",\n`;
  insertText += `      transparency_url: "${data.transparency_url}",\n`;

  // Add sources
  if (data.sources && data.sources.length > 0) {
    insertText += '      sources: [\n';
    for (const src of data.sources) {
      insertText += `        { title: "${src.title}", url: "${src.url}" },\n`;
    }
    insertText += '      ],\n';
  }

  // Replace the last_verified line and insert enrichment before it
  const replacement = insertText + '      last_verified: "2026-02-25"';
  content = content.substring(0, lvIdx) + replacement + content.substring(lvIdx + lvPattern.length);

  console.log(`✅ Enriched: ${name}`);
}

writeFileSync(filePath, content);
console.log('\nDone! All London boroughs enriched.');
