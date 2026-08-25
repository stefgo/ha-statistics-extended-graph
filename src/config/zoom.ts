import type { ZoomConfig } from "./types";

/**
 * Normalizes the shorthand `zoom: true` into a full configuration. Lives next
 * to the types because both the chart and the data controller need it - the
 * controller reads `refine`, the chart everything else.
 */
export const resolveZoom = (
  config: boolean | ZoomConfig | undefined
): ZoomConfig | undefined => {
  if (config === undefined || config === false) {
    return undefined;
  }
  return config === true ? {} : config;
};

/** True when the zoom should load high resolution data for its window. */
export const refinesOnZoom = (
  config: boolean | ZoomConfig | undefined
): boolean => resolveZoom(config)?.refine === true;

/** True when the slider only appears while a zoom window exists. */
export const slidesInOnZoom = (
  config: boolean | ZoomConfig | undefined
): boolean => resolveZoom(config)?.type === "auto";

/**
 * True when the card has to follow the zoom window instead of leaving the
 * zoom to the chart: `refine` turns the window into a fetch, `auto` into the
 * slider's visibility.
 */
export const tracksZoomWindow = (
  config: boolean | ZoomConfig | undefined
): boolean => {
  const zoom = resolveZoom(config);
  return zoom !== undefined && (zoom.refine === true || zoom.type === "auto");
};
