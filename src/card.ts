import { css, html, LitElement, nothing } from "lit";
import type { PropertyValues } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { classMap } from "lit/directives/class-map.js";
import type { HomeAssistant } from "custom-card-helpers";
import type { StatisticsExtendedGraphConfig } from "./config/types";
import { normalizeConfig } from "./config/validate";
import { GraphDataController } from "./core/data-controller";
import type { GraphSnapshot } from "./core/data-controller";
import { OnceLogger } from "./core/logger";
import { assembleChart } from "./chart/assemble";
import { createZeroSnapshot } from "./chart/lines";
import { SelectionInput } from "./chart/selection-input";
import { resolveBucket } from "./chart/selection";
import type { SelectedPeriod } from "./chart/selection";
import type { ChartOptions, SeriesOption } from "./types/echarts";
import { CARD_VERSION } from "./version";

interface LovelaceGridOptions {
  columns?: number | "full";
  rows?: number | "auto";
  min_columns?: number;
  min_rows?: number;
}

/** Name of the event the card fires whenever the selected period changes. */
export const SELECTION_EVENT = "custom-graph-selection";

/**
 * Payload of {@link SELECTION_EVENT}: the period the selection covers. Every
 * field is `null` once the selection is cleared, and `end` stays `null` for an
 * open-ended last bucket.
 */
export interface GraphSelectionDetail {
  /** Start of the selected bucket in epoch milliseconds, `null` when cleared */
  start: number | null;
  /** End of the bucket (exclusive); `null` for an open-ended last bucket */
  end: number | null;
  /** Start as an ISO string. */
  startTime: string | null;
  /** End as an ISO string. */
  endTime: string | null;
}

const DISABLED_MESSAGE =
  "Fetching statistics is disabled for this period. Choose a shorter time range.";

console.info(
  "%c STATISTICS-EXTENDED-GRAPH %c " + CARD_VERSION + " ",
  "background-color: #000000; color: #4CAF50; font-weight: bold;",
  "background-color: #666666; color: #FFFFFF; font-weight: bold;",
);

@customElement("statistics-extended-graph")
export class StatisticsExtendedGraph extends LitElement {
  /**
   * Lit runs `willUpdate` only for updates that `shouldUpdate` let through, and
   * this card drops plain entity-state updates - it is driven by statistics,
   * not by states. Handing `hass` on from there would therefore have skipped
   * most of them and left the controller holding an object that grows
   * arbitrarily old, including its websocket connection. The controller is fed
   * from the setter instead, so it always has the current one, while the render
   * path keeps ignoring the updates it has no use for.
   */
  @property({ attribute: false })
  public set hass(hass: HomeAssistant) {
    const previous = this._hass;
    this._hass = hass;
    this._controller.setHass(hass);
    this.requestUpdate("hass", previous);
  }

  public get hass(): HomeAssistant {
    return this._hass as HomeAssistant;
  }

  private _hass?: HomeAssistant;

  @state() private _config?: StatisticsExtendedGraphConfig;
  @state() private _chartData: SeriesOption[] = [];
  @state() private _chartOptions?: ChartOptions;
  @state() private _hasData = false;
  @state() private _loading = false;
  @state() private _disabled = false;
  @state() private _usesSectionLayout = false;

  private readonly _logger = new OnceLogger();
  private readonly _controller = new GraphDataController(() => this._onData());
  private _renderedRange?: { start: number; end: number | null };
  private _animationFrame?: number;
  private _darkMode = false;
  /** The one selected x value; `null` while nothing is selected. */
  private _selectedX: number | null = null;
  /** Bucket and period of the last assembly, used to toggle and to report. */
  private _selection: SelectedPeriod | null = null;
  /** Visible range the selection was made in; a switch invalidates it. */
  private _selectedRange?: { start: number; end: number | null };
  /** Series of the last assembly; a click is snapped against them. */
  private _assembledSeries: SeriesOption[] = [];
  /** Last reported selection; guards the event against repeated payloads. */
  private _emitted: { start: number | null; end: number | null } = {
    start: null,
    end: null,
  };
  private readonly _selectionInput = new SelectionInput(
    (x) => this._onPick(x),
    this._logger
  );

  public setConfig(config: StatisticsExtendedGraphConfig): void {
    this._config = normalizeConfig(config);
    this._logger.reset();
    this._renderedRange = undefined;
    this._clearSelection();
    this._controller.setConfig(this._config);
  }

  public static getStubConfig(): Partial<StatisticsExtendedGraphConfig> {
    return { type: "custom:statistics-extended-graph", series: [] };
  }

  public getCardSize(): number {
    return 5;
  }

  public getGridOptions(): LovelaceGridOptions {
    const hasTitle = !!this._config?.title?.trim();
    return {
      columns: 12,
      min_columns: 6,
      rows: hasTitle ? 5 : 4,
      min_rows: hasTitle ? 4 : 3,
    };
  }

  public override connectedCallback(): void {
    super.connectedCallback();
    this._controller.connect();
  }

