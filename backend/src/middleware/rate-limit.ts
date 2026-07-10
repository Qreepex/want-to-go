import type { Request, RequestHandler } from "express";
import { verifyAuthToken } from "../lib/auth.js";
import { checkRateLimit, type RateLimitRule } from "../lib/rate-limit.js";

function getOptionalUserId(request: Request): string | null {
  const authorizationHeader = request.headers.authorization;

  if (!authorizationHeader?.startsWith("Bearer ")) {
    return null;
  }

  const token = authorizationHeader.slice("Bearer ".length).trim();

  if (!token) {
    return null;
  }

  try {
    return verifyAuthToken(token).userId;
  } catch {
    return null;
  }
}

interface RateLimiterConfig {
  name: string;
  userRules: RateLimitRule[];
  ipRules: RateLimitRule[];
}

function createRateLimiter({
  name,
  userRules,
  ipRules,
}: RateLimiterConfig): RequestHandler {
  return async (request, response, next) => {
    try {
      const ipResult = await checkRateLimit(
        `${name}:ip:${request.ip}`,
        ipRules,
      );

      if (!ipResult.allowed) {
        response.set(
          "Retry-After",
          String(Math.ceil(ipResult.retryAfterMs / 1000)),
        );
        response.status(429).json({ error: "Too many requests" });
        return;
      }

      const userId = getOptionalUserId(request);

      if (userId) {
        const userResult = await checkRateLimit(
          `${name}:user:${userId}`,
          userRules,
        );

        if (!userResult.allowed) {
          response.set(
            "Retry-After",
            String(Math.ceil(userResult.retryAfterMs / 1000)),
          );
          response.status(429).json({ error: "Too many requests" });
          return;
        }
      }

      next();
    } catch (err) {
      console.error("Rate limit check failed, allowing request:", err);
      next();
    }
  };
}

export const generalRateLimiter = createRateLimiter({
  name: "general",
  userRules: [
    { windowSeconds: 1, maxRequests: 5, banSeconds: 10 },
    { windowSeconds: 15, maxRequests: 20, banSeconds: 30 },
  ],
  ipRules: [
    { windowSeconds: 1, maxRequests: 10, banSeconds: 10 },
    { windowSeconds: 15, maxRequests: 50, banSeconds: 300 },
  ],
});

export const geocodeRateLimiter = createRateLimiter({
  name: "geocode",
  userRules: [
    { windowSeconds: 1, maxRequests: 1, banSeconds: 10 },
    { windowSeconds: 15, maxRequests: 5, banSeconds: 30 },
    { windowSeconds: 60, maxRequests: 10, banSeconds: 300 },
  ],
  ipRules: [
    { windowSeconds: 1, maxRequests: 2, banSeconds: 10 },
    { windowSeconds: 15, maxRequests: 10, banSeconds: 300 },
  ],
});
