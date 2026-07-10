import { Router } from "express";
import type { z } from "zod";
import {
  cacheReverseResult,
  cacheSearchResults,
  getCachedReverseResult,
  getCachedSearchResults,
} from "../lib/geocode-cache.js";
import { withGeocodeFallback } from "../lib/geocode-providers.js";
import { roundCoordinate } from "../lib/coordinates.js";
import { geocodeRateLimiter } from "../middleware/rate-limit.js";
import { validate } from "../middleware/validate.js";
import {
  geocodeReverseQuerySchema,
  geocodeSearchQuerySchema,
} from "../lib/validation-schemas.js";

const geocodeRouter = Router();

geocodeRouter.use(geocodeRateLimiter);

geocodeRouter.get(
  "/search",
  validate({ query: geocodeSearchQuerySchema }),
  async (request, response) => {
    const { q: query } = request.query as unknown as z.infer<
      typeof geocodeSearchQuerySchema
    >;

    try {
      const cachedResults = await getCachedSearchResults(query);
      if (cachedResults.length > 0) {
        response.json({ results: cachedResults });
        return;
      }
    } catch (err) {
      console.error("Error accessing Redis cache:", err);
      response.status(500).json({ error: "Internal server error" });
      return;
    }

    const results = await withGeocodeFallback((provider) =>
      provider.search(query),
    );

    if (!results || results.length === 0) {
      response.status(502).json({ error: "All geocoding services failed" });
      return;
    }

    try {
      await cacheSearchResults(query, results);
    } catch (err) {
      console.error("Redis native write error in search:", err);
    }

    response.json({ results });
  },
);

geocodeRouter.get(
  "/reverse",
  validate({ query: geocodeReverseQuerySchema }),
  async (request, response) => {
    const { lat, lon } = request.query as unknown as z.infer<
      typeof geocodeReverseQuerySchema
    >;

    const latitude = roundCoordinate(lat);
    const longitude = roundCoordinate(lon);

    try {
      const cachedResult = await getCachedReverseResult(latitude, longitude);
      if (cachedResult) {
        response.json(cachedResult);
        return;
      }
    } catch (err) {
      console.error("Error accessing Redis cache:", err);
      response.status(500).json({ error: "Internal server error" });
      return;
    }

    const result = await withGeocodeFallback((provider) =>
      provider.reverse(latitude, longitude),
    );

    if (!result) {
      response
        .status(502)
        .json({ error: "All reverse geocoding services failed" });
      return;
    }

    try {
      await cacheReverseResult(result);
    } catch (err) {
      console.error("Redis native write error:", err);
    }

    response.json(result);
  },
);

export default geocodeRouter;
