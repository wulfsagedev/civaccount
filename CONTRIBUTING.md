# Contributing to CivAccount

Thanks for thinking about contributing. This is a lean civic-tech project — all help is welcome, but the scope is narrow.

## What we welcome

### Code

- **Bug fixes** — anything broken in the UI, API, or embed layer.
- **Accessibility improvements** — WCAG 2.1 AA+ is a hard floor. Regressions should be fixed; enhancements are welcome.
- **Performance** — Core Web Vitals improvements, smaller bundles, better caching.
- **Tests** — the test coverage is thin; more is better.
- **Small UX polish** — clearer copy, better responsive behaviour, keyboard-nav improvements.

### Docs

- README, comments, JSDoc, clarifications of how something works.

### Bugs (even without fixes)

- Open an issue with: URL, what you expected, what you got, and browser/OS.

## What we don't take (today)

- **Data changes** — the compiled dataset lives in a private repository and is maintained under a specific workflow. If you spot a wrong figure on a council page, open an issue with the URL, the figure, and the `.gov.uk` source you believe is correct; we'll handle the correction in the private layer. Pull requests that try to add or alter data in the public repo can't be merged.
- **New scraping pipelines** — we source exclusively from `.gov.uk`, and adding new sources is a scoped project-level decision.
- **Copy changes to core messaging** — the mission and tone are deliberate; PRs that reframe the project are out of scope.
- **Dependency upgrades** for their own sake — if a dep upgrade fixes a bug or unblocks something, great; bumping packages just to be current isn't.

## Before opening a PR

1. `npm install`
2. `npm run dev` — verify it runs on fixture data
3. `npx tsc --noEmit` — no type errors
4. `npm run lint` — no new errors

## Commit style

- Present-tense, short subject line (< 70 chars)
- Body explains *why*, not *what*
- No emoji

## Design system

The project has a strict design system documented in [CLAUDE.md](CLAUDE.md) — typography scale, colour tokens, spacing, card anatomy, bar-row component. New components should match. Hand-rolling patterns that already exist (bar rows, pulsing dots, council result items, icon containers) is a bug, not a feature.

## Licence

By contributing, you agree your contribution is offered under:

- **Code contributions** — [MIT Licence](LICENSE)
- **Doc contributions** — [MIT Licence](LICENSE) (same terms)

## Contact

Issues and pull requests only, please. For anything that doesn't fit those channels, the in-site feedback form is at [civaccount.co.uk](https://www.civaccount.co.uk).
