# Custom Graph

A lightweight statistics chart card for Home Assistant Lovelace dashboards.

The card follows the Home Assistant **energy date picker**, reuses the ECharts
runtime that Home Assistant already ships (no extra chart library is loaded),
and is configured entirely in YAML.

Unlike the built-in energy cards it is not limited to the entities of the energy
dashboard: any entity with long-term statistics can be charted, as well as
unaggregated ("raw") recorder history.

## Features

- Time range follows the energy date picker (`energy-date-selection`), or is set
  manually as a relative or fixed range.
- Any long-term statistic, with a per-series statistic type
  (`change`, `sum`, `mean`, `min`, `max`, `state`).
- Raw recorder history for short ranges, including live streaming updates.
- Bar, line and step charts, freely mixed and stackable.
- Calculated series: add, subtract, multiply and divide several statistics into
  one computed signal.
- Per-series time offset, e.g. to show this year and last year side by side.
- Compare support for the energy date picker's compare toggle.
- Left and right Y axis with independent scaling, limits and units.
- Optional area fills, gradient fills and fill-between-two-lines bands.
- Per-theme colors (light/dark) and access to the Home Assistant energy palette.
- Aggregation overrides per picker range, with an optional fallback interval.
- Optional live estimate for the current hour, built from 5-minute statistics.
- Boolean-like states (`on/off`, `open/closed`, `true/false`) are mapped to 1/0.

## Installation

### HACS (custom repository)

1. Open *HACS → Frontend*, then the three-dot menu in the top right.
2. Choose *Custom repositories*, add `https://github.com/stefgo/ha-custom-graph`
   and set the category to *Lovelace*.
3. Search for "Custom Graph" in HACS and install the latest release.
4. Reload the browser and clear the cache if the card does not appear.

### Manual installation

1. Download `dist/customgraph.js` from the release or build it yourself
   (`npm install && npm run build`).
2. Copy it to `config/www/community/custom-graph/customgraph.js`.
3. Add the resource under *Settings → Dashboards → Resources → + ADD RESOURCE*:
   - URL: `/local/community/custom-graph/customgraph.js`
   - Resource type: `JavaScript Module`
4. Clear the browser cache and reload the page.

### Deploy script

For development there is `builddeploy.sh`: it builds the card and copies
`dist/customgraph.js` to the Home Assistant instance over SSH.

1. `cp .env.example .env` and enter your instance (`CUSTOMGRAPH_HOST`, and
   optionally port, config path or target directory). `.env` is git-ignored.
2. Run `./builddeploy.sh`.

## Quick start

The card has no visual editor: add it through the dashboard's *Manual card* /
raw YAML editor.

