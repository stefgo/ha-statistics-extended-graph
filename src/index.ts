import "./card";

declare global {
  interface Window {
    customCards?: Array<Record<string, unknown>>;
  }
}

window.customCards = window.customCards || [];
window.customCards.push({
  type: "statistics-extended-graph",
  name: "Statistics Extended Graph",
  description:
    "Statistics chart with custom aggregation, stacking, axes and colors. YAML only.",
  documentationURL: "https://github.com/stefgo/ha-statistics-extended-graph",
});
