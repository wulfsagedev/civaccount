#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'fs';

const filePath = './src/data/councils/unitary.ts';
let content = readFileSync(filePath, 'utf-8');

// Helper to construct enrichment entries
const e = (accounts_url, transparency_url, sources, documents) => ({
  accounts_url, transparency_url, sources, documents
});

const s = (title, url) => ({ title, url });
const d = (title, url, type, year) => ({ title, url, type, year });

const enrichments = {
  "Bath & North East Somerset": e(
    "https://www.bathnes.gov.uk/council-and-democracy/council-budgets-spending/statement-accounts",
    "https://www.bathnes.gov.uk/council-and-democracy/council-budgets-spending",
    [s("Statement of Accounts", "https://www.bathnes.gov.uk/council-and-democracy/council-budgets-spending/statement-accounts")],
    [d("Statement of Accounts 2023-24", "https://www.bathnes.gov.uk/sites/default/files/2023-24%20Statement%20of%20Accounts.pdf", "accounts", "2023-24")]
  ),
  "Bedford": e(
    "https://www.bedford.gov.uk/your-council/about-council/council-budgets-and-spending/statement-accounts",
    "https://www.bedford.gov.uk/your-council/about-council/council-budgets-and-spending",
    [s("Statement of Accounts", "https://www.bedford.gov.uk/your-council/about-council/council-budgets-and-spending/statement-accounts")]
  ),
  "Blackburn with Darwen": e(
    "https://www.blackburn.gov.uk/financial/accounts-and-expenditure/statement-accounts",
    "https://www.blackburn.gov.uk/financial/accounts-and-expenditure",
    [s("Statement of Accounts", "https://www.blackburn.gov.uk/financial/accounts-and-expenditure/statement-accounts")]
  ),
  "Blackpool": e(
    "https://www.blackpool.gov.uk/Your-Council/Transparency-and-open-data/Budget,-spending-and-procurement/Annual-accounts.aspx",
    "https://www.blackpool.gov.uk/Your-Council/Transparency-and-open-data/Budget,-spending-and-procurement/",
    [s("Annual Accounts", "https://www.blackpool.gov.uk/Your-Council/Transparency-and-open-data/Budget,-spending-and-procurement/Annual-accounts.aspx")]
  ),
  "Bournemouth, Christchurch & Poole": e(
    "https://www.bcpcouncil.gov.uk/about-bcp-council/budgets-and-finance/statement-of-accounts",
    "https://www.bcpcouncil.gov.uk/about-bcp-council/budgets-and-finance",
    [s("Budgets and Finance", "https://www.bcpcouncil.gov.uk/about-bcp-council/budgets-and-finance")]
  ),
  "Bracknell Forest": e(
    "https://www.bracknell-forest.gov.uk/council-and-democracy/budgets-and-spending/statement-accounts",
    "https://www.bracknell-forest.gov.uk/council-and-democracy/budgets-and-spending",
    [s("Budgets and Spending", "https://www.bracknell-forest.gov.uk/council-and-democracy/budgets-and-spending")]
  ),
  "Brighton & Hove": e(
    "https://www.brighton-hove.gov.uk/council-and-democracy/council-data-and-finance/statement-accounts",
    "https://www.brighton-hove.gov.uk/council-and-democracy/council-data-and-finance",
    [s("Statement of Accounts", "https://www.brighton-hove.gov.uk/council-and-democracy/council-data-and-finance/statement-accounts")]
  ),
  "Bristol": e(
    "https://www.bristol.gov.uk/council-and-mayor/council-spending-and-performance/statement-of-accounts",
    "https://www.bristol.gov.uk/council-and-mayor/council-spending-and-performance",
    [s("Council Spending and Performance", "https://www.bristol.gov.uk/council-and-mayor/council-spending-and-performance")]
  ),
  "Buckinghamshire": e(
    "https://www.buckinghamshire.gov.uk/your-council/spending-contracts-and-transparency/statement-of-accounts/",
    "https://www.buckinghamshire.gov.uk/your-council/spending-contracts-and-transparency/",
    [s("Statement of Accounts", "https://www.buckinghamshire.gov.uk/your-council/spending-contracts-and-transparency/statement-of-accounts/")]
  ),
  "Central Bedfordshire": e(
    "https://www.centralbedfordshire.gov.uk/info/27/about_your_council/178/annual_accounts_fees_and_charges_budget_statements_and_budget_books",
    "https://www.centralbedfordshire.gov.uk/info/27/about_your_council",
    [s("Annual Accounts and Budget", "https://www.centralbedfordshire.gov.uk/info/27/about_your_council/178/annual_accounts_fees_and_charges_budget_statements_and_budget_books")]
  ),
  "Cheshire East": e(
    "https://www.cheshireeast.gov.uk/council_and_democracy/council_information/finance-and-budget/statement-of-accounts.aspx",
    "https://www.cheshireeast.gov.uk/council_and_democracy/council_information/finance-and-budget/",
    [s("Finance and Budget", "https://www.cheshireeast.gov.uk/council_and_democracy/council_information/finance-and-budget/")]
  ),
  "Cheshire West & Chester": e(
    "https://www.cheshirewestandchester.gov.uk/your-council/spending-and-performance/statement-of-accounts",
    "https://www.cheshirewestandchester.gov.uk/your-council/spending-and-performance",
    [s("Spending and Performance", "https://www.cheshirewestandchester.gov.uk/your-council/spending-and-performance")]
  ),
  "Cornwall": e(
    "https://www.cornwall.gov.uk/the-council-and-democracy/council-spending-and-finance/statement-of-accounts/",
    "https://www.cornwall.gov.uk/the-council-and-democracy/council-spending-and-finance/",
    [s("Statement of Accounts", "https://www.cornwall.gov.uk/the-council-and-democracy/council-spending-and-finance/statement-of-accounts/")]
  ),
  "Cumberland": e(
    "https://www.cumberland.gov.uk/your-council/budgets-spending/statement-accounts",
    "https://www.cumberland.gov.uk/your-council/budgets-spending",
    [s("Budgets and Spending", "https://www.cumberland.gov.uk/your-council/budgets-spending")]
  ),
  "Darlington": e(
    "https://www.darlington.gov.uk/your-council/budgets-and-spending/statement-of-accounts/",
    "https://www.darlington.gov.uk/your-council/budgets-and-spending/",
    [s("Budgets and Spending", "https://www.darlington.gov.uk/your-council/budgets-and-spending/")]
  ),
  "Derby": e(
    "https://www.derby.gov.uk/council-and-democracy/budgets-and-spending/statement-of-accounts/",
    "https://www.derby.gov.uk/council-and-democracy/budgets-and-spending/",
    [s("Budgets and Spending", "https://www.derby.gov.uk/council-and-democracy/budgets-and-spending/")]
  ),
  "Dorset UA": e(
    "https://www.dorsetcouncil.gov.uk/your-council/about-your-council/budgets-and-finance/statement-of-accounts",
    "https://www.dorsetcouncil.gov.uk/your-council/about-your-council/budgets-and-finance",
    [s("Budgets and Finance", "https://www.dorsetcouncil.gov.uk/your-council/about-your-council/budgets-and-finance")]
  ),
  "Durham": e(
    "https://www.durham.gov.uk/article/2458/Statement-of-accounts",
    "https://www.durham.gov.uk/article/2456/Budgets-spending-and-performance",
    [s("Budgets, Spending and Performance", "https://www.durham.gov.uk/article/2456/Budgets-spending-and-performance")]
  ),
  "East Riding of Yorkshire": e(
    "https://www.eastriding.gov.uk/council/finance-and-spending/statement-of-accounts/",
    "https://www.eastriding.gov.uk/council/finance-and-spending/",
    [s("Finance and Spending", "https://www.eastriding.gov.uk/council/finance-and-spending/")]
  ),
  "Halton": e(
    "https://www.halton.gov.uk/council-and-democracy/finance-spending/statement-of-accounts",
    "https://www.halton.gov.uk/council-and-democracy/finance-spending",
    [s("Finance and Spending", "https://www.halton.gov.uk/council-and-democracy/finance-spending")]
  ),
  "Hartlepool": e(
    "https://www.hartlepool.gov.uk/info/20004/council_and_democracy/351/statement_of_accounts",
    "https://www.hartlepool.gov.uk/info/20004/council_and_democracy",
    [s("Statement of Accounts", "https://www.hartlepool.gov.uk/info/20004/council_and_democracy/351/statement_of_accounts")]
  ),
  "Herefordshire": e(
    "https://www.herefordshire.gov.uk/council/statement-accounts",
    "https://www.herefordshire.gov.uk/council/budgets-spending",
    [s("Budgets and Spending", "https://www.herefordshire.gov.uk/council/budgets-spending")]
  ),
  "Isle of Wight": e(
    "https://www.iow.gov.uk/council/spending-and-performance/statement-of-accounts/",
    "https://www.iow.gov.uk/council/spending-and-performance/",
    [s("Spending and Performance", "https://www.iow.gov.uk/council/spending-and-performance/")]
  ),
  "Isles of Scilly": e(
    "https://www.scilly.gov.uk/council/spending-and-finance/statement-of-accounts",
    "https://www.scilly.gov.uk/council/spending-and-finance",
    [s("Spending and Finance", "https://www.scilly.gov.uk/council/spending-and-finance")]
  ),
  "Kingston upon Hull": e(
    "https://www.hull.gov.uk/council-and-democracy/finance-and-spending/statement-of-accounts",
    "https://www.hull.gov.uk/council-and-democracy/finance-and-spending",
    [s("Finance and Spending", "https://www.hull.gov.uk/council-and-democracy/finance-and-spending")]
  ),
  "Leicester": e(
    "https://www.leicester.gov.uk/your-council/council-spending/statement-of-accounts/",
    "https://www.leicester.gov.uk/your-council/council-spending/",
    [s("Council Spending", "https://www.leicester.gov.uk/your-council/council-spending/")]
  ),
  "Luton": e(
    "https://www.luton.gov.uk/Council_government_and_democracy/finance/Pages/Statement-of-accounts.aspx",
    "https://www.luton.gov.uk/Council_government_and_democracy/finance/",
    [s("Council Finance", "https://www.luton.gov.uk/Council_government_and_democracy/finance/")]
  ),
  "Medway Towns": e(
    "https://www.medway.gov.uk/info/200207/about_the_council/383/statement_of_accounts",
    "https://www.medway.gov.uk/info/200207/about_the_council",
    [s("Statement of Accounts", "https://www.medway.gov.uk/info/200207/about_the_council/383/statement_of_accounts")]
  ),
  "Middlesbrough": e(
    "https://www.middlesbrough.gov.uk/council-and-democracy/finance-and-spending/statement-of-accounts",
    "https://www.middlesbrough.gov.uk/council-and-democracy/finance-and-spending",
    [s("Finance and Spending", "https://www.middlesbrough.gov.uk/council-and-democracy/finance-and-spending")]
  ),
  "Milton Keynes": e(
    "https://www.milton-keynes.gov.uk/your-council-and-elections/budgets-spending-and-performance/statement-accounts",
    "https://www.milton-keynes.gov.uk/your-council-and-elections/budgets-spending-and-performance",
    [s("Budgets, Spending and Performance", "https://www.milton-keynes.gov.uk/your-council-and-elections/budgets-spending-and-performance")]
  ),
  "North East Lincolnshire": e(
    "https://www.nelincs.gov.uk/council/finance-and-spending/statement-of-accounts/",
    "https://www.nelincs.gov.uk/council/finance-and-spending/",
    [s("Finance and Spending", "https://www.nelincs.gov.uk/council/finance-and-spending/")]
  ),
  "North Lincolnshire": e(
    "https://www.northlincs.gov.uk/your-council/budgets-and-spending/statement-of-accounts/",
    "https://www.northlincs.gov.uk/your-council/budgets-and-spending/",
    [s("Budgets and Spending", "https://www.northlincs.gov.uk/your-council/budgets-and-spending/")]
  ),
  "North Northamptonshire": e(
    "https://www.northnorthants.gov.uk/finance-and-budgets/statement-of-accounts",
    "https://www.northnorthants.gov.uk/finance-and-budgets",
    [s("Finance and Budgets", "https://www.northnorthants.gov.uk/finance-and-budgets")]
  ),
  "North Somerset": e(
    "https://www.n-somerset.gov.uk/council-democracy/spending-budget/statement-accounts",
    "https://www.n-somerset.gov.uk/council-democracy/spending-budget",
    [s("Spending and Budget", "https://www.n-somerset.gov.uk/council-democracy/spending-budget")]
  ),
  "North Yorkshire": e(
    "https://www.northyorks.gov.uk/your-council/budgets-and-spending/statement-of-accounts",
    "https://www.northyorks.gov.uk/your-council/budgets-and-spending",
    [s("Budgets and Spending", "https://www.northyorks.gov.uk/your-council/budgets-and-spending")]
  ),
  "Northumberland": e(
    "https://www.northumberland.gov.uk/About/Budgets/Statement-of-Accounts.aspx",
    "https://www.northumberland.gov.uk/About/Budgets.aspx",
    [s("Budgets", "https://www.northumberland.gov.uk/About/Budgets.aspx")]
  ),
  "Nottingham": e(
    "https://www.nottinghamcity.gov.uk/your-council/about-the-council/statement-of-accounts-and-reports/",
    "https://www.nottinghamcity.gov.uk/your-council/about-the-council/budgets-and-spending/",
    [s("Statement of Accounts and Reports", "https://www.nottinghamcity.gov.uk/your-council/about-the-council/statement-of-accounts-and-reports/")]
  ),
  "Peterborough": e(
    "https://www.peterborough.gov.uk/council/budgets-spending/statement-accounts",
    "https://www.peterborough.gov.uk/council/budgets-spending",
    [s("Budgets and Spending", "https://www.peterborough.gov.uk/council/budgets-spending")]
  ),
  "Plymouth": e(
    "https://www.plymouth.gov.uk/council-and-democracy/budgets-and-spending/statement-of-accounts",
    "https://www.plymouth.gov.uk/council-and-democracy/budgets-and-spending",
    [s("Budgets and Spending", "https://www.plymouth.gov.uk/council-and-democracy/budgets-and-spending")]
  ),
  "Portsmouth": e(
    "https://www.portsmouth.gov.uk/services/council-and-democracy/transparency/statement-of-accounts/",
    "https://www.portsmouth.gov.uk/services/council-and-democracy/transparency/",
    [s("Transparency", "https://www.portsmouth.gov.uk/services/council-and-democracy/transparency/")]
  ),
  "Reading": e(
    "https://www.reading.gov.uk/council-and-democracy/finance-and-spending/statement-of-accounts/",
    "https://www.reading.gov.uk/council-and-democracy/finance-and-spending/",
    [s("Finance and Spending", "https://www.reading.gov.uk/council-and-democracy/finance-and-spending/")]
  ),
  "Redcar & Cleveland": e(
    "https://www.redcar-cleveland.gov.uk/council-and-democracy/budgets-and-spending/statement-of-accounts",
    "https://www.redcar-cleveland.gov.uk/council-and-democracy/budgets-and-spending",
    [s("Budgets and Spending", "https://www.redcar-cleveland.gov.uk/council-and-democracy/budgets-and-spending")]
  ),
  "Rutland": e(
    "https://www.rutland.gov.uk/council-and-democracy/budgets-and-spending/statement-of-accounts",
    "https://www.rutland.gov.uk/council-and-democracy/budgets-and-spending",
    [s("Budgets and Spending", "https://www.rutland.gov.uk/council-and-democracy/budgets-and-spending")]
  ),
  "Shropshire": e(
    "https://www.shropshire.gov.uk/council-and-democracy/finance-and-spending/statement-of-accounts/",
    "https://www.shropshire.gov.uk/council-and-democracy/finance-and-spending/",
    [s("Finance and Spending", "https://www.shropshire.gov.uk/council-and-democracy/finance-and-spending/")]
  ),
  "Slough": e(
    "https://www.slough.gov.uk/council-democracy/statement-accounts",
    "https://www.slough.gov.uk/council-democracy/budgets-spending",
    [s("Budgets and Spending", "https://www.slough.gov.uk/council-democracy/budgets-spending")]
  ),
  "Somerset": e(
    "https://www.somerset.gov.uk/council-and-democracy/budgets-and-spending/statement-of-accounts/",
    "https://www.somerset.gov.uk/council-and-democracy/budgets-and-spending/",
    [s("Budgets and Spending", "https://www.somerset.gov.uk/council-and-democracy/budgets-and-spending/")]
  ),
  "South Gloucestershire": e(
    "https://www.southglos.gov.uk/council-and-democracy/budgets-and-spending/statement-of-accounts/",
    "https://www.southglos.gov.uk/council-and-democracy/budgets-and-spending/",
    [s("Budgets and Spending", "https://www.southglos.gov.uk/council-and-democracy/budgets-and-spending/")]
  ),
  "Southampton": e(
    "https://www.southampton.gov.uk/council-democracy/council-finance/statement-accounts/",
    "https://www.southampton.gov.uk/council-democracy/council-finance/",
    [s("Council Finance", "https://www.southampton.gov.uk/council-democracy/council-finance/")]
  ),
  "Southend-on-Sea": e(
    "https://www.southend.gov.uk/council/statement-accounts",
    "https://www.southend.gov.uk/council/budgets-spending",
    [s("Budgets and Spending", "https://www.southend.gov.uk/council/budgets-spending")]
  ),
  "Stockton-on-Tees": e(
    "https://www.stockton.gov.uk/finance-and-spending/statement-of-accounts",
    "https://www.stockton.gov.uk/finance-and-spending",
    [s("Finance and Spending", "https://www.stockton.gov.uk/finance-and-spending")]
  ),
  "Stoke-on-Trent": e(
    "https://www.stoke.gov.uk/info/20017/budgets_spending_and_performance/282/statement_of_accounts",
    "https://www.stoke.gov.uk/info/20017/budgets_spending_and_performance",
    [s("Budgets, Spending and Performance", "https://www.stoke.gov.uk/info/20017/budgets_spending_and_performance")]
  ),
  "Swindon": e(
    "https://www.swindon.gov.uk/info/20047/council_finances_and_spending/381/statement_of_accounts",
    "https://www.swindon.gov.uk/info/20047/council_finances_and_spending",
    [s("Council Finances and Spending", "https://www.swindon.gov.uk/info/20047/council_finances_and_spending")]
  ),
  "Telford & Wrekin": e(
    "https://www.telford.gov.uk/info/20170/council_budgets_spending_and_performance/264/statement_of_accounts",
    "https://www.telford.gov.uk/info/20170/council_budgets_spending_and_performance",
    [s("Council Budgets, Spending and Performance", "https://www.telford.gov.uk/info/20170/council_budgets_spending_and_performance")]
  ),
  "Thurrock": e(
    "https://www.thurrock.gov.uk/council-finance/statement-of-accounts",
    "https://www.thurrock.gov.uk/council-finance",
    [s("Council Finance", "https://www.thurrock.gov.uk/council-finance")]
  ),
  "Torbay": e(
    "https://www.torbay.gov.uk/council/finance-and-spending/statement-of-accounts/",
    "https://www.torbay.gov.uk/council/finance-and-spending/",
    [s("Finance and Spending", "https://www.torbay.gov.uk/council/finance-and-spending/")]
  ),
  "Warrington": e(
    "https://www.warrington.gov.uk/council-spending/statement-of-accounts",
    "https://www.warrington.gov.uk/council-spending",
    [s("Council Spending", "https://www.warrington.gov.uk/council-spending")]
  ),
  "West Berkshire": e(
    "https://www.westberks.gov.uk/statement-of-accounts",
    "https://www.westberks.gov.uk/budgets-and-spending",
    [s("Budgets and Spending", "https://www.westberks.gov.uk/budgets-and-spending")]
  ),
  "West Northamptonshire": e(
    "https://www.westnorthants.gov.uk/finance-and-budgets/statement-of-accounts",
    "https://www.westnorthants.gov.uk/finance-and-budgets",
    [s("Finance and Budgets", "https://www.westnorthants.gov.uk/finance-and-budgets")]
  ),
  "Westmorland and Furness": e(
    "https://www.westmorlandandfurness.gov.uk/your-council/budgets-and-spending/statement-of-accounts",
    "https://www.westmorlandandfurness.gov.uk/your-council/budgets-and-spending",
    [s("Budgets and Spending", "https://www.westmorlandandfurness.gov.uk/your-council/budgets-and-spending")]
  ),
  "Wiltshire": e(
    "https://www.wiltshire.gov.uk/council-democracy-budgets-spending-statement-of-accounts",
    "https://www.wiltshire.gov.uk/council-democracy-budgets-spending",
    [s("Budgets and Spending", "https://www.wiltshire.gov.uk/council-democracy-budgets-spending")]
  ),
  "Windsor & Maidenhead": e(
    "https://www.rbwm.gov.uk/home/council-and-democracy/budgets-and-spending/statement-of-accounts",
    "https://www.rbwm.gov.uk/home/council-and-democracy/budgets-and-spending",
    [s("Budgets and Spending", "https://www.rbwm.gov.uk/home/council-and-democracy/budgets-and-spending")]
  ),
  "Wokingham": e(
    "https://www.wokingham.gov.uk/council-and-democracy/budgets-and-spending/statement-of-accounts",
    "https://www.wokingham.gov.uk/council-and-democracy/budgets-and-spending",
    [s("Budgets and Spending", "https://www.wokingham.gov.uk/council-and-democracy/budgets-and-spending")]
  ),
  "York": e(
    "https://www.york.gov.uk/StatementOfAccounts",
    "https://www.york.gov.uk/BudgetsAndSpending",
    [s("Budgets and Spending", "https://www.york.gov.uk/BudgetsAndSpending")]
  ),
};

let count = 0;
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
  count++;
}

writeFileSync(filePath, content);
console.log(`\nDone! ${count}/63 unitary authorities enriched.`);
