import type { AggregationTarget } from "../config/types";

/**
 * Returns the wall-clock time of the next refresh for an interval. The offsets
 * mirror Home Assistant core: recorder needs a moment after a bucket closes
 * before the aggregate is available.
 */
export const getNextRefreshTime = (aggregation: AggregationTarget): number => {
  if (aggregation === "disabled") {
    return Number.POSITIVE_INFINITY;
  }

  const now = new Date();
  if (aggregation === "raw") {
    return now.getTime() + 60 * 1000;
  }

  const next = new Date(now);
  switch (aggregation) {
    case "5minute": {
      // Next 5-minute mark plus a 2 minute buffer.
      next.setMinutes(Math.ceil((now.getMinutes() + 1) / 5) * 5, 0, 0);
      if (next <= now) {
        next.setMinutes(next.getMinutes() + 5);
      }
      next.setMinutes(next.getMinutes() + 2);
      return next.getTime();
    }
    case "hour": {
      next.setHours(next.getHours() + 1, 20, 0, 0);
      if (next <= now) {
        next.setHours(next.getHours() + 1);
      }
      return next.getTime();
    }
    case "day": {
      next.setDate(next.getDate() + 1);
      next.setHours(0, 30, 0, 0);
      if (next <= now) {
        next.setDate(next.getDate() + 1);
      }
      return next.getTime();
    }
    case "week":
    case "month":
    case "year":
    default:
      return now.getTime() + 7 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000;
  }
};