  public override disconnectedCallback(): void {
    super.disconnectedCallback();
    this._controller.disconnect();
    this._selectionInput.detach();
    if (this._animationFrame !== undefined) {
      cancelAnimationFrame(this._animationFrame);
      this._animationFrame = undefined;
    }
  }

  protected override shouldUpdate(changedProps: PropertyValues): boolean {
    if (!changedProps.has("hass") || changedProps.size > 1) {
      return true;
    }
    // Ignore plain entity state updates; the card is driven by statistics.
    const oldHass = changedProps.get("hass") as HomeAssistant | undefined;
    if (!oldHass) {
      return true;
    }
    return (
      oldHass.connected !== this.hass?.connected ||
      oldHass.themes !== this.hass?.themes ||
      oldHass.locale !== this.hass?.locale
    );
  }

  protected override updated(changedProps: PropertyValues): void {
    super.updated(changedProps);
    this._evaluateSectionLayout();

    // A theme switch changes every resolved color, so the chart is rebuilt.
    const darkMode = this._isDarkMode();
    const themeChanged = darkMode !== this._darkMode;
    this._darkMode = darkMode;

    if (changedProps.has("_config") || themeChanged) {
      this._rebuildChart();
    }
  }

  protected override firstUpdated(): void {
    this._evaluateSectionLayout();
  }

  private _onData(): void {
    const snapshot = this._controller.snapshot;
    this._loading = snapshot.loading;
    this._disabled = snapshot.aggregationDisabled;
    this._rebuildChart();
  }

  /** Section layouts size the card through grid rows instead of `chart_height`. */
  private _evaluateSectionLayout(): void {
    if (!this.isConnected) {
      return;
    }
    const layout = (this as unknown as { layout?: string }).layout;
    this._usesSectionLayout = layout === "grid";
  }

  /**
   * A click was placed in the plotting area. The x value is snapped onto a
   * bucket first, so clicking the selected one again clears it - which keeps
   * exactly one selection alive without any timing heuristics.
   */
  private _onPick(x: number): void {
    const bucket = resolveBucket(this._assembledSeries, x);
    if (bucket === null) {
      return;
    }

    this._selectedX = bucket === this._selection?.bucket ? null : bucket;
    this._rebuildChart();
  }

  private _clearSelection(): void {
    this._selectedX = null;
    this._selection = null;
    this._selectedRange = undefined;
  }

  /**
   * The selection belongs to one visible range: it survives refreshes, live
   * updates and redraws, but a switch of the range points at a period the
   * chart no longer shows.
   */
  private _dropSelectionOnRangeChange(range: {
    start: number;
    end: number | null;
  }): void {
    if (this._selectedX === null || !this._selectedRange) {
      return;
    }
    if (
      this._selectedRange.start !== range.start ||
      this._selectedRange.end !== range.end
    ) {
      this._clearSelection();
    }
  }

  /**
   * Reports the selected period as a {@link SELECTION_EVENT} whenever it
   * changed, so dashboards can react to it. The event bubbles out of the
   * shadow root; clearing the selection reports a payload of `null`s.
   */
  private _emitSelection(period: SelectedPeriod | null): void {
    const start = period?.start ?? null;
    const end = period?.end ?? null;
    if (start === this._emitted.start && end === this._emitted.end) {
      return;
    }

    this._emitted = { start, end };
    this.dispatchEvent(
      new CustomEvent<GraphSelectionDetail>(SELECTION_EVENT, {
        detail: {
          start,
          end,
          startTime: start === null ? null : new Date(start).toISOString(),
          endTime: end === null ? null : new Date(end).toISOString(),
        },
        bubbles: true,
        composed: true,
      })
    );
  }

  /**
   * True while the loaded data still belongs to a range the card has left -
   * the one case in which "nothing to assemble" means "not yet" rather than
   * "there is nothing".
   */
  private _dataIsStale(snapshot: GraphSnapshot): boolean {
    const range = snapshot.main.range;
    if (!snapshot.periodStart || !range) {
      return false;
    }
    return (
      range.start !== snapshot.periodStart.getTime() ||
      (range.end ?? null) !== (snapshot.periodEnd?.getTime() ?? null)
    );
  }

