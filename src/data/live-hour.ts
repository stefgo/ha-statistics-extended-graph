import { startOfHour, subHours } from "date-fns";
import type { Statistics, StatisticValue } from "./statistics";

const HOUR_MS = 60 * 60 * 1000;
const FIVE_MINUTES_MS = 5 * 60 * 1000;

export interface LiveHourWindow {
  fetchStart: number;
  fetchEnd: number;
  currentHourStart: number;
  previousHourStart: number;
  periodStartMs?: number;
  periodEndMs?: number;
  nowMs: number;
}

/**
 * Time window of the 5-minute query that backs the current-hour estimate. The
 * previous hour is included as well, because recorder may not have published
 * its aggregate yet either.
 */
export const computeLiveHourWindow = (
  periodStart: Date | undefined,
  periodEnd: Date | undefined
): LiveHourWindow | undefined => {
  const now = new Date();
  const nowMs = now.getTime();
  const currentHourStart = startOfHour(now).getTime();
  const previousHourStart = subHours(new Date(currentHourStart), 1).getTime();
  const periodStartMs = periodStart?.getTime();

  const fetchStart = Math.max(previousHourStart, periodStartMs ?? previousHourStart);
  if (nowMs <= fetchStart) {
    return undefined;
  }

  return {
    fetchStart,
    fetchEnd: nowMs,
    currentHourStart,
    previousHourStart,
    periodStartMs,
    periodEndMs: periodEnd?.getTime(),
    nowMs,
  };
};

const hourIsVisible = (
  hourStart: number,
  periodStartMs?: number,
  periodEndMs?: number
): boolean => {
  const hourEnd = hourStart + HOUR_MS;
  if (periodEndMs !== undefined && periodEndMs <= hourStart) {
    return false;
  }
  if (periodStartMs !== undefined && periodStartMs >= hourEnd) {
    return false;
  }
  return true;
};

/** Rolls up 5-minute samples into a single hourly sample. */
export const aggregateToHour = (
  entries: StatisticValue[],
  hourStart: number,
  hourEnd: number
): StatisticValue | undefined => {
  const relevant = entries.filter(
    (entry) => entry.start >= hourStart && entry.start < hourEnd
  );
  if (!relevant.length) {
    return undefined;
  }

  let changeTotal = 0;
  let sumTotal = 0;
  let hasChange = false;
  let hasSum = false;
  let meanWeighted = 0;
  let meanWeight = 0;
  let minValue: number | null = null;
  let maxValue: number | null = null;
  let lastState: number | null = null;

  relevant.forEach((entry) => {
    const entryEnd = entry.end ?? entry.start + FIVE_MINUTES_MS;
    const duration = Math.max(0, entryEnd - entry.start);

    if (typeof entry.change === "number" && Number.isFinite(entry.change)) {
      changeTotal += entry.change;
      hasChange = true;
    }
    if (typeof entry.sum === "number" && Number.isFinite(entry.sum)) {
      sumTotal += entry.sum;
      hasSum = true;
    }
    if (typeof entry.min === "number" && Number.isFinite(entry.min)) {
      minValue = minValue === null ? entry.min : Math.min(minValue, entry.min);
    }
    if (typeof entry.max === "number" && Number.isFinite(entry.max)) {
      maxValue = maxValue === null ? entry.max : Math.max(maxValue, entry.max);
    }

    const meanCandidate =
      typeof entry.mean === "number" && Number.isFinite(entry.mean)
        ? entry.mean
        : typeof entry.state === "number" && Number.isFinite(entry.state)
          ? entry.state
          : undefined;
    if (meanCandidate !== undefined && duration > 0) {
      meanWeighted += meanCandidate * duration;
      meanWeight += duration;
    }
    if (typeof entry.state === "number" && Number.isFinite(entry.state)) {
      lastState = entry.state;
    }
  });

  const aggregated: StatisticValue = { start: hourStart, end: hourEnd };
  if (hasChange) {
    aggregated.change = changeTotal;
  }
  if (hasSum) {
    aggregated.sum = sumTotal;
  }
  if (minValue !== null) {
    aggregated.min = minValue;
  }
  if (maxValue !== null) {
    aggregated.max = maxValue;
  }
  if (meanWeight > 0) {
    aggregated.mean = meanWeighted / meanWeight;
  } else if (lastState !== null) {
    aggregated.mean = lastState;
  }
  if (lastState !== null) {
    aggregated.state = lastState;
  }
  return aggregated;
};

/**
 * Builds hourly samples for the hours recorder has not finalized yet. Hours
 * that already have a complete aggregate are left untouched.
 */
export const buildLiveHourPatch = (
  base: Statistics,
  fiveMinuteStats: Statistics,
  window: LiveHourWindow,
  statisticIds: string[]
): Statistics | undefined => {
  const hours: number[] = [];
  if (hourIsVisible(window.currentHourStart, window.periodStartMs, window.periodEndMs)) {
    hours.push(window.currentHourStart);
  }
  if (
    window.previousHourStart >= window.fetchStart &&
    hourIsVisible(window.previousHourStart, window.periodStartMs, window.periodEndMs)
  ) {
    hours.push(window.previousHourStart);
  }
  if (!hours.length) {
    return undefined;
  }

  const patch: Statistics = {};
  let hasValues = false;

  statisticIds.forEach((statisticId) => {
    const entries = fiveMinuteStats[statisticId] ?? [];
    const baseEntries = base[statisticId] ?? [];
    const perId: StatisticValue[] = [];

    hours.forEach((hourStart) => {
      const hourEnd = Math.min(
        hourStart + HOUR_MS,
        window.periodEndMs ?? hourStart + HOUR_MS,
        window.nowMs
      );
      const existing = baseEntries.find(
        (entry) => Math.abs(entry.start - hourStart) < 30_000
      );

      if (hourStart === window.currentHourStart) {
        const complete = existing && existing.end >= hourStart + 59 * 60 * 1000;
        if (complete) {
          return;
        }
      } else if (existing) {
        return;
      }

      const aggregated = aggregateToHour(entries, hourStart, hourEnd);
      if (aggregated) {
        perId.push(aggregated);
      }
    });

    if (perId.length) {
      perId.sort((a, b) => a.start - b.start);
      patch[statisticId] = perId;
      hasValues = true;
    }
  });

  return hasValues ? patch : undefined;
};

/** Replaces the patched hours inside a statistics set. */
export const applyLiveHourPatch = (
  base: Statistics,
  patch: Statistics
): Statistics => {
  const updated: Statistics = { ...base };
  Object.entries(patch).forEach(([statisticId, values]) => {
    if (!values?.length) {
      return;
    }
    const patchedStarts = new Set(values.map((item) => item.start));
    const existing = (updated[statisticId] ?? []).filter(
      (entry) => !patchedStarts.has(entry.start)
    );
    updated[statisticId] = [...existing, ...values].sort(
      (a, b) => a.start - b.start
    );
  });
  return updated;
};
