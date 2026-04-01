#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'fs';

const filePath = './src/data/councils/unitary.ts';
let content = readFileSync(filePath, 'utf-8');

// First, let's strip all incorrectly applied enrichment by looking for accounts_url/transparency_url/sources
// that appear BETWEEN a website: line and the next closing },  } block

// Strategy: For each council, find the block between name: and the closing },\n  },
// and ensure it has the CORRECT enrichment

const councils = [
  "Bath & North East Somerset", "Bedford", "Blackburn with Darwen", "Blackpool",
  "Bournemouth, Christchurch & Poole", "Bracknell Forest", "Brighton & Hove", "Bristol",
  "Buckinghamshire", "Central Bedfordshire", "Cheshire East", "Cheshire West & Chester",
  "Cornwall", "Cumberland", "Darlington", "Derby", "Dorset UA", "Durham",
  "East Riding of Yorkshire", "Halton", "Hartlepool", "Herefordshire",
  "Isle of Wight", "Isles of Scilly", "Kingston upon Hull", "Leicester", "Luton",
  "Medway Towns", "Middlesbrough", "Milton Keynes",
  "North East Lincolnshire", "North Lincolnshire", "North Northamptonshire",
  "North Somerset", "North Yorkshire", "Northumberland", "Nottingham",
  "Peterborough", "Plymouth", "Portsmouth", "Reading", "Redcar & Cleveland",
  "Rutland", "Shropshire", "Slough", "Somerset", "South Gloucestershire",
  "Southampton", "Southend-on-Sea", "Stockton-on-Tees", "Stoke-on-Trent",
  "Swindon", "Telford & Wrekin", "Thurrock", "Torbay", "Warrington",
  "West Berkshire", "West Northamptonshire", "Westmorland and Furness",
  "Wiltshire", "Windsor & Maidenhead", "Wokingham", "York"
];

// Step 1: Remove all existing enrichment lines (accounts_url, transparency_url, sources blocks, documents blocks)
// that were incorrectly placed

// Remove all accounts_url lines
content = content.replace(/^      accounts_url: ".*",\n/gm, '');
// Remove all transparency_url lines
content = content.replace(/^      transparency_url: ".*",\n/gm, '');
// Remove all sources blocks
content = content.replace(/      sources: \[\n(?:        \{ title: ".*", url: ".*" \},\n)*      \],\n/g, '');
// Remove all documents blocks
content = content.replace(/      documents: \[\n(?:        \{ title: ".*", url: ".*", type: ".*", year: ".*" \},\n)*      \],\n/g, '');
// Fix all last_verified to the new date
content = content.replace(/last_verified: "2026-02-25"/g, 'last_verified: "TEMP_DATE"');
content = content.replace(/last_verified: "2025-\d{2}-\d{2}"/g, 'last_verified: "TEMP_DATE"');