  private _rebuildChart(): void {
    if (!this.hass || !this._config) {
      return;
    }

    const snapshot = this._controller.snapshot;
    if (snapshot.periodStart) {
      this._dropSelectionOnRangeChange({
        start: snapshot.periodStart.getTime(),
        end: snapshot.periodEnd?.getTime() ?? null,
      });
    }

    const assembled = assembleChart({
      hass: this.hass,
      config: this._config,
      snapshot,
      computedStyle: this.isConnected
        ? getComputedStyle(this)
        : getComputedStyle(document.documentElement),
      darkMode: this._isDarkMode(),
      logger: this._logger,
      selectedX: this._selectedX,
    });

    if (!assembled) {
      // Data for the new range has not arrived yet, so there is nothing to
      // draw - but there is something drawn. Replacing it with the "no data"
      // placeholder for the length of a fetch reads as an error rather than as
      // loading, so the previous chart keeps standing. Only the selection goes:
      // it points at a period the card has left.
      const keepPreviousChart = this._hasData && this._dataIsStale(snapshot);

      this._assembledSeries = [];
      this._clearSelection();
      this._emitSelection(null);

      if (!keepPreviousChart) {
        this._chartData = [];
        this._chartOptions = undefined;
        this._hasData = false;
      }
      return;
    }

    const range = {
      start: snapshot.periodStart!.getTime(),
      end: snapshot.periodEnd?.getTime() ?? null,
    };

    this._assembledSeries = assembled.series;
    this._selection = assembled.selection;
    // The click may have snapped to a bucket of its own, so the stored value
    // follows the assembly - a later click on the same bucket then clears it.
    this._selectedX = assembled.selection?.bucket ?? null;
    this._selectedRange = assembled.selection ? range : undefined;
    this._emitSelection(assembled.selection);
    const rangeChanged =
      !this._renderedRange ||
      this._renderedRange.start !== range.start ||
      this._renderedRange.end !== range.end;

    this._hasData = assembled.hasData;
    // Growing out of zero looks better than morphing the previous range's data
    // into the new one, so a range switch always animates from a flat chart.
    this._chartOptions = { ...assembled.options, animation: rangeChanged };

    if (!rangeChanged) {
      this._chartData = assembled.series;
      return;
    }

    this._chartData = createZeroSnapshot(assembled.series);
    if (this._animationFrame !== undefined) {
      cancelAnimationFrame(this._animationFrame);
    }
    this._animationFrame = requestAnimationFrame(() => {
      this._animationFrame = undefined;
      this._chartData = assembled.series;
      this._renderedRange = range;
    });
  }

  /** Home Assistant creates the chart lazily; a click proves it exists. */
  private _attachSelectionInput = (): void => {
    this._selectionInput.attach(this.renderRoot?.querySelector("ha-chart-base"));
  };

  private _onChartClick = (event: CustomEvent): void => {
    this._selectionInput.handleChartClick(event);
  };

  private _isDarkMode(): boolean {
    return (
      (this.hass?.themes as { darkMode?: boolean } | undefined)?.darkMode === true
    );
  }

  private _localize(key: string, fallback: string): string {
    const localized = this.hass?.localize?.(key);
    return localized?.trim() ? localized : fallback;
  }

  protected override render() {
    if (!this.hass || !this._config) {
      return nothing;
    }

    const hasTitle = !!this._config.title?.trim();
    return html`
      <ha-card>
        ${hasTitle
          ? html`<h1 class="card-header">${this._config.title}</h1>`
          : nothing}
        <div
          class=${classMap({ content: true, "content--no-title": !hasTitle })}
        >
          ${this._renderChart()}
        </div>
      </ha-card>
    `;
  }

  private _renderChart() {
    if (this._loading) {
      return html`<div class="placeholder">
        ${this._localize(
          "ui.components.statistics_charts.loading_statistics",
          "Loading statistics…"
        )}
      </div>`;
    }

    if (this._disabled) {
      return html`<div class="placeholder">
        ${this._localize(
          "ui.components.statistics_charts.choose_shorter_period",
          DISABLED_MESSAGE
        )}
      </div>`;
    }

    if (!this._hasData || !this._chartOptions) {
      return html`<div class="placeholder">
        ${this._localize(
          "ui.components.statistics_charts.no_statistics_found",
          "No statistics available for the selected period"
        )}
      </div>`;
    }

    const height = this._usesSectionLayout ? "100%" : this._config?.chart_height;

    return html`
      <div
        class=${classMap({
          chart: true,
          "chart--section": this._usesSectionLayout,
        })}
      >
        <ha-chart-base
          .hass=${this.hass}
          .data=${this._chartData}
          .options=${this._chartOptions}
          .height=${height}
          @pointerdown=${this._attachSelectionInput}
          @chart-click=${this._onChartClick}
        ></ha-chart-base>
      </div>
    `;
  }

  static override styles = css`
    ha-card {
      display: flex;
      flex-direction: column;
      height: 100%;
    }

    .card-header {
      margin: 0;
      padding: 16px 16px 0 16px;
    }

    .content {
      flex: 1;
      padding: 0 16px 16px 16px;
      display: flex;
      flex-direction: column;
      gap: 8px;
      min-height: 0;
    }

    .content--no-title {
      padding-top: 15px;
    }

    .chart {
      flex: 1;
      min-height: 0;
      display: flex;
      flex-direction: column;
    }

    .chart ha-chart-base {
      flex: 1 1 auto;
      min-height: 0;
      width: 100%;
      display: block;
    }

    .chart--section {
      --chart-max-height: none;
    }

    .chart--section ha-chart-base {
      height: 100%;
    }

    .placeholder {
      color: var(--secondary-text-color);
      font-style: italic;
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100%;
      text-align: center;
      padding: 16px 8px;
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    "statistics-extended-graph": StatisticsExtendedGraph;
  }
}
