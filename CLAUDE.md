# CLAUDE.md

Guidance for Claude Code when working in this repository.

## Project overview

`statistics-extended-graph` is a standalone Home Assistant Lovelace card
(`custom:statistics-extended-graph`): a statistics graph with per-series
configuration, calculated series, time offsets, an optional data zoom and a
click-to-select time interaction. It follows the energy dashboard's date picker
when configured to.

The card depends on no other card and on no chart library: it produces plain
ECharts option objects and hands them to Home Assistant's own
`<ha-chart-base>`. Keep it that way — the runtime comes from the frontend.

## Commands

```bash
npm ci
npm run build      # Rollup → dist/statistics-extended-graph.js
npm run watch      # rebuild on change
npm run typecheck  # tsc --noEmit
npm run lint       # eslint (npm run lint:fix to autofix)
npm test           # vitest run
SEG_MINIFY=1 npm run build   # minified, as the release does
./builddeploy.sh   # build + scp to the instance from .env (see .env.example)
```

## Architecture

The full picture — module table, data flow and the design decisions behind it —
is in [docs/architecture.md](docs/architecture.md). The short version:

```
card.ts                  Lit element: rendering, placeholders, animation
  └── chart/assemble.ts  builds the complete chart model from a data snapshot
        ├── series/      config → ECharts series (builder, calculation, offsets)
        └── chart/       axes, bars, lines, compare styling, data zoom
  └── core/data-controller.ts
        ├── energy/      binding to the energy date picker
        ├── time/        timespan, buckets, aggregation plan, refresh timing
        └── data/        WebSocket APIs: statistics, history, live hour
```

Layers depend downwards only. All state lives in the controller, so rendering
has no side effects and a redraw can never trigger a fetch loop.

## Testing

Tests are in `test/*.test.ts` (vitest, `npm test`) and cover the pure modules —
the elements themselves have no DOM-based tests, so `npm run typecheck` is what
guards them. `.github/workflows/validate.yml` runs the HACS check, typecheck,
tests and the build on every push and pull request.

## Releasing

Bump `package.json`, close the CHANGELOG section as `## [x.y.z] — <date>` with
its compare link, commit as `Release x.y.z` and push an annotated `vx.y.z` tag.
`.github/workflows/release.yml` refuses a tag that disagrees with
`package.json`, builds minified and attaches the bundle to the GitHub release.

**Every release carries a full description.** The body is never generated from
commit subjects: `.github/scripts/release_notes.py <version>` extracts the
version's CHANGELOG section, so the CHANGELOG entry *is* the release
description. A missing section fails the release on purpose.

## Conventions

- Keep new config options optional with sensible defaults; never break existing
  YAML.
- `validate.ts` throws only for a missing series list — `setConfig()` runs on
  every keystroke in the Lovelace editor. Everything else is a console warning
  and a locally degraded chart: one broken series must not take down a
  dashboard.
- No chart library, no dependency on another card, no forked foreign source.
