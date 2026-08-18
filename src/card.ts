import { css, html, LitElement, nothing } from "lit";
import type { PropertyValues } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { classMap } from "lit/directives/class-map.js";
import type { HomeAssistant } from "custom-card-helpers";
import type { CustomGraphCardConfig } from "./config/types";
import { normalizeConfig } from "./config/validate";
import { GraphDataController } from "./core/data-controller";
import { OnceLogger } from "./core/logger";
import { assembleChart } from "./chart/assemble";
import { createZeroSnapshot } from "./chart/lines";
import type { ChartOptions, SeriesOption } from "./types/echarts";
import { CARD_VERSION } from "./version";

interface LovelaceGridOptions {
  columns?: number | "full";
  rows?: number | "auto";
  min_columns?: number;
  min_rows?: number;
}

const DISABLED_MESSAGE =
  "Fetching statistics is disabled for this period. Choose a shorter time range.";

console.info(
  "%c CUSTOM-GRAPH-CARD %c " + CARD_VERSION + " ",
  "background-color: #000000; color: #4CAF50; font-weight: bold;",
  "background-color: #666666; color: #FFFFFF; font-weight: bold;",
);

@customElement("custom-graph-card")
export class CustomGraphCard extends LitElement {
  @property({ attribute: false }) public hass!: HomeAssistant;

  @state() private _config?: CustomGraphCardConfig;
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

  public setConfig(config: CustomGraphCardConfig): void {
    this._config = normalizeConfig(config);
    this._logger.reset();
    this._renderedRange = undefined;
    this._controller.setConfig(this._config);
  }

  public static getStubConfig(): Partial<CustomGraphCardConfig> {
    return { type: "custom:custom-graph-card", series: [] };
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

  protected override willUpdate(changedProps: PropertyValues): void {
    if (changedProps.has("hass") && this.hass) {
      this._controller.setHass(this.hass);
    }
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

  private _rebuildChart(): void {
    if (!this.hass || !this._config) {
      return;
    }

    const snapshot = this._controller.snapshot;
    const assembled = assembleChart({
      hass: this.hass,
      config: this._config,
      snapshot,
      computedStyle: this.isConnected
        ? getComputedStyle(this)
        : getComputedStyle(document.documentElement),
      darkMode: this._isDarkMode(),
      logger: this._logger,
    });

    if (!assembled) {
      this._chartData = [];
      this._chartOptions = undefined;
      this._hasData = false;
      return;
    }

    const range = {
      start: snapshot.periodStart!.getTime(),
      end: snapshot.periodEnd?.getTime() ?? null,
    };
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
    "custom-graph-card": CustomGraphCard;
  }
}
