import type { HomeAssistant } from "custom-card-helpers";
import type { UnsubscribeFunc } from "home-assistant-js-websocket";
import { startOfHour } from "date-fns";
import type {
  AggregationTarget,
  StatisticsExtendedGraphConfig,
  SeriesConfig,
} from "../config/types";
import {
  fetchStatistics,
  fetchStatisticsMetadata,
  maxStatisticsEnd,
  mergeStatistics,
  statisticsHaveData,
  trimStatisticsToRange,
  type Statistics,
  type StatisticsMetaData,
  type StatisticsMetaDataMap,
  type StatisticValue,
} from "../data/statistics";
import {
  fetchRawHistoryStates,
  historyStatesToStatistics,
  subscribeRawHistoryStream,
} from "../data/history";
import {
  applyLiveHourPatch,
  buildLiveHourPatch,
  computeLiveHourWindow,
} from "../data/live-hour";
import { EnergyCollectionBinding } from "../energy/collection";
import { resolveAggregationPlan } from "../time/aggregation";
import type { ZoomWindow } from "../time/aggregation";
import { refinesOnZoom } from "../config/zoom";
import { covers, detailPlanLadder, planDetailRange } from "../time/detail";
import type { DetailPlan } from "../time/detail";
import { getNextRefreshTime } from "../time/refresh";
import {
  DEFAULT_TIMESPAN,
  isRollingTimespan,
  resolveTimespan,
  todayRange,
  type TimeRange,
} from "../time/timespan";
import { evaluateCalculation } from "../series/calculation";
import {
  calculationKey,
  getSeriesSource,
  getStatisticId,
  DEFAULT_STAT_TYPE,
} from "../series/model";
import {
  getSeriesTimeOffset,
  shiftDate,
  shiftStatisticValues,
  type NormalizedTimeOffset,
} from "../series/time-offset";
import { FetchQueue, TimeoutError, withTimeout } from "./fetch-queue";
import { log, OnceLogger } from "./logger";
import type { LogLevel } from "./logger";

const FETCH_TIMEOUT_MS = 60_000;
const RAW_DELTA_OVERLAP_MS = 60_000;
const VISIBILITY_RESUME_DELAY_MS = 200;
const LIVE_HOUR_MIN_DELAY_MS = 30_000;
/**
 * Backoff for a load that failed outright. Without it the next attempt would
 * be the regular refresh, which for hourly data is up to an hour away - far
 * too long to sit on a blank card because of one websocket hiccup.
 */
const RETRY_DELAYS_MS = [5_000, 15_000, 60_000];

type FetchKey = "main" | "compare" | "live" | "detail";

interface RangeState {
  start: number;
  end: number | null;
}

interface TargetState {
  statistics?: Statistics;
  metadata: StatisticsMetaDataMap;
  calculated: Map<string, StatisticValue[]>;
  range?: RangeState;
  aggregation?: AggregationTarget;
  lastRawEnd?: number;
}

/**
 * High resolution data for the zoom window, loaded next to the full range.
 * It replaces the regular data while the window lies inside {@link range} -
 * outside of it the coarse data is still on screen, so leaving the detail
 * behind is instant and the reload only sharpens the picture again.
 */
export interface DetailState {
  range: RangeState;
  compareRange?: RangeState;
  /**
   * The interval the data actually came back at. It can be coarser than
   * {@link requested} when the recorder has already purged the finer one.
   */
  aggregation: AggregationTarget;
  /** The interval the window asked for; what a repeated plan is matched on. */
  requested: AggregationTarget;
  main: TargetState;
  compare: TargetState;
  shiftedStatistics: Map<number, StatisticValue[]>;
  shiftedMetadata: Map<number, StatisticsMetaData | undefined>;
  shiftedCalculated: Map<string, StatisticValue[]>;
}

/** Everything the card needs in order to draw one frame. */
export interface GraphSnapshot {
  loading: boolean;
  aggregationDisabled: boolean;
  periodStart?: Date;
  periodEnd?: Date;
  comparePeriodStart?: Date;
  comparePeriodEnd?: Date;
  main: TargetState;
  compare: TargetState;
  /** Time-offset series data, keyed by the index in `config.series`. */
  shiftedStatistics: Map<number, StatisticValue[]>;
  shiftedMetadata: Map<number, StatisticsMetaData | undefined>;
  shiftedCalculated: Map<string, StatisticValue[]>;
  /** Present while a zoom window is backed by higher resolution data. */
  detail?: DetailState;
  /** True while the detail layer of the current zoom window is being loaded. */
  detailLoading: boolean;
}

const emptyTargetState = (): TargetState => ({
  metadata: {},
  calculated: new Map(),
});

interface ShiftedSeriesData {
  statistics: Map<number, StatisticValue[]>;
  metadata: Map<number, StatisticsMetaData | undefined>;
  calculated: Map<string, StatisticValue[]>;
}

interface ShiftedFetchGroup {
  key: string;
  sourceStart: Date;
  sourceEnd?: Date;
  offset: NormalizedTimeOffset;
  statisticSeries: Array<{ index: number; statisticId: string }>;
  calculationSeries: Array<{ index: number; series: SeriesConfig }>;
}

/**
 * Owns all data acquisition for the card: it resolves the visible range, keeps
 * it in sync with the energy date picker, loads statistics or raw history at
 * the right aggregation, evaluates calculation series and keeps everything
 * refreshed. The card itself only renders the resulting snapshot.
 */
export class GraphDataController {
  private _hass?: HomeAssistant;
  private _config?: StatisticsExtendedGraphConfig;

  private _periodStart?: Date;
  private _periodEnd?: Date;
  private _comparePeriodStart?: Date;
  private _comparePeriodEnd?: Date;
  private _energyRange?: TimeRange;
  private _energyCompareRange?: TimeRange;
  private _energyFallbackActive = false;
  /** Zoomed-in part of the visible range; drives the detail layer. */
  private _zoomWindow?: ZoomWindow;
  private _detail?: DetailState;
  private _detailGeneration = 0;
  private _detailLoading = false;
  /**
   * The load that owns {@link _detailLoading}. A response only clears the flag
   * while it is still the newest one; a load that was superseded leaves it to
   * the load that replaced it.
   */
  private _detailLoadingGeneration = 0;
  /**
   * The detail plan that came back without data. The recorder keeps short-term
   * statistics for a few days only, so a window in the past has a floor - and
   * without this it would be requested again on every zoom event.
   */
  private _detailMiss?: { start: number; end: number; aggregation: AggregationTarget };

