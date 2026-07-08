import { Redis } from "ioredis";
import "../env.js";

const redisUrl = process.env.REDIS_URL;

if (!redisUrl) {
  throw new Error("REDIS_URL environment variable is not set");
}

const redis = new Redis(redisUrl);

export default redis;

export async function assertRedisReady(): Promise<void> {
  const result = await redis.ping();
  if (result !== "PONG") {
    throw new Error("Redis is not ready");
  }
}
