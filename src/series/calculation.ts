import { differenceInCalendarDays } from "date-fns";
import type {
  AggregationTarget,
  CalculationConfig,
  CalculationTermConfig,
  ConstantPerUnit,
  SeriesConfig,
} from "../config/types";
import { CONSTANT_PER_UNITS } from "../config/validate";
import type { Statistics, StatisticValue } from "../data/statistics";
import { advanceBucket, buildBucketSequence } from "../time/buckets";
import { OnceLogger } from "../core/logger";
import { DEFAULT_STAT_TYPE, transformValue } from "./model";

export interface CalculationContext {
  start?: Date;
  end?: Date;
  period?: AggregationTarget;
}

export interface CalculationResult {
  values: StatisticValue[];
}

interface TermSample {
  timestamp: number;
  value: number | null;
  start: number;
  end: number;
}

interface ResolvedTerm {
  term: CalculationTermConfig;
  /** Samples keyed by their bucket end, for exact hits. */
  byTimestamp?: Map<number, TermSample>;
  /** Chronological samples, used for the last-known-value fallback. */
  timeline?: TermSample[];
  cursor: number;
  lastKnown?: TermSample;
  constant?: number;
  /** Unit the constant is given in; it is then scaled by the bucket length. */
  constantPer?: ConstantPerUnit;
}

const HOUR_MS = 60 * 60_000;
const DAY_MS = 24 * HOUR_MS;

const isLocalMidnight = (timestamp: number): boolean => {
  const date = new Date(timestamp);
  return (
    date.getHours() === 0 &&
    date.getMinutes() === 0 &&
    date.getSeconds() === 0 &&
    date.getMilliseconds() === 0
  );
};

/**
 * How many `unit`s fit into the bucket from `start` to `end`. Buckets between
 * two local midnights count calendar days, so a 23- or 25-hour day around a
 * daylight saving change is still one day and March still has 31.
 */
export const bucketLength = (
  start: number,
  end: number,
  unit: ConstantPerUnit
): number => {
  if (unit === "hour") {
    return (end - start) / HOUR_MS;
  }
  const days =
    isLocalMidnight(start) && isLocalMidnight(end)
      ? differenceInCalendarDays(end, start)
      : (end - start) / DAY_MS;
  return unit === "week" ? days / 7 : days;
};

interface BucketBounds {
  start: number;
  end: number;
}

/** One bucket per grid step, or `undefined` when the range has no fixed grid. */
const constantPerBuckets = (context: CalculationContext): BucketBounds[] | undefined => {
  const { start, end, period } = context;
  if (!start || !end || period === undefined || period === "raw" || period === "disabled") {
    return undefined;
  }
  const endTs = end.getTime();
  const sequence = buildBucketSequence(start.getTime(), endTs, period);
  if (!sequence?.length) {
    return undefined;
  }
  return sequence
    .filter((bucketStart, index) => index === 0 || bucketStart < endTs)
    .map((bucketStart) => ({
      start: bucketStart,
      end: advanceBucket(new Date(bucketStart), period).getTime(),
    }));
};

const resolveTermValue = (
  term: ResolvedTerm,
  timestamp: number
): TermSample | undefined => {
  const direct = term.byTimestamp?.get(timestamp);
  if (direct && direct.value !== null) {
    term.lastKnown = direct;
    return direct;
  }

  const timeline = term.timeline;
  if (!timeline?.length) {
    return undefined;
  }

  // The timeline is walked once per series: timestamps are processed in
  // ascending order, so the cursor never has to move backwards.
  while (term.cursor < timeline.length && timeline[term.cursor].timestamp <= timestamp) {
    const candidate = timeline[term.cursor];
    if (candidate.value !== null) {
      term.lastKnown = candidate;
    }
    term.cursor += 1;
  }

  return term.lastKnown;
};

const buildResolvedTerms = (
  calculation: CalculationConfig,
  series: SeriesConfig,
  statistics: Statistics,
  timestamps: Set<number>,
  logger: OnceLogger,
  seriesLabel: string
): ResolvedTerm[] =>
  calculation.terms.map((term) => {
    const statisticId = term.statistic_id?.trim();

    if (!statisticId) {
      return {
        term,
        cursor: 0,
        constant: transformValue(term.constant ?? 0, term),
        constantPer:
          term.constant !== undefined &&
          term.constant_per !== undefined &&
          CONSTANT_PER_UNITS.includes(term.constant_per)
            ? term.constant_per
            : undefined,
      };
    }

    const statKey = term.stat_type ?? series.stat_type ?? DEFAULT_STAT_TYPE;
    const raw = statistics[statisticId];
    const byTimestamp = new Map<number, TermSample>();
    const timeline: TermSample[] = [];

    if (!raw?.length) {
      logger.warnOnce(
        `calc-missing-${seriesLabel}-${statisticId}`,
        `Calculation series "${seriesLabel}" references "${statisticId}" but no data was loaded. Missing values are treated as zero.`,
        "debug"
      );
    } else {
      raw.forEach((entry) => {
        const timestamp = entry.end ?? entry.start;
        if (timestamp === undefined) {
          return;
        }
        const rawValue = entry[statKey];
        const numeric =
          typeof rawValue === "number" && Number.isFinite(rawValue)
            ? transformValue(rawValue, term)
            : null;
        const sample: TermSample = {
          timestamp,
          value: numeric,
          start: entry.start,
          end: entry.end,
        };
        byTimestamp.set(timestamp, sample);
        timeline.push(sample);
        timestamps.add(timestamp);
      });
      timeline.sort((a, b) => a.timestamp - b.timestamp);
    }

    return {
      term,
      byTimestamp,
      timeline: timeline.length ? timeline : undefined,
      cursor: 0,
    };
  });

