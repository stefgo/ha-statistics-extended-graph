import type { HomeAssistant } from "custom-card-helpers";
import type { StatisticsExtendedGraphConfig, SeriesConfig } from "../config/types";
import type { Statistics, StatisticsMetaDataMap, StatisticValue } from "../data/statistics";
import type { BarSeriesOption, ChartOptions, SeriesOption } from "../types/echarts";
import type { GraphSnapshot } from "../core/data-controller";
import type { ZoomWindow } from "../time/aggregation";
import { covers } from "../time/detail";
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
import { buildDataZoom, sliderVisible, SLIDER_GRID_BOTTOM } from "./zoom";
import { resolveZoom } from "../config/zoom";
import {
  buildSelectionAxis,
  buildSelectionMarker,
  resolveSelection,
} from "./selection";
import type { SelectedPeriod } from "./selection";

export interface AssembleParams {
  hass: HomeAssistant;
  config: StatisticsExtendedGraphConfig;
  snapshot: GraphSnapshot;
  computedStyle: CSSStyleDeclaration;
  darkMode: boolean;
  logger: OnceLogger;
  /** Clicked x value of the selection; every other bucket is dimmed. */
  selectedX?: number | null;
  /** Part of the range the user zoomed into, if any. */
  zoomWindow?: ZoomWindow | null;
  /**
   * Whether the chart is zoomed, for `zoom.type: "auto"`. It leads
   * `zoomWindow`: the window is only reported once the gesture rests, while
   * the slider is meant to appear with the first turn of the wheel.
   */
  zoomed?: boolean;
}

export interface AssembledChart {
  series: SeriesOption[];
  options: ChartOptions;
  hasData: boolean;
  /** Period the click snapped to, `null` while nothing is selected. */
  selection: SelectedPeriod | null;
}

type TargetData = GraphSnapshot["main"];

/**
 * The data one frame is drawn from. Normally that is the loaded range as it
 * is; while the zoom window lies inside a loaded detail layer it is that
 * layer, which covers a shorter range at a finer interval. Only the x axis
 * stays with the full range in both cases, so zooming out has a place to go.
 */
interface ChartView {
  main: TargetData;
  compare: TargetData;
  shiftedStatistics: GraphSnapshot["shiftedStatistics"];
  shiftedMetadata: GraphSnapshot["shiftedMetadata"];
  shiftedCalculated: GraphSnapshot["shiftedCalculated"];
  start: Date;
  end?: Date;
  compareStart?: Date;
  compareEnd?: Date;
  isDetail: boolean;
}

