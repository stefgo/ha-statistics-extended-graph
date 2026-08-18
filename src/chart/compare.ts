import {
  addDays,
  addMonths,
  addYears,
  differenceInDays,
  differenceInMonths,
  differenceInYears,
  startOfDay,
  startOfMonth,
  startOfYear,
} from "date-fns";
import type { BarSeriesOption, SeriesOption } from "../types/echarts";
import { colorWithAlpha, extractAlpha, gradientWithColor } from "../core/color";
import { BAR_MAX_WIDTH } from "../series/builder";

const COMPARE_OPACITY = 0.6;
const BAR_Z_BASE = 10;

/**
 * Maps a timestamp of the compare range onto the visible range.
 *
 * Calendar-aligned ranges are shifted by whole years, months or days so that
 * e.g. February compared against January keeps its own day count.
 */
export const createCompareTransform = (
  start: Date,
  compareStart: Date
): ((timestamp: number) => number) => {
  const yearDiff = differenceInYears(start, compareStart);
  if (yearDiff !== 0 && start.getTime() === startOfYear(start).getTime()) {
    return (timestamp) => addYears(new Date(timestamp), yearDiff).getTime();
  }

  const monthDiff = differenceInMonths(start, compareStart);
  if (monthDiff !== 0 && start.getTime() === startOfMonth(start).getTime()) {
    return (timestamp) => addMonths(new Date(timestamp), monthDiff).getTime();
  }

  const dayDiff = differenceInDays(start, compareStart);
  if (dayDiff !== 0 && start.getTime() === startOfDay(start).getTime()) {
    return (timestamp) => addDays(new Date(timestamp), dayDiff).getTime();
  }

  const offset = start.getTime() - compareStart.getTime();
  return (timestamp) => timestamp + offset;
};

const recolor = (color: string, existing: unknown): string =>
  colorWithAlpha(color, extractAlpha(existing));

/**
 * Fades a compare series, or recolors it when the series configures an explicit
 * `compare_color`. Compare series are always drawn below their counterpart.
 */
export const styleCompareSeries = (
  serie: SeriesOption,
  overrideColor?: string
): void => {
  if (overrideColor?.trim()) {
    const color = overrideColor.trim();
    const itemColor = recolor(
      color,
      (serie.itemStyle as Record<string, unknown> | undefined)?.color
    );

    serie.itemStyle = { ...(serie.itemStyle ?? {}), color: itemColor };
    serie.color = itemColor;
    serie.emphasis = {
      ...(serie.emphasis ?? {}),
      itemStyle: {
        ...((serie.emphasis?.itemStyle as Record<string, unknown>) ?? {}),
        color: itemColor,
      },
    };

    if (serie.type === "bar") {
      serie.itemStyle = { ...serie.itemStyle, borderColor: itemColor };
      return;
    }

    const lineColor = recolor(
      color,
      (serie.lineStyle as Record<string, unknown> | undefined)?.color
    );
    serie.lineStyle = { ...(serie.lineStyle ?? {}), color: lineColor };
    serie.color = lineColor;
    if (serie.areaStyle) {
      const areaStyle = { ...(serie.areaStyle as Record<string, unknown>) };
      areaStyle.color =
        gradientWithColor(color, areaStyle.color) ?? recolor(color, areaStyle.color);
      serie.areaStyle = areaStyle;
    }
    serie.connectNulls = false;
    return;
  }

  if (serie.type === "bar") {
    serie.itemStyle = { ...(serie.itemStyle ?? {}), opacity: COMPARE_OPACITY };
    serie.emphasis = {
      ...(serie.emphasis ?? {}),
      itemStyle: {
        ...((serie.emphasis?.itemStyle as Record<string, unknown>) ?? {}),
        opacity: Math.min(1, COMPARE_OPACITY + 0.2),
      },
    };
  } else {
    serie.lineStyle = { ...(serie.lineStyle ?? {}), opacity: COMPARE_OPACITY };
    serie.itemStyle = { ...(serie.itemStyle ?? {}), opacity: COMPARE_OPACITY };
    if (serie.areaStyle) {
      const areaStyle = serie.areaStyle as Record<string, unknown>;
      const opacity =
        typeof areaStyle.opacity === "number" ? areaStyle.opacity : COMPARE_OPACITY / 2;
      serie.areaStyle = { ...areaStyle, opacity: opacity * 0.6 };
    }
    serie.connectNulls = false;
  }
};

/**
 * Assigns bar stack names for the "current" and "compare" halves of the chart.
 *
 * ECharts draws one column per stack name, so the two halves end up side by
 * side. A transparent placeholder per stack keeps the column order stable even
 * when the compare range has no data for a series.
 */
export class BarStackLayout {
  private readonly _baseKeyBySeriesId = new Map<string, string>();
  private readonly _placeholderByBase = new Map<string, BarSeriesOption>();
  private readonly _zByBase = new Map<string, number>();
  private readonly _order: string[] = [];
  private _generatedStacks = 0;

  /** Places a main-range bar series into its "current" stack. */
  public assignCurrent(serie: BarSeriesOption, index: number): void {
    const id = serie.id ?? `bar_${index}`;
    const baseKey = this._baseKeyFor(serie.stack);
    this._baseKeyBySeriesId.set(id, baseKey);
    const z = this._resolveZ(baseKey, serie.z);
    serie.z = z;
    serie.stack = `${baseKey}--current`;
    this._ensurePlaceholder(baseKey, z, "current");
  }

  /** Places a compare-range bar series into its "compare" stack. */
  public assignCompare(serie: BarSeriesOption, baseId: string): void {
    const baseKey = this._baseKeyBySeriesId.get(baseId) ?? this._baseKeyFor(serie.stack);
    this._baseKeyBySeriesId.set(baseId, baseKey);
    const z = this._resolveZ(baseKey, serie.z);
    serie.z = z;
    serie.stack = `${baseKey}--compare`;
    this._ensurePlaceholder(baseKey, z, "compare");
  }

  /** Placeholder series, in the order their stacks first appeared. */
  public placeholders(): BarSeriesOption[] {
    return this._order
      .map((baseKey) => this._placeholderByBase.get(baseKey))
      .filter((item): item is BarSeriesOption => item !== undefined);
  }

  private _baseKeyFor(stack: string | undefined): string {
    const name = stack?.trim();
    if (name) {
      return name;
    }
    this._generatedStacks += 1;
    return `series-${this._generatedStacks}`;
  }

  private _resolveZ(baseKey: string, current: unknown): number {
    const candidate =
      typeof current === "number" && Number.isFinite(current)
        ? Math.max(current, BAR_Z_BASE)
        : BAR_Z_BASE;
    const resolved = Math.max(this._zByBase.get(baseKey) ?? candidate, candidate);
    this._zByBase.set(baseKey, resolved);
    return resolved;
  }

  private _ensurePlaceholder(
    baseKey: string,
    z: number,
    half: "current" | "compare"
  ): void {
    const placeholderZ = Math.max(z - 3, 0);
    const existing = this._placeholderByBase.get(baseKey);
    if (existing) {
      existing.stack = `${baseKey}--${half}`;
      existing.z = placeholderZ;
      return;
    }

    this._order.push(baseKey);
    this._placeholderByBase.set(baseKey, {
      id: `${baseKey}--placeholder`,
      type: "bar",
      stack: `${baseKey}--${half}`,
      data: [],
      silent: true,
      itemStyle: {
        color: "transparent",
        borderColor: "transparent",
        borderWidth: 0,
      },
      emphasis: { disabled: true },
      barMaxWidth: BAR_MAX_WIDTH,
      z: placeholderZ,
    });
  }
}
