/**
 * Plans the detail layer of a zoomed-in chart.
 *
 * Reloading the whole range at a finer interval would be capped by the number
 * of points that range can hold - an hour interval over a year is 8.760 points
 * per series. The detail layer loads only the window the user actually looks
 * at instead. A window is small by definition, so its interval is chosen
 * purely from its own length and hits no such ceiling: a year can be drilled
 * down to five-minute data.
 *
 * The loaded window is stretched beyond what is visible, so panning inside the
 * zoom does not run into the edge of the detail immediately.
 */

import type { AggregationTarget } from "../config/types";
import type { StatisticsPeriod } from "../data/statistics";
import { estimateBucketCount, MAX_BUCKETS } from "./buckets";
import { deriveAutoPeriod, periodRank, PERIOD_ORDER } from "./aggregation";
import type { ZoomWindow } from "./aggregation";

/** How much of the window's width is loaded on each side of it. */
const MARGIN_FACTOR = 1;

export interface DetailPlan {
  start: Date;
  end: Date;
  aggregation: StatisticsPeriod;
}

export interface DetailRange {
  start: Date;
  end?: Date;
}

/**
 * The detail range and interval for a zoom window, or `undefined` when the
 * window deserves nothing finer than what is already loaded.
 */
export const planDetailRange = (
  period: DetailRange,
  window: ZoomWindow | undefined,
  loaded: AggregationTarget | undefined
): DetailPlan | undefined => {
  const periodStart = period.start.getTime();
  const periodEnd = (period.end ?? new Date()).getTime();
  if (!window || periodEnd <= periodStart) {
    return undefined;
  }

  const start = Math.max(window.start, periodStart);
  const end = Math.min(window.end, periodEnd);
  const span = end - start;
  if (span <= 0) {
    return undefined;
  }

  const aggregation = deriveAutoPeriod(new Date(start), new Date(end));
  const loadedRank = periodRank(loaded);
  // "raw" and "disabled" are not on the ladder; raw is already the finest
  // resolution there is, so a detail layer could only be coarser.
  if (loadedRank < 0 || periodRank(aggregation) >= loadedRank) {
    return undefined;
  }

  const margin = span * MARGIN_FACTOR;
  const detailStart = new Date(Math.max(start - margin, periodStart));
  const detailEnd = new Date(Math.min(end + margin, periodEnd));

  // Bounded by construction - the guard only catches absurd margins.
  if (estimateBucketCount(detailStart, detailEnd, aggregation) > MAX_BUCKETS) {
    return undefined;
  }

  return { start: detailStart, end: detailEnd, aggregation };
};

/**
 * Every interval worth trying for a detail plan, finest first: from the one
 * the window deserves up to - but not including - the one the full range is
 * already loaded at. Home Assistant purges `5minute` statistics after a few
 * days, so the finest interval regularly has no data while a coarser one
 * still does; without the ladder such a window would fall all the way back to
 * the loaded interval instead of to the next best one.
 */
export const detailPlanLadder = (
  aggregation: StatisticsPeriod,
  loaded: AggregationTarget | undefined
): StatisticsPeriod[] => {
  const loadedRank = periodRank(loaded);
  const start = periodRank(aggregation);
  if (start < 0 || loadedRank <= start) {
    return [aggregation];
  }
  return PERIOD_ORDER.slice(start, loadedRank);
};

/** True while `window` lies inside the range a detail layer has loaded. */
export const covers = (
  range: { start: number; end: number | null },
  window: ZoomWindow
): boolean =>
  window.start >= range.start && (range.end === null || window.end <= range.end);
