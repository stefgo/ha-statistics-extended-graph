/**
 * Reports the window the user zoomed into.
 *
 * ECharts fires `datazoom` continuously while the wheel turns or the slider is
 * dragged, so the window is debounced: only the state the gesture came to rest
 * in is reported, which is what may cost a fetch. The window itself is read
 * back from the chart option rather than from the event, because the event of
 * an inside zoom carries percentages of the axis while the option also holds
 * the resolved timestamps.
 */

import type { OnceLogger } from "../core/logger";
import type { ChartInstance, DataZoomOption } from "../types/echarts";
import type { ZoomWindow } from "../time/aggregation";

interface ChartHost extends Element {
  chart?: ChartInstance;
}

/** Time to rest before a window is reported, long enough to bridge a wheel. */
const SETTLE_MS = 400;

/** Percentage below/above which a window is treated as "the whole range". */
const FULL_RANGE_EPSILON = 0.5;

export class ZoomInput {
  private _chart?: ChartInstance;
  private _timeout?: number;

  constructor(
    private readonly _onWindow: (window: ZoomWindow | null) => void,
    /** The range the axis spans, used when the option reports percentages. */
    private readonly _resolveRange: () => ZoomWindow | undefined,
    private readonly _logger: OnceLogger
  ) {}

  /**
   * Subscribes to the chart of `host`. A wheel zoom needs no pointer event
   * first, so this is also tried speculatively after every render - `quiet`
   * keeps those attempts from reporting a chart that simply does not exist
   * yet.
   */
  public attach(host: Element | null | undefined, quiet = false): void {
    const chart = (host as ChartHost | null)?.chart;
    if (!chart || typeof chart.on !== "function") {
      if (!quiet) {
        this._logger.warnOnce(
        "no-zoom-events",
          "<ha-chart-base> exposes no chart instance; the data zoom stays visual."
        );
      }
      return;
    }
    if (chart === this._chart) {
      return;
    }

    this.detach();
    this._chart = chart;
    chart.on("datazoom", this._onDataZoom);
  }

  public detach(): void {
    this._chart?.off?.("datazoom", this._onDataZoom);
    this._chart = undefined;
    this._clearTimer();
  }

  private _clearTimer(): void {
    if (this._timeout !== undefined) {
      clearTimeout(this._timeout);
      this._timeout = undefined;
    }
  }

  private _onDataZoom = (): void => {
    this._clearTimer();
    this._timeout = window.setTimeout(() => {
      this._timeout = undefined;
      this._onWindow(this._readWindow());
    }, SETTLE_MS);
  };

  /** The current window, or `null` while the whole range is shown. */
  private _readWindow(): ZoomWindow | null {
    const zoom = this._chart?.getOption?.()?.dataZoom?.[0] as
      | (DataZoomOption & { startValue?: number; endValue?: number })
      | undefined;
    if (!zoom) {
      return null;
    }

    const start = zoom.start ?? 0;
    const end = zoom.end ?? 100;
    if (start <= FULL_RANGE_EPSILON && end >= 100 - FULL_RANGE_EPSILON) {
      return null;
    }

    if (
      typeof zoom.startValue === "number" &&
      typeof zoom.endValue === "number" &&
      zoom.endValue > zoom.startValue
    ) {
      return { start: zoom.startValue, end: zoom.endValue };
    }

    // Older runtimes report percentages only; the card knows the axis range.
    const range = this._resolveRange();
    if (!range) {
      return null;
    }
    const span = range.end - range.start;
    return {
      start: range.start + (span * start) / 100,
      end: range.start + (span * end) / 100,
    };
  }
}
