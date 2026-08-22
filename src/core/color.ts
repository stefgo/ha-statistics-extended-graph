import type { ColorConfig } from "../config/types";
import type { LinearGradientColor } from "../types/echarts";
import { log } from "./logger";

export interface Rgb {
  r: number;
  g: number;
  b: number;
}

export const clampAlpha = (value: number): number =>
  Math.max(0, Math.min(1, Number.isFinite(value) ? value : 1));

interface ParsedColor extends Rgb {
  /** `1` for an opaque color; the literal's own alpha otherwise. */
  a: number;
}

/**
 * `rgb()` and `rgba()` in both the legacy comma form and the modern space form,
 * with percentages allowed for any channel: `rgb(255, 0, 0)`,
 * `rgb(255 0 0 / 50%)`, `rgb(100% 0% 0%)`.
 */
const RGB_PATTERN =
  /^rgba?\(\s*([\d.]+%?)[\s,]+([\d.]+%?)[\s,]+([\d.]+%?)(?:\s*[,/]\s*([\d.]+%?))?\s*\)$/i;

const channel = (raw: string): number =>
  raw.endsWith("%") ? (Number.parseFloat(raw) / 100) * 255 : Number(raw);

const alphaChannel = (raw: string | undefined): number => {
  if (raw === undefined) {
    return 1;
  }
  return clampAlpha(
    raw.endsWith("%") ? Number.parseFloat(raw) / 100 : Number(raw)
  );
};

const hexToParsed = (value: string): ParsedColor | null => {
  const hex = value.replace("#", "").trim();
  const short = hex.length === 3 || hex.length === 4;
  const long = hex.length === 6 || hex.length === 8;
  if (!short && !long) {
    return null;
  }

  const part = (index: number): number => {
    const raw = short
      ? hex[index].repeat(2)
      : hex.substring(index * 2, index * 2 + 2);
    return parseInt(raw, 16);
  };

  const hasAlpha = hex.length === 4 || hex.length === 8;
  const parsed = { r: part(0), g: part(1), b: part(2), a: hasAlpha ? part(3) / 255 : 1 };
  return Number.isNaN(parsed.r) || Number.isNaN(parsed.g) || Number.isNaN(parsed.b)
    ? null
    : parsed;
};

const rgbStringToParsed = (value: string): ParsedColor | null => {
  const match = value.match(RGB_PATTERN);
  if (!match) {
    return null;
  }
  const parsed = {
    r: channel(match[1]),
    g: channel(match[2]),
    b: channel(match[3]),
    a: alphaChannel(match[4]),
  };
  return Number.isFinite(parsed.r) && Number.isFinite(parsed.g) && Number.isFinite(parsed.b)
    ? parsed
    : null;
};

/** Lazily created; `null` once it is known that no canvas is available. */
let canvasContext: CanvasRenderingContext2D | null | undefined;

/**
 * Last resort for everything the patterns above do not cover: named colors,
 * `hsl()`, and whatever a theme resolves to on a modern browser - `oklch()`,
 * `color-mix()`. Assigning to `fillStyle` normalizes a color the browser
 * understands and is ignored for one it does not, so two different sentinels
 * before the same assignment tell the two apart.
 */
const normalizeThroughCanvas = (value: string): string | undefined => {
  if (canvasContext === undefined) {
    try {
      canvasContext = document.createElement("canvas").getContext("2d");
    } catch {
      canvasContext = null;
    }
  }
  if (!canvasContext) {
    return undefined;
  }

  try {
    canvasContext.fillStyle = "#000000";
    canvasContext.fillStyle = value;
    const first = String(canvasContext.fillStyle);
    canvasContext.fillStyle = "#ffffff";
    canvasContext.fillStyle = value;
    const second = String(canvasContext.fillStyle);
    return first === second ? first : undefined;
  } catch {
    return undefined;
  }
};

const CACHE_LIMIT = 256;
const parseCache = new Map<string, ParsedColor | null>();
const warned = new Set<string>();

/**
 * Parses any color literal into channels. Colors are resolved once per literal
 * and cached, because this runs per series on every redraw.
 */
const parseColorWithAlpha = (value: string): ParsedColor | null => {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const cached = parseCache.get(trimmed);
  if (cached !== undefined) {
    return cached;
  }

  let parsed = trimmed.startsWith("#")
    ? hexToParsed(trimmed)
    : rgbStringToParsed(trimmed);

  if (!parsed) {
    const normalized = normalizeThroughCanvas(trimmed);
    if (normalized) {
      parsed = normalized.startsWith("#")
        ? hexToParsed(normalized)
        : rgbStringToParsed(normalized);
    }
  }

  if (!parsed && !warned.has(trimmed)) {
    warned.add(trimmed);
    // Silence here would show up as an opacity option that quietly does
    // nothing, which is a good deal harder to find than a line in the console.
    log(
      "warn",
      `The color "${trimmed}" could not be read. Opacity and compare colors are left unchanged for it.`
    );
  }

  if (parseCache.size >= CACHE_LIMIT) {
    parseCache.clear();
  }
  parseCache.set(trimmed, parsed);
  return parsed;
};

