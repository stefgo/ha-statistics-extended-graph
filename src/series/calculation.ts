import type {
  AggregationTarget,
  CalculationConfig,
  CalculationTermConfig,
  SeriesConfig,
} from "../config/types";
import type { Statistics, StatisticValue } from "../data/statistics";
import { buildBucketSequence } from "../time/buckets";
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
}

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

  const evaluateTimestamp = (timestamp: number) => {
    let total = initialValue;
    let start: number | undefined;
    let end: number | undefined;
    let valid = true;

    for (const item of terms) {
      if (!valid) {
        break;
      }

      let termValue: number;
      if (item.constant !== undefined) {
        termValue = item.constant;
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
    timestamps.forEach(evaluateTimestamp);
  } else {
    constantTimestamps(context, statistics).forEach(evaluateTimestamp);
  }

  return { values };
};
