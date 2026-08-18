import type {
  SeriesConfig,
  SeriesSource,
  StatisticType,
  ValueTransformConfig,
} from "../config/types";

export const DEFAULT_STAT_TYPE: StatisticType = "change";
export const DEFAULT_CHART_TYPE = "bar";

export const clampValue = (
  value: number,
  min?: number,
  max?: number
): number => {
  let result = value;
  if (min !== undefined) {
    result = Math.max(result, min);
  }
  if (max !== undefined) {
    result = Math.min(result, max);
  }
  return result;
};

/** Applies `multiply`, `add` and the clip bounds in the documented order. */
export const transformValue = (
  value: number,
  transform: ValueTransformConfig
): number =>
  clampValue(
    value * (transform.multiply ?? 1) + (transform.add ?? 0),
    transform.clip_min,
    transform.clip_max
  );

export const getSeriesSource = (series: SeriesConfig): SeriesSource => {
  if (series.source) {
    return series.source;
  }
  return series.calculation ? "calculation" : "statistic";
};

export const getStatisticId = (series: SeriesConfig): string | undefined => {
  const id = series.statistic_id?.trim();
  return id ? id : undefined;
};

/** Stable key of a calculation series inside the computed-data maps. */
export const calculationKey = (index: number): string => `calculation_${index}`;

export const isCompareId = (id: string): boolean => id.endsWith("--compare");

export const toCompareId = (id: string): string => `${id}--compare`;

export const toBaseId = (id: string): string =>
  isCompareId(id) ? id.slice(0, -"--compare".length) : id;