/**
 * Synthesizes timestamps for calculations that only consist of constants, so a
 * reference line spans the whole visible range instead of collapsing to a point.
 */
const constantTimestamps = (
  context: CalculationContext,
  statistics: Statistics
): number[] => {
  if (!context.start) {
    return [];
  }
  const seen = new Set<number>();
  const add = (value: number | undefined | null) => {
    if (typeof value === "number" && Number.isFinite(value)) {
      seen.add(value);
    }
  };

  const startTs = context.start.getTime();
  const endTs = context.end?.getTime();
  add(startTs);
  add(endTs);

  if (context.period && context.end) {
    buildBucketSequence(startTs, context.end.getTime(), context.period)?.forEach(add);
  }

  Object.values(statistics).forEach((entries) => {
    entries?.forEach((entry) => {
      add(entry.start);
      add(entry.end);
    });
  });

  if (seen.size === 1 && endTs === undefined) {
    add(startTs + 1);
  }

  return Array.from(seen).sort((a, b) => a - b);
};

/**
 * Evaluates a calculation series into statistics-shaped samples.
 *
 * Terms are applied sequentially starting from `initial_value`. Every statistic
 * bucket contributed by any term becomes one output point; terms that have no
 * sample at that exact timestamp reuse their last known value (and count as
 * zero until they have one).
 */
export const evaluateCalculation = (
  series: SeriesConfig,
  calculation: CalculationConfig,
  statistics: Statistics,
  seriesIndex: number,
  context: CalculationContext,
  logger: OnceLogger
): CalculationResult | undefined => {
  if (!calculation.terms?.length) {
    return undefined;
  }

  const seriesLabel = series.name ?? series.statistic_id ?? `series_${seriesIndex}`;
  const timestampSet = new Set<number>();
  const terms = buildResolvedTerms(
    calculation,
    series,
    statistics,
    timestampSet,
    logger,
    seriesLabel
  );

  const timestamps = Array.from(timestampSet).sort((a, b) => a - b);
  const constantOnly =
    !timestamps.length && terms.every((item) => item.constant !== undefined);

  if (!timestamps.length && !constantOnly) {
    return undefined;
  }

  const initialValue = calculation.initial_value ?? 0;
  const values: StatisticValue[] = [];
  const usesConstantPer = terms.some((item) => item.constantPer !== undefined);
  const hasGrid =
    context.period !== undefined &&
    context.period !== "raw" &&
    context.period !== "disabled";

  /** Bucket of a statistic-driven point: the bounds of a term's exact sample. */
  const boundsAt = (timestamp: number): BucketBounds | undefined => {
    for (const item of terms) {
      const sample = item.byTimestamp?.get(timestamp);
      if (sample) {
        return { start: sample.start, end: sample.end };
      }
    }
    return undefined;
  };

  const warnUnscaled = () =>
    logger.warnOnce(
      `calc-constant-per-${seriesLabel}`,
      `Calculation series "${seriesLabel}" uses constant_per, which needs aggregated statistics. The constant is not scaled.`
    );

  const evaluateTimestamp = (timestamp: number, bucket?: BucketBounds) => {
    let total = initialValue;
    let start: number | undefined = bucket?.start;
    let end: number | undefined = bucket?.end;
    let valid = true;

    const bounds = usesConstantPer && hasGrid ? (bucket ?? boundsAt(timestamp)) : undefined;
    const scalable = !!bounds && bounds.end > bounds.start;
    if (usesConstantPer && !scalable) {
      warnUnscaled();
    }

    for (const item of terms) {
      if (!valid) {
        break;
      }

      let termValue: number;
      if (item.constant !== undefined) {
        termValue =
          item.constantPer && scalable
            ? item.constant * bucketLength(bounds.start, bounds.end, item.constantPer)
            : item.constant;
      } else {
        const resolved = resolveTermValue(item, timestamp);
        if (resolved && resolved.value !== null) {
          start = start ?? resolved.start ?? timestamp;
          end = end ?? resolved.end ?? timestamp;
          termValue = resolved.value;
        } else {
          termValue = 0;
          logger.warnOnce(
            `calc-value-${seriesLabel}-${item.term.statistic_id}`,
            `Missing value for "${item.term.statistic_id}" in calculation series "${seriesLabel}". Using 0.`,
            "debug"
          );
        }
      }

      switch (item.term.operation ?? "add") {
        case "subtract":
          total -= termValue;
          break;
        case "multiply":
          total *= termValue;
          break;
        case "divide":
          if (termValue === 0) {
            valid = false;
            logger.warnOnce(
              `calc-div0-${seriesLabel}`,
              `Division by zero in calculation series "${seriesLabel}". Affected points are rendered as gaps.`
            );
          } else {
            total /= termValue;
          }
          break;
        case "add":
        default:
          total += termValue;
          break;
      }
    }

    const numericTotal = valid && Number.isFinite(total) ? total : null;
    values.push({
      start: start ?? timestamp,
      end: end ?? timestamp,
      change: numericTotal,
      sum: numericTotal,
      mean: numericTotal,
      min: numericTotal,
      max: numericTotal,
      state: numericTotal,
    });
  };

  if (timestamps.length) {
    timestamps.forEach((timestamp) => evaluateTimestamp(timestamp));
    return { values };
  }

  // A rate per unit differs from bucket to bucket, so it gets one point per
  // bucket instead of a flat line across the range.
  const buckets = usesConstantPer ? constantPerBuckets(context) : undefined;
  if (buckets) {
    buckets.forEach((bucket) => evaluateTimestamp(bucket.start, bucket));
  } else {
    constantTimestamps(context, statistics).forEach((timestamp) =>
      evaluateTimestamp(timestamp)
    );
  }

  return { values };
};
