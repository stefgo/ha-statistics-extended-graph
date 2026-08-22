import {
  addDays,
  addHours,
  addMinutes,
  addMonths,
  addWeeks,
  addYears,
  startOfDay,
  startOfMonth,
  startOfWeek,
  startOfYear,
} from "date-fns";
import type { AggregationTarget } from "../config/types";
import type { StatisticsPeriod } from "../data/statistics";

/** Home Assistant's recorder buckets weeks starting on Monday. */
export const WEEK_OPTIONS = { weekStartsOn: 1 as const };

/**
 * Above this a chart is unusable anyway and the browser tab stalls building it:
 * `5minute` over a year is ~105.000 buckets, one point per bucket per series,
 * and a bar grid of the same size on top. It is a guard against a
 * misconfiguration, not a display limit - `resolveAggregationPlan` keeps the
 * count in range before it gets here.
 */
export const MAX_BUCKETS = 5_000;

/** Nominal length of one bucket, used to size a range before it is built. */
const BUCKET_LENGTH_MS: Record<StatisticsPeriod, number> = {
  "5minute": 5 * 60_000,
  hour: 60 * 60_000,
  day: 24 * 60 * 60_000,
  week: 7 * 24 * 60 * 60_000,
  month: 28 * 24 * 60 * 60_000,
  year: 365 * 24 * 60 * 60_000,
};

/**
 * Roughly how many buckets an interval produces over a range. Month and year
 * use their shortest possible length, so the estimate never undercounts.
 */
export const estimateBucketCount = (
  start: Date,
  end: Date | undefined,
  period: AggregationTarget
): number => {
  if (period === "raw" || period === "disabled") {
    return 0;
  }
  const span = Math.max((end ?? new Date()).getTime() - start.getTime(), 0);
  return Math.ceil(span / BUCKET_LENGTH_MS[period]);
};

export const advanceBucket = (date: Date, period: StatisticsPeriod): Date => {
  switch (period) {
    case "5minute":
      return addMinutes(date, 5);
    case "hour":
      return addHours(date, 1);
    case "day":
      return addDays(date, 1);
    case "week":
      return addWeeks(date, 1);
    case "month":
      return addMonths(date, 1);
    case "year":
      return addYears(date, 1);
    default:
      return addHours(date, 1);
  }
};

export const alignBucketStart = (
  start: number,
  period: StatisticsPeriod
): Date => {
  const date = new Date(start);
  switch (period) {
    case "5minute":
      date.setSeconds(0, 0);
      date.setMinutes(Math.floor(date.getMinutes() / 5) * 5);
      return date;
    case "hour":
      date.setMinutes(0, 0, 0);
      return date;
    case "day":
      return startOfDay(date);
    case "week":
      return startOfWeek(date, WEEK_OPTIONS);
    case "month":
      return startOfMonth(date);
    case "year":
      return startOfYear(date);
    default:
      date.setMinutes(0, 0, 0);
      return date;
  }
};

/**
 * Produces every bucket timestamp of the visible range. Line series are
 * normalized onto this sequence so gaps stay gaps instead of being interpolated
 * across, and bars share one common x position per bucket.
 *
 * Returns `undefined` when no fixed grid exists (open-ended range, raw history
 * or disabled aggregation).
 */
export const buildBucketSequence = (
  start: number,
  end: number | null,
  period: AggregationTarget | undefined
): number[] | undefined => {
  if (
    end === null ||
    period === undefined ||
    period === "raw" ||
    period === "disabled"
  ) {
    return undefined;
  }
  if (end < start) {
    return [start];
  }

  const buckets: number[] = [];
  let cursor = alignBucketStart(start, period);
  let iterations = 0;

  while (cursor.getTime() <= end && iterations < MAX_BUCKETS) {
    buckets.push(cursor.getTime());
    const next = advanceBucket(cursor, period);
    if (next.getTime() === cursor.getTime()) {
      break;
    }
    cursor = next;
    iterations += 1;
  }

  return buckets;
};
