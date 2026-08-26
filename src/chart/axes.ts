import type { HomeAssistant } from "custom-card-helpers";
import { differenceInDays, subHours } from "date-fns";
import type { AggregationTarget, AxisConfig, SeriesConfig } from "../config/types";
import type { SeriesOption, XAxisOption, YAxisOption } from "../types/echarts";
import { formatDatePart, formatNumber } from "../core/format";
import { BUCKET_LENGTH_MS } from "../time/buckets";
import { toTuple } from "./lines";

/**
 * ECharts raises its approximated tick distance to `minInterval`, but picks the
 * actual spacing from its own ladder of time steps afterwards - and that step
 * regularly lands below the value it was given. A 30 minute window of
 * `5minute` data divided by the ten ticks the chart aims for lands at three
 * minutes, which the ladder answers with two: every bucket subdivided, and the
 * requested five minutes ignored. Asking for twice the bucket pushes the
 * choice onto the next step at or above it; measured across window widths from
 * 3 to 400 buckets it never falls short. The other intervals sit on that ladder themselves and
 * need no such margin - doubling `year` would only label every second one.
 */
const MIN_INTERVAL_FACTOR: Partial<Record<AggregationTarget, number>> = {
  "5minute": 2,
};

/**
 * Smallest distance between two axis ticks, so a tick never subdivides a
 * bucket. Coarser spacing stays ECharts' decision, and an axis that says
 * nothing is left to the default of `<ha-chart-base>`.
 *
 * A zoomable axis has to say something for every interval, not just for the
 * ones with a custom label: `<ha-chart-base>` fills in a `minInterval` of its
 * own whenever the axis leaves it undefined, and derives it from the distance
 * between `min` and `max` - for ranges beyond two days that is a full day. The
 * axis deliberately spans the whole period even while zoomed in, and the zoom
 * does not feed back into that default, so a zoomed-in window would inherit
 * day-spaced ticks and end up with a single label, or none at all.
 *
 * Without a zoom there is nothing to correct: the default is derived from the
 * range that is actually drawn, so the axis keeps the spacing it always had
 * and only months and years still ask for their bucket length.
 */
const axisMinInterval = (
  aggregation: AggregationTarget | undefined,
  zoomable: boolean
): number | undefined => {
  if (!aggregation || aggregation === "raw" || aggregation === "disabled") {
    // Explicitly unconstrained - leaving it out would hand a zoomable axis
    // back to the default.
    return zoomable ? 0 : undefined;
  }
  if (!zoomable && aggregation !== "month" && aggregation !== "year") {
    return undefined;
  }
  return BUCKET_LENGTH_MS[aggregation] * (MIN_INTERVAL_FACTOR[aggregation] ?? 1);
};

const formatMonthLabel = (value: number, hass?: HomeAssistant): string => {
  const date = new Date(value);
  const isJanuary = date.getMonth() === 0;
  const label = formatDatePart(
    date,
    isJanuary ? { month: "long", year: "numeric" } : { month: "long" },
    hass
  );
  // Highlight the year boundary inside a multi-year range.
  return isJanuary ? `{bold|${label}}` : label;
};

/**
 * Keeps the last bucket of a long range fully visible: months and years are
 * labelled at their start, so the axis has to reach the final bucket start.
 */
const computeAxisMax = (
  start: Date,
  end: Date | undefined,
  aggregation: AggregationTarget | undefined,
  buckets: number[] | undefined,
  fallbackEnd: number | null
): number => {
  if (
    (aggregation === "month" || aggregation === "year") &&
    buckets &&
    buckets.length > 1
  ) {
    const lastBucket = buckets[buckets.length - 1];
    if (lastBucket > start.getTime()) {
      return lastBucket;
    }
  }

  if (!end) {
    return fallbackEnd ?? start.getTime();
  }

  // Trim the exclusive end of long ranges back to the last labelled tick.
  const dayDifference = differenceInDays(end, start);
  let max = new Date(end);
  if (dayDifference > 2 && max.getHours() === 0) {
    max = subHours(max, 1);
  }
  if (dayDifference > 2) {
    max.setMinutes(0, 0, 0);
  }
  if (dayDifference > 35) {
    max.setDate(1);
  }
  if (dayDifference > 2) {
    max.setHours(0);
  }
  return max.getTime();
};

export interface XAxisParams {
  start: Date;
  end?: Date;
  aggregation: AggregationTarget | undefined;
  /** Interval the labels are written for; defaults to `aggregation`. */
  labelAggregation?: AggregationTarget;
  /** Whether a zoom can narrow this axis; see {@link axisMinInterval}. */
  zoomable?: boolean;
  buckets?: number[];
  fallbackEnd: number | null;
  hass?: HomeAssistant;
}

