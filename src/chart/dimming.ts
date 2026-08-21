/**
 * Dimming for the time selection: everything that does not belong to the
 * selected bucket fades back, so the selection stands out.
 *
 * Bars are dimmed point by point, since only the bars outside the selected
 * bucket are unaffected by it. A line is drawn as one shape and has no
 * per-point opacity, so the whole line fades instead and its value at the
 * selected bucket is restated as a `markPoint` - one object per series rather
 * than one per sample.
 */

import type { ChartDataPoint, SeriesOption } from "../types/echarts";
import { toTuple } from "./lines";
import { SELECTION_SERIES_ID } from "./selection";

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

const dimLineSeries = (serie: SeriesOption, bucket: number): void => {
  const lineStyle = serie.lineStyle as StyleRecord | undefined;
  const areaStyle = serie.areaStyle as StyleRecord | undefined;

  serie.lineStyle = dimmed(lineStyle);
  serie.itemStyle = dimmed(serie.itemStyle as StyleRecord | undefined);
  if (areaStyle) {
    serie.areaStyle = dimmed(areaStyle);
  }

  // The invisible helpers of a fill band carry no value of their own.
  if (FILL_HELPER_PATTERN.test(String(serie.id ?? ""))) {
    return;
  }

  const value = valueAt(serie, bucket);
  if (value === null) {
    return;
  }

  const color =
    (lineStyle?.color as string | undefined) ??
    (serie.color as string | undefined);

  serie.markPoint = {
    silent: true,
    symbol: "circle",
    symbolSize: MARK_SYMBOL_SIZE,
    label: { show: false },
    animation: false,
    // The mark stays at full strength while the line behind it is faded.
    itemStyle: color ? { color, opacity: 1 } : { opacity: 1 },
    data: [{ coord: [bucket, value] }],
  };
};

/**
 * Fades everything outside the selected bucket. Runs after the bar styling,
 * whose per-item `itemStyle` is preserved, and leaves the marker series of the
 * selection itself untouched.
 */
export const applySelectionDimming = (
  series: SeriesOption[],
  bucket: number
): void => {
  series.forEach((serie) => {
    if (serie.id === SELECTION_SERIES_ID) {
      return;
    }
    if (serie.type === "bar") {
      dimBarSeries(serie, bucket);
    } else if (serie.type === "line") {
      dimLineSeries(serie, bucket);
    }
  });
};
