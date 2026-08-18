export type LogLevel = "debug" | "info" | "warn" | "error";

const LEVEL_ORDER: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const LOG_PREFIX = "[custom-graph-card]";

/** Minimum level that reaches the browser console. */
const ACTIVE_LEVEL: LogLevel = "warn";

export type Logger = (
  level: LogLevel,
  message: string,
  details?: Record<string, unknown>
) => void;

export const log: Logger = (level, message, details) => {
  if (LEVEL_ORDER[level] < LEVEL_ORDER[ACTIVE_LEVEL]) {
    return;
  }
  const consoleRecord = console as unknown as Record<
    string,
    (...args: unknown[]) => void
  >;
  const write = (consoleRecord[level] ?? console.log).bind(console);
  if (details && Object.keys(details).length) {
    write(`${LOG_PREFIX} ${message}`, details);
  } else {
    write(`${LOG_PREFIX} ${message}`);
  }
};

/** Deduplicates repeated diagnostics so a redraw loop cannot flood the console. */
export class OnceLogger {
  private readonly _seen = new Set<string>();

  constructor(private readonly _log: Logger = log) {}

  public warnOnce(key: string, message: string, level: LogLevel = "warn"): void {
    if (this._seen.has(key)) {
      return;
    }
    this._seen.add(key);
    this._log(level, message);
  }

  public reset(): void {
    this._seen.clear();
  }
}
