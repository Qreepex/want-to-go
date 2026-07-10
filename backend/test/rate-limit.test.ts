import request from "supertest";
import { describe, expect, it, vi } from "vitest";
import { getApp } from "./helpers.js";

vi.mock("../src/lib/geocode-providers.js", () => ({
  withGeocodeFallback: vi.fn(async (call: (provider: unknown) => unknown) =>
    call({
      name: "mock",
      search: async () => [
        {
          name: "Mock City",
          displayName: "Mock City, Mockland",
          latitude: 1,
          longitude: 1,
          countryCode: "MC",
        },
      ],
      reverse: async () => ({
        name: "Mock City",
        displayName: "Mock City, Mockland",
        latitude: 1,
        longitude: 1,
        countryCode: "MC",
      }),
    }),
  ),
}));

describe("geocode rate limiting", () => {
  it("allows requests under the limit and returns 429 once it's exceeded", async () => {
    const app = getApp();
    const statuses: number[] = [];

    for (let i = 0; i < 6; i += 1) {
      const res = await request(app)
        .get("/geo/search")
        .query({ q: `query-${i}` });
      statuses.push(res.status);
    }

    // Every response must be either a genuine success or a rate-limit
    // rejection - never a 500, which would indicate a bug in the request
    // pipeline (e.g. the validate middleware) rather than real rate limiting.
    for (const status of statuses) {
      expect([200, 429]).toContain(status);
    }
    expect(statuses).toContain(200);
    expect(statuses).toContain(429);
  });
});