```yaml
type: custom:custom-graph-card
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

### Card options

| Key | Type | Default | Description |
| --- | --- | --- | --- |
| `type` | string | – | Must be `custom:custom-graph-card`. |
| `title` | string | – | Optional card header. |
| `chart_height` | string | auto | CSS height (e.g. `300px`). Ignored in section layouts, where the grid rows define the height. |
| `timespan` | object | `{mode: energy}` | Time range shown by the card, see below. |
| `collection_key` | string | – | Key of the energy date picker to bind to, when a dashboard has [multiple collections](https://www.home-assistant.io/dashboards/energy/#using-multiple-collections). |
| `allow_compare` | boolean | `true` | Honour the picker's compare toggle. Ignored when any series uses `time_offset`. |
| `color_cycle` | list | energy palette | Colors for series without an explicit `color`. Each entry is a string or a `{light, dark}` object. |
| `y_axes` | list | – | Configuration of the left and right Y axis, see below. |
| `aggregation` | object | auto | Recorder interval overrides, see below. |
| `series` | list | – | One or more series definitions, see below. At least one is required. |

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

| Key | Type | Default | Description |
| --- | --- | --- | --- |
| `statistic_id` | string | – | Entity providing long-term statistics. Required unless `calculation` is used. |
| `source` | `statistic`, `calculation` | inferred | Data source. Detected automatically from `statistic_id` / `calculation`. |
| `name` | string | entity name | Display name of the series. |
| `stat_type` | `change`, `sum`, `mean`, `min`, `max`, `state` | `change` | Statistic type. Calculation terms have their own setting. |
| `chart_type` | `bar`, `line`, `step` | `bar` | How the series is drawn. |
| `stack` | string | – | Series sharing a stack key are stacked on top of each other. |
| `y_axis` | `left`, `right` | `left` | Axis the series is drawn against. |
| `color` | string or object | palette | `#rrggbb`, `rgb()`, a CSS variable such as `--energy-solar-color`, or `{light, dark}`. |
| `compare_color` | string or object | inherited | Color of the compare series. Defaults to the series color at reduced opacity. |
| `multiply` | number | `1` | Factor applied to every value. |
| `add` | number | `0` | Offset added after `multiply`. |
| `clip_min` | number | – | Values below this bound are raised to it. |
| `clip_max` | number | – | Values above this bound are lowered to it. |
| `fill` | boolean | `false` | Fill the area below a line/step series. |
| `fill_opacity` | number | `0.15` line / `0.5` bar | Opacity of the fill. |
| `gradient_fill` | boolean | `false` | Fade the fill towards the zero line (line/step only). |
| `fill_to_series` | string | – | Fill the band between this line and the named line series. |
| `line_opacity` | number | `0.85` line / `1.0` bar border | Stroke opacity. |
| `line_width` | number | `1.5` | Line thickness in pixels (lines only). |
| `line_style` | `solid`, `dashed`, `dotted` | `solid` | Line pattern (lines only). |
| `smooth` | boolean or number | `true` | Line smoothing; a number between 0 and 1 controls the amount. Ignored for step charts. |
| `show_value_labels` | boolean | `false` | Draw the value at the end of each non-zero bar. Unstacked bars only. |
| `value_label_precision` | number | `0` | Decimals of the value labels. |
| `calculation` | object | – | Computed series, see below. |
| `time_offset` | object | – | Load this series from a shifted source range, see below. |

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
| `stat_type` | see above | series value | Statistic type of this term. |
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
| `min` | number | auto | Lower bound. Ignored when `center_zero` is active. |
| `max` | number | auto | Upper bound. With `center_zero` it defines both bounds (`max: 10` → -10 … +10). |
| `fit_y_data` | boolean | `false` | Scale tightly to the data instead of including zero. |
| `center_zero` | boolean | `false` | Symmetric range around zero, calculated from the data when `max` is unset. |
| `logarithmic_scale` | boolean | `false` | Logarithmic axis. |
| `hide_grid` | boolean | `false` | Hide the horizontal grid lines of this axis. |
| `unit` | string | – | Unit label drawn at the axis. |

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
type: custom:custom-graph-card
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
type: custom:custom-graph-card
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
type: custom:custom-graph-card
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
type: custom:custom-graph-card
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
type: custom:custom-graph-card
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
type: custom:custom-graph-card
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
marked as a band (a dashed line when the bucket has no known end), every bar
outside it is dimmed to 50 %, and line series - which are drawn as one shape and
cannot dim single points - fade as a whole and restate their value at the
selection as a dot.

The selection is card state, not chart state: it is re-derived on every redraw
and therefore survives data refreshes, live updates and theme switches. It ends
with a reload, with leaving the page, or with a switch of the visible range,
whose buckets the selection no longer belongs to.

Every change fires a `custom-graph-selection` event that bubbles out of the
card:

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
| "No statistics available for the selected period" | The entity has no long-term statistics in the range. Check that recorder and statistics are enabled for it, or switch the range to `raw`. |
| "Choose a shorter time range" | The resolved aggregation is `disabled` for this range - by design of your `aggregation.energy_picker` configuration. |
| Chart does not follow the date picker | The dashboard has no `energy-date-selection` card, or the wrong `collection_key`. Without a picker the card falls back to today. |
| Warning about unsupported options | The configuration contains options of the full-featured upstream card (legend, tooltip, axis pointers, forecast). Remove them. |
| Series is missing | Check the browser console: misconfigured series, empty calculations and unresolved `fill_to_series` references are logged there. |

## Development

```bash
npm install       # install dependencies
npm run typecheck # TypeScript, no emit
npm run build     # production bundle in dist/
npm run watch     # rebuild into a local Home Assistant www folder
```

The architecture of the source tree is documented in
[docs/architecture.md](docs/architecture.md).

## Credits

Independent reimplementation inspired by
[energy-custom-graph](https://github.com/Thyraz/energy-custom-graph) (MIT).
Released under the MIT license, see [LICENSE.md](LICENSE.md).
