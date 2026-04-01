#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'fs';

const filePath = './src/data/councils/metropolitan.ts';
let content = readFileSync(filePath, 'utf-8');

const enrichments = {
  "Barnsley": {
    accounts_url: "https://www.barnsley.gov.uk/services/our-council/our-performance/statement-of-accounts/",
    transparency_url: "https://www.barnsley.gov.uk/services/our-council/our-performance/",
    sources: [{ title: "Statement of Accounts", url: "https://www.barnsley.gov.uk/services/our-council/our-performance/statement-of-accounts/" }],
  },
  "Birmingham": {
    accounts_url: "https://www.birmingham.gov.uk/info/20016/council_budgets_and_spending/457/statement_of_accounts",
    transparency_url: "https://www.birmingham.gov.uk/info/20016/council_budgets_and_spending",
    sources: [{ title: "Statement of Accounts", url: "https://www.birmingham.gov.uk/info/20016/council_budgets_and_spending/457/statement_of_accounts" }],
  },
  "Bolton": {
    accounts_url: "https://www.bolton.gov.uk/budgets-spending/statement-accounts",
    transparency_url: "https://www.bolton.gov.uk/budgets-spending",
    sources: [{ title: "Budgets and Spending", url: "https://www.bolton.gov.uk/budgets-spending" }],
  },
  "Bradford": {
    accounts_url: "https://www.bradford.gov.uk/your-council/council-budgets-and-spending/statement-of-accounts/",
    transparency_url: "https://www.bradford.gov.uk/your-council/council-budgets-and-spending/",
    sources: [{ title: "Council Budgets and Spending", url: "https://www.bradford.gov.uk/your-council/council-budgets-and-spending/" }],
  },
  "Bury": {
    accounts_url: "https://www.bury.gov.uk/council-and-democracy/budgets-spending/statement-accounts",
    transparency_url: "https://www.bury.gov.uk/council-and-democracy/budgets-spending",
    sources: [{ title: "Budgets and Spending", url: "https://www.bury.gov.uk/council-and-democracy/budgets-spending" }],
  },
  "Calderdale": {
    accounts_url: "https://new.calderdale.gov.uk/council/spending-and-budgets/statement-accounts",
    transparency_url: "https://new.calderdale.gov.uk/council/spending-and-budgets",
    documents: [{ title: "Statement of Accounts 2023-24", url: "https://new.calderdale.gov.uk/sites/default/files/2024-12/Statement-of-Accounts-2023-24.pdf", type: "accounts", year: "2023-24" }],
    sources: [{ title: "Spending and Budgets", url: "https://new.calderdale.gov.uk/council/spending-and-budgets" }],
  },
  "Coventry": {
    accounts_url: "https://www.coventry.gov.uk/budgets-spending/statement-accounts",
    transparency_url: "https://www.coventry.gov.uk/budgets-spending",
    sources: [{ title: "Statement of Accounts", url: "https://www.coventry.gov.uk/budgets-spending/statement-accounts" }],
  },
  "Doncaster": {
    accounts_url: "https://www.doncaster.gov.uk/services/the-council-democracy/statement-of-accounts",
    transparency_url: "https://www.doncaster.gov.uk/services/the-council-democracy/budget-and-finance",
    sources: [{ title: "Statement of Accounts", url: "https://www.doncaster.gov.uk/services/the-council-democracy/statement-of-accounts" }],
  },
  "Dudley": {
    accounts_url: "https://www.dudley.gov.uk/council-community/plan-policies-and-strategies/statement-of-accounts/",
    transparency_url: "https://www.dudley.gov.uk/council-community/plan-policies-and-strategies/",
    sources: [{ title: "Statement of Accounts", url: "https://www.dudley.gov.uk/council-community/plan-policies-and-strategies/statement-of-accounts/" }],
  },
  "Gateshead": {
    accounts_url: "https://www.gateshead.gov.uk/article/3703/Statement-of-accounts",
    transparency_url: "https://www.gateshead.gov.uk/article/3700/Budgets-and-spending",
    sources: [{ title: "Budgets and Spending", url: "https://www.gateshead.gov.uk/article/3700/Budgets-and-spending" }],
  },
  "Kirklees": {
    accounts_url: "https://www.kirklees.gov.uk/beta/delivering-services/statement-of-accounts.aspx",
    transparency_url: "https://www.kirklees.gov.uk/beta/delivering-services/council-spending.aspx",
    sources: [{ title: "Statement of Accounts", url: "https://www.kirklees.gov.uk/beta/delivering-services/statement-of-accounts.aspx" }],
  },
  "Knowsley": {
    accounts_url: "https://www.knowsley.gov.uk/council-and-elections/accounts-budgets-and-spending/statement-accounts",
    transparency_url: "https://www.knowsley.gov.uk/council-and-elections/accounts-budgets-and-spending",
    sources: [{ title: "Accounts, Budgets and Spending", url: "https://www.knowsley.gov.uk/council-and-elections/accounts-budgets-and-spending" }],
  },
  "Leeds": {
    accounts_url: "https://www.leeds.gov.uk/performance-and-spending/our-financial-performance",
    transparency_url: "https://www.leeds.gov.uk/performance-and-spending",
    sources: [{ title: "Our Financial Performance", url: "https://www.leeds.gov.uk/performance-and-spending/our-financial-performance" }],
  },
  "Liverpool": {
    accounts_url: "https://liverpool.gov.uk/council/spending-and-performance/statement-of-accounts/",
    transparency_url: "https://liverpool.gov.uk/council/spending-and-performance/",
    sources: [{ title: "Statement of Accounts", url: "https://liverpool.gov.uk/council/spending-and-performance/statement-of-accounts/" }],
  },
  "Manchester": {
    accounts_url: "https://www.manchester.gov.uk/info/200110/budgets_and_spending/864/annual_statement_of_accounts",
    transparency_url: "https://www.manchester.gov.uk/info/200110/budgets_and_spending",
    sources: [{ title: "Annual Statement of Accounts", url: "https://www.manchester.gov.uk/info/200110/budgets_and_spending/864/annual_statement_of_accounts" }],
  },
  "Newcastle upon Tyne": {
    accounts_url: "https://www.newcastle.gov.uk/local-government/budget-and-spending/annual-report-and-accounts",
    transparency_url: "https://www.newcastle.gov.uk/local-government/budget-and-spending",
    sources: [{ title: "Annual Report and Accounts", url: "https://www.newcastle.gov.uk/local-government/budget-and-spending/annual-report-and-accounts" }],
  },
  "North Tyneside": {
    accounts_url: "https://www.northtyneside.gov.uk/section/budget-and-spending",
    transparency_url: "https://www.northtyneside.gov.uk/section/budget-and-spending",
    sources: [{ title: "Budget and Spending", url: "https://www.northtyneside.gov.uk/section/budget-and-spending" }],
  },
  "Oldham": {
    accounts_url: "https://www.oldham.gov.uk/info/200590/budgets_and_spending/1125/statement_of_accounts",
    transparency_url: "https://www.oldham.gov.uk/info/200590/budgets_and_spending",
    sources: [{ title: "Budgets and Spending", url: "https://www.oldham.gov.uk/info/200590/budgets_and_spending" }],
  },
  "Rochdale": {
    accounts_url: "https://www.rochdale.gov.uk/budgets-spending/annual-statement-accounts",
    transparency_url: "https://www.rochdale.gov.uk/budgets-spending",
    sources: [{ title: "Annual Statement of Accounts", url: "https://www.rochdale.gov.uk/budgets-spending/annual-statement-accounts" }],
  },
  "Rotherham": {
    accounts_url: "https://www.rotherham.gov.uk/council/statement-accounts",
    transparency_url: "https://www.rotherham.gov.uk/council/budgets-spending",
    sources: [{ title: "Statement of Accounts", url: "https://www.rotherham.gov.uk/council/statement-accounts" }],
  },
  "Salford": {
    accounts_url: "https://www.salford.gov.uk/your-council/finance/statement-of-accounts/",
    transparency_url: "https://www.salford.gov.uk/your-council/finance/",
    sources: [{ title: "Statement of Accounts", url: "https://www.salford.gov.uk/your-council/finance/statement-of-accounts/" }],
  },
  "Sandwell": {
    accounts_url: "https://www.sandwell.gov.uk/council/statement-accounts",
    transparency_url: "https://www.sandwell.gov.uk/council/budgets-spending",
    sources: [{ title: "Budgets and Spending", url: "https://www.sandwell.gov.uk/council/budgets-spending" }],
  },
  "Sefton": {
    accounts_url: "https://www.sefton.gov.uk/your-council/council-budgets-and-spending/statement-of-accounts/",
    transparency_url: "https://www.sefton.gov.uk/your-council/council-budgets-and-spending/",
    sources: [{ title: "Council Budgets and Spending", url: "https://www.sefton.gov.uk/your-council/council-budgets-and-spending/" }],
  },
  "Sheffield": {
    accounts_url: "https://www.sheffield.gov.uk/your-city-council/statement-accounts",
    transparency_url: "https://www.sheffield.gov.uk/your-city-council/budget-spending",
    sources: [{ title: "Statement of Accounts", url: "https://www.sheffield.gov.uk/your-city-council/statement-accounts" }],
  },
  "Solihull": {
    accounts_url: "https://www.solihull.gov.uk/About-the-Council/Finance-and-spending/Statement-of-accounts",
    transparency_url: "https://www.solihull.gov.uk/About-the-Council/Finance-and-spending",
    documents: [{ title: "Draft Statement of Accounts 2024-25", url: "https://www.solihull.gov.uk/sites/default/files/2025-06/DRAFT-Statement-Accounts-24-25.pdf", type: "accounts", year: "2024-25" }],
    sources: [{ title: "Finance and Spending", url: "https://www.solihull.gov.uk/About-the-Council/Finance-and-spending" }],
  },
  "South Tyneside": {
    accounts_url: "https://www.southtyneside.gov.uk/article/33826/Statement-of-accounts",
    transparency_url: "https://www.southtyneside.gov.uk/article/33823/Budgets-and-spending",
    sources: [{ title: "Budgets and Spending", url: "https://www.southtyneside.gov.uk/article/33823/Budgets-and-spending" }],
  },
  "St Helens": {
    accounts_url: "https://www.sthelens.gov.uk/council-and-democracy/budgets-spending/statement-accounts",
    transparency_url: "https://www.sthelens.gov.uk/council-and-democracy/budgets-spending",
    sources: [{ title: "Budgets and Spending", url: "https://www.sthelens.gov.uk/council-and-democracy/budgets-spending" }],
  },
  "Stockport": {
    accounts_url: "https://www.stockport.gov.uk/budgets-and-financial-monitoring/statement-of-accounts",
    transparency_url: "https://www.stockport.gov.uk/budgets-and-financial-monitoring",
    sources: [{ title: "Statement of Accounts", url: "https://www.stockport.gov.uk/budgets-and-financial-monitoring/statement-of-accounts" }],
  },
  "Sunderland": {
    accounts_url: "https://www.sunderland.gov.uk/statement-of-accounts",
    transparency_url: "https://www.sunderland.gov.uk/budgets-spending",
    sources: [{ title: "Statement of Accounts", url: "https://www.sunderland.gov.uk/statement-of-accounts" }],
  },
  "Tameside": {
    accounts_url: "https://www.tameside.gov.uk/finance/statement-of-accounts",
    transparency_url: "https://www.tameside.gov.uk/finance",
    sources: [{ title: "Council Finance", url: "https://www.tameside.gov.uk/finance" }],
  },
  "Trafford": {
    accounts_url: "https://www.trafford.gov.uk/about-your-council/budgets-and-accounts/statement-of-accounts.aspx",
    transparency_url: "https://www.trafford.gov.uk/about-your-council/budgets-and-accounts/",
    sources: [{ title: "Budgets and Accounts", url: "https://www.trafford.gov.uk/about-your-council/budgets-and-accounts/" }],
  },
  "Wakefield": {
    accounts_url: "https://www.wakefield.gov.uk/about-the-council/budget-and-spending/statement-of-accounts/",
    transparency_url: "https://www.wakefield.gov.uk/about-the-council/budget-and-spending/",
    sources: [{ title: "Budget and Spending", url: "https://www.wakefield.gov.uk/about-the-council/budget-and-spending/" }],
  },
  "Walsall": {
    accounts_url: "https://go.walsall.gov.uk/your-council/finance-and-spending/statement-of-accounts",
    transparency_url: "https://go.walsall.gov.uk/your-council/finance-and-spending",
    sources: [{ title: "Finance and Spending", url: "https://go.walsall.gov.uk/your-council/finance-and-spending" }],
  },
  "Wigan": {
    accounts_url: "https://www.wigan.gov.uk/Council/Performance-and-Spending/Statement-of-Accounts/Statement-of-accounts.aspx",
    transparency_url: "https://www.wigan.gov.uk/Council/Performance-and-Spending/",
    documents: [{ title: "Statement of Accounts 2023-24", url: "https://www.wigan.gov.uk/Docs/PDF/Council/Performance-and-Spending/Statement-of-Accounts-23-24/Statement-of-Accounts-23-24.pdf", type: "accounts", year: "2023-24" }],
    sources: [{ title: "Statement of Accounts", url: "https://www.wigan.gov.uk/Council/Performance-and-Spending/Statement-of-Accounts/Statement-of-accounts.aspx" }],
  },
  "Wirral": {
    accounts_url: "https://www.wirral.gov.uk/about-council/budget-and-spending/annual-accounts",
    transparency_url: "https://www.wirral.gov.uk/about-council/budget-and-spending",
    sources: [{ title: "Annual Accounts", url: "https://www.wirral.gov.uk/about-council/budget-and-spending/annual-accounts" }],
  },
  "Wolverhampton": {
    accounts_url: "https://www.wolverhampton.gov.uk/your-council/corporate-finance/statement-accounts",
    transparency_url: "https://www.wolverhampton.gov.uk/your-council/corporate-finance",
    documents: [
      { title: "Statement of Accounts 2024-25", url: "https://www.wolverhampton.gov.uk/sites/default/files/2026-01/SoA%202024-25%20FINAL%20for%20publication%20Update.pdf", type: "accounts", year: "2024-25" },
      { title: "Statement of Accounts 2023-24", url: "https://www.wolverhampton.gov.uk/sites/default/files/2025-01/SoA%202023-24%20-FINAL%20Post%20Audit%20committee%20-%20for%20Publication%20v2.pdf", type: "accounts", year: "2023-24" },
    ],
    sources: [{ title: "Statement of Accounts", url: "https://www.wolverhampton.gov.uk/your-council/corporate-finance/statement-accounts" }],
  },
};

