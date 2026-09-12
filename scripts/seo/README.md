# Search Console → rollout priority

Council rollout order used ONS population as a stand-in for search demand.
This turns the stand-in into a measurement.

## One-time: nothing to set up

`civaccount.co.uk` is already a verified domain property in Search Console
(DNS TXT record). No API keys, no Google Cloud project, no credentials on disk.

## Every month: three minutes

1. Open [Search Console → Performance → Search results](https://search.google.com/search-console).
2. Set the date range to **Last 3 months** (more data beats more recency here).
3. Click **Export → Download CSV**. You get a zip.
4. Unzip it and copy **`Pages.csv`** into `scripts/seo/exports/`.
5. Run:

   ```
   node scripts/seo/import-search-console.mjs
   ```

It prints the top councils by impressions and writes
`scripts/seo/data/gsc-pages.json`.

Then the audit runner ranks by real demand automatically:

```
node scripts/validate/audit-all.mjs --top=25
```

The header line tells you which ordering it used, so you can never mistake
the proxy for the measurement.

## What happens without an import

Everything still works. `audit-all.mjs` falls back to ONS population and says
so. A missing, empty or malformed import degrades to the proxy rather than
failing — the audit is a reporting tool and must always run.

## Councils absent from the export

They sort *below* every measured council, ordered among themselves by
population. They are not treated as zero-demand, because "no impressions
recorded" and "nobody wants this" are different claims.

## Repo split

`exports/*.csv` and `data/*.json` are gitignored. Performance metrics are
private-repo material; keep the durable copy in
`civaccount-data/tracking/press/`. This script is public because a CSV parser
discloses nothing.

## If you later want this automated

A service account against the Search Console API would remove the manual
export. It needs a Google Cloud project, the Search Console API enabled, a
service-account JSON key on disk, and that service account added as a user in
Search Console. It writes the same `gsc-pages.json`, so nothing downstream
changes. Not built yet — the manual path covers all 317 council pages well
inside the 1,000-row export cap, so the API buys convenience, not capability.
