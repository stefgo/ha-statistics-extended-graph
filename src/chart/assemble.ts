import type { HomeAssistant } from "custom-card-helpers";
import type { CustomGraphCardConfig, SeriesConfig } from "../config/types";
import type { Statistics, StatisticsMetaDataMap, StatisticValue } from "../data/statistics";
import type { BarSeriesOption, ChartOptions, SeriesOption } from "../types/echarts";
import type { GraphSnapshot } from "../core/data-controller";
import { OnceLogger } from "../core/logger";
import { formatNumber } from "../core/format";
import { resolveColorToken, resolveThemedColor } from "../core/color";
import { buildBucketSequence } from "../time/buckets";
import { buildSeries } from "../series/builder";
import { getStatisticId, isCompareId, toBaseId, toCompareId } from "../series/model";
import { getSeriesTimeOffset, shiftedStatisticId } from "../series/time-offset";
import { applyBarStyling } from "./bars";
import { BarStackLayout, createCompareTransform, styleCompareSeries } from "./compare";
import { extendLineSeries, normalizeLineSeries, toTuple } from "./lines";
import { buildXAxis, buildYAxes } from "./axes";
import { applySelectionDimming } from "./dimming";
import {
  buildSelectionAxis,
  buildSelectionMarker,
  resolveSelection,
} from "./selection";
import type { SelectedPeriod } from "./selection";

export interface AssembleParams {
  hass: HomeAssistant;
  config: CustomGraphCardConfig;
  snapshot: GraphSnapshot;
  computedStyle: CSSStyleDeclaration;
  darkMode: boolean;
  logger: OnceLogger;
  /** Clicked x value of the selection; every other bucket is dimmed. */
  selectedX?: number | null;
}

export interface AssembledChart {
  series: SeriesOption[];
  options: ChartOptions;
  hasData: boolean;
  /** Period the click snapped to, `null` while nothing is selected. */
  selection: SelectedPeriod | null;
}

interface MainInputs {
  statistics: Statistics;
  metadata: StatisticsMetaDataMap;
  configSeries: SeriesConfig[];
  calculated: Map<string, StatisticValue[]>;
}

/**
 * Folds the separately loaded time-offset data into the regular inputs: shifted
 * statistics get a synthetic id so the builder can treat them like any other
 * series.
 */
const buildMainInputs = (
  config: CustomGraphCardConfig,
  snapshot: GraphSnapshot,
  hass: HomeAssistant
): MainInputs => {
  const statistics: Statistics = { ...(snapshot.main.statistics ?? {}) };
  const metadata: StatisticsMetaDataMap = { ...snapshot.main.metadata };
  const calculated = new Map(snapshot.main.calculated);
  snapshot.shiftedCalculated.forEach((value, key) => calculated.set(key, value));

  const configSeries = config.series.map((series, index) => {
    const statisticId = getStatisticId(series);
    if (!getSeriesTimeOffset(series) || !statisticId) {
      return series;
    }

    const shiftedId = shiftedStatisticId(index, statisticId);
    statistics[shiftedId] = snapshot.shiftedStatistics.get(index) ?? [];

    const shiftedMetadata =
      snapshot.shiftedMetadata.get(index) ?? snapshot.main.metadata[statisticId];
    if (shiftedMetadata) {
      metadata[shiftedId] = { ...shiftedMetadata, statistic_id: shiftedId };
    }

    return {
      ...series,
      statistic_id: shiftedId,
      name:
        series.name ??
        hass.states[statisticId]?.attributes.friendly_name ??
        shiftedMetadata?.name ??
        statisticId,
    };
  });

  return { statistics, metadata, configSeries, calculated };
};

const compareDataIsCurrent = (snapshot: GraphSnapshot): boolean =>
  !!snapshot.comparePeriodStart &&
  !!snapshot.compare.statistics &&
  snapshot.compare.range?.start === snapshot.comparePeriodStart.getTime() &&
  (snapshot.compare.range?.end ?? null) ===
    (snapshot.comparePeriodEnd?.getTime() ?? null);

const remapTimestamps = (
  serie: SeriesOption,
  transform: (timestamp: number) => number
): void => {
  if (!Array.isArray(serie.data)) {
    return;
  }
  serie.data = serie.data.map((point) => {
    const tuple = toTuple(point);
    if (!tuple) {
      return point;
    }
    const mapped: [number, number | null] = [transform(tuple[0]), tuple[1]];
    return Array.isArray(point) ? mapped : { ...point, value: mapped };
  });
};

const seriesHasValues = (series: SeriesOption[]): boolean =>
  series.some((serie) =>
    serie.data?.some((point) => {
      const tuple = toTuple(point);
      return !!tuple && tuple[1] !== null;
    })
  );

/**
 * Builds the complete chart model: series for the visible range, optional
 * compare series, and the axis/grid options.
 */