  private _main: TargetState = emptyTargetState();
  private _compare: TargetState = emptyTargetState();
  private _shiftedStatistics = new Map<number, StatisticValue[]>();
  private _shiftedMetadata = new Map<number, StatisticsMetaData | undefined>();
  private _shiftedCalculated = new Map<string, StatisticValue[]>();

  private _statisticIds: string[] = [];
  private _statTypes: string[] = [];
  private _isLoading = false;
  /** Per-target request counter; only the newest response may write state. */
  private _generations: Record<"main" | "compare", number> = { main: 0, compare: 0 };
  /** Consecutive failures per target, which pick the backoff delay. */
  private _failures: Record<"main" | "compare", number> = { main: 0, compare: 0 };

  private _rawStreamUnsub?: Promise<UnsubscribeFunc | void>;
  private _autoRefreshTimeout?: number;
  private _liveHourTimeout?: number;
  private _visibilityResumeTimeout?: number;
  private _connected = false;
  private _visible =
    typeof document === "undefined" || document.visibilityState !== "hidden";

  private readonly _logger = new OnceLogger();
  private readonly _queue: FetchQueue<FetchKey>;
  private readonly _energyBinding: EnergyCollectionBinding;

  constructor(private readonly _onChange: () => void) {
    this._queue = new FetchQueue<FetchKey>(
      () => this._connected && this._visible,
      (key) => this._runFetch(key)
    );
    this._energyBinding = new EnergyCollectionBinding(
      (data) => this._onEnergyRange(data),
      () => this._onEnergyUnavailable()
    );
  }

  // ---------------------------------------------------------------- lifecycle

  public connect(): void {
    if (this._connected) {
      return;
    }
    // Statistics survive a detach, but the queue, every timer and the raw
    // stream do not - they are only ever (re)armed at the end of a load.
    // `_sync` schedules nothing when neither range nor series changed, so a
    // re-attached card would sit on frozen data forever. Loading once puts all
    // of that back in place, and refreshes what went stale while detached.
    const reattached = !!this._main.statistics;

    this._connected = true;
    if (typeof document !== "undefined") {
      document.addEventListener("visibilitychange", this._handleVisibilityChange);
      this._visible = document.visibilityState !== "hidden";
    }
    this._sync();

    if (reattached) {
      this._queue.schedule("main");
      if (this._comparePeriodStart) {
        this._queue.schedule("compare");
      }
    }
  }

  public disconnect(): void {
    this._connected = false;
    if (typeof document !== "undefined") {
      document.removeEventListener("visibilitychange", this._handleVisibilityChange);
    }
    this._energyBinding.disconnect();
    this._queue.dispose();
    this._detailLoading = false;
    this._clearTimer("_autoRefreshTimeout");
    this._clearTimer("_liveHourTimeout");
    this._clearTimer("_visibilityResumeTimeout");
    void this._teardownRawStream();
  }

  public setHass(hass: HomeAssistant): void {
    const first = !this._hass;
    this._hass = hass;
    if (first && this._connected) {
      this._sync();
    }
  }

  public setConfig(config: StatisticsExtendedGraphConfig): void {
    const previous = this._config;
    this._config = config;
    this._logger.reset();

    if (previous && !config.aggregation?.compute_current_hour) {
      this._clearTimer("_liveHourTimeout");
    }
    if (this._connected) {
      this._sync(previous);
    }
  }

  /**
   * Reports the part of the range the user zoomed into. With
   * `zoom.refine` the detail layer follows it: a window that deserves a
   * finer interval than the loaded one is loaded separately at that interval.
   * `null` clears the window again.
   */
  public setZoomWindow(window: ZoomWindow | null): void {
    const next = window ?? undefined;
    if (
      next?.start === this._zoomWindow?.start &&
      next?.end === this._zoomWindow?.end
    ) {
      return;
    }
    this._zoomWindow = next;

    if (!this._connected || !this._periodStart || !this._refinesOnZoom) {
      return;
    }
    this._syncDetail();
  }

  public get snapshot(): GraphSnapshot {
    return {
      loading: this._isLoading,
      aggregationDisabled: this._main.aggregation === "disabled",
      periodStart: this._periodStart,
      periodEnd: this._periodEnd,
      comparePeriodStart: this._comparePeriodStart,
      comparePeriodEnd: this._comparePeriodEnd,
      main: this._main,
      compare: this._compare,
      shiftedStatistics: this._shiftedStatistics,
      shiftedMetadata: this._shiftedMetadata,
      shiftedCalculated: this._shiftedCalculated,
      detail: this._detail,
      detailLoading: this._detailLoading,
    };
  }

  // ------------------------------------------------------------ configuration

  private get _timespan() {
    return this._config?.timespan ?? DEFAULT_TIMESPAN;
  }

  private get _usesEnergyPicker(): boolean {
    return this._timespan.mode === "energy";
  }

  private get _refinesOnZoom(): boolean {
    return refinesOnZoom(this._config?.zoom);
  }

  private _hasTimeOffsets(config = this._config): boolean {
    return Boolean(config?.series.some((series) => getSeriesTimeOffset(series)));
  }

  /** Compare is only available through the energy date picker's compare toggle. */
  private _shouldUseCompare(): boolean {
    if (!this._usesEnergyPicker || !this._config) {
      return false;
    }
    if (this._hasTimeOffsets()) {
      return false;
    }
    return this._config.allow_compare !== false;
  }

