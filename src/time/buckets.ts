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

const MAX_BUCKETS = 200_000;

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
