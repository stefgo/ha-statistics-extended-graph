/**
 * Prints the CHANGELOG section of one release, so the GitHub release says what
 * changed instead of only listing the commits behind it.
 *
 * The tag names the version (`v0.6.0` -> `## [0.6.0] — …`), and everything up
 * to the next `## ` heading is that release's entry. A version the CHANGELOG
 * does not mention prints nothing rather than failing: the release still gets
 * its generated notes, which is better than no release at all.
 *
 * Usage: node scripts/release-notes.mjs v0.6.0
 */
import { readFileSync } from "node:fs";

const tag = process.argv[2];
if (!tag) {
  console.error("usage: node scripts/release-notes.mjs <tag>");
  process.exit(2);
}

const version = tag.replace(/^v/, "");
const changelog = readFileSync("CHANGELOG.md", "utf8");

// The heading carries the date behind an em dash, which is not part of the
// match: only the bracketed version has to line up.
const lines = changelog.split("\n");
const start = lines.findIndex((line) =>
  line.startsWith("## ") && line.includes(`[${version}]`)
);

if (start === -1) {
  console.error(`no CHANGELOG section for ${version}; falling back to generated notes`);
  process.exit(0);
}

const rest = lines.slice(start + 1);
const end = rest.findIndex((line) => line.startsWith("## "));
const body = (end === -1 ? rest : rest.slice(0, end)).join("\n").trim();

process.stdout.write(body ? `${body}\n` : "");
