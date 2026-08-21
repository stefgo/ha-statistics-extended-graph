/**
 * Time selection: one click marks exactly one position of the chart.
 *
 * The selection is plain state of the card and plain data of the chart model -
 * nothing is pushed into the chart instance as an ECharts action. Every redraw
 * re-derives marker and dimming from the stored bucket, so a data refresh, a
 * theme switch or a live update can never lose the selection. It ends with the
 * page, not with a repaint.
 */

import type { AggregationTarget } from "../config/types";
import type { SeriesOption } from "../types/echarts";
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
    if (!Array.isArray(serie.data)) {
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
    if (!Array.isArray(serie.data)) {
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

/** Id of the series that carries the visible selection marker. */
export const SELECTION_SERIES_ID = "__selection_marker";

const BAND_OPACITY = 0.16;

export interface SelectionMarkerParams {
  period: SelectedPeriod;
  computedStyle: CSSStyleDeclaration;
}

/**
 * Builds the visible marker as a series of its own: it carries no data, so it
 * stays out of stacking, bar layout and axis scaling, and it is rebuilt from
 * the selection on every assembly instead of living inside the chart instance.
 *
 * A bucket with a known end is marked as a band across its full width; an
 * open-ended one only gets a line at its position.
 */
export const buildSelectionMarker = ({
  period,
  computedStyle,
}: SelectionMarkerParams): SeriesOption => {
  const accent =
    computedStyle.getPropertyValue("--primary-color").trim() || "#03a9f4";
  const lineColor =
    computedStyle.getPropertyValue("--secondary-text-color").trim() || "#727272";

  const marker: SeriesOption = {
    id: SELECTION_SERIES_ID,
    name: "selection",
    type: "line",
    data: [],
    silent: true,
    animation: false,
    // Behind the data, so bars and lines keep reading as the foreground.
    z: 0,
    xAxisIndex: 0,
    yAxisIndex: 0,
  };

  if (period.end === null) {
    marker.markLine = {
      silent: true,
      animation: false,
      symbol: "none",
      label: { show: false },
      lineStyle: { color: lineColor, width: 1, type: "dashed" },
      data: [{ xAxis: period.start }],
    };
    return marker;
  }

  marker.markArea = {
    silent: true,
    animation: false,
    itemStyle: { color: accent, opacity: BAND_OPACITY },
    label: { show: false },
    data: [[{ xAxis: period.start }, { xAxis: period.end }]],
  };
  return marker;
};
