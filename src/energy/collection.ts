import type { HomeAssistant } from "custom-card-helpers";
import { log } from "../core/logger";

export interface EnergyDateRange {
  start: Date;
  end?: Date;
  startCompare?: Date;
  endCompare?: Date;
}

interface EnergyCollection {
  subscribe(callback: (data: EnergyDateRange) => void): () => void;
}

const POLL_INTERVAL_MS = 200;
const RETRY_INTERVAL_MS = 1000;
const MAX_ATTEMPTS = 50;

const getCollectionKey = (
  hass: HomeAssistant,
  collectionKey: string | undefined
): string => {
  if (collectionKey) {
    return `_${collectionKey}`;
  }
  // Home Assistant 2026.4 scopes the default collection per dashboard panel.
  return hass.config.version < "2026.4" ? "_energy" : `_energy_${hass.panelUrl}`;
};

const findCollection = (
  hass: HomeAssistant,
  key: string
): EnergyCollection | undefined => {
  const connection = hass.connection as unknown as Record<string, unknown>;
  const candidate = connection?.[key] as EnergyCollection | undefined;
  return candidate && typeof candidate.subscribe === "function"
    ? candidate
    : undefined;
};

/**
 * Binds to the `energy-date-selection` collection of the dashboard.
 *
 * The collection is created by the date picker card, which may render after
 * this card, so the binding retries for a while. When the picker never appears,
 * `onUnavailable` lets the caller fall back to a default range.
 */
export class EnergyCollectionBinding {
  private _unsubscribe?: () => void;
  private _pollHandle?: number;
  private _reportedUnavailable = false;

  constructor(
    private readonly _onData: (data: EnergyDateRange) => void,
    private readonly _onUnavailable: () => void
  ) {}

  public connect(hass: HomeAssistant, collectionKey?: string): void {
    this.disconnect();
    this._attach(hass, getCollectionKey(hass, collectionKey), 0);
  }

  public disconnect(): void {
    if (this._pollHandle) {
      window.clearTimeout(this._pollHandle);
      this._pollHandle = undefined;
    }
    if (this._unsubscribe) {
      this._unsubscribe();
      this._unsubscribe = undefined;
    }
    this._reportedUnavailable = false;
  }

  private _attach(hass: HomeAssistant, key: string, attempt: number): void {
    const collection = findCollection(hass, key);
    if (collection) {
      this._reportedUnavailable = false;
      this._unsubscribe = collection.subscribe((data) => this._onData(data));
      return;
    }

    if (attempt >= MAX_ATTEMPTS) {
      if (!this._reportedUnavailable) {
        this._reportedUnavailable = true;
        log(
          "warn",
          "No energy date selection found on this dashboard. Falling back to the default range."
        );
        this._onUnavailable();
      }
      this._pollHandle = window.setTimeout(
        () => this._attach(hass, key, MAX_ATTEMPTS),
        RETRY_INTERVAL_MS
      );
      return;
    }

    this._pollHandle = window.setTimeout(
      () => this._attach(hass, key, attempt + 1),
      POLL_INTERVAL_MS
    );
  }
}
