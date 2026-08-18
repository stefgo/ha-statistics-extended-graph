import type { HomeAssistant } from "custom-card-helpers";
import type { ColorConfig, SeriesConfig } from "../config/types";
import type {
  Statistics,
  StatisticsMetaDataMap,
  StatisticValue,
} from "../data/statistics";
import type {
  BarSeriesOption,
  LineSeriesOption,
  SeriesOption,
} from "../types/echarts";
import {
  applyAlpha,
  buildZeroAwareGradientFill,
  clampAlpha,
  resolveColorToken,
  resolveThemedColor,
} from "../core/color";
import { OnceLogger } from "../core/logger";
import {
  DEFAULT_STAT_TYPE,
  calculationKey,
  getSeriesSource,
  getStatisticId,
  transformValue,
} from "./model";

/** Default palette: the colors the energy dashboard uses. */
export const DEFAULT_COLOR_CYCLE = [
  "--energy-grid-consumption-color",
  "--energy-grid-return-color",
  "--energy-solar-color",
  "--energy-battery-in-color",
  "--energy-battery-out-color",
  "--energy-gas-color",
  "--energy-water-color",
  "--energy-non-fossil-color",
];

export const BAR_MAX_WIDTH = 50;

const BAR_FILL_ALPHA = 0.5;
const BAR_BORDER_ALPHA = 1;
const LINE_ALPHA = 0.85;
const LINE_AREA_ALPHA = 0.15;
const LINE_GRADIENT_STRONG_ALPHA = 0.75;
const DEFAULT_LINE_WIDTH = 1.5;

export interface BuildSeriesParams {
  hass: HomeAssistant;
  configSeries: SeriesConfig[];
  statistics: Statistics;
  metadata: StatisticsMetaDataMap;
  calculatedData: Map<string, StatisticValue[]>;
  colorCycle: ColorConfig[];
  darkMode: boolean;
  computedStyle: CSSStyleDeclaration;
  logger: OnceLogger;
}

export interface BuiltSeries {
  series: SeriesOption[];
  /** Maps every generated series id back to the configuration that created it. */
  configById: Map<string, SeriesConfig>;
}

interface LineSeriesMeta {
  id: string;
  name: string;
  config: SeriesConfig;
  dataPoints: Array<[number, number | null]>;
  lineColor: string;
  fillColor: string;
  series: LineSeriesOption;
}

/**
 * Stacked line series must be drawn back-to-front, otherwise the fill of a
 * lower series covers the line above it.
 */
const buildStackedLineZ = (configSeries: SeriesConfig[]): Map<number, number> => {
  const groups = new Map<string, number[]>();

  configSeries.forEach((series, index) => {
    const chartType = series.chart_type ?? "bar";
    const stack = series.stack?.trim();
    if ((chartType !== "line" && chartType !== "step") || !stack) {
      return;
    }
    const axis = series.y_axis === "right" ? "right" : "left";
    const key = `${axis}:${stack}`;
    groups.set(key, [...(groups.get(key) ?? []), index]);
  });

  const zByIndex = new Map<number, number>();
  groups.forEach((indexes) => {
    indexes.forEach((seriesIndex, position) => {
      zByIndex.set(seriesIndex, indexes[indexes.length - position - 1]);
    });
  });
  return zByIndex;
};

const resolveSeriesName = (
  series: SeriesConfig,
  index: number,
  statisticId: string | undefined,
  hass: HomeAssistant,
  metadata: StatisticsMetaDataMap
): string => {
  if (series.name) {
    return series.name;
  }
  if (statisticId) {
    return (
      hass.states[statisticId]?.attributes.friendly_name ??
      metadata[statisticId]?.name ??
      statisticId
    );
  }
  return `Series ${index + 1}`;
};

const toDataPoints = (
  raw: StatisticValue[],
  series: SeriesConfig
): Array<[number, number | null]> => {
  const statKey = series.stat_type ?? DEFAULT_STAT_TYPE;
  return raw.map((entry) => {
    const value = entry[statKey];
    const timestamp = entry.start ?? entry.end;
    if (typeof value !== "number" || !Number.isFinite(value)) {
      return [timestamp, null];
    }
    return [timestamp, transformValue(value, series)];
  });
};

/**
 * Renders the band between two line series as a transparent baseline plus a
 * stacked area on top - ECharts has no native "fill between" mode.
 */
