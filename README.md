# Statistics Extended Graph for Home Assistant

[![Release](https://img.shields.io/github/v/release/stefgo/ha-statistics-extended-graph?style=flat-square)](https://github.com/stefgo/ha-statistics-extended-graph/releases)
[![HACS: custom](https://img.shields.io/badge/HACS-custom-41BDF5?style=flat-square)](https://hacs.xyz/)
[![Home Assistant](https://img.shields.io/badge/Home%20Assistant-Lovelace-41BDF5?style=flat-square)](https://www.home-assistant.io/)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue?style=flat-square)](https://github.com/stefgo/ha-statistics-extended-graph/blob/main/LICENSE.md)

A lightweight statistics chart card for Home Assistant Lovelace dashboards.

The card follows the Home Assistant **energy date picker**, reuses the ECharts
runtime that Home Assistant already ships (no extra chart library is loaded),
and is configured entirely in YAML.

Unlike the built-in energy cards it is not limited to the entities of the energy
dashboard: any entity with long-term statistics can be charted, as well as
unaggregated ("raw") recorder history.

![One ha-card combining Statistics Extended Graph and Statistics Table and Legend: a stacked hourly energy chart on top, five legend rows with their sums underneath, closed by a self-sufficiency total row](https://raw.githubusercontent.com/stefgo/ha-statistics-extended-graph/main/screenshots/statistics-legend-with-custom-graph.png)

*This card's chart of hourly grid, battery and PV energy, combined in one `ha-card` with
[Statistics Table and Legend](https://github.com/stefgo/ha-statistics-legend-table), which
contributes the legend rows with their sums and the self-sufficiency total row.*

## Features

The card is configured entirely in YAML — there is no visual editor — and draws on
the ECharts runtime Home Assistant already ships, so no extra chart library is
loaded.

**Time range** — [`timespan`](#timespan)

- Follows the energy date picker (`energy-date-selection`), including its compare
  toggle, and binds to a specific picker on dashboards with multiple collections.
- Or set manually: a calendar period (`hour` … `year`, with `count` and `offset`),
  a rolling window (`last_60_minutes` … `last_12_months`), or a fixed ISO range.

**Data sources** — [series](#series-options), [calculations](#calculated-series),
[aggregation](#aggregation-options)

- Any entity with long-term statistics, with a per-series statistic type
  (`change`, `sum`, `mean`, `min`, `max`, `state`).
- Raw recorder history for short ranges, kept current through a live history stream.
- Calculated series: add, subtract, multiply and divide several statistics — or
  plain constants — into one computed signal.
- Per-series [time offset](#time-offset), e.g. this year and last year side by side.
- Per-series value transformation: `multiply`, `add` and clipping to bounds.
- Boolean-like states (`on/off`, `open/closed`, `true/false`) are mapped to 1/0.

**Chart types and styling** — [series](#series-options)

- Bar, line and step charts, freely mixed and stacked by a shared stack key.
- Area fills, gradient fills towards the zero line, and
  [bands between two lines](#fill-between-two-lines).
- Line width, style (`solid`, `dashed`, `dotted`), opacity and smoothing.
- Optional value labels at the end of each bar, with configurable precision.

**Axes** — [`y_axes`](#y-axis-options-y_axes)

- Left and right Y axis with independent scaling, limits and unit labels.
- Tight fit to the data, a symmetric range around zero, a logarithmic scale, or
  grid lines hidden per axis.

**Interaction** — [`zoom`](#data-zoom), [time selection](#time-selection)

- Optional data zoom: zoom and pan the time axis with the wheel, a drag or a
  slider — which can [show itself only while the chart is zoomed](#a-slider-only-when-it-is-needed-type-auto).
- Optionally [load higher-resolution data](#higher-resolution-when-zooming-in-refine)
  for the zoom window instead of magnifying the same buckets.
- A click selects a single bucket, dims everything outside it and fires a
  `custom-graph-selection` event other cards can listen to.

**Colors and performance** — [colors](#separate-colors-for-light-and-dark-mode),
[aggregation](#aggregation-options)

- Per-theme colors (light/dark) for series, compare series and the color cycle,
  plus access to the Home Assistant energy palette via CSS variables.
- Aggregation overrides per picker range, with an optional fallback interval and a
  `disabled` setting that skips expensive requests entirely.
- Optional live estimate for the current hour, built from 5-minute statistics.

## Installation

### HACS (custom repository)

1. Open *HACS → Frontend*, then the three-dot menu in the top right.
2. Choose *Custom repositories*, add `https://github.com/stefgo/ha-statistics-extended-graph`
   and set the category to *Lovelace*.
3. Search for "Statistics Extended Graph" in HACS and install the latest release.
4. Reload the browser and clear the cache if the card does not appear.

### Manual installation

1. Download `statistics-extended-graph.js` from the
   [latest GitHub release](https://github.com/stefgo/ha-statistics-extended-graph/releases/latest)
   — the bundle is attached there as an asset — or build it yourself
   (`npm install && npm run build`, which writes
   `dist/statistics-extended-graph.js`; `dist/` is not part of the repository).
2. Copy it to `config/www/community/statistics-extended-graph/statistics-extended-graph.js`.
3. Add the resource under *Settings → Dashboards → Resources → + ADD RESOURCE*:
   - URL: `/local/community/statistics-extended-graph/statistics-extended-graph.js`
   - Resource type: `JavaScript Module`
4. Clear the browser cache and reload the page.

### Deploy script

For development there is `builddeploy.sh`: it builds the card and copies
`dist/statistics-extended-graph.js` to the Home Assistant instance over SSH.

1. `cp .env.example .env` and enter your instance (`SEG_HOST`, and
   optionally port, config path or target directory). `.env` is git-ignored.
2. Run `./builddeploy.sh`.

## Quick start

The card has no visual editor: add it through the dashboard's *Manual card* /
raw YAML editor.

```yaml
type: custom:statistics-extended-graph
title: Energy overview
series:
  - statistic_id: sensor.energy_grid_import
  - statistic_id: sensor.energy_grid_export
    stat_type: change
    chart_type: line
    fill: true
```

With the default `timespan.mode: energy`, place an **energy date picker**
(`energy-date-selection`) card on the same dashboard - the chart then follows
the range you select there. For other modes see [Timespan](#timespan).

## Configuration

Detail sections: [Timespan](#timespan) · [Series options](#series-options) ·
[Time offset](#time-offset) · [Calculated series](#calculated-series) ·
[Fill between two lines](#fill-between-two-lines) ·
[Y axis options](#y-axis-options-y_axes) · [Data zoom](#data-zoom) ·
[Aggregation options](#aggregation-options) · [Time selection](#time-selection)

### Card options

Listed from the options every card needs to the ones only some do.

| Key | Type | Default | Description |
| --- | --- | --- | --- |
| `type` | string | – | Must be `custom:statistics-extended-graph`. |
| `series` | list | – | One or more [series definitions](#series-options). At least one is required. |
| `title` | string | – | Optional card header. |
| `timespan` | object | `{mode: energy}` | Time range shown by the card, see [Timespan](#timespan). |
| `y_axes` | list | – | Configuration of the left and right Y axis, see [Y axis options](#y-axis-options-y_axes). |
| `aggregation` | object | auto | Recorder interval overrides, see [Aggregation options](#aggregation-options). |
| `zoom` | boolean or object | `false` | Zoom into the time axis with the mouse wheel or a slider, see [Data zoom](#data-zoom). |
| `chart_height` | string | auto | CSS height (e.g. `300px`). Ignored in section layouts, where the grid rows define the height. |
| `color_cycle` | list | energy palette | Colors for series without an explicit `color`. Each entry is a string or a `{light, dark}` object, see [per-theme colors](#separate-colors-for-light-and-dark-mode). |
| `collection_key` | string | – | Key of the energy date picker to bind to, when a dashboard has [multiple collections](https://www.home-assistant.io/dashboards/energy/#using-multiple-collections). |
| `allow_compare` | boolean | `true` | Honour the picker's compare toggle. Ignored when any series uses [`time_offset`](#time-offset). |

### Timespan

**`energy` (default)** - follow the energy date picker on the dashboard.

```yaml
timespan:
  mode: energy
```

**`relative`** - a calendar period or a rolling window relative to now.

```yaml
timespan:
  mode: relative
  period: day     # hour, day, week, month, year,
                  # last_60_minutes, last_24_hours, last_7_days,
                  # last_30_days, last_12_months
  count: 1        # number of calendar units (calendar periods only)
  offset: -1      # shift by whole periods, e.g. -1 = yesterday
```

*Calendar periods* (`hour`, `day`, `week`, `month`, `year`) always cover complete
units - `day` means 00:00 to 23:59. `count` includes several consecutive units
ending at the unit selected by `offset`. Weeks start on Monday, matching the
recorder.

*Rolling windows* (`last_60_minutes`, `last_24_hours`, `last_7_days`,
`last_30_days`, `last_12_months`) end at "now" and ignore `count`. `offset`
shifts them by hours, days or months depending on the window. The window anchor
is rounded (to the minute, to :20 past the hour, or to midnight) so the card
does not reload on every render.

**`fixed`** - a constant range, ISO 8601.

```yaml
timespan:
  mode: fixed
  start: "2024-01-01T00:00:00"   # defaults to the start of today
  end: "2024-01-31T23:59:59"     # defaults to the end of the start day
```

### Series options

Grouped from what a series *is* down to how it *looks*: identity and data source
first, then placement and color, then value transformation, then styling.

| Key | Type | Default | Description |
| --- | --- | --- | --- |
| `statistic_id` | string | – | Entity providing long-term statistics. Required unless `calculation` is used. |
| `name` | string | entity name | Display name of the series. |
| `stat_type` | `change`, `sum`, `mean`, `min`, `max`, `state` | `change` | Statistic type. [Calculation terms](#calculated-series) have their own setting. |
| `chart_type` | `bar`, `line`, `step` | `bar` | How the series is drawn. |
| `calculation` | object | – | Computed series instead of a single statistic, see [Calculated series](#calculated-series). |
| `time_offset` | object | – | Load this series from a shifted source range, see [Time offset](#time-offset). |
| `stack` | string | – | Series sharing a stack key are stacked on top of each other. |
| `y_axis` | `left`, `right` | `left` | Axis the series is drawn against, see [Y axis options](#y-axis-options-y_axes). |
| `color` | string or object | palette | `#rrggbb`, `rgb()`, a CSS variable such as `--energy-solar-color`, or [`{light, dark}`](#separate-colors-for-light-and-dark-mode). |
| `compare_color` | string or object | inherited | Color of the compare series. Defaults to the series color at reduced opacity. |
| `multiply` | number | `1` | Factor applied to every value. |
| `add` | number | `0` | Offset added after `multiply`. |
| `clip_min` | number | – | Values below this bound are raised to it. |
| `clip_max` | number | – | Values above this bound are lowered to it. |
| `fill` | boolean | `false` | Fill the area below a line/step series. |
| `fill_opacity` | number | `0.15` line / `0.5` bar | Opacity of the fill. |
| `gradient_fill` | boolean | `false` | Fade the fill towards the zero line (line/step only). |
| `fill_to_series` | string | – | Fill the band between this line and the named line series, see [Fill between two lines](#fill-between-two-lines). |
| `line_width` | number | `1.5` | Line thickness in pixels (lines only). |
| `line_style` | `solid`, `dashed`, `dotted` | `solid` | Line pattern (lines only). |
| `line_opacity` | number | `0.85` line / `1.0` bar border | Stroke opacity. |
| `smooth` | boolean or number | `true` | Line smoothing; a number between 0 and 1 controls the amount. Ignored for step charts. |
| `show_value_labels` | boolean | `false` | Draw the value at the end of each non-zero bar. Unstacked bars only. |
| `value_label_precision` | number | `0` | Decimals of the value labels. |
| `source` | `statistic`, `calculation` | inferred | Data source. Rarely needed - it is detected automatically from `statistic_id` / `calculation`. |

#### Time offset

`time_offset` loads a series from a shifted source range and draws it inside the
visible range - ideal for year-over-year comparisons.

```yaml
series:
  - statistic_id: sensor.pv_generation
    name: This year
  - statistic_id: sensor.pv_generation
    name: Previous year
    time_offset:
      value: -1
      unit: year      # hour, day, week, month, year
```

`value` must be a whole number; `0` behaves like no offset. For calculation
series the offset applies to the whole result, not to single terms.

Time offsets require aggregated statistics: raw history is not supported, and
the energy picker's compare mode is disabled while any series uses an offset.

#### Calculated series

Use `calculation` instead of `statistic_id` to compute a series from several
statistics. Terms are applied in order, starting from `initial_value`.

| Key | Type | Default | Description |
| --- | --- | --- | --- |
| `terms` | list | – | Ordered calculation steps. |
| `initial_value` | number | `0` | Value before the first term. |

Each term accepts:

| Key | Type | Default | Description |
| --- | --- | --- | --- |
| `operation` | `add`, `subtract`, `multiply`, `divide` | `add` | Operation of this step. |
| `statistic_id` | string | – | Statistic used by this term. |
| `constant` | number | – | Constant instead of a statistic. All other term keys are ignored then. |
| `stat_type` | see [Series options](#series-options) | series value | Statistic type of this term. |
| `multiply` | number | `1` | Factor applied to the term value. |
| `add` | number | `0` | Offset added after `multiply`. |
| `clip_min` / `clip_max` | number | – | Bounds applied to the term value. |

Notes:

- **Raw history:** terms reuse their most recent known value when no sample
  exists at the evaluated timestamp, so mixed reporting intervals stay stable.
- **Constant-only calculations:** if every term is a constant, points are
  synthesized across the visible range - handy for horizontal reference lines.
- **Division by zero** produces a gap at the affected timestamp.

#### Fill between two lines

```yaml
series:
  - statistic_id: sensor.outdoor_temperature
    name: Max temperature
    stat_type: max
    chart_type: line
    fill_to_series: Min temperature
  - statistic_id: sensor.outdoor_temperature
    name: Min temperature
    stat_type: min
    chart_type: line
```

Requirements: both series are lines (not bars), neither uses `stack`, and the
referenced `name` is unique. Where the upper series drops below the lower one,
the band is clamped to zero and a warning is logged. The band uses the
`fill_opacity` of the upper series.

### Y axis options (`y_axes`)

The right axis appears as soon as a series sets `y_axis: right` or a `right`
axis is configured.

| Key | Type | Default | Description |
| --- | --- | --- | --- |
| `id` | `left`, `right` | – | Axis this entry configures. |
| `unit` | string | – | Unit label drawn at the axis. |
| `min` | number | auto | Lower bound. Ignored when `center_zero` is active. |
| `max` | number | auto | Upper bound. With `center_zero` it defines both bounds (`max: 10` → -10 … +10). |
| `fit_y_data` | boolean | `false` | Scale tightly to the data instead of including zero. |
| `center_zero` | boolean | `false` | Symmetric range around zero, calculated from the data when `max` is unset. |
| `logarithmic_scale` | boolean | `false` | Logarithmic axis. |
| `hide_grid` | boolean | `false` | Hide the horizontal grid lines of this axis. |

### Data zoom

Narrows the visible part of the time axis: the wheel zooms, a drag pans.

```yaml
zoom: true     # shorthand for type: inside
```

```yaml
zoom:
  type: both               # inside, slider, both, auto
  start: 50                # show the second half at first
  end: 100
```

| Key | Type | Default | Description |
| --- | --- | --- | --- |
| `type` | `inside`, `slider`, `both`, `auto` | `inside` | `inside` zooms on the plot itself, `slider` adds a handle bar below it, `both` has the two. [`auto`](#a-slider-only-when-it-is-needed-type-auto) is `both` with a slider that only shows while a zoom window exists. |
| `start` | number | `0` | Left edge of the initial window, in percent of the range. |
| `end` | number | `100` | Right edge of the initial window, in percent of the range. |
| `zoom_lock` | boolean | `false` | Fixes the window width, so it can only be panned. |
| `refine` | boolean | `false` | Load high resolution data for the zoom window, see [Higher resolution when zooming in](#higher-resolution-when-zooming-in-refine). |

The window survives data refreshes and live updates - it is reset to `start` /
`end` when the visible range itself changes, e.g. through the energy date
picker. Values outside the window are clipped, never dropped, so stacks,
compare series and the y axis stay stable while panning.

A drag that pans the chart does not select a period; only a click that stays in
place does (see [Time selection](#time-selection)).

The zoom stops where the data does: the window never narrows below about eight
buckets of the finest interval the card can still *reach* for it. Without
[`refine`](#higher-resolution-when-zooming-in-refine) that is the interval the
range is loaded at - a chart of daily bars stops at roughly eight days. With
`refine` it is whatever the detail layer can still fetch, which is `5minute`
until the recorder says otherwise, so the same chart keeps zooming down to about
40 minutes - the interval currently on screen is not the limit, it only follows
the window down. Below that there is nothing left to reveal: the chart would
only stretch the same points and draw the straight line between two of them,
and the x axis would start labelling in steps that subdivide the bars.

![A zoomed PV generation chart: three daily bell curves of hourly bars stacked from east and west modules, the zoom slider below the plot marking the window over the middle of the range, and three legend rows with their sums underneath](https://raw.githubusercontent.com/stefgo/ha-statistics-extended-graph/main/screenshots/statistics-legend-with-dynamic-zoom.png)

*[`type: auto`](#a-slider-only-when-it-is-needed-type-auto) and
[`refine: true`](#higher-resolution-when-zooming-in-refine) together: the slider
has appeared with the zoom and marks the window inside the full range, and the
bars are hourly because the window is short enough for the detail to be loaded at
that resolution. The legend rows with their sums and the `PV gesamt` total come
from [Statistics Table and Legend](https://github.com/stefgo/ha-statistics-legend-table)
in the same `ha-card`, not from this card.*

```yaml
zoom:
  type: auto
  refine: true
```

#### A slider only when it is needed (`type: auto`)

```yaml
zoom:
  type: auto
```

The handle bar costs a fixed strip below the plotting area, which is a poor
trade on a card that is usually looked at unzoomed. With `type: auto` the bar
appears with the first zoom - as an orientation and as the way back out - and
leaves again once the chart is back at the full range. The plotting area takes
the freed strip, so the curve grows and shrinks by that much when the bar comes
and goes.

The bar appears with the gesture that calls for it, but it is only removed once
a gesture has come to rest at the full range, so it never vanishes from under
the handle that is dragging it there.

#### Higher resolution when zooming in (`refine`)

Without `refine` the zoom is purely visual: it magnifies the monthly bars of a
year, it does not turn them into daily ones.

```yaml
zoom:
  type: inside
  refine: true
```

With `refine: true` the card loads a second, high resolution data set for the
zoom window and draws it in place of the coarse one. The window is small by
definition, so its interval is chosen from its own length alone and hits no
point budget: zooming into a year drills down through `day` and `hour` to
`5minute`.

The interval follows the same thresholds the core energy cards use, applied to
the window instead of the full range:

| Zoom window | Interval of the detail |
| --- | --- |
| more than ~10 weeks | `month` |
| a few days up to ~10 weeks | `day` |
| up to 2 days | `hour` |
| up to 2 hours | `5minute` |

There is no weekly step between `day` and `month`. A year is loaded at `month`
already, so zooming into it changes nothing until the window drops below about
ten weeks - from there the detail is daily and gets finer with every further
step.

The detail reaches one window width beyond each edge, so panning inside the
zoom stays instant. Leaving that area falls back to the coarse data in the same
frame - the chart never goes blank - and the detail is reloaded for the new
window. Compare series and `time_offset` series are loaded at the same
resolution, so the chart never mixes intervals, and the x axis keeps describing
the full range, so zooming back out always has somewhere to go.

Two limits are worth knowing:

- Home Assistant deletes `5minute` statistics after about ten days, so zooming
  into an older period never gets finer than `hour`. The empty answer marks
  that region, the coarse data stays on screen, and the region is not requested
  again - and the zoom stops there rather than magnifying it further, at the
  interval the recorder still had. A window that is already open is never pushed
  back out by that, only kept from narrowing beyond a single bucket.
- Every zoom into a new window is a fetch. The card waits until the gesture came
  to rest (400 ms) and only loads when the resolution actually changes, but on a
  slow recorder this is noticeable. Live updates of the current hour land in the
  coarse data; the detail follows with the next refresh. While such a load runs,
  a small spinner appears in the top right corner of the chart. It waits out the
  first 150 ms, so a fast answer never flashes it, and the chart stays visible
  and interactive underneath: what is on screen is final once the spinner is
  gone.

A change of the visible range (e.g. through the energy date picker) resets the
window and the detail with it.

### Aggregation options

By default the card mirrors the core energy cards: hours for a day, days for a
week or month, months for a year.

```yaml
aggregation:
  manual: hour          # used for relative/fixed timespans
  fallback: day         # used when the preferred interval returns no data
  energy_picker:        # used per energy date picker range
    hour: 5minute
    day: hour
    week: hour
    month: day
    year: month
  raw_options:
    significant_changes_only: false
  compute_current_hour: true
```

- Valid intervals: `5minute`, `hour`, `day`, `week`, `month`, `year`, `raw`,
  `disabled`.
- `raw` fetches unaggregated recorder history and keeps it updated through a
  live history stream.
- `disabled` skips the request entirely and shows a "choose a shorter period"
  message.
- `compute_current_hour` estimates the ongoing hour from 5-minute statistics
  until Home Assistant publishes the hourly aggregate. It applies to the main
  range while the resolved interval is `hour`.
- The X axis switches to month or year labels when the resolved interval is
  `month` or `year`.

> **Heads up:** `compute_current_hour` issues an extra 5-minute query every few
> minutes while the current hour is visible, and fine intervals over long ranges
> are expensive. Use both sparingly.

## Examples

### Fixed window with two axes

```yaml
type: custom:statistics-extended-graph
title: Heat pump snapshot
timespan:
  mode: fixed
  start: 2024-01-01T00:00:00
  end: 2024-01-08T00:00:00
y_axes:
  - id: left
    unit: kWh
    fit_y_data: true
  - id: right
    unit: °C
    min: -10
    max: 30
series:
  - statistic_id: sensor.heat_pump_energy
    name: Heat pump
    stat_type: change
    chart_type: bar
  - statistic_id: sensor.outdoor_temperature
    name: Outdoor temperature
    stat_type: mean
    chart_type: line
    y_axis: right
```

### Grid balance with a zero-centred axis

```yaml
type: custom:statistics-extended-graph
title: Grid power balance
y_axes:
  - id: left
    unit: kW
    center_zero: true
series:
  - statistic_id: sensor.grid_import
    name: Import
    stat_type: mean
    chart_type: line
  - statistic_id: sensor.grid_export
    name: Export
    stat_type: mean
    chart_type: line
    multiply: -1
```

### Rolling window

```yaml
type: custom:statistics-extended-graph
title: Consumption, last 30 days
timespan:
  mode: relative
  period: last_30_days
series:
  - statistic_id: sensor.home_energy_consumption
    stat_type: change
    chart_type: bar
```

### Energy dashboard style stack

```yaml
type: custom:statistics-extended-graph
series:
  - name: Solar self consumed
    chart_type: bar
    color: "--energy-solar-color"
    stack: energy
    clip_min: 0
    calculation:
      terms:
        - statistic_id: sensor.total_solar_production
          operation: add
        - statistic_id: sensor.total_grid_export
          operation: subtract
        - statistic_id: sensor.total_battery_charge
          operation: subtract
  - statistic_id: sensor.total_grid_import
    name: Imported
    chart_type: bar
    color: "--energy-grid-consumption-color"
    stack: energy
  - statistic_id: sensor.total_battery_discharge
    name: Battery discharge
    chart_type: bar
    color: "--energy-battery-out-color"
    stack: energy
  - statistic_id: sensor.total_grid_export
    name: Exported
    chart_type: bar
    multiply: -1
    color: "--energy-grid-return-color"
    stack: energy
  - statistic_id: sensor.total_battery_charge
    name: Battery charge
    chart_type: bar
    multiply: -1
    color: "--energy-battery-in-color"
    stack: energy
```

### Binary sensor as a step chart

```yaml
type: custom:statistics-extended-graph
title: Garage door
aggregation:
  energy_picker:
    hour: raw
    day: raw
    week: disabled
    month: disabled
    year: disabled
series:
  - statistic_id: binary_sensor.garage_door
    stat_type: state
    chart_type: step
    smooth: false
```

### Separate colors for light and dark mode

```yaml
type: custom:statistics-extended-graph
color_cycle:
  - "#1f4e9c"
  - light: "#b35c00"
    dark: "#ffb454"
series:
  - statistic_id: sensor.energy_import
    name: Import
    chart_type: bar
    color:
      light: "#1f4e9c"
      dark: "#7ea8ff"
    compare_color:
      light: "#8a97ad"
      dark: "#4a5a75"
```

A plain string applies to both themes. As soon as `dark` is present it wins in
dark mode. Theme switches are applied without reloading the dashboard.

## Time selection

A click inside the chart selects the bucket it lands on - exactly one at a
time, a second click on the same bucket clears it again. The selected bucket is
marked by a dashed line over the full chart height, every bar outside it is
dimmed to 50 %, and line series - which are drawn as one shape and
cannot dim single points - fade as a whole and restate their value at the
selection as a dot. Stacked lines get their dot on the stacked position, where
the line is actually drawn.

The selection is card state, not chart state: it is re-derived on every redraw
and therefore survives data refreshes, live updates and theme switches. It ends
with a reload, with leaving the page, or with a switch of the visible range,
whose buckets the selection no longer belongs to.

Every change fires a `custom-graph-selection` event that bubbles
out of the card:

```js
document.addEventListener("custom-graph-selection", (event) => {
  const { start, end, startTime, endTime } = event.detail;
});
```

| Field | Meaning |
| --- | --- |
| `start` | Start of the selected bucket in epoch milliseconds, `null` when cleared |
| `end` | End of the bucket (exclusive), `null` for an open-ended last bucket |
| `startTime`, `endTime` | The same two points as ISO strings, `null` when cleared |

## Troubleshooting

| Symptom | Cause and fix |
| --- | --- |
| "No statistics available for the selected period" | The entity has no long-term statistics in the range. Check that recorder and statistics are enabled for it, or switch the range to [`raw`](#aggregation-options). |
| "Choose a shorter time range" | The resolved aggregation is `disabled` for this range - by design of your [`aggregation.energy_picker`](#aggregation-options) configuration. |
| Chart does not follow the date picker | The dashboard has no `energy-date-selection` card, or the wrong `collection_key`. Without a picker the card falls back to today, see [Timespan](#timespan). |
| Warning about unsupported options | The configuration contains options of the full-featured upstream card (legend, tooltip, axis pointers, forecast). Remove them. |
| Series is missing | Check the browser console: misconfigured series, empty calculations and unresolved [`fill_to_series`](#fill-between-two-lines) references are logged there. |

## Development

```bash
npm install       # install dependencies
npm run typecheck # TypeScript, no emit
npm run build     # bundle into dist/statistics-extended-graph.js (rollup)
npm run watch     # same, rebuilding on every change
```

The card prints its version to the browser console. Only `builddeploy.sh` asks
for a local build counter (`SEG_BUILD_COUNTER=1`) and reports
`<version>+build.<n>`; every other build — a plain `npm run build` and the
release workflow included — reports the bare semver from `package.json`. If the
console still shows the previous number after a deploy, the browser served a
cached bundle. The counter in `.build-number` is local to the working copy and
not committed.

The architecture of the source tree is documented in
[docs/architecture.md](https://github.com/stefgo/ha-statistics-extended-graph/blob/main/docs/architecture.md).

## Releases

A release is built from its tag: pushing `vX.Y.Z` runs
[`.github/workflows/release.yml`](https://github.com/stefgo/ha-statistics-extended-graph/blob/main/.github/workflows/release.yml), which
typechecks, builds and attaches `statistics-extended-graph.js` to the GitHub
release. That asset is what HACS installs, which is why `dist/` is not committed.

```bash
# bump "version" in package.json and note the changes in CHANGELOG.md first
git tag v0.0.5
git push origin v0.0.5
```

Released versions are documented in [CHANGELOG.md](https://github.com/stefgo/ha-statistics-extended-graph/blob/main/CHANGELOG.md).

## Credits

Independent reimplementation inspired by
[energy-custom-graph](https://github.com/Thyraz/energy-custom-graph) (MIT).
Released under the MIT license, see [LICENSE.md](https://github.com/stefgo/ha-statistics-extended-graph/blob/main/LICENSE.md).
