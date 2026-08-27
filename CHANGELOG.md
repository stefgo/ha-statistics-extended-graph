# Changelog

All notable changes to this card are documented here.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project
adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html). A release is built from
its `v*` tag by the release workflow, which attaches the bundle to the GitHub release — that
asset is what HACS installs.

## [Unreleased]

### Fixed

- `zoom`: the floor the window may not narrow past is no longer a constant. It is
  derived from how many labels the x axis of that chart aims for, read back from
  the chart instead of assumed: the axis divides the visible window by that count
  (`TimeScale.calcNiceTicks`) and rounds onto ECharts' ladder of time steps, so
  the more labels an axis wants, the wider the window that still survives it. The
  fixed floor of 0.6.1 was measured against one chart and stopped a five-minute
  window at 40 minutes on every other one.

## [0.6.1] — 2026-08-26

### Fixed

- `zoom`: the window no longer narrows past the data behind it. It stops at about
  eight buckets of the finest interval the card can still reach - what the range
  is loaded at, or, with `zoom.refine`, what the detail layer could still fetch
  for that window. The interval currently on screen is deliberately not the limit: it
  follows the window down, so a day-wide window drawn at `hour` still zooms
  through to `5minute`. Only a recorder that answers coarser than it was asked,
  or not at all, lowers the floor. Below the last bucket the chart only stretched
  the same points and drew the straight line between two of them, which read as
  resolution that never existed. Eight buckets is also where the x axis stops
  labelling below the bucket length: it divides the window by the ticks it aims
  for, so a narrower window was scaled in steps that subdivide every bar -
  five-minute bars labelled every two minutes. A window that is already open is
  never pushed back out; it can be narrowed down to a single bucket at most.

## [0.6.0] — 2026-08-26

### Added

- `zoom`: zoom and pan the time axis with the mouse wheel, a drag or a slider below the
  chart (`type: inside | slider | both`). The zoom is a pure view of the loaded range and does
  not trigger any fetch; a drag that pans the chart no longer selects a period.
- `zoom.type: auto`: the slider shows itself only while a zoom window exists. It appears with
  the gesture that zooms in and leaves once the chart rests at the full range again, so an
  unzoomed card spends no room on a handle bar nobody is using.
- `zoom.refine`: load high resolution data for the zoom window, next to the coarse data of
  the full range. A window has no bucket budget to respect, so zooming into a year drills down
  through days and hours to five-minute data; leaving the loaded detail falls back to the coarse
  data instantly. Compare and `time_offset` series are loaded at the same resolution. When the
  recorder has already purged the finest interval for a window, the detail steps back to the
  next best one instead of all the way to the coarse data, and a chart that stays zoomed in
  keeps its detail up to date with every refresh. The interval follows the thresholds of the
  core energy cards, which know no weekly step: a year is refined once the window drops below
  about ten weeks, not before.
- `zoom.refine`: a spinner in the top right corner of the chart while the detail layer loads,
  so a zoom that is still fetching is told apart from one that is done. It appears only after
  150 ms and leaves the chart readable and interactive underneath.

### Fixed

- `zoom`: a theme switch no longer throws the zoom away. `<ha-chart-base>` rebuilds its chart
  when the theme flips, and the fresh instance opened on the full range while the loaded detail
  still belonged to the zoomed window. The window is now written into the option set of that one
  rebuild instead of being left to the merge that carries it through a refresh.

## [0.5.0] — 2026-08-24

### Changed

- **Breaking:** the selection event is now named `custom-graph-selection` (was
  `statistics-extended-graph-selection`). Listeners that used the old name have to be renamed —
  the payload (`start`, `end`, `startTime`, `endTime`) is unchanged.

## [0.0.6] — 2026-08-23

### Changed

- The bundle attached to a GitHub release is now **minified** (223 KB → 86 KB). Minification is
  release-only: `npm run build`, `npm run dev` and `builddeploy.sh` keep producing the readable
  bundle, so local debugging is unchanged.

## [0.0.5] — 2026-08-23

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

- `zoom`: the slider and the detail layer no longer stay dead after a page reload. The card
  subscribes to the chart's zoom events in the capture phase of the gesture now:
  `<ha-chart-base>` builds its ECharts instance lazily, so on a freshly loaded page the last
  render regularly comes before the chart exists, and the wheel event that zooms is stopped by
  ECharts before it reaches a listener in the bubble phase. Until a click happened to hook the
  events up, a zoom moved the chart without showing the `auto` slider or loading any detail.
- A failed load no longer blanks the card, and the chart keeps standing while the next range
  loads instead of flashing empty.
- An aggregation that would have produced enough buckets to hang the browser is refused rather
  than attempted.
- The Home Assistant version is compared numerically, so `2025.10` no longer sorts below `2025.9`.
- Theme colors are read in the syntaxes a theme actually produces.
- The data controller's lifecycle is honest about start and teardown, and it is fed every `hass`
  update rather than only the ones that led to a render.
- The fetch queue keeps the delay it was given instead of collapsing it.
