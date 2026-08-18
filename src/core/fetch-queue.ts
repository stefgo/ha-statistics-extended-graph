export class TimeoutError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TimeoutError";
  }
}

export const withTimeout = <T>(
  promise: Promise<T>,
  timeoutMs: number,
  context: string
): Promise<T> => {
  let handle: number | undefined;
  const timeout = new Promise<never>((_, reject) => {
    handle = window.setTimeout(
      () => reject(new TimeoutError(`${context} timed out after ${timeoutMs} ms`)),
      timeoutMs
    );
  });
  return Promise.race([promise, timeout]).finally(() => {
    if (handle !== undefined) {
      window.clearTimeout(handle);
    }
  }) as Promise<T>;
};

interface QueueEntry {
  inFlight: boolean;
  queued: boolean;
  timeout?: number;
}

/**
 * Debounces and serializes the loads of one target.
 *
 * While a request is running, further requests are collapsed into a single
 * queued rerun. While the dashboard is hidden, requests are parked and replayed
 * once it becomes visible again.
 */
export class FetchQueue<K extends string> {
  private readonly _entries = new Map<K, QueueEntry>();
  private readonly _parked = new Set<K>();

  constructor(
    private readonly _isActive: () => boolean,
    private readonly _run: (key: K) => Promise<void>
  ) {}

  public schedule(key: K, delayMs = 500): void {
    const entry = this._entry(key);

    if (!this._isActive()) {
      this._clearTimer(entry);
      entry.queued = true;
      this._parked.add(key);
      return;
    }

    if (entry.inFlight) {
      this._clearTimer(entry);
      entry.queued = true;
      return;
    }

    this._clearTimer(entry);
    entry.timeout = window.setTimeout(() => {
      entry.timeout = undefined;
      if (!this._isActive()) {
        entry.queued = true;
        this._parked.add(key);
        return;
      }
      void this._execute(key, entry);
    }, delayMs);
  }

  public isRunning(key: K): boolean {
    return this._entry(key).inFlight;
  }

  /** Keys that were requested while the queue was inactive. */
  public takeParked(): K[] {
    const parked = Array.from(this._parked);
    this._parked.clear();
    return parked;
  }

  public pause(): void {
    this._entries.forEach((entry) => this._clearTimer(entry));
  }

  public dispose(): void {
    this._entries.forEach((entry) => {
      this._clearTimer(entry);
      entry.inFlight = false;
      entry.queued = false;
    });
    this._parked.clear();
  }

  private async _execute(key: K, entry: QueueEntry): Promise<void> {
    entry.inFlight = true;
    entry.queued = false;
    try {
      await this._run(key);
    } finally {
      entry.inFlight = false;
      if (entry.queued) {
        entry.queued = false;
        this.schedule(key);
      }
    }
  }

  private _entry(key: K): QueueEntry {
    let entry = this._entries.get(key);
    if (!entry) {
      entry = { inFlight: false, queued: false };
      this._entries.set(key, entry);
    }
    return entry;
  }

  private _clearTimer(entry: QueueEntry): void {
    if (entry.timeout) {
      window.clearTimeout(entry.timeout);
      entry.timeout = undefined;
    }
  }
}
