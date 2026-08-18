import "./card";

declare global {
  interface Window {
    customCards?: Array<Record<string, unknown>>;
  }
}

window.customCards = window.customCards || [];
window.customCards.push({
  type: "custom-graph-card",
  name: "Custom Graph",
  description:
    "Statistics chart with custom aggregation, stacking, axes and colors. YAML only.",
  documentationURL: "https://github.com/stefgo/ha-custom-graph",
});
