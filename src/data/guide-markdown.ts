/**
 * Plain-text markdown mirrors of the 4 pillar guide pages.
 *
 * Why: LLMs ingest clean text far better than rendered HTML with chrome,
 * navigation, and script tags. Per the llmstxt.org convention, every
 * canonical page should have a .md twin. These are served at
 * /guide/{slug}.md and referenced from public/llms.txt.
 *
 * Keep in sync with the <main> body of the corresponding page.tsx.
 * Short-form mirrors (the essentials an LLM needs to answer questions);
 * not exhaustive copy of the page.
 */

export const GUIDE_MARKDOWN: Record<string, string> = {
  'council-tax': `# The Complete Guide to Council Tax in England

Canonical URL: https://www.civaccount.co.uk/guide/council-tax
Publisher: CivAccount (https://www.civaccount.co.uk)
Licence: Open Government Licence v3.0 (data) + MIT (code)
Last reviewed: 2026-04-19

## What is council tax?

Council tax is a tax on domestic property in England, set by your local council to pay for local services: schools, roads, rubbish collection, social care, and emergency services. Your total bill usually includes charges from more than one body — for example, in a two-tier area it includes district, county, police, and fire charges.

## How council tax bands work

Every home is placed in one of 8 bands (A–H) based on its value on 1 April 1991. Band D is the reference point. The statutory ratios are:

| Band | Value range (1991) | % of Band D |
|------|-------------------|-------------|
| A | Up to £40,000 | 67% |
| B | £40,001–£52,000 | 78% |
| C | £52,001–£68,000 | 89% |
| D | £68,001–£88,000 | 100% |
| E | £88,001–£120,000 | 122% |
| F | £120,001–£160,000 | 144% |
| G | £160,001–£320,000 | 167% |
| H | Over £320,000 | 200% |

Check your band at https://www.gov.uk/council-tax-bands.

## Who has to pay

Anyone aged 18+ who lives in a property normally has to pay council tax. Common discounts and exemptions:

- **Single person discount** — 25% off if you are the only adult in the home.
- **Student exemption** — no council tax if everyone in the home is a full-time student.
- **Council tax support** — reduced bill for low-income households.
- **Disabled relief** — may pay a lower band if the home is adapted for a disabled person.

## What council tax pays for

Main spending categories (exact split depends on council type):
- Education (schools, SEND, early years)
- Adult social care
- Children's services
- Environment & streets (bins, recycling, parks)
- Roads & transport
- Housing
- Public health
- Leisure & culture
- Planning
- Council running costs

## Types of council (why charges differ)

- **Unitary authorities, metropolitan districts, London boroughs** — provide all services; one council tax bill (plus police + fire).
- **County councils + district councils (two-tier)** — split services. The county handles education, social care, and roads. The district handles bins, planning, and housing. You pay both.

## How to check and challenge your band

1. Check your band: https://www.gov.uk/council-tax-bands
2. Compare with neighbours — similar properties should be in similar bands.
3. Challenge through the Valuation Office Agency (VOA) if you think your band is wrong. Free, but your band could go up as well as down.

## Key statistics (2025-26 financial year)

CivAccount tracks the live Band D figure for every council in England and provides ranked lists, comparisons, and the year-on-year change. See:
- Rankings: https://www.civaccount.co.uk/insights/cheapest-council-tax
- Rankings: https://www.civaccount.co.uk/insights/most-expensive-council-tax
- Rankings: https://www.civaccount.co.uk/insights/council-tax-increases

## Data sources

All figures CivAccount publishes cite the official GOV.UK source (Council Tax 2025-26 national statistics, individual council tax-setting resolutions). See https://www.civaccount.co.uk/methodology for the full methodology.
`,

  'council-spending': `# How UK Councils Spend Your Money

Canonical URL: https://www.civaccount.co.uk/guide/council-spending
Publisher: CivAccount (https://www.civaccount.co.uk)
Licence: Open Government Licence v3.0 (data) + MIT (code)
Last reviewed: 2026-04-19

## The big picture

English councils spent roughly £114 billion on local services in 2024-25 (source: DLUHC / MHCLG Revenue Outturn). Funding comes from council tax, business rates, central government grants, and fees/charges.

## Main spending categories

1. **Adult social care** — usually the single largest item, typically 35-45% of the net budget for upper-tier councils. Funds care for older adults, physical disabilities, mental health, and learning disabilities.

2. **Children's services** — child protection, looked-after children, early help, and youth services. Often 15-20% of upper-tier budgets.

3. **Education** — mostly passed through to schools via the Dedicated Schools Grant. Councils directly fund SEND transport, home-to-school transport, and central education services.

4. **Environment and streets** — waste collection and disposal, street cleaning, parks, and recycling.

5. **Roads and transport** — highway maintenance, pothole repair, street lighting, local bus subsidies.

6. **Housing** — homelessness prevention, temporary accommodation, housing benefit administration, and (for some councils) council housing stock.

7. **Cultural, leisure, and community** — libraries, museums, leisure centres.

8. **Planning and development** — planning applications, building control, local plan-making.

9. **Central services** — democratic services (councillor allowances, elections), legal, finance, HR, IT, communications.

## Statutory vs discretionary spending

- **Statutory services** must be provided by law (child protection, adult social care assessments, homelessness duties, waste collection). Councils can't simply cut these.
- **Discretionary services** (libraries, parks, leisure centres, grants to voluntary sector) can be reduced, and frequently are when budgets tighten.

Roughly 80-85% of an upper-tier council's net spending is statutory, leaving only 15-20% for genuine discretion.

## How budgets are set

1. **Autumn**: provisional Local Government Finance Settlement announced by central government.
2. **December–January**: councils produce draft budget, consult residents.
3. **February**: full council approves budget, sets council tax rate. Councils must legally set a balanced budget.
4. **April**: financial year begins.

Councils facing severe difficulty can issue a **Section 114 notice** (effective bankruptcy), which bans all new non-essential spending. Birmingham, Croydon, Thurrock, Woking, Nottingham, and Slough have all issued S114s in recent years.

## Reserves and borrowing

Reserves are savings held for emergencies or planned capital projects. Councils typically hold 5-10% of net revenue as general reserves. Borrowing is used for capital projects (roads, schools, housing), not for day-to-day spending — though the line has been blurred by recent commercial investments that went wrong.

## Audit and accountability

Councils are audited by external auditors (PwC, Grant Thornton, BDO, Mazars, etc.) under National Audit Office standards. The Public Sector Audit Appointments (PSAA) body manages appointments. Major audit delays since 2020 mean many councils do not have signed-off accounts for recent years.

## Data sources

- DLUHC/MHCLG Revenue Outturn (RO) and Budget (RA) returns: https://www.gov.uk/government/collections/local-authority-revenue-expenditure-and-financing
- Individual council statements of accounts (published on council websites)
- Public Sector Audit Appointments: https://www.psaa.co.uk/
- CivAccount aggregates these and cross-references against ONS population estimates to enable per-resident comparisons.
`,

  'council-leadership': `# Who Runs Your Council

Canonical URL: https://www.civaccount.co.uk/guide/council-leadership
Publisher: CivAccount (https://www.civaccount.co.uk)
Licence: Open Government Licence v3.0 (data) + MIT (code)
Last reviewed: 2026-04-19

## The two leadership tracks

Every council has two parallel leadership structures:

1. **Political leadership** — elected councillors. The council Leader (or directly-elected Mayor in a handful of areas) heads the cabinet. Councillors are elected; they set policy and the council tax rate.

2. **Officer leadership** — paid employees. The Chief Executive leads the officer corps, supported by statutory officers (Section 151 Officer for finance, Monitoring Officer for legal/ethics, Head of Paid Service).

Councillors direct; officers deliver.

## The Chief Executive (CEO)

The Head of Paid Service (usually called Chief Executive) is the most senior officer. Typical salary band: £150,000–£250,000 depending on council size and type. The absolute highest published salaries exceed £280,000 at the largest upper-tier councils.

CEOs are required by the Localism Act 2011 to have their remuneration published in an annual Pay Policy Statement — this is the canonical source for CEO pay.

## Councillor allowances

Councillors are not employees and do not receive a salary. They receive:
- **Basic allowance** — £5,000–£15,000/year typical. Paid to every councillor.
- **Special Responsibility Allowance (SRA)** — extra for Leader, Deputy Leader, cabinet members, committee chairs.
- **Travel and subsistence** expenses.

Total cost of councillor allowances across a typical council: £200,000–£1.5 million per year depending on council size.

## Council types and leadership structures

| Type | Example | Structure |
|------|---------|-----------|
| County council (SC) | Kent, Surrey, Essex | ~80 councillors, 10-person cabinet, Leader + CEO |
| District council (SD) | Canterbury, Maidstone, Dover | ~40-60 councillors, 6-person cabinet, Leader + CEO |
| Unitary authority (UA) | Cornwall, Wiltshire, Durham | ~80 councillors, 10-person cabinet, Leader + CEO |
| Metropolitan district (MD) | Birmingham, Leeds, Manchester | ~80-120 councillors, 10-person cabinet, Leader + CEO |
| London borough (LB) | Camden, Tower Hamlets | ~50-65 councillors, 10-person cabinet, Leader + CEO. Tower Hamlets, Hackney, Newham, Lewisham, Croydon have directly-elected Mayors. |

## Democratic accountability

Councillors are elected every 4 years (pattern varies — some all-out, some third-in-rotation). Local elections happen on the first Thursday in May. Turnout is typically 30-40%.

Members' Interests registers (financial, political, pecuniary) must be publicly available on the council website under the Localism Act.

## Data sources

- Localism Act 2011 Pay Policy Statements (on each council website)
- Members' Allowances scheme (publicly available under s.100F Local Government Act 1972)
- Local Government Boundary Commission for England (LGBCE) — council structure data
- CivAccount aggregates all 317 English councils' leadership data into a single queryable format.
`,

  'local-democracy': `# How to Influence Your Council

Canonical URL: https://www.civaccount.co.uk/guide/local-democracy
Publisher: CivAccount (https://www.civaccount.co.uk)
Licence: Open Government Licence v3.0 (data) + MIT (code)
Last reviewed: 2026-04-19

## The public rights you have

As a resident, you have legal rights to:

1. **Attend council meetings** — full council, cabinet, and most committee meetings are public. Under the Openness of Local Government Bodies Regulations 2014 you can also film, record, and live-tweet.

2. **Inspect documents** — the budget, minutes, accounts, contracts, and policies are all public records. You can inspect council accounts during a public inspection window (usually early summer) and raise objections.

3. **Ask questions at full council** — most councils allow public questions. Rules vary; check your council's constitution.

4. **Submit petitions** — councils must respond to petitions meeting their threshold (usually 1,500 signatures for a full council debate).

5. **File Freedom of Information (FOI) requests** — under the FOI Act 2000. Councils have 20 working days to respond. Free.

6. **Lobby your councillor directly** — every ward has 1-3 councillors. Contact details on the council website.

## How council meetings work

Typical structure:
- **Full council** — all councillors. Meets 4-6 times a year. Sets the budget, council tax, senior appointments.
- **Cabinet** — 6-10 senior councillors. Meets monthly. Makes most policy decisions.
- **Scrutiny committees** — opposition + backbenchers. Scrutinise cabinet decisions, hold officers to account.
- **Regulatory committees** — planning, licensing, etc. Make decisions on specific cases.

All meetings publish agendas and papers 5 clear working days in advance on the council website (search "committee meeting", "democracy", or use a "modern.gov" / "democracy" subdomain).

## Filing a good FOI request

1. **Address it correctly** — Information Commissioner guidance accepts any reasonable contact point. Most councils have a dedicated FOI email.
2. **Be specific** — "All invoices for agency social workers between 1 April 2024 and 31 March 2025, broken down by agency and total value" beats "tell me about agency workers".
3. **Ask for data, not narrative** — councils must provide spreadsheets where they exist.
4. **Know the exemptions** — commercially sensitive information (s.43), personal data (s.40), policy formulation (s.35), and cost limits (s.12 — fee cap at 18 hours work for councils) are the main grounds for refusal.
5. **Escalate if refused** — internal review first, then the Information Commissioner (ICO) at https://ico.org.uk.

## How proposals become policy

1. **Idea** — from a councillor, resident, officer, or external stakeholder.
2. **Pre-decision scrutiny** — relevant scrutiny committee reviews.
3. **Cabinet report** — officer produces options paper with recommendation.
4. **Cabinet decision** — binding unless called in.
5. **Call-in** — scrutiny can "call in" a cabinet decision within 5 days for review.
6. **Implementation** — officers deliver.

Public consultation is required for major decisions (budgets, local plans, statutory service changes) under s.3 Local Government Act 1999.

## CivAccount Town Hall

CivAccount provides a public platform — Town Hall (https://www.civaccount.co.uk/townhall) — where residents propose, vote on, and discuss how their council should spend money. Proposals meeting voting thresholds are surfaced to the relevant council directly.

## Further reading

- Centre for Governance and Scrutiny: https://www.cfgs.org.uk/
- Local Government Information Unit: https://www.lgiu.org/
- Information Commissioner (FOI): https://ico.org.uk/
- Your Right to Know: https://www.whatdotheyknow.com/
`,
};
