/**
 * Dimming for the time selection: everything that does not belong to the
 * selected bucket fades back, so the selection stands out.
 *
 * Bars are dimmed point by point, since only the bars outside the selected
 * bucket are unaffected by it. A line is drawn as one shape and has no
 * per-point opacity, so the whole line fades instead and its value at the
 * selected bucket is restated as a dot.
 *
 * That dot is a line series of its own holding a single point, not a
 * `markPoint`: the tree-shaken ECharts build of Home Assistant registers no
 * mark components, so a `markPoint` would be dropped silently.
 */

import type { ChartDataPoint, SeriesOption } from "../types/echarts";
import { toTuple } from "./lines";
import { isSelectionSeries, SELECTION_ID_PREFIX } from "./selection";

/** Opacity applied to everything outside the selection. */
export const DIM_OPACITY = 0.5;

const MARK_SYMBOL_SIZE = 8;
const FILL_HELPER_PATTERN = /__fill_(base|area)$/u;

type DataItem = { value: [number, number | null]; [key: string]: unknown };
type StyleRecord = Record<string, unknown>;

const dimmed = (style: StyleRecord | undefined): StyleRecord => {
  const base = style ?? {};
  const current = typeof base.opacity === "number" ? base.opacity : 1;
  return { ...base, opacity: current * DIM_OPACITY };
};

const dimItem = (point: ChartDataPoint, value: [number, number | null]): DataItem => {
  const item: DataItem = Array.isArray(point)
    ? { value }
    : { ...(point as DataItem), value };

  item.itemStyle = dimmed(item.itemStyle as StyleRecord | undefined);

  const label = item.label as StyleRecord | undefined;
  if (label) {
    item.label = { ...label, opacity: DIM_OPACITY };
  }

  return item;
};

const valueAt = (serie: SeriesOption, bucket: number): number | null => {
  if (!Array.isArray(serie.data)) {
    return null;
  }
  for (const point of serie.data) {
    const tuple = toTuple(point);
    if (tuple && tuple[0] === bucket) {
      return tuple[1];
    }
  }
  return null;
};

const dimBarSeries = (serie: SeriesOption, bucket: number): void => {
  if (!Array.isArray(serie.data)) {
    return;
  }
  serie.data = serie.data.map((point) => {
    const tuple = toTuple(point);
    if (!tuple || tuple[0] === bucket) {
      return point;
    }
    return dimItem(point, tuple);
  });
};

/**
 * Y position of a value as it is drawn. A stacked line sits on the sum of the
 * series stacked below it, so the dot has to follow that sum instead of the
 * raw value.
 */
const stackedValueAt = (
  series: SeriesOption[],
  index: number,
  bucket: number
): number | null => {
  const target = series[index];
  const value = valueAt(target, bucket);
  if (value === null) {
    return null;
  }

  const stack = target.stack?.trim();
  if (!stack) {
    return value;
  }

  let sum = 0;
  for (let i = 0; i < index; i += 1) {
    const other = series[i];
    if (other.stack?.trim() !== stack || other.yAxisIndex !== target.yAxisIndex) {
      continue;
    }
    sum += valueAt(other, bucket) ?? 0;
  }
  return sum + value;
};

/**
 * The dot that restates the value of a faded line at the selected bucket. It
 * stays out of every stack and draws above the data.
 */
const buildSelectionDot = (
  serie: SeriesOption,
  value: number,
  bucket: number,
  color: string | undefined
): SeriesOption => ({
  id: `${SELECTION_ID_PREFIX}dot_${serie.id ?? bucket}`,
  name: `${serie.name ?? "selection"} (selected)`,
  type: "line",
  data: [[bucket, value]],
  xAxisIndex: serie.xAxisIndex ?? 0,
  yAxisIndex: serie.yAxisIndex ?? 0,
  symbol: "circle",
  symbolSize: MARK_SYMBOL_SIZE,
  showSymbol: true,
  showAllSymbol: true,
  lineStyle: { width: 0, opacity: 0 },
  // The dot stays at full strength while the line behind it is faded.
  itemStyle: color ? { color, opacity: 1 } : { opacity: 1 },
  z: (serie.z ?? 2) + 1,
  silent: true,
  animation: false,
});

/**
 * Fades a line as a whole and returns the dot for its value at the selected
 * bucket, if it has one.
 */
const dimLineSeries = (
  series: SeriesOption[],
  index: number,
  bucket: number
): SeriesOption | undefined => {
  const serie = series[index];
  const lineStyle = serie.lineStyle as StyleRecord | undefined;
  const areaStyle = serie.areaStyle as StyleRecord | undefined;

  serie.lineStyle = dimmed(lineStyle);
  serie.itemStyle = dimmed(serie.itemStyle as StyleRecord | undefined);
  if (areaStyle) {
    serie.areaStyle = dimmed(areaStyle);
  }

  // The invisible helpers of a fill band carry no value of their own.
  if (FILL_HELPER_PATTERN.test(String(serie.id ?? ""))) {
    return undefined;
  }

  const value = stackedValueAt(series, index, bucket);
  if (value === null) {
    return undefined;
  }

  const color =
    (lineStyle?.color as string | undefined) ??
    (serie.color as string | undefined);

  return buildSelectionDot(serie, value, bucket, color);
};

/**
 * Fades everything outside the selected bucket. Runs after the bar styling,
 * whose per-item `itemStyle` is preserved, and leaves the helper series of the
 * selection itself untouched. Returns the dots of the faded lines, which the
 * caller appends to the series.
 */
export const applySelectionDimming = (
  series: SeriesOption[],
  bucket: number
): SeriesOption[] => {
  const dots: SeriesOption[] = [];

  series.forEach((serie, index) => {
    if (isSelectionSeries(serie)) {
      return;
    }
    if (serie.type === "bar") {
      dimBarSeries(serie, bucket);
    } else if (serie.type === "line") {
      const dot = dimLineSeries(series, index, bucket);
      if (dot) {
        dots.push(dot);
      }
    }
  });

  return dots;
};
