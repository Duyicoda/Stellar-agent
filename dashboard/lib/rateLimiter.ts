export type SlidingWindowResult = {
  allowed: boolean;
  limit: number;
  remaining: number;
  retryAfterSeconds: number;
};

export class SlidingWindowRateLimiter {
  private readonly buckets = new Map<string, number[]>();
  private readonly limit: number;
  private readonly windowMs: number;
  private readonly pruneIntervalMs: number;
  private pruneTimer: ReturnType<typeof setInterval> | null = null;
  private readonly now: () => number;

  constructor(options: {
    limit: number;
    windowMs: number;
    pruneIntervalMs?: number;
    now?: () => number;
  }) {
    this.limit = Math.max(1, Math.floor(options.limit));
    this.windowMs = Math.max(1, Math.floor(options.windowMs));
    this.pruneIntervalMs = Math.max(
      1,
      Math.floor(options.pruneIntervalMs ?? this.windowMs),
    );
    this.now = options.now ?? Date.now;
    this.startPruning();
  }

  /** Record a request for `key` and report whether it is allowed. */
  check(key: string): SlidingWindowResult {
    const now = this.now();
    const windowStart = now - this.windowMs;
    let timestamps = this.buckets.get(key);
    if (!timestamps) {
      timestamps = [];
      this.buckets.set(key, timestamps);
    }
    let expired = 0;
    while (expired < timestamps.length && timestamps[expired] <= windowStart) {
      expired += 1;
    }
    if (expired > 0) timestamps.splice(0, expired);

    if (timestamps.length >= this.limit) {
      const oldest = timestamps[0];
      const retryAfterMs = Math.max(0, oldest + this.windowMs - now);
      return {
        allowed: false,
        limit: this.limit,
        remaining: 0,
        retryAfterSeconds: Math.max(1, Math.ceil(retryAfterMs / 1000)),
      };
    }

    timestamps.push(now);
    return {
      allowed: true,
      limit: this.limit,
      remaining: Math.max(0, this.limit - timestamps.length),
      retryAfterSeconds: 0,
    };
  }

  /** Remove all keys whose timestamps have fully expired. */
  prune(): void {
    const windowStart = this.now() - this.windowMs;
    for (const [key, timestamps] of this.buckets) {
      let expired = 0;
      while (expired < timestamps.length && timestamps[expired] <= windowStart) {
        expired += 1;
      }
      if (expired > 0) timestamps.splice(0, expired);
      if (timestamps.length === 0) this.buckets.delete(key);
    }
  }

  /** Number of tracked keys (exposed for tests / metrics). */
  size(): number {
    return this.buckets.size;
  }

  /** Stop the background pruning timer. */
  stop(): void {
    if (this.pruneTimer) {
      clearInterval(this.pruneTimer);
      this.pruneTimer = null;
    }
  }

  private startPruning(): void {
    this.pruneTimer = setInterval(() => this.prune(), this.pruneIntervalMs);
    this.pruneTimer.unref?.();
  }
}
