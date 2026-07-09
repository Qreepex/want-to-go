import { Router } from "express";
import {
  cacheReverseResult,
  cacheSearchResults,
  getCachedReverseResult,
  getCachedSearchResults,
} from "../lib/geocode-cache.js";
import { withGeocodeFallback } from "../lib/geocode-providers.js";
import { roundCoordinate } from "../lib/coordinates.js";
import { geocodeRateLimiter } from "../middleware/rate-limit.js";

const geocodeRouter = Router();

geocodeRouter.use(geocodeRateLimiter);

geocodeRouter.get("/search", async (request, response) => {
  const query =
    typeof request.query.q === "string" ? request.query.q.trim() : "";

  if (!query) {
    response.status(400).json({ error: "Query is required" });
    return;
  }

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
});

geocodeRouter.get("/reverse", async (request, response) => {
  const rawLatitude =
    typeof request.query.lat === "string" ? Number(request.query.lat) : NaN;
  const rawLongitude =
    typeof request.query.lon === "string" ? Number(request.query.lon) : NaN;

  if (Number.isNaN(rawLatitude) || Number.isNaN(rawLongitude)) {
    response.status(400).json({ error: "Latitude and longitude are required" });
    return;
  }

  const latitude = roundCoordinate(rawLatitude);
  const longitude = roundCoordinate(rawLongitude);

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
    response.status(502).json({ error: "All reverse geocoding services failed" });
    return;
  }

  try {
    await cacheReverseResult(result);
  } catch (err) {
    console.error("Redis native write error:", err);
  }

  response.json(result);
});

export default geocodeRouter;
