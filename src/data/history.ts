import type { HomeAssistant } from "custom-card-helpers";
import { log } from "../core/logger";
import type { Statistics, StatisticValue } from "./statistics";

interface EntityHistoryState {
  s: string;
  a?: Record<string, unknown>;
  lc?: number;
  lu: number;
}

export type HistoryStates = Record<string, EntityHistoryState[]>;

export interface HistoryStreamMessage {
  states: HistoryStates;
  start_time?: number;
  end_time?: number;
}

export interface RawHistoryRequestOptions {
  significant_changes_only?: boolean;
}

/** Binary-ish states that are rendered as 1/0 so they can be charted. */
const BINARY_STATE_MAP: Record<string, number> = {
  on: 1,
  open: 1,
  opening: 1,
  true: 1,
  off: 0,
  closed: 0,
  closing: 0,
  false: 0,
};

const EMPTY_STATES = new Set(["", "unknown", "unavailable"]);

const normalizeTimestamp = (value?: number): number | undefined =>
  typeof value === "number" ? Math.round(value * 1000) : undefined;

const normalizeStateValue = (raw: string): number | null => {
  const key = raw.trim().toLowerCase();
  if (key in BINARY_STATE_MAP) {
    return BINARY_STATE_MAP[key];
  }
  if (EMPTY_STATES.has(key)) {
    return null;
  }
  const numeric = Number(raw);
  return Number.isFinite(numeric) ? numeric : null;
};

export const fetchRawHistoryStates = (
  hass: HomeAssistant,
  startTime: Date,
  endTime: Date | undefined,
  entityIds: string[],
  options?: RawHistoryRequestOptions
): Promise<HistoryStates> => {
  const payload: { type: string } & Record<string, unknown> = {
    type: "history/history_during_period",
    start_time: startTime.toISOString(),
    minimal_response: true,
    no_attributes: true,
  };
  if (endTime) {
    payload.end_time = endTime.toISOString();
  }
  if (options?.significant_changes_only !== undefined) {
    payload.significant_changes_only = options.significant_changes_only;
  }
  if (entityIds.length) {
    payload.entity_ids = entityIds;
  }
  return hass.callWS<HistoryStates>(payload);
};

export const subscribeRawHistoryStream = (
  hass: HomeAssistant,
  startTime: Date,
  entityIds: string[],
  onMessage: (message: HistoryStreamMessage) => void,
  options?: RawHistoryRequestOptions
) => {
  const params: { type: string } & Record<string, unknown> = {
    type: "history/stream",
    entity_ids: entityIds,
    start_time: startTime.toISOString(),
    minimal_response: true,
    no_attributes: true,
  };
  if (options?.significant_changes_only !== undefined) {
    params.significant_changes_only = options.significant_changes_only;
  }
  return hass.connection.subscribeMessage<HistoryStreamMessage>(
    onMessage,
    params
  );
};

/**
 * Projects recorder history states onto the statistics shape so the rest of the
 * card can treat raw history exactly like an aggregated series.
 */
export const historyStatesToStatistics = (
  history: HistoryStates
): Statistics => {
  const statistics: Statistics = {};

  Object.entries(history).forEach(([entityId, states]) => {
    if (!Array.isArray(states) || !states.length) {
      statistics[entityId] = [];
      return;
    }

    const sorted = [...states].sort(
      (a, b) => (a.lc ?? a.lu ?? 0) - (b.lc ?? b.lu ?? 0)
    );
    const warned = new Set<string>();

    statistics[entityId] = sorted.map((entry) => {
      const timestamp = normalizeTimestamp(entry.lc ?? entry.lu) ?? Date.now();
      const numeric = normalizeStateValue(entry.s);
      const normalizedState = entry.s.trim().toLowerCase();

      if (
        numeric === null &&
        !EMPTY_STATES.has(normalizedState) &&
        !warned.has(normalizedState)
      ) {
        warned.add(normalizedState);
        log(
          "warn",
          `Raw history for "${entityId}" contains the non-numeric state "${entry.s}". It is rendered as a gap.`
        );
      }

      const value: StatisticValue = {
        start: timestamp,
        end: timestamp,
        change: numeric,
        sum: numeric,
        mean: numeric,
        min: numeric,
        max: numeric,
        state: numeric,
      };
      return value;
    });
  });

  return statistics;
};