export const parseColor = (value: string): Rgb | null => {
  const parsed = parseColorWithAlpha(value);
  return parsed ? { r: parsed.r, g: parsed.g, b: parsed.b } : null;
};

/**
 * Returns the alpha channel of a color literal, or `undefined` when the color
 * cannot be read at all. An opaque color reports `1`.
 */
export const extractAlpha = (color: unknown): number | undefined => {
  if (typeof color !== "string") {
    return undefined;
  }
  return parseColorWithAlpha(color)?.a;
};

export const applyAlpha = (color: string, alpha: number): string => {
  const rgb = parseColor(color);
  if (!rgb) {
    return color.trim();
  }
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${clampAlpha(alpha)})`;
};

export const stripAlpha = (color: string): string => {
  const rgb = parseColor(color);
  if (!rgb) {
    return color.trim();
  }
  return `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
};

/** Recolors `color` while keeping the alpha channel of an existing literal. */
export const colorWithAlpha = (
  color: string,
  alpha: number | undefined
): string => {
  if (alpha === undefined || alpha >= 1) {
    return color;
  }
  const rgb = parseColor(color);
  if (!rgb) {
    return color;
  }
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
};

/** Recolors every stop of an existing linear gradient, keeping its alphas. */
export const gradientWithColor = (
  color: string,
  gradient: unknown
): Record<string, unknown> | undefined => {
  if (!gradient || typeof gradient !== "object" || Array.isArray(gradient)) {
    return undefined;
  }
  const source = gradient as Record<string, unknown>;
  if (source.type !== "linear" || !Array.isArray(source.colorStops)) {
    return undefined;
  }
  return {
    ...source,
    colorStops: source.colorStops.map((stop) => {
      if (!stop || typeof stop !== "object" || Array.isArray(stop)) {
        return stop;
      }
      const colorStop = stop as Record<string, unknown>;
      return {
        ...colorStop,
        color: colorWithAlpha(color, extractAlpha(colorStop.color)),
      };
    }),
  };
};

/**
 * Picks the color for the active theme. A plain string applies to both themes;
 * the object form falls back from `dark` to `light`.
 */
export const resolveThemedColor = (
  value: ColorConfig | undefined,
  darkMode: boolean
): string | undefined => {
  const clean = (raw: unknown): string | undefined =>
    typeof raw === "string" && raw.trim() !== "" ? raw.trim() : undefined;

  const isObject = typeof value === "object" && value !== null;
  const light = isObject ? clean(value.light) : clean(value);
  const dark = isObject ? clean(value.dark) : undefined;

  return darkMode ? dark ?? light : light;
};

/**
 * Turns a configured color token into something ECharts understands. CSS custom
 * properties (`--energy-solar-color` or `var(--x)`) are resolved against the
 * card's computed style so theme changes are picked up.
 */
export const resolveColorToken = (
  raw: string,
  computedStyle: CSSStyleDeclaration
): string => {
  let token = raw.trim();
  if (!token) {
    return token;
  }
  if (token.startsWith("#") || token.startsWith("rgb")) {
    return token;
  }
  if (token.startsWith("var(") && token.endsWith(")")) {
    token = token.slice(4, -1).trim();
  }
  const resolved = computedStyle.getPropertyValue(token)?.trim();
  return resolved || token;
};

/**
 * Builds an area fill that fades towards the zero line, so positive and
 * negative parts of a signal both keep their strong edge away from zero.
 */
export const buildZeroAwareGradientFill = (
  color: string,
  strongAlpha: number,
  dataPoints: Array<[number, number | null]>
): LinearGradientColor => {
  let min = 0;
  let max = 0;

  dataPoints.forEach(([, value]) => {
    if (typeof value !== "number" || !Number.isFinite(value)) {
      return;
    }
    min = Math.min(min, value);
    max = Math.max(max, value);
  });

  const strongColor = applyAlpha(color, strongAlpha);
  const weakColor = applyAlpha(color, strongAlpha / 3);
  let colorStops: LinearGradientColor["colorStops"];

  if (max === 0 && min === 0) {
    colorStops = [
      { offset: 0, color: weakColor },
      { offset: 1, color: weakColor },
    ];
  } else if (min >= 0) {
    colorStops = [
      { offset: 0, color: strongColor },
      { offset: 1, color: weakColor },
    ];
  } else if (max <= 0) {
    colorStops = [
      { offset: 0, color: weakColor },
      { offset: 1, color: strongColor },
    ];
  } else {
    colorStops = [
      { offset: 0, color: strongColor },
      { offset: clampAlpha(max / (max - min)), color: weakColor },
      { offset: 1, color: strongColor },
    ];
  }

  return { type: "linear", x: 0, y: 0, x2: 0, y2: 1, colorStops, global: false };
};