export const assembleChart = ({
  hass,
  config,
  snapshot,
  computedStyle,
  darkMode,
  logger,
  selectedX = null,
}: AssembleParams): AssembledChart | undefined => {
  const { periodStart, periodEnd } = snapshot;
  if (!periodStart || !snapshot.main.statistics || !snapshot.main.range) {
    return undefined;
  }

  // Ignore stale data that belongs to a range the card has already left.
  if (
    snapshot.main.range.start !== periodStart.getTime() ||
    (snapshot.main.range.end ?? null) !== (periodEnd?.getTime() ?? null)
  ) {
    return undefined;
  }

  const inputs = buildMainInputs(config, snapshot, hass);
  const colorCycle = config.color_cycle ?? [];

  const main = buildSeries({
    hass,
    configSeries: inputs.configSeries,
    statistics: inputs.statistics,
    metadata: inputs.metadata,
    calculatedData: inputs.calculated,
    colorCycle,
    darkMode,
    computedStyle,
    logger,
  });

  const configById = new Map(main.configById);
  const barLayout = new BarStackLayout();
  main.series.forEach((serie, index) => {
    if (serie.type === "bar") {
      barLayout.assignCurrent(serie as BarSeriesOption, index);
    }
  });

  const compareSeries: SeriesOption[] = [];
  if (compareDataIsCurrent(snapshot) && snapshot.comparePeriodStart) {
    const compare = buildSeries({
      hass,
      configSeries: inputs.configSeries,
      statistics: snapshot.compare.statistics!,
      metadata: snapshot.compare.metadata,
      calculatedData: snapshot.compare.calculated,
      colorCycle,
      darkMode,
      computedStyle,
      logger,
    });

    const transform = createCompareTransform(
      periodStart,
      snapshot.comparePeriodStart
    );

    compare.series.forEach((serie, index) => {
      const baseId = serie.id ?? `compare_${index}`;
      const compareId = toCompareId(baseId);
      const cloned: SeriesOption = { ...serie, id: compareId, name: `${serie.name ?? baseId} (compare)` };
      remapTimestamps(cloned, transform);

      const baseConfig =
        compare.configById.get(baseId) ??
        compare.configById.get(baseId.replace(/__fill_(base|area)$/u, ""));
      if (baseConfig) {
        configById.set(compareId, baseConfig);
      }

      const compareColorToken = resolveThemedColor(baseConfig?.compare_color, darkMode);
      const compareColor = compareColorToken
        ? resolveColorToken(compareColorToken, computedStyle)
        : undefined;

      if (cloned.type === "bar") {
        barLayout.assignCompare(cloned as BarSeriesOption, baseId);
      } else if (cloned.stack?.trim()) {
        cloned.stack = `${cloned.stack.trim()}--compare`;
      } else {
        cloned.stack = `${compareId}--stack`;
      }

      styleCompareSeries(cloned, compareColor);
      cloned.z = Math.max((cloned.z ?? 0) - 1, 0);
      compareSeries.push(cloned);
    });
  }

  const series: SeriesOption[] = [
    ...barLayout.placeholders(),
    ...compareSeries,
    ...main.series,
  ];

  if (!series.length) {
    return undefined;
  }

  const displayEnd = periodEnd?.getTime() ?? snapshot.main.range.end ?? null;
  const buckets = buildBucketSequence(
    periodStart.getTime(),
    displayEnd,
    snapshot.main.aggregation
  );

  if (buckets?.length) {
    normalizeLineSeries(series, buckets);
  }

  extendLineSeries(series, {
    displayEnd,
    // Compare data was already remapped onto the visible range.
    compareDisplayEnd: displayEnd,
    extendMain: snapshot.main.aggregation === "raw",
    extendCompare: snapshot.compare.aggregation === "raw",
    chartTypeOf: (id) => configById.get(toBaseId(id ?? ""))?.chart_type ?? configById.get(id ?? "")?.chart_type,
    isCompare: (id) => !!id && isCompareId(id),
  });

  applyBarStyling(series, {
    buckets,
    configById,
    valueLabelColor:
      computedStyle.getPropertyValue("--primary-text-color").trim() || "#000",
    formatValue: (value, precision) =>
      formatNumber(value, hass, {
        minimumFractionDigits: precision,
        maximumFractionDigits: precision,
      }),
    logger,
  });

  // The selection is derived from the data of this assembly, so a refresh keeps
  // marker and dimming in place as long as the bucket still exists.
  const selection = resolveSelection(selectedX, {
    series,
    buckets,
    aggregation: snapshot.main.aggregation,
    displayEnd,
  });

  // The hidden marker axis is always appended, so the axis indices of the data
  // series never shift between a selected and a cleared chart.
  const yAxis = [
    ...buildYAxes({
      axes: config.y_axes ?? [],
      seriesConfigs: config.series,
      series,
      hass,
    }),
    buildSelectionAxis(),
  ];

  if (selection) {
    const dots = applySelectionDimming(series, selection.bucket);
    series.push(
      buildSelectionMarker({
        period: selection,
        computedStyle,
        axisIndex: yAxis.length - 1,
      }),
      ...dots
    );
  }

  const options: ChartOptions = {
    xAxis: buildXAxis({
      start: periodStart,
      end: periodEnd,
      aggregation: snapshot.main.aggregation,
      buckets,
      fallbackEnd: snapshot.main.range.end,
      hass,
    }),
    yAxis,
    grid: { top: 15, left: 1, right: 1, bottom: 0, containLabel: true },
    // This card renders neither a legend nor a tooltip or axis pointers.
    legend: { show: false },
    tooltip: { show: false, showContent: false, axisPointer: { type: "none" } },
  };

  return { series, options, hasData: seriesHasValues(series), selection };
};