  private _sync(previousConfig?: StatisticsExtendedGraphConfig): void {
    if (!this._hass || !this._config) {
      return;
    }

    const needsPicker = this._usesEnergyPicker;
    const modeChanged = previousConfig?.timespan?.mode !== this._timespan.mode;
    const keyChanged =
      previousConfig?.collection_key !== this._config.collection_key;

    if (needsPicker && (modeChanged || keyChanged || !previousConfig)) {
      this._energyBinding.connect(this._hass, this._config.collection_key);
    } else if (!needsPicker && previousConfig?.timespan?.mode === "energy") {
      this._energyBinding.disconnect();
      this._energyRange = undefined;
      this._energyCompareRange = undefined;
    }

    if (!this._shouldUseCompare()) {
      this._clearCompare();
    }

    const periodChanged = this._recalculatePeriod();
    const compareChanged = this._recalculateComparePeriod();
    const seriesChanged =
      !!previousConfig &&
      JSON.stringify(previousConfig.series) !== JSON.stringify(this._config.series);

    if (periodChanged || seriesChanged) {
      void this._teardownRawStream();
      this._clearShifted();
      this._detailMiss = undefined;
      this._clearDetail();
    }

    if (periodChanged || seriesChanged || !this._main.statistics) {
      this._queue.schedule("main");
    }
    if (
      this._comparePeriodStart &&
      (compareChanged || seriesChanged || !this._compare.statistics)
    ) {
      this._queue.schedule("compare");
    }
  }

  // ------------------------------------------------------------------ periods

  private _onEnergyRange(data: {
    start: Date;
    end?: Date;
    startCompare?: Date;
    endCompare?: Date;
  }): void {
    this._energyFallbackActive = false;
    this._energyRange = { start: data.start, end: data.end };

    if (this._shouldUseCompare() && data.startCompare) {
      this._energyCompareRange = {
        start: data.startCompare,
        end: data.endCompare,
      };
    } else {
      this._energyCompareRange = undefined;
    }

    const periodChanged = this._recalculatePeriod();
    const compareChanged = this._recalculateComparePeriod();

    if (periodChanged || !this._main.statistics) {
      this._queue.schedule("main");
    }
    if (
      this._comparePeriodStart &&
      (compareChanged || !this._compare.statistics)
    ) {
      this._queue.schedule("compare");
    }
  }

  private _onEnergyUnavailable(): void {
    this._energyFallbackActive = true;
    if (this._recalculatePeriod() || !this._main.statistics) {
      this._queue.schedule("main");
    }
  }

  private _resolveRange(): TimeRange | undefined {
    const energyRange =
      this._energyRange ?? (this._energyFallbackActive ? todayRange() : undefined);
    try {
      return resolveTimespan(this._timespan, energyRange);
    } catch (error) {
      log("error", "Invalid timespan configuration", {
        error: error instanceof Error ? error.message : error,
      });
      return undefined;
    }
  }

  private _recalculatePeriod(): boolean {
    const resolved = this._resolveRange();
    if (!resolved) {
      return false;
    }
    const changed =
      this._periodStart?.getTime() !== resolved.start.getTime() ||
      this._periodEnd?.getTime() !== resolved.end?.getTime();

    if (changed) {
      this._periodStart = resolved.start;
      this._periodEnd = resolved.end;
      // The window described a range the card has left; the next zoom reports
      // a new one, and until then the interval follows the full range again.
      // The detail goes with it: its range is absolute, so an overlapping new
      // period would otherwise keep looking covered and leave the old layer -
      // and with it the old compare shift - on screen.
      this._zoomWindow = undefined;
      this._detailMiss = undefined;
      this._clearDetail();
      this._main.lastRawEnd = undefined;
      // A new range is a fresh start, not a continuation of a failing one.
      this._failures.main = 0;
    }
    return changed;
  }

  private _recalculateComparePeriod(): boolean {
    const range = this._shouldUseCompare() ? this._energyCompareRange : undefined;

    if (!range) {
      if (this._comparePeriodStart || this._comparePeriodEnd) {
        this._clearCompare();
        return true;
      }
      return false;
    }

    const changed =
      this._comparePeriodStart?.getTime() !== range.start.getTime() ||
      this._comparePeriodEnd?.getTime() !== range.end?.getTime();

    if (changed) {
      this._comparePeriodStart = range.start;
      this._comparePeriodEnd = range.end;
      this._compare = emptyTargetState();
      // The detail layer carries a compare set of its own, mapped by the shift
      // between the two periods. A new compare period invalidates that shift.
      this._clearDetail();
      this._failures.compare = 0;
    }
    return changed;
  }

  private _clearCompare(): void {
    this._comparePeriodStart = undefined;
    this._comparePeriodEnd = undefined;
    this._compare = emptyTargetState();
  }

  private _clearShifted(): void {
    this._shiftedStatistics = new Map();
    this._shiftedMetadata = new Map();
    this._shiftedCalculated = new Map();
  }

  // ------------------------------------------------------------------ loading

  private _collectStatisticRequests(): {
    ids: string[];
    types: string[];
  } {
    const ids = new Set<string>();
    const types = new Set<string>();

    this._config?.series.forEach((series) => {
      const defaultStatType = series.stat_type ?? DEFAULT_STAT_TYPE;
      if (getSeriesTimeOffset(series)) {
        // Loaded separately from a shifted source range.
        return;
      }
      if (getSeriesSource(series) === "statistic") {
        const id = getStatisticId(series);
        if (id) {
          ids.add(id);
          types.add(defaultStatType);
        }
        return;
      }
      series.calculation?.terms?.forEach((term) => {
        const id = term.statistic_id?.trim();
        if (id) {
          ids.add(id);
          types.add(term.stat_type ?? defaultStatType);
        }
      });
    });

    return {
      ids: Array.from(ids),
      types: types.size ? Array.from(types) : [DEFAULT_STAT_TYPE],
    };
  }

  /**
   * Whether a response may still write state. A newer request supersedes an
   * older one, and a detached card must not be revived by a late answer: every
   * `await` in a load is a point at which the card can have gone away, and the
   * tail of a load arms timers and the raw stream that nobody would clean up.
   */
  private _isCurrent(target: "main" | "compare", generation: number): boolean {
    return this._connected && generation === this._generations[target];
  }

  private async _runFetch(key: FetchKey): Promise<void> {
    if (key === "live") {
      await this._loadLiveHour();
      return;
    }
    if (key === "detail") {
      await this._loadDetail();
      return;
    }
    await this._loadStatistics(key === "compare");
  }

