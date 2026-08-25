/**
 * Data zoom: lets the user narrow the visible part of the time axis without
 * changing the loaded range. The card keeps fetching the full period - the
 * zoom is purely a view of the assembled series, so panning and zooming never
 * trigger a reload.
 */

import type { ZoomConfig } from "../config/types";
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

const clampPercent = (value: number | undefined): number | undefined =>
  typeof value === "number" && Number.isFinite(value)
    ? Math.min(100, Math.max(0, value))
    : undefined;

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
 * Builds the `dataZoom` option array. `filterMode: "none"` keeps every data
 * point in place: values outside the window are only clipped, so stacks and
 * compare series stay aligned and the y axis does not jump while panning.
 */
export const buildDataZoom = (
  config: ZoomConfig,
  zoomed: boolean
): DataZoomOption[] => {
  const start = clampPercent(config.start);
  const end = clampPercent(config.end);
  const window = {
    start: start ?? 0,
    end: end !== undefined && start !== undefined && end <= start ? 100 : end ?? 100,
  };

  const shared = {
    xAxisIndex: 0,
    filterMode: "none" as const,
    ...window,
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
