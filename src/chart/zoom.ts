/**
 * Data zoom: lets the user narrow the visible part of the time axis without
 * changing the loaded range. The card keeps fetching the full period - the
 * zoom is purely a view of the assembled series, so panning and zooming never
 * trigger a reload.
 */

import type { AggregationTarget, ZoomConfig } from "../config/types";
import { BUCKET_LENGTH_MS } from "../time/buckets";
import { DEFAULT_AXIS_TICKS } from "./zoom-input";
import type { ChartOptions, DataZoomOption } from "../types/echarts";

/** Height of the slider handle bar plus its gap to the plotting area. */
export const SLIDER_GRID_BOTTOM = 38;

const SLIDER_HEIGHT = 26;
const SLIDER_BOTTOM = 4;
/**
 * The handles are centred on the window edges, so half of one hangs over the
 * end of the bar. Without this inset the handle at 100% is clipped by the card.
 */
const SLIDER_HANDLE_SIZE = 18;
const SLIDER_SIDE_INSET = SLIDER_HANDLE_SIZE / 2 + 1;

/**
 * A percentage as configured, or `undefined` for anything that is not one.
 * Out-of-range values are dropped rather than clamped: clamping a `start` of
 * `150` to `100` would open the card on a window of zero width, while the
 * warning in `validate.ts` promises the value is ignored.
 */
const percent = (value: number | undefined): number | undefined =>
  typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 100
    ? value
    : undefined;

/**
 * The window the configuration opens on. Anything that does not describe a
 * window growing to the right - a reversed pair, or a `start` of `100` - falls
 * back to the full range, which is what the warning announces.
 */
const resolveWindow = (config: ZoomConfig): { start: number; end: number } => {
  const start = percent(config.start) ?? 0;
  const end = percent(config.end) ?? 100;
  return end > start ? { start, end } : { start: 0, end: 100 };
};

/**
 * Whether the slider bar is on screen. `auto` shows it only while a zoom
 * window exists, so the plotting area keeps the room the bar would take as
 * long as the chart shows the whole range.
 */
export const sliderVisible = (config: ZoomConfig, zoomed: boolean): boolean =>
  config.type === "slider" || config.type === "both" || (config.type === "auto" && zoomed);

/** Whether the option set carries a slider at all, shown or hidden. */
const hasSliderComponent = (config: ZoomConfig): boolean =>
  config.type === "slider" || config.type === "both" || config.type === "auto";

/**
 * How many buckets a window has to keep showing at the very least, for an axis
 * that puts `ticks` labels across its width.
 *
 * One label per bucket is the whole rule: an axis that writes `n` labels over
 * its window needs a window of `n` buckets before those labels can land on
 * bucket boundaries, and any narrower window forces it to subdivide - a chart
 * of five-minute bars scaled in two-minute steps. The label density is a
 * property of the chart, not of the zoom, so it is measured on the drawn axis
 * rather than modelled: ECharts' own tick algorithm, whatever
 * `<ha-chart-base>` configures on top of it, and the rung the ladder adds below
 * the step it picked are all already contained in the number that comes back.
 *
 * Three buckets is the floor under the floor, for an axis so sparsely labelled
 * that its own count would allow a window of one or two bars.
 */
const minVisibleBuckets = (ticks: number): number => Math.max(3, ticks);

/**
 * The narrowest window worth allowing, in milliseconds. `filterMode: "none"`
 * only clips, so below one bucket ECharts pulls the existing points apart and
 * draws the straight line between two of them - resolution that never existed,
 * under an axis that has started labelling between the bars.
 *
 * The floor is tied to the finest interval this card can still put under the
 * window, not to the one that happens to be loaded, and it holds unconditionally
 * - including against a window that is already narrower than it. A floor that
 * gave way to the window it is meant to limit would give way again at every
 * step, which is no floor at all; the view is pushed back out to it instead.
 * That only ever happens when the recorder turns out to hold nothing finer for
 * this window, and pushing out is then the truthful answer.
 *
 * `0` is ECharts' "no limit" and is what a floor without a fixed bucket grid
 * gets: raw history is the finest resolution there is, and a disabled
 * aggregation draws nothing to zoom into.
 */
export const minWindowSpan = (
  finest: AggregationTarget | undefined,
  axisTicks = DEFAULT_AXIS_TICKS
): number => {
  if (!finest || finest === "raw" || finest === "disabled") {
    return 0;
  }
  return minVisibleBuckets(axisTicks) * BUCKET_LENGTH_MS[finest];
};

/**
 * Builds the `dataZoom` option array. `filterMode: "none"` keeps every data
 * point in place: values outside the window are only clipped, so stacks and
 * compare series stay aligned and the y axis does not jump while panning.
 */
export const buildDataZoom = (
  config: ZoomConfig,
  zoomed: boolean,
  minSpan = 0
): DataZoomOption[] => {
  const shared = {
    xAxisIndex: 0,
    filterMode: "none" as const,
    // Always named, even as `0`: ECharts merges `dataZoom` by key, so leaving
    // it out would keep the floor of the previous frame standing.
    minValueSpan: minSpan,
    ...resolveWindow(config),
    ...(config.zoom_lock !== undefined ? { zoomLock: config.zoom_lock } : {}),
  };

  const zooms: DataZoomOption[] = [];

  if (config.type !== "slider") {
    // The gestures stay at the ECharts defaults: the wheel zooms and a drag
    // pans, which is what a chart in a dashboard is expected to do.
    zooms.push({ ...shared, type: "inside" });
  }

  if (hasSliderComponent(config)) {
    zooms.push({
      ...shared,
      type: "slider",
      // A hidden slider stays in the array rather than leaving it: ECharts
      // merges `dataZoom` by index, so a shorter array would leave a bar that
      // is already on screen standing. `show` is the only reliable switch.
      show: sliderVisible(config, zoomed),
      height: SLIDER_HEIGHT,
      bottom: SLIDER_BOTTOM,
      left: SLIDER_SIDE_INSET,
      right: SLIDER_SIDE_INSET,
      handleSize: SLIDER_HANDLE_SIZE,
      // The card draws no axis pointer, so the slider stays a plain handle bar.
      showDetail: false,
      brushSelect: false,
    });
  }

  return zooms;
};

/**
 * Removes the configured window from an already built option set. ECharts
 * keeps the current zoom of a merged option as long as it names no `start` /
 * `end`, so a live refresh redraws the data without snapping the view back to
 * where the configuration put it.
 */
export const dropZoomWindow = (options: ChartOptions): ChartOptions => {
  if (!options.dataZoom?.length) {
    return options;
  }
  return {
    ...options,
    dataZoom: options.dataZoom.map(({ start, end, ...rest }) => rest as DataZoomOption),
  };
};

/**
 * Pins an already built option set to an explicit window. `<ha-chart-base>`
 * rebuilds its ECharts instance when the theme flips, and a fresh instance
 * starts at the full range - so the merge that keeps the user's zoom alive
 * (`dropZoomWindow`) has nothing left to keep. Naming the window in values
 * rather than percentages restores exactly the buckets the detail layer was
 * loaded for.
 */
export const applyZoomWindow = (
  options: ChartOptions,
  window: { start: number; end: number }
): ChartOptions => {
  if (!options.dataZoom?.length) {
    return options;
  }
  return {
    ...options,
    dataZoom: options.dataZoom.map(({ start, end, ...rest }) => ({
      ...rest,
      startValue: window.start,
      endValue: window.end,
    })) as DataZoomOption[],
  };
};
