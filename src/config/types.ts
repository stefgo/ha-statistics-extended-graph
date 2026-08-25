import type { LovelaceCardConfig } from "custom-card-helpers";
import type { StatisticsPeriod } from "../data/statistics";

export type ChartType = "bar" | "line" | "step";

export type StatisticType = "change" | "sum" | "mean" | "min" | "max" | "state";

export type CalculationOperation = "add" | "subtract" | "multiply" | "divide";

/** Numeric post-processing shared by series and calculation terms. */
export interface ValueTransformConfig {
  multiply?: number;
  add?: number;
  clip_min?: number;
  clip_max?: number;
}

export interface CalculationTermConfig extends ValueTransformConfig {
  statistic_id?: string;
  stat_type?: StatisticType;
  constant?: number;
  operation?: CalculationOperation;
}

export interface CalculationConfig {
  terms: CalculationTermConfig[];
  initial_value?: number;
}

export interface ThemedColorConfig {
  light?: string;
  dark?: string;
}

/** Either one color for both themes or per-theme colors. */
export type ColorConfig = string | ThemedColorConfig;

export type SeriesSource = "statistic" | "calculation";

export type TimeOffsetUnit = "hour" | "day" | "week" | "month" | "year";

export interface TimeOffsetConfig {
  value: number;
  unit: TimeOffsetUnit;
}

export interface SeriesConfig extends ValueTransformConfig {
  source?: SeriesSource;
  statistic_id?: string;
  name?: string;
  stat_type?: StatisticType;
  chart_type?: ChartType;
  stack?: string;
  y_axis?: "left" | "right";
  color?: ColorConfig;
  compare_color?: ColorConfig;
  fill?: boolean;
  fill_opacity?: number;
  gradient_fill?: boolean;
  fill_to_series?: string;
  line_opacity?: number;
  line_width?: number;
  line_style?: "solid" | "dashed" | "dotted";
  smooth?: boolean | number;
  show_value_labels?: boolean;
  value_label_precision?: number;
  calculation?: CalculationConfig;
  time_offset?: TimeOffsetConfig;
}

export interface RawHistoryOptions {
  significant_changes_only?: boolean;
}

export type AggregationTarget = StatisticsPeriod | "raw" | "disabled";

export type EnergyPickerRange = "hour" | "day" | "week" | "month" | "year";

export interface AggregationConfig {
  manual?: AggregationTarget;
  fallback?: AggregationTarget;
  energy_picker?: Partial<Record<EnergyPickerRange, AggregationTarget>>;
  raw_options?: RawHistoryOptions;
  compute_current_hour?: boolean;
}

export type RelativeCalendarPeriod = "hour" | "day" | "week" | "month" | "year";

export type RelativeRollingPeriod =
  | "last_60_minutes"
  | "last_24_hours"
  | "last_7_days"
  | "last_30_days"
  | "last_12_months";

export type RelativePeriod = RelativeCalendarPeriod | RelativeRollingPeriod;

export type TimespanConfig =
  | { mode: "energy" }
  | {
      mode: "relative";
      period: RelativePeriod;
      offset?: number;
      count?: number;
    }
  | {
      mode: "fixed";
      start?: string;
      end?: string;
    };

export interface AxisConfig {
  id: "left" | "right";
  min?: number;
  max?: number;
  fit_y_data?: boolean;
  center_zero?: boolean;
  logarithmic_scale?: boolean;
  hide_grid?: boolean;
  unit?: string;
}

export type ZoomType = "inside" | "slider" | "both";

export interface ZoomConfig {
  /** `inside` zooms on the plot itself, `slider` adds a bar below it. */
  type?: ZoomType;
  /** Locks the width of the window, so a drag only pans it. */
  zoom_lock?: boolean;
  /** Initially visible window in percent of the range. */
  start?: number;
  end?: number;
  /**
   * Load high resolution data for the zoom window, so zooming in shows more
   * than a magnified version of the same buckets. Off by default, because
   * every step into a new window is a fetch.
   */
  refine?: boolean;
}

export interface StatisticsExtendedGraphConfig extends LovelaceCardConfig {
  type: string;
  title?: string;
  chart_height?: string;
  timespan?: TimespanConfig;
  collection_key?: string;
  allow_compare?: boolean;
  color_cycle?: ColorConfig[];
  y_axes?: AxisConfig[];
  aggregation?: AggregationConfig;
  /** `true` enables the inside zoom with its defaults. */
  zoom?: boolean | ZoomConfig;
  series: SeriesConfig[];
}
