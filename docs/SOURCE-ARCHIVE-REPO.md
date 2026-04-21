# `civaccount-source-archive` — README template

This document is the template README for the planned public repo
`github.com/wulfsagedev/civaccount-source-archive`. When the repo is
created, copy the content below into its root `README.md`.

The repo exists so any reader can independently verify any number on
civaccount.co.uk without needing access to the private `civaccount-data`
dataset repo.

---

# CivAccount source archive

Raw scraped files that back every number on [civaccount.co.uk](https://civaccount.co.uk).

Every citation on the site points at a live government publication —
`.gov.uk`, `ons.gov.uk`, DEFRA, DfT, Ofsted, LGBCE, individual council
transparency pages. Government pages move. This repo preserves a
snapshot of each source at the time we extracted the value, so the
citation trail doesn't rot.

## How this works with the site

- Tap any figure on civaccount.co.uk → a popover shows the source title,
  data year and "Open source document" link.
- The link opens the **live source** first.
- If the live source is gone (404), it falls back to the archived copy
  in this repo.
- For a CSV source, find the row by ONS code + column. For a PDF, the
  citation records the page number.

## What's in here

```
./national/                    — National GOV.UK / ONS bulk datasets
  council-tax/
    2021-22/                   — Fetched YYYY-MM-DD
    2022-23/
    …
  revenue-outturn/
  ons-population/
  defra-waste/
  dft-roads/
  ofsted-childrens-services/
  lgbce-electoral/
  contracts-finder-ocds/

./council/                     — Per-council .gov.uk publications
  bradford/
    pay-policy-2024-25.pdf     (fetch date in metadata file)
    members-allowances-scheme.pdf
    statement-of-accounts-2023-24.pdf
    …
  camden/
  …

./MANIFEST.json                — Index: file path → source URL + fetched
```

Each directory carries a `_meta.json`:

```json
{
  "source_url": "https://www.gov.uk/government/statistical-data-sets/live-tables-on-council-tax",
  "publisher": "MHCLG",
  "fetched": "2026-04-13",
  "filename": "Band_D_2026-27.ods",
  "sha256": "421e5822ff9eb499c63609b78f2b3ade8ff49d259cc6ba9a958fd9c5e55112bd"
}
```

The `sha256` lets you verify the file hasn't been modified since the
archive was published.

## Automation, and how we keep ourselves honest

Files here are retrieved by scheduled automated scrapers. Values are
extracted and rendered on the site by a mix of deterministic parsers
(CSV lookups, PDF text extraction) and — where a source requires it —
human review. Every value on the site records its extraction method:
`exact_cell`, `pdf_text`, `pdf_ocr`, `human_review`, or `regex`.

Where extraction involved OCR, regex or LLM-assisted reading, a human
re-reads the source and records the `verified_at` date before the value
ships. The [PROVENANCE-INTEGRITY-PLAN](https://github.com/wulfsagedev/civaccount/blob/main/PROVENANCE-INTEGRITY-PLAN.md)
in the main repo is the technical plan that drives this.

## Found a discrepancy?

Two ways:

1. **On the site:** every source popover has a "Report incorrect data"
   link. It pre-fills a form with the council, field, current value and
   cited source. Reports go into a triage queue.
2. **Here:** open an issue on this repo with the council, the field,
   the file in this archive you checked against, and what you saw.

We respond by either correcting the rendered value, updating the
citation, or (if the source itself is wrong) publishing the discrepancy
alongside the figure with both readings visible.

## Licence

All files in this repo were retrieved from UK public-sector
publications under the [Open Government Licence v3.0](https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/).
Contracts Finder OCDS data is released under OGL. 360Giving data is
released under Creative Commons Attribution (CC-BY).

Where a file carries a more restrictive licence than OGL, it's not in
this archive — cite-links open the live source directly.
