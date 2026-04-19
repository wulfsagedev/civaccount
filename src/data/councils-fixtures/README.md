# Fixture council data

Three realistic-but-placeholder council records used when the private
`civaccount-data` submodule is not mounted — typically when a contributor
clones the public repo to work on code without needing access to the
full 317-council dataset.

## When these are used

- Running `npm run dev` or `npm run build` with `CIVACCOUNT_FIXTURES=1` set in the env.
- After the Phase 1 cutover completes, automatically when `src/data/councils/`
  is empty (i.e. the submodule hasn't been initialised).

## What's here

- **`sample-councils.ts`** — three hand-crafted `Council` records covering the
  three most common council types (SC / MD / LB). Figures are illustrative
  placeholders. **Do not cite from this file.**
- **`index.ts`** — barrel export matching the shape of `src/data/councils/index.ts`
  so imports in `src/data/councils.ts` can swap via a single path alias.

## What's not here (and why)

- No `districtCouncils` or `unitaryAuthorities` — their arrays export as empty.
  Any page that expects a specific district or UA will 404 in fixture mode.
  This is intentional: if fixture mode were "complete", it would defeat the
  purpose of keeping the real compiled dataset private.
- No PDFs or supporting artefacts.

## Do not edit unless

…you are adding a new field to the `Council` interface and need to update the
fixture to match. If you are, mirror the new field in all three records with
placeholder values.

See [/DATA-ACCESS-POLICY.md](../../../../DATA-ACCESS-POLICY.md) for the
strategic context.
