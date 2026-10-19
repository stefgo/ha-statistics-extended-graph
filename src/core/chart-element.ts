/**
 * Makes sure `<ha-chart-base>` exists before the card relies on it.
 *
 * Home Assistant does not define the element up front: it arrives with the
 * modules of its own chart cards, which Lovelace imports lazily the first time
 * such a card is created. On a dashboard without one - or with one that loads
 * later than this card - the chart stays an unknown, empty element. Whether it
 * is there in time then depends on load order and cache, which is why it shows
 * up as charts that only appear after a reload, most often in the mobile apps.
 *
 * The card therefore asks Lovelace for a `statistics-graph` card once. The
 * element is thrown away; creating it is only what makes Lovelace import the
 * module that defines `<ha-chart-base>`. Nothing here ever throws: if the
 * element cannot be loaded, the card behaves exactly as it did without this.
 */

import type { LovelaceCardConfig } from "custom-card-helpers";
import { withTimeout } from "./fetch-queue";
import { OnceLogger } from "./logger";

declare global {
  interface Window {
    loadCardHelpers?: () => Promise<CardHelpers>;
  }
}

/** The part of Lovelace's card helpers this module makes use of */
export interface CardHelpers {
  createCardElement(config: LovelaceCardConfig): unknown;
}

export interface ChartElementDeps {
  registry: Pick<CustomElementRegistry, "get" | "whenDefined">;
  loadCardHelpers?: () => Promise<CardHelpers | undefined>;
  timeoutMs?: number;
}

export const CHART_ELEMENT = "ha-chart-base";

/** The built-in card whose module brings `<ha-chart-base>` along. */
const LOADER_CONFIG: LovelaceCardConfig = { type: "statistics-graph", entities: [] };

/** Generous: on a cold start of a mobile app the frontend chunks load slowly. */
const DEFINE_TIMEOUT_MS = 10_000;

const logger = new OnceLogger();

/**
 * Loads `<ha-chart-base>` through Lovelace and resolves once it is defined.
 * Resolves `false` instead of rejecting when that is not possible.
 */
export const loadChartElement = async (deps: ChartElementDeps): Promise<boolean> => {
  if (deps.registry.get(CHART_ELEMENT)) {
    return true;
  }

  try {
    const helpers = await deps.loadCardHelpers?.();
    if (!helpers) {
      logger.warnOnce(
        "no-helpers",
        `Lovelace offers no card helpers; <${CHART_ELEMENT}> is left to load on its own.`
      );
      return false;
    }

    try {
      await helpers.createCardElement(LOADER_CONFIG);
    } catch (_error) {
      // The card's own configuration may be rejected; the import it triggers
      // has been started either way, and that is all the call is for.
    }

    await withTimeout(
      deps.registry.whenDefined(CHART_ELEMENT),
      deps.timeoutMs ?? DEFINE_TIMEOUT_MS,
      `Waiting for <${CHART_ELEMENT}>`
    );
    return true;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.warnOnce("failed", `Could not load <${CHART_ELEMENT}>: ${message}`);
    return false;
  }
};

let pending: Promise<boolean> | undefined;

/**
 * {@link loadChartElement} against the live page, shared by every card on it so
 * a dashboard full of them loads the element once. A failed attempt is not
 * kept: the next card that connects tries again.
 */
export const ensureChartElement = (): Promise<boolean> => {
  pending ??= loadChartElement({
    registry: customElements,
    loadCardHelpers: window.loadCardHelpers
      ? () => window.loadCardHelpers!()
      : undefined,
  }).then((ready) => {
    if (!ready) {
      pending = undefined;
    }
    return ready;
  });
  return pending;
};
