import type { SeriesConfig } from "../config/types";
import type { BarSeriesOption, ChartDataPoint, SeriesOption } from "../types/echarts";
import { OnceLogger } from "../core/logger";
import { toBaseId } from "../series/model";
import { BAR_MAX_WIDTH } from "../series/builder";

const REAL_VALUE_FLAG = "__realValue";
const CORNER_RADIUS = 4;

interface BarDataItem {
  value: [number, number | null];
  itemStyle?: Record<string, unknown>;
  label?: Record<string, unknown>;
  [REAL_VALUE_FLAG]?: boolean;
  [key: string]: unknown;
}

export interface BarStylingContext {
  /** Bucket timestamps of the visible range, when a fixed grid exists. */
  buckets?: number[];
  configById: Map<string, SeriesConfig>;
  valueLabelColor: string;
  formatValue: (value: number, precision: number) => string;
  logger: OnceLogger;
}

const toBarItem = (point: ChartDataPoint): BarDataItem | undefined => {
  if (Array.isArray(point)) {
    const value = typeof point[1] === "number" ? point[1] : null;
    return { value: [point[0], value] };
  }
  if (point && Array.isArray(point.value)) {
    const [timestamp, raw] = point.value;
    return {
      ...(point as Record<string, unknown>),
      value: [timestamp, typeof raw === "number" ? raw : null],
    };
  }
  return undefined;
};

const applyValueLabel = (
  serie: BarSeriesOption,
  item: BarDataItem,
  context: BarStylingContext
): void => {
  const seriesId = typeof serie.id === "string" ? serie.id : undefined;
  if (!seriesId || !item[REAL_VALUE_FLAG]) {
    return;
  }

  const config = context.configById.get(seriesId);
  if (config?.show_value_labels !== true) {
    return;
  }

  if (config.stack?.trim()) {
    context.logger.warnOnce(
      `value-label-stacked-${toBaseId(seriesId)}`,
      `Value labels are ignored for the stacked bar series "${serie.name ?? seriesId}".`
    );
    return;
  }

  const value = item.value[1];
  if (typeof value !== "number" || value === 0) {
    item.label = { show: false };
    return;
  }

  const precision =
    typeof config.value_label_precision === "number" &&
    Number.isFinite(config.value_label_precision)
      ? Math.max(0, Math.min(20, Math.trunc(config.value_label_precision)))
      : 0;

  item.label = {
    show: true,
    position: value > 0 ? "top" : "bottom",
    formatter: context.formatValue(value, precision),
    color: context.valueLabelColor,
    fontSize: 11,
    distance: 4,
  };
  serie.labelLayout = {
    ...((serie.labelLayout as Record<string, unknown> | undefined) ?? {}),
    hideOverlap: true,
  };
};

/**
 * Aligns all bar series onto one shared bucket grid and applies the rounded
 * corner that marks the outer end of every stack.
 *
 * ECharts positions bars by category order, so each series must contain an
 * entry for every bucket; missing buckets are filled with borderless zeros.
 */
export const applyBarStyling = (
  series: SeriesOption[],
  context: BarStylingContext
): void => {
  const barSeries = series.filter(
    (item): item is BarSeriesOption => item.type === "bar"
  );
  if (!barSeries.length) {
    return;
  }

  const bucketSet = new Set<number>(context.buckets ?? []);
  barSeries.forEach((serie) => {
    serie.data?.forEach((point) => {
      const item = toBarItem(point);
      if (item) {
        bucketSet.add(item.value[0]);
      }
    });
  });
  const buckets = Array.from(bucketSet).sort((a, b) => a - b);

  barSeries.forEach((serie) => {
    const baseItemStyle = { ...(serie.itemStyle ?? {}) };
    const byTimestamp = new Map<number, BarDataItem>();

    serie.data?.forEach((point) => {
      const item = toBarItem(point);
      if (!item) {
        return;
      }
      byTimestamp.set(item.value[0], {
        ...item,
        [REAL_VALUE_FLAG]: true,
        itemStyle: { ...baseItemStyle, ...(item.itemStyle ?? {}) },
      });
    });

    serie.data = buckets.map(
      (bucket) =>
        byTimestamp.get(bucket) ?? {
          value: [bucket, 0],
          itemStyle: { ...baseItemStyle, borderWidth: 0, borderRadius: [0, 0, 0, 0] },
        }
    );
    serie.itemStyle = baseItemStyle;
    serie.barMaxWidth = serie.barMaxWidth ?? BAR_MAX_WIDTH;
  });

  buckets.forEach((_bucket, bucketIndex) => {
    const roundedPositive = new Set<string>();
    const roundedNegative = new Set<string>();

    // Walk the stack from the top so the outermost segment gets the radius.
    for (let idx = barSeries.length - 1; idx >= 0; idx--) {
      const serie = barSeries[idx];
      const item = serie.data?.[bucketIndex] as BarDataItem | undefined;
      if (!item || !Array.isArray(item.value)) {
        continue;
      }

      const value = item.value[1] ?? 0;
      const stackKey = serie.stack ?? `__stack_${idx}`;
      const itemStyle: Record<string, unknown> = {
        ...(serie.itemStyle ?? {}),
        ...(item.itemStyle ?? {}),
        borderRadius: [0, 0, 0, 0],
      };

      if (!value) {
        itemStyle.borderWidth = 0;
        item.itemStyle = itemStyle;
        continue;
      }

      if (value > 0 && !roundedPositive.has(stackKey)) {
        itemStyle.borderRadius = [CORNER_RADIUS, CORNER_RADIUS, 0, 0];
        roundedPositive.add(stackKey);
      } else if (value < 0 && !roundedNegative.has(stackKey)) {
        itemStyle.borderRadius = [0, 0, CORNER_RADIUS, CORNER_RADIUS];
        roundedNegative.add(stackKey);
      }

      applyValueLabel(serie, item, context);
      item.itemStyle = itemStyle;
    }
  });
};
