import { log } from "../core/logger";
import { DEFAULT_TIMESPAN } from "../time/timespan";
import type { StatisticsExtendedGraphConfig, ZoomConfig } from "./types";

/** Options that exist in comparable cards but are intentionally not supported. */
const UNSUPPORTED_CARD_OPTIONS = [
  "hide_legend",
  "expand_legend",
  "legend_sort",
  "show_tooltip",
  "tooltip_precision",
  "show_x_axis_pointer",
  "show_y_axis_pointer",
  "show_stack_sums",
  "show_unit",
  "color_cycle_dark",
];

const UNSUPPORTED_SERIES_OPTIONS = [
  "show_in_legend",
  "show_in_tooltip",
  "hidden_by_default",
  "pv_production_entity",
];

const ZOOM_TYPES = ["inside", "slider", "both", "auto"];

const isPercent = (value: unknown): boolean =>
  typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 100;

/** Reports zoom settings that cannot be honoured; they fall back to defaults. */
const validateZoom = (config: boolean | ZoomConfig | undefined): void => {
  if (typeof config !== "object" || config === null) {
    return;
  }

  if (config.type !== undefined && !ZOOM_TYPES.includes(config.type)) {
    log(
      "warn",
      `zoom.type "${config.type}" is unknown. Use ${ZOOM_TYPES.join(", ")}. Falling back to "inside".`
    );
  }

  if (config.refine !== undefined && typeof config.refine !== "boolean") {
    log(
      "warn",
      `zoom.refine must be true or false, not "${config.refine}". Zooming stays visual.`
    );
  }

  (["start", "end"] as const).forEach((key) => {
    if (config[key] !== undefined && !isPercent(config[key])) {
      log("warn", `zoom.${key} must be a percentage between 0 and 100. It is ignored.`);
    }
  });

  if (
    isPercent(config.start) &&
    isPercent(config.end) &&
    (config.end as number) <= (config.start as number)
  ) {
    log("warn", "zoom.end must be greater than zoom.start. The full range is shown.");
  }
};

const warnUnsupported = (
  target: Record<string, unknown>,
  keys: string[],
  context: string
): void => {
  const found = keys.filter((key) => target[key] !== undefined);
  if (found.length) {
    log(
      "warn",
      `${context} uses unsupported option(s): ${found.join(", ")}. They are ignored.`
    );
  }
};

/**
 * Validates a card configuration and returns it with defaults applied.
 *
 * Only a missing series list is fatal - everything else is reported as a
 * warning so a single broken series cannot take down the whole dashboard.
 */
export const normalizeConfig = (
  config: StatisticsExtendedGraphConfig
): StatisticsExtendedGraphConfig => {
  if (!config.series || !Array.isArray(config.series) || !config.series.length) {
    throw new Error("At least one series must be configured");
  }

  warnUnsupported(config as Record<string, unknown>, UNSUPPORTED_CARD_OPTIONS, "The card");
  validateZoom(config.zoom);

  config.series.forEach((series, index) => {
    if (!series) {
      log("warn", `Series at index ${index} is empty and is ignored.`);
      return;
    }

    warnUnsupported(
      series as unknown as Record<string, unknown>,
      UNSUPPORTED_SERIES_OPTIONS,
      `Series ${index}`
    );

    if ((series.source as string) === "forecast") {
      log(
        "warn",
        `Series ${index} uses "source: forecast", which this card does not support. The series is skipped.`
      );
    }

    const hasStatistic = !!series.statistic_id?.trim();
    const hasCalculation = !!series.calculation;

    if (hasStatistic && hasCalculation) {
      log(
        "warn",
        `Series ${index} defines both statistic_id and calculation. The calculation wins.`
      );
    }
    if (!hasStatistic && !hasCalculation) {
      log(
        "warn",
        `Series ${index} defines neither statistic_id nor calculation and is skipped.`
      );
    }

    if (hasCalculation) {
      const terms = series.calculation?.terms ?? [];
      if (!terms.length) {
        log("warn", `The calculation of series ${index} has no terms and is skipped.`);
      }
      terms.forEach((term, termIndex) => {
        if (term.statistic_id === undefined && term.constant === undefined) {
          log(
            "warn",
            `Calculation term ${termIndex} of series ${index} has neither statistic_id nor constant and is ignored.`
          );
        }
      });
    }
  });

  return {
    ...config,
    timespan: config.timespan ?? DEFAULT_TIMESPAN,
    allow_compare: config.allow_compare ?? true,
    series: config.series.filter(
      (series) => !!series && (series.source as string) !== "forecast"
    ),
  };
};
