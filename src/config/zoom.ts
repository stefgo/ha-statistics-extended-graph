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