  private async _loadStatistics(isCompare: boolean): Promise<void> {
    const hass = this._hass;
    const config = this._config;
    const periodStart = isCompare ? this._comparePeriodStart : this._periodStart;
    const periodEnd = isCompare ? this._comparePeriodEnd : this._periodEnd;

    if (!hass || !config || !periodStart || !this._visible) {
      return;
    }

    const target = isCompare ? this._compare : this._main;
    const range: RangeState = {
      start: periodStart.getTime(),
      end: periodEnd?.getTime() ?? null,
    };

    const { ids, types } = this._collectStatisticRequests();
    if (!isCompare) {
      this._statisticIds = ids;
      this._statTypes = types;
    }

    const plan = resolveAggregationPlan(
      periodStart,
      periodEnd,
      config.aggregation,
      this._usesEnergyPicker,
      this._logger
    );

    const targetKey = isCompare ? "compare" : "main";

    if (plan[0] === "disabled") {
      this._generations[targetKey] += 1;
      this._applyDisabled(isCompare, range);
      return;
    }

    const generation = ++this._generations[targetKey];
    const showLoader = !isCompare && !this._main.statistics;
    if (showLoader) {
      this._isLoading = true;
      this._onChange();
    }

    try {
      const metadata = await this._loadMetadata(hass, ids);
      const result = await this._fetchWithPlan(
        hass,
        plan,
        periodStart,
        periodEnd,
        ids,
        types,
        isCompare,
        range
      );

      if (!this._isCurrent(targetKey, generation)) {
        return;
      }

      // Every request threw. The recorder did not say "no data" - it said
      // nothing at all, so the last good data stays on screen and the load is
      // retried rather than the card going blank until the next refresh.
      if (result.failed) {
        this._scheduleRetry(targetKey);
        return;
      }
      this._failures[targetKey] = 0;

      target.metadata = metadata;
      target.range = range;
      target.aggregation = result.aggregation;

      if (result.aggregation === "raw") {
        const merged =
          result.incremental && target.statistics
            ? mergeStatistics(target.statistics, result.statistics)
            : result.statistics;
        target.statistics = trimStatisticsToRange(merged, range.start, range.end);
        target.lastRawEnd = maxStatisticsEnd(target.statistics);
      } else {
        target.statistics = result.statistics;
        target.lastRawEnd = undefined;
      }

      this._rebuildCalculations(isCompare);

      if (!isCompare) {
        if (result.aggregation === "raw") {
          void this._restartRawStream();
        } else {
          void this._teardownRawStream();
        }
        await this._loadShiftedSeries(periodStart, periodEnd, generation);
        if (!this._isCurrent("main", generation)) {
          return;
        }
        this._scheduleAutoRefresh();
        this._scheduleLiveHour();
        if (this._refinesOnZoom && this._zoomWindow) {
          this._queue.schedule("detail");
        }
      }
    } catch (error) {
      if (this._isCurrent(targetKey, generation)) {
        log("error", "Failed to load statistics", {
          compare: isCompare,
          error: error instanceof Error ? error.message : error,
        });
        // Whatever is on screen is older than intended but still real data,
        // which beats an empty card. It is replaced once a load succeeds.
        this._scheduleRetry(targetKey);
      }
    } finally {
      if (generation === this._generations[targetKey] && showLoader) {
        this._isLoading = false;
      }
      if (this._connected) {
        this._onChange();
      }
    }
  }

  /** Re-runs a failed load, backing off over consecutive failures. */
  private _scheduleRetry(target: "main" | "compare"): void {
    const attempt = Math.min(this._failures[target], RETRY_DELAYS_MS.length - 1);
    this._failures[target] = this._failures[target] + 1;
    this._queue.schedule(target, RETRY_DELAYS_MS[attempt]);
  }

  private _applyDisabled(isCompare: boolean, range: RangeState): void {
    const target = emptyTargetState();
    target.range = range;
    target.aggregation = "disabled";

    if (isCompare) {
      this._compare = target;
    } else {
      this._main = target;
      this._clearShifted();
      this._clearTimer("_autoRefreshTimeout");
      this._clearTimer("_liveHourTimeout");
    }
    this._isLoading = false;
    this._onChange();
  }

  private async _loadMetadata(
    hass: HomeAssistant,
    ids: string[]
  ): Promise<StatisticsMetaDataMap> {
    if (!ids.length) {
      return {};
    }
    try {
      const entries = await withTimeout(
        fetchStatisticsMetadata(hass, ids),
        FETCH_TIMEOUT_MS,
        "getStatisticsMetadata"
      );
      const metadata: StatisticsMetaDataMap = {};
      entries.forEach((item) => {
        metadata[item.statistic_id] = item;
      });
      return metadata;
    } catch (error) {
      if (!(error instanceof TimeoutError)) {
        log("warn", "Failed to load statistics metadata", {
          error: error instanceof Error ? error.message : error,
        });
      }
      return {};
    }
  }

