/**
 * Calculation series with `constant_per`: a constant given as a rate per hour,
 * day or week is scaled by the length of every bucket.
 *
 * Bucket boundaries are local midnights, so the time zone is pinned to one
 * with daylight saving time to cover the 23- and 25-hour days.
 */
process.env.TZ = "Europe/Berlin";

import { describe, expect, it, vi } from "vitest";

import type { CalculationConfig, SeriesConfig } from "../src/config/types";
import { OnceLogger } from "../src/core/logger";
import type { Statistics, StatisticValue } from "../src/data/statistics";
import { bucketLength, evaluateCalculation } from "../src/series/calculation";
import type { CalculationContext } from "../src/series/calculation";

const local = (y: number, m: number, d: number, h = 0) =>
  new Date(y, m - 1, d, h).getTime();

const silentLogger = () => {
  const sink = vi.fn();
  return { logger: new OnceLogger(sink), sink };
};

const run = (
  calculation: CalculationConfig,
  context: CalculationContext,
  statistics: Statistics = {}
) => {
  const { logger, sink } = silentLogger();
  const series = { calculation } as SeriesConfig;
  const result = evaluateCalculation(series, calculation, statistics, 0, context, logger);
  return { values: result?.values ?? [], sink };
};

const perDay = (value: number): CalculationConfig => ({
  terms: [{ constant: value, constant_per: "day" }],
});

const changes = (values: StatisticValue[]) => values.map((entry) => entry.change);

describe("bucketLength", () => {
  it("counts calendar days across daylight saving changes", () => {
    expect(bucketLength(local(2026, 3, 29), local(2026, 3, 30), "day")).toBe(1);
    expect(bucketLength(local(2026, 10, 25), local(2026, 10, 26), "day")).toBe(1);
    expect(bucketLength(local(2026, 3, 1), local(2026, 4, 1), "day")).toBe(31);
    expect(bucketLength(local(2026, 10, 1), local(2026, 11, 1), "day")).toBe(31);
  });

  it("uses real hours for the hour unit", () => {
    expect(bucketLength(local(2026, 3, 29), local(2026, 3, 30), "hour")).toBe(23);
    expect(bucketLength(local(2026, 6, 1, 5), local(2026, 6, 1, 6), "hour")).toBe(1);
  });

  it("expresses weeks as sevenths of days", () => {
    expect(bucketLength(local(2026, 6, 1), local(2026, 6, 8), "week")).toBe(1);
    expect(bucketLength(local(2026, 6, 1), local(2026, 6, 2), "week")).toBeCloseTo(1 / 7);
  });

  it("falls back to fractions of a day inside a day", () => {
    expect(bucketLength(local(2026, 6, 1, 5), local(2026, 6, 1, 6), "day")).toBeCloseTo(1 / 24);
  });
});

describe("evaluateCalculation with constant_per", () => {
  it("scales a constant-only series per hour bucket", () => {
    const { values } = run(perDay(36.5), {
      start: new Date(local(2026, 6, 1)),
      end: new Date(local(2026, 6, 1, 23) + 59 * 60_000),
      period: "hour",
    });
    expect(values).toHaveLength(24);
    values.forEach((entry) => expect(entry.change).toBeCloseTo(36.5 / 24));
    expect(values[0].start).toBe(local(2026, 6, 1));
    expect(values[0].end).toBe(local(2026, 6, 1, 1));
  });

  it("scales a constant-only series per day bucket", () => {
    const { values } = run(perDay(36.5), {
      start: new Date(local(2026, 6, 1)),
      end: new Date(local(2026, 6, 8) - 1),
      period: "day",
    });
    expect(changes(values)).toEqual(Array(7).fill(36.5));
  });

  it("scales a constant-only series per month bucket, daylight saving included", () => {
    const { values } = run(perDay(36.5), {
      start: new Date(local(2026, 1, 1)),
      end: new Date(local(2027, 1, 1) - 1),
      period: "month",
    });
    const days = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    expect(values).toHaveLength(12);
    values.forEach((entry, index) => expect(entry.change).toBeCloseTo(days[index] * 36.5));
  });

  it("does not add a bucket for a range that ends exactly on a boundary", () => {
    const { values } = run(perDay(36.5), {
      start: new Date(local(2026, 6, 1)),
      end: new Date(local(2026, 6, 3)),
      period: "day",
    });
    expect(values).toHaveLength(2);
  });

  it("supports the hour and week units", () => {
    const context = {
      start: new Date(local(2026, 6, 1)),
      end: new Date(local(2026, 6, 2) - 1),
      period: "day" as const,
    };
    expect(
      changes(run({ terms: [{ constant: 2, constant_per: "hour" }] }, context).values)
    ).toEqual([48]);
    expect(
      run({ terms: [{ constant: 70, constant_per: "week" }] }, context).values[0].change
    ).toBeCloseTo(10);
  });

  it("applies the term transform before scaling", () => {
    const { values } = run(
      { terms: [{ constant: 10, multiply: 2, add: 1, constant_per: "day" }] },
      {
        start: new Date(local(2026, 6, 1)),
        end: new Date(local(2026, 6, 2) - 1),
        period: "day",
      }
    );
    expect(changes(values)).toEqual([21]);
  });

  it("scales by the bucket of the statistic in a mixed calculation", () => {
    const statistics: Statistics = {
      "sensor.odometer": [
        { start: local(2026, 1, 1), end: local(2026, 2, 1), change: 1000 },
        { start: local(2026, 2, 1), end: local(2026, 3, 1), change: 900 },
      ],
    };
    const { values } = run(
      {
        terms: [
          { constant: 36.5, constant_per: "day" },
          { statistic_id: "sensor.odometer", stat_type: "change", operation: "subtract" },
        ],
      },
      {
        start: new Date(local(2026, 1, 1)),
        end: new Date(local(2026, 3, 1) - 1),
        period: "month",
      },
      statistics
    );
    expect(values).toHaveLength(2);
    expect(values[0].change).toBeCloseTo(31 * 36.5 - 1000);
    expect(values[1].change).toBeCloseTo(28 * 36.5 - 900);
  });

  it("keeps a plain constant as a flat line", () => {
    const { values } = run(
      { terms: [{ constant: 36.5 }] },
      {
        start: new Date(local(2026, 1, 1)),
        end: new Date(local(2027, 1, 1) - 1),
        period: "month",
      }
    );
    expect(values.length).toBeGreaterThan(12);
    values.forEach((entry) => expect(entry.change).toBe(36.5));
  });

  it("does not scale without aggregated statistics and warns once", () => {
    const { values, sink } = run(perDay(36.5), {
      start: new Date(local(2026, 6, 1)),
      end: new Date(local(2026, 6, 2)),
      period: "raw",
    });
    expect(values.length).toBeGreaterThan(0);
    values.forEach((entry) => expect(entry.change).toBe(36.5));
    expect(sink).toHaveBeenCalledTimes(1);
    expect(sink.mock.calls[0][1]).toMatch(/constant_per/);
  });
});
