#!/usr/bin/env node

/**
 * Enrich districts.ts with accounts_url, transparency_url, and sources
 * for all 164 district councils.
 *
 * Usage: node enrich-districts.mjs
 */

import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const filePath = resolve(__dirname, 'src/data/councils/districts.ts');

// Enrichment data for all 164 district councils
// Folkestone & Hythe is marked as skip (already enriched)
const enrichments = {
  "Adur": {
    accounts_url: "https://www.adur-worthing.gov.uk/about-the-councils/finance/statement-of-accounts/",
    transparency_url: "https://www.adur-worthing.gov.uk/about-the-councils/open-data/",
    sources: [
      { title: "Statement of Accounts", url: "https://www.adur-worthing.gov.uk/about-the-councils/finance/statement-of-accounts/" },
    ],
  },
  "Amber Valley": {
    accounts_url: "https://www.ambervalley.gov.uk/council/budgets-and-spending/",
    transparency_url: "https://www.ambervalley.gov.uk/council/budgets-and-spending/",
    sources: [
      { title: "Statement of Accounts", url: "https://www.ambervalley.gov.uk/council/budgets-and-spending/" },
    ],
  },
  "Arun": {
    accounts_url: "https://www.arun.gov.uk/financial-information/",
    transparency_url: "https://www.arun.gov.uk/transparency/",
    sources: [
      { title: "Statement of Accounts", url: "https://www.arun.gov.uk/financial-information/" },
    ],
  },
  "Ashfield": {
    accounts_url: "https://www.ashfield.gov.uk/your-council/financial-information/",
    sources: [
      { title: "Statement of Accounts", url: "https://www.ashfield.gov.uk/your-council/financial-information/" },
    ],
  },
  "Ashford": {
    accounts_url: "https://www.ashford.gov.uk/transparency/expenditure/budgeting-and-statement-of-accounts/",
    transparency_url: "https://www.ashford.gov.uk/transparency",
    sources: [
      { title: "Statement of Accounts", url: "https://www.ashford.gov.uk/transparency/expenditure/budgeting-and-statement-of-accounts/" },
    ],
  },
  "Babergh": {
    accounts_url: "https://www.babergh.gov.uk/w/statements-of-accounts",
    sources: [
      { title: "Statement of Accounts", url: "https://www.babergh.gov.uk/w/statements-of-accounts" },
    ],
  },
  "Basildon": {
    accounts_url: "https://www.basildon.gov.uk/article/529",
    sources: [
      { title: "Statement of Accounts", url: "https://www.basildon.gov.uk/article/529" },
    ],
  },
  "Basingstoke & Deane": {
    accounts_url: "https://www.basingstoke.gov.uk/finance",
    transparency_url: "https://www.basingstoke.gov.uk/opendata",
    sources: [
      { title: "Statement of Accounts", url: "https://www.basingstoke.gov.uk/finance" },
    ],
  },
  "Bassetlaw": {
    accounts_url: "https://www.bassetlaw.gov.uk/media/ntghprxu/statement-of-accounts-2024-25-published-draft.pdf",
    sources: [
      { title: "Statement of Accounts", url: "https://www.bassetlaw.gov.uk/media/ntghprxu/statement-of-accounts-2024-25-published-draft.pdf" },
    ],
  },
  "Blaby": {
    accounts_url: "https://www.blaby.gov.uk/your-council/performance-and-budgets/annual-accounts/",
    sources: [
      { title: "Statement of Accounts", url: "https://www.blaby.gov.uk/your-council/performance-and-budgets/annual-accounts/" },
    ],
  },
  "Bolsover": {
    accounts_url: "https://www.bolsover.gov.uk/your-council/finance/statement-of-accounts",
    sources: [
      { title: "Statement of Accounts", url: "https://www.bolsover.gov.uk/your-council/finance/statement-of-accounts" },
    ],
  },
  "Boston": {
    accounts_url: "https://www.boston.gov.uk/article/25817",
    sources: [
      { title: "Statement of Accounts", url: "https://www.boston.gov.uk/article/25817" },
    ],
  },
  "Braintree": {
    accounts_url: "https://www.braintree.gov.uk/council/accounts-allowances-expenses",
    sources: [
      { title: "Statement of Accounts", url: "https://www.braintree.gov.uk/council/accounts-allowances-expenses" },
    ],
  },
  "Breckland": {
    accounts_url: "https://www.breckland.gov.uk/article/3458/Statement-of-Accounts",
    sources: [
      { title: "Statement of Accounts", url: "https://www.breckland.gov.uk/article/3458/Statement-of-Accounts" },
    ],
  },
  "Brentwood": {
    accounts_url: "https://www.brentwood.gov.uk/statement-of-accounts",
    sources: [
      { title: "Statement of Accounts", url: "https://www.brentwood.gov.uk/statement-of-accounts" },
    ],
  },
  "Broadland": {
    accounts_url: "https://www.broadland.gov.uk/council/finance",
    sources: [
      { title: "Statement of Accounts", url: "https://www.broadland.gov.uk/council/finance" },
    ],
  },
  "Bromsgrove": {
    accounts_url: "https://www.bromsgrove.gov.uk/council/finance/council-budgets-and-spending/statement-of-accounts/",
    sources: [
      { title: "Statement of Accounts", url: "https://www.bromsgrove.gov.uk/council/finance/council-budgets-and-spending/statement-of-accounts/" },
    ],
  },
  "Broxbourne": {
    accounts_url: "https://www.broxbourne.gov.uk/finance/annual-budget/2",
    transparency_url: "https://www.broxbourne.gov.uk/democracy/transparency-information/3",
    sources: [
      { title: "Statement of Accounts", url: "https://www.broxbourne.gov.uk/finance/annual-budget/2" },
    ],
  },
  "Broxtowe": {
    accounts_url: "https://www.broxtowe.gov.uk/about-the-council/budgets-and-spending/annual-accounts",
    sources: [
      { title: "Statement of Accounts", url: "https://www.broxtowe.gov.uk/about-the-council/budgets-and-spending/annual-accounts" },
    ],
  },
  "Burnley": {
    accounts_url: "https://burnley.gov.uk/council-democracy/finance-performance/burnley-councils-budget-book-2022-23/",
    sources: [
      { title: "Statement of Accounts", url: "https://burnley.gov.uk/council-democracy/finance-performance/burnley-councils-budget-book-2022-23/" },
    ],
  },
  "Cambridge": {
    accounts_url: "https://www.cambridge.gov.uk/statement-of-accounts",
    sources: [
      { title: "Statement of Accounts", url: "https://www.cambridge.gov.uk/statement-of-accounts" },
    ],
  },
  "Cannock Chase": {
    accounts_url: "https://www.cannockchasedc.gov.uk/council/about-us/financial-information/statement-accounts",
    sources: [
      { title: "Statement of Accounts", url: "https://www.cannockchasedc.gov.uk/council/about-us/financial-information/statement-accounts" },
    ],
  },
  "Canterbury": {
    accounts_url: "https://www.canterbury.gov.uk/budgets-and-transparency/our-budget-and-service-costs",
    sources: [
      { title: "Statement of Accounts", url: "https://www.canterbury.gov.uk/budgets-and-transparency/our-budget-and-service-costs" },
    ],
  },
  "Castle Point": {
    accounts_url: "https://www.castlepoint.gov.uk/accounts/",
    sources: [
      { title: "Statement of Accounts", url: "https://www.castlepoint.gov.uk/accounts/" },
    ],
  },
  "Charnwood": {
    accounts_url: "https://www.charnwood.gov.uk/pages/annual_accounts",
    sources: [
      { title: "Statement of Accounts", url: "https://www.charnwood.gov.uk/pages/annual_accounts" },
    ],
  },
  "Chelmsford": {
    accounts_url: "https://www.chelmsford.gov.uk/your-council/finance-budgets-and-transparency/",
    sources: [
      { title: "Statement of Accounts", url: "https://www.chelmsford.gov.uk/your-council/finance-budgets-and-transparency/" },
    ],
  },
  "Cheltenham": {
    accounts_url: "https://www.cheltenham.gov.uk/info/18/council_budgets_and_spending/494/statement_of_accounts_and_annual_report",
    sources: [
      { title: "Statement of Accounts", url: "https://www.cheltenham.gov.uk/info/18/council_budgets_and_spending/494/statement_of_accounts_and_annual_report" },
    ],
  },
  "Cherwell": {
    accounts_url: "https://www.cherwell.gov.uk/info/1121/council-finances",
    sources: [
      { title: "Statement of Accounts", url: "https://www.cherwell.gov.uk/info/1121/council-finances" },
    ],
  },
  "Chesterfield": {
    accounts_url: "https://chesterfield.gov.uk/your-council/finance-and-spending/statement-of-accounts",
    sources: [
      { title: "Statement of Accounts", url: "https://chesterfield.gov.uk/your-council/finance-and-spending/statement-of-accounts" },
    ],
  },
  "Chichester": {
    accounts_url: "https://www.chichester.gov.uk/budgets-spending-and-performance",
    sources: [
      { title: "Statement of Accounts", url: "https://www.chichester.gov.uk/budgets-spending-and-performance" },
    ],
  },
  "Chorley": {
    accounts_url: "https://chorley.gov.uk/council-spending/statementofaccounts",
    sources: [
      { title: "Statement of Accounts", url: "https://chorley.gov.uk/council-spending/statementofaccounts" },
    ],
  },
  "Colchester": {
    accounts_url: "https://www.colchester.gov.uk/info/cbc-article/?id=KA-01764",
    sources: [
      { title: "Statement of Accounts", url: "https://www.colchester.gov.uk/info/cbc-article/?id=KA-01764" },
    ],
  },
  "Cotswold": {
    accounts_url: "https://www.cotswold.gov.uk/about-the-council/council-spending/",
    sources: [
      { title: "Statement of Accounts", url: "https://www.cotswold.gov.uk/about-the-council/council-spending/" },
    ],
  },
  "Crawley": {
    accounts_url: "https://crawley.gov.uk/council-information/council-finance/council-finances-summary",
    sources: [
      { title: "Statement of Accounts", url: "https://crawley.gov.uk/council-information/council-finance/council-finances-summary" },
    ],
  },
  "Dacorum": {
    accounts_url: "https://www.dacorum.gov.uk/home/council-democracy/finance",
    sources: [
      { title: "Statement of Accounts", url: "https://www.dacorum.gov.uk/home/council-democracy/finance" },
    ],
  },
  "Dartford": {
    accounts_url: "https://www.dartford.gov.uk/council-spending",
    sources: [
      { title: "Statement of Accounts", url: "https://www.dartford.gov.uk/council-spending" },
    ],
  },
  "Derbyshire Dales": {
    accounts_url: "https://www.derbyshiredales.gov.uk/your-council/budget-and-spending/statement-of-accounts",
    sources: [
      { title: "Statement of Accounts", url: "https://www.derbyshiredales.gov.uk/your-council/budget-and-spending/statement-of-accounts" },
    ],
  },
  "Dover": {
    accounts_url: "https://www.dover.gov.uk/Corporate-Information/Financial-Information/Budgets--Accounts.aspx",
    sources: [
      { title: "Statement of Accounts", url: "https://www.dover.gov.uk/Corporate-Information/Financial-Information/Budgets--Accounts.aspx" },
    ],
  },
  "East Cambridgeshire": {
    accounts_url: "https://www.eastcambs.gov.uk/finance/council-accounts",
    sources: [
      { title: "Statement of Accounts", url: "https://www.eastcambs.gov.uk/finance/council-accounts" },
    ],
  },
  "East Devon": {
    accounts_url: "https://eastdevon.gov.uk/access-to-information/transparency-code/transparency-code-information/transparency-code-datasets/",
    sources: [
      { title: "Statement of Accounts", url: "https://eastdevon.gov.uk/access-to-information/transparency-code/transparency-code-information/transparency-code-datasets/" },
    ],
  },
  "East Hampshire": {
    accounts_url: "https://www.easthants.gov.uk/our-organisation/budgets-and-spending/statement-accounts",
    sources: [
      { title: "Statement of Accounts", url: "https://www.easthants.gov.uk/our-organisation/budgets-and-spending/statement-accounts" },
    ],
  },
  "East Hertfordshire": {
    accounts_url: "https://www.eastherts.gov.uk/about-east-herts-0/statement-accounts-budgets-and-annual-audit",
    sources: [
      { title: "Statement of Accounts", url: "https://www.eastherts.gov.uk/about-east-herts-0/statement-accounts-budgets-and-annual-audit" },
    ],
  },
  "East Lindsey": {
    accounts_url: "https://www.e-lindsey.gov.uk/article/6224/Financial-Statements",
    sources: [
      { title: "Statement of Accounts", url: "https://www.e-lindsey.gov.uk/article/6224/Financial-Statements" },
    ],
  },
  "East Staffordshire": {
    accounts_url: "https://www.eaststaffsbc.gov.uk/council/finance/statement-of-accounts",
    sources: [
      { title: "Statement of Accounts", url: "https://www.eaststaffsbc.gov.uk/council/finance/statement-of-accounts" },
    ],
  },
  "East Suffolk": {
    accounts_url: "https://www.eastsuffolk.gov.uk/yourcouncil/financial-information/statement-of-accounts/",
    sources: [
      { title: "Statement of Accounts", url: "https://www.eastsuffolk.gov.uk/yourcouncil/financial-information/statement-of-accounts/" },
    ],
  },
  "Eastbourne": {
    accounts_url: "https://www.lewes-eastbourne.gov.uk/article/1116/Statement-of-accounts",
    sources: [
      { title: "Statement of Accounts", url: "https://www.lewes-eastbourne.gov.uk/article/1116/Statement-of-accounts" },
    ],
  },
  "Eastleigh": {
    accounts_url: "https://www.eastleigh.gov.uk/council/general-public-information/transparency-code/council-spending/statement-of-accounts",
    sources: [
      { title: "Statement of Accounts", url: "https://www.eastleigh.gov.uk/council/general-public-information/transparency-code/council-spending/statement-of-accounts" },
    ],
  },
  "Elmbridge": {
    accounts_url: "https://www.elmbridge.gov.uk/your-council/finance-and-transparency/financial-performance-and-annual-accounts/statement-accounts",
    sources: [
      { title: "Statement of Accounts", url: "https://www.elmbridge.gov.uk/your-council/finance-and-transparency/financial-performance-and-annual-accounts/statement-accounts" },
    ],
  },
  "Epping Forest": {
    accounts_url: "https://www.eppingforestdc.gov.uk/your-council/finance/statement-of-accounts",
    sources: [
      { title: "Statement of Accounts", url: "https://www.eppingforestdc.gov.uk/your-council/finance/statement-of-accounts" },
    ],
  },
  "Epsom & Ewell": {
    accounts_url: "https://www.epsom-ewell.gov.uk/council/finance/statement-of-accounts",
    sources: [
      { title: "Statement of Accounts", url: "https://www.epsom-ewell.gov.uk/council/finance/statement-of-accounts" },
    ],
  },
  "Erewash": {
    accounts_url: "https://www.erewash.gov.uk/your-council/finance/statement-accounts",
    sources: [
      { title: "Statement of Accounts", url: "https://www.erewash.gov.uk/your-council/finance/statement-accounts" },
    ],
  },
  "Exeter": {
    accounts_url: "https://exeter.gov.uk/council-and-democracy/finance/annual-accounts/",
    sources: [
      { title: "Statement of Accounts", url: "https://exeter.gov.uk/council-and-democracy/finance/annual-accounts/" },
    ],
  },
  "Fareham": {
    accounts_url: "https://www.fareham.gov.uk/about_the_council/council_and_democracy/budgetsandspending.aspx",
    sources: [
      { title: "Statement of Accounts", url: "https://www.fareham.gov.uk/about_the_council/council_and_democracy/budgetsandspending.aspx" },
    ],
  },
  "Fenland": {
    accounts_url: "https://www.fenland.gov.uk/finance/council-accounts",
    sources: [
      { title: "Statement of Accounts", url: "https://www.fenland.gov.uk/finance/council-accounts" },
    ],
  },
  "Folkestone & Hythe": {
    skip: true, // Already enriched
  },
  "Forest of Dean": {
    accounts_url: "https://www.fdean.gov.uk/council-and-democracy/budgets-and-spending",
    sources: [
      { title: "Statement of Accounts", url: "https://www.fdean.gov.uk/council-and-democracy/budgets-and-spending" },
    ],
  },
  "Fylde": {
    accounts_url: "https://new.fylde.gov.uk/council/finance/statement-of-accounts/",
    sources: [
      { title: "Statement of Accounts", url: "https://new.fylde.gov.uk/council/finance/statement-of-accounts/" },
    ],
  },
  "Gedling": {
    accounts_url: "https://www.gedling.gov.uk/democracy-and-elections/about-us/finance-and-accounts",
    sources: [
      { title: "Statement of Accounts", url: "https://www.gedling.gov.uk/democracy-and-elections/about-us/finance-and-accounts" },
    ],
  },
  "Gloucester": {
    accounts_url: "https://www.gloucester.gov.uk/council-and-democracy/finance/statement-of-accounts",
    sources: [
      { title: "Statement of Accounts", url: "https://www.gloucester.gov.uk/council-and-democracy/finance/statement-of-accounts" },
    ],
  },
  "Gosport": {
    accounts_url: "https://www.gosport.gov.uk/article/1444/Statement-of-Accounts",
    sources: [
      { title: "Statement of Accounts", url: "https://www.gosport.gov.uk/article/1444/Statement-of-Accounts" },
    ],
  },
  "Gravesham": {
    accounts_url: "https://www.gravesham.gov.uk/home/about-the-council/budgets-audits-and-accounts/statement-of-accounts",
    sources: [
      { title: "Statement of Accounts", url: "https://www.gravesham.gov.uk/home/about-the-council/budgets-audits-and-accounts/statement-of-accounts" },
    ],
  },
  "Great Yarmouth": {
    accounts_url: "https://www.great-yarmouth.gov.uk/article/2289/Statement-of-accounts",
    sources: [
      { title: "Statement of Accounts", url: "https://www.great-yarmouth.gov.uk/article/2289/Statement-of-accounts" },
    ],
  },
  "Guildford": {
    accounts_url: "https://www.guildford.gov.uk/article/18469/Annual-accounts",
    sources: [
      { title: "Statement of Accounts", url: "https://www.guildford.gov.uk/article/18469/Annual-accounts" },
    ],
  },
  "Harborough": {
    accounts_url: "https://www.harborough.gov.uk/finance/statement-of-accounts",
    sources: [
      { title: "Statement of Accounts", url: "https://www.harborough.gov.uk/finance/statement-of-accounts" },
    ],
  },
  "Harlow": {
    accounts_url: "https://www.harlow.gov.uk/your-council/spending-and-performance/statement-accounts",
    sources: [
      { title: "Statement of Accounts", url: "https://www.harlow.gov.uk/your-council/spending-and-performance/statement-accounts" },
    ],
  },
  "Hart": {
    accounts_url: "https://www.hart.gov.uk/council/finance/statement-of-accounts",
    sources: [
      { title: "Statement of Accounts", url: "https://www.hart.gov.uk/council/finance/statement-of-accounts" },
    ],
  },
  "Hastings": {
    accounts_url: "https://www.hastings.gov.uk/my-council/budgets-spending/statement-of-accounts",
    sources: [
      { title: "Statement of Accounts", url: "https://www.hastings.gov.uk/my-council/budgets-spending/statement-of-accounts" },
    ],
  },
  "Havant": {
    accounts_url: "https://www.havant.gov.uk/our-organisation/budgets-and-spending/statement-accounts",
    sources: [
      { title: "Statement of Accounts", url: "https://www.havant.gov.uk/our-organisation/budgets-and-spending/statement-accounts" },
    ],
  },
  "Hertsmere": {
    accounts_url: "https://www.hertsmere.gov.uk/Your-Council/How-the-council-works/Finance/Statement-of-Accounts.aspx",
    sources: [
      { title: "Statement of Accounts", url: "https://www.hertsmere.gov.uk/Your-Council/How-the-council-works/Finance/Statement-of-Accounts.aspx" },
    ],
  },
  "High Peak": {
    accounts_url: "https://www.highpeak.gov.uk/article/1281/Annual-statement-of-accounts",
    sources: [
      { title: "Statement of Accounts", url: "https://www.highpeak.gov.uk/article/1281/Annual-statement-of-accounts" },
    ],
  },
  "Hinckley & Bosworth": {
    accounts_url: "https://www.hinckley-bosworth.gov.uk/finance/statement-of-accounts",
    sources: [
      { title: "Statement of Accounts", url: "https://www.hinckley-bosworth.gov.uk/finance/statement-of-accounts" },
    ],
  },
  "Horsham": {
    accounts_url: "https://www.horsham.gov.uk/council-democracy-and-elections/finance-and-council-performance/statement-of-accounts",
    sources: [
      { title: "Statement of Accounts", url: "https://www.horsham.gov.uk/council-democracy-and-elections/finance-and-council-performance/statement-of-accounts" },
    ],
  },
  "Huntingdonshire": {
    accounts_url: "https://www.huntingdonshire.gov.uk/council/finance/statement-of-accounts",
    sources: [
      { title: "Statement of Accounts", url: "https://www.huntingdonshire.gov.uk/council/finance/statement-of-accounts" },
    ],
  },
  "Hyndburn": {
    accounts_url: "https://www.hyndburnbc.gov.uk/statement-of-accounts/",
    sources: [
      { title: "Statement of Accounts", url: "https://www.hyndburnbc.gov.uk/statement-of-accounts/" },
    ],
  },
  "Ipswich": {
    accounts_url: "https://www.ipswich.gov.uk/your-council/council-budgets-and-spending/statement-accounts",
    sources: [
      { title: "Statement of Accounts", url: "https://www.ipswich.gov.uk/your-council/council-budgets-and-spending/statement-accounts" },
    ],
  },
  "King's Lynn & West Norfolk": {
    accounts_url: "https://www.west-norfolk.gov.uk/finance/statement-of-accounts",
    sources: [
      { title: "Statement of Accounts", url: "https://www.west-norfolk.gov.uk/finance/statement-of-accounts" },
    ],
  },
  "Lancaster": {
    accounts_url: "https://www.lancaster.gov.uk/the-council-and-democracy/budgets-and-spending",
    sources: [
      { title: "Statement of Accounts", url: "https://www.lancaster.gov.uk/the-council-and-democracy/budgets-and-spending" },
    ],
  },
  "Lewes": {
    accounts_url: "https://www.lewes-eastbourne.gov.uk/article/1116/Statement-of-accounts",
    sources: [
      { title: "Statement of Accounts", url: "https://www.lewes-eastbourne.gov.uk/article/1116/Statement-of-accounts" },
    ],
  },
  "Lichfield": {
    accounts_url: "https://www.lichfielddc.gov.uk/performance-efficiency/statements-summaries-accounts-external-audit-letters-1/1",
    sources: [
      { title: "Statement of Accounts", url: "https://www.lichfielddc.gov.uk/performance-efficiency/statements-summaries-accounts-external-audit-letters-1/1" },
    ],
  },
  "Lincoln": {
    accounts_url: "https://www.lincoln.gov.uk/your-council/policies-publications-and-information/financial-policies-and-publications/statement-of-accounts/",
    sources: [
      { title: "Statement of Accounts", url: "https://www.lincoln.gov.uk/your-council/policies-publications-and-information/financial-policies-and-publications/statement-of-accounts/" },
    ],
  },
  "Maidstone": {
    accounts_url: "https://www.maidstone.gov.uk/council/finance/statement-of-accounts",
    sources: [
      { title: "Statement of Accounts", url: "https://www.maidstone.gov.uk/council/finance/statement-of-accounts" },
    ],
  },
  "Maldon": {
    accounts_url: "https://www.maldon.gov.uk/info/20070/finance/9268/statement_of_accounts",
    sources: [
      { title: "Statement of Accounts", url: "https://www.maldon.gov.uk/info/20070/finance/9268/statement_of_accounts" },
    ],
  },
  "Malvern Hills": {
    accounts_url: "https://www.malvernhills.gov.uk/council/finance/statement-of-accounts",
    sources: [
      { title: "Statement of Accounts", url: "https://www.malvernhills.gov.uk/council/finance/statement-of-accounts" },
    ],
  },
  "Mansfield": {
    accounts_url: "https://www.mansfield.gov.uk/finance/annual-statement-accounts/1",
    sources: [
      { title: "Statement of Accounts", url: "https://www.mansfield.gov.uk/finance/annual-statement-accounts/1" },
    ],
  },
  "Melton": {
    accounts_url: "https://www.melton.gov.uk/council/finance/statement-of-accounts",
    sources: [
      { title: "Statement of Accounts", url: "https://www.melton.gov.uk/council/finance/statement-of-accounts" },
    ],
  },
  "Mid Devon": {
    accounts_url: "https://www.middevon.gov.uk/council-and-democracy/finance/statement-of-accounts",
    sources: [
      { title: "Statement of Accounts", url: "https://www.middevon.gov.uk/council-and-democracy/finance/statement-of-accounts" },
    ],
  },
  "Mid Suffolk": {
    accounts_url: "https://www.midsuffolk.gov.uk/w/finance-landing-page-1",
    sources: [
      { title: "Statement of Accounts", url: "https://www.midsuffolk.gov.uk/w/finance-landing-page-1" },
    ],
  },
  "Mid Sussex": {
    accounts_url: "https://www.midsussex.gov.uk/about-us/finance-reports/",
    sources: [
      { title: "Statement of Accounts", url: "https://www.midsussex.gov.uk/about-us/finance-reports/" },
    ],
  },
  "Mole Valley": {
    accounts_url: "https://www.molevalley.gov.uk/my-council/statement-of-accounts/",
    sources: [
      { title: "Statement of Accounts", url: "https://www.molevalley.gov.uk/my-council/statement-of-accounts/" },
    ],
  },
  "New Forest": {
    accounts_url: "https://www.newforest.gov.uk/article/1143/Statement-of-Accounts",
    sources: [
      { title: "Statement of Accounts", url: "https://www.newforest.gov.uk/article/1143/Statement-of-Accounts" },
    ],
  },
  "Newark & Sherwood": {
    accounts_url: "https://www.newark-sherwooddc.gov.uk/statementofaccounts/",
    sources: [
      { title: "Statement of Accounts", url: "https://www.newark-sherwooddc.gov.uk/statementofaccounts/" },
    ],
  },
  "Newcastle-under-Lyme": {
    accounts_url: "https://www.newcastle-staffs.gov.uk/finance/statement-accounts",
    sources: [
      { title: "Statement of Accounts", url: "https://www.newcastle-staffs.gov.uk/finance/statement-accounts" },
    ],
  },
  "North Devon": {
    accounts_url: "https://www.northdevon.gov.uk/council/performance-and-spending/budgets-and-spending/statement-of-accounts",
    sources: [
      { title: "Statement of Accounts", url: "https://www.northdevon.gov.uk/council/performance-and-spending/budgets-and-spending/statement-of-accounts" },
    ],
  },
  "North East Derbyshire": {
    accounts_url: "https://www.ne-derbyshire.gov.uk/council/finance/statement-of-accounts",
    sources: [
      { title: "Statement of Accounts", url: "https://www.ne-derbyshire.gov.uk/council/finance/statement-of-accounts" },
    ],
  },
  "North Hertfordshire": {
    accounts_url: "https://www.north-herts.gov.uk/statement-accounts",
    sources: [
      { title: "Statement of Accounts", url: "https://www.north-herts.gov.uk/statement-accounts" },
    ],
  },
  "North Kesteven": {
    accounts_url: "https://www.n-kesteven.gov.uk/your-council/facts-and-figures-about-the-council/council-spending/statement-of-accounts/",
    sources: [
      { title: "Statement of Accounts", url: "https://www.n-kesteven.gov.uk/your-council/facts-and-figures-about-the-council/council-spending/statement-of-accounts/" },
    ],
  },
  "North Norfolk": {
    accounts_url: "https://www.north-norfolk.gov.uk/tasks/finance/view-the-councils-statement-of-accounts/",
    sources: [
      { title: "Statement of Accounts", url: "https://www.north-norfolk.gov.uk/tasks/finance/view-the-councils-statement-of-accounts/" },
    ],
  },
  "North Warwickshire": {
    accounts_url: "https://www.northwarks.gov.uk/council/finance/statement-of-accounts",
    sources: [
      { title: "Statement of Accounts", url: "https://www.northwarks.gov.uk/council/finance/statement-of-accounts" },
    ],
  },
  "North West Leicestershire": {
    accounts_url: "https://www.nwleics.gov.uk/pages/statement_of_accounts",
    sources: [
      { title: "Statement of Accounts", url: "https://www.nwleics.gov.uk/pages/statement_of_accounts" },
    ],
  },
  "Norwich": {
    accounts_url: "https://www.norwich.gov.uk/your-council-explained/transparency-and-accountability/statement-accounts",
    sources: [
      { title: "Statement of Accounts", url: "https://www.norwich.gov.uk/your-council-explained/transparency-and-accountability/statement-accounts" },
    ],
  },
  "Nuneaton & Bedworth": {
    accounts_url: "https://www.nuneatonandbedworth.gov.uk/council/finance/statement-of-accounts",
    sources: [
      { title: "Statement of Accounts", url: "https://www.nuneatonandbedworth.gov.uk/council/finance/statement-of-accounts" },
    ],
  },
  "Oadby & Wigston": {
    accounts_url: "https://www.oadby-wigston.gov.uk/pages/financial_report",
    sources: [
      { title: "Statement of Accounts", url: "https://www.oadby-wigston.gov.uk/pages/financial_report" },
    ],
  },
  "Oxford": {
    accounts_url: "https://www.oxford.gov.uk/downloads/download/65/statement-of-accounts",
    sources: [
      { title: "Statement of Accounts", url: "https://www.oxford.gov.uk/downloads/download/65/statement-of-accounts" },
    ],
  },
  "Pendle": {
    accounts_url: "https://www.pendle.gov.uk/council/finance/statement-of-accounts",
    sources: [
      { title: "Statement of Accounts", url: "https://www.pendle.gov.uk/council/finance/statement-of-accounts" },
    ],
  },
  "Preston": {
    accounts_url: "https://www.preston.gov.uk/statementofaccounts",
    sources: [
      { title: "Statement of Accounts", url: "https://www.preston.gov.uk/statementofaccounts" },
    ],
  },
  "Redditch": {
    accounts_url: "https://www.redditchbc.gov.uk/council/finance/statement-of-accounts",
    sources: [
      { title: "Statement of Accounts", url: "https://www.redditchbc.gov.uk/council/finance/statement-of-accounts" },
    ],
  },
  "Reigate & Banstead": {
    accounts_url: "https://www.reigate-banstead.gov.uk/info/20210/finance/268/annual_financial_reports",
    sources: [
      { title: "Statement of Accounts", url: "https://www.reigate-banstead.gov.uk/info/20210/finance/268/annual_financial_reports" },
    ],
  },
  "Ribble Valley": {
    accounts_url: "https://www.ribblevalley.gov.uk/statement-accounts/statement-accounts-1",
    sources: [
      { title: "Statement of Accounts", url: "https://www.ribblevalley.gov.uk/statement-accounts/statement-accounts-1" },
    ],
  },
  "Rochford": {
    accounts_url: "https://www.rochford.gov.uk/council/finance/statement-of-accounts",
    sources: [
      { title: "Statement of Accounts", url: "https://www.rochford.gov.uk/council/finance/statement-of-accounts" },
    ],
  },
  "Rossendale": {
    accounts_url: "https://www.rossendale.gov.uk/budgets-finance/annual-accounts",
    sources: [
      { title: "Statement of Accounts", url: "https://www.rossendale.gov.uk/budgets-finance/annual-accounts" },
    ],
  },
  "Rother": {
    accounts_url: "https://www.rother.gov.uk/performance-and-spending/budgets-and-accounts/",
    sources: [
      { title: "Statement of Accounts", url: "https://www.rother.gov.uk/performance-and-spending/budgets-and-accounts/" },
    ],
  },
  "Rugby": {
    accounts_url: "https://www.rugby.gov.uk/finance/statement-of-accounts",
    sources: [
      { title: "Statement of Accounts", url: "https://www.rugby.gov.uk/finance/statement-of-accounts" },
    ],
  },
  "Runnymede": {
    accounts_url: "https://www.runnymede.gov.uk/finance/statement-accounts",
    sources: [
      { title: "Statement of Accounts", url: "https://www.runnymede.gov.uk/finance/statement-accounts" },
    ],
  },
  "Rushcliffe": {
    accounts_url: "https://www.rushcliffe.gov.uk/about-us/about-the-council/council-spending/statement-of-accounts/",
    sources: [
      { title: "Statement of Accounts", url: "https://www.rushcliffe.gov.uk/about-us/about-the-council/council-spending/statement-of-accounts/" },
    ],
  },
  "Rushmoor": {
    accounts_url: "https://www.rushmoor.gov.uk/council/finance/statement-of-accounts",
    sources: [
      { title: "Statement of Accounts", url: "https://www.rushmoor.gov.uk/council/finance/statement-of-accounts" },
    ],
  },
  "Sevenoaks": {
    accounts_url: "https://www.sevenoaks.gov.uk/finance/statement-of-accounts",
    sources: [
      { title: "Statement of Accounts", url: "https://www.sevenoaks.gov.uk/finance/statement-of-accounts" },
    ],
  },
  "South Cambridgeshire": {
    accounts_url: "https://www.scambs.gov.uk/your-council-and-democracy/performance-and-plans/council-plans-and-reports/council-accounts-and-annual-governance-statement/",
    sources: [
      { title: "Statement of Accounts", url: "https://www.scambs.gov.uk/your-council-and-democracy/performance-and-plans/council-plans-and-reports/council-accounts-and-annual-governance-statement/" },
    ],
  },
  "South Derbyshire": {
    accounts_url: "https://www.southderbyshire.gov.uk/about-us/financial-information/draft-statement-of-accounts-2022-23",
    sources: [
      { title: "Statement of Accounts", url: "https://www.southderbyshire.gov.uk/about-us/financial-information/draft-statement-of-accounts-2022-23" },
    ],
  },
  "South Hams": {
    accounts_url: "https://www.southhams.gov.uk/article/3769/Annual-Accounts",
    sources: [
      { title: "Statement of Accounts", url: "https://www.southhams.gov.uk/article/3769/Annual-Accounts" },
    ],
  },
  "South Holland": {
    accounts_url: "https://www.sholland.gov.uk/article/5578/Financial-Statements",
    sources: [
      { title: "Statement of Accounts", url: "https://www.sholland.gov.uk/article/5578/Financial-Statements" },
    ],
  },
  "South Kesteven": {
    accounts_url: "https://www.southkesteven.gov.uk/council/finance/statement-of-accounts",
    sources: [
      { title: "Statement of Accounts", url: "https://www.southkesteven.gov.uk/council/finance/statement-of-accounts" },
    ],
  },
  "South Norfolk": {
    accounts_url: "https://www.south-norfolk.gov.uk/statement-of-accounts",
    sources: [
      { title: "Statement of Accounts", url: "https://www.south-norfolk.gov.uk/statement-of-accounts" },
    ],
  },
  "South Oxfordshire": {
    accounts_url: "https://www.southoxon.gov.uk/south-oxfordshire-district-council/about-the-council/council-finances/our-finances/",
    sources: [
      { title: "Statement of Accounts", url: "https://www.southoxon.gov.uk/south-oxfordshire-district-council/about-the-council/council-finances/our-finances/" },
    ],
  },
  "South Ribble": {
    accounts_url: "https://www.southribble.gov.uk/article/1235/Statement-of-accounts",
    sources: [
      { title: "Statement of Accounts", url: "https://www.southribble.gov.uk/article/1235/Statement-of-accounts" },
    ],
  },
  "South Staffordshire": {
    accounts_url: "https://www.sstaffs.gov.uk/council/finance/statement-of-accounts",
    sources: [
      { title: "Statement of Accounts", url: "https://www.sstaffs.gov.uk/council/finance/statement-of-accounts" },
    ],
  },
  "Spelthorne": {
    accounts_url: "https://www.spelthorne.gov.uk/article/16713/Statement-of-Accounts",
    sources: [
      { title: "Statement of Accounts", url: "https://www.spelthorne.gov.uk/article/16713/Statement-of-Accounts" },
    ],
  },
  "St Albans": {
    accounts_url: "https://www.stalbans.gov.uk/council-and-democracy/PerformSpendAccount/Statement-of-accounts/",
    sources: [
      { title: "Statement of Accounts", url: "https://www.stalbans.gov.uk/council-and-democracy/PerformSpendAccount/Statement-of-accounts/" },
    ],
  },
  "Stafford": {
    accounts_url: "https://www.staffordbc.gov.uk/statement-of-accounts",
    sources: [
      { title: "Statement of Accounts", url: "https://www.staffordbc.gov.uk/statement-of-accounts" },
    ],
  },
  "Staffordshire Moorlands": {
    accounts_url: "https://www.staffsmoorlands.gov.uk/article/1331/Annual-statement-of-accounts",
    sources: [
      { title: "Statement of Accounts", url: "https://www.staffsmoorlands.gov.uk/article/1331/Annual-statement-of-accounts" },
    ],
  },
  "Stevenage": {
    accounts_url: "https://www.stevenage.gov.uk/about-the-council/financial-management",
    sources: [
      { title: "Statement of Accounts", url: "https://www.stevenage.gov.uk/about-the-council/financial-management" },
    ],
  },
  "Stratford-on-Avon": {
    accounts_url: "https://www.stratford.gov.uk/council-democracy/statement-of-accounts.cfm",
    sources: [
      { title: "Statement of Accounts", url: "https://www.stratford.gov.uk/council-democracy/statement-of-accounts.cfm" },
    ],
  },
  "Stroud": {
    accounts_url: "https://www.stroud.gov.uk/council-and-democracy/transparency-and-open-data/transparency-data/statement-of-accounts/",
    sources: [
      { title: "Statement of Accounts", url: "https://www.stroud.gov.uk/council-and-democracy/transparency-and-open-data/transparency-data/statement-of-accounts/" },
    ],
  },
  "Surrey Heath": {
    accounts_url: "https://www.surreyheath.gov.uk/budgets-and-finances/statement-accounts",
    sources: [
      { title: "Statement of Accounts", url: "https://www.surreyheath.gov.uk/budgets-and-finances/statement-accounts" },
    ],
  },
  "Swale": {
    accounts_url: "https://swale.gov.uk/news-and-your-council/publications/council/statement-of-accounts",
    sources: [
      { title: "Statement of Accounts", url: "https://swale.gov.uk/news-and-your-council/publications/council/statement-of-accounts" },
    ],
  },
  "Tamworth": {
    accounts_url: "https://www.tamworth.gov.uk/notice-conclusion-audit",
    sources: [
      { title: "Statement of Accounts", url: "https://www.tamworth.gov.uk/notice-conclusion-audit" },
    ],
  },
  "Tandridge": {
    accounts_url: "https://www.tandridge.gov.uk/Your-council/Finance/Financial-statements",
    sources: [
      { title: "Statement of Accounts", url: "https://www.tandridge.gov.uk/Your-council/Finance/Financial-statements" },
    ],
  },
  "Teignbridge": {
    accounts_url: "https://www.teignbridge.gov.uk/council-and-democracy/finance/statement-of-accounts/",
    sources: [
      { title: "Statement of Accounts", url: "https://www.teignbridge.gov.uk/council-and-democracy/finance/statement-of-accounts/" },
    ],
  },
  "Tendring": {
    accounts_url: "https://www.tendringdc.gov.uk/council/finance/statement-of-accounts",
    sources: [
      { title: "Statement of Accounts", url: "https://www.tendringdc.gov.uk/council/finance/statement-of-accounts" },
    ],
  },
  "Test Valley": {
    accounts_url: "https://www.testvalley.gov.uk/aboutyourcouncil/accesstoinformation/councilfinances/statementofaccounts",
    sources: [
      { title: "Statement of Accounts", url: "https://www.testvalley.gov.uk/aboutyourcouncil/accesstoinformation/councilfinances/statementofaccounts" },
    ],
  },
  "Tewkesbury": {
    accounts_url: "https://www.tewkesbury.gov.uk/council/finance/statement-of-accounts",
    sources: [
      { title: "Statement of Accounts", url: "https://www.tewkesbury.gov.uk/council/finance/statement-of-accounts" },
    ],
  },
  "Thanet": {
    accounts_url: "https://www.thanet.gov.uk/info-pages/statement-of-accounts/",
    sources: [
      { title: "Statement of Accounts", url: "https://www.thanet.gov.uk/info-pages/statement-of-accounts/" },
    ],
  },
  "Three Rivers": {
    accounts_url: "https://www.threerivers.gov.uk/egcl-page/statement-of-accounts",
    sources: [
      { title: "Statement of Accounts", url: "https://www.threerivers.gov.uk/egcl-page/statement-of-accounts" },
    ],
  },
  "Tonbridge & Malling": {
    accounts_url: "https://www.tmbc.gov.uk/council/finance/statement-of-accounts",
    sources: [
      { title: "Statement of Accounts", url: "https://www.tmbc.gov.uk/council/finance/statement-of-accounts" },
    ],
  },
  "Torridge": {
    accounts_url: "https://www.torridge.gov.uk/article/20232/Statement-of-Accounts-and-notices-for-current-and-previous-years",
    sources: [
      { title: "Statement of Accounts", url: "https://www.torridge.gov.uk/article/20232/Statement-of-Accounts-and-notices-for-current-and-previous-years" },
    ],
  },
  "Tunbridge Wells": {
    accounts_url: "https://tunbridgewells.gov.uk/council/performance-and-spending/financial-reports-budget-and-audits",
    sources: [
      { title: "Statement of Accounts", url: "https://tunbridgewells.gov.uk/council/performance-and-spending/financial-reports-budget-and-audits" },
    ],
  },
  "Uttlesford": {
    accounts_url: "https://www.uttlesford.gov.uk/article/5439/Budget-book-and-statement-of-accounts",
    sources: [
      { title: "Statement of Accounts", url: "https://www.uttlesford.gov.uk/article/5439/Budget-book-and-statement-of-accounts" },
    ],
  },
  "Vale of White Horse": {
    accounts_url: "https://www.whitehorsedc.gov.uk/vale-of-white-horse-district-council/about-the-council/council-finances/statement-of-accounts-annual-governance-statement/",
    sources: [
      { title: "Statement of Accounts", url: "https://www.whitehorsedc.gov.uk/vale-of-white-horse-district-council/about-the-council/council-finances/statement-of-accounts-annual-governance-statement/" },
    ],
  },
  "Warwick": {
    accounts_url: "https://www.warwickdc.gov.uk/info/20736/council_finances/389/statement_of_accounts",
    sources: [
      { title: "Statement of Accounts", url: "https://www.warwickdc.gov.uk/info/20736/council_finances/389/statement_of_accounts" },
    ],
  },
  "Watford": {
    accounts_url: "https://www.watford.gov.uk/downloads/download/118/watford-borough-council---statement-of-accounts",
    sources: [
      { title: "Statement of Accounts", url: "https://www.watford.gov.uk/downloads/download/118/watford-borough-council---statement-of-accounts" },
    ],
  },
  "Waverley": {
    accounts_url: "https://www.waverley.gov.uk/services/council-information/about-waverley-borough-council/financial-information",
    sources: [
      { title: "Statement of Accounts", url: "https://www.waverley.gov.uk/services/council-information/about-waverley-borough-council/financial-information" },
    ],
  },
  "Wealden": {
    accounts_url: "https://www.wealden.gov.uk/transparency-spending-and-performance/finance/the-finances-of-the-council/statement-of-accounts/",
    sources: [
      { title: "Statement of Accounts", url: "https://www.wealden.gov.uk/transparency-spending-and-performance/finance/the-finances-of-the-council/statement-of-accounts/" },
    ],
  },
  "Welwyn Hatfield": {
    accounts_url: "https://www.welhat.gov.uk/finance/statement-of-accounts",
    sources: [
      { title: "Statement of Accounts", url: "https://www.welhat.gov.uk/finance/statement-of-accounts" },
    ],
  },
  "West Devon": {
    accounts_url: "https://www.westdevon.gov.uk/article/3769/Annual-Accounts",
    sources: [
      { title: "Statement of Accounts", url: "https://www.westdevon.gov.uk/article/3769/Annual-Accounts" },
    ],
  },
  "West Lancashire": {
    accounts_url: "https://www.westlancs.gov.uk/about-the-council/spending-strategies-performance/council-budget.aspx",
    sources: [
      { title: "Statement of Accounts", url: "https://www.westlancs.gov.uk/about-the-council/spending-strategies-performance/council-budget.aspx" },
    ],
  },
  "West Lindsey": {
    accounts_url: "https://www.west-lindsey.gov.uk/council-democracy/facts-figures/council-spending/statement-accounts-annual-governance-statements",
    sources: [
      { title: "Statement of Accounts", url: "https://www.west-lindsey.gov.uk/council-democracy/facts-figures/council-spending/statement-accounts-annual-governance-statements" },
    ],
  },
  "West Oxfordshire": {
    accounts_url: "https://www.westoxon.gov.uk/council/finance/statement-of-accounts",
    sources: [
      { title: "Statement of Accounts", url: "https://www.westoxon.gov.uk/council/finance/statement-of-accounts" },
    ],
  },
  "West Suffolk": {
    accounts_url: "https://www.westsuffolk.gov.uk/council/finance_and_statistics/statementofaccounts.cfm",
    sources: [
      { title: "Statement of Accounts", url: "https://www.westsuffolk.gov.uk/council/finance_and_statistics/statementofaccounts.cfm" },
    ],
  },
  "Winchester": {
    accounts_url: "https://www.winchester.gov.uk/council/finance/statement-of-accounts",
    sources: [
      { title: "Statement of Accounts", url: "https://www.winchester.gov.uk/council/finance/statement-of-accounts" },
    ],
  },
  "Woking": {
    accounts_url: "https://www.woking.gov.uk/data-and-transparency/finance/yearly-statement-accounts",
    sources: [
      { title: "Statement of Accounts", url: "https://www.woking.gov.uk/data-and-transparency/finance/yearly-statement-accounts" },
    ],
  },
  "Worcester": {
    accounts_url: "https://www.worcester.gov.uk/accounts-audit",
    sources: [
      { title: "Statement of Accounts", url: "https://www.worcester.gov.uk/accounts-audit" },
    ],
  },
  "Worthing": {
    accounts_url: "https://www.adur-worthing.gov.uk/about-the-councils/finance/statement-of-accounts/",
    sources: [
      { title: "Statement of Accounts", url: "https://www.adur-worthing.gov.uk/about-the-councils/finance/statement-of-accounts/" },
    ],
  },
  "Wychavon": {
    accounts_url: "https://www.wychavon.gov.uk/the-draft-statement-of-accounts-are-now-available-to-view",
    sources: [
      { title: "Statement of Accounts", url: "https://www.wychavon.gov.uk/the-draft-statement-of-accounts-are-now-available-to-view" },
    ],
  },
  "Wyre": {
    accounts_url: "https://www.wyre.gov.uk/council-budgets-spending-2/statement-accounts",
    sources: [
      { title: "Statement of Accounts", url: "https://www.wyre.gov.uk/council-budgets-spending-2/statement-accounts" },
    ],
  },
  "Wyre Forest": {
    accounts_url: "https://www.wyreforestdc.gov.uk/council/finance/statement-of-accounts",
    sources: [
      { title: "Statement of Accounts", url: "https://www.wyreforestdc.gov.uk/council/finance/statement-of-accounts" },
    ],
  },
};

