import type { ColorConfig } from "../config/types";
import type { LinearGradientColor } from "../types/echarts";

export interface Rgb {
  r: number;
  g: number;
  b: number;
}

export const clampAlpha = (value: number): number =>
  Math.max(0, Math.min(1, Number.isFinite(value) ? value : 1));

const hexToRgb = (value: string): Rgb | null => {
  const hex = value.replace("#", "").trim();
  if (hex.length === 3 || hex.length === 4) {
    return {
      r: parseInt(hex[0] + hex[0], 16),
      g: parseInt(hex[1] + hex[1], 16),
      b: parseInt(hex[2] + hex[2], 16),
    };
  }
  if (hex.length === 6 || hex.length === 8) {
    return {
      r: parseInt(hex.substring(0, 2), 16),
      g: parseInt(hex.substring(2, 4), 16),
      b: parseInt(hex.substring(4, 6), 16),
    };
  }
  return null;
};

const rgbStringToRgb = (value: string): Rgb | null => {
  const match = value
    .trim()
    .match(/rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*[\d.]+\s*)?\)/i);
  if (!match) {
    return null;
  }
  return { r: Number(match[1]), g: Number(match[2]), b: Number(match[3]) };
};

export const parseColor = (value: string): Rgb | null => {
  const trimmed = value.trim();
  if (trimmed.startsWith("#")) {
    return hexToRgb(trimmed);
  }
  if (trimmed.startsWith("rgb")) {
    return rgbStringToRgb(trimmed);
  }
  return null;
};

/** Returns the alpha channel of a color literal, or `undefined` when unknown. */
export const extractAlpha = (color: unknown): number | undefined => {
  if (typeof color !== "string") {
    return undefined;
  }
  const trimmed = color.trim();
  const rgbaMatch = trimmed.match(/rgba?\(([^)]+)\)/i);
  if (rgbaMatch) {
    const parts = rgbaMatch[1].split(",").map((part) => part.trim());
    if (parts.length === 4) {
      const alpha = Number(parts[3]);
      return Number.isFinite(alpha) ? alpha : undefined;
    }
    if (parts.length === 3) {
      return 1;
    }
  }
  if (trimmed.startsWith("#")) {
    const hex = trimmed.slice(1);
    if (hex.length === 8) {
      return parseInt(hex.slice(6, 8), 16) / 255;
    }
    if (hex.length === 4) {
      return parseInt(hex.slice(3, 4).repeat(2), 16) / 255;
    }
  }
  return undefined;
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
