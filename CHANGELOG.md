# Changelog

All notable changes to this card are documented here.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project
adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html). A release is built from
its `v*` tag by the release workflow, which attaches the bundle to the GitHub release — that
asset is what HACS installs.

## [0.1.0] — unreleased

The first released version. Everything below was built before any release existed, so it is
gathered into this one entry rather than split into versions nobody could install.

### Added

- **Statistics chart card** (`custom:statistics-extended-graph`) built on the ECharts
  runtime Home Assistant already ships — no additional chart library is loaded — and configured entirely in
  YAML.
- **Time range from the energy date picker** (`energy-date-selection`), or set manually as a
  relative or fixed range, including the picker's compare toggle.
- **Any long-term statistic**, with a per-series statistic type (`change`, `sum`, `mean`, `min`,
  `max`, `state`), plus raw recorder history for short ranges with live streaming updates.
- **Calculated series** — add, subtract, multiply and divide several statistics into one computed
  signal — and a per-series time offset, e.g. to put this year next to last year.
- **Bar, line and step charts**, freely mixed and stackable, with optional area fills, gradient
  fills and fill-between-two-lines bands.
- **Two Y axes** with independent scaling, limits and units.
- **Per-theme colors** (light/dark) and access to the Home Assistant energy palette.
- **Aggregation overrides per picker range**, with an optional fallback interval, and an optional
  live estimate for the current hour built from 5-minute statistics.
- **Bucket selection**: a click selects one bucket, dims the rest and marks it with a dashed line;
  marker and dots are drawn as real series so they survive a redraw.
- Boolean-like states (`on/off`, `open/closed`, `true/false`) are mapped to 1/0.
- **Card version in the console**, reported as `<semver>` for a release and `<semver>+build.<n>`
  for a bundle built by `builddeploy.sh` — a reloaded dashboard still printing the old number is
  serving a cached bundle.
- **`builddeploy.sh`** builds the bundle and copies it to a Home Assistant instance configured
  through `.env` (template in `.env.example`).
- **Release workflow**: pushing a `vX.Y.Z` tag builds the bundle on GitHub and attaches
  `statistics-extended-graph.js` to the release, which is what HACS installs.

### Changed

- The build moved from Parcel to **Rollup**, which bakes the version into the bundle instead of
  generating a source file for it.
- The local build counter is **opt-in**: only `builddeploy.sh` asks for it
  (`SEG_BUILD_COUNTER=1`), so a plain `npm run build` and the release workflow report the
  bare semver.
- `dist/` is no longer committed. The bundle comes from the GitHub release, or from a local build.

### Fixed

- A failed load no longer blanks the card, and the chart keeps standing while the next range
  loads instead of flashing empty.
- An aggregation that would have produced enough buckets to hang the browser is refused rather
  than attempted.
- The Home Assistant version is compared numerically, so `2025.10` no longer sorts below `2025.9`.
- Theme colors are read in the syntaxes a theme actually produces.
- The data controller's lifecycle is honest about start and teardown, and it is fed every `hass`
  update rather than only the ones that led to a render.
- The fetch queue keeps the delay it was given instead of collapsing it.