// ============================================================
// Main script
// ============================================================

console.log('Reading districts.ts...');
let content = readFileSync(filePath, 'utf-8');
const lines = content.split('\n');

const INDENT = '      '; // 6 spaces to match existing indentation
const NEW_DATE = '2026-02-25';

let enrichedCount = 0;
let skippedCount = 0;
let notFoundCount = 0;
const warnings = [];

for (const [councilName, data] of Object.entries(enrichments)) {
  // Skip Folkestone & Hythe (already enriched) but still update last_verified
  const isSkip = data.skip === true;

  // Find the line with name: "CouncilName"
  // We need to escape special regex characters in the council name
  const escapedName = councilName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const nameRegex = new RegExp(`^\\s*name:\\s*"${escapedName}"\\s*,?\\s*$`);

  let nameLineIdx = -1;
  for (let i = 0; i < lines.length; i++) {
    if (nameRegex.test(lines[i])) {
      nameLineIdx = i;
      break;
    }
  }

  if (nameLineIdx === -1) {
    console.error(`  ERROR: Could not find council "${councilName}" in file`);
    notFoundCount++;
    continue;
  }

  // Find the next last_verified line after the name
  const lastVerifiedRegex = /^\s*last_verified:\s*"/;
  let lvLineIdx = -1;
  for (let i = nameLineIdx + 1; i < lines.length; i++) {
    if (lastVerifiedRegex.test(lines[i])) {
      lvLineIdx = i;
      break;
    }
  }

  if (lvLineIdx === -1) {
    console.error(`  ERROR: Could not find last_verified for "${councilName}"`);
    notFoundCount++;
    continue;
  }

  // Safety check: no other name: line between the council name and last_verified
  const otherNameRegex = /^\s*name:\s*"/;
  let hasSafetyIssue = false;
  for (let i = nameLineIdx + 1; i < lvLineIdx; i++) {
    if (otherNameRegex.test(lines[i])) {
      // Check it's not a precept/authority name or sub-object name
      // Real council name lines look like:    name: "Council Name",
      // but precept entries look like: { authority: "...", name: "..." }
      // and service entries look like: { name: "Waste Collection", ... }
      // We only worry about top-level name lines that are at low indentation (<=6 spaces)
      const leadingSpaces = lines[i].match(/^(\s*)/)[1].length;
      if (leadingSpaces <= 6) {
        warnings.push(`  WARNING: Another council name found between "${councilName}" (line ${nameLineIdx + 1}) and its last_verified (line ${lvLineIdx + 1}): ${lines[i].trim()}`);
        hasSafetyIssue = true;
        break;
      }
    }
  }

  if (hasSafetyIssue) {
    skippedCount++;
    continue;
  }

  if (isSkip) {
    // Just update last_verified for Folkestone & Hythe
    lines[lvLineIdx] = lines[lvLineIdx].replace(/last_verified:\s*"[^"]*"/, `last_verified: "${NEW_DATE}"`);
    enrichedCount++;
    console.log(`  Updated last_verified for "${councilName}" (already enriched)`);
    continue;
  }

  // Check if this council already has accounts_url (shouldn't happen except F&H)
  let alreadyHasAccountsUrl = false;
  for (let i = nameLineIdx + 1; i < lvLineIdx; i++) {
    if (/^\s*accounts_url:/.test(lines[i])) {
      alreadyHasAccountsUrl = true;
      break;
    }
  }

  if (alreadyHasAccountsUrl) {
    // Just update last_verified
    lines[lvLineIdx] = lines[lvLineIdx].replace(/last_verified:\s*"[^"]*"/, `last_verified: "${NEW_DATE}"`);
    enrichedCount++;
    console.log(`  Updated last_verified for "${councilName}" (already has accounts_url)`);
    continue;
  }

  // Build the new lines to insert BEFORE last_verified
  const newLines = [];

  // accounts_url
  newLines.push(`${INDENT}accounts_url: "${data.accounts_url}",`);

  // transparency_url (optional)
  if (data.transparency_url) {
    newLines.push(`${INDENT}transparency_url: "${data.transparency_url}",`);
  }

  // sources array
  newLines.push(`${INDENT}sources: [`);
  for (const source of data.sources) {
    newLines.push(`${INDENT}  { title: "${source.title}", url: "${source.url}" },`);
  }
  newLines.push(`${INDENT}],`);

  // Insert new lines before last_verified
  // Also add a blank line before last_verified for readability
  lines.splice(lvLineIdx, 0, ...newLines);

  // Update last_verified (which has shifted by newLines.length)
  const newLvIdx = lvLineIdx + newLines.length;
  lines[newLvIdx] = lines[newLvIdx].replace(/last_verified:\s*"[^"]*"/, `last_verified: "${NEW_DATE}"`);

  enrichedCount++;
  console.log(`  Enriched "${councilName}"`);
}

// Write the file back
const output = lines.join('\n');
writeFileSync(filePath, output, 'utf-8');

console.log('\n=== Summary ===');
console.log(`Enriched: ${enrichedCount}`);
console.log(`Skipped (safety): ${skippedCount}`);
console.log(`Not found: ${notFoundCount}`);
console.log(`Total in enrichments map: ${Object.keys(enrichments).length}`);

if (warnings.length > 0) {
  console.log('\nWarnings:');
  for (const w of warnings) {
    console.log(w);
  }
}

console.log('\nDone!');