  /**
   * Walks the aggregation plan until one interval returns data. Every step is
   * tried once; the last attempted interval is reported even when it was empty.
   *
   * `failed` separates the two ways this can come back without data: the
   * recorder genuinely has none for the range, or every request threw. Only the
   * caller can act on that difference, and it must - overwriting good data with
   * the empty result of a failed request is what blanks the card.
   */
  private async _fetchWithPlan(
    hass: HomeAssistant,
    plan: AggregationTarget[],
    start: Date,
    end: Date | undefined,
    ids: string[],
    types: string[],
    isCompare: boolean,
    range: RangeState,
    stepLevel: LogLevel = "warn"
  ): Promise<{
    statistics: Statistics;
    aggregation: AggregationTarget;
    incremental: boolean;
    failed: boolean;
  }> {
    if (!ids.length) {
      return {
        statistics: {},
        aggregation: plan[0],
        incremental: false,
        failed: false,
      };
    }

    let statistics: Statistics = {};
    let lastAggregation: AggregationTarget = plan[0];
    let incremental = false;
    let attempts = 0;
    let errors = 0;

    for (let idx = 0; idx < plan.length; idx++) {
      const aggregation = plan[idx];
      lastAggregation = aggregation;
      if (aggregation === "disabled") {
        return {
          statistics: {},
          aggregation,
          incremental: false,
          failed: false,
        };
      }

      attempts += 1;

      try {
        if (aggregation === "raw") {
          const target = isCompare ? this._compare : this._main;
          const lastEnd = target.lastRawEnd;
          const from =
            lastEnd !== undefined && (range.end === null || lastEnd < range.end)
              ? new Date(Math.max(start.getTime(), lastEnd - RAW_DELTA_OVERLAP_MS))
              : start;
          incremental = from !== start;
          statistics = await this._fetchRawStatistics(hass, from, end, ids);
        } else {
          statistics = await withTimeout(
            fetchStatistics(hass, start, end, ids, aggregation, types),
            FETCH_TIMEOUT_MS,
            `fetchStatistics:${aggregation}`
          );
          incremental = false;
        }

        if (statisticsHaveData(statistics, ids)) {
          return { statistics, aggregation, incremental, failed: false };
        }
        if (idx < plan.length - 1) {
          log(
            stepLevel,
            `Aggregation "${aggregation}" returned no data. Trying "${plan[idx + 1]}".`
          );
        }
      } catch (error) {
        errors += 1;
        log("error", `Failed to load statistics for aggregation "${aggregation}"`, {
          error: error instanceof Error ? error.message : error,
        });
      }
    }

    return {
      statistics,
      aggregation: lastAggregation,
      incremental,
      failed: attempts > 0 && errors === attempts,
    };
  }

  private async _fetchRawStatistics(
    hass: HomeAssistant,
    start: Date,
    end: Date | undefined,
    ids: string[]
  ): Promise<Statistics> {
    // Query slightly beyond the visible range so lines reach both edges.
    const buffer = end
      ? Math.max(60_000, (end.getTime() - start.getTime()) * 0.1)
      : 60_000;
    const queryStart = new Date(start.getTime() - buffer);
    const queryEnd = end ? new Date(end.getTime() + buffer) : undefined;

    const history = await withTimeout(
      fetchRawHistoryStates(
        hass,
        queryStart,
        queryEnd,
        ids,
        this._config?.aggregation?.raw_options
      ),
      FETCH_TIMEOUT_MS,
      "fetchRawHistoryStates"
    );
    return historyStatesToStatistics(history);
  }

  // -------------------------------------------------------------- detail layer

  /** The detail the current zoom window asks for, if it asks for any. */
  private _detailPlan(): DetailPlan | undefined {
    if (!this._refinesOnZoom || !this._periodStart) {
      return undefined;
    }
    return planDetailRange(
      { start: this._periodStart, end: this._periodEnd },
      this._zoomWindow,
      this._main.aggregation
    );
  }

  private _detailIsCurrent(plan: DetailPlan): boolean {
    return (
      !!this._detail &&
      !!this._zoomWindow &&
      // Matched on the request: a plan that fell back to a coarser interval
      // would otherwise never look satisfied and reload on every gesture.
      this._detail.requested === plan.aggregation &&
      covers(this._detail.range, this._zoomWindow)
    );
  }

  /** True while the plan asks for data an earlier attempt proved absent. */
  private _detailIsKnownMiss(plan: DetailPlan): boolean {
    const miss = this._detailMiss;
    return (
      !!miss &&
      miss.aggregation === plan.aggregation &&
      plan.start.getTime() >= miss.start &&
      plan.end.getTime() <= miss.end
    );
  }

  private _isCurrentDetail(generation: number): boolean {
    return this._connected && generation === this._detailGeneration;
  }

  /**
   * Drops the detail layer. The generation is always bumped, so a load that is
   * still in flight for the window just left cannot install itself afterwards.
   */
  private _clearDetail(): void {
    this._detailGeneration += 1;
    // A load still in flight has just been superseded, so its indicator goes
    // with it rather than standing until its response arrives and is dropped.
    const wasLoading = this._detailLoading;
    this._detailLoading = false;
    if (!this._detail && !wasLoading) {
      return;
    }
    this._detail = undefined;
    this._onChange();
  }

  /**
   * Brings the detail layer in line with the zoom window: dropped once the
   * window needs nothing finer, reloaded once it leaves what is loaded or
   * deserves another interval.
   */
  private _syncDetail(): void {
    const plan = this._detailPlan();
    if (!plan) {
      this._clearDetail();
      return;
    }
    if (this._detailIsCurrent(plan) || this._detailIsKnownMiss(plan)) {
      return;
    }
    // The gesture has already settled in the card, so this needs no debounce
    // of its own beyond collapsing the events of one wheel.
    this._queue.schedule("detail", 150);
  }

