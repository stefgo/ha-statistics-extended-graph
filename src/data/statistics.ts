import type { HomeAssistant } from "custom-card-helpers";

export type StatisticsPeriod =
  | "5minute"
  | "hour"
  | "day"
  | "week"
  | "month"
  | "year";

export interface StatisticValue {
  start: number;
  end: number;
  change?: number | null;
  last_reset?: number | null;
  max?: number | null;
  mean?: number | null;
  min?: number | null;
  sum?: number | null;
  state?: number | null;
}

export type Statistics = Record<string, StatisticValue[]>;

export interface StatisticsMetaData {
  statistic_id: string;
  statistics_unit_of_measurement: string | null;
  source: string;
  name?: string | null;
  has_sum: boolean;
  mean_type?: number;
  unit_class?: string | null;
}

export type StatisticsMetaDataMap = Record<string, StatisticsMetaData>;

export const fetchStatisticsMetadata = (
  hass: HomeAssistant,
  statisticIds?: string[]
): Promise<StatisticsMetaData[]> =>
  hass.callWS<StatisticsMetaData[]>({
    type: "recorder/get_statistics_metadata",
    statistic_ids: statisticIds,
  });

export const fetchStatistics = (
  hass: HomeAssistant,
  startTime: Date,
  endTime: Date | undefined,
  statisticIds: string[],
  period: StatisticsPeriod,
  types?: string[]
): Promise<Statistics> =>
  hass.callWS<Statistics>({
    type: "recorder/statistics_during_period",
    start_time: startTime.toISOString(),
    end_time: endTime?.toISOString(),
    statistic_ids: statisticIds,
    period,
    types,
  });

/** `true` when at least one of the requested ids returned samples. */
export const statisticsHaveData = (
  statistics: Statistics | undefined,
  ids: string[]
): boolean => {
  if (!ids.length) {
    return true;
  }
  return ids.some((id) => statistics?.[id]?.length);
};

export const maxStatisticsEnd = (
  statistics: Statistics | undefined
): number | undefined => {
  if (!statistics) {
    return undefined;
  }
  let maxEnd: number | undefined;
  Object.values(statistics).forEach((entries) => {
    entries?.forEach((entry) => {
      const end = entry.end ?? entry.start;
      if (typeof end === "number") {
        maxEnd = maxEnd === undefined ? end : Math.max(maxEnd, end);
      }
    });
  });
  return maxEnd;
};

/** Merges freshly streamed samples into an existing set, keyed by bucket end. */
export const mergeStatistics = (
  base: Statistics | undefined,
  patch: Statistics
): Statistics => {
  if (!base) {
    return patch;
  }
  const merged: Statistics = { ...base };
  Object.entries(patch).forEach(([id, entries]) => {
    const existing = merged[id];
    if (!existing?.length) {
      merged[id] = entries;
      return;
    }
    const combined = [...existing];
    const indexByKey = new Map<number, number>();
    combined.forEach((entry, idx) => {
      indexByKey.set(entry.end ?? entry.start ?? idx, idx);
    });
    entries.forEach((entry) => {
      const key = entry.end ?? entry.start;
      const idx = indexByKey.get(key);
      if (idx !== undefined) {
        combined[idx] = entry;
      } else {
        combined.push(entry);
        indexByKey.set(key, combined.length - 1);
      }
    });
    combined.sort((a, b) => (a.end ?? a.start) - (b.end ?? b.start));
    merged[id] = combined;
  });
  return merged;
};

/**
 * Restricts samples to the visible range. One sample before and after the range
 * is kept so line and step charts still reach both edges of the chart.
 */
export const trimStatisticsToRange = (
  statistics: Statistics,
  start: number,
  end: number | null
): Statistics => {
  const trimmed: Statistics = {};
  Object.entries(statistics).forEach(([id, entries]) => {
    if (!entries?.length) {
      trimmed[id] = [];
      return;
    }

    let pre: StatisticValue | undefined;
    let post: StatisticValue | undefined;
    const inRange: StatisticValue[] = [];

    entries.forEach((entry) => {
      const entryStart = entry.start ?? entry.end;
      const entryEnd = entry.end ?? entry.start;
      if (entryStart === undefined || entryEnd === undefined) {
        return;
      }
      if (end !== null && entryStart > end) {
        post = post ?? entry;
        return;
      }
      if (entryEnd < start) {
        pre = entry;
        return;
      }
      inRange.push(entry);
    });

    if (pre) {
      inRange.unshift(pre);
    }
    if (post) {
      inRange.push(post);
    }
    trimmed[id] = inRange;
  });
  return trimmed;
};