// Now re-apply enrichment correctly using TEMP_DATE as the marker
const enrichments = {
  "Bath & North East Somerset": { accounts_url: "https://www.bathnes.gov.uk/council-and-democracy/council-budgets-spending/statement-accounts", transparency_url: "https://www.bathnes.gov.uk/council-and-democracy/council-budgets-spending", sources: [{ title: "Statement of Accounts", url: "https://www.bathnes.gov.uk/council-and-democracy/council-budgets-spending/statement-accounts" }], documents: [{ title: "Statement of Accounts 2023-24", url: "https://www.bathnes.gov.uk/sites/default/files/2023-24%20Statement%20of%20Accounts.pdf", type: "accounts", year: "2023-24" }] },
  "Bedford": { accounts_url: "https://www.bedford.gov.uk/your-council/about-council/council-budgets-and-spending/statement-accounts", transparency_url: "https://www.bedford.gov.uk/your-council/about-council/council-budgets-and-spending", sources: [{ title: "Statement of Accounts", url: "https://www.bedford.gov.uk/your-council/about-council/council-budgets-and-spending/statement-accounts" }] },
  "Blackburn with Darwen": { accounts_url: "https://www.blackburn.gov.uk/financial/accounts-and-expenditure/statement-accounts", transparency_url: "https://www.blackburn.gov.uk/financial/accounts-and-expenditure", sources: [{ title: "Statement of Accounts", url: "https://www.blackburn.gov.uk/financial/accounts-and-expenditure/statement-accounts" }] },
  "Blackpool": { accounts_url: "https://www.blackpool.gov.uk/Your-Council/Transparency-and-open-data/Budget,-spending-and-procurement/Annual-accounts.aspx", transparency_url: "https://www.blackpool.gov.uk/Your-Council/Transparency-and-open-data/Budget,-spending-and-procurement/", sources: [{ title: "Annual Accounts", url: "https://www.blackpool.gov.uk/Your-Council/Transparency-and-open-data/Budget,-spending-and-procurement/Annual-accounts.aspx" }] },
  "Bournemouth, Christchurch & Poole": { accounts_url: "https://www.bcpcouncil.gov.uk/about-bcp-council/budgets-and-finance/statement-of-accounts", transparency_url: "https://www.bcpcouncil.gov.uk/about-bcp-council/budgets-and-finance", sources: [{ title: "Budgets and Finance", url: "https://www.bcpcouncil.gov.uk/about-bcp-council/budgets-and-finance" }] },
  "Bracknell Forest": { accounts_url: "https://www.bracknell-forest.gov.uk/council-and-democracy/budgets-and-spending/statement-accounts", transparency_url: "https://www.bracknell-forest.gov.uk/council-and-democracy/budgets-and-spending", sources: [{ title: "Budgets and Spending", url: "https://www.bracknell-forest.gov.uk/council-and-democracy/budgets-and-spending" }] },
  "Brighton & Hove": { accounts_url: "https://www.brighton-hove.gov.uk/council-and-democracy/council-data-and-finance/statement-accounts", transparency_url: "https://www.brighton-hove.gov.uk/council-and-democracy/council-data-and-finance", sources: [{ title: "Statement of Accounts", url: "https://www.brighton-hove.gov.uk/council-and-democracy/council-data-and-finance/statement-accounts" }] },
  "Bristol": { accounts_url: "https://www.bristol.gov.uk/council-and-mayor/council-spending-and-performance/statement-of-accounts", transparency_url: "https://www.bristol.gov.uk/council-and-mayor/council-spending-and-performance", sources: [{ title: "Council Spending and Performance", url: "https://www.bristol.gov.uk/council-and-mayor/council-spending-and-performance" }] },
  "Buckinghamshire": { accounts_url: "https://www.buckinghamshire.gov.uk/your-council/spending-contracts-and-transparency/statement-of-accounts/", transparency_url: "https://www.buckinghamshire.gov.uk/your-council/spending-contracts-and-transparency/", sources: [{ title: "Statement of Accounts", url: "https://www.buckinghamshire.gov.uk/your-council/spending-contracts-and-transparency/statement-of-accounts/" }] },
  "Central Bedfordshire": { accounts_url: "https://www.centralbedfordshire.gov.uk/info/27/about_your_council/178/annual_accounts_fees_and_charges_budget_statements_and_budget_books", transparency_url: "https://www.centralbedfordshire.gov.uk/info/27/about_your_council", sources: [{ title: "Annual Accounts and Budget", url: "https://www.centralbedfordshire.gov.uk/info/27/about_your_council/178/annual_accounts_fees_and_charges_budget_statements_and_budget_books" }] },
  "Cheshire East": { accounts_url: "https://www.cheshireeast.gov.uk/council_and_democracy/council_information/finance-and-budget/statement-of-accounts.aspx", transparency_url: "https://www.cheshireeast.gov.uk/council_and_democracy/council_information/finance-and-budget/", sources: [{ title: "Finance and Budget", url: "https://www.cheshireeast.gov.uk/council_and_democracy/council_information/finance-and-budget/" }] },
  "Cheshire West & Chester": { accounts_url: "https://www.cheshirewestandchester.gov.uk/your-council/spending-and-performance/statement-of-accounts", transparency_url: "https://www.cheshirewestandchester.gov.uk/your-council/spending-and-performance", sources: [{ title: "Spending and Performance", url: "https://www.cheshirewestandchester.gov.uk/your-council/spending-and-performance" }] },
  "Cornwall": { accounts_url: "https://www.cornwall.gov.uk/the-council-and-democracy/council-spending-and-finance/statement-of-accounts/", transparency_url: "https://www.cornwall.gov.uk/the-council-and-democracy/council-spending-and-finance/", sources: [{ title: "Statement of Accounts", url: "https://www.cornwall.gov.uk/the-council-and-democracy/council-spending-and-finance/statement-of-accounts/" }] },
  "Cumberland": { accounts_url: "https://www.cumberland.gov.uk/your-council/budgets-spending/statement-accounts", transparency_url: "https://www.cumberland.gov.uk/your-council/budgets-spending", sources: [{ title: "Budgets and Spending", url: "https://www.cumberland.gov.uk/your-council/budgets-spending" }] },
  "Darlington": { accounts_url: "https://www.darlington.gov.uk/your-council/budgets-and-spending/statement-of-accounts/", transparency_url: "https://www.darlington.gov.uk/your-council/budgets-and-spending/", sources: [{ title: "Budgets and Spending", url: "https://www.darlington.gov.uk/your-council/budgets-and-spending/" }] },
  "Derby": { accounts_url: "https://www.derby.gov.uk/council-and-democracy/budgets-and-spending/statement-of-accounts/", transparency_url: "https://www.derby.gov.uk/council-and-democracy/budgets-and-spending/", sources: [{ title: "Budgets and Spending", url: "https://www.derby.gov.uk/council-and-democracy/budgets-and-spending/" }] },
  "Dorset UA": { accounts_url: "https://www.dorsetcouncil.gov.uk/your-council/about-your-council/budgets-and-finance/statement-of-accounts", transparency_url: "https://www.dorsetcouncil.gov.uk/your-council/about-your-council/budgets-and-finance", sources: [{ title: "Budgets and Finance", url: "https://www.dorsetcouncil.gov.uk/your-council/about-your-council/budgets-and-finance" }] },
  "Durham": { accounts_url: "https://www.durham.gov.uk/article/2458/Statement-of-accounts", transparency_url: "https://www.durham.gov.uk/article/2456/Budgets-spending-and-performance", sources: [{ title: "Budgets, Spending and Performance", url: "https://www.durham.gov.uk/article/2456/Budgets-spending-and-performance" }] },
  "East Riding of Yorkshire": { accounts_url: "https://www.eastriding.gov.uk/council/finance-and-spending/statement-of-accounts/", transparency_url: "https://www.eastriding.gov.uk/council/finance-and-spending/", sources: [{ title: "Finance and Spending", url: "https://www.eastriding.gov.uk/council/finance-and-spending/" }] },
  "Halton": { accounts_url: "https://www.halton.gov.uk/council-and-democracy/finance-spending/statement-of-accounts", transparency_url: "https://www.halton.gov.uk/council-and-democracy/finance-spending", sources: [{ title: "Finance and Spending", url: "https://www.halton.gov.uk/council-and-democracy/finance-spending" }] },
  "Hartlepool": { accounts_url: "https://www.hartlepool.gov.uk/info/20004/council_and_democracy/351/statement_of_accounts", transparency_url: "https://www.hartlepool.gov.uk/info/20004/council_and_democracy", sources: [{ title: "Statement of Accounts", url: "https://www.hartlepool.gov.uk/info/20004/council_and_democracy/351/statement_of_accounts" }] },
  "Herefordshire": { accounts_url: "https://www.herefordshire.gov.uk/council/statement-accounts", transparency_url: "https://www.herefordshire.gov.uk/council/budgets-spending", sources: [{ title: "Budgets and Spending", url: "https://www.herefordshire.gov.uk/council/budgets-spending" }] },
  "Isle of Wight": { accounts_url: "https://www.iow.gov.uk/council/spending-and-performance/statement-of-accounts/", transparency_url: "https://www.iow.gov.uk/council/spending-and-performance/", sources: [{ title: "Spending and Performance", url: "https://www.iow.gov.uk/council/spending-and-performance/" }] },
  "Isles of Scilly": { accounts_url: "https://www.scilly.gov.uk/council/spending-and-finance/statement-of-accounts", transparency_url: "https://www.scilly.gov.uk/council/spending-and-finance", sources: [{ title: "Spending and Finance", url: "https://www.scilly.gov.uk/council/spending-and-finance" }] },
  "Kingston upon Hull": { accounts_url: "https://www.hull.gov.uk/council-and-democracy/finance-and-spending/statement-of-accounts", transparency_url: "https://www.hull.gov.uk/council-and-democracy/finance-and-spending", sources: [{ title: "Finance and Spending", url: "https://www.hull.gov.uk/council-and-democracy/finance-and-spending" }] },
  "Leicester": { accounts_url: "https://www.leicester.gov.uk/your-council/council-spending/statement-of-accounts/", transparency_url: "https://www.leicester.gov.uk/your-council/council-spending/", sources: [{ title: "Council Spending", url: "https://www.leicester.gov.uk/your-council/council-spending/" }] },
  "Luton": { accounts_url: "https://www.luton.gov.uk/Council_government_and_democracy/finance/Pages/Statement-of-accounts.aspx", transparency_url: "https://www.luton.gov.uk/Council_government_and_democracy/finance/", sources: [{ title: "Council Finance", url: "https://www.luton.gov.uk/Council_government_and_democracy/finance/" }] },
  "Medway Towns": { accounts_url: "https://www.medway.gov.uk/info/200207/about_the_council/383/statement_of_accounts", transparency_url: "https://www.medway.gov.uk/info/200207/about_the_council", sources: [{ title: "Statement of Accounts", url: "https://www.medway.gov.uk/info/200207/about_the_council/383/statement_of_accounts" }] },
  "Middlesbrough": { accounts_url: "https://www.middlesbrough.gov.uk/council-and-democracy/finance-and-spending/statement-of-accounts", transparency_url: "https://www.middlesbrough.gov.uk/council-and-democracy/finance-and-spending", sources: [{ title: "Finance and Spending", url: "https://www.middlesbrough.gov.uk/council-and-democracy/finance-and-spending" }] },
  "Milton Keynes": { accounts_url: "https://www.milton-keynes.gov.uk/your-council-and-elections/budgets-spending-and-performance/statement-accounts", transparency_url: "https://www.milton-keynes.gov.uk/your-council-and-elections/budgets-spending-and-performance", sources: [{ title: "Budgets, Spending and Performance", url: "https://www.milton-keynes.gov.uk/your-council-and-elections/budgets-spending-and-performance" }] },
  "North East Lincolnshire": { accounts_url: "https://www.nelincs.gov.uk/council/finance-and-spending/statement-of-accounts/", transparency_url: "https://www.nelincs.gov.uk/council/finance-and-spending/", sources: [{ title: "Finance and Spending", url: "https://www.nelincs.gov.uk/council/finance-and-spending/" }] },
  "North Lincolnshire": { accounts_url: "https://www.northlincs.gov.uk/your-council/budgets-and-spending/statement-of-accounts/", transparency_url: "https://www.northlincs.gov.uk/your-council/budgets-and-spending/", sources: [{ title: "Budgets and Spending", url: "https://www.northlincs.gov.uk/your-council/budgets-and-spending/" }] },
  "North Northamptonshire": { accounts_url: "https://www.northnorthants.gov.uk/finance-and-budgets/statement-of-accounts", transparency_url: "https://www.northnorthants.gov.uk/finance-and-budgets", sources: [{ title: "Finance and Budgets", url: "https://www.northnorthants.gov.uk/finance-and-budgets" }] },
  "North Somerset": { accounts_url: "https://www.n-somerset.gov.uk/council-democracy/spending-budget/statement-accounts", transparency_url: "https://www.n-somerset.gov.uk/council-democracy/spending-budget", sources: [{ title: "Spending and Budget", url: "https://www.n-somerset.gov.uk/council-democracy/spending-budget" }] },
  "North Yorkshire": { accounts_url: "https://www.northyorks.gov.uk/your-council/budgets-and-spending/statement-of-accounts", transparency_url: "https://www.northyorks.gov.uk/your-council/budgets-and-spending", sources: [{ title: "Budgets and Spending", url: "https://www.northyorks.gov.uk/your-council/budgets-and-spending" }] },
  "Northumberland": { accounts_url: "https://www.northumberland.gov.uk/About/Budgets/Statement-of-Accounts.aspx", transparency_url: "https://www.northumberland.gov.uk/About/Budgets.aspx", sources: [{ title: "Budgets", url: "https://www.northumberland.gov.uk/About/Budgets.aspx" }] },
  "Nottingham": { accounts_url: "https://www.nottinghamcity.gov.uk/your-council/about-the-council/statement-of-accounts-and-reports/", transparency_url: "https://www.nottinghamcity.gov.uk/your-council/about-the-council/budgets-and-spending/", sources: [{ title: "Statement of Accounts and Reports", url: "https://www.nottinghamcity.gov.uk/your-council/about-the-council/statement-of-accounts-and-reports/" }] },
  "Peterborough": { accounts_url: "https://www.peterborough.gov.uk/council/budgets-spending/statement-accounts", transparency_url: "https://www.peterborough.gov.uk/council/budgets-spending", sources: [{ title: "Budgets and Spending", url: "https://www.peterborough.gov.uk/council/budgets-spending" }] },
  "Plymouth": { accounts_url: "https://www.plymouth.gov.uk/council-and-democracy/budgets-and-spending/statement-of-accounts", transparency_url: "https://www.plymouth.gov.uk/council-and-democracy/budgets-and-spending", sources: [{ title: "Budgets and Spending", url: "https://www.plymouth.gov.uk/council-and-democracy/budgets-and-spending" }] },
  "Portsmouth": { accounts_url: "https://www.portsmouth.gov.uk/services/council-and-democracy/transparency/statement-of-accounts/", transparency_url: "https://www.portsmouth.gov.uk/services/council-and-democracy/transparency/", sources: [{ title: "Transparency", url: "https://www.portsmouth.gov.uk/services/council-and-democracy/transparency/" }] },
  "Reading": { accounts_url: "https://www.reading.gov.uk/council-and-democracy/finance-and-spending/statement-of-accounts/", transparency_url: "https://www.reading.gov.uk/council-and-democracy/finance-and-spending/", sources: [{ title: "Finance and Spending", url: "https://www.reading.gov.uk/council-and-democracy/finance-and-spending/" }] },
  "Redcar & Cleveland": { accounts_url: "https://www.redcar-cleveland.gov.uk/council-and-democracy/budgets-and-spending/statement-of-accounts", transparency_url: "https://www.redcar-cleveland.gov.uk/council-and-democracy/budgets-and-spending", sources: [{ title: "Budgets and Spending", url: "https://www.redcar-cleveland.gov.uk/council-and-democracy/budgets-and-spending" }] },
  "Rutland": { accounts_url: "https://www.rutland.gov.uk/council-and-democracy/budgets-and-spending/statement-of-accounts", transparency_url: "https://www.rutland.gov.uk/council-and-democracy/budgets-and-spending", sources: [{ title: "Budgets and Spending", url: "https://www.rutland.gov.uk/council-and-democracy/budgets-and-spending" }] },
  "Shropshire": { accounts_url: "https://www.shropshire.gov.uk/council-and-democracy/finance-and-spending/statement-of-accounts/", transparency_url: "https://www.shropshire.gov.uk/council-and-democracy/finance-and-spending/", sources: [{ title: "Finance and Spending", url: "https://www.shropshire.gov.uk/council-and-democracy/finance-and-spending/" }] },
  "Slough": { accounts_url: "https://www.slough.gov.uk/council-democracy/statement-accounts", transparency_url: "https://www.slough.gov.uk/council-democracy/budgets-spending", sources: [{ title: "Budgets and Spending", url: "https://www.slough.gov.uk/council-democracy/budgets-spending" }] },
  "Somerset": { accounts_url: "https://www.somerset.gov.uk/council-and-democracy/budgets-and-spending/statement-of-accounts/", transparency_url: "https://www.somerset.gov.uk/council-and-democracy/budgets-and-spending/", sources: [{ title: "Budgets and Spending", url: "https://www.somerset.gov.uk/council-and-democracy/budgets-and-spending/" }] },
  "South Gloucestershire": { accounts_url: "https://www.southglos.gov.uk/council-and-democracy/budgets-and-spending/statement-of-accounts/", transparency_url: "https://www.southglos.gov.uk/council-and-democracy/budgets-and-spending/", sources: [{ title: "Budgets and Spending", url: "https://www.southglos.gov.uk/council-and-democracy/budgets-and-spending/" }] },
  "Southampton": { accounts_url: "https://www.southampton.gov.uk/council-democracy/council-finance/statement-accounts/", transparency_url: "https://www.southampton.gov.uk/council-democracy/council-finance/", sources: [{ title: "Council Finance", url: "https://www.southampton.gov.uk/council-democracy/council-finance/" }] },
  "Southend-on-Sea": { accounts_url: "https://www.southend.gov.uk/council/statement-accounts", transparency_url: "https://www.southend.gov.uk/council/budgets-spending", sources: [{ title: "Budgets and Spending", url: "https://www.southend.gov.uk/council/budgets-spending" }] },
  "Stockton-on-Tees": { accounts_url: "https://www.stockton.gov.uk/finance-and-spending/statement-of-accounts", transparency_url: "https://www.stockton.gov.uk/finance-and-spending", sources: [{ title: "Finance and Spending", url: "https://www.stockton.gov.uk/finance-and-spending" }] },
  "Stoke-on-Trent": { accounts_url: "https://www.stoke.gov.uk/info/20017/budgets_spending_and_performance/282/statement_of_accounts", transparency_url: "https://www.stoke.gov.uk/info/20017/budgets_spending_and_performance", sources: [{ title: "Budgets, Spending and Performance", url: "https://www.stoke.gov.uk/info/20017/budgets_spending_and_performance" }] },
  "Swindon": { accounts_url: "https://www.swindon.gov.uk/info/20047/council_finances_and_spending/381/statement_of_accounts", transparency_url: "https://www.swindon.gov.uk/info/20047/council_finances_and_spending", sources: [{ title: "Council Finances and Spending", url: "https://www.swindon.gov.uk/info/20047/council_finances_and_spending" }] },
  "Telford & Wrekin": { accounts_url: "https://www.telford.gov.uk/info/20170/council_budgets_spending_and_performance/264/statement_of_accounts", transparency_url: "https://www.telford.gov.uk/info/20170/council_budgets_spending_and_performance", sources: [{ title: "Council Budgets, Spending and Performance", url: "https://www.telford.gov.uk/info/20170/council_budgets_spending_and_performance" }] },
  "Thurrock": { accounts_url: "https://www.thurrock.gov.uk/council-finance/statement-of-accounts", transparency_url: "https://www.thurrock.gov.uk/council-finance", sources: [{ title: "Council Finance", url: "https://www.thurrock.gov.uk/council-finance" }] },
  "Torbay": { accounts_url: "https://www.torbay.gov.uk/council/finance-and-spending/statement-of-accounts/", transparency_url: "https://www.torbay.gov.uk/council/finance-and-spending/", sources: [{ title: "Finance and Spending", url: "https://www.torbay.gov.uk/council/finance-and-spending/" }] },
  "Warrington": { accounts_url: "https://www.warrington.gov.uk/council-spending/statement-of-accounts", transparency_url: "https://www.warrington.gov.uk/council-spending", sources: [{ title: "Council Spending", url: "https://www.warrington.gov.uk/council-spending" }] },
  "West Berkshire": { accounts_url: "https://www.westberks.gov.uk/statement-of-accounts", transparency_url: "https://www.westberks.gov.uk/budgets-and-spending", sources: [{ title: "Budgets and Spending", url: "https://www.westberks.gov.uk/budgets-and-spending" }] },
  "West Northamptonshire": { accounts_url: "https://www.westnorthants.gov.uk/finance-and-budgets/statement-of-accounts", transparency_url: "https://www.westnorthants.gov.uk/finance-and-budgets", sources: [{ title: "Finance and Budgets", url: "https://www.westnorthants.gov.uk/finance-and-budgets" }] },
  "Westmorland and Furness": { accounts_url: "https://www.westmorlandandfurness.gov.uk/your-council/budgets-and-spending/statement-of-accounts", transparency_url: "https://www.westmorlandandfurness.gov.uk/your-council/budgets-and-spending", sources: [{ title: "Budgets and Spending", url: "https://www.westmorlandandfurness.gov.uk/your-council/budgets-and-spending" }] },
  "Wiltshire": { accounts_url: "https://www.wiltshire.gov.uk/council-democracy-budgets-spending-statement-of-accounts", transparency_url: "https://www.wiltshire.gov.uk/council-democracy-budgets-spending", sources: [{ title: "Budgets and Spending", url: "https://www.wiltshire.gov.uk/council-democracy-budgets-spending" }] },
  "Windsor & Maidenhead": { accounts_url: "https://www.rbwm.gov.uk/home/council-and-democracy/budgets-and-spending/statement-of-accounts", transparency_url: "https://www.rbwm.gov.uk/home/council-and-democracy/budgets-and-spending", sources: [{ title: "Budgets and Spending", url: "https://www.rbwm.gov.uk/home/council-and-democracy/budgets-and-spending" }] },
  "Wokingham": { accounts_url: "https://www.wokingham.gov.uk/council-and-democracy/budgets-and-spending/statement-of-accounts", transparency_url: "https://www.wokingham.gov.uk/council-and-democracy/budgets-and-spending", sources: [{ title: "Budgets and Spending", url: "https://www.wokingham.gov.uk/council-and-democracy/budgets-and-spending" }] },
  "York": { accounts_url: "https://www.york.gov.uk/StatementOfAccounts", transparency_url: "https://www.york.gov.uk/BudgetsAndSpending", sources: [{ title: "Budgets and Spending", url: "https://www.york.gov.uk/BudgetsAndSpending" }] },
};

let count = 0;
for (const [name, data] of Object.entries(enrichments)) {
  const namePattern = `name: "${name}"`;
  const nameIdx = content.indexOf(namePattern);
  if (nameIdx === -1) { console.log(`WARNING: Could not find ${name}`); continue; }

  const lvPattern = 'last_verified: "TEMP_DATE"';
  const lvIdx = content.indexOf(lvPattern, nameIdx);
  if (lvIdx === -1) { console.log(`WARNING: Could not find last_verified for ${name}`); continue; }

  // Make sure this last_verified belongs to this council (not a later one)
  // Check there's no other council name between nameIdx and lvIdx
  const nextNameIdx = content.indexOf('\n    name: "', nameIdx + namePattern.length);
  if (nextNameIdx !== -1 && nextNameIdx < lvIdx) {
    console.log(`WARNING: last_verified mismatch for ${name} - found at wrong position`);
    continue;
  }

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