  private async _loadDetail(): Promise<void> {
    const hass = this._hass;
    const plan = this._detailPlan();
    if (!hass || !plan || !this._periodStart || !this._visible) {
      return;
    }
    // Only the known miss is checked here. A plan that is already loaded is
    // deliberately loaded again: this is also the path an auto refresh takes,
    // and it is the only way new samples reach a chart that stays zoomed in.
    if (this._detailIsKnownMiss(plan)) {
      log("info", "Zoom detail: window is a known gap, nothing is loaded", {
        interval: plan.aggregation,
      });
      return;
    }

    const generation = ++this._detailGeneration;
    this._detailLoading = true;
    this._detailLoadingGeneration = generation;
    this._onChange();

    const { ids, types } = this._collectStatisticRequests();
    const range: RangeState = {
      start: plan.start.getTime(),
      end: plan.end.getTime(),
    };

    try {
      const ladder = detailPlanLadder(plan.aggregation, this._main.aggregation);
      const metadata = await this._loadMetadata(hass, ids);
      // Walking the ladder is the normal course for a detail layer, not a
      // symptom: an empty rung is expected wherever the recorder has purged.
      const result = await this._fetchWithPlan(
        hass,
        ladder,
        plan.start,
        plan.end,
        ids,
        types,
        false,
        range,
        "debug"
      );
      if (!this._isCurrentDetail(generation)) {
        return;
      }

      // A request that threw says nothing about the data. Remembering it as a
      // miss would keep the region from ever being tried again, so a failure
      // only leaves the coarse data standing and waits for the next attempt.
      if (result.failed) {
        log("warn", "Zoom detail: the request failed, the coarse data stays", {
          interval: plan.aggregation,
        });
        return;
      }

      // Five-minute statistics only exist inside the recorder retention, and
      // the frontend cannot ask how far that reaches. An empty answer from
      // every interval on the ladder is that answer: the region is
      // remembered, the coarse data stays on screen.
      if (!statisticsHaveData(result.statistics, ids)) {
        log("info", "Zoom detail: the recorder holds nothing finer for this window", {
          requested: plan.aggregation,
          from: plan.start.toISOString(),
          to: plan.end.toISOString(),
        });
        this._detailMiss = {
          start: plan.start.getTime(),
          end: plan.end.getTime(),
          aggregation: plan.aggregation,
        };
        this._clearDetail();
        return;
      }

      // Whatever the ladder ended on: compare and shifted series are loaded
      // at exactly that interval, so the chart never mixes two of them.
      const aggregation = result.aggregation;

      const main: TargetState = {
        metadata,
        calculated: new Map(),
        statistics: result.statistics,
        range,
        aggregation,
      };
      main.calculated = this._computeCalculations(main, false, plan.start, plan.end);

      const compare = emptyTargetState();
      let compareRange: RangeState | undefined;
      if (this._comparePeriodStart) {
        const shift =
          this._comparePeriodStart.getTime() - this._periodStart.getTime();
        const compareStart = new Date(plan.start.getTime() + shift);
        const compareEnd = new Date(plan.end.getTime() + shift);
        compareRange = { start: compareStart.getTime(), end: compareEnd.getTime() };

        const compareResult = await this._fetchWithPlan(
          hass,
          [aggregation],
          compareStart,
          compareEnd,
          ids,
          types,
          true,
          compareRange
        );
        if (!this._isCurrentDetail(generation)) {
          return;
        }
        // Installing the empty result of a failed request would drop the
        // compare series from the zoom until the next gesture. The coarse
        // data still has both, so the whole layer is left for the next try.
        if (compareResult.failed) {
          log("warn", "Zoom detail skipped: the compare range failed to load");
          return;
        }
        compare.metadata = metadata;
        compare.statistics = compareResult.statistics;
        compare.range = compareRange;
        compare.aggregation = aggregation;
        compare.calculated = this._computeCalculations(
          compare,
          true,
          compareStart,
          compareEnd
        );
      }

      const shifted = await this._fetchShiftedSeries(
        plan.start,
        plan.end,
        () => this._isCurrentDetail(generation),
        aggregation
      );
      if (!this._isCurrentDetail(generation)) {
        return;
      }

      this._detailMiss = undefined;
      this._detail = {
        range,
        compareRange,
        aggregation,
        requested: plan.aggregation,
        main,
        compare,
        shiftedStatistics: shifted?.statistics ?? new Map(),
        shiftedMetadata: shifted?.metadata ?? new Map(),
        shiftedCalculated: shifted?.calculated ?? new Map(),
      };
      // Drawn by the `finally` below, which clears the indicator: one frame
      // carries both the detail layer and the end of the load.
    } catch (error) {
      log("error", "Failed to load zoom detail", {
        error: error instanceof Error ? error.message : error,
      });
      // The coarse data is still on screen; the next zoom tries again.
    } finally {
      if (this._detailLoading && this._detailLoadingGeneration === generation) {
        this._detailLoading = false;
        this._onChange();
      }
    }
  }

  // ------------------------------------------------------ time offset series

  private _buildShiftedGroups(start: Date, end?: Date): ShiftedFetchGroup[] {
    const groups = new Map<string, ShiftedFetchGroup>();

    this._config?.series.forEach((series, index) => {
      const offset = getSeriesTimeOffset(series);
      if (!offset) {
        return;
      }
      const source = getSeriesSource(series);
      const statisticId = getStatisticId(series);
      if (source === "statistic" && !statisticId) {
        return;
      }
      if (source === "calculation" && !series.calculation?.terms?.length) {
        return;
      }

      const sourceStart = shiftDate(start, offset, 1);
      const sourceEnd = end ? shiftDate(end, offset, 1) : undefined;
      const key = `${offset.value}:${offset.unit}`;

      const group = groups.get(key) ?? {
        key,
        sourceStart,
        sourceEnd,
        offset,
        statisticSeries: [],
        calculationSeries: [],
      };

      if (source === "statistic" && statisticId) {
        group.statisticSeries.push({ index, statisticId });
      } else {
        group.calculationSeries.push({ index, series });
      }
      groups.set(key, group);
    });

    return Array.from(groups.values());
  }

  private _shiftedGroupRequests(group: ShiftedFetchGroup): {
    ids: string[];
    types: string[];
  } {
    const ids = new Set<string>();
    const types = new Set<string>();

    group.statisticSeries.forEach(({ index, statisticId }) => {
      ids.add(statisticId);
      types.add(this._config?.series[index].stat_type ?? DEFAULT_STAT_TYPE);
    });
    group.calculationSeries.forEach(({ series }) => {
      const defaultStatType = series.stat_type ?? DEFAULT_STAT_TYPE;
      series.calculation?.terms?.forEach((term) => {
        const id = term.statistic_id?.trim();
        if (id) {
          ids.add(id);
          types.add(term.stat_type ?? defaultStatType);
        }
      });
    });

    return {
      ids: Array.from(ids),
      types: types.size ? Array.from(types) : [DEFAULT_STAT_TYPE],
    };
  }

  /**
   * Loads every series that configures `time_offset` from its shifted source
   * range and projects the samples back onto the visible range.
   */
  private async _loadShiftedSeries(
    start: Date,
    end: Date | undefined,
    generation: number
  ): Promise<void> {
    const result = await this._fetchShiftedSeries(start, end, () =>
      this._isCurrent("main", generation)
    );
    // A superseded load must not clear what the newer one already stored.
    if (!this._isCurrent("main", generation)) {
      return;
    }
    if (!result) {
      this._clearShifted();
      return;
    }
    this._shiftedStatistics = result.statistics;
    this._shiftedMetadata = result.metadata;
    this._shiftedCalculated = result.calculated;
  }