const buildFillBand = (
  source: LineSeriesMeta,
  target: LineSeriesMeta,
  logger: OnceLogger
): SeriesOption[] => {
  const valuesOf = (points: Array<[number, number | null]>) => {
    const map = new Map<number, number | null>();
    points.forEach(([timestamp, value]) => map.set(timestamp, value));
    return map;
  };

  const upperValues = valuesOf(source.dataPoints);
  const lowerValues = valuesOf(target.dataPoints);
  const buckets = Array.from(
    new Set([...upperValues.keys(), ...lowerValues.keys()])
  ).sort((a, b) => a - b);

  const baselineData: Array<[number, number | null]> = [];
  const bandData: Array<[number, number | null]> = [];
  let clamped = false;

  buckets.forEach((bucket) => {
    const upper = upperValues.get(bucket);
    const lower = lowerValues.get(bucket);
    if (
      upper === undefined ||
      lower === undefined ||
      upper === null ||
      lower === null
    ) {
      baselineData.push([bucket, lower ?? null]);
      bandData.push([bucket, null]);
      return;
    }
    const diff = upper - lower;
    if (diff < 0) {
      clamped = true;
      baselineData.push([bucket, lower]);
      bandData.push([bucket, 0]);
      return;
    }
    baselineData.push([bucket, lower]);
    bandData.push([bucket, diff]);
  });

  if (!bandData.some(([, value]) => typeof value === "number" && value > 0)) {
    return [];
  }

  if (clamped) {
    logger.warnOnce(
      `fill-clamped-${source.name}-${target.name}`,
      `"${source.name}" dropped below "${target.name}". Negative differences were clamped to zero.`
    );
  }

  const stackId = `__fill_${source.id}`;
  const sourceZ = typeof source.series.z === "number" ? source.series.z : 2;
  const targetZ = typeof target.series.z === "number" ? target.series.z : 2;
  const bandZ = sourceZ - 0.1 < 0 ? sourceZ + 0.1 : sourceZ - 0.1;
  const baseZ = Math.max(Math.min(bandZ - 0.01, targetZ - 0.1), 0);

  const shared = {
    type: "line" as const,
    stack: stackId,
    stackStrategy: "all" as const,
    showSymbol: false,
    silent: true,
    legendHoverLink: false,
    emphasis: { disabled: true },
    yAxisIndex: source.series.yAxisIndex,
  };

  const baseline: LineSeriesOption = {
    ...shared,
    id: `${source.id}__fill_base`,
    name: `${source.name}__fill_base`,
    data: baselineData,
    smooth: target.series.smooth,
    lineStyle: { width: 0, color: target.lineColor },
    areaStyle: { opacity: 0 },
    yAxisIndex: target.series.yAxisIndex,
    z: baseZ,
  };

  const band: LineSeriesOption = {
    ...shared,
    id: `${source.id}__fill_area`,
    name: `${source.name}__fill_area`,
    data: bandData,
    smooth: source.series.smooth,
    lineStyle: { width: 0, color: source.lineColor },
    areaStyle: { color: source.fillColor },
    itemStyle: { color: source.fillColor },
    z: bandZ,
  };

  return [baseline, band];
};

/**
 * Turns the configured series into ECharts series options.
 *
 * The generated id encodes source key, statistic type, chart type and config
 * index, which keeps ids stable across redraws and unique per configuration.
 */