export const buildXAxis = ({
  start,
  end,
  aggregation,
  labelAggregation = aggregation,
  zoomable = false,
  buckets,
  fallbackEnd,
  hass,
}: XAxisParams): XAxisOption[] => {
  const primary: XAxisOption = {
    id: "primary",
    type: "time",
    min: start,
    max: computeAxisMax(start, end, aggregation, buckets, fallbackEnd),
    axisPointer: { show: false },
  };

  // Follows what is drawn, so the detail layer of a zoom is labelled at its
  // own resolution instead of the one the full range was loaded at.
  const minInterval = axisMinInterval(labelAggregation, zoomable);
  if (minInterval !== undefined) {
    primary.minInterval = minInterval;
  }

  if (labelAggregation === "month") {
    primary.axisLabel = {
      formatter: (value: number) => formatMonthLabel(value, hass),
    };
  } else if (labelAggregation === "year") {
    primary.axisLabel = {
      formatter: (value: number) =>
        formatDatePart(new Date(value), { year: "numeric" }, hass),
    };
  }

  // `ha-chart-base` expects a second, hidden axis for its internal handling.
  return [primary, { id: "secondary", type: "time", show: false }];
};

/** Rounds up to a readable axis bound (1, 1.2, 1.5, 2, ... times a power of 10). */
const roundToNiceValue = (value: number): number => {
  if (value === 0) {
    return 1;
  }
  const niceNumbers = [1, 1.2, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10];
  const magnitude = 10 ** Math.floor(Math.log10(Math.abs(value)));
  const normalized = Math.abs(value) / magnitude;
  return (niceNumbers.find((n) => n >= normalized) ?? 10) * magnitude;
};

/**
 * Data range of one axis. Stacked series are summed per timestamp, with
 * positive and negative stacks tracked separately - exactly how ECharts stacks.
 */
const getDataRange = (
  series: SeriesOption[],
  axisIndex: number
): { min: number; max: number } | undefined => {
  const relevant = series.filter((serie) => (serie.yAxisIndex ?? 0) === axisIndex);
  if (!relevant.length) {
    return undefined;
  }

  let min = Infinity;
  let max = -Infinity;
  const stackTotals = new Map<string, Map<number, { positive: number; negative: number }>>();

  relevant.forEach((serie) => {
    serie.data?.forEach((point) => {
      const tuple = toTuple(point);
      if (!tuple || tuple[1] === null || !Number.isFinite(tuple[1])) {
        return;
      }
      const [timestamp, value] = tuple as [number, number];

      if (!serie.stack) {
        min = Math.min(min, value);
        max = Math.max(max, value);
        return;
      }

      const perStack = stackTotals.get(serie.stack) ?? new Map();
      const totals = perStack.get(timestamp) ?? { positive: 0, negative: 0 };
      if (value >= 0) {
        totals.positive += value;
      } else {
        totals.negative += value;
      }
      perStack.set(timestamp, totals);
      stackTotals.set(serie.stack, perStack);
    });
  });

  stackTotals.forEach((perStack) => {
    perStack.forEach(({ positive, negative }) => {
      min = Math.min(min, negative);
      max = Math.max(max, positive);
    });
  });

  if (!Number.isFinite(min) || !Number.isFinite(max)) {
    return undefined;
  }
  return { min, max };
};

export interface YAxisParams {
  axes: AxisConfig[];
  seriesConfigs: SeriesConfig[];
  series: SeriesOption[];
  hass?: HomeAssistant;
}

export const buildYAxes = ({
  axes,
  seriesConfigs,
  series,
  hass,
}: YAxisParams): YAxisOption[] => {
  const leftConfig = axes.find((axis) => axis.id === "left");
  const rightConfig = axes.find((axis) => axis.id === "right");
  const usesRight =
    !!rightConfig || seriesConfigs.some((config) => config.y_axis === "right");

  const createAxis = (
    config: AxisConfig | undefined,
    index: number
  ): YAxisOption => {
    let min = config?.min;
    let max = config?.max;

    if (config?.center_zero) {
      if (max !== undefined) {
        min = -max;
      } else {
        const range = getDataRange(series, index);
        if (range) {
          const bound = roundToNiceValue(
            Math.max(Math.abs(range.min), Math.abs(range.max))
          );
          min = -bound;
          max = bound;
        }
      }
    }

    return {
      type: config?.logarithmic_scale ? "log" : "value",
      name: config?.unit,
      nameGap: config?.unit ? 2 : 0,
      nameTextStyle: { align: "left" },
      position: index === 0 ? "left" : "right",
      min,
      max,
      splitLine: { show: !config?.hide_grid },
      axisLabel: {
        formatter: (value: number) => formatNumber(value, hass),
      },
      scale: config?.fit_y_data ?? false,
      axisPointer: { show: false },
    };
  };

  const yAxis = [createAxis(leftConfig, 0)];
  if (usesRight) {
    yAxis.push(createAxis(rightConfig, 1));
  }
  return yAxis;
};
