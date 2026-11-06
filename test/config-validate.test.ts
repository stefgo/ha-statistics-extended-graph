/**
 * First tests of the card — the scaffold the suite grows from.
 *
 * `normalizeConfig` is the entry point of every dashboard: Lovelace calls it
 * from `setConfig()` on every keystroke in the editor. It is pure and needs no
 * DOM, which is what makes it the natural place to start testing.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { normalizeConfig } from "../src/config/validate";
import type { StatisticsExtendedGraphConfig } from "../src/config/types";

const config = (
  overrides: Partial<StatisticsExtendedGraphConfig> = {}
): StatisticsExtendedGraphConfig =>
  ({
    type: "custom:statistics-extended-graph",
    series: [{ statistic_id: "sensor.energy" }],
    ...overrides,
  }) as StatisticsExtendedGraphConfig;

describe("normalizeConfig", () => {
  beforeEach(() => {
    // The card reports problems through console.warn instead of throwing; the
    // tests only care that a config is accepted, not that it is quiet.
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "info").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("accepts a minimal configuration", () => {
    expect(() => normalizeConfig(config())).not.toThrow();
  });

  it("rejects a configuration without series", () => {
    expect(() => normalizeConfig(config({ series: [] }))).toThrow(
      /At least one series/
    );
    expect(() =>
      normalizeConfig(config({ series: undefined as never }))
    ).toThrow(/At least one series/);
  });

  it("warns about a series that has neither statistic_id nor calculation", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    normalizeConfig(config({ series: [{} as never] }));
    expect(warn.mock.calls.flat().join(" ")).toMatch(/neither statistic_id/);
  });

  it("warns about an unknown constant_per unit", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    normalizeConfig(
      config({
        series: [
          { calculation: { terms: [{ constant: 1, constant_per: "month" as never }] } },
        ],
      })
    );
    expect(warn.mock.calls.flat().join(" ")).toMatch(/unknown constant_per "month"/);
  });

  it("warns about constant_per on a statistic term", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    normalizeConfig(
      config({
        series: [
          {
            calculation: {
              terms: [{ statistic_id: "sensor.energy", constant_per: "day" }],
            },
          },
        ],
      })
    );
    expect(warn.mock.calls.flat().join(" ")).toMatch(/constant_per without a plain constant/);
  });

  it("accepts constant_per on a constant without warning", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    normalizeConfig(
      config({
        series: [{ calculation: { terms: [{ constant: 36.5, constant_per: "day" }] } }],
      })
    );
    expect(warn.mock.calls.flat().join(" ")).not.toMatch(/constant_per/);
  });
});
