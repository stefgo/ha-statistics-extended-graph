/**
 * Where a click landed on the time axis.
 *
 * The card renders no tooltip and no axis pointer, so the click position is
 * taken from the chart itself: the zrender layer of the ECharts instance
 * reports clicks anywhere inside the canvas, and `convertFromPixel` turns the
 * pixel into a value of the time axis. That is a direct read of the click and
 * needs neither a tooltip formatter nor the transient axis pointer state.
 *
 * With the data zoom enabled a drag pans the chart and still ends in a
 * `click`, so the press position is remembered and a click that moved is
 * discarded - only a real tap selects a period.
 *
 * Home Assistant creates the instance inside `<ha-chart-base>` lazily, so the
 * subscription is made on the way into a click: `pointerdown` runs before the
 * click is handled, and by then the chart certainly exists. Versions without a
 * reachable instance fall back to the `chart-click` event of the element.
 */

import type { OnceLogger } from "../core/logger";
import type { ChartInstance, ZRenderEvent } from "../types/echarts";

interface ChartHost extends Element {
  chart?: ChartInstance;
}

/** Pixels the pointer may travel between press and release and still count. */
const DRAG_THRESHOLD = 4;

export class SelectionInput {
  private _chart?: ChartInstance;
  private _zr?: ReturnType<ChartInstance["getZr"]>;
  /** Position of the press the pending click belongs to. */
  private _pressed?: { x: number; y: number };

  constructor(
    private readonly _onPick: (x: number) => void,
    private readonly _logger: OnceLogger
  ) {}

  /** True once a chart instance is hooked; the fallback stays silent then. */
  public get hooked(): boolean {
    return this._chart !== undefined;
  }

  /** Subscribes to the chart of `host`, replacing an earlier subscription. */
  public attach(host: Element | null | undefined): void {
    const chart = (host as ChartHost | null)?.chart;
    if (!chart || typeof chart.getZr !== "function") {
      this._logger.warnOnce(
        "no-chart-instance",
        "<ha-chart-base> exposes no chart instance; falling back to chart-click."
      );
      return;
    }

    if (chart === this._chart) {
      return;
    }

    // A rebuilt chart is a new instance, so the old subscription is dropped.
    this.detach();
    this._chart = chart;
    this._zr = chart.getZr();
    this._zr?.on("mousedown", this._onZrPress);
    this._zr?.on("click", this._onZrClick);
  }

  public detach(): void {
    this._zr?.off("mousedown", this._onZrPress);
    this._zr?.off("click", this._onZrClick);
    this._pressed = undefined;
    this._zr = undefined;
    this._chart = undefined;
  }

  /** Fallback: `<ha-chart-base>` reports a click that hit a data item. */
  public handleChartClick(event: CustomEvent): void {
    if (this.hooked) {
      return;
    }
    const detail = event.detail as { value?: unknown } | undefined;
    const value = Array.isArray(detail?.value) ? detail?.value[0] : undefined;
    if (typeof value === "number" && Number.isFinite(value)) {
      this._onPick(value);
    }
  }

  private _onZrPress = (event: ZRenderEvent): void => {
    this._pressed = { x: event.offsetX, y: event.offsetY };
  };

  private _onZrClick = (event: ZRenderEvent): void => {
    const chart = this._chart;
    if (!chart) {
      return;
    }

    // A pan of the data zoom ends in a click as well; only a tap selects.
    const pressed = this._pressed;
    this._pressed = undefined;
    if (
      pressed &&
      (Math.abs(event.offsetX - pressed.x) > DRAG_THRESHOLD ||
        Math.abs(event.offsetY - pressed.y) > DRAG_THRESHOLD)
    ) {
      return;
    }

    const pixel: [number, number] = [event.offsetX, event.offsetY];
    // Clicks on the axis labels or beside the plot select nothing.
    if (
      typeof chart.containPixel === "function" &&
      !chart.containPixel({ gridIndex: 0 }, pixel)
    ) {
      return;
    }

    const converted = chart.convertFromPixel({ xAxisIndex: 0 }, pixel[0]);
    const x = Array.isArray(converted) ? converted[0] : converted;
    if (typeof x === "number" && Number.isFinite(x)) {
      this._onPick(x);
    }
  };
}
