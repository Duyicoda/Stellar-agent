import assert from "node:assert/strict";
import test from "node:test";
import { SlidingWindowRateLimiter } from "./rateLimiter.js";

test("prunes expired IP buckets without changing active-client limits", () => {
  let now = 0;
  const limiter = new SlidingWindowRateLimiter({
    limit: 2,
    windowMs: 60_000,
    now: () => now,
  });

  test("allows ten challenge requests per IP per minute and rejects the eleventh", () => {
    const limiter = new SlidingWindowRateLimiter({ limit: 10, windowMs: 60_000 });
    try {
      for (let i = 0; i < 10; i += 1) {
        assert.equal(limiter.check("challenge-client").allowed, true);
      }
      assert.equal(limiter.check("challenge-client").allowed, false);
    } finally {
      limiter.stop();
    }
  });

  try {
    for (let i = 0; i < 10_000; i += 1) {
      assert.equal(limiter.check(`ip-${i}`).allowed, true);
    }
    limiter.check("active-client");
    assert.equal(limiter.check("active-client").allowed, true);
    assert.equal(limiter.check("active-client").allowed, false);
    assert.equal(limiter.size(), 10_001);

    now += 60_001;
    limiter.prune();

    assert.equal(limiter.size(), 0);
    assert.equal(limiter.check("active-client").allowed, true);
  } finally {
    limiter.stop();
  }
});
