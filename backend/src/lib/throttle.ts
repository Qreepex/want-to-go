import type { Result } from "ioredis";
import redis from "../cache/client.js";

declare module "ioredis" {
  interface RedisCommander<Context> {
    reserveThrottleSlot(
      key: string,
      minIntervalMs: number,
      nowMs: number,
    ): Result<number, Context>;
  }
}

// Reserves the next available slot for `key` at least `minIntervalMs` after
// the previously reserved slot, atomically. Returns the number of
// milliseconds the caller must wait before it may proceed. Concurrent callers
// (including across processes, since state lives in Redis) each get a
// distinct, ordered slot.
const RESERVE_SLOT_SCRIPT = `
local last = tonumber(redis.call("GET", KEYS[1]) or "0")
local minInterval = tonumber(ARGV[1])
local now = tonumber(ARGV[2])
local slot = math.max(last + minInterval, now)

redis.call("SET", KEYS[1], slot, "PX", minInterval * 10)

return math.max(slot - now, 0)
`;

redis.defineCommand("reserveThrottleSlot", { lua: RESERVE_SLOT_SCRIPT });

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Ensures calls sharing the same `key` are spaced at least `minIntervalMs`
 * apart, across all requests and processes. Resolves once it is this call's
 * turn to proceed.
 */
export async function throttle(
  key: string,
  minIntervalMs: number,
): Promise<void> {
  const waitMs = await redis.reserveThrottleSlot(
    `throttle:${key}`,
    minIntervalMs,
    Date.now(),
  );

  if (waitMs > 0) {
    await sleep(waitMs);
  }
}
