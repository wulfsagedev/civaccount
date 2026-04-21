# Phase 5 kick-off — suppliers + grants rebuild

Following PROVENANCE-INTEGRITY-PLAN.md §5 and §C. Aggregates (`top_suppliers`,
`grant_payments`) require **payment-ledger** sources — not contract ceilings —
to pass the integrity rule. This is the most complex phase.

## The core pivot

**Stop using Contracts Finder OCDS for annual spend.**

Contracts Finder is a contract-award register. Its `value.amount` is the
contract ceiling — the maximum the council might spend over the full term,
across all suppliers on a framework. Three compounding mistakes in
`scripts/parse-contracts-finder.py` produce the supplier numbers the site
currently shows (and the validation notice is flagging):

1. Full framework ceiling is attributed to every supplier, not split.
2. Notice revisions are summed, so a framework published twice doubles.
3. 2024 and 2025 dumps are summed, so cross-year revisions triple.

Example: Bradford's PDPS Round 1 — £180m ceiling, 5-year term, 14
suppliers — becomes ~£144m/year credited to each of 14 suppliers. Total
attributed: ~£2bn/year from a single contract.

**Use instead:** the council's own spending-over-£500 publication. These
are payment ledgers — actual money that left the council — per supplier,
per month, with a category. Aggregating by supplier gives real annual
spend.

## Coverage today

- `src/data/councils/pdfs/spending-csvs/`: 30 files present. Coverage
  list: adur, arun, barnet-grants, basingstoke---deane, birmingham-grants,
  buckinghamshire, burnley, cambridge, cambridgeshire, camden-grants,
  charnwood, ealing, east-sussex, epping-forest, essex-grants, essex,
  harlow, hertfordshire, ipswich, king-s-lynn---west-norfolk, etc. (ls
  for full list)
- `src/data/councils/pdfs/360giving/`: 4 files (birmingham-grants,
  camden-grants, grantnav-local-gov.json, local-gov-grants.csv).

317 councils total, so 287 councils need their spending-over-£500 URL
discovered and scraped before Phase 5 can finish.

## Work required

### 5a. Discovery (per council)

A scaffold exists at `scripts/discover-spending-csvs.py` but hasn't
been run recently. For each of the 287 uncovered councils:

1. Fetch the council's transparency page (usually from
   `transparency_url` in the data record — but Phase 1 link-check
   showed many of these are silent 404s or redirect to landing pages).
2. Look for a pattern of links to monthly / quarterly payment CSVs
   (filename contains `payment`, `spend`, `invoice`, `500`, `over`).
3. Record the canonical URL + MIME + last-modified.

Realistic output: a council-level discovered URL for ~70-80% of the
287, with the rest requiring human-assisted discovery (CMSes where
payment data is buried behind search / a downloads portal).

### 5b. Scrape

For each discovered URL, download the CSV(s) to
`civaccount-data/pdfs/spending-csvs/<council>.csv` (private repo) and
mirror into the planned public `civaccount-source-archive/council/
<slug>/spending-over-500/` tree.

Each file carries a `_meta.json`: `{source_url, publisher, fetched,
filename, sha256, row_count}`.

### 5c. Parse + aggregate

For each CSV, aggregate by supplier:

```python
from collections import defaultdict

agg = defaultdict(lambda: {"total": 0, "source_rows": []})
for row in csv:
    supplier = row["supplier_name"]
    amount = row["amount_paid"]
    if is_redacted(supplier) or amount < 0 or amount > CAP: continue
    agg[supplier]["total"] += amount
    agg[supplier]["source_rows"].append({
        "row_index": row.row_number,
        "amount": amount,
        "date": row["payment_date"],
        "description": row["expense_type"],
    })
```

Output per council: top-N suppliers by annual total, with every
contributing row cited.

### 5d. Render

Replace the current `top_suppliers: [...]` structure with a shape that
carries `Citation.derivation` on each supplier's `annual_spend`:

```ts
{
  name: "Turning Point (Services) Limited",
  annual_spend: 1234567,   // sum of source rows
  category: "Health & Social Care",
  __source: {
    dataset_id: "bradford-spending-2024-25",
    source_url: "https://www.bradford.gov.uk/.../spending-over-500.csv",
    locator: { kind: "csv_filter", file: "bradford-spending-2024-25.csv",
               filter: { supplier_name: "Turning Point (Services) Limited",
                         year: "2024-25" }, column: "amount_paid" },
    derivation: {
      method: "sum",
      inputs: [/* Citation for every contributing row */],
      notes: "Sum of 23 payments to this supplier in 2024-25."
    },
    fetched: "2026-04-21",
    extraction: "exact_cell",
  }
}
```

`SourceAnnotation` gets a "See contributing rows" expander that renders
the `derivation.inputs` with per-row dates + amounts + deep-links to the
source CSV row.

### 5e. Retire Contracts Finder dependency

Once every council has spending-CSV-backed `top_suppliers`, delete
`scripts/parse-contracts-finder.py` and the Contracts Finder raw
dumps. Keep Contracts Finder as a DISCOVERY surface only (which
suppliers hold live contracts), never as a magnitude source.

## Grants

Grants pipeline is structurally better — 360Giving CSVs + council
grant publications carry per-row amounts that aren't ceilings. The 9
allowlisted councils already render from raw files in the repo. Work:

1. Extend parser to add `Citation.derivation` on each grant total.
2. Expand coverage to all 317 councils through the same discovery +
   scrape loop used for spending CSVs. Where a council publishes in
   360Giving format, use that directly; else extract grants from the
   spending CSV (expense_type = "Grants"). Phase 1 already landed
   `DataValidationNotice` on the 304 unverified councils.

## Estimate

- 5a discovery scaffold: 2 days (automated where possible, human-assisted
  where CMS blocks).
- 5b scrape pipeline: 1 day.
- 5c parse + aggregate: 2-3 days (bespoke format handling per council).
- 5d render + UI expander: 1 day.
- 5e retire old pipeline: half a day.
- Validation + spot-checking: 2 days.

**Total: ~10 working days.** Not achievable in this runway. Deferred
to its own multi-day push.

## Interim state

`DataValidationNotice` is live on suppliers (all 317) and unverified
grants (304). The notices point at the current source (Contracts
Finder for suppliers, transparency pages for grants) so readers
can spot-check directionally. No user-visible wrong numbers with
confident attribution — the notice is the honest state.