for (const [name, data] of Object.entries(enrichments)) {
  const namePattern = `name: "${name}"`;
  const nameIdx = content.indexOf(namePattern);
  if (nameIdx === -1) { console.log(`WARNING: Could not find ${name}`); continue; }

  const lvPattern = 'last_verified: "2025-01-19"';
  const lvIdx = content.indexOf(lvPattern, nameIdx);
  if (lvIdx === -1) { console.log(`WARNING: Could not find last_verified for ${name}`); continue; }

  let insertText = '';
  if (data.documents?.length) {
    insertText += '      documents: [\n';
    for (const doc of data.documents) {
      insertText += `        { title: "${doc.title}", url: "${doc.url}", type: "${doc.type}", year: "${doc.year}" },\n`;
    }
    insertText += '      ],\n';
  }
  insertText += `      accounts_url: "${data.accounts_url}",\n`;
  insertText += `      transparency_url: "${data.transparency_url}",\n`;
  if (data.sources?.length) {
    insertText += '      sources: [\n';
    for (const src of data.sources) {
      insertText += `        { title: "${src.title}", url: "${src.url}" },\n`;
    }
    insertText += '      ],\n';
  }

  const replacement = insertText + '      last_verified: "2026-02-25"';
  content = content.substring(0, lvIdx) + replacement + content.substring(lvIdx + lvPattern.length);
  console.log(`✅ Enriched: ${name}`);
}

writeFileSync(filePath, content);
console.log('\nDone! All metropolitan districts enriched.');
