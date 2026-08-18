import {
  addDays,
  addHours,
  addMinutes,
  addMonths,
  addWeeks,
  addYears,
  endOfDay,
  endOfHour,
  endOfMonth,
  endOfWeek,
  endOfYear,
  startOfDay,
  startOfHour,
  startOfMonth,
  startOfWeek,
  startOfYear,
  subDays,
  subHours,
  subMonths,
} from "date-fns";
import type {
  RelativeCalendarPeriod,
  RelativePeriod,
  TimespanConfig,
} from "../config/types";
import { WEEK_OPTIONS } from "./buckets";

export interface TimeRange {
  start: Date;
  end?: Date;
}

export const DEFAULT_TIMESPAN: TimespanConfig = { mode: "energy" };

const CALENDAR_PERIODS: RelativeCalendarPeriod[] = [
  "hour",
  "day",
  "week",
  "month",
  "year",
];

export const isCalendarPeriod = (
  period: RelativePeriod
): period is RelativeCalendarPeriod =>
  CALENDAR_PERIODS.includes(period as RelativeCalendarPeriod);

export const todayRange = (): { start: Date; end: Date } => ({
  start: startOfDay(new Date()),
  end: endOfDay(new Date()),
});

const normalizeCount = (count: number | undefined): number =>
  typeof count === "number" && Number.isInteger(count) && count >= 1 ? count : 1;

/**
 * Rolling windows are anchored to a rounded "now" so the range only moves when
 * the aligned time advances - otherwise every render would refetch.
 */
const roundedNow = (period: RelativePeriod): Date => {
  const now = new Date();
  switch (period) {
    case "last_60_minutes":
    case "last_24_hours":
      now.setSeconds(0, 0);
      return now;
    case "last_7_days":
    case "last_30_days":
      if (now.getMinutes() >= 20) {
        now.setHours(now.getHours() + 1);
      }
      now.setMinutes(20, 0, 0);
      return now;
    case "last_12_months":
      now.setHours(0, 0, 0, 0);
      return now;
    default:
      return now;
  }
};

const calendarBase = (
  period: RelativeCalendarPeriod
): { start: Date; end: Date } => {
  const now = new Date();
  switch (period) {
    case "hour":
      return { start: startOfHour(now), end: endOfHour(now) };
    case "day":
      return todayRange();
    case "week":
      return {
        start: startOfWeek(now, WEEK_OPTIONS),
        end: endOfWeek(now, WEEK_OPTIONS),
      };
    case "month":
      return { start: startOfMonth(now), end: endOfMonth(now) };
    case "year":
    default:
      return { start: startOfYear(now), end: endOfYear(now) };
  }
};

const resolveCalendarPeriod = (
  period: RelativeCalendarPeriod,
  offset: number,
  count: number
): TimeRange => {
  const base = calendarBase(period);
  switch (period) {
    case "hour": {
      const endStart = addHours(base.start, offset);
      return {
        start: addHours(endStart, -(count - 1)),
        end: addHours(base.end, offset),
      };
    }
    case "day": {
      const endStart = addDays(base.start, offset);
      return {
        start: addDays(endStart, -(count - 1)),
        end: addDays(base.end, offset),
      };
    }
    case "week": {
      const endStart = addWeeks(base.start, offset);
      return {
        start: addWeeks(endStart, -(count - 1)),
        end: addWeeks(base.end, offset),
      };
    }
    case "month": {
      const endStart = addMonths(base.start, offset);
      return {
        start: addMonths(endStart, -(count - 1)),
        end: addMonths(base.end, offset),
      };
    }
    case "year":
    default: {
      const endStart = addYears(base.start, offset);
      return {
        start: addYears(endStart, -(count - 1)),
        end: addYears(base.end, offset),
      };
    }
  }
};

const resolveRollingPeriod = (
  period: RelativePeriod,
  offset: number
): TimeRange => {
  const now = roundedNow(period);
  switch (period) {
    case "last_60_minutes": {
      const end = addHours(now, offset);
      return { start: addMinutes(end, -60), end };
    }
    case "last_24_hours": {
      const end = addDays(now, offset);
      return { start: subHours(end, 24), end };
    }
    case "last_7_days": {
      const end = addDays(now, offset);
      return { start: subDays(end, 7), end };
    }
    case "last_30_days": {
      const end = addDays(now, offset);
      return { start: subDays(end, 30), end };
    }
    case "last_12_months":
    default: {
      const end = addMonths(now, offset);
      return { start: subMonths(end, 12), end };
    }
  }
};

const resolveFixedPeriod = (start?: string, end?: string): TimeRange => {
  const startDate = start ? new Date(start) : startOfDay(new Date());
  if (Number.isNaN(startDate.getTime())) {
    throw new Error("Invalid start date in fixed timespan configuration");
  }
  const endDate = end ? new Date(end) : endOfDay(startDate);
  if (Number.isNaN(endDate.getTime())) {
    throw new Error("Invalid end date in fixed timespan configuration");
  }
  return { start: startDate, end: endDate };
};

/**
 * Resolves the visible range for the configured timespan mode.
 *
 * `energyRange` carries the range published by the energy date picker; it is
 * `undefined` while no picker has been found yet.
 */
export const resolveTimespan = (
  timespan: TimespanConfig,
  energyRange?: TimeRange
): TimeRange | undefined => {
  switch (timespan.mode) {
    case "energy":
      return energyRange;
    case "relative":
      return isCalendarPeriod(timespan.period)
        ? resolveCalendarPeriod(
            timespan.period,
            timespan.offset ?? 0,
            normalizeCount(timespan.count)
          )
        : resolveRollingPeriod(timespan.period, timespan.offset ?? 0);
    case "fixed":
      return resolveFixedPeriod(timespan.start, timespan.end);
    default:
      return undefined;
  }
};

export const isRollingTimespan = (timespan: TimespanConfig): boolean =>
  timespan.mode === "relative" && timespan.period.startsWith("last_");