const pickView = (
  snapshot: GraphSnapshot,
  periodStart: Date,
  zoomWindow: ZoomWindow | null | undefined
): ChartView => {
  const detail = snapshot.detail;
  if (
    detail?.main.statistics &&
    detail.range.end !== null &&
    zoomWindow &&
    covers(detail.range, zoomWindow)
  ) {
    return {
      main: detail.main,
      compare: detail.compare,
      shiftedStatistics: detail.shiftedStatistics,
      shiftedMetadata: detail.shiftedMetadata,
      shiftedCalculated: detail.shiftedCalculated,
      start: new Date(detail.range.start),
      end: new Date(detail.range.end),
      compareStart:
        detail.compareRange && snapshot.comparePeriodStart
          ? new Date(detail.compareRange.start)
          : undefined,
      compareEnd:
        detail.compareRange?.end !== undefined &&
        detail.compareRange?.end !== null &&
        snapshot.comparePeriodStart
          ? new Date(detail.compareRange.end)
          : undefined,
      isDetail: true,
    };
  }

  return {
    main: snapshot.main,
    compare: snapshot.compare,
    shiftedStatistics: snapshot.shiftedStatistics,
    shiftedMetadata: snapshot.shiftedMetadata,
    shiftedCalculated: snapshot.shiftedCalculated,
    start: periodStart,
    end: snapshot.periodEnd,
    compareStart: snapshot.comparePeriodStart,
    compareEnd: snapshot.comparePeriodEnd,
    isDetail: false,
  };
};

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
  config: StatisticsExtendedGraphConfig,
  view: ChartView,
  hass: HomeAssistant
): MainInputs => {
  const statistics: Statistics = { ...(view.main.statistics ?? {}) };
  const metadata: StatisticsMetaDataMap = { ...view.main.metadata };
  const calculated = new Map(view.main.calculated);
  view.shiftedCalculated.forEach((value, key) => calculated.set(key, value));

  const configSeries = config.series.map((series, index) => {
    const statisticId = getStatisticId(series);
    if (!getSeriesTimeOffset(series) || !statisticId) {
      return series;
    }

    const shiftedId = shiftedStatisticId(index, statisticId);
    statistics[shiftedId] = view.shiftedStatistics.get(index) ?? [];

    const shiftedMetadata =
      view.shiftedMetadata.get(index) ?? view.main.metadata[statisticId];
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

const compareDataIsCurrent = (view: ChartView): boolean =>
  !!view.compareStart &&
  !!view.compare.statistics &&
  view.compare.range?.start === view.compareStart.getTime() &&
  (view.compare.range?.end ?? null) === (view.compareEnd?.getTime() ?? null);

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
  zoomWindow = null,
  zoomed,
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

  const view = pickView(snapshot, periodStart, zoomWindow);
  const inputs = buildMainInputs(config, view, hass);
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
  if (compareDataIsCurrent(view) && view.compareStart) {
    const compare = buildSeries({
      hass,
      configSeries: inputs.configSeries,
      statistics: view.compare.statistics!,
      metadata: view.compare.metadata,
      calculatedData: view.compare.calculated,
      colorCycle,
      darkMode,
      computedStyle,
      logger,
    });

    // A detail layer is shifted by plain milliseconds, so it is mapped back
    // the same way; only whole periods get the calendar-aware transform.
    const shift = view.start.getTime() - view.compareStart.getTime();
    const transform = view.isDetail
      ? (timestamp: number) => timestamp + shift
      : createCompareTransform(view.start, view.compareStart);

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

  const displayEnd = view.end?.getTime() ?? view.main.range?.end ?? null;
  const buckets = buildBucketSequence(
    view.start.getTime(),
    displayEnd,
    view.main.aggregation
  );

  if (buckets?.length) {
    normalizeLineSeries(series, buckets);
  }

  extendLineSeries(series, {
    displayEnd,
    // Compare data was already remapped onto the visible range.
    compareDisplayEnd: displayEnd,
    extendMain: view.main.aggregation === "raw",
    extendCompare: view.compare.aggregation === "raw",
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
    aggregation: view.main.aggregation,
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

  const zoom = resolveZoom(config.zoom);
  // The window leads the report while a gesture is still running.
  const isZoomed = zoomed ?? zoomWindow !== null;
  const showsSlider = zoom !== undefined && sliderVisible(zoom, isZoomed);

  const options: ChartOptions = {
    xAxis: buildXAxis({
      start: periodStart,
      end: periodEnd,
      // The axis always describes the full range, so its bounds - and with
      // them the meaning of the zoom window - do not move when the detail
      // layer comes and goes. Only the labels follow what is drawn.
      aggregation: snapshot.main.aggregation,
      buckets: view.isDetail
        ? buildBucketSequence(
            periodStart.getTime(),
            periodEnd?.getTime() ?? snapshot.main.range.end ?? null,
            snapshot.main.aggregation
          )
        : buckets,
      labelAggregation: view.main.aggregation,
      fallbackEnd: snapshot.main.range.end,
      hass,
    }),
    yAxis,
    grid: {
      top: 15,
      left: 1,
      right: 1,
      // The slider sits below the plotting area and needs its own room.
      bottom: showsSlider ? SLIDER_GRID_BOTTOM : 0,
      containLabel: true,
    },
    ...(zoom ? { dataZoom: buildDataZoom(zoom, isZoomed) } : {}),
    // This card renders neither a legend nor a tooltip or axis pointers.
    legend: { show: false },
    tooltip: { show: false, showContent: false, axisPointer: { type: "none" } },
  };

  return { series, options, hasData: seriesHasValues(series), selection };
};
