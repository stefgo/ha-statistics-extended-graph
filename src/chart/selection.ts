/**
 * Time selection: one click marks exactly one position of the chart.
 *
 * The selection is plain state of the card and plain data of the chart model -
 * nothing is pushed into the chart instance as an ECharts action. Every redraw
 * re-derives marker and dimming from the stored bucket, so a data refresh, a
 * theme switch or a live update can never lose the selection. It ends with the
 * page, not with a repaint.
 *
 * The marker is drawn as a line series of its own, not as `markArea` or
 * `markLine`: Home Assistant ships a tree-shaken ECharts build that registers
 * only the bar, line and custom charts, so the mark components do not exist and
 * their options are dropped without a word. A hidden `0..1` y axis lets that
 * series span the full plot height without touching the scale of the data axes.
 */

import type { AggregationTarget } from "../config/types";
import type { SeriesOption, YAxisOption } from "../types/echarts";
import { advanceBucket } from "../time/buckets";
import { toTuple } from "./lines";

/** The period a selected bucket stands for. */
export interface SelectedPeriod {
  /** X value of the bucket the click snapped to. */
  bucket: number;
  /** Start of the period in epoch milliseconds. */
  start: number;
  /** End of the period (exclusive), `null` for an open-ended last bucket. */
  end: number | null;
}

/**
 * Snaps a clicked x position onto an existing sample. A click may land
 * anywhere in the plotting area, so the closest sample of any series wins.
 */
export const resolveBucket = (
  series: SeriesOption[],
  x: number
): number | null => {
  let bucket: number | null = null;
  let distance = Number.POSITIVE_INFINITY;

  series.forEach((serie) => {
    if (isSelectionSeries(serie) || !Array.isArray(serie.data)) {
      return;
    }
    serie.data.forEach((point) => {
      const tuple = toTuple(point);
      if (!tuple) {
        return;
      }
      const candidate = Math.abs(tuple[0] - x);
      if (candidate < distance) {
        distance = candidate;
        bucket = tuple[0];
      }
    });
  });

  return bucket;
};

/** First sample after `bucket` across all series - the end of a raw selection. */
const nextSampleAfter = (
  series: SeriesOption[],
  bucket: number
): number | null => {
  let next: number | null = null;
  series.forEach((serie) => {
    if (isSelectionSeries(serie) || !Array.isArray(serie.data)) {
      return;
    }
    serie.data.forEach((point) => {
      const tuple = toTuple(point);
      if (!tuple || tuple[0] <= bucket) {
        return;
      }
      if (next === null || tuple[0] < next) {
        next = tuple[0];
      }
    });
  });
  return next;
};

export interface SelectionContext {
  series: SeriesOption[];
  buckets?: number[];
  aggregation?: AggregationTarget;
  displayEnd: number | null;
}

/**
 * Resolves a clicked x position into the period it selects.
 *
 * On a fixed grid the next bucket ends the period - the last one is closed by
 * advancing the aggregation period, so a bucket reaching past the visible end
 * keeps its full length. Without a grid (raw history) the next sample ends it.
 */
export const resolveSelection = (
  x: number | null,
  { series, buckets, aggregation, displayEnd }: SelectionContext
): SelectedPeriod | null => {
  if (x === null) {
    return null;
  }

  const bucket = resolveBucket(series, x);
  if (bucket === null) {
    return null;
  }

  if (
    buckets?.length &&
    aggregation &&
    aggregation !== "raw" &&
    aggregation !== "disabled"
  ) {
    const index = buckets.indexOf(bucket);
    if (index >= 0) {
      const end =
        index + 1 < buckets.length
          ? buckets[index + 1]
          : advanceBucket(new Date(bucket), aggregation).getTime();
      return { bucket, start: bucket, end };
    }
  }

  return {
    bucket,
    start: bucket,
    end: nextSampleAfter(series, bucket) ?? displayEnd,
  };
};

/** Id prefix of every series that only exists to draw the selection. */
export const SELECTION_ID_PREFIX = "__selection_";

/** Id of the series that draws the marker of the selected bucket. */
export const SELECTION_SERIES_ID = `${SELECTION_ID_PREFIX}marker`;

/** Id of the hidden `0..1` axis the marker is drawn on. */
export const SELECTION_AXIS_ID = `${SELECTION_ID_PREFIX}axis`;

/** True for the helper series of the selection, which carry no data of a series. */
export const isSelectionSeries = (serie: { id?: string }): boolean =>
  String(serie.id ?? "").startsWith(SELECTION_ID_PREFIX);

const BAND_OPACITY = 0.16;

/**
 * The axis the marker is drawn on: hidden, fixed to `0..1`, so a marker value
 * of `1` reaches the top of the plot without changing the data axes. It is
 * always part of the option, whether something is selected or not, which keeps
 * the axis indices of the data series stable across redraws.
 */
export const buildSelectionAxis = (): YAxisOption => ({
  id: SELECTION_AXIS_ID,
  type: "value",
  show: false,
  min: 0,
  max: 1,
  scale: false,
  axisLabel: { show: false },
  splitLine: { show: false },
});

export interface SelectionMarkerParams {
  period: SelectedPeriod;
  computedStyle: CSSStyleDeclaration;
  /** Index of the hidden axis inside the y axis array. */
  axisIndex: number;
}

/**
 * Builds the visible marker. A bucket with a known end becomes a band across
 * its full width - an area from `1` down to the zero line of the hidden axis;
 * an open-ended one only gets a dashed line at its position.
 */
export const buildSelectionMarker = ({
  period,
  computedStyle,
  axisIndex,
}: SelectionMarkerParams): SeriesOption => {
  const accent =
    computedStyle.getPropertyValue("--primary-color").trim() || "#03a9f4";
  const lineColor =
    computedStyle.getPropertyValue("--secondary-text-color").trim() || "#727272";

  const marker: SeriesOption = {
    id: SELECTION_SERIES_ID,
    name: "selection",
    type: "line",
    silent: true,
    animation: false,
    // Behind the data, so bars and lines keep reading as the foreground.
    z: 0,
    xAxisIndex: 0,
    yAxisIndex: axisIndex,
    showSymbol: false,
    symbol: "none",
    data:
      period.end === null
        ? [
            [period.start, 0],
            [period.start, 1],
          ]
        : [
            [period.start, 1],
            [period.end, 1],
          ],
  };

  if (period.end === null) {
    marker.lineStyle = { color: lineColor, width: 1, type: "dashed" };
    return marker;
  }

  marker.lineStyle = { width: 0, opacity: 0 };
  marker.areaStyle = { color: accent, opacity: BAND_OPACITY, origin: "start" };
  return marker;
};