  /**
   * Loads every series that configures `time_offset` from its shifted source
   * range. Returns the projected samples instead of storing them, so the
   * detail layer can load its own set with the same code.
   */
  private async _fetchShiftedSeries(
    start: Date,
    end: Date | undefined,
    isCurrent: () => boolean,
    forcedAggregation?: AggregationTarget
  ): Promise<ShiftedSeriesData | undefined> {
    const hass = this._hass;
    const groups = hass ? this._buildShiftedGroups(start, end) : [];
    if (!hass || !groups.length) {
      return undefined;
    }

    const statisticsByIndex = new Map<number, StatisticValue[]>();
    const metadataByIndex = new Map<number, StatisticsMetaData | undefined>();
    const calculatedByKey = new Map<string, StatisticValue[]>();

    for (const group of groups) {
      const { ids, types } = this._shiftedGroupRequests(group);
      const plan = (
        forcedAggregation
          ? [forcedAggregation]
          : resolveAggregationPlan(
              group.sourceStart,
              group.sourceEnd,
              this._config?.aggregation,
              this._usesEnergyPicker,
              this._logger
            )
      ).filter((aggregation) => aggregation !== "raw");

      if (!plan.length || plan[0] === "disabled") {
        this._logger.warnOnce(
          `shifted-unsupported-${group.key}`,
          "Series time offset requires aggregated statistics; raw history and disabled ranges are skipped."
        );
        continue;
      }

      const metadata = await this._loadMetadata(hass, ids);
      const result = await this._fetchWithPlan(
        hass,
        plan,
        group.sourceStart,
        group.sourceEnd,
        ids,
        types,
        false,
        { start: group.sourceStart.getTime(), end: group.sourceEnd?.getTime() ?? null }
      );

      if (!isCurrent()) {
        return undefined;
      }
      if (result.aggregation === "disabled") {
        continue;
      }

      group.statisticSeries.forEach(({ index, statisticId }) => {
        const values = result.statistics[statisticId];
        if (!values?.length) {
          return;
        }
        statisticsByIndex.set(index, shiftStatisticValues(values, group.offset));
        metadataByIndex.set(index, metadata[statisticId]);
      });

      group.calculationSeries.forEach(({ index, series }) => {
        const evaluated = evaluateCalculation(
          series,
          series.calculation!,
          result.statistics,
          index,
          {
            start: group.sourceStart,
            end: group.sourceEnd,
            period: result.aggregation,
          },
          this._logger
        );
        if (!evaluated?.values.length) {
          return;
        }
        calculatedByKey.set(
          calculationKey(index),
          shiftStatisticValues(evaluated.values, group.offset)
        );
      });
    }

    return {
      statistics: statisticsByIndex,
      metadata: metadataByIndex,
      calculated: calculatedByKey,
    };
  }

  // ------------------------------------------------------------- calculations

  private _rebuildCalculations(isCompare: boolean): void {
    const target = isCompare ? this._compare : this._main;
    target.calculated = this._computeCalculations(
      target,
      isCompare,
      isCompare ? this._comparePeriodStart : this._periodStart,
      isCompare ? this._comparePeriodEnd : this._periodEnd
    );
  }

  /** Evaluates every calculation series against one loaded target state. */
  private _computeCalculations(
    target: TargetState,
    isCompare: boolean,
    start: Date | undefined,
    end: Date | undefined
  ): Map<string, StatisticValue[]> {
    const calculated = new Map<string, StatisticValue[]>();

    this._config?.series.forEach((series, index) => {
      if (!series.calculation || getSeriesSource(series) !== "calculation") {
        return;
      }
      // Offset calculations are evaluated on their shifted source range.
      if (!isCompare && getSeriesTimeOffset(series)) {
        return;
      }
      const result = evaluateCalculation(
        series,
        series.calculation,
        target.statistics ?? {},
        index,
        { start, end, period: target.aggregation },
        this._logger
      );
      if (result) {
        calculated.set(calculationKey(index), result.values);
      }
    });

    return calculated;
  }

  // --------------------------------------------------------------- raw stream

  private _shouldUseRawStream(): boolean {
    return (
      this._connected &&
      this._visible &&
      !!this._hass &&
      this._main.aggregation === "raw" &&
      this._statisticIds.length > 0
    );
  }

  private async _restartRawStream(): Promise<void> {
    await this._teardownRawStream();
    if (!this._shouldUseRawStream() || !this._hass) {
      return;
    }

    const fallbackStart = this._main.range?.start ?? Date.now();
    const startMs =
      this._main.lastRawEnd !== undefined
        ? Math.max(this._main.lastRawEnd - RAW_DELTA_OVERLAP_MS, fallbackStart)
        : fallbackStart;

    this._rawStreamUnsub = subscribeRawHistoryStream(
      this._hass,
      new Date(startMs),
      this._statisticIds,
      (message) => {
        if (message?.states && Object.keys(message.states).length) {
          this._applyRawStreamStates(message.states);
        }
      },
      this._config?.aggregation?.raw_options
    ).catch((error) => {
      log("error", "Failed to subscribe to the raw history stream", {
        error: error instanceof Error ? error.message : error,
      });
      this._rawStreamUnsub = undefined;
      this._queue.schedule("main");
      return undefined;
    });
  }

  private async _teardownRawStream(): Promise<void> {
    const handle = this._rawStreamUnsub;
    this._rawStreamUnsub = undefined;
    if (!handle) {
      return;
    }
    try {
      const unsubscribe = await handle;
      if (typeof unsubscribe === "function") {
        await unsubscribe();
      }
    } catch (error) {
      log("warn", "Failed to unsubscribe from the raw history stream", {
        error: error instanceof Error ? error.message : error,
      });
    }
  }

