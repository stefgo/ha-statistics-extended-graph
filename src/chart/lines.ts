import type { ChartDataPoint, SeriesOption } from "../types/echarts";

export type Tuple = [number, number | null];

export const toTuple = (point: ChartDataPoint): Tuple | undefined => {
  const raw = Array.isArray(point) ? point : point?.value;
  if (!Array.isArray(raw) || typeof raw[0] !== "number") {
    return undefined;
  }
  const value = typeof raw[1] === "number" ? raw[1] : null;
  return [raw[0], value];
};

const asTuples = (data: ChartDataPoint[] | undefined): Tuple[] | undefined => {
  if (!Array.isArray(data)) {
    return undefined;
  }
  const tuples: Tuple[] = [];
  for (const point of data) {
    if (!Array.isArray(point) || typeof point[0] !== "number") {
      return undefined;
    }
    tuples.push(point as Tuple);
  }
  return tuples;
};

/**
 * Projects every line series onto the bucket grid of the visible range.
 *
 * Buckets without a sample become explicit `null` values, so ECharts draws a
 * gap instead of connecting across missing data.
 */
export const normalizeLineSeries = (
  series: SeriesOption[],
  buckets: number[]
): void => {
  if (!buckets.length) {
    return;
  }

  series.forEach((serie) => {
    if (serie.type !== "line" || !Array.isArray(serie.data)) {
      return;
    }

    const byTimestamp = new Map<number, number | null>();
    serie.data.forEach((point) => {
      const tuple = toTuple(point);
      if (tuple) {
        byTimestamp.set(tuple[0], tuple[1]);
      }
    });

    serie.data = buckets.map((bucket) => [bucket, byTimestamp.get(bucket) ?? null]);
  });
};

/**
 * Carries the last known value forward to `limit`. Used for step charts, whose
 * value stays valid until the next state change.
 */
export const extendStepSeriesToLimit = (data: Tuple[], limit: number): void => {
  if (!Number.isFinite(limit) || !data.length) {
    return;
  }

  let lastIndex = -1;
  for (let idx = data.length - 1; idx >= 0; idx--) {
    const [timestamp, value] = data[idx];
    if (timestamp <= limit && typeof value === "number") {
      lastIndex = idx;
      break;
    }
  }
  if (lastIndex === -1) {
    return;
  }

  const [lastTimestamp, lastValue] = data[lastIndex];
  if (limit <= lastTimestamp || typeof lastValue !== "number") {
    return;
  }

  for (let idx = lastIndex + 1; idx < data.length; idx++) {
    if (data[idx][0] > limit) {
      break;
    }
    if (data[idx][1] === null) {
      data[idx][1] = lastValue;
    }
  }

  const insertion = data.findIndex(([timestamp]) => timestamp >= limit);
  if (insertion === -1) {
    data.push([limit, lastValue]);
  } else if (data[insertion][0] === limit) {
    data[insertion][1] = data[insertion][1] ?? lastValue;
  } else {
    data.splice(insertion, 0, [limit, lastValue]);
  }
};

/**
 * Pulls a raw-history line up to "now" so a live chart does not end at the last
 * reported state somewhere in the past.
 */
export const extendRawLineToNow = (data: Tuple[], now: number): void => {
  let lastIndex = -1;
  let lastValue: number | null = null;
  for (let idx = data.length - 1; idx >= 0; idx--) {
    const [timestamp, value] = data[idx];
    if (timestamp > now) {
      continue;
    }
    if (typeof value === "number") {
      lastIndex = idx;
      lastValue = value;
      break;
    }
  }
  if (lastIndex === -1 || lastValue === null) {
    return;
  }

  for (let idx = lastIndex + 1; idx < data.length; idx++) {
    if (data[idx][0] > now) {
      break;
    }
    if (data[idx][1] === null) {
      data[idx][1] = lastValue;
    }
  }

  if (data.some((point) => Math.abs(point[0] - now) <= 1000)) {
    return;
  }
  const insertion = data.findIndex((point) => point[0] > now);
  if (insertion === -1) {
    data.push([now, lastValue]);
  } else {
    data.splice(insertion, 0, [now, lastValue]);
  }
};

export interface LineExtensionContext {
  /** End of the visible range, `null` for open-ended ranges. */
  displayEnd: number | null;
  compareDisplayEnd: number | null;
  extendMain: boolean;
  extendCompare: boolean;
  chartTypeOf: (seriesId: string | undefined) => string | undefined;
  isCompare: (seriesId: string | undefined) => boolean;
}

export const extendLineSeries = (
  series: SeriesOption[],
  context: LineExtensionContext
): void => {
  const now = Date.now();

  series.forEach((serie) => {
    if (serie.type !== "line" || !serie.data?.length) {
      return;
    }
    const tuples = asTuples(serie.data);
    if (!tuples) {
      return;
    }

    const seriesId = typeof serie.id === "string" ? serie.id : undefined;
    const isCompare = context.isCompare(seriesId);
    const chartType = context.chartTypeOf(seriesId);

    if (chartType === "step") {
      const rangeEnd = isCompare ? context.compareDisplayEnd : context.displayEnd;
      extendStepSeriesToLimit(tuples, Math.min(rangeEnd ?? now, now));
      return;
    }

    const displayEnd = isCompare ? context.compareDisplayEnd : context.displayEnd;
    const shouldExtend = isCompare ? context.extendCompare : context.extendMain;
    if (!shouldExtend || displayEnd === null || displayEnd <= now) {
      return;
    }
    extendRawLineToNow(tuples, now);
  });
};

/** Snapshot with all values set to zero, used as the animation start frame. */
export const createZeroSnapshot = (series: SeriesOption[]): SeriesOption[] => {
  const clone: SeriesOption[] =
    typeof structuredClone === "function"
      ? structuredClone(series)
      : JSON.parse(JSON.stringify(series));

  clone.forEach((serie) => {
    if (!Array.isArray(serie.data)) {
      return;
    }
    serie.data = serie.data.map((point) => {
      if (Array.isArray(point)) {
        return [point[0], point[1] === null ? null : 0];
      }
      if (point && Array.isArray(point.value)) {
        return {
          ...point,
          value: [point.value[0], point.value[1] === null ? null : 0],
        };
      }
      return point;
    });
  });

  return clone;
};
