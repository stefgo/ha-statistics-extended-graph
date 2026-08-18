import { addDays, addHours, addMonths, addWeeks, addYears } from "date-fns";
import type { SeriesConfig, TimeOffsetConfig, TimeOffsetUnit } from "../config/types";
import type { StatisticValue } from "../data/statistics";

export interface NormalizedTimeOffset {
  value: number;
  unit: TimeOffsetUnit;
}

const UNITS: TimeOffsetUnit[] = ["hour", "day", "week", "month", "year"];

/** Ignores incomplete or zero offsets so they behave like "no offset". */
export const normalizeTimeOffset = (
  offset: TimeOffsetConfig | undefined
): NormalizedTimeOffset | undefined => {
  if (!offset) {
    return undefined;
  }
  if (!Number.isInteger(offset.value) || offset.value === 0) {
    return undefined;
  }
  if (!UNITS.includes(offset.unit)) {
    return undefined;
  }
  return { value: offset.value, unit: offset.unit };
};

export const getSeriesTimeOffset = (
  series: SeriesConfig
): NormalizedTimeOffset | undefined => normalizeTimeOffset(series.time_offset);

/** `direction: 1` moves into the source range, `-1` back into the display range. */
export const shiftDate = (
  date: Date,
  offset: NormalizedTimeOffset,
  direction: 1 | -1
): Date => {
  const amount = offset.value * direction;
  switch (offset.unit) {
    case "hour":
      return addHours(date, amount);
    case "day":
      return addDays(date, amount);
    case "week":
      return addWeeks(date, amount);
    case "month":
      return addMonths(date, amount);
    case "year":
      return addYears(date, amount);
    default:
      return date;
  }
};

export const shiftTimestamp = (
  timestamp: number,
  offset: NormalizedTimeOffset,
  direction: 1 | -1
): number => shiftDate(new Date(timestamp), offset, direction).getTime();

/** Projects source-range samples back onto the visible range. */
export const shiftStatisticValues = (
  values: StatisticValue[],
  offset: NormalizedTimeOffset
): StatisticValue[] =>
  values.map((entry) => ({
    ...entry,
    start: shiftTimestamp(entry.start, offset, -1),
    end: shiftTimestamp(entry.end, offset, -1),
  }));

/** Statistic id used for the shifted copy of a series inside the chart model. */
export const shiftedStatisticId = (index: number, statisticId: string): string =>
  `__time_offset_${index}__${statisticId}`;