  private _applyRawStreamStates(
    states: Parameters<typeof historyStatesToStatistics>[0]
  ): void {
    if (!this._shouldUseRawStream()) {
      return;
    }
    const patch = historyStatesToStatistics(states);
    if (!Object.values(patch).some((entries) => entries?.length)) {
      return;
    }

    const range = this._main.range;
    const merged = mergeStatistics(this._main.statistics, patch);
    this._main.statistics = range
      ? trimStatisticsToRange(merged, range.start, range.end)
      : merged;
    this._main.lastRawEnd = maxStatisticsEnd(this._main.statistics);
    this._rebuildCalculations(false);
    this._onChange();
  }

  /** Re-trims a streaming range after a rolling window has moved on. */
  private _applyRollingWindowShift(): void {
    if (!this._main.statistics || !this._periodStart) {
      return;
    }
    const range: RangeState = {
      start: this._periodStart.getTime(),
      end: this._periodEnd?.getTime() ?? null,
    };
    this._main.statistics = trimStatisticsToRange(
      this._main.statistics,
      range.start,
      range.end
    );
    this._main.range = range;
    this._main.lastRawEnd = maxStatisticsEnd(this._main.statistics);
    this._rebuildCalculations(false);
    this._onChange();
  }

  // ------------------------------------------------------------ current hour

  private _shouldComputeCurrentHour(): boolean {
    if (!this._config?.aggregation?.compute_current_hour) {
      return false;
    }
    if (this._main.aggregation !== "hour" || !this._periodStart) {
      return false;
    }
    const now = new Date();
    if (this._periodStart > now) {
      return false;
    }
    return !this._periodEnd || this._periodEnd > startOfHour(now);
  }

  private _scheduleLiveHour(): void {
    this._clearTimer("_liveHourTimeout");
    if (!this._shouldComputeCurrentHour()) {
      return;
    }
    this._queue.schedule("live", 250);
    const delay = Math.max(
      getNextRefreshTime("5minute") - Date.now(),
      LIVE_HOUR_MIN_DELAY_MS
    );
    this._liveHourTimeout = window.setTimeout(() => {
      this._liveHourTimeout = undefined;
      this._scheduleLiveHour();
    }, delay);
  }

  /**
   * Estimates the ongoing hour from 5-minute statistics until Home Assistant
   * publishes the official hourly aggregate.
   */
  private async _loadLiveHour(): Promise<void> {
    const hass = this._hass;
    if (!hass || !this._connected || !this._visible || !this._shouldComputeCurrentHour()) {
      return;
    }
    const base = this._main.statistics;
    if (!base || !this._statisticIds.length) {
      return;
    }

    const window = computeLiveHourWindow(this._periodStart, this._periodEnd);
    if (!window) {
      return;
    }

    try {
      const fiveMinute = await withTimeout(
        fetchStatistics(
          hass,
          new Date(window.fetchStart),
          new Date(window.fetchEnd),
          this._statisticIds,
          "5minute",
          this._statTypes
        ),
        FETCH_TIMEOUT_MS,
        "fetchStatistics:liveHour"
      );

      const patch = buildLiveHourPatch(base, fiveMinute, window, this._statisticIds);
      if (!patch) {
        return;
      }
      this._main.statistics = applyLiveHourPatch(base, patch);
      this._rebuildCalculations(false);
      this._onChange();
    } catch (error) {
      log("error", "Failed to load the current-hour estimate", {
        error: error instanceof Error ? error.message : error,
      });
    }
  }

  // ------------------------------------------------------------- auto refresh

  private _scheduleAutoRefresh(): void {
    this._clearTimer("_autoRefreshTimeout");
    if (!this._connected || !this._visible || !this._config || !this._periodStart) {
      return;
    }

    const timespan = this._timespan;
    if (timespan.mode === "fixed") {
      const end = timespan.end ? new Date(timespan.end) : null;
      if (!end || end <= new Date()) {
        return; // Historical data does not change.
      }
    }

    const aggregation = this._main.aggregation ?? "hour";
    if (aggregation === "disabled") {
      return;
    }

    const delay = getNextRefreshTime(aggregation) - Date.now();
    if (!Number.isFinite(delay)) {
      return;
    }

    this._autoRefreshTimeout = window.setTimeout(
      () => {
        this._autoRefreshTimeout = undefined;
        this._runAutoRefresh(aggregation);
      },
      Math.max(delay, 60_000)
    );
  }

  private _runAutoRefresh(aggregation: AggregationTarget): void {
    if (!this._connected || !this._visible) {
      return;
    }

    const periodChanged = this._recalculatePeriod();
    const compareChanged = this._recalculateComparePeriod();
    const rolling = isRollingTimespan(this._timespan);
    let refreshMain = rolling ? periodChanged : true;

    // A live raw stream already delivers new samples; only the window moves.
    if (aggregation === "raw" && this._rawStreamUnsub) {
      if (periodChanged) {
        this._applyRollingWindowShift();
      }
      refreshMain = false;
    }

    if (refreshMain) {
      this._queue.schedule("main");
    }
    if (this._comparePeriodStart && (compareChanged || refreshMain)) {
      this._queue.schedule("compare");
    }

    this._scheduleAutoRefresh();
  }

  // ---------------------------------------------------------------- visibility

  private readonly _handleVisibilityChange = (): void => {
    const visible = document.visibilityState !== "hidden";
    if (visible === this._visible) {
      return;
    }
    this._visible = visible;

    if (!visible) {
      this._queue.pause();
      this._clearTimer("_autoRefreshTimeout");
      this._clearTimer("_liveHourTimeout");
      void this._teardownRawStream();
      return;
    }

    this._clearTimer("_visibilityResumeTimeout");
    this._visibilityResumeTimeout = window.setTimeout(() => {
      this._visibilityResumeTimeout = undefined;
      if (!this._visible) {
        return;
      }
      const parked = new Set(this._queue.takeParked());
      parked.add("main");
      if (this._comparePeriodStart) {
        parked.add("compare");
      }
      parked.forEach((key) => this._queue.schedule(key));
      this._scheduleAutoRefresh();
    }, VISIBILITY_RESUME_DELAY_MS);
  };

  private _clearTimer(
    field: "_autoRefreshTimeout" | "_liveHourTimeout" | "_visibilityResumeTimeout"
  ): void {
    const handle = this[field];
    if (handle) {
      window.clearTimeout(handle);
      this[field] = undefined;
    }
  }
}
