/**
 * `loadChartElement` makes Lovelace import `<ha-chart-base>` when no other card
 * has done so yet. The registry and the card helpers are handed in, so the
 * tests run without a DOM.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

import { CHART_ELEMENT, loadChartElement } from "../src/core/chart-element";
import type { CardHelpers } from "../src/core/chart-element";

/** A registry in which `define` resolves the pending `whenDefined` calls. */
const fakeRegistry = (defined = false) => {
  let resolve: () => void = () => {};
  const ready = new Promise<void>((r) => (resolve = r));
  const registry = {
    defined,
    get: vi.fn((name: string) =>
      registry.defined && name === CHART_ELEMENT ? class {} : undefined
    ),
    whenDefined: vi.fn(() => (registry.defined ? Promise.resolve() : ready)),
    define: () => {
      registry.defined = true;
      resolve();
    },
  };
  return registry;
};

describe("loadChartElement", () => {
  beforeEach(() => {
    // `withTimeout` schedules on `window`, which the Node environment lacks.
    vi.stubGlobal("window", globalThis);
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  it("does nothing when the element is already defined", async () => {
    const registry = fakeRegistry(true);
    const loadCardHelpers = vi.fn();

    await expect(
      loadChartElement({ registry: registry as never, loadCardHelpers })
    ).resolves.toBe(true);
    expect(loadCardHelpers).not.toHaveBeenCalled();
  });

  it("creates a statistics-graph card and waits for the definition", async () => {
    const registry = fakeRegistry();
    const helpers: CardHelpers = {
      createCardElement: vi.fn(() => {
        setTimeout(registry.define, 0);
        return {};
      }),
    };

    await expect(
      loadChartElement({
        registry: registry as never,
        loadCardHelpers: async () => helpers,
      })
    ).resolves.toBe(true);
    expect(helpers.createCardElement).toHaveBeenCalledWith(
      expect.objectContaining({ type: "statistics-graph" })
    );
  });

  it("still waits when creating the card throws", async () => {
    const registry = fakeRegistry();
    const helpers: CardHelpers = {
      createCardElement: () => {
        setTimeout(registry.define, 0);
        throw new Error("invalid config");
      },
    };

    await expect(
      loadChartElement({
        registry: registry as never,
        loadCardHelpers: async () => helpers,
      })
    ).resolves.toBe(true);
  });

  it("resolves false without card helpers", async () => {
    const registry = fakeRegistry();

    await expect(loadChartElement({ registry: registry as never })).resolves.toBe(
      false
    );
    await expect(
      loadChartElement({
        registry: registry as never,
        loadCardHelpers: () => Promise.reject(new Error("unavailable")),
      })
    ).resolves.toBe(false);
  });

  it("resolves false when the element never arrives", async () => {
    const registry = fakeRegistry();

    await expect(
      loadChartElement({
        registry: registry as never,
        loadCardHelpers: async () => ({ createCardElement: () => ({}) }),
        timeoutMs: 10,
      })
    ).resolves.toBe(false);
  });
});
