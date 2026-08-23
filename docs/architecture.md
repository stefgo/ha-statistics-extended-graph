# Architecture

The card is split into layers that only depend downwards: rendering depends on
data acquisition, data acquisition depends on the API and time helpers, and the
pure helpers depend on nothing but the configuration types.

```
card.ts                  Lit element: rendering, placeholders, animation
  └── chart/assemble.ts  builds the complete chart model from a data snapshot
        ├── series/      config → ECharts series (builder, calculation, offsets)
        └── chart/       axes, bars, lines, compare styling
  └── core/data-controller.ts
        ├── energy/      binding to the energy date picker
        ├── time/        timespan, buckets, aggregation plan, refresh timing
        └── data/        WebSocket APIs: statistics, history, live hour
```

## Modules

| Path | Responsibility |
| --- | --- |
| `src/card.ts` | The `<statistics-extended-graph>` element. Holds no data logic: it renders the snapshot, shows loading/empty placeholders and drives the zero-to-value animation on range switches. |
| `src/config/types.ts` | All configuration types. The single source of truth for what a YAML configuration may contain. |
| `src/config/validate.ts` | Validation and defaults for `setConfig`. Only a missing series list is fatal; everything else is a console warning. |
| `src/core/data-controller.ts` | Orchestrates all data acquisition: range resolution, energy picker binding, statistics/raw loading with aggregation fallback, calculation rebuilds, time-offset loading, live hour, auto refresh and visibility handling. Publishes a `GraphSnapshot`. |
| `src/core/fetch-queue.ts` | Debounces and serializes loads per target, and parks them while the dashboard is hidden. |
| `src/core/color.ts` | Color maths: alpha handling, theme resolution, CSS variable resolution, zero-aware gradients. |
| `src/core/format.ts`, `src/core/logger.ts` | Locale-aware formatting and level-filtered, deduplicated logging. |
| `src/data/statistics.ts` | `recorder/*` WebSocket calls plus statistics set operations (merge, trim, range checks). |
| `src/data/history.ts` | `history/*` WebSocket calls and the conversion of recorder states into the statistics shape, including boolean mapping. |
| `src/data/live-hour.ts` | Pure aggregation of 5-minute samples into an estimate for the ongoing hour. |
| `src/energy/collection.ts` | Subscription to the energy date picker collection, including retry and fallback. |
| `src/time/timespan.ts` | Resolves `timespan` into a concrete range for all three modes. |
| `src/time/buckets.ts` | Bucket alignment and the bucket sequence of a range. |
| `src/time/aggregation.ts` | Automatic interval selection and the ordered aggregation plan. |
| `src/time/refresh.ts` | When the next refresh is due for a given interval. |
| `src/series/model.ts` | Small shared rules: default stat type, value transform, series ids. |
| `src/series/calculation.ts` | Evaluates calculation series, including last-known-value fallback and constant-only series. |
| `src/series/time-offset.ts` | Normalizes offsets and shifts dates and samples between source and display range. |
| `src/series/builder.ts` | Turns series configurations into ECharts series options, including fill bands. |
| `src/chart/selection.ts` | Snapping a click onto a bucket, the period it covers and the marker series that makes it visible. |
| `src/chart/selection-input.ts` | Reads the clicked x value from the chart instance `<ha-chart-base>` exposes. |
| `src/chart/dimming.ts` | Fades everything outside the selected bucket. |
| `src/chart/axes.ts`, `bars.ts`, `lines.ts`, `compare.ts` | Presentation details: axis options, bar bucket alignment and labels, line normalization/extension, compare styling and stack layout. |
| `src/chart/assemble.ts` | Combines all of the above into `{ series, options }`. |
| `src/types/echarts.ts` | Structural typings for the option subset the card produces. Home Assistant provides the runtime. |

## Data flow

1. `setConfig` validates the YAML and hands it to the controller.
2. The controller resolves the visible range - either from the energy date
   picker subscription or from the `relative`/`fixed` configuration.
3. A range change schedules a load. The aggregation plan (`override → automatic
   → fallback`) is tried in order until an interval returns data.
4. Statistics, raw history and time-offset series are stored in the snapshot;
   calculation series are re-evaluated whenever their inputs change.
5. Every change notifies the card, which reassembles the chart model and hands
   it to `<ha-chart-base>`.
6. Timers keep the data fresh: an aligned auto refresh per interval, a live
   history stream for raw ranges, and the optional current-hour estimate. All of
   them pause while the dashboard is hidden.

## Design decisions

- **No chart library dependency.** The card only produces plain option objects
  and delegates rendering to Home Assistant's own `<ha-chart-base>`.
- **Rendering has no side effects.** All state lives in the controller, so a
  redraw can never trigger a fetch loop.
- **Failures degrade locally.** A broken series is skipped and logged; the rest
  of the chart still renders.
- **Presentation is intentionally reduced.** No legend, tooltip, axis pointers,
  graphical editor or forecast series - which keeps the render path small.
- **One interaction: the time selection.** A click selects one bucket.
  `chart/selection-input.ts` takes the position from the zrender layer of the
  chart instance and converts the pixel into a value of the time axis - a direct
  read that needs neither a tooltip formatter nor the transient axis pointer
  state; the subscription is made on `pointerdown`, because Home Assistant
  creates the instance lazily. The card only stores the clicked x value:
  `chart/selection.ts` snaps it onto a bucket during every assembly,
  `chart/dimming.ts` fades everything outside it, and marker and dots are
  appended as line series of their own - the tree-shaken ECharts build of Home
  Assistant registers only the bar, line and custom charts, so `markArea`,
  `markLine` and `markPoint` would be dropped without a word. A hidden `0..1`
  y axis lets the dashed marker line span the full plot height without touching
  the scale of the data axes. Because all of it is plain data, the selection
  survives every redraw instead of living inside the chart. It leaves the card
  as a `statistics-extended-graph-selection` event carrying the period of the
  bucket, fired after each assembly whenever that period changed.
