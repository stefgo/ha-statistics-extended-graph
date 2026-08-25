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

export interface DataZoomOption {
  type: "inside" | "slider";
  xAxisIndex?: number | number[];
  filterMode?: "filter" | "weakFilter" | "empty" | "none";
  start?: number;
  end?: number;
  minSpan?: number;
  zoomLock?: boolean;
  [key: string]: unknown;
}

export interface ChartOptions {
  series?: SeriesOption[];
  xAxis?: XAxisOption[];
  yAxis?: YAxisOption[];
  grid?: GridOption;
  dataZoom?: DataZoomOption[];
  legend?: Record<string, unknown>;
  tooltip?: Record<string, unknown>;
  animation?: boolean;
  [key: string]: unknown;
}

/** A zrender mouse event, reduced to the pixel position the card reads. */
export interface ZRenderEvent {
  offsetX: number;
  offsetY: number;
}

/** The zrender layer of a chart instance: raw canvas events. */
export interface ZRenderHandler {
  on(event: string, handler: (payload: ZRenderEvent) => void): void;
  off(event: string, handler?: (payload: ZRenderEvent) => void): void;
}

/**
 * The part of the ECharts instance the card uses. Home Assistant creates the
 * instance inside `<ha-chart-base>` and exposes it as `chart`; the card only
 * reads click positions from it and never drives the chart through it.
 */
export interface ChartInstance {
  getZr(): ZRenderHandler | undefined;
  on?(event: string, handler: (payload: unknown) => void): void;
  off?(event: string, handler?: (payload: unknown) => void): void;
  getOption?(): { dataZoom?: DataZoomOption[] } | undefined;
  convertFromPixel(
    finder: Record<string, unknown>,
    value: number | [number, number]
  ): number | number[];
  containPixel?(
    finder: Record<string, unknown>,
    value: [number, number]
  ): boolean;
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
