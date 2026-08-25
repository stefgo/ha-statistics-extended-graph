/**
 * Data zoom: lets the user narrow the visible part of the time axis without
 * changing the loaded range. The card keeps fetching the full period - the
 * zoom is purely a view of the assembled series, so panning and zooming never
 * trigger a reload.
 */

import type { DataZoomConfig, ZoomGesture } from "../config/types";
import { resolveDataZoom } from "../config/data-zoom";
import type { ChartOptions, DataZoomOption } from "../types/echarts";

/** Height of the slider handle bar plus its gap to the plotting area. */
export const SLIDER_GRID_BOTTOM = 38;

const SLIDER_HEIGHT = 26;
const SLIDER_BOTTOM = 4;

const clampPercent = (value: number | undefined): number | undefined =>
  typeof value === "number" && Number.isFinite(value)
    ? Math.min(100, Math.max(0, value))
    : undefined;

const gesture = (
  value: ZoomGesture | undefined,
  fallback: ZoomGesture
): ZoomGesture => (value === undefined ? fallback : value);

export { resolveDataZoom };

export const hasSlider = (config: DataZoomConfig): boolean =>
  config.type === "slider" || config.type === "both";

/**
 * Builds the `dataZoom` option array. `filterMode: "none"` keeps every data
 * point in place: values outside the window are only clipped, so stacks and
 * compare series stay aligned and the y axis does not jump while panning.
 */
export const buildDataZoom = (config: DataZoomConfig): DataZoomOption[] => {
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
    ...(config.min_span !== undefined ? { minSpan: clampPercent(config.min_span) } : {}),
    ...(config.zoom_lock !== undefined ? { zoomLock: config.zoom_lock } : {}),
  };

  const zooms: DataZoomOption[] = [];

  if (config.type !== "slider") {
    zooms.push({
      ...shared,
      type: "inside",
      zoomOnMouseWheel: gesture(config.zoom_on_mouse_wheel, true),
      moveOnMouseMove: gesture(config.move_on_mouse_move, true),
      moveOnMouseWheel: gesture(config.move_on_mouse_wheel, false),
    });
  }

  if (hasSlider(config)) {
    zooms.push({
      ...shared,
      type: "slider",
      height: SLIDER_HEIGHT,
      bottom: SLIDER_BOTTOM,
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
