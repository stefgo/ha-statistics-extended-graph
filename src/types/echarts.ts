/**
 * Minimal structural typings for the subset of the ECharts option model that
 * this card produces. Home Assistant ships its own ECharts runtime, so the card
 * never imports the library itself - it only hands these plain objects to
 * `<ha-chart-base>`.
 */

export type ChartDataPoint =
  | [number, number | null]
  | { value: [number, number | null]; [key: string]: unknown };

export interface BaseSeriesOption {
  id?: string;
  name?: string;
  type: "line" | "bar";
  data?: ChartDataPoint[];
  z?: number;
  stack?: string;
  stackStrategy?: "all" | "samesign";
  xAxisIndex?: number;
  yAxisIndex?: number;
  emphasis?: Record<string, unknown>;
  itemStyle?: Record<string, unknown>;
  color?: string;
  silent?: boolean;
  [key: string]: unknown;
}

export interface LineSeriesOption extends BaseSeriesOption {
  type: "line";
  smooth?: boolean | number;
  step?: boolean | "start" | "middle" | "end";
  areaStyle?: Record<string, unknown>;
  lineStyle?: Record<string, unknown>;
}

export interface BarSeriesOption extends BaseSeriesOption {
  type: "bar";
  barMaxWidth?: number;
}

export type SeriesOption = LineSeriesOption | BarSeriesOption;

export interface YAxisOption {
  type?: "value" | "log";
  name?: string;
  nameGap?: number;
  nameTextStyle?: Record<string, unknown>;
  position?: "left" | "right";
  min?: number;
  max?: number;
  axisLabel?: Record<string, unknown>;
  splitLine?: Record<string, unknown>;
  scale?: boolean;
  [key: string]: unknown;
}

export interface XAxisOption {
  id?: string;
  type?: "time" | "category" | "value";
  min?: Date | number;
  max?: Date | number;
  show?: boolean;
  [key: string]: unknown;
}

export interface GridOption {
  top?: number;
  left?: number;
  right?: number;
  bottom?: number;
  containLabel?: boolean;
}

export interface ChartOptions {
  series?: SeriesOption[];
  xAxis?: XAxisOption[];
  yAxis?: YAxisOption[];
  grid?: GridOption;
  legend?: Record<string, unknown>;
  tooltip?: Record<string, unknown>;
  animation?: boolean;
  [key: string]: unknown;
}

export interface LinearGradientColor {
  type: "linear";
  x: number;
  y: number;
  x2: number;
  y2: number;
  colorStops: Array<{ offset: number; color: string }>;
  global: false;
}
