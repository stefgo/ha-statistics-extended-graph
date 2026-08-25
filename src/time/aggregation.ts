import { differenceInDays, differenceInHours } from "date-fns";
import type {
  AggregationConfig,
  AggregationTarget,
  EnergyPickerRange,
} from "../config/types";
import type { StatisticsPeriod } from "../data/statistics";
import type { OnceLogger } from "../core/logger";
import { estimateBucketCount, MAX_BUCKETS } from "./buckets";

/**
 * Mirrors the interval the core energy cards pick for a given range length.
 */
export const deriveAutoPeriod = (
  start: Date,
  end?: Date
): StatisticsPeriod => {
  const effectiveEnd = end ?? new Date();
  const hours = Math.max(differenceInHours(effectiveEnd, start), 0);
  if (hours <= 2) {
    return "5minute";
  }
  const days = Math.max(differenceInDays(effectiveEnd, start), 0);
  if (days > 35) {
    return "month";
  }
  if (days > 2) {
    return "day";
  }
  return "hour";
};

/** Intervals from finest to coarsest, for comparing two of them. */
export const PERIOD_ORDER: StatisticsPeriod[] = [
  "5minute",
  "hour",
  "day",
  "week",
  "month",
  "year",
];

/** Position of an interval on that ladder; `-1` for "raw" and "disabled". */
export const periodRank = (target: AggregationTarget | undefined): number =>
  PERIOD_ORDER.indexOf(target as StatisticsPeriod);

/** A window of the visible range the user zoomed into, in epoch milliseconds. */
export interface ZoomWindow {
  start: number;
  end: number;
}

/** Classifies a range into the button the energy date picker would have used. */
export const getEnergyPickerRange = (
  start: Date,
  end?: Date
): EnergyPickerRange => {
  const effectiveEnd = end ?? new Date();
  const hours = Math.max(differenceInHours(effectiveEnd, start), 0);
  const days = Math.max(differenceInDays(effectiveEnd, start), 0);

  if (hours <= 6) {
    return "hour";
  }
  if (days <= 1) {
    return "day";
  }
  if (days <= 7) {
    return "week";
  }
  if (days <= 35) {
    return "month";
  }
  return "year";
};

/**
 * Builds the ordered list of intervals to try: the configured override first,
 * then the automatic choice, then the configured fallback. Every entry after a
 * `disabled` target is dropped, because `disabled` means "do not query at all".
 *
 * An interval that would produce an absurd number of buckets for the range is
 * dropped as well. `aggregation.manual: 5minute` on a year is a plausible
 * typo and would otherwise fetch and render ~105.000 points per series, which
 * hangs the browser tab; the automatic choice takes over instead. The
 * automatic choice itself is bounded by construction and never hits this.
 */
export const resolveAggregationPlan = (
  start: Date,
  end: Date | undefined,
  aggregation: AggregationConfig | undefined,
  usesEnergyPicker: boolean,
  logger?: OnceLogger
): AggregationTarget[] => {
  const auto = deriveAutoPeriod(start, end);
  const plan: AggregationTarget[] = [];
  let stopped = false;

  const push = (target?: AggregationTarget) => {
    if (stopped || !target) {
      return;
    }
    if (estimateBucketCount(start, end, target) > MAX_BUCKETS) {
      logger?.warnOnce(
        `aggregation-too-dense-${target}`,
        `Aggregation "${target}" would produce far more than ${MAX_BUCKETS} points for this range and is skipped.`
      );
      return;
    }
    if (!plan.includes(target)) {
      plan.push(target);
    }
    if (target === "disabled") {
      stopped = true;
    }
  };

  if (usesEnergyPicker) {
    push(aggregation?.energy_picker?.[getEnergyPickerRange(start, end)]);
  } else {
    push(aggregation?.manual);
  }
  push(auto);
  push(aggregation?.fallback);

  return plan.length ? plan : [auto];
};
