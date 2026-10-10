# CLAUDE.md

Guidance for Claude Code when working in this repository.

## Project overview

`statistics-extended-graph` is a standalone Home Assistant Lovelace card
(`custom:statistics-extended-graph`): a statistics graph with per-series
configuration, calculated series, time offsets, an optional data zoom and a
click-to-select time interaction. It follows the energy dashboard's date picker
when configured to.

The card depends on no other card and on no chart library: it produces plain
ECharts option objects and hands them to Home Assistant's own
`<ha-chart-base>`. Keep it that way — the runtime comes from the frontend.

## Commands

```bash
npm ci
npm run build      # Rollup → dist/statistics-extended-graph.js
npm run watch      # rebuild on change
npm run typecheck  # tsc --noEmit
npm run lint       # eslint (npm run lint:fix to autofix)
npm test           # vitest run
SEG_MINIFY=1 npm run build   # minified, as the release does
./builddeploy.sh   # build + scp to the instance from .env (see .env.example)
```

## Architecture

The full picture — module table, data flow and the design decisions behind it —
is in [docs/architecture.md](docs/architecture.md). The short version:

```
card.ts                  Lit element: rendering, placeholders, animation
  └── chart/assemble.ts  builds the complete chart model from a data snapshot
        ├── series/      config → ECharts series (builder, calculation, offsets)
        └── chart/       axes, bars, lines, compare styling, data zoom
  └── core/data-controller.ts
        ├── energy/      binding to the energy date picker
        ├── time/        timespan, buckets, aggregation plan, refresh timing
        └── data/        WebSocket APIs: statistics, history, live hour
```

Layers depend downwards only. All state lives in the controller, so rendering
has no side effects and a redraw can never trigger a fetch loop.

## Testing

Tests are in `test/*.test.ts` (vitest, `npm test`) and cover the pure modules —
the elements themselves have no DOM-based tests, so `npm run typecheck` is what
guards them. `.github/workflows/validate.yml` runs the HACS check, typecheck,
tests and the build on every push and pull request.

## Releasing

A release is started by hand, never by pushing a tag: **Actions → Create Release → Run
workflow**, on `main` for a release or on `dev` for a beta (`x.y.z-beta.n`, a prerelease
HACS offers only with beta versions switched on). **Never bump a version or create a
`v*` tag by hand.**

- `dry_run` (on by default) shows the next version and the complete notes in the run
  summary and changes nothing.
- `bump` (`auto` | `patch` | `minor` | `major`): `auto` reads the commit types — `feat`
  raises the minor position, `fix`, `perf` and `revert` the patch position, every other
  type releases nothing — so commit messages follow Conventional Commits, checked against
  `commitlint.config.mjs` by `.githooks/commit-msg`, which `npm install` activates. Any other value
  is the step that is taken, whatever the commits say. `major` is the only way a major
  version is created; a `BREAKING CHANGE:` footer raises the minor position.
- **Every release is described by hand in `.release/next.md`** — what is new and what an
  upgrade needs, written for someone who uses the card. The text goes above the
  generated list of commits, in the GitHub release and in `CHANGELOG.md`; a release
  without it is refused. Write it as part of the change, not at release time. A beta
  keeps the text, the release from `main` empties the file. `.release/footer.md` is the
  installation part appended to every release page.
- **`dev` is merged into `main` with its history — never squashed or rebased** — and
  `main` back into `dev` before the next beta. The workflow checks both.

`.github/workflows/release.yml` calls
[stefgo/release-workflows](https://github.com/stefgo/release-workflows), which carries
semantic-release and its configuration for every stefgo project. It runs `validate.yml`, writes the
version to `package.json`, builds minified *before* the release commit and the tag, and
attaches the bundle to the release — that asset is what HACS installs.

### The release notes are part of the commit

Before every commit, read `.release/next.md` and bring it up to date with what the commit
changes — in the same commit, not at release time.

- A commit that changes what a user sees or has to do — a feature, a fix, a changed
  default, a renamed setting, anything an upgrade needs — is reflected in the text. A
  `feat`, `fix` or `perf` commit that leaves the file untouched needs a reason.
- A commit that changes nothing for a user (`ci`, `test`, `refactor`, `docs`, `chore`,
  most of `build`) leaves the file alone. No line is added for the sake of it.
- Revise the text as a whole instead of appending a line per commit: it describes the
  release, not its history. Merge what belongs together, and remove a sentence a later
  commit made untrue — a feature taken back before the release is not in its notes.
- Write for someone who uses the project, in their terms: what is new, why it matters,
  what an upgrade needs. No file names and no internals; the list of commits below the
  text already names every change.
- The text goes below the HTML comment at the top of the file, with `###` headings. If
  the file holds only the comment, the text starts with this commit.

## Conventions

- Keep new config options optional with sensible defaults; never break existing
  YAML.
- `validate.ts` throws only for a missing series list — `setConfig()` runs on
  every keystroke in the Lovelace editor. Everything else is a console warning
  and a locally degraded chart: one broken series must not take down a
  dashboard.
- No chart library, no dependency on another card, no forked foreign source.
