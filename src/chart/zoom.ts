/**
 * Data zoom: lets the user narrow the visible part of the time axis without
 * changing the loaded range. The card keeps fetching the full period - the
 * zoom is purely a view of the assembled series, so panning and zooming never
 * trigger a reload.
 */

import type { AggregationTarget, ZoomConfig } from "../config/types";
import type { ZoomWindow } from "../time/aggregation";
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
 * that aims for `ticks` labels.
 *
 * Not a taste decision, and not a constant either: the axis divides the visible
 * window by the number of ticks it wants (`TimeScale.calcNiceTicks`:
 * `span / splitNumber`) and rounds the result onto ECharts' ladder of time
 * steps, one rung below included. Once the window is narrow enough for that
 * quotient to fall under one bucket, the axis labels in steps that subdivide
 * the bars - five-minute bars scaled in two-minute steps. The more ticks an
 * axis wants, the wider the window that still survives it, which is why the
 * floor follows the tick count instead of standing on its own.
 *
 * A third of the tick count plus one rung of headroom is where that turns, and
 * three buckets is the floor under the floor. Measured against ECharts 5.6 for
 * `5minute`, `hour`, `day`, `month` and `year`, from five ticks up to thirty.
 * `week` is outside all of this: the ladder has no weekly step, so a weekly
 * chart is labelled in days at every width - with or without a zoom.
 */
const minVisibleBuckets = (ticks: number): number =>
  Math.max(3, Math.ceil(ticks / 3) + 1);

/**
 * The narrowest window worth allowing, in milliseconds. `filterMode: "none"`
 * only clips, so below one bucket ECharts pulls the existing points apart and
 * draws the straight line between two of them - resolution that never existed.
 * The floor is therefore tied to the finest interval this card can still put
 * under the window, not to the one that happens to be loaded.
 *
 * Capped at the width of the window that is already open: a floor that turns
 * coarser afterwards - a detail layer that came back coarser than it was asked
 * for - then blocks zooming in further instead of pushing the view back out
 * from under the hand that opened it. Because that cap follows the window down,
 * a single bucket is the hard stop underneath it: inside one bucket there is
 * nothing but the interpolated line between its neighbours.
 *
 * `0` is ECharts' "no limit" and is what a floor without a fixed bucket grid
 * gets: raw history is the finest resolution there is, and a disabled
 * aggregation draws nothing to zoom into.
 */
export const minWindowSpan = (
  finest: AggregationTarget | undefined,
  window: ZoomWindow | null | undefined,
  axisTicks = DEFAULT_AXIS_TICKS
): number => {
  if (!finest || finest === "raw" || finest === "disabled") {
    return 0;
  }
  const bucket = BUCKET_LENGTH_MS[finest];
  const floor = minVisibleBuckets(axisTicks) * bucket;
  const open = window ? window.end - window.start : undefined;
  if (open === undefined || open <= 0) {
    return floor;
  }
  return Math.max(bucket, Math.min(floor, open));
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