export const buildSeries = ({
  hass,
  configSeries,
  statistics,
  metadata,
  calculatedData,
  colorCycle,
  darkMode,
  computedStyle,
  logger,
}: BuildSeriesParams): BuiltSeries => {
  const palette: ColorConfig[] = colorCycle.length ? colorCycle : DEFAULT_COLOR_CYCLE;
  const paletteColorAt = (index: number): string =>
    resolveThemedColor(palette[index % palette.length], darkMode) ??
    DEFAULT_COLOR_CYCLE[index % DEFAULT_COLOR_CYCLE.length];

  const output: SeriesOption[] = [];
  const configById = new Map<string, SeriesConfig>();
  const lineSeriesByName = new Map<string, LineSeriesMeta>();
  const fillRequests: Array<{ sourceName: string; targetName: string }> = [];
  const stackedLineZ = buildStackedLineZ(configSeries);

  configSeries.forEach((series, index) => {
    const source = getSeriesSource(series);
    const statisticId = source === "statistic" ? getStatisticId(series) : undefined;
    const calcKey = source === "calculation" ? calculationKey(index) : undefined;

    let raw: StatisticValue[] | undefined;
    if (calcKey) {
      raw = calculatedData.get(calcKey);
      if (!raw?.length) {
        logger.warnOnce(
          `calculation-empty-${index}`,
          `Calculation series "${series.name ?? calcKey}" produced no data.`,
          "debug"
        );
        return;
      }
    } else if (statisticId) {
      raw = statistics[statisticId];
      if (!raw?.length) {
        logger.warnOnce(
          `statistics-empty-${statisticId}`,
          `No statistics available for "${statisticId}".`,
          "debug"
        );
        return;
      }
    } else {
      logger.warnOnce(
        `series-misconfigured-${index}`,
        `Series at index ${index} has no valid data source.`
      );
      return;
    }

    const chartType = series.chart_type ?? "bar";
    const isStep = chartType === "step";
    const isLineLike = chartType === "line" || isStep;
    const name = resolveSeriesName(series, index, statisticId, hass, metadata);

    const colorToken =
      resolveThemedColor(series.color, darkMode) ?? paletteColorAt(index);
    const colorValue = resolveColorToken(colorToken, computedStyle);

    const lineOpacity =
      typeof series.line_opacity === "number"
        ? clampAlpha(series.line_opacity)
        : undefined;

    const baseKey = statisticId ?? calcKey ?? `series_${index}`;
    const statType = series.stat_type ?? DEFAULT_STAT_TYPE;
    const id = `${baseKey}:${statType}:${chartType}:${index}`;
    configById.set(id, series);

    const dataPoints = toDataPoints(raw, series);

    if (isLineLike) {
      const strokeAlpha = lineOpacity ?? LINE_ALPHA;
      const lineColor = applyAlpha(colorValue, strokeAlpha);
      const fillOpacity =
        typeof series.fill_opacity === "number"
          ? clampAlpha(series.fill_opacity)
          : LINE_AREA_ALPHA;
      const fillColor = applyAlpha(colorValue, fillOpacity);
      const smooth =
        typeof series.smooth === "number"
          ? clampAlpha(series.smooth)
          : series.smooth;

      const lineSeries: LineSeriesOption = {
        id,
        name,
        type: "line",
        data: dataPoints,
        showSymbol: false,
        smooth: isStep ? false : smooth ?? true,
        stack: series.stack,
        yAxisIndex: series.y_axis === "right" ? 1 : 0,
        z: stackedLineZ.get(index) ?? index,
        lineStyle: {
          width: series.line_width ?? DEFAULT_LINE_WIDTH,
          color: lineColor,
          type: series.line_style ?? "solid",
        },
        itemStyle: { color: lineColor, borderColor: lineColor },
        legendHoverLink: false,
        emphasis: { disabled: true },
        color: lineColor,
      };

      if (isStep) {
        lineSeries.step = "end";
      }

      if (series.fill === true) {
        lineSeries.areaStyle = {
          color:
            series.gradient_fill === true
              ? buildZeroAwareGradientFill(
                  colorValue,
                  typeof series.fill_opacity === "number"
                    ? fillOpacity
                    : LINE_GRADIENT_STRONG_ALPHA,
                  dataPoints
                )
              : fillColor,
        };
      }

      output.push(lineSeries);

      if (lineSeriesByName.has(name)) {
        logger.warnOnce(
          `duplicate-name-${name}`,
          `Multiple series are named "${name}". fill_to_series references are ambiguous.`
        );
      } else {
        lineSeriesByName.set(name, {
          id,
          name,
          config: series,
          dataPoints,
          lineColor,
          fillColor,
          series: lineSeries,
        });
      }

      const targetName = series.fill_to_series?.trim();
      if (targetName) {
        fillRequests.push({ sourceName: name, targetName });
      }
    } else {
      const fillOpacity =
        typeof series.fill_opacity === "number"
          ? clampAlpha(series.fill_opacity)
          : BAR_FILL_ALPHA;
      const fillColor = applyAlpha(colorValue, fillOpacity);
      const borderColor = applyAlpha(colorValue, lineOpacity ?? BAR_BORDER_ALPHA);

      const barSeries: BarSeriesOption = {
        id,
        name,
        type: "bar",
        data: dataPoints,
        stack: series.stack,
        yAxisIndex: series.y_axis === "right" ? 1 : 0,
        z: index,
        itemStyle: { color: fillColor, borderColor },
        legendHoverLink: false,
        emphasis: { disabled: true },
        color: fillColor,
        barMaxWidth: BAR_MAX_WIDTH,
      };

      if (series.fill_to_series) {
        logger.warnOnce(
          `fill-bar-${name}`,
          `Series "${name}" is a bar chart and cannot use fill_to_series.`
        );
      }

      output.push(barSeries);
    }
  });

  fillRequests.forEach(({ sourceName, targetName }) => {
    const source = lineSeriesByName.get(sourceName);
    const target = lineSeriesByName.get(targetName);

    if (!source) {
      return;
    }
    if (source.config.stack) {
      logger.warnOnce(
        `fill-source-stack-${sourceName}`,
        `Series "${sourceName}" combines stacking with fill_to_series, which is not supported.`
      );
      return;
    }
    if (!target) {
      logger.warnOnce(
        `fill-target-missing-${sourceName}-${targetName}`,
        `fill_to_series of "${sourceName}" references "${targetName}", which is not an existing line series.`
      );
      return;
    }
    if (target.config.stack) {
      logger.warnOnce(
        `fill-target-stack-${targetName}`,
        `Series "${targetName}" uses stacking and cannot be a fill target.`
      );
      return;
    }
    if (source.name === target.name) {
      logger.warnOnce(
        `fill-self-${sourceName}`,
        `Series "${sourceName}" references itself in fill_to_series.`
      );
      return;
    }

    output.push(...buildFillBand(source, target, logger));
  });

  return { series: output, configById };
};
