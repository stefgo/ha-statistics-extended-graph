// Replaced at build time by rollup (@rollup/plugin-replace) with the version
// from package.json plus the local build counter (`scripts/build-number.mjs`).
// The fallbacks keep `tsc --noEmit` and unbundled use happy.
declare const __CARD_VERSION__: string;
declare const __CARD_SEMVER__: string;
declare const __CARD_BUILD__: number;
declare const __CARD_BUILD_TIME__: string;

/** The released version — what `package.json` says, without the build counter */
export const CARD_SEMVER =
  typeof __CARD_SEMVER__ === "string" ? __CARD_SEMVER__ : "dev";

/** Rises with every local deploy build; 0 when the build carried no counter */
export const CARD_BUILD = typeof __CARD_BUILD__ === "number" ? __CARD_BUILD__ : 0;

export const CARD_BUILD_TIME =
  typeof __CARD_BUILD_TIME__ === "string" ? __CARD_BUILD_TIME__ : "";

/** `<semver>+build.<n>` — what the card reports in the console */
export const CARD_VERSION =
  typeof __CARD_VERSION__ === "string" ? __CARD_VERSION__ : "dev";
